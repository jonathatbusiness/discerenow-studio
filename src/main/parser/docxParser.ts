/**
 * Reads a .docx file, identifies DN styles and content controls, and returns
 * a { chapters: [...] } tree ready to be converted into .jsx files.
 */

import { readFile } from 'fs/promises'
import JSZip from 'jszip'

// ───────── Public block types ─────────

export type ParagraphBlock = {
  blockType: 'paragraph'
  theme: string
  textAlign: string
  fontSize: string
  content: string[]
}

export type TextHeadingBlock = {
  blockType: 'heading' | 'subheading'
  theme: string
  textAlign: string
  fontSize: string
  text: string
}

export type ParagraphWithLeadBlock = {
  blockType: 'paragraphHeading' | 'paragraphSubheading'
  theme: string
  textAlign: string
  fontSize: string
  leadFontSize: string
  lead: string
  content: string[]
}

export type ColumnsBlock = {
  blockType: 'columns'
  theme: string
  textAlign: string
  fontSize: string
  columns: Array<{ content: string[]; fontSize: string }>
}

export type TableBlock = {
  blockType: 'table'
  theme: string
  textAlign: string
  fontSize: string
  rows: string[][]
}

export type ListItem = {
  text: string
  fontSize: string
}

export type ListBlock = {
  blockType: 'numberedList' | 'checkboxList' | 'bulletList'
  theme: string
  textAlign: string
  items: ListItem[]
}

export type ImgTextBlock = {
  blockType: 'imgText'
  theme: string
  image: string
  imageSide: string
  zoom: string
  altText: string
  imgSubtitle: string
  textAlign: string
  fontSize: string
  content: string[]
  _embedRId?: string
}

export type ImageCenteredBlock = {
  blockType: 'imageCentered'
  theme: string
  image: string
  altText: string
  caption: string
  _embedRId?: string
}

export type ProcessStep = {
  step: string
  title: string
  text: string
  fontSize: string
  image: string
  altText: string
  _embedRId?: string
}

export type ProcessBlock = {
  blockType: 'process'
  theme: string
  textAlign: string
  items: ProcessStep[]
}

export type InteractiveTextEntry = string | { type: 'bullet'; text: string }

export type AccordionItem = {
  title: string
  content: InteractiveTextEntry[]
  img: string
  altText: string
  subtitle: string
  zoom: string
  _embedRId?: string
}

export type AccordionBlock = {
  blockType: 'accordion'
  theme: string
  textAlign: string
  fontSize: string
  items: AccordionItem[]
}

export type TabsBlock = {
  blockType: 'tabs'
  theme: string
  textAlign: string
  fontSize: string
  items: AccordionItem[]
}

export type CalloutBlock = {
  blockType: 'callout'
  theme: string
  textAlign: string
  fontSize: string
  icon: 'info' | 'alert' | 'tip' | 'none'
  title: string
  content: string
}

export type VideoBlock = {
  blockType: 'video'
  theme: string
  textAlign: string
  fontSize: string
  link: string
  videoSubtitle: string
}

export type CardItem = {
  title: string
  content: string
  img: string
  altText: string
  subtitle: string
  zoom: string
  _embedRId?: string
}

export type CardsBlock = {
  blockType: 'cards'
  theme: string
  textAlign: string
  fontSize: string
  items: CardItem[]
}

export type FlipCardItem = {
  title: string
  content: string
  img: string
  altText: string
  backTitle: string
  backContent: string
  backImg: string
  backAltText: string
  _embedRId?: string
  _backEmbedRId?: string
}

export type FlipCardBlock = {
  blockType: 'flipcard'
  theme: string
  textAlign: string
  fontSize: string
  items: FlipCardItem[]
}

export type QuizBlock = {
  blockType: 'quiz'
  theme: string
  textAlign: string
  fontSize: string
  questionFontSize?: string
  optionFontSize?: string
  feedbackFontSize?: string
  question: string
  type: 'single' | 'multiple'
  options: string[]
  correctAnswers: string[]
  feedbackCorrect: string
  feedbackIncorrect: string
}

export type ContinueButtonBlock = {
  blockType: 'continueButton'
  buttonText: string
  isEndOfLesson: boolean
}

export type Block =
  | ParagraphBlock
  | TextHeadingBlock
  | ParagraphWithLeadBlock
  | ColumnsBlock
  | TableBlock
  | ListBlock
  | ImageCenteredBlock
  | ProcessBlock
  | ImgTextBlock
  | AccordionBlock
  | TabsBlock
  | CalloutBlock
  | VideoBlock
  | CardsBlock
  | FlipCardBlock
  | QuizBlock
  | ContinueButtonBlock

export type Lesson = {
  chapterId: string
  lessonId: string
  chapterName: string
  name: string
  blocks: Block[]
}

export type Chapter = {
  id: string
  chapterName: string
  lessons: Lesson[]
}

export type CourseTree = {
  chapters: Chapter[]
}

export type ParseResult = {
  tree: CourseTree
  zip: JSZip
  relsMap: Record<string, string>
}

// ───────── Internal types ─────────

type ParaInfo = {
  styleId: string | null
  text: string
  richText: string
  fontSize?: string
  isListItem: boolean
  sdtTags: string[]
  inTable: boolean
  tableCell?: { row: number; col: number }
  imgPlaceholder?: boolean
  imageEmbeds: string[]
}

// ───────── Tolerant XML parser ─────────

function localName(tag: string): string {
  const i = tag.indexOf(':')
  return i >= 0 ? tag.substring(i + 1) : tag
}

type XmlNode = {
  name: string
  attrs: Record<string, string>
  children: XmlNode[]
  text?: string
}

function parseXml(xml: string): XmlNode {
  let pos = 0
  const root: XmlNode = { name: '#root', attrs: {}, children: [] }
  const stack: XmlNode[] = [root]

  if (xml.startsWith('<?xml')) {
    const end = xml.indexOf('?>')
    if (end >= 0) pos = end + 2
  }

  const len = xml.length

  while (pos < len) {
    if (xml[pos] === '<') {
      if (xml.startsWith('<!--', pos)) {
        const end = xml.indexOf('-->', pos)
        pos = end >= 0 ? end + 3 : len
        continue
      }
      if (xml[pos + 1] === '?') {
        const end = xml.indexOf('?>', pos)
        pos = end >= 0 ? end + 2 : len
        continue
      }
      if (xml[pos + 1] === '/') {
        const end = xml.indexOf('>', pos)
        if (end < 0) break
        stack.pop()
        pos = end + 1
        continue
      }

      const end = xml.indexOf('>', pos)
      if (end < 0) break
      const inside = xml.substring(pos + 1, end)
      const selfClosing = inside.endsWith('/')
      const cleaned = selfClosing ? inside.slice(0, -1).trim() : inside.trim()

      const spaceIdx = cleaned.search(/\s/)
      const name = spaceIdx < 0 ? cleaned : cleaned.substring(0, spaceIdx)
      const attrsRaw = spaceIdx < 0 ? '' : cleaned.substring(spaceIdx + 1)
      const attrs: Record<string, string> = {}
      const attrRegex = /([a-zA-Z0-9:_-]+)="([^"]*)"/g
      let am: RegExpExecArray | null
      while ((am = attrRegex.exec(attrsRaw)) !== null) {
        attrs[am[1]] = am[2]
      }

      const node: XmlNode = { name, attrs, children: [] }
      stack[stack.length - 1].children.push(node)
      if (!selfClosing) stack.push(node)
      pos = end + 1
    } else {
      const next = xml.indexOf('<', pos)
      const textEnd = next < 0 ? len : next
      const raw = xml.substring(pos, textEnd)
      if (raw.length > 0) {
        const decoded = raw
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&amp;/g, '&')
        const cur = stack[stack.length - 1]
        const last = cur.children[cur.children.length - 1]
        if (last && last.name === '#text') {
          last.text = (last.text || '') + decoded
        } else {
          cur.children.push({ name: '#text', attrs: {}, children: [], text: decoded })
        }
      }
      pos = textEnd
    }
  }

  return root
}

function findFirst(node: XmlNode, localTag: string): XmlNode | null {
  for (const c of node.children) {
    if (c.name !== '#text' && localName(c.name) === localTag) return c
  }
  return null
}

function findAll(node: XmlNode, localTag: string): XmlNode[] {
  const out: XmlNode[] = []
  for (const c of node.children) {
    if (c.name !== '#text' && localName(c.name) === localTag) out.push(c)
  }
  return out
}

// ───────── Paragraph collection ─────────

function paragraphText(p: XmlNode): string {
  const parts: string[] = []
  const walk = (n: XmlNode): void => {
    for (const c of n.children) {
      if (c.name === '#text') continue
      const ln = localName(c.name)
      if (ln === 't') {
        if (c.children[0]?.text) parts.push(c.children[0].text)
      } else if (ln === 'br') parts.push('\n')
      else if (ln === 'tab') parts.push('\t')
      else walk(c)
    }
  }
  walk(p)
  return parts.join('').trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function wordPropertyEnabled(node: XmlNode | null): boolean {
  if (!node) return false
  const value = node.attrs['w:val'] || node.attrs.val
  return value !== '0' && value !== 'false' && value !== 'off' && value !== 'none'
}

function paragraphRichText(p: XmlNode): string {
  const parts: string[] = []

  const runContent = (run: XmlNode): string => {
    const content: string[] = []
    const walk = (node: XmlNode): void => {
      for (const child of node.children) {
        if (child.name === '#text') continue
        const name = localName(child.name)
        if (name === 't') {
          if (child.children[0]?.text) content.push(escapeHtml(child.children[0].text))
        } else if (name === 'br') content.push('<br>')
        else if (name === 'tab') content.push('&emsp;')
        else if (name !== 'rPr') walk(child)
      }
    }
    walk(run)
    return content.join('')
  }

  const walk = (node: XmlNode): void => {
    for (const child of node.children) {
      if (child.name === '#text') continue
      if (localName(child.name) === 'r') {
        const rPr = findFirst(child, 'rPr')
        let content = runContent(child)
        if (!content) continue
        if (wordPropertyEnabled(rPr ? findFirst(rPr, 'b') : null)) {
          content = `<strong>${content}</strong>`
        }
        if (wordPropertyEnabled(rPr ? findFirst(rPr, 'i') : null)) {
          content = `<em>${content}</em>`
        }
        if (wordPropertyEnabled(rPr ? findFirst(rPr, 'u') : null)) {
          content = `<u>${content}</u>`
        }
        parts.push(content)
      } else {
        walk(child)
      }
    }
  }

  walk(p)
  return parts.join('').trim()
}

function paragraphStyle(p: XmlNode): string | null {
  const pPr = findFirst(p, 'pPr')
  if (!pPr) return null
  const pStyle = findFirst(pPr, 'pStyle')
  if (!pStyle) return null
  return pStyle.attrs['w:val'] || pStyle.attrs.val || null
}

function paragraphIsListItem(p: XmlNode): boolean {
  const pPr = findFirst(p, 'pPr')
  return Boolean(pPr && findFirst(pPr, 'numPr'))
}

type FontSizeContext = {
  byStyle: Record<string, string>
  defaultFontSize?: string
}

function readVal(node: XmlNode | null): string | null {
  if (!node) return null
  return node.attrs['w:val'] || node.attrs.val || null
}

function wordHalfPointsToPt(value: string | null): string | undefined {
  if (!value) return undefined

  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return undefined

  return `${n / 2}pt`
}

function fontSizeFromRPr(rPr: XmlNode | null): string | undefined {
  if (!rPr) return undefined

  const sz = findFirst(rPr, 'sz') || findFirst(rPr, 'szCs')
  return wordHalfPointsToPt(readVal(sz))
}

function paragraphDirectFontSize(p: XmlNode): string | undefined {
  let found: string | undefined

  const walk = (n: XmlNode): void => {
    if (found) return

    for (const c of n.children) {
      if (found) return
      if (c.name === '#text') continue

      const ln = localName(c.name)

      if (ln === 'pPr') continue
      if (ln === 'sdtPr') continue

      if (ln === 'r') {
        const hasText = c.children.some((x) => localName(x.name) === 't')

        if (!hasText) continue

        const rPr = findFirst(c, 'rPr')
        const size = fontSizeFromRPr(rPr)

        if (size) {
          found = size
          return
        }
      }

      walk(c)
    }
  }

  walk(p)
  return found
}

function paragraphFontSize(
  p: XmlNode,
  styleId: string | null,
  fontSizes: FontSizeContext
): string | undefined {
  return (
    paragraphDirectFontSize(p) ||
    (styleId ? fontSizes.byStyle[styleId] : undefined) ||
    fontSizes.defaultFontSize
  )
}

function findDrawingEmbeds(p: XmlNode): string[] {
  const ids: string[] = []
  const walk = (n: XmlNode): void => {
    for (const c of n.children) {
      if (c.name === '#text') continue
      const ln = localName(c.name)
      if (ln === 'blip') {
        const embed = c.attrs['r:embed'] || c.attrs.embed
        if (embed) ids.push(embed)
      } else walk(c)
    }
  }
  walk(p)
  return ids
}

function collectParagraphs(body: XmlNode, fontSizes: FontSizeContext): ParaInfo[] {
  const out: ParaInfo[] = []
  const walk = (
    node: XmlNode,
    sdtStack: string[],
    inTable: boolean,
    tableCell?: { row: number; col: number }
  ): void => {
    for (const child of node.children) {
      if (child.name === '#text') continue
      const ln = localName(child.name)

      if (ln === 'sdt') {
        const sdtPr = findFirst(child, 'sdtPr')
        let tag: string | null = null
        if (sdtPr) {
          const tagNode = findFirst(sdtPr, 'tag')
          if (tagNode) tag = tagNode.attrs['w:val'] || tagNode.attrs.val || null
        }
        const sdtContent = findFirst(child, 'sdtContent')
        const newStack = tag ? [...sdtStack, tag] : sdtStack
        if (sdtContent) walk(sdtContent, newStack, inTable, tableCell)
        continue
      }

      if (ln === 'p') {
        const text = paragraphText(child)
        const richText = paragraphRichText(child) || escapeHtml(text)
        const style = paragraphStyle(child)
        const fontSize = paragraphFontSize(child, style, fontSizes)
        const imageEmbeds = findDrawingEmbeds(child)
        const para: ParaInfo = {
          styleId: style,
          text,
          richText,
          fontSize,
          isListItem: paragraphIsListItem(child),
          sdtTags: [...sdtStack],
          inTable,
          tableCell,
          imageEmbeds
        }
        if (inTable && /\[inserir imagem.*\]/i.test(text)) para.imgPlaceholder = true
        out.push(para)
        continue
      }

      if (ln === 'tbl') {
        const rows = findAll(child, 'tr')
        rows.forEach((tr, rIdx) => {
          const cells = findAll(tr, 'tc')
          cells.forEach((tc, cIdx) => {
            walk(tc, sdtStack, true, { row: rIdx, col: cIdx })
          })
        })
        continue
      }

      walk(child, sdtStack, inTable, tableCell)
    }
  }
  walk(body, [], false)
  return out
}

// ───────── Defaults ─────────

const DEFAULTS = {
  paragraph: { theme: 'default', textAlign: 'justify', fontSize: '16px' },
  heading: { theme: 'default', textAlign: 'left', fontSize: '24pt' },
  subheading: { theme: 'default', textAlign: 'left', fontSize: '18pt' },
  columns: { theme: 'default', textAlign: 'left', fontSize: '12pt' },
  table: { theme: 'default', textAlign: 'left', fontSize: '12pt' },
  list: { theme: 'default', textAlign: 'left', fontSize: '12pt' },
  imgText: { theme: 'default', imageSide: 'left', zoom: 'no', textAlign: 'left', fontSize: '16px' },
  accordion: { theme: 'default', textAlign: 'justify', fontSize: '16px' },
  tabs: { theme: 'default', textAlign: 'left', fontSize: '15px' },
  callout: { theme: 'default', textAlign: 'left', fontSize: '16px' },
  video: { theme: 'default', textAlign: 'center', fontSize: '14px' },
  cards: { theme: 'default', textAlign: 'left', fontSize: '15px' },
  flipcard: { theme: 'default', textAlign: 'center', fontSize: '15px' },
  quiz: { theme: 'default', textAlign: 'left', fontSize: '16px' }
}

// ───────── Tree construction ─────────

type CompoundState =
  | {
      type: 'paragraphHeading' | 'paragraphSubheading'
      tag: string
      lead: string
      leadFontSize?: string
      fontSize?: string
      content: string[]
    }
  | {
      type: 'columns'
      tag: string
      cells: Map<number, { content: string[]; fontSize?: string }>
    }
  | {
      type: 'table'
      tag: string
      cells: Map<string, string[]>
      maxRow: number
      maxCol: number
      fontSize?: string
    }
  | {
      type: 'numberedList' | 'checkboxList' | 'bulletList'
      tag: string
      items: Map<number, { text: string[]; fontSize?: string }>
    }
  | {
      type: 'accordion' | 'tabs'
      tag: string
      fontSize?: string
      items: AccordionItem[]
      currentItem?: AccordionItem
    }
  | {
      type: 'imgText'
      tag: string
      fontSize?: string
      buffer: { text: string[]; embed?: string }
    }
  | {
      type: 'imageCentered'
      tag: string
      embed?: string
      caption: string[]
    }
  | {
      type: 'process'
      tag: string
      items: ProcessStep[]
      currentItem?: ProcessStep
    }
  | {
      type: 'callout'
      tag: string
      fontSize?: string
      icon: 'info' | 'alert' | 'tip' | 'none'
      title: string
      content: string[]
    }
  | {
      type: 'video'
      tag: string
      fontSize?: string
      link: string
      subtitle: string[]
    }
  | {
      type: 'cards'
      tag: string
      fontSize?: string
      items: CardItem[]
      currentItem?: CardItem
    }
  | {
      type: 'flipcard'
      tag: string
      fontSize?: string
      items: FlipCardItem[]
      currentItem?: FlipCardItem
      side: 'front' | 'back'
    }
  | {
      type: 'quiz'
      tag: string
      fontSize?: string
      questionFontSize?: string
      optionFontSize?: string
      feedbackFontSize?: string
      quizType: 'single' | 'multiple'
      question: string
      options: string[]
      correctAnswers: string[]
      feedbackCorrect: string[]
      feedbackIncorrect: string[]
    }
  | {
      type: 'continue'
      tag: string
      text: string
    }

function isNoImageMarker(text: string): boolean {
  if (!text) return true

  const t = text.trim().toLowerCase()

  return t === 'n' || t === '[n]' || t.includes('insira uma imagem')
}

function hasAccordionLikeItemData(item: AccordionItem | undefined): item is AccordionItem {
  if (!item) return false
  return Boolean(
    item.title?.trim() ||
    item.content?.some((entry) => (typeof entry === 'string' ? entry : entry.text).trim()) ||
    item._embedRId ||
    item.img
  )
}

function hasCardItemData(item: CardItem | undefined): item is CardItem {
  if (!item) return false
  return Boolean(item.title?.trim() || item.content?.trim() || item._embedRId || item.img)
}

function hasFlipCardItemData(item: FlipCardItem | undefined): item is FlipCardItem {
  if (!item) return false
  return Boolean(
    item.title?.trim() ||
    item.content?.trim() ||
    item.backTitle?.trim() ||
    item.backContent?.trim() ||
    item._embedRId ||
    item._backEmbedRId ||
    item.img ||
    item.backImg
  )
}

function buildTree(paras: ParaInfo[]): CourseTree {
  const chapters: Chapter[] = []
  let currentChapter: Chapter | null = null
  let currentLesson: Lesson | null = null
  let openCompound: CompoundState | null = null

  const rememberContentFontSize = (
    state: Extract<
      CompoundState,
      {
        type: 'accordion' | 'tabs' | 'imgText' | 'callout' | 'video' | 'cards' | 'flipcard' | 'quiz'
      }
    >,
    para: ParaInfo
  ): void => {
    if (!state.fontSize && para.fontSize && para.text && !isNoImageMarker(para.text)) {
      state.fontSize = para.fontSize
    }
  }

  const closeCompound = (): void => {
    if (!openCompound || !currentLesson) {
      openCompound = null
      return
    }
    const c = openCompound
    if (c.type === 'paragraphHeading' || c.type === 'paragraphSubheading') {
      const isHeading = c.type === 'paragraphHeading'
      currentLesson.blocks.push({
        blockType: c.type,
        theme: 'default',
        textAlign: 'left',
        fontSize: c.fontSize || DEFAULTS.paragraph.fontSize,
        leadFontSize:
          c.leadFontSize || (isHeading ? DEFAULTS.heading.fontSize : DEFAULTS.subheading.fontSize),
        lead: c.lead,
        content: c.content
      })
    } else if (c.type === 'columns') {
      const columns = [...c.cells.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, cell]) => ({
          content: cell.content,
          fontSize: cell.fontSize || DEFAULTS.columns.fontSize
        }))
      currentLesson.blocks.push({ blockType: 'columns', ...DEFAULTS.columns, columns })
    } else if (c.type === 'table') {
      const rows = Array.from({ length: c.maxRow + 1 }, (_, row) =>
        Array.from({ length: c.maxCol + 1 }, (_, col) =>
          (c.cells.get(`${row}:${col}`) || []).filter(Boolean).join(' ')
        )
      )
      currentLesson.blocks.push({
        blockType: 'table',
        ...DEFAULTS.table,
        fontSize: c.fontSize || DEFAULTS.table.fontSize,
        rows
      })
    } else if (c.type === 'numberedList' || c.type === 'checkboxList' || c.type === 'bulletList') {
      const items = [...c.items.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, item]) => ({
          text: item.text.filter(Boolean).join(' '),
          fontSize: item.fontSize || DEFAULTS.list.fontSize
        }))
        .filter((item) => item.text)
      currentLesson.blocks.push({
        blockType: c.type,
        theme: DEFAULTS.list.theme,
        textAlign: DEFAULTS.list.textAlign,
        items
      })
    } else if (c.type === 'accordion') {
      if (hasAccordionLikeItemData(c.currentItem)) c.items.push(c.currentItem)
      const items = c.items.filter(hasAccordionLikeItemData)
      currentLesson.blocks.push({
        blockType: 'accordion',
        ...DEFAULTS.accordion,
        fontSize: c.fontSize || DEFAULTS.accordion.fontSize,
        items
      })
    } else if (c.type === 'tabs') {
      if (hasAccordionLikeItemData(c.currentItem)) c.items.push(c.currentItem)
      const items = c.items.filter(hasAccordionLikeItemData)
      currentLesson.blocks.push({
        blockType: 'tabs',
        ...DEFAULTS.tabs,
        fontSize: c.fontSize || DEFAULTS.tabs.fontSize,
        items
      })
    } else if (c.type === 'imgText') {
      currentLesson.blocks.push({
        blockType: 'imgText',
        ...DEFAULTS.imgText,
        fontSize: c.fontSize || DEFAULTS.imgText.fontSize,
        image: '',
        altText: '',
        imgSubtitle: '',
        content: c.buffer.text,
        _embedRId: c.buffer.embed
      })
    } else if (c.type === 'imageCentered') {
      currentLesson.blocks.push({
        blockType: 'imageCentered',
        theme: 'default',
        image: '',
        altText: '',
        caption: c.caption.filter(Boolean).join(' '),
        _embedRId: c.embed
      })
    } else if (c.type === 'process') {
      if (c.currentItem) c.items.push(c.currentItem)
      const items = c.items.filter(
        (item) => item.step || item.title || item.text || item._embedRId || item.image
      )
      currentLesson.blocks.push({
        blockType: 'process',
        theme: 'default',
        textAlign: 'left',
        items
      })
    } else if (c.type === 'callout') {
      currentLesson.blocks.push({
        blockType: 'callout',
        ...DEFAULTS.callout,
        fontSize: c.fontSize || DEFAULTS.callout.fontSize,
        icon: c.icon,
        title: c.title,
        content: c.content.join(' ')
      })
    } else if (c.type === 'video') {
      currentLesson.blocks.push({
        blockType: 'video',
        ...DEFAULTS.video,
        fontSize: c.fontSize || DEFAULTS.video.fontSize,
        link: c.link,
        videoSubtitle: c.subtitle.filter(Boolean).join(' ')
      })
    } else if (c.type === 'cards') {
      if (hasCardItemData(c.currentItem)) c.items.push(c.currentItem)
      const items = c.items.filter(hasCardItemData)
      currentLesson.blocks.push({
        blockType: 'cards',
        ...DEFAULTS.cards,
        fontSize: c.fontSize || DEFAULTS.cards.fontSize,
        items
      })
    } else if (c.type === 'flipcard') {
      if (hasFlipCardItemData(c.currentItem)) c.items.push(c.currentItem)
      const items = c.items.filter(hasFlipCardItemData)
      currentLesson.blocks.push({
        blockType: 'flipcard',
        ...DEFAULTS.flipcard,
        fontSize: c.fontSize || DEFAULTS.flipcard.fontSize,
        items
      })
    } else if (c.type === 'quiz') {
      currentLesson.blocks.push({
        blockType: 'quiz',
        ...DEFAULTS.quiz,
        fontSize: c.questionFontSize || c.fontSize || DEFAULTS.quiz.fontSize,
        questionFontSize: c.questionFontSize || c.fontSize || DEFAULTS.quiz.fontSize,
        optionFontSize: c.optionFontSize || c.fontSize || DEFAULTS.quiz.fontSize,
        feedbackFontSize:
          c.feedbackFontSize || c.optionFontSize || c.fontSize || DEFAULTS.quiz.fontSize,
        question: c.question,
        type: c.quizType,
        options: c.options,
        correctAnswers: c.correctAnswers,
        feedbackCorrect: c.feedbackCorrect.join(' '),
        feedbackIncorrect: c.feedbackIncorrect.join(' ')
      })
    } else if (c.type === 'continue') {
      currentLesson.blocks.push({
        blockType: 'continueButton',
        buttonText: c.text || 'Continuar',
        isEndOfLesson: false
      })
    }
    openCompound = null
  }

  const newCardItem = (): CardItem => ({
    title: '',
    content: '',
    img: '',
    altText: '',
    subtitle: '',
    zoom: 'no'
  })

  const newFlipItem = (): FlipCardItem => ({
    title: '',
    content: '',
    img: '',
    altText: '',
    backTitle: '',
    backContent: '',
    backImg: '',
    backAltText: ''
  })

  const newProcessStep = (): ProcessStep => ({
    step: '',
    title: '',
    text: '',
    fontSize: '12pt',
    image: '',
    altText: ''
  })

  for (const para of paras) {
    const outerTag = para.sdtTags[0] || null

    // Chapters and lessons are always outside content controls.
    if (para.styleId === 'DN-Capitulo' && !outerTag) {
      closeCompound()
      const id = String(chapters.length + 1)
      currentChapter = { id, chapterName: para.text || `Chapter ${id}`, lessons: [] }
      chapters.push(currentChapter)
      currentLesson = null
      continue
    }

    if (para.styleId === 'DN-Licao' && !outerTag) {
      closeCompound()
      if (!currentChapter) {
        currentChapter = { id: '1', chapterName: 'Untitled chapter', lessons: [] }
        chapters.push(currentChapter)
      }
      const lessonId = String(currentChapter.lessons.length + 1)
      currentLesson = {
        chapterId: currentChapter.id,
        lessonId,
        chapterName: currentChapter.chapterName,
        name: para.text || `Lesson ${lessonId}`,
        blocks: []
      }
      currentChapter.lessons.push(currentLesson)
      continue
    }

    if (!currentLesson) continue

    // ── Text blocks ──
    if (outerTag === 'DN-heading' || outerTag === 'DN-subheading') {
      if (openCompound) closeCompound()
      if (para.text) {
        const isHeading = outerTag === 'DN-heading'
        currentLesson.blocks.push({
          blockType: isHeading ? 'heading' : 'subheading',
          ...(isHeading ? DEFAULTS.heading : DEFAULTS.subheading),
          fontSize:
            para.fontSize || (isHeading ? DEFAULTS.heading.fontSize : DEFAULTS.subheading.fontSize),
          text: para.richText
        })
      }
      continue
    }

    if (outerTag === 'DN-paragraphHeading' || outerTag === 'DN-paragraphSubheading') {
      const expectedType =
        outerTag === 'DN-paragraphHeading' ? 'paragraphHeading' : 'paragraphSubheading'
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = { type: expectedType, tag: outerTag, lead: '', content: [] }
      }
      const c = openCompound as Extract<
        CompoundState,
        { type: 'paragraphHeading' | 'paragraphSubheading' }
      >
      const isLead =
        para.styleId === 'DN-Heading' ||
        para.styleId === 'DN-Subheading' ||
        (!c.lead && c.content.length === 0)
      if (isLead && para.text) {
        c.lead = para.richText
        c.leadFontSize = para.fontSize
      } else if (para.text) {
        c.content.push(para.richText)
        if (!c.fontSize && para.fontSize) c.fontSize = para.fontSize
      }
      continue
    }

    if (outerTag === 'DN-columns') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) openCompound = { type: 'columns', tag: outerTag, cells: new Map() }
      const c = openCompound as Extract<CompoundState, { type: 'columns' }>
      if (para.inTable && para.tableCell) {
        const col = para.tableCell.col
        const cell = c.cells.get(col) || { content: [] }
        if (para.text) cell.content.push(para.richText)
        if (!cell.fontSize && para.fontSize) cell.fontSize = para.fontSize
        c.cells.set(col, cell)
      }
      continue
    }

    if (outerTag === 'DN-table') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = { type: 'table', tag: outerTag, cells: new Map(), maxRow: -1, maxCol: -1 }
      }
      const c = openCompound as Extract<CompoundState, { type: 'table' }>
      if (para.inTable && para.tableCell) {
        const { row, col } = para.tableCell
        const key = `${row}:${col}`
        const values = c.cells.get(key) || []
        if (para.text) values.push(para.richText)
        c.cells.set(key, values)
        c.maxRow = Math.max(c.maxRow, row)
        c.maxCol = Math.max(c.maxCol, col)
        if (!c.fontSize && row > 0 && para.fontSize) c.fontSize = para.fontSize
      }
      continue
    }

    if (
      outerTag === 'DN-numberedList' ||
      outerTag === 'DN-checkboxList' ||
      outerTag === 'DN-bulletList'
    ) {
      const expectedType =
        outerTag === 'DN-numberedList'
          ? 'numberedList'
          : outerTag === 'DN-checkboxList'
            ? 'checkboxList'
            : 'bulletList'
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) openCompound = { type: expectedType, tag: outerTag, items: new Map() }
      const c = openCompound as Extract<
        CompoundState,
        { type: 'numberedList' | 'checkboxList' | 'bulletList' }
      >
      if (para.inTable && para.tableCell) {
        const row = para.tableCell.row
        const item = c.items.get(row) || { text: [] }
        if (para.text) item.text.push(para.richText)
        if (!item.fontSize && para.fontSize) item.fontSize = para.fontSize
        c.items.set(row, item)
      }
      continue
    }

    if (outerTag === 'DN-imageCentered') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = { type: 'imageCentered', tag: outerTag, caption: [] }
      }
      const c = openCompound as Extract<CompoundState, { type: 'imageCentered' }>
      if (para.inTable && para.tableCell?.row === 0 && para.imageEmbeds[0]) {
        c.embed = para.imageEmbeds[0]
      }
      if (para.inTable && para.tableCell?.row === 1 && para.text) {
        const normalized = para.text.trim().toLowerCase()
        const isPlaceholder =
          normalized === 'legenda da imagem (opcional)' || normalized === 'image caption (optional)'
        if (!isPlaceholder) c.caption.push(para.richText)
      }
      continue
    }

    if (outerTag === 'DN-process') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = { type: 'process', tag: outerTag, items: [], currentItem: undefined }
      }
      const c = openCompound as Extract<CompoundState, { type: 'process' }>

      if (para.styleId === 'DN-Process-Passo') {
        if (c.currentItem) c.items.push(c.currentItem)
        c.currentItem = newProcessStep()
        c.currentItem.step = para.richText
      } else if (para.styleId === 'DN-Process-Titulo') {
        if (!c.currentItem) c.currentItem = newProcessStep()
        const normalized = para.text.trim().toLowerCase()
        const isPlaceholder =
          normalized === 'título do passo (opcional)' || normalized === 'step title (optional)'
        if (!isPlaceholder) c.currentItem.title = para.richText
      } else if (para.styleId === 'DN-Process-Texto') {
        if (!c.currentItem) c.currentItem = newProcessStep()
        if (para.text) {
          c.currentItem.text = [c.currentItem.text, para.richText].filter(Boolean).join(' ')
        }
        if (para.fontSize) c.currentItem.fontSize = para.fontSize
      } else if (para.inTable && para.tableCell?.row === 2 && para.imageEmbeds[0]) {
        if (!c.currentItem) c.currentItem = newProcessStep()
        c.currentItem._embedRId = para.imageEmbeds[0]
      }
      continue
    }

    // ── Accordion / Tabs ──
    if (outerTag === 'DN-accordion' || outerTag === 'DN-tabs') {
      const expectedType = outerTag === 'DN-accordion' ? 'accordion' : 'tabs'
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = { type: expectedType, tag: outerTag, items: [], currentItem: undefined }
      }

      const c = openCompound as Extract<CompoundState, { type: 'accordion' | 'tabs' }>

      const isTitle =
        !para.inTable &&
        (para.styleId === 'DN-Accordion-Titulo' || para.styleId === 'DN-Tab-Titulo')

      if (isTitle) {
        if (c.currentItem) c.items.push(c.currentItem)
        c.currentItem = {
          title: para.richText,
          content: [],
          img: '',
          altText: '',
          subtitle: '',
          zoom: 'no'
        }
        continue
      }

      if (!c.currentItem) {
        c.currentItem = {
          title: '',
          content: [],
          img: '',
          altText: '',
          subtitle: '',
          zoom: 'no'
        }
      }

      if (para.inTable && para.tableCell?.col === 0) {
        if (para.text && !isNoImageMarker(para.text)) {
          rememberContentFontSize(c, para)
          c.currentItem.content.push(
            expectedType === 'tabs' && para.isListItem
              ? { type: 'bullet', text: para.richText }
              : para.richText
          )
        }
        continue
      }

      if (para.inTable && para.tableCell?.col === 1) {
        if (para.imageEmbeds.length > 0) {
          c.currentItem._embedRId = para.imageEmbeds[0]
          continue
        }

        if (para.text && isNoImageMarker(para.text)) {
          continue
        }

        continue
      }

      if (para.text && !isNoImageMarker(para.text)) {
        rememberContentFontSize(c, para)
        c.currentItem.content.push(
          expectedType === 'tabs' && para.isListItem
            ? { type: 'bullet', text: para.richText }
            : para.richText
        )
      }

      continue
    }

    // ── Image + Text ──
    if (outerTag === 'DN-imgText') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = { type: 'imgText', tag: 'DN-imgText', buffer: { text: [] } }
      }
      const c = openCompound as Extract<CompoundState, { type: 'imgText' }>

      if (!c.buffer.embed && para.imageEmbeds.length > 0) c.buffer.embed = para.imageEmbeds[0]
      if (!para.imgPlaceholder && para.text && !isNoImageMarker(para.text)) {
        rememberContentFontSize(c, para)
        c.buffer.text.push(para.richText)
      }
      continue
    }

    // ── Callout ──
    if (outerTag === 'DN-callout') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = {
          type: 'callout',
          tag: 'DN-callout',
          icon: 'info',
          title: '',
          content: []
        }
      }
      const c = openCompound as Extract<CompoundState, { type: 'callout' }>

      if (para.styleId === 'DN-Callout-Tipo') {
        const t = para.text.toLowerCase().trim()
        if (t === 'info' || t === 'alert' || t === 'tip' || t === 'none') c.icon = t
        else c.icon = 'info'
      } else if (para.styleId === 'DN-Callout-Titulo') {
        c.title = para.richText
      } else if (para.styleId === 'DN-Callout-Conteudo') {
        if (para.text) {
          rememberContentFontSize(c, para)
          c.content.push(para.richText)
        }
      } else if (para.text) {
        rememberContentFontSize(c, para)
        c.content.push(para.richText)
      }
      continue
    }

    // ── Video ──
    if (outerTag === 'DN-video') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = { type: 'video', tag: 'DN-video', link: '', subtitle: [] }
      }
      const c = openCompound as Extract<CompoundState, { type: 'video' }>

      if (para.styleId === 'DN-Video-Url') {
        c.link = para.text
      } else if (para.styleId === 'DN-Video-Legenda') {
        if (para.text) {
          rememberContentFontSize(c, para)
          c.subtitle.push(para.richText)
        }
      } else if (!c.link && para.text) {
        c.link = para.text
      } else if (para.text) {
        rememberContentFontSize(c, para)
        c.subtitle.push(para.richText)
      }
      continue
    }

    // ── Cards ──
    if (outerTag === 'DN-cards') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = { type: 'cards', tag: 'DN-cards', items: [], currentItem: undefined }
      }

      const c = openCompound as Extract<CompoundState, { type: 'cards' }>

      if (!para.inTable && para.styleId === 'DN-Card-Titulo') {
        if (c.currentItem) c.items.push(c.currentItem)
        c.currentItem = newCardItem()
        c.currentItem.title = para.richText
        continue
      }

      if (!c.currentItem) c.currentItem = newCardItem()

      if (para.inTable && para.tableCell?.col === 0) {
        if (para.text && !isNoImageMarker(para.text)) {
          rememberContentFontSize(c, para)
          c.currentItem.content = c.currentItem.content
            ? c.currentItem.content + ' ' + para.richText
            : para.richText
        }
        continue
      }

      if (para.inTable && para.tableCell?.col === 1) {
        if (para.imageEmbeds.length > 0) {
          c.currentItem._embedRId = para.imageEmbeds[0]
          continue
        }

        if (para.text && isNoImageMarker(para.text)) {
          continue
        }

        continue
      }

      if (para.text && !isNoImageMarker(para.text)) {
        rememberContentFontSize(c, para)
        c.currentItem.content = c.currentItem.content
          ? c.currentItem.content + ' ' + para.richText
          : para.richText
      }

      continue
    }

    // ── FlipCard ──
    if (outerTag === 'DN-flipcard') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = {
          type: 'flipcard',
          tag: 'DN-flipcard',
          items: [],
          currentItem: undefined,
          side: 'front'
        }
      }

      const c = openCompound as Extract<CompoundState, { type: 'flipcard' }>

      if (!para.inTable && para.styleId === 'DN-Flip-Frente-Titulo') {
        if (
          c.currentItem &&
          (c.currentItem.backTitle || c.currentItem.backContent || c.currentItem._backEmbedRId)
        ) {
          c.items.push(c.currentItem)
          c.currentItem = newFlipItem()
        } else if (!c.currentItem) {
          c.currentItem = newFlipItem()
        }

        c.currentItem.title = para.richText
        c.side = 'front'
        continue
      }

      if (!para.inTable && para.styleId === 'DN-Flip-Verso-Titulo') {
        if (!c.currentItem) c.currentItem = newFlipItem()
        c.currentItem.backTitle = para.richText
        c.side = 'back'
        continue
      }

      if (!c.currentItem) c.currentItem = newFlipItem()

      if (para.inTable && para.tableCell?.col === 0) {
        if (para.text && !isNoImageMarker(para.text)) {
          rememberContentFontSize(c, para)
          if (c.side === 'back') {
            c.currentItem.backContent = c.currentItem.backContent
              ? c.currentItem.backContent + ' ' + para.richText
              : para.richText
          } else {
            c.currentItem.content = c.currentItem.content
              ? c.currentItem.content + ' ' + para.richText
              : para.richText
          }
        }
        continue
      }

      if (para.inTable && para.tableCell?.col === 1) {
        if (para.imageEmbeds.length > 0) {
          if (c.side === 'back') c.currentItem._backEmbedRId = para.imageEmbeds[0]
          else c.currentItem._embedRId = para.imageEmbeds[0]
          continue
        }

        if (para.text && isNoImageMarker(para.text)) {
          continue
        }

        continue
      }

      if (para.styleId === 'DN-Flip-Frente-Conteudo') {
        if (para.text && !isNoImageMarker(para.text)) {
          rememberContentFontSize(c, para)
          c.currentItem.content = c.currentItem.content
            ? c.currentItem.content + ' ' + para.richText
            : para.richText
        }
        c.side = 'front'
      } else if (para.styleId === 'DN-Flip-Verso-Conteudo') {
        if (para.text && !isNoImageMarker(para.text)) {
          rememberContentFontSize(c, para)
          c.currentItem.backContent = c.currentItem.backContent
            ? c.currentItem.backContent + ' ' + para.richText
            : para.richText
        }
        c.side = 'back'
      }

      continue
    }

    // ── Quiz ──
    if (outerTag === 'DN-quiz') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = {
          type: 'quiz',
          tag: 'DN-quiz',
          quizType: 'single',
          question: '',
          options: [],
          correctAnswers: [],
          feedbackCorrect: [],
          feedbackIncorrect: []
        }
      }
      const c = openCompound as Extract<CompoundState, { type: 'quiz' }>

      if (para.styleId === 'DN-Quiz-Tipo') {
        const t = para.text.toLowerCase().trim()
        c.quizType = t === 'multi' || t === 'multiple' ? 'multiple' : 'single'
      } else if (para.styleId === 'DN-Quiz-Pergunta') {
        if (para.text) {
          rememberContentFontSize(c, para)
          if (!c.questionFontSize && para.fontSize) c.questionFontSize = para.fontSize
          c.question = para.richText
        }
      } else if (para.styleId === 'DN-Quiz-Opcao') {
        if (para.text) {
          if (para.fontSize) c.optionFontSize = para.fontSize
          c.options.push(para.richText)
        }
      } else if (para.styleId === 'DN-Quiz-OpcaoCerta') {
        if (para.text) {
          if (para.fontSize) c.optionFontSize = para.fontSize
          c.options.push(para.richText)
          c.correctAnswers.push(para.richText)
        }
      } else if (para.styleId === 'DN-Quiz-FeedbackOk') {
        if (para.text) {
          if (!c.feedbackFontSize && para.fontSize) c.feedbackFontSize = para.fontSize
          c.feedbackCorrect.push(para.richText)
        }
      } else if (para.styleId === 'DN-Quiz-FeedbackErro') {
        if (para.text) {
          if (!c.feedbackFontSize && para.fontSize) c.feedbackFontSize = para.fontSize
          c.feedbackIncorrect.push(para.richText)
        }
      }
      continue
    }

    // ── Continue ──
    if (outerTag === 'DN-continue') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = { type: 'continue', tag: 'DN-continue', text: '' }
      }
      const c = openCompound as Extract<CompoundState, { type: 'continue' }>
      if (para.text) c.text = para.text
      continue
    }

    // ── Standalone paragraph ──
    if (openCompound) closeCompound()
    if (!para.text) continue

    const paragraphFontSize = para.fontSize || DEFAULTS.paragraph.fontSize
    const lastBlock = currentLesson.blocks[currentLesson.blocks.length - 1]

    if (
      lastBlock &&
      lastBlock.blockType === 'paragraph' &&
      lastBlock.fontSize === paragraphFontSize
    ) {
      ;(lastBlock as ParagraphBlock).content.push(para.richText)
    } else {
      currentLesson.blocks.push({
        blockType: 'paragraph',
        ...DEFAULTS.paragraph,
        fontSize: paragraphFontSize,
        content: [para.richText]
      })
    }
  }

  closeCompound()

  // Mark the final continue button in each lesson for navigation behavior.
  for (const ch of chapters) {
    for (const ls of ch.lessons) {
      for (let i = ls.blocks.length - 1; i >= 0; i--) {
        const b = ls.blocks[i]
        if (b.blockType === 'continueButton') {
          b.isEndOfLesson = true
          break
        }
      }
    }
  }

  return { chapters }
}

// ───────── Relationship map ─────────

async function buildFontSizeContext(zip: JSZip): Promise<FontSizeContext> {
  const stylesFile = zip.file('word/styles.xml')
  if (!stylesFile) return { byStyle: {} }

  const xml = await stylesFile.async('string')
  const root = parseXml(xml)

  const styles = findFirst(root, 'styles')
  if (!styles) return { byStyle: {} }

  const byStyle: Record<string, string> = {}
  const docDefaults = findFirst(styles, 'docDefaults')
  const rPrDefault = docDefaults ? findFirst(docDefaults, 'rPrDefault') : null
  const defaultRPr = rPrDefault ? findFirst(rPrDefault, 'rPr') : null
  const defaultFontSize = fontSizeFromRPr(defaultRPr)

  for (const style of findAll(styles, 'style')) {
    const styleId = style.attrs['w:styleId'] || style.attrs.styleId
    if (!styleId) continue

    const rPr = findFirst(style, 'rPr')
    const fontSize = fontSizeFromRPr(rPr)

    if (fontSize) byStyle[styleId] = fontSize
  }

  return { byStyle, defaultFontSize }
}

async function buildRelsMap(zip: JSZip): Promise<Record<string, string>> {
  const relsFile = zip.file('word/_rels/document.xml.rels')
  if (!relsFile) return {}
  const xml = await relsFile.async('string')
  const root = parseXml(xml)
  const relationships = findFirst(root, 'Relationships')
  if (!relationships) return {}
  const map: Record<string, string> = {}
  for (const r of findAll(relationships, 'Relationship')) {
    const id = r.attrs['Id']
    const target = r.attrs['Target']
    if (id && target) map[id] = target
  }
  return map
}

// ───────── Public API ─────────

export async function parseDocxToCourseTree(filePath: string): Promise<ParseResult> {
  const buf = await readFile(filePath)
  const zip = await JSZip.loadAsync(buf)
  const docXml = zip.file('word/document.xml')
  if (!docXml) throw new Error('word/document.xml não encontrado no .docx')
  const xml = await docXml.async('string')
  const root = parseXml(xml)

  const document = findFirst(root, 'document')
  if (!document) throw new Error('Elemento <w:document> não encontrado')
  const body = findFirst(document, 'body')
  if (!body) throw new Error('Elemento <w:body> não encontrado')

  const fontSizes = await buildFontSizeContext(zip)
  const paras = collectParagraphs(body, fontSizes)
  const tree = buildTree(paras)
  const relsMap = await buildRelsMap(zip)

  return { tree, zip, relsMap }
}
