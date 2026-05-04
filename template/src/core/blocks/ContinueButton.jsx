import './ContinueButton.css'
import blockThemes from '../../theme/blockThemes'
import courseData from '../../content/courseData'

const ContinueButton = ({ buttonText = 'Continuar', onClick, isEndOfLesson = false }) => {
  const themeName = courseData.courseTheme || 'default'
  const { buttonColor } = blockThemes[themeName] || blockThemes.default

  return (
    <button
      className="continue-button"
      onClick={() => onClick(isEndOfLesson)}
      style={{ backgroundColor: buttonColor }}
    >
      {buttonText}
    </button>
  )
}

export default ContinueButton
