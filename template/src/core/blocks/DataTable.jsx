import blockThemes from '../../theme/blockThemes'
import './DataTable.css'

const DataTable = ({ rows = [], theme, textAlign, fontSize }) => {
  const colors = blockThemes[theme] || blockThemes.default
  const [headers = [], ...bodyRows] = rows

  return (
    <section
      className="block-data-table"
      style={{ backgroundColor: colors.backgroundColor, color: colors.fontColor }}
    >
      <div className="block-data-table__scroll">
        <table style={{ fontSize }}>
          <thead>
            <tr>
              {headers.map((cell, index) => (
                <th key={index} style={{ backgroundColor: colors.buttonColor, textAlign }}>
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ textAlign }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default DataTable
