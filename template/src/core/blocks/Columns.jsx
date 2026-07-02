import blockThemes from '../../theme/blockThemes'
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
              <p
                key={paragraphIndex}
                style={{ fontSize: column.fontSize }}
                dangerouslySetInnerHTML={{ __html: paragraph }}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Columns
