import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { copyFile, readdir, readFile, rm, stat, writeFile } from 'fs/promises'
import JSZip from 'jszip'
import { isAbsolute, join, relative, resolve } from 'path'
import type { CourseMetadataInput } from '../parser/lessonWriter'

export type RunnerLog = (line: string) => void

// ───────── npm availability ─────────

export async function checkNpmAvailable(): Promise<string | null> {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const child = spawn(cmd, ['--version'], { shell: true })
    let out = ''
    child.stdout.on('data', (d) => (out += d.toString()))
    child.on('error', () => resolve(null))
    child.on('close', (code) => {
      if (code === 0 && out.trim()) resolve(out.trim())
      else resolve(null)
    })
  })
}

// ───────── Command execution with streamed output ─────────

function runCommand(cmd: string, args: string[], cwd: string, onLog: RunnerLog): Promise<number> {
  return new Promise((resolve, reject) => {
    const finalCmd = process.platform === 'win32' ? `${cmd}.cmd` : cmd
    const child = spawn(finalCmd, args, {
      cwd,
      shell: true,
      env: { ...process.env }
    })

    let buffer = ''
    const flush = (chunk: string): void => {
      buffer += chunk
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.trim()) onLog(line)
      }
    }

    child.stdout.on('data', (d) => flush(d.toString()))
    child.stderr.on('data', (d) => flush(d.toString()))
    child.on('error', (err) => reject(err))
    child.on('close', (code) => {
      if (buffer.trim()) onLog(buffer)
      resolve(code ?? 0)
    })
  })
}

// ───────── Reusable build steps ─────────

async function ensureNodeModules(templateRoot: string, onLog: RunnerLog): Promise<void> {
  const nm = join(templateRoot, 'node_modules')
  if (existsSync(nm)) {
    onLog('✓ node_modules já existe — pulando npm install')
    return
  }
  onLog('▶ Instalando dependências do template (primeira execução, demora um pouco)...')
  const code = await runCommand('npm', ['install'], templateRoot, onLog)
  if (code !== 0) throw new Error(`npm install falhou (exit code ${code})`)
  onLog('✓ Dependências instaladas')
}

async function runBuild(
  templateRoot: string,
  scriptName: 'build' | 'build:scorm',
  onLog: RunnerLog
): Promise<void> {
  onLog(`▶ Executando "npm run ${scriptName}"...`)
  const code = await runCommand('npm', ['run', scriptName], templateRoot, onLog)
  if (code !== 0) throw new Error(`npm run ${scriptName} falhou (exit code ${code})`)
  onLog(`✓ "${scriptName}" concluído`)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function injectSeoMetaTags(
  targetPath: string,
  metadata: CourseMetadataInput,
  onLog: RunnerLog
): Promise<void> {
  if (!existsSync(targetPath)) return

  let html = await readFile(targetPath, 'utf-8')

  const title = metadata.courseName?.trim() || 'DiscereNow Course'
  const description = metadata.shortDescription?.trim()
  const keywords = (metadata.keywords || []).filter(Boolean).join(', ')
  const image = metadata.courseImage?.trim()

  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`
  ]

  if (description) {
    tags.push(`<meta name="description" content="${escapeHtml(description)}">`)
    tags.push(`<meta property="og:description" content="${escapeHtml(description)}">`)
    tags.push(`<meta name="twitter:description" content="${escapeHtml(description)}">`)
  }

  if (keywords) {
    tags.push(`<meta name="keywords" content="${escapeHtml(keywords)}">`)
  }

  if (image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(image)}">`)
    tags.push(`<meta name="twitter:image" content="${escapeHtml(image)}">`)
  }

  tags.push(`<meta property="og:type" content="website">`)
  tags.push(`<meta name="twitter:card" content="summary_large_image">`)

  html = html.replace(/<title>.*?<\/title>/i, '')
  html = html.replace(/<\/head>/i, `  ${tags.join('\n  ')}\n</head>`)

  await writeFile(targetPath, html, 'utf-8')
  onLog('✓ SEO metadata injected into index.html')
}

// ───────── Generated SCORM package lookup ─────────

async function findGeneratedScormZip(templateRoot: string): Promise<string | null> {
  const scormDir = join(templateRoot, 'SCORM')
  if (!existsSync(scormDir)) return null
  const entries = await readdir(scormDir, { withFileTypes: true })
  const zips = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.zip'))
    .map((e) => join(scormDir, e.name))
  if (zips.length === 0) return null
  if (zips.length === 1) return zips[0]
  const stats = await Promise.all(zips.map(async (p) => ({ p, m: (await stat(p)).mtimeMs })))
  stats.sort((a, b) => b.m - a.m)
  return stats[0].p
}

// ───────── Web build archive ─────────

async function zipDirectory(srcDir: string, destZipPath: string, onLog: RunnerLog): Promise<void> {
  onLog('▶ Zipando arquivos da versão web...')
  const zip = new JSZip()

  const addRecursive = async (currentDir: string): Promise<void> => {
    const entries = await readdir(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await addRecursive(full)
      } else if (entry.isFile()) {
        const rel = relative(srcDir, full).replace(/\\/g, '/')
        const data = await readFile(full)
        zip.file(rel, data)
      }
    }
  }

  await addRecursive(srcDir)
  const buf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })
  await writeFile(destZipPath, buf)
  onLog(`✓ Versão web zipada em: ${destZipPath}`)
}

// ───────── Post-export cleanup ─────────

function isSameOrWithin(parentPath: string, candidatePath: string): boolean {
  const rel = relative(resolve(parentPath), resolve(candidatePath))
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

async function cleanupGeneratedArtifacts(
  templateRoot: string,
  courseId: string,
  protectedPath: string,
  onLog: RunnerLog
): Promise<void> {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(courseId)) {
    throw new Error(`Invalid course ID for cleanup: ${courseId}`)
  }

  const root = resolve(templateRoot)
  const chaptersDir = join(root, 'src', 'content', 'chapters')
  const publicImgDir = join(root, 'public', 'img')
  const targets = [
    join(root, 'dist'),
    join(root, 'SCORM'),
    join(root, 'temp_scorm_build'),
    join(root, 'src', 'content', 'courseData.js'),
    join(publicImgDir, courseId)
  ]

  if (existsSync(chaptersDir)) {
    const chapterEntries = await readdir(chaptersDir, { withFileTypes: true })
    for (const entry of chapterEntries) {
      if (entry.isDirectory() && entry.name.startsWith('cap_')) {
        targets.push(join(chaptersDir, entry.name))
      }
    }
  }

  for (const target of targets) {
    if (!isSameOrWithin(root, target) || resolve(target) === root) {
      throw new Error(`Refusing to clean path outside the template: ${target}`)
    }

    if (isSameOrWithin(target, protectedPath)) {
      onLog(`⚠ Skipping cleanup for output location: ${target}`)
      continue
    }

    await rm(target, { recursive: true, force: true })
  }

  if (existsSync(publicImgDir) && (await readdir(publicImgDir)).length === 0) {
    await rm(publicImgDir, { recursive: true, force: true })
  }

  onLog('✓ Temporary course files removed')
}

async function tryCleanupGeneratedArtifacts(
  templateRoot: string,
  courseId: string,
  protectedPath: string,
  onLog: RunnerLog
): Promise<void> {
  try {
    await cleanupGeneratedArtifacts(templateRoot, courseId, protectedPath, onLog)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    onLog(`⚠ Export succeeded, but temporary files could not be fully removed: ${message}`)
  }
}

// ───────── Public APIs ─────────

export type RunResult = {
  ok: boolean
  finalZipPath?: string
  error?: string
}

export async function buildAndExportScorm(
  templateRoot: string,
  destZipPath: string,
  metadata: CourseMetadataInput,
  onLog: RunnerLog
): Promise<RunResult> {
  try {
    await ensureNodeModules(templateRoot, onLog)
    await runBuild(templateRoot, 'build:scorm', onLog)

    const generatedZip = await findGeneratedScormZip(templateRoot)
    if (!generatedZip) {
      throw new Error('Pacote SCORM gerado não foi encontrado em template/SCORM/')
    }

    onLog('▶ Copiando pacote para o destino escolhido...')
    await copyFile(generatedZip, destZipPath)
    onLog(`✓ SCORM salvo em: ${destZipPath}`)

    await tryCleanupGeneratedArtifacts(templateRoot, metadata.courseId, destZipPath, onLog)

    return { ok: true, finalZipPath: destZipPath }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

export async function buildAndExportWeb(
  templateRoot: string,
  destZipPath: string,
  metadata: CourseMetadataInput,
  onLog: RunnerLog
): Promise<RunResult> {
  try {
    await ensureNodeModules(templateRoot, onLog)
    await runBuild(templateRoot, 'build', onLog)

    const distDir = join(templateRoot, 'dist')
    if (!existsSync(distDir)) {
      throw new Error('Pasta template/dist/ não foi gerada pelo build')
    }

    await injectSeoMetaTags(join(distDir, 'index.html'), metadata, onLog)
    await zipDirectory(distDir, destZipPath, onLog)
    await tryCleanupGeneratedArtifacts(templateRoot, metadata.courseId, destZipPath, onLog)
    return { ok: true, finalZipPath: destZipPath }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
