import { useState } from 'react'
import blockThemes from '../../theme/blockThemes'
import './LearningList.css'

const contrastColor = (background) => {
  const hex = background?.replace('#', '')
  if (!hex || !/^[0-9a-f]{6}$/i.test(hex)) return '#fff'

  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  const darkLuminance = 0.0056
  const darkContrast = (luminance + 0.05) / (darkLuminance + 0.05)
  const lightContrast = 1.05 / (luminance + 0.05)
  return darkContrast > lightContrast ? '#111' : '#fff'
}

const LearningList = ({ blockType, items = [], theme, textAlign }) => {
  const colors = blockThemes[theme] || blockThemes.default
  const markerContrast = contrastColor(colors.buttonColor)
  const [checked, setChecked] = useState(() => new Set())

  const toggleItem = (index) => {
    setChecked((current) => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <section
      className={`block-learning-list block-learning-list--${blockType}`}
      style={{ backgroundColor: colors.backgroundColor, color: colors.fontColor }}
    >
      <div className="block-learning-list__items">
        {items.map((item, index) => {
          const isCheckbox = blockType === 'checkboxList'
          const isChecked = checked.has(index)
          return (
            <div
              className={`block-learning-list__item${isChecked ? ' is-checked' : ''}`}
              key={index}
              style={{ textAlign }}
            >
              {isCheckbox ? (
                <button
                  type="button"
                  className="block-learning-list__checkbox"
                  aria-label={`${isChecked ? 'Desmarcar' : 'Marcar'} item ${index + 1}`}
                  aria-pressed={isChecked}
                  onClick={() => toggleItem(index)}
                  style={{
                    borderColor: colors.buttonColor,
                    backgroundColor: isChecked ? colors.buttonColor : '#fff',
                    '--dn-check-color': markerContrast
                  }}
                />
              ) : (
                <span
                  className="block-learning-list__marker"
                  style={{
                    backgroundColor:
                      blockType === 'numberedList' ? colors.buttonColor : 'transparent',
                    color: blockType === 'numberedList' ? markerContrast : colors.buttonColor
                  }}
                  aria-hidden="true"
                >
                  {blockType === 'numberedList' ? index + 1 : '•'}
                </span>
              )}
              <p style={{ fontSize: item.fontSize }}>{item.text}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default LearningList
