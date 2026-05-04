import { useState } from 'react'
import blockThemes from '../../theme/blockThemes'
import './Quiz.css'
import { FiCheck, FiX } from 'react-icons/fi'
import { FaRedo } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

const Quiz = ({
  theme,
  textAlign,
  fontSize,
  question,
  type,
  options,
  correctAnswers,
  feedbackCorrect,
  feedbackIncorrect
}) => {
  const { backgroundColor, fontColor, boldColor, buttonColor } =
    blockThemes[theme] || blockThemes.default

  const [selected, setSelected] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleChange = (option) => {
    if (type === 'single') {
      setSelected([option])
    } else {
      if (selected.includes(option)) {
        setSelected(selected.filter((item) => item !== option))
      } else {
        setSelected([...selected, option])
      }
    }
  }

  const handleSubmit = () => {
    if (type === 'single') {
      setIsCorrect(selected[0] === correctAnswers[0])
    } else {
      const sortedSelected = [...selected].sort()
      const sortedCorrect = [...correctAnswers].sort()
      setIsCorrect(JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect))
    }
    setSubmitted(true)
  }

  const resetQuiz = () => {
    setSelected([])
    setSubmitted(false)
    setIsCorrect(false)
  }

  return (
    <div className="quiz-block-container" style={{ backgroundColor, '--btn-bg': buttonColor }}>
      <div className="quiz-block">
        <h3 style={{ textAlign, fontSize }}>{question}</h3>
        <div className="default-divider"></div>

        <div className="quiz-options" style={{ textAlign, fontSize }}>
          {options.map((option, index) => (
            <label key={index} className={`quiz-option ${submitted ? 'disabled' : ''}`}>
              <input
                type={type === 'single' ? 'radio' : 'checkbox'}
                name="quiz"
                value={option}
                checked={selected.includes(option)}
                disabled={submitted}
                onChange={() => handleChange(option)}
              />
              {option}
              {submitted && (
                <>
                  {correctAnswers.includes(option) ? (
                    <FiCheck className="option-icon correct" />
                  ) : (
                    <FiX className="option-icon incorrect" />
                  )}
                </>
              )}
            </label>
          ))}
        </div>

        {!submitted ? (
          <button className="quiz-submit" onClick={handleSubmit} disabled={selected.length === 0}>
            Submit answer
          </button>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="feedback"
              className="quiz-feedback"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="feedback-icon-container">
                {isCorrect ? (
                  <FiCheck className="feedback-icon correct" />
                ) : (
                  <FiX className="feedback-icon incorrect" />
                )}
              </div>
              <p>{isCorrect ? feedbackCorrect : feedbackIncorrect}</p>

              {!isCorrect && (
                <button className="quiz-retry" onClick={resetQuiz}>
                  <FaRedo /> Try again
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default Quiz
