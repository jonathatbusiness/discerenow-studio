import React, { useState, useEffect, useRef } from 'react'
import Footer from '../components/Footer'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import courseData from '../content/courseData'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignLeft } from '@fortawesome/free-solid-svg-icons'
import { FaBars, FaSpinner } from 'react-icons/fa'
import { chapters as importedChapters } from '../content/chapters/Chapters'
import { syncToSuspend } from '../utils/scormSync'

import './Lesson.css'
import courseThemes from '../theme/courseThemes'

import LZW from '../utils/lzw'
import { restoreFromSuspend } from '../utils/scormSync'

import { blocksMap } from '../core/blocks/blocksIndex'

const courseId = courseData.courseId
const keyPrefix = `${courseId}_`
const storage = {
  get: (key) => localStorage.getItem(`${keyPrefix}${key}`),
  set: (key, val) => localStorage.setItem(`${keyPrefix}${key}`, val),
  remove: (key) => localStorage.removeItem(`${keyPrefix}${key}`)
}

const isScorm12 = courseData.scormVersion === '1.2'
const totalLessons = importedChapters.reduce((sum, chap) => sum + chap.lessons.length, 0)
console.log('📚 Total de lições esperadas:', totalLessons)

const Lesson = () => {
  const { chapterId, lessonId } = useParams()
  const [chapterContent, setChapterContent] = useState(null)
  const [currentLesson, setCurrentLesson] = useState(null)

  const [chapters, setChapters] = useState([])
  const [progressMap, setProgressMap] = useState({})
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [setProgressTrigger] = useState(0)

  const scormRef = useRef(null)
  const navigate = useNavigate()
  const lessonKey = `${chapterId}_${lessonId}`
  const [showHeaderOffset, setShowHeaderOffset] = useState(true)
  const [unlockedBlocks, setUnlockedBlocks] = useState([])
  const [clickedContinueButtons, setClickedContinueButtons] = useState([])
  const [suspendRestored, setSuspendRestored] = useState(false)

  useEffect(() => {
    if (window.innerWidth > 768) {
      setSidebarVisible(true)
    }
  }, [])

  useEffect(() => {
    const waitForAPI = (retries = 5) => {
      const api = window.DiscereSCORM
      if (api) {
        api.initialize() // garante INIT
        scormRef.current = api // seta o ref
        console.log('✅ SCORM API pronta em Lesson')
      } else if (retries > 0) {
        setTimeout(() => waitForAPI(retries - 1), 100)
      } else {
        console.warn('⚠️ SCORM API não disponível em Lesson após várias tentativas.')
      }
    }
    waitForAPI()
  }, [])

  useEffect(() => {
    const tryRestore = (retries = 5) => {
      const scorm = window.DiscereSCORM

      if (scorm?.isActive) {
        console.log('🔄 SCORM ativo — restaurando progresso do suspend_data...')
        restoreFromSuspend(() => setSuspendRestored(true))
      } else if (!scorm && retries > 0) {
        setTimeout(() => tryRestore(retries - 1), 100)
      } else {
        console.log('🌐 Ambiente web — nenhum SCORM detectado.')
        setSuspendRestored(true)
      }
    }

    tryRestore()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      setShowHeaderOffset(scrollTop < 70) // se rolou +70px, tira o espaço
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    window.__navigatingInternally__ = false
  }, [])

  const getNextLesson = (chapters, currentChapterId, currentLessonId) => {
    const flatLessons = chapters.flatMap((chap) =>
      chap.lessons.map((les) => ({ chapterId: chap.id, lessonId: les.id }))
    )

    const index = flatLessons.findIndex(
      (l) => l.chapterId === currentChapterId && l.lessonId === currentLessonId
    )

    return index >= 0 && index < flatLessons.length - 1 ? flatLessons[index + 1] : null
  }

  const renderBlock = (block, i) => {
    const Component = blocksMap[block.blockType]
    if (!Component) return null

    // Tratamento especial para continueButton
    if (block.blockType === 'continueButton') {
      const totalContinueButtons = currentLesson.blocks.filter(
        (b) => b.blockType === 'continueButton'
      ).length

      const isLastContinueButton =
        currentLesson.blocks.slice(i + 1).find((b) => b.blockType === 'continueButton') ===
        undefined

      const shouldHide = totalContinueButtons > 1 && clickedContinueButtons.includes(i)

      return shouldHide ? null : (
        <Component
          key={i}
          buttonText={block.buttonText}
          isEndOfLesson={isLastContinueButton}
          onClick={() => handleContinueClick(i)}
        />
      )
    }

    // Componente padrão
    return <Component key={i} {...block} />
  }

  const saveProgress = (updatedBlocks) => {
    const raw = scormRef.current?.getDataChunk?.() || ''
    let savedData = {}

    try {
      savedData = raw ? JSON.parse(LZW.decompress(raw)) : {}
    } catch {}

    const updatedMap = {
      ...savedData,
      [lessonKey]: { seenBlocks: updatedBlocks },
      completedLessons: savedData.completedLessons || []
    }

    setProgressMap(updatedMap)

    if (!isScorm12) {
      const compressed = LZW.compress(JSON.stringify(updatedMap))
      scormRef.current?.setDataChunk(compressed)

      // Calcular progresso geral do curso
      let totalVistos = 0
      let totalBlocks = 0

      importedChapters.forEach((chap) => {
        chap.lessons.forEach((les) => {
          const key = `${chap.id}_${les.id}`
          const vistos = updatedMap[key]?.seenBlocks?.length || 0
          const blocos = les.blocks?.length || 1
          totalVistos += vistos
          totalBlocks += blocos
        })
      })

      const globalProgress = totalBlocks > 0 ? totalVistos / totalBlocks : 0
      scormRef.current?.setProgress(globalProgress)
      scormRef.current?.commit()
    }
  }

  const markLessonComplete = (lessonKey) => {
    const allLessonKeys = importedChapters.flatMap((chap) =>
      chap.lessons.map((les) => `${chap.id}_${les.id}`)
    )

    const localCompleted = JSON.parse(localStorage.getItem(`${keyPrefix}completedLessons`)) || []

    if (!localCompleted.includes(lessonKey)) {
      const updated = [...localCompleted, lessonKey]
      localStorage.setItem(`${keyPrefix}completedLessons`, JSON.stringify(updated))
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: `${keyPrefix}completedLessons`,
          newValue: JSON.stringify(updated)
        })
      )

      console.log(
        `📘 [Local] Lição concluída: ${lessonKey} | Total: ${updated.length}/${allLessonKeys.length}`
      )
    }
  }

  // ✅ Novo useEffect: detecção de conclusão total e envio ao SCORM
  useEffect(() => {
    const allLessonKeys = importedChapters.flatMap((chap) =>
      chap.lessons.map((les) => `${chap.id}_${les.id}`)
    )

    const completedLessons = JSON.parse(storage.get(`completedLessons`) || '[]')

    const allCompleted = allLessonKeys.every((key) => completedLessons.includes(key))
    console.log('🔍 Esperadas:', allLessonKeys)
    console.log('🧾 Concluídas (localStorage):', completedLessons)

    if (allCompleted) {
      console.log('✅ Todas as lições foram concluídas!')

      const api = scormRef.current || window.DiscereSCORM
      if (api && typeof api.finishCourse === 'function') {
        api.finishCourse()
      } else {
        console.warn('⚠️ SCORM API não pronta para finalizar o curso.')
      }
    }
  }, [progressMap])

  useEffect(() => {
    setChapters(importedChapters)
    window.scrollTo(0, 0)

    const chap = importedChapters.find((c) => c.id === chapterId)
    setChapterContent(chap)

    const les = chap?.lessons.find((l) => l.id === lessonId)
    setCurrentLesson(les)

    const blocks = les?.blocks || []

    const saved = storage.get(`unlocked_${lessonKey}`)

    if (saved) {
      setUnlockedBlocks(JSON.parse(saved))
    } else {
      const blocksCount = blocks.length
      let initialUnlock = []

      // Se só existe um botão e ele está no final, desbloqueie tudo
      const hasOnlyOneContinueAtEnd =
        blocks.filter((b) => b.blockType === 'continueButton').length === 1 &&
        blocks[blocksCount - 1]?.blockType === 'continueButton'

      if (hasOnlyOneContinueAtEnd) {
        initialUnlock = blocks.map((_, i) => i) // desbloqueia tudo
      } else {
        for (let i = 0; i < blocksCount; i++) {
          initialUnlock.push(i)
          if (blocks[i].blockType === 'continueButton') break
        }
      }

      setUnlockedBlocks(initialUnlock)
    }

    const savedClicked = storage.get(`clickedBtns_${lessonKey}`)

    if (savedClicked) {
      setClickedContinueButtons(JSON.parse(savedClicked))
    }
  }, [chapterId, lessonId])

  useEffect(() => {
    if (lessonKey && clickedContinueButtons.length) {
      localStorage.setItem(`clickedBtns_${lessonKey}`, JSON.stringify(clickedContinueButtons))
    }
  }, [clickedContinueButtons, lessonKey])

  useEffect(() => {
    // Sempre que mudar de lição, volta ao topo e limpa flag interna
    window.scrollTo(0, 0)
    sessionStorage.removeItem('internalNav')
    window.__navigatingInternally__ = false
  }, [chapterId, lessonId])

  useEffect(() => {
    return () => {
      sessionStorage.removeItem('internalNav')
      window.__navigatingInternally__ = false
    }
  }, [])

  useEffect(() => {
    if (!currentLesson || currentLesson.blocks.length === 0) return

    const seen = progressMap[lessonKey]?.seenBlocks || []
    if (!seen.includes(0)) {
      const updated = [0, ...seen].sort((a, b) => a - b)
      saveProgress(updated)

      const progressoAtual = updated.length / currentLesson.blocks.length
      const progressoSalvo = scormRef.current?.getProgress?.() || 0
      if (!isScorm12 && progressoAtual > progressoSalvo) {
        scormRef.current?.setProgress(progressoAtual)
      }

      scormRef.current?.commit()
    }
  }, [currentLesson, progressMap])

  useEffect(() => {
    if (unlockedBlocks.length && lessonKey) {
      storage.set(`unlocked_${lessonKey}`, JSON.stringify(unlockedBlocks))
    }
  }, [unlockedBlocks, lessonKey])

  useEffect(() => {
    return () => {
      sessionStorage.removeItem('internalNav')
    }
  }, [])

  if (!suspendRestored || !chapterContent || !currentLesson) {
    return (
      <div className="loading-overlay">
        <FaSpinner size={48} className="loading-icon" />
        <span className="loading-text">Loading lesson content...</span>
      </div>
    )
  }

  const handleContinueClick = (index) => {
    const blocks = currentLesson.blocks
    const isLast = index === blocks.length - 1

    if (isLast) {
      const nextLesson = getNextLesson(chapters, chapterId, lessonId)
      sessionStorage.setItem('internalNav', 'true')
      window.__navigatingInternally__ = true

      if (nextLesson) {
        navigate(`/lesson/${nextLesson.chapterId}/${nextLesson.lessonId}`)
      } else {
        navigate('/')
      }

      return
    }

    let newUnlocked = [...unlockedBlocks]
    for (let i = index + 1; i < blocks.length; i++) {
      newUnlocked.push(i)
      if (blocks[i].blockType === 'continueButton') break
    }

    const uniqueSorted = [...new Set(newUnlocked)].sort((a, b) => a - b)
    setUnlockedBlocks(uniqueSorted)

    const updated = [...new Set([...clickedContinueButtons, index])]
    setClickedContinueButtons(updated)
    storage.set(`clickedBtns_${lessonKey}`, JSON.stringify(updated))

    setProgressTrigger((p) => p + 1)

    setTimeout(() => {
      const nextBlockIndex = uniqueSorted.find((i) => i > index)
      const nextEl = document.getElementById(`block-${nextBlockIndex}`)
      if (nextEl) {
        const offset = 100 // ajuste conforme altura do cabeçalho ou visual ideal
        const top = nextEl.getBoundingClientRect().top + window.pageYOffset - offset

        window.scrollTo({ top, behavior: 'smooth' })
      }
    }, 0)
  }

  const themeId = courseData.courseTheme || 'default'
  const theme = courseThemes[themeId] || courseThemes['default']

  const onViewportEnter = (index) => {
    const seen = progressMap[lessonKey]?.seenBlocks || []

    let updated = [...seen]

    if (!seen.includes(index)) {
      updated = [...seen, index].sort((a, b) => a - b)
      storage.set(`seen_${lessonKey}`, JSON.stringify(updated))

      const prevProgress = parseInt(storage.get(`progress_${lessonKey}`)) || 0
      const computedProgress = Math.floor((updated.length / currentLesson.blocks.length) * 100)
      const finalProgress = Math.max(prevProgress, computedProgress)

      if (window.DiscereSCORM?.isActive) {
        const milestones = [33, 66, 100]
        milestones.forEach((threshold) => {
          if (finalProgress >= threshold && prevProgress < threshold) {
            syncToSuspend(lessonKey, threshold)
          }
        })
      }

      storage.set(`progress_${lessonKey}`, finalProgress)
      storage.set(`courseProgress`, JSON.stringify({ chapterId, lessonId }))
      storage.set(`scrollPos_${lessonKey}`, index)
    }

    const totalBlocks = currentLesson.blocks.length

    if (updated.length >= totalBlocks) {
      console.log(`📥 Detecção: todos os blocos da lição ${lessonKey} foram vistos.`)
      markLessonComplete(lessonKey)
      if (window.DiscereSCORM?.isActive) {
        syncToSuspend(lessonKey, 100)
      }

      // 🔄 Força Home a atualizar imediatamente mesmo na mesma aba
      sessionStorage.setItem('updateHomeChapters', 'true')

      setProgressMap((prev) => ({
        ...prev,
        [lessonKey]: { seenBlocks: updated },
        completedLessons: prev.completedLessons || []
      }))
      return
    }

    if (index === totalBlocks - 1 && updated.length < totalBlocks) {
      const allSeenBlocks = Array.from({ length: totalBlocks }, (_, i) => i)
      console.warn('⚠️ Corrigindo blocos não marcados como vistos automaticamente.')
      saveProgress(allSeenBlocks)
      storage.set(`progress_${lessonKey}`, 100) // atualiza barra
      markLessonComplete(lessonKey) // ✅ garante que apareça como concluída
      if (window.DiscereSCORM?.isActive) {
        syncToSuspend(lessonKey, 100)
      }

      storage.set(`seen_${lessonKey}`, JSON.stringify(allSeenBlocks))
    } else {
      // Atualiza o mapa normalmente, se ainda não estiver completo
      setProgressMap((prev) => ({
        ...prev,
        [lessonKey]: { seenBlocks: updated },
        completedLessons: prev.completedLessons || []
      }))
    }
  }

  return (
    <div className={`lesson-body ${!showHeaderOffset ? 'scrolled' : ''}`}>
      <div
        className={`lesson-container ${!sidebarVisible ? 'sidebar-hidden' : ''}`}
        style={{
          transition: 'margin-left 0.4s ease',
          marginLeft: window.innerWidth > 1050 ? (sidebarVisible ? 300 : 0) : 0
        }}
      >
        <button
          className="toggle-sidebar-btn"
          style={{
            left: sidebarVisible ? 310 : 10,
            transition: 'left 0.4s ease',
            position: 'fixed',
            color: '#213547',
            zIndex: 11
          }}
          onClick={() => setSidebarVisible((prev) => !prev)}
        >
          <FaBars />
        </button>

        {/* Sidebar fixa fora do fluxo principal */}
        <motion.div
          className="lesson-navigation"
          initial={false}
          animate={{ x: sidebarVisible ? 0 : -300 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed',
            top: 70,
            left: 0,
            zIndex: 5
          }}
        >
          <div className="chapter-lessons">
            <div
              className="nav-header"
              onClick={() => navigate('/')}
              style={{
                '--cover-image': courseData.courseImage ? `url(${courseData.courseImage})` : 'none',
                backgroundColor: theme.navColor,
                color: theme.fontColor
              }}
            >
              <h3>{courseData.courseName || 'Untitled Course'}</h3>
            </div>
            <div className="nav-lessons">
              {chapters.map((chapter) => (
                <div key={chapter.id}>
                  <div className="chapter-title">
                    <h4>{chapter.chapterName}</h4>
                  </div>

                  {chapter.lessons.map((lesson) => {
                    const lessonKey = `${chapter.id}_${lesson.id}`
                    const percent = parseInt(storage.get(`progress_${lessonKey}`)) || 0
                    const isCompleted = percent === 100

                    return (
                      <div
                        key={lesson.id}
                        className={`lesson-nav-item ${
                          chapter.id === chapterId && lesson.id === lessonId ? 'active' : ''
                        }`}
                        onClick={() => navigate(`/lesson/${chapter.id}/${lesson.id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <FontAwesomeIcon icon={faAlignLeft} style={{ marginRight: '10px' }} />
                          {lesson.name}
                        </div>

                        <div style={{ width: 30, height: 30 }}>
                          {Number.isFinite(percent) && (
                            <CircularProgressbar
                              value={percent}
                              text={isCompleted ? '✓' : `${percent}`}
                              styles={buildStyles({
                                pathColor: isCompleted ? 'green' : '#007bff',
                                textColor: isCompleted ? 'green' : '#333',
                                trailColor: '#eee',
                                textSize: '28px'
                              })}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Área da lição que expande/encolhe */}
        <div className="lesson-area">
          <div className="lesson-header" style={{ background: theme.headerGradient }}>
            <h2 style={{ color: theme.fontColor }}>{currentLesson.name}</h2>
          </div>
          <div className="lesson-content">
            {currentLesson.blocks.map((block, index) =>
              unlockedBlocks.includes(index) ? (
                <motion.div
                  key={index}
                  id={`block-${index}`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.6 }}
                  onViewportEnter={() => onViewportEnter(index)}
                >
                  {renderBlock(block, index)}
                </motion.div>
              ) : null
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Lesson
