import blockThemes from '../../theme/blockThemes'
import RichText from '../../components/RichText'
import './Columns.css'

const Columns = ({ columns = [], theme, textAlign }) => {
  const colors = blockThemes[theme] || blockThemes.default

  return (
    <section
      className="block-columns"
      style={{ backgroundColor: colors.backgroundColor, color: colors.fontColor }}
    >
      <div className="block-columns__grid" style={{ '--column-count': columns.length || 1 }}>
        {columns.map((column, index) => (
          <div className="block-columns__item" key={index} style={{ textAlign }}>
            {column.content.map((paragraph, paragraphIndex) => (
              <RichText
                as="p"
                key={paragraphIndex}
                html={paragraph}
                accentColor={colors.boldColor}
                style={{ fontSize: column.fontSize }}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Columns
