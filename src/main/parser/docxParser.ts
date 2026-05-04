/**
 * Lê um .docx, identifica os estilos DN e content controls, e devolve
 * uma árvore { chapters: [...] } pronta pra ser convertida em arquivos .jsx.
 */

import { readFile } from 'fs/promises'
import JSZip from 'jszip'

// ───────── Tipos públicos dos blocos ─────────

export type ParagraphBlock = {
  blockType: 'paragraph'
  theme: string
  textAlign: string
  fontSize: string
  content: string[]
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

export type AccordionItem = {
  title: string
  content: string[]
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

// ───────── Internos ─────────

type ParaInfo = {
  styleId: string | null
  text: string
  sdtTags: string[]
  inTable: boolean
  tableCell?: { row: number; col: number }
  imgPlaceholder?: boolean
  imageEmbeds: string[]
}

// ───────── XML parser tolerante ─────────

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

// ───────── Coleta de parágrafos ─────────

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

function paragraphStyle(p: XmlNode): string | null {
  const pPr = findFirst(p, 'pPr')
  if (!pPr) return null
  const pStyle = findFirst(pPr, 'pStyle')
  if (!pStyle) return null
  return pStyle.attrs['w:val'] || pStyle.attrs.val || null
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

function collectParagraphs(body: XmlNode): ParaInfo[] {
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
        const style = paragraphStyle(child)
        const imageEmbeds = findDrawingEmbeds(child)
        const para: ParaInfo = {
          styleId: style,
          text,
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
  imgText: { theme: 'default', imageSide: 'left', zoom: 'no', textAlign: 'left', fontSize: '16px' },
  accordion: { theme: 'default', textAlign: 'justify', fontSize: '16px' },
  tabs: { theme: 'default', textAlign: 'left', fontSize: '15px' },
  callout: { theme: 'default', textAlign: 'left', fontSize: '16px' },
  video: { theme: 'default', textAlign: 'center', fontSize: '14px' },
  cards: { theme: 'default', textAlign: 'left', fontSize: '15px' },
  flipcard: { theme: 'default', textAlign: 'center', fontSize: '15px' },
  quiz: { theme: 'default', textAlign: 'left', fontSize: '16px' }
}

// ───────── Construção da árvore ─────────

type CompoundState =
  | {
      type: 'accordion' | 'tabs'
      tag: string
      items: AccordionItem[]
      currentItem?: AccordionItem
    }
  | {
      type: 'imgText'
      tag: string
      buffer: { text: string[]; embed?: string }
    }
  | {
      type: 'callout'
      tag: string
      icon: 'info' | 'alert' | 'tip' | 'none'
      title: string
      content: string[]
    }
  | {
      type: 'video'
      tag: string
      link: string
      subtitle: string[]
    }
  | {
      type: 'cards'
      tag: string
      items: CardItem[]
      currentItem?: CardItem
    }
  | {
      type: 'flipcard'
      tag: string
      items: FlipCardItem[]
      currentItem?: FlipCardItem
      side: 'front' | 'back'
    }
  | {
      type: 'quiz'
      tag: string
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
    item.title?.trim() || item.content?.some((text) => text.trim()) || item._embedRId || item.img
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

  const closeCompound = (): void => {
    if (!openCompound || !currentLesson) {
      openCompound = null
      return
    }
    const c = openCompound
    if (c.type === 'accordion') {
      if (hasAccordionLikeItemData(c.currentItem)) c.items.push(c.currentItem)
      const items = c.items.filter(hasAccordionLikeItemData)
      currentLesson.blocks.push({ blockType: 'accordion', ...DEFAULTS.accordion, items })
    } else if (c.type === 'tabs') {
      if (hasAccordionLikeItemData(c.currentItem)) c.items.push(c.currentItem)
      const items = c.items.filter(hasAccordionLikeItemData)
      currentLesson.blocks.push({ blockType: 'tabs', ...DEFAULTS.tabs, items })
    } else if (c.type === 'imgText') {
      currentLesson.blocks.push({
        blockType: 'imgText',
        ...DEFAULTS.imgText,
        image: '',
        altText: '',
        imgSubtitle: '',
        content: c.buffer.text,
        _embedRId: c.buffer.embed
      })
    } else if (c.type === 'callout') {
      currentLesson.blocks.push({
        blockType: 'callout',
        ...DEFAULTS.callout,
        icon: c.icon,
        title: c.title,
        content: c.content.join(' ')
      })
    } else if (c.type === 'video') {
      currentLesson.blocks.push({
        blockType: 'video',
        ...DEFAULTS.video,
        link: c.link,
        videoSubtitle: c.subtitle.filter(Boolean).join(' ')
      })
    } else if (c.type === 'cards') {
      if (hasCardItemData(c.currentItem)) c.items.push(c.currentItem)
      const items = c.items.filter(hasCardItemData)
      currentLesson.blocks.push({ blockType: 'cards', ...DEFAULTS.cards, items })
    } else if (c.type === 'flipcard') {
      if (hasFlipCardItemData(c.currentItem)) c.items.push(c.currentItem)
      const items = c.items.filter(hasFlipCardItemData)
      currentLesson.blocks.push({ blockType: 'flipcard', ...DEFAULTS.flipcard, items })
    } else if (c.type === 'quiz') {
      currentLesson.blocks.push({
        blockType: 'quiz',
        ...DEFAULTS.quiz,
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

  for (const para of paras) {
    const outerTag = para.sdtTags[0] || null

    // ── Capítulo / Lição (sempre fora de qualquer CC) ──
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

    // ── Acordeão / Abas ──
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
          title: para.text,
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
          c.currentItem.content.push(para.text)
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
        c.currentItem.content.push(para.text)
      }

      continue
    }

    // ── Imagem + Texto ──
    if (outerTag === 'DN-imgText') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = { type: 'imgText', tag: 'DN-imgText', buffer: { text: [] } }
      }
      const c = openCompound as Extract<CompoundState, { type: 'imgText' }>
      if (!c.buffer.embed && para.imageEmbeds.length > 0) c.buffer.embed = para.imageEmbeds[0]
      if (!para.imgPlaceholder && para.text) c.buffer.text.push(para.text)
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
        c.title = para.text
      } else if (para.styleId === 'DN-Callout-Conteudo') {
        if (para.text) c.content.push(para.text)
      } else if (para.text) {
        c.content.push(para.text)
      }
      continue
    }

    // ── Vídeo ──
    if (outerTag === 'DN-video') {
      if (openCompound && openCompound.tag !== outerTag) closeCompound()
      if (!openCompound) {
        openCompound = { type: 'video', tag: 'DN-video', link: '', subtitle: [] }
      }
      const c = openCompound as Extract<CompoundState, { type: 'video' }>
      if (para.styleId === 'DN-Video-Url') {
        c.link = para.text
      } else if (para.styleId === 'DN-Video-Legenda') {
        if (para.text) c.subtitle.push(para.text)
      } else if (!c.link && para.text) {
        c.link = para.text
      } else if (para.text) {
        c.subtitle.push(para.text)
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
        c.currentItem.title = para.text
        continue
      }

      if (!c.currentItem) c.currentItem = newCardItem()

      if (para.inTable && para.tableCell?.col === 0) {
        if (para.text && !isNoImageMarker(para.text)) {
          c.currentItem.content = c.currentItem.content
            ? c.currentItem.content + ' ' + para.text
            : para.text
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
        c.currentItem.content = c.currentItem.content
          ? c.currentItem.content + ' ' + para.text
          : para.text
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

        c.currentItem.title = para.text
        c.side = 'front'
        continue
      }

      if (!para.inTable && para.styleId === 'DN-Flip-Verso-Titulo') {
        if (!c.currentItem) c.currentItem = newFlipItem()
        c.currentItem.backTitle = para.text
        c.side = 'back'
        continue
      }

      if (!c.currentItem) c.currentItem = newFlipItem()

      if (para.inTable && para.tableCell?.col === 0) {
        if (para.text && !isNoImageMarker(para.text)) {
          if (c.side === 'back') {
            c.currentItem.backContent = c.currentItem.backContent
              ? c.currentItem.backContent + ' ' + para.text
              : para.text
          } else {
            c.currentItem.content = c.currentItem.content
              ? c.currentItem.content + ' ' + para.text
              : para.text
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
          c.currentItem.content = c.currentItem.content
            ? c.currentItem.content + ' ' + para.text
            : para.text
        }
        c.side = 'front'
      } else if (para.styleId === 'DN-Flip-Verso-Conteudo') {
        if (para.text && !isNoImageMarker(para.text)) {
          c.currentItem.backContent = c.currentItem.backContent
            ? c.currentItem.backContent + ' ' + para.text
            : para.text
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
        c.question = para.text
      } else if (para.styleId === 'DN-Quiz-Opcao') {
        if (para.text) c.options.push(para.text)
      } else if (para.styleId === 'DN-Quiz-OpcaoCerta') {
        if (para.text) {
          c.options.push(para.text)
          c.correctAnswers.push(para.text)
        }
      } else if (para.styleId === 'DN-Quiz-FeedbackOk') {
        if (para.text) c.feedbackCorrect.push(para.text)
      } else if (para.styleId === 'DN-Quiz-FeedbackErro') {
        if (para.text) c.feedbackIncorrect.push(para.text)
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

    // ── Parágrafo solto ──
    if (openCompound) closeCompound()
    if (!para.text) continue

    const lastBlock = currentLesson.blocks[currentLesson.blocks.length - 1]
    if (lastBlock && lastBlock.blockType === 'paragraph') {
      ;(lastBlock as ParagraphBlock).content.push(para.text)
    } else {
      currentLesson.blocks.push({
        blockType: 'paragraph',
        ...DEFAULTS.paragraph,
        content: [para.text]
      })
    }
  }

  closeCompound()

  // Marca o último continueButton de cada lição como isEndOfLesson
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

// ───────── Mapa de relations ─────────

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

// ───────── Pública ─────────

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

  const paras = collectParagraphs(body)
  const tree = buildTree(paras)
  const relsMap = await buildRelsMap(zip)

  return { tree, zip, relsMap }
}
