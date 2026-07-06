import { useEffect, useRef, useState } from 'react'
import appIcon from './assets/icon.png'
import { getLanguageFromLocale, translations } from './i18n'
import './App.css'

type ScormVersion = '1.2' | '2004'
type SuccessMode = 'onComplete' | 'onScore' | 'none'

type CourseMetadata = {
  courseName: string
  shortDescription: string
  courseIntroduction: string
  keywords: string
  courseImage: string | null
  courseTheme: string
  scormVersion: ScormVersion
  successMode: SuccessMode
}

// Minimal shape of the tree returned by the parser.
type TreeBlock = { blockType: string; theme?: string; [k: string]: unknown }
type TreeLesson = { chapterId: string; lessonId: string; name: string; blocks: TreeBlock[] }
type TreeChapter = { id: string; chapterName: string; lessons: TreeLesson[] }
type Tree = { chapters: TreeChapter[] }
type UpdateInfo = {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  releaseName: string
  publishedAt: string
}

const THEME_OPTIONS = [
  {
    value: 'default',
    labelKey: 'themeDefault',
    colors: ['#e0e7eb', '#555555', '#2c3e50', '#007bff']
  },
  {
    value: 'corporativo1',
    labelKey: 'themeCorporate1',
    colors: ['#e0e7eb', '#555555', '#2c3e50', '#007bff']
  },
  {
    value: 'corporativo2',
    labelKey: 'themeCorporate2',
    colors: ['#e8f5e9', '#555555', '#2c3e50', '#2ecc71']
  },
  {
    value: 'corporativo3',
    labelKey: 'themeCorporate3',
    colors: ['#f2f4f7', '#555555', '#2c3e50', '#9b59b6']
  },
  {
    value: 'audacioso1',
    labelKey: 'themeBold1',
    colors: ['#fdfbe7', '#555555', '#333333', '#ff9e00']
  },
  {
    value: 'audacioso2',
    labelKey: 'themeBold2',
    colors: ['#fdfbe7', '#555555', '#333333', '#00b894']
  },
  {
    value: 'audacioso3',
    labelKey: 'themeBold3',
    colors: ['#fdfbe7', '#555555', '#333333', '#6c5ce7']
  },
  { value: 'noturno1', labelKey: 'themeDark1', colors: ['#2c3e50', '#b0b0b0', '#e94560'] },
  { value: 'noturno2', labelKey: 'themeDark2', colors: ['#363636', '#b0b0b0', '#00bcd4'] },
  { value: 'noturno3', labelKey: 'themeDark3', colors: ['#282828', '#b0b0b0', '#ffeb3b'] }
]

type ThemeSelectProps = {
  value: string
  placeholder?: string
  labels: Record<string, string>
  onChange: (value: string) => void
}

function ThemeSwatches({ colors }: { colors: string[] }): React.JSX.Element {
  return (
    <span className="theme-swatches" aria-hidden="true">
      {colors.map((color, index) => (
        <span key={`${color}-${index}`} style={{ backgroundColor: color }} />
      ))}
    </span>
  )
}

function ThemeSelect({
  value,
  placeholder,
  labels,
  onChange
}: ThemeSelectProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const selected = THEME_OPTIONS.find((theme) => theme.value === value)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div className={`theme-select${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="theme-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {selected ? <ThemeSwatches colors={selected.colors} /> : null}
        <span>{selected ? labels[selected.labelKey] : placeholder}</span>
        <span className="theme-select-chevron" aria-hidden="true">
          ⌄
        </span>
      </button>
      {open && (
        <div className="theme-select-menu" role="listbox">
          {THEME_OPTIONS.map((theme) => (
            <button
              type="button"
              role="option"
              aria-selected={theme.value === value}
              className={theme.value === value ? 'is-selected' : ''}
              key={theme.value}
              onClick={() => {
                onChange(theme.value)
                setOpen(false)
              }}
            >
              <ThemeSwatches colors={theme.colors} />
              <span>{labels[theme.labelKey]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
}

function cleanProgressMessage(line: string): string {
  const clean = line.replace(/\u001b\[[0-9;]*m/g, '')
  const lines = clean
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
  return lines[lines.length - 1] || clean.trim()
}

function blockIcon(type: string): string {
  switch (type) {
    case 'paragraph':
      return '¶'
    case 'heading':
      return 'H'
    case 'subheading':
      return 'S'
    case 'paragraphHeading':
      return 'H¶'
    case 'paragraphSubheading':
      return 'S¶'
    case 'columns':
      return 'Ⅱ'
    case 'table':
      return '▦'
    case 'numberedList':
      return '1.'
    case 'checkboxList':
      return '☐'
    case 'bulletList':
      return '•'
    case 'imgText':
      return 'IT'
    case 'imageCentered':
      return 'Im'
    case 'accordion':
      return 'A'
    case 'tabs':
      return 'Ab'
    case 'callout':
      return '!'
    case 'video':
      return '▶'
    case 'cards':
      return 'Cd'
    case 'process':
      return 'Ps'
    case 'flipcard':
      return 'Fc'
    case 'quiz':
      return '?'
    case 'continueButton':
      return '→'
    default:
      return '·'
  }
}

function blockLabel(b: TreeBlock, t: Record<string, string>): string {
  switch (b.blockType) {
    case 'paragraph': {
      const c = (b.content as string[]) || []
      return `${t.blockParagraph}: "${(c[0] || '').slice(0, 50)}..."`
    }
    case 'heading':
      return `${t.blockHeading}: "${((b.text as string) || '').slice(0, 50)}"`
    case 'subheading':
      return `${t.blockSubheading}: "${((b.text as string) || '').slice(0, 50)}"`
    case 'paragraphHeading':
      return `${t.blockParagraphHeading}: "${((b.lead as string) || '').slice(0, 40)}"`
    case 'paragraphSubheading':
      return `${t.blockParagraphSubheading}: "${((b.lead as string) || '').slice(0, 40)}"`
    case 'columns':
      return `${t.blockColumns}: ${((b.columns as unknown[]) || []).length}`
    case 'table':
      return `${t.blockTable}: ${((b.rows as unknown[]) || []).length} ${t.rows}`
    case 'numberedList':
      return `${t.blockNumberedList}: ${((b.items as unknown[]) || []).length} ${t.items}`
    case 'checkboxList':
      return `${t.blockCheckboxList}: ${((b.items as unknown[]) || []).length} ${t.items}`
    case 'bulletList':
      return `${t.blockBulletList}: ${((b.items as unknown[]) || []).length} ${t.items}`
    case 'imgText':
      return t.blockImageText
    case 'imageCentered':
      return `${t.blockImageCentered}${b.caption ? `: "${(b.caption as string).slice(0, 40)}"` : ''}`
    case 'accordion':
      return `${t.blockAccordion}: ${((b.items as unknown[]) || []).length} ${t.items}`
    case 'tabs':
      return `${t.blockTabs}: ${((b.items as unknown[]) || []).length} ${t.tabs}`
    case 'callout':
      return `${t.blockCallout}: "${((b.title as string) || '').slice(0, 40)}"`
    case 'video':
      return t.blockVideo
    case 'cards':
      return `${t.blockCards}: ${((b.items as unknown[]) || []).length} ${t.cards}`
    case 'process':
      return `${t.blockProcess}: ${((b.items as unknown[]) || []).length} ${t.steps}`
    case 'flipcard':
      return `${t.blockFlipCard}: ${((b.items as unknown[]) || []).length} ${t.cards}`
    case 'quiz':
      return `${t.blockQuiz}: "${((b.question as string) || '').slice(0, 40)}"`
    case 'continueButton':
      return `${t.blockButton}: "${(b.buttonText as string) || t.continue}"`
    default:
      return b.blockType
  }
}

type Phase = 'idle' | 'parsing' | 'generating' | 'building' | 'done' | 'error'
type Step = 1 | 2 | 3

function App(): React.JSX.Element {
  const [language, setLanguage] = useState(() => getLanguageFromLocale(navigator.language))
  const [appVersion, setAppVersion] = useState('')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [updatePanelOpen, setUpdatePanelOpen] = useState(false)
  const [updateBadgeVisible, setUpdateBadgeVisible] = useState(false)

  const t = translations[language]

  useEffect(() => {
    void window.api.getAppLocale().then((locale) => {
      setLanguage(getLanguageFromLocale(locale))
    })
    void window.api.getAppVersion().then(setAppVersion)
    void window.api.checkForUpdates().then((info) => {
      if (!info?.updateAvailable) return
      setUpdateInfo(info)
      setUpdateBadgeVisible(
        localStorage.getItem(`dn-studio-update-seen-${info.latestVersion}`) !== '1'
      )
    })
  }, [])

  const openUpdatePanel = (): void => {
    if (!updateInfo) return
    setUpdatePanelOpen(true)
    setUpdateBadgeVisible(false)
    localStorage.setItem(`dn-studio-update-seen-${updateInfo.latestVersion}`, '1')
  }
  const [step, setStep] = useState<Step>(1)

  const [m, setM] = useState<CourseMetadata>({
    courseName: '',
    shortDescription: '',
    courseIntroduction: '',
    keywords: '',
    courseImage: null,
    courseTheme: 'default',
    scormVersion: '1.2',
    successMode: 'onComplete'
  })
  const [docxPath, setDocxPath] = useState<string | null>(null)
  const [npmAvailable, setNpmAvailable] = useState<boolean | null>(null)
  const [npmVersion, setNpmVersion] = useState<string | null>(null)

  const [tree, setTree] = useState<Tree | null>(null)
  // themesByBlock[`${capId}_${lessonId}`][blockIndex] = themeKey
  const [themesByBlock, setThemesByBlock] = useState<Record<string, Record<number, string>>>({})
  const [allBlocksTheme, setAllBlocksTheme] = useState('')
  const [parseError, setParseError] = useState<string>('')

  const [phase, setPhase] = useState<Phase>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [finalZipPath, setFinalZipPath] = useState<string>('')
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState('')

  useEffect(() => {
    void window.api.checkNpm().then((r) => {
      setNpmAvailable(r.available)
      setNpmVersion(r.version)
    })
  }, [])

  useEffect(() => {
    const off = window.api.onBuildLog((line) => {
      setLogs((prev) => [...prev, line])
      setExportStatus(cleanProgressMessage(line))
      setExportProgress((current) =>
        Math.min(92, current + Math.max(2, Math.ceil((92 - current) / 8)))
      )
    })
    return off
  }, [])

  const update = <K extends keyof CourseMetadata>(k: K, v: CourseMetadata[K]): void =>
    setM((prev) => ({ ...prev, [k]: v }))

  const isWorking = phase === 'parsing' || phase === 'generating' || phase === 'building'

  const handlePickDocx = async (): Promise<void> => {
    const p = await window.api.pickDocx()
    if (p) {
      setDocxPath(p)
      setTree(null)
      setThemesByBlock({})
      setAllBlocksTheme('')
    }
  }

  const handlePickImage = async (): Promise<void> => {
    const p = await window.api.pickImage()
    if (p) update('courseImage', p)
  }

  const canGoToStep2 =
    m.courseName.trim() !== '' && docxPath !== null && npmAvailable === true && !isWorking

  const handleGoToReview = async (): Promise<void> => {
    if (!docxPath) return
    setPhase('parsing')
    setParseError('')
    const result = await window.api.parseDocx({ docxPath })
    if (!result.ok) {
      setParseError(result.error)
      setPhase('error')
      return
    }
    setTree(result.tree as Tree)
    setPhase('idle')
    setStep(2)
  }

  const setBlockTheme = (lessonKey: string, blockIdx: number, themeKey: string): void => {
    setAllBlocksTheme('')
    setThemesByBlock((prev) => {
      const next = { ...prev }
      const lessonMap = { ...(next[lessonKey] || {}) }
      if (themeKey === 'default') delete lessonMap[blockIdx]
      else lessonMap[blockIdx] = themeKey
      next[lessonKey] = lessonMap
      return next
    })
  }

  const applyThemeToLesson = (lesson: TreeLesson, themeKey: string): void => {
    setAllBlocksTheme('')
    setThemesByBlock((prev) => {
      const next = { ...prev }
      const key = `${lesson.chapterId}_${lesson.lessonId}`
      if (themeKey === 'default') {
        delete next[key]
      } else {
        const lessonMap: Record<number, string> = {}
        lesson.blocks.forEach((_, i) => (lessonMap[i] = themeKey))
        next[key] = lessonMap
      }
      return next
    })
  }

  const applyThemeToAll = (themeKey: string): void => {
    if (!tree) return
    setAllBlocksTheme(themeKey)
    setThemesByBlock(() => {
      if (themeKey === 'default') return {}
      const next: Record<string, Record<number, string>> = {}
      for (const ch of tree.chapters) {
        for (const ls of ch.lessons) {
          const key = `${ch.id}_${ls.lessonId}`
          const lessonMap: Record<number, string> = {}
          ls.blocks.forEach((_, i) => (lessonMap[i] = themeKey))
          next[key] = lessonMap
        }
      }
      return next
    })
  }

  const handleExport = async (target: 'scorm' | 'web'): Promise<void> => {
    if (!docxPath) return

    const slug = slugify(m.courseName) || 'curso'
    const suggested = `${slug}-${target}.zip`
    const destZipPath = await window.api.saveScormZip(suggested)
    if (!destZipPath) return

    setLogs([])
    setErrorMsg('')
    setFinalZipPath('')
    setExportProgress(8)
    setExportStatus(t.generatingLessonFiles)
    setPhase('generating')

    const metadata = {
      courseId: slug,
      courseName: m.courseName,
      shortDescription: m.shortDescription,
      courseIntroduction: m.courseIntroduction
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      keywords: m.keywords
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      courseImage: m.courseImage,
      courseTheme: m.courseTheme || 'default',
      scormVersion: m.scormVersion,
      successMode: m.successMode
    }

    setLogs((p) => [...p, '▶ Aplicando temas e gerando arquivos da lição...'])
    const genResult = await window.api.generateLessonFiles({
      metadata,
      docxPath,
      themesByBlock
    })

    if (!genResult.ok) {
      setErrorMsg(`Falha ao gerar arquivos da lição: ${genResult.error}`)
      setPhase('error')
      return
    }
    setLogs((p) => [
      ...p,
      `✓ ${genResult.lessonPaths.length} lição(ões) escrita(s)`,
      `✓ ${genResult.imagesCopied} imagem(ns) extraída(s)`
    ])
    setExportProgress(40)
    setExportStatus(t.packagingCourse)

    setPhase('building')
    const buildPayload = { destZipPath, metadata }

    const buildResult =
      target === 'scorm'
        ? await window.api.buildScorm(buildPayload)
        : await window.api.buildWeb(buildPayload)

    if (!buildResult.ok) {
      setErrorMsg(`Falha ao gerar pacote ${target}: ${buildResult.error}`)
      setPhase('error')
      return
    }
    setFinalZipPath(buildResult.finalZipPath)
    setExportProgress(100)
    setPhase('done')
  }

  const handleOpenZip = async (): Promise<void> => {
    if (finalZipPath) await window.api.openPath(finalZipPath)
  }

  const handleStartOver = (): void => {
    setStep(1)
    setPhase('idle')
    setLogs([])
    setErrorMsg('')
    setFinalZipPath('')
    setExportProgress(0)
    setExportStatus('')
    setAllBlocksTheme('')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <img src={appIcon} alt="DiscereNow Studio" className="app-logo" />
          <div>
            <div className="app-title-row">
              <h1>DiscereNow Studio</h1>
              {appVersion &&
                (updateInfo ? (
                  <button type="button" className="app-version" onClick={openUpdatePanel}>
                    v{appVersion}
                  </button>
                ) : (
                  <span className="app-version">v{appVersion}</span>
                ))}
              {updateBadgeVisible && (
                <button type="button" className="app-update-badge" onClick={openUpdatePanel}>
                  {t.updateBadge}
                </button>
              )}
            </div>
            <p className="subtitle">{t.appSubtitle}</p>
          </div>
        </div>
        {updatePanelOpen && updateInfo && (
          <aside className="app-update-panel">
            <div className="app-update-panel-heading">
              <strong>{t.updateAvailable}</strong>
              <button
                type="button"
                className="app-update-close"
                aria-label={t.closeUpdate}
                onClick={() => setUpdatePanelOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="app-update-version">
              v{appVersion} → v{updateInfo.latestVersion}
            </p>
            <p>{updateInfo.releaseName}</p>
            {updateInfo.publishedAt && (
              <time dateTime={updateInfo.publishedAt}>
                {new Intl.DateTimeFormat(language === 'pt' ? 'pt-BR' : 'en', {
                  dateStyle: 'medium'
                }).format(new Date(updateInfo.publishedAt))}
              </time>
            )}
            <button
              type="button"
              className="generate-btn app-update-download"
              onClick={() => void window.api.openLatestRelease()}
            >
              {t.downloadUpdate}
            </button>
          </aside>
        )}
      </header>

      <div
        className={`alert ${npmAvailable === false ? 'alert-error' : npmAvailable === true ? 'alert-success' : 'alert-info'}`}
      >
        {npmAvailable === null && (
          <>
            <strong>{t.checkingNpm}</strong>
            <p>{t.checkingNpmHelp}</p>
          </>
        )}

        {npmAvailable === true && (
          <>
            <strong>{t.npmFound}</strong>
            <p>
              {t.npmFoundHelpBefore} <code>npm {npmVersion}</code> {t.npmFoundHelpAfter}
            </p>
          </>
        )}

        {npmAvailable === false && (
          <>
            <strong>{t.npmMissing}</strong>
            <p>
              {t.npmHelpBefore} <code>npm</code> {t.npmHelpAfter}
            </p>
            <a href="https://nodejs.org/" target="_blank" rel="noreferrer">
              {t.downloadNode}
            </a>
          </>
        )}
      </div>

      <div className="stepper">
        <span className={`step ${step === 1 ? 'is-current' : step > 1 ? 'is-done' : ''}`}>
          1. {t.stepInfo}
        </span>
        <span className="step-sep">›</span>
        <span className={`step ${step === 2 ? 'is-current' : step > 2 ? 'is-done' : ''}`}>
          2. {t.stepReviewBlocks}
        </span>
        <span className="step-sep">›</span>
        <span className={`step ${step === 3 ? 'is-current' : ''}`}>3. {t.stepExport}</span>
      </div>

      <main>
        {step === 1 && (
          <>
            <section className="form-section">
              <h2>{t.courseInfo}</h2>

              <label className="field">
                <span>
                  {t.courseName} <em>*</em>
                </span>
                <input
                  type="text"
                  value={m.courseName}
                  onChange={(e) => update('courseName', e.target.value)}
                  placeholder={t.courseNamePlaceholder}
                  disabled={isWorking}
                />
              </label>

              <label className="field">
                <span>{t.shortDescription}</span>
                <input
                  type="text"
                  value={m.shortDescription}
                  onChange={(e) => update('shortDescription', e.target.value)}
                  placeholder={t.shortDescriptionPlaceholder}
                  disabled={isWorking}
                />
              </label>

              <label className="field">
                <span>
                  {t.courseIntroduction} <small>{t.oneParagraphPerLine}</small>
                </span>
                <textarea
                  rows={5}
                  value={m.courseIntroduction}
                  onChange={(e) => update('courseIntroduction', e.target.value)}
                  placeholder={t.courseIntroductionPlaceholder}
                  disabled={isWorking}
                />
              </label>

              <label className="field">
                <span>
                  {t.keywords} <small>{t.commaSeparated}</small>
                </span>
                <input
                  type="text"
                  value={m.keywords}
                  onChange={(e) => update('keywords', e.target.value)}
                  placeholder={t.keywordsPlaceholder}
                  disabled={isWorking}
                />
              </label>

              <div className="field">
                <span>{t.coverImage}</span>
                <div className="file-picker">
                  <button type="button" onClick={handlePickImage} disabled={isWorking}>
                    {m.courseImage ? t.replaceImage : t.selectImage}
                  </button>
                  {m.courseImage && <span className="file-path">{m.courseImage}</span>}
                </div>
              </div>

              <div className="field-row">
                <label className="field">
                  <span>{t.scormVersion}</span>
                  <select
                    value={m.scormVersion}
                    onChange={(e) => update('scormVersion', e.target.value as ScormVersion)}
                    disabled={isWorking}
                  >
                    <option value="1.2">SCORM 1.2</option>
                    <option value="2004">SCORM 2004</option>
                  </select>
                </label>

                <label className="field">
                  <span>{t.successMode}</span>
                  <select
                    value={m.successMode}
                    onChange={(e) => update('successMode', e.target.value as SuccessMode)}
                    disabled={isWorking}
                  >
                    <option value="onComplete">{t.successOnComplete}</option>
                    <option value="onScore">{t.successOnScore}</option>
                    <option value="none">{t.successNone}</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="form-section">
              <h2>{t.wordDocument}</h2>
              <p className="section-help">
                {t.selectDocxHelpBefore} <code>.docx</code> {t.selectDocxHelpAfter}
              </p>
              <div className="file-picker">
                <button type="button" onClick={handlePickDocx} disabled={isWorking}>
                  {docxPath ? t.replaceFile : t.selectDocx}
                </button>
                {docxPath && <span className="file-path">{docxPath}</span>}
              </div>
            </section>

            <div className="wizard-nav">
              <button
                type="button"
                className="generate-btn"
                disabled={!canGoToStep2}
                onClick={handleGoToReview}
              >
                {phase === 'parsing' ? t.readingDocument : t.goToReview}
              </button>
              {parseError && (
                <p className="alert alert-error" style={{ marginTop: 12 }}>
                  {parseError}
                </p>
              )}
            </div>
          </>
        )}

        {step === 2 && tree && (
          <>
            <section className="form-section">
              <div className="course-theme-row">
                <span>{t.courseVisualTheme}</span>
                <ThemeSelect
                  value={m.courseTheme}
                  labels={t}
                  onChange={(value) => update('courseTheme', value)}
                />
              </div>

              <div className="review-header">
                <h2>{t.reviewBlocks}</h2>
                <div className="review-mass-apply">
                  <span>{t.applyThemeToAll}</span>
                  <ThemeSelect
                    value={allBlocksTheme}
                    placeholder={t.chooseTheme}
                    labels={t}
                    onChange={applyThemeToAll}
                  />
                </div>
              </div>

              <p className="section-help">{t.themeHelp}</p>

              {tree.chapters.map((chapter) => (
                <div key={chapter.id} className="review-chapter">
                  <div className="review-chapter-title">
                    {t.chapter} {chapter.id} — {chapter.chapterName}
                  </div>

                  {chapter.lessons.map((lesson) => {
                    const lessonKey = `${chapter.id}_${lesson.lessonId}`

                    return (
                      <details key={lesson.lessonId} className="review-lesson">
                        <summary className="review-lesson-summary">
                          <span>
                            {t.lesson} {lesson.lessonId} — {lesson.name}
                          </span>
                          <span className="review-lesson-count">
                            {lesson.blocks.length} {t.blocks}
                          </span>
                        </summary>

                        <div className="review-lesson-content">
                          <div className="review-lesson-header">
                            <span className="review-lesson-help">{t.lessonThemeHelp}</span>

                            <ThemeSelect
                              value=""
                              placeholder={t.applyTheme}
                              labels={t}
                              onChange={(value) => applyThemeToLesson(lesson, value)}
                            />
                          </div>

                          <div className="review-blocks">
                            {lesson.blocks.map((block, i) => {
                              const currentTheme = themesByBlock[lessonKey]?.[i] || 'default'

                              return (
                                <div key={i} className="review-block">
                                  <div className="review-block-icon">
                                    {blockIcon(block.blockType)}
                                  </div>
                                  <span className="review-block-label">{blockLabel(block, t)}</span>
                                  <ThemeSelect
                                    value={currentTheme}
                                    labels={t}
                                    onChange={(value) => setBlockTheme(lessonKey, i, value)}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </details>
                    )
                  })}
                </div>
              ))}
            </section>

            <div className="wizard-nav">
              <button type="button" onClick={() => setStep(1)}>
                {t.back}
              </button>
              <button type="button" className="generate-btn" onClick={() => setStep(3)}>
                {t.goToExport}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <section className="form-section">
            <h2>{t.exportCourse}</h2>

            {phase === 'idle' && (
              <>
                <div className="export-grid">
                  <button
                    type="button"
                    className="export-btn export-btn-primary"
                    onClick={() => handleExport('scorm')}
                  >
                    <span className="export-btn-title">{t.exportScorm}</span>
                    <span className="export-btn-desc">{t.exportScormDesc}</span>
                  </button>

                  <button type="button" className="export-btn" onClick={() => handleExport('web')}>
                    <span className="export-btn-title">{t.exportWeb}</span>
                    <span className="export-btn-desc">{t.exportWebDesc}</span>
                  </button>
                </div>

                <div className="wizard-nav">
                  <button type="button" onClick={() => setStep(2)}>
                    {t.backToReview}
                  </button>
                </div>
              </>
            )}

            {(phase === 'generating' || phase === 'building') && (
              <div className="export-progress-card">
                <div className="export-progress-heading">
                  <strong>
                    {phase === 'generating' ? t.generatingLessonFiles : t.packagingCourse}
                  </strong>
                  <span>{exportProgress}%</span>
                </div>
                <div
                  className="export-progress-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={exportProgress}
                >
                  <div className="export-progress-fill" style={{ width: `${exportProgress}%` }} />
                </div>
                <p className="export-progress-status">{exportStatus}</p>
              </div>
            )}

            {phase === 'done' && (
              <>
                <div className="alert alert-success">
                  <strong>{t.packageGeneratedSuccess}</strong>
                  <p>
                    {t.savedIn} <code>{finalZipPath}</code>
                  </p>
                </div>

                <div className="action-row">
                  <button type="button" onClick={handleOpenZip}>
                    {t.openFileLocation}
                  </button>
                  <button type="button" className="generate-btn" onClick={handleStartOver}>
                    {t.startOver}
                  </button>
                </div>

                <details style={{ marginTop: 12 }}>
                  <summary className="section-help">{t.viewGenerationLog}</summary>
                  <pre className="status-box">{logs.join('\n')}</pre>
                </details>
              </>
            )}

            {phase === 'error' && (
              <>
                <div className="alert alert-error">
                  <strong>{t.somethingWentWrong}</strong>
                  <p>{errorMsg}</p>
                </div>
                <button type="button" className="generate-btn" onClick={handleStartOver}>
                  {t.tryAgain}
                </button>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
