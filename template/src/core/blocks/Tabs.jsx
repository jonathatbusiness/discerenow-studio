import { useState, useEffect, useRef } from 'react'
import blockThemes from '../../theme/blockThemes'
import RichText from '../../components/RichText'
import './Tabs.css'
import { FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const renderContent = (content = []) => {
  const elements = []

  for (let index = 0; index < content.length; index += 1) {
    const entry = content[index]

    if (typeof entry === 'object' && entry?.type === 'bullet') {
      const items = []
      let cursor = index
      while (
        cursor < content.length &&
        typeof content[cursor] === 'object' &&
        content[cursor]?.type === 'bullet'
      ) {
        items.push(content[cursor].text)
        cursor += 1
      }
      elements.push(
        <ul className="tab-content-list" key={`list-${index}`}>
          {items.map((text, itemIndex) => (
            <RichText as="li" html={text} key={itemIndex} />
          ))}
        </ul>
      )
      index = cursor - 1
    } else {
      elements.push(<RichText as="p" html={entry} key={`paragraph-${index}`} />)
    }
  }

  return elements
}

const Tabs = ({ theme, textAlign, fontSize, items }) => {
  const { backgroundColor, boldColor, buttonColor } = blockThemes[theme] || blockThemes.default

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
    tabsHeaderRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    tabsHeaderRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
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

    checkScroll()
    window.addEventListener('resize', checkScroll)

    return () => window.removeEventListener('resize', checkScroll)
  }, [items])

  return (
    <>
      <div
        className="tabs-block-container"
        style={{ backgroundColor, '--btn-bg': buttonColor, '--bold-color': boldColor }}
      >
        <div className="tabs-block">
          {showScrollButtons && (
            <button className="scroll-button left" onClick={scrollLeft} aria-label="Abas anteriores">
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
                <RichText html={item.title} />
              </button>
            ))}
          </div>
          {showScrollButtons && (
            <button className="scroll-button right" onClick={scrollRight} aria-label="Próximas abas">
              <FaChevronRight />
            </button>
          )}
        </div>
        <div className="tabs-block-content">
          <div className="tab-content" style={{ textAlign, fontSize }}>
            {renderContent(items[activeIndex].content)}

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
