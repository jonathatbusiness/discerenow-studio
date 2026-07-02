import blockThemes from '../../theme/blockThemes'
import './Callout.css'
import { motion } from 'framer-motion'

import { Info, AlertTriangle, Lightbulb } from 'lucide-react'

const Callout = ({ theme, textAlign, fontSize, icon, title, content }) => {
  const { backgroundColor } = blockThemes[theme] || blockThemes.default

  const renderIcon = () => {
    switch (icon) {
      case 'info':
        return <Info className="callout-icon info" />
      case 'alert':
        return <AlertTriangle className="callout-icon alert" />
      case 'tip':
        return <Lightbulb className="callout-icon tip" />
      default:
        return null
    }
  }

  return (
    <div className="callout-block-container" style={{ backgroundColor }}>
      <motion.div
        className="callout-block"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="icon-title">
          <div className="icon">{icon !== 'none' && renderIcon()}</div>
          <div className="title">{title && <h4>{title}</h4>}</div>
        </div>

        <div className="callout-content" style={{ textAlign }}>
          <p style={{ fontSize }}>{content}</p>
        </div>
      </motion.div>
    </div>
  )
}

export default Callout
