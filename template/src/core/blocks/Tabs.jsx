import { useState, useEffect, useRef } from 'react'
import blockThemes from '../../theme/blockThemes'
import './Tabs.css'
import { FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const Tabs = ({ theme, textAlign, fontSize, items }) => {
  const { backgroundColor, fontColor, boldColor, buttonColor } =
    blockThemes[theme] || blockThemes.default

  const [activeIndex, setActiveIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [modalImage, setModalImage] = useState('')

  const handleZoom = (img) => {
    setModalImage(img)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalImage('')
  }

  const scrollLeft = () => {
    document.querySelector('.tabs-header').scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    document.querySelector('.tabs-header').scrollBy({ left: 200, behavior: 'smooth' })
  }

  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const tabsHeaderRef = useRef(null)

  useEffect(() => {
    const checkScroll = () => {
      if (tabsHeaderRef.current) {
        const { scrollWidth, clientWidth } = tabsHeaderRef.current
        setShowScrollButtons(scrollWidth > clientWidth)
      }
    }

    checkScroll() // Verifica na montagem
    window.addEventListener('resize', checkScroll) // Verifica no resize

    return () => window.removeEventListener('resize', checkScroll)
  }, [])

  return (
    <>
      <div
        className="tabs-block-container"
        style={{ backgroundColor, '--btn-bg': buttonColor, '--bold-color': boldColor }}
      >
        <div className="tabs-block">
          {showScrollButtons && (
            <button className="scroll-button left" onClick={scrollLeft}>
              <FaChevronLeft />
            </button>
          )}
          <div className="tabs-header" ref={tabsHeaderRef}>
            {items.map((item, index) => (
              <button
                key={index}
                className={`tab-button ${activeIndex === index ? 'active' : ''}`}
                onClick={() => setActiveIndex(index)}
              >
                {item.title}
              </button>
            ))}
          </div>
          {showScrollButtons && (
            <button className="scroll-button right" onClick={scrollRight}>
              <FaChevronRight />
            </button>
          )}
        </div>
        <div className="tabs-block-content">
          <div className="tab-content" style={{ textAlign, fontSize, boldColor }}>
            {items[activeIndex].content.map((text, i) => (
              <p key={i}>{text}</p>
            ))}

            {items[activeIndex].img && (
              <div
                className="tab-image"
                onClick={
                  items[activeIndex].zoom === 'yes'
                    ? () => handleZoom(items[activeIndex].img)
                    : undefined
                }
                style={{
                  cursor: items[activeIndex].zoom === 'yes' ? 'zoom-in' : 'default'
                }}
              >
                <img src={items[activeIndex].img} alt={items[activeIndex].altText || ''} />
                {items[activeIndex].zoom === 'yes' && (
                  <div className="overlay-icon">
                    <FaSearch />
                  </div>
                )}
              </div>
            )}

            {items[activeIndex].subtitle && (
              <div
                className="tab-subtitle"
                style={{
                  fontSize: '14px',
                  marginTop: '8px'
                }}
              >
                {items[activeIndex].subtitle}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="img-modal" onClick={closeModal}>
          <img src={modalImage} alt="Imagem ampliada" />
        </div>
      )}
    </>
  )
}

export default Tabs
