import { useState } from 'react'
import blockThemes from '../../theme/blockThemes'
import './Accordion.css'
import { FaPlus, FaMinus, FaSearch } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

const Accordion = ({ theme, textAlign, fontSize, items }) => {
  const { backgroundColor } = blockThemes[theme] || blockThemes.default

  const [activeIndex, setActiveIndex] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalImage, setModalImage] = useState('')

  const toggleItem = (index) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  const handleZoom = (img) => {
    setModalImage(img)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalImage('')
  }

  return (
    <>
      <div className="accordion-block-container" style={{ backgroundColor }}>
        <div className="accordion-block">
          {items.map((item, index) => (
            <div key={index} className="accordion-item">
              <div
                className="accordion-header"
                onClick={() => toggleItem(index)}
                style={{
                  textAlign
                }}
              >
                <span>{item.title}</span>
                {activeIndex === index ? <FaMinus /> : <FaPlus />}
              </div>

              <AnimatePresence initial={false}>
                {activeIndex === index && (
                  <motion.div
                    className="accordion-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  >
                    {item.content.map((text, i) => (
                      <p style={{ textAlign, fontSize }} key={i}>
                        {text}
                      </p>
                    ))}

                    {item.img && (
                      <div
                        className="accordion-image-wrapper"
                        style={{
                          cursor: item.zoom === 'yes' ? 'zoom-in' : 'default'
                        }}
                        onClick={item.zoom === 'yes' ? () => handleZoom(item.img) : undefined}
                      >
                        <img src={item.img} alt={item.altText || ''} />
                        {item.zoom === 'yes' && (
                          <div className="overlay-icon">
                            <FaSearch />
                          </div>
                        )}
                      </div>
                    )}

                    {item.subtitle && (
                      <div
                        className="accordion-subtitle"
                        style={{
                          fontSize: '14px',
                          marginTop: '8px'
                        }}
                      >
                        {item.subtitle}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
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

export default Accordion
