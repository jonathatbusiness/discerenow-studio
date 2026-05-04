import { zip } from 'zip-a-folder'
import fs from 'fs-extra'
import path from 'path'
import courseData from '../src/content/courseData.js'

const distPath = path.resolve('dist')
const scormFolderPath = path.resolve('SCORM')
const tempBuildPath = path.resolve('temp_scorm_build')

const isScorm12 = courseData.scormVersion === '1.2'
const sanitizedCourseName = courseData.courseName
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9\s]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .toLowerCase()

const zipPath = path.join(scormFolderPath, `${sanitizedCourseName}.zip`)
const launcherFolder = path.join(tempBuildPath, 'launcher')
const contentFolder = path.join(tempBuildPath, 'scormcontent')

async function getContentFileEntries(dirPath, prefix = '') {
  const entries = []
  const files = await fs.readdir(dirPath)

  for (const file of files) {
    const fullPath = path.join(dirPath, file)
    const stat = await fs.stat(fullPath)
    if (stat.isDirectory()) {
      const nested = await getContentFileEntries(fullPath, path.join(prefix, file))
      entries.push(...nested)
    } else {
      entries.push(`<file href="scormcontent/${path.join(prefix, file).replace(/\\/g, '/')}"/>`)
    }
  }

  return entries
}

async function createManifest() {
  const contentFiles = await getContentFileEntries(distPath)

  const imsmanifestContent = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${sanitizedCourseName}" version="${isScorm12 ? '1.2' : '1.0'}"
  xmlns="${
    isScorm12
      ? 'http://www.imsproject.org/xsd/imscp_rootv1p1p2'
      : 'http://www.imsglobal.org/xsd/imscp_v1p1'
  }"
  xmlns:adlcp="${
    isScorm12 ? 'http://www.adlnet.org/xsd/adlcp_rootv1p2' : 'http://www.adlnet.org/xsd/adlcp_v1p3'
  }"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="${
    isScorm12
      ? 'http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd'
      : 'http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd'
  }">

  <organizations default="org_1">
    <organization identifier="org_1">
      <title>${courseData.courseName}</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>${courseData.courseName}</title>
      </item>
    </organization>
  </organizations>

  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="launcher/indexAPI.html">
      <file href="launcher/indexAPI.html"/>
      <file href="launcher/discere-scorm-loader.js"/>
      <file href="launcher/DiscereScormController.js"/>
      <file href="launcher/AICCComm.html"/>
      <file href="launcher/blank.html"/>
      <file href="launcher/goodbye.html"/>
      ${contentFiles.join('\n      ')}
    </resource>
  </resources>
</manifest>`

  await fs.writeFile(path.join(tempBuildPath, 'imsmanifest.xml'), imsmanifestContent)
}

async function cleanTemp() {
  if (await fs.pathExists(tempBuildPath)) {
    await fs.remove(tempBuildPath)
  }
  await fs.mkdirp(launcherFolder)
  await fs.mkdirp(contentFolder)
}

async function copyLauncherFiles() {
  const sourceLauncher = path.resolve('src/launcher')
  await fs.copy(sourceLauncher, launcherFolder)
}

async function copyContentFiles() {
  await fs.copy(distPath, contentFolder)
}

async function injectSeoMetaTags(targetPath) {
  if (!(await fs.pathExists(targetPath))) return

  let html = await fs.readFile(targetPath, 'utf-8')

  const title = courseData.courseName?.trim() || 'DiscereNow Course'
  const description = courseData.shortDescription?.trim()
  const keywords = (courseData.keywords || []).filter(Boolean).join(', ')
  const image = courseData.courseImage?.trim()

  const tags = []

  tags.push(`<title>${escapeHtml(title)}</title>`)
  tags.push(`<meta property="og:title" content="${escapeHtml(title)}">`)
  tags.push(`<meta name="twitter:title" content="${escapeHtml(title)}">`)

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

  // Remove <title> antigo, se houver
  html = html.replace(/<title>.*?<\/title>/i, '')

  // Injeta antes do </head>
  html = html.replace(/<\/head>/i, `  ${tags.join('\n  ')}\n</head>`)

  await fs.writeFile(targetPath, html, 'utf-8')
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function buildPackage() {
  await cleanTemp()
  await copyLauncherFiles()
  await copyContentFiles()
  await injectSeoMetaTags(path.join(distPath, 'index.html'))
  await injectSeoMetaTags(path.join(contentFolder, 'index.html'))
  await createManifest()
  await fs.ensureDir(scormFolderPath)
  await zip(tempBuildPath, zipPath)
  console.log(`🎯 Arquivo SCORM gerado: ${zipPath}`)
}

;(async () => {
  try {
    await buildPackage()
  } catch (err) {
    console.error('❌ Erro ao gerar pacote SCORM:', err)
  }
})()
