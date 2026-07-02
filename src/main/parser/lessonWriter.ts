/**
 * Writes the course tree, metadata, and .docx assets into template/:
 *  - template/src/content/courseData.js (overwritten)
 *  - template/src/content/chapters/cap_X/lesson_Y_Z.jsx (one per lesson)
 *  - template/public/img/<courseId>/cover.<ext> (when provided)
 *  - template/public/img/<courseId>/img-N.<ext> (images used by supported blocks)
 *
 * Existing cap_X directories and the course image directory are cleared first.
 */

import { existsSync } from 'fs'
import { copyFile, mkdir, readdir, rm, writeFile } from 'fs/promises'
import { extname, join } from 'path'
import type {
  AccordionItem,
  CardItem,
  FlipCardItem,
  ImageCenteredBlock,
  ImgTextBlock,
  Lesson,
  ParseResult,
  ProcessStep
} from './docxParser'

export type CourseMetadataInput = {
  courseId: string
  courseName: string
  shortDescription: string
  courseIntroduction: string[]
  keywords: string[]
  courseImage: string | null
  courseTheme: string
  scormVersion: '1.2' | '2004'
  successMode: 'onComplete' | 'onScore' | 'none'
}

// ───────── Strip internal fields before serialization ─────────

function stripInternal(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripInternal)
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(obj)) {
      if (!k.startsWith('_')) out[k] = stripInternal(obj[k])
    }
    return out
  }
  return value
}

// ───────── Pretty serialization ─────────

function escapeString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\t/g, '\\t')
}

function serialize(value: unknown, indent: number = 2, level: number = 0): string {
  const pad = ' '.repeat(indent * level)
  const padInner = ' '.repeat(indent * (level + 1))

  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return `"${escapeString(value)}"`
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const parts = value.map((v) => padInner + serialize(v, indent, level + 1))
    return `[\n${parts.join(',\n')}\n${pad}]`
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj)
    if (keys.length === 0) return '{}'
    const parts = keys.map((k) => `${padInner}${k}: ${serialize(obj[k], indent, level + 1)}`)
    return `{\n${parts.join(',\n')}\n${pad}}`
  }

  return 'null'
}

// ───────── courseData.js generation ─────────

function renderCourseData(meta: CourseMetadataInput, courseImageWebPath: string): string {
  const obj = {
    courseId: meta.courseId,
    courseName: meta.courseName,
    courseIntroduction: meta.courseIntroduction,
    shortDescription: meta.shortDescription,
    keywords: meta.keywords,
    courseImage: courseImageWebPath,
    courseTheme: meta.courseTheme || 'default',
    scormVersion: meta.scormVersion,
    successMode: meta.successMode
  }
  return `const courseData = ${serialize(obj)};\n\nexport default courseData;\n`
}

// ───────── lesson_X_Y.jsx generation ─────────

function renderLesson(lesson: Lesson): string {
  const obj = stripInternal({
    chapterId: lesson.chapterId,
    lessonId: lesson.lessonId,
    chapterName: lesson.chapterName,
    name: lesson.name,
    blocks: lesson.blocks
  })
  return `export default ${serialize(obj)};\n`
}

// Applies { lessonKey: { blockIndex: theme } } selections to the course tree.
// lessonKey = `${chapterId}_${lessonId}`. Blocks without a selection keep their theme.
export function applyThemesToTree(
  tree: {
    chapters: Array<{
      id: string
      lessons: Array<{ lessonId: string; blocks: Array<Record<string, unknown>> }>
    }>
  },
  themesByBlock: Record<string, Record<number, string>>
): void {
  for (const chapter of tree.chapters) {
    for (const lesson of chapter.lessons) {
      const key = `${chapter.id}_${lesson.lessonId}`
      const lessonThemes = themesByBlock[key]

      lesson.blocks.forEach((block, i) => {
        if (lessonThemes && lessonThemes[i] !== undefined) {
          block.theme = lessonThemes[i]
        }
      })
    }
  }
}
// ───────── Cleanup ─────────

async function cleanChaptersDir(chaptersDir: string): Promise<void> {
  if (!existsSync(chaptersDir)) {
    await mkdir(chaptersDir, { recursive: true })
    return
  }
  const entries = await readdir(chaptersDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('cap_')) {
      await rm(join(chaptersDir, entry.name), { recursive: true, force: true })
    }
  }
}

async function cleanCourseImgDir(courseImgDir: string): Promise<void> {
  await rm(courseImgDir, { recursive: true, force: true })
  await mkdir(courseImgDir, { recursive: true })
}

// ───────── Embedded block image resolution ─────────

async function resolveBlockImages(
  parseResult: ParseResult,
  courseId: string,
  courseImgDir: string
): Promise<number> {
  const { tree, zip, relsMap } = parseResult
  let counter = 0

  const copyEmbeddedImage = async (rId?: string): Promise<string> => {
    if (!rId || !relsMap[rId]) return ''

    const target = relsMap[rId]
    const fullPath = target.startsWith('/') ? target.substring(1) : `word/${target}`
    const file = zip.file(fullPath)

    if (!file) return ''

    counter++
    const ext = (extname(target) || '.png').toLowerCase()
    const filename = `img-${counter}${ext}`
    const dest = join(courseImgDir, filename)
    const buf = await file.async('nodebuffer')

    await writeFile(dest, buf)

    return `/img/${courseId}/${filename}`
  }

  for (const chapter of tree.chapters) {
    for (const lesson of chapter.lessons) {
      for (const block of lesson.blocks) {
        if (block.blockType === 'imgText') {
          const imgBlock = block as ImgTextBlock
          imgBlock.image = await copyEmbeddedImage(imgBlock._embedRId)
          continue
        }

        if (block.blockType === 'imageCentered') {
          const imageBlock = block as ImageCenteredBlock
          imageBlock.image = await copyEmbeddedImage(imageBlock._embedRId)
          continue
        }

        if (block.blockType === 'process') {
          for (const item of block.items as ProcessStep[]) {
            item.image = await copyEmbeddedImage(item._embedRId)
          }
          continue
        }

        if (block.blockType === 'accordion' || block.blockType === 'tabs') {
          for (const item of block.items as AccordionItem[]) {
            item.img = await copyEmbeddedImage(item._embedRId)
          }
          continue
        }

        if (block.blockType === 'cards') {
          for (const item of block.items as CardItem[]) {
            item.img = await copyEmbeddedImage(item._embedRId)
          }
          continue
        }

        if (block.blockType === 'flipcard') {
          for (const item of block.items as FlipCardItem[]) {
            item.img = await copyEmbeddedImage(item._embedRId)
            item.backImg = await copyEmbeddedImage(item._backEmbedRId)
          }
        }
      }
    }
  }

  return counter
}

// ───────── Cover image copy ─────────

async function copyCourseCover(
  sourcePath: string | null,
  courseImgDir: string,
  courseId: string
): Promise<string> {
  if (!sourcePath) return ''
  const ext = (extname(sourcePath) || '.png').toLowerCase()
  const dest = join(courseImgDir, `cover${ext}`)
  await copyFile(sourcePath, dest)
  return `/img/${courseId}/cover${ext}`
}

// ───────── Public API ─────────

export type WriteResult = {
  courseDataPath: string
  lessonPaths: string[]
  imagesCopied: number
  coverWebPath: string
}

export async function writeCourseToTemplate(
  templateRoot: string,
  meta: CourseMetadataInput,
  parseResult: ParseResult
): Promise<WriteResult> {
  const contentDir = join(templateRoot, 'src', 'content')
  const chaptersDir = join(contentDir, 'chapters')
  const courseImgDir = join(templateRoot, 'public', 'img', meta.courseId)

  await mkdir(contentDir, { recursive: true })
  await cleanChaptersDir(chaptersDir)
  await cleanCourseImgDir(courseImgDir)

  const coverWebPath = await copyCourseCover(meta.courseImage, courseImgDir, meta.courseId)

  const imagesCopied = await resolveBlockImages(parseResult, meta.courseId, courseImgDir)

  const courseDataPath = join(contentDir, 'courseData.js')
  await writeFile(courseDataPath, renderCourseData(meta, coverWebPath), 'utf-8')

  const lessonPaths: string[] = []
  for (const chapter of parseResult.tree.chapters) {
    const capDir = join(chaptersDir, `cap_${chapter.id}`)
    await mkdir(capDir, { recursive: true })
    for (const lesson of chapter.lessons) {
      const lessonPath = join(capDir, `lesson_${chapter.id}_${lesson.lessonId}.jsx`)
      await writeFile(lessonPath, renderLesson(lesson), 'utf-8')
      lessonPaths.push(lessonPath)
    }
  }

  return { courseDataPath, lessonPaths, imagesCopied, coverWebPath }
}
