import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import blockThemes from '../../theme/blockThemes'
import './Process.css'

const contrastColor = (background) => {
  const hex = background?.replace('#', '')
  if (!hex || !/^[0-9a-f]{6}$/i.test(hex)) return '#fff'
  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  const darkContrast = (luminance + 0.05) / 0.0556
  const lightContrast = 1.05 / (luminance + 0.05)
  return darkContrast > lightContrast ? '#111' : '#fff'
}

const Process = ({ items = [], theme, textAlign }) => {
  const colors = blockThemes[theme] || blockThemes.default
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const accentText = contrastColor(colors.buttonColor)
  const counterConnector = navigator.language?.toLowerCase().startsWith('pt') ? 'de' : 'of'

  useEffect(() => {
    if (current >= items.length) setCurrent(0)
  }, [current, items.length])

  if (!items.length) return null
  const item = items[current]
  const goPrevious = () => {
    setDirection(-1)
    setCurrent((index) => Math.max(0, index - 1))
  }
  const goNext = () => {
    setDirection(1)
    setCurrent((index) => Math.min(items.length - 1, index + 1))
  }
  const goTo = (index) => {
    if (index === current) return
    setDirection(index > current ? 1 : -1)
    setCurrent(index)
  }

  return (
    <section className="block-process" style={{ backgroundColor: colors.backgroundColor }}>
      <div className="block-process__stage">
        {items.length > 1 ? (
          <button
            type="button"
            className="block-process__arrow block-process__arrow--previous"
            onClick={goPrevious}
            disabled={current === 0}
            aria-label="Passo anterior"
            style={{ backgroundColor: colors.buttonColor, color: accentText }}
          >
            <FaChevronLeft aria-hidden="true" />
          </button>
        ) : null}

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.article
            key={current}
            className="block-process__card"
            aria-live="polite"
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {item.step ? (
              <span
                className="block-process__step"
                style={{ backgroundColor: colors.buttonColor, color: accentText }}
              >
                {item.step}
              </span>
            ) : null}
            {item.title ? <h3>{item.title}</h3> : null}
            {item.image ? <img src={item.image} alt={item.altText || ''} /> : null}
            <p style={{ textAlign, fontSize: item.fontSize }}>{item.text}</p>
          </motion.article>
        </AnimatePresence>

        {items.length > 1 ? (
          <button
            type="button"
            className="block-process__arrow block-process__arrow--next"
            onClick={goNext}
            disabled={current === items.length - 1}
            aria-label="Próximo passo"
            style={{ backgroundColor: colors.buttonColor, color: accentText }}
          >
            <FaChevronRight aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav
        className="block-process__navigation"
        aria-label="Passos do processo"
        style={{ color: colors.fontColor }}
      >
        <div className="block-process__dots">
          {items.map((_, index) => (
            <button
              type="button"
              key={index}
              className={index === current ? 'is-active' : ''}
              aria-label={`Ir para o passo ${index + 1}`}
              aria-current={index === current ? 'step' : undefined}
              onClick={() => goTo(index)}
              style={{ backgroundColor: colors.buttonColor }}
            />
          ))}
        </div>
        <span className="block-process__counter">
          {current + 1} {counterConnector} {items.length}
        </span>
      </nav>
    </section>
  )
}

export default Process
