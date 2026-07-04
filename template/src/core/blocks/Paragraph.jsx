import blockThemes from '../../theme/blockThemes'
import RichText from '../../components/RichText'
import './Paragraph.css'

const Paragraph = ({ content, theme, textAlign, fontSize }) => {
  const { backgroundColor, fontColor, boldColor } = blockThemes[theme] || blockThemes.default

  return (
    <div
      className="block-paragraph-container"
      style={{
        backgroundColor,
        color: fontColor
      }}
    >
      <div className="block-paragraph">
        {content.map((text, index) => (
          <RichText
            as="p"
            key={index}
            html={text}
            accentColor={boldColor}
            style={{
              textAlign,
              fontSize: fontSize
                ? typeof fontSize === 'number'
                  ? `${fontSize}px`
                  : fontSize
                : undefined
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default Paragraph
