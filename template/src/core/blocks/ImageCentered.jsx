import blockThemes from '../../theme/blockThemes'
import RichText from '../../components/RichText'
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
        {caption ? <RichText as="figcaption" html={caption} /> : null}
      </div>
    </figure>
  )
}

export default ImageCentered
