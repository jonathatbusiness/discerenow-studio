import { useState } from 'react'
import blockThemes from '../../theme/blockThemes'
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

  const { backgroundColor, fontColor, boldColor } = blockThemes[theme] || blockThemes.default

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
                        {item.title && <h4 style={{ fontSize, textAlign }}>{item.title}</h4>}
                        {item.content && <p style={{ fontSize, textAlign }}>{item.content}</p>}
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
                          <h4 style={{ fontSize, textAlign }}>{item.backTitle}</h4>
                        )}
                        {item.backContent && (
                          <p style={{ fontSize, textAlign }}>{item.backContent}</p>
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
