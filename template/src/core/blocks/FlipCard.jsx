import { useState } from 'react'
import blockThemes from '../../theme/blockThemes'
import RichText from '../../components/RichText'
import './FlipCard.css'

const FlipCard = ({ theme, textAlign, fontSize, items }) => {
  const [flipped, setFlipped] = useState([])
  const toggleFlip = (index) => {
    setFlipped((prev) => {
      const updated = [...prev]
      updated[index] = !updated[index]
      return updated
    })
  }

  const { backgroundColor } = blockThemes[theme] || blockThemes.default

  return (
    <>
      <div className="flipcard-block-container" style={{ backgroundColor }}>
        <div className="flipcard-grid-container">
          <div className="flipcard-grid">
            {items.map((item, index) => (
              <div key={index} className="flipcard-item">
                <div
                  className={`flipcard-inner ${flipped[index] ? 'flipped' : ''}`}
                  onClick={() => toggleFlip(index)}
                >
                  <div className="flipcard-front">
                    {item.img ? (
                      <div className="flipcard-image-only">
                        <img src={item.img} alt={item.altText || ''} />
                      </div>
                    ) : (
                      <>
                        {item.title && (
                          <RichText as="h4" html={item.title} style={{ fontSize, textAlign }} />
                        )}
                        {item.content && (
                          <RichText as="p" html={item.content} style={{ fontSize, textAlign }} />
                        )}
                      </>
                    )}
                  </div>

                  <div className="flipcard-back">
                    {item.backImg ? (
                      <div className="flipcard-image-only">
                        <img src={item.backImg} alt={item.backAltText || ''} />
                      </div>
                    ) : (
                      <>
                        {item.backTitle && (
                          <RichText as="h4" html={item.backTitle} style={{ fontSize, textAlign }} />
                        )}
                        {item.backContent && (
                          <RichText
                            as="p"
                            html={item.backContent}
                            style={{ fontSize, textAlign }}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default FlipCard
