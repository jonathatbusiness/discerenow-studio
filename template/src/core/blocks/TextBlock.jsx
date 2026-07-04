import blockThemes from '../../theme/blockThemes'
import RichText from '../../components/RichText'
import './TextBlock.css'

const size = (value) => (typeof value === 'number' ? `${value}px` : value || undefined)

const TextBlock = ({
  blockType,
  text,
  lead,
  content = [],
  theme,
  textAlign,
  fontSize,
  leadFontSize
}) => {
  const colors = blockThemes[theme] || blockThemes.default
  const standalone = blockType === 'heading' || blockType === 'subheading'
  const LeadTag = blockType === 'heading' || blockType === 'paragraphHeading' ? 'h2' : 'h3'

  return (
    <section
      className={`block-text block-text--${blockType}`}
      style={{ backgroundColor: colors.backgroundColor, color: colors.fontColor }}
    >
      <div className="block-text__inner" style={{ textAlign }}>
        <RichText
          as={LeadTag}
          className="block-text__lead"
          html={standalone ? text : lead}
          accentColor={colors.boldColor}
          style={{ color: colors.boldColor, fontSize: size(standalone ? fontSize : leadFontSize) }}
        />
        {!standalone &&
          content.map((paragraph, index) => (
            <RichText
              as="p"
              key={index}
              html={paragraph}
              accentColor={colors.boldColor}
              style={{ fontSize: size(fontSize) }}
            />
          ))}
      </div>
    </section>
  )
}

export default TextBlock
