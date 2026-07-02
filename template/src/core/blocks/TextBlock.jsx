import blockThemes from '../../theme/blockThemes'
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
        <LeadTag
          className="block-text__lead"
          style={{ color: colors.boldColor, fontSize: size(standalone ? fontSize : leadFontSize) }}
        >
          {standalone ? text : lead}
        </LeadTag>
        {!standalone &&
          content.map((paragraph, index) => (
            <p
              key={index}
              style={{ fontSize: size(fontSize) }}
              dangerouslySetInnerHTML={{ __html: paragraph }}
            />
          ))}
      </div>
    </section>
  )
}

export default TextBlock
