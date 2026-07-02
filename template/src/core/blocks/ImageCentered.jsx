import blockThemes from '../../theme/blockThemes'
import './ImageCentered.css'

const ImageCentered = ({ image, altText = '', caption, theme }) => {
  const colors = blockThemes[theme] || blockThemes.default

  if (!image) return null

  return (
    <figure
      className="block-image-centered"
      style={{ backgroundColor: colors.backgroundColor, color: colors.fontColor }}
    >
      <div className="block-image-centered__inner">
        <img src={image} alt={altText} />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </div>
    </figure>
  )
}

export default ImageCentered
