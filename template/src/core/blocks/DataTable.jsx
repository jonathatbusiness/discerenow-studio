import { useEffect, useRef, useState } from 'react'
import blockThemes from '../../theme/blockThemes'
import RichText from '../../components/RichText'
import './DataTable.css'

const DataTable = ({ rows = [], theme, textAlign, fontSize }) => {
  const colors = blockThemes[theme] || blockThemes.default
  const [headers = [], ...bodyRows] = rows
  const columnCount = Math.max(headers.length, ...bodyRows.map((row) => row.length), 1)
  const scrollRef = useRef(null)
  const [hasMoreRight, setHasMoreRight] = useState(false)

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return undefined

    const updateIndicator = () => {
      const remaining =
        scrollElement.scrollWidth - scrollElement.clientWidth - scrollElement.scrollLeft
      setHasMoreRight(remaining > 2 && scrollElement.scrollLeft <= 2)
    }

    updateIndicator()
    const resizeObserver = new ResizeObserver(updateIndicator)
    resizeObserver.observe(scrollElement)
    resizeObserver.observe(scrollElement.firstElementChild)

    return () => resizeObserver.disconnect()
  }, [rows])

  return (
    <section
      className="block-data-table"
      style={{ backgroundColor: colors.backgroundColor, color: colors.fontColor }}
    >
      <div className="block-data-table__viewport">
        <div
          className="block-data-table__scroll"
          ref={scrollRef}
          onScroll={() => {
            const element = scrollRef.current
            if (!element) return
            const remaining = element.scrollWidth - element.clientWidth - element.scrollLeft
            setHasMoreRight(remaining > 2 && element.scrollLeft <= 2)
          }}
        >
          <table style={{ fontSize, '--table-columns': columnCount }}>
            <thead>
              <tr>
                {headers.map((cell, index) => (
                  <RichText
                    as="th"
                    html={cell}
                    key={index}
                    style={{ backgroundColor: colors.buttonColor, textAlign }}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <RichText as="td" html={cell} key={cellIndex} style={{ textAlign }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMoreRight ? (
          <div className="block-data-table__more" aria-hidden="true">
            <span>Swipe</span>
            <span className="block-data-table__more-arrow">→</span>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default DataTable
