import blockThemes from '../../theme/blockThemes'
import RichText from '../../components/RichText'
import './Video.css'

const Video = ({ theme, link, videoSubtitle, textAlign, fontSize }) => {
  const { backgroundColor, fontColor } = blockThemes[theme] || blockThemes.default

  const processEmbedLink = (url) => {
    if (!url) return null
    const clean = (id) => id.split('?')[0].split('&')[0].split('/')[0]

    // Support the common YouTube URL formats.
    if (url.includes('youtu.be/')) {
      const id = clean(url.split('youtu.be/')[1] || '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.includes('youtube.com/watch?v=')) {
      const id = clean(url.split('v=')[1] || '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.includes('youtube.com/live/')) {
      const id = clean(url.split('youtube.com/live/')[1] || '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.includes('youtube.com/shorts/')) {
      const id = clean(url.split('youtube.com/shorts/')[1] || '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.includes('youtube.com/embed/')) {
      return url
    }

    // Vimeo URLs use a numeric video identifier.
    if (url.includes('vimeo.com/')) {
      const id = clean(url.split('vimeo.com/')[1] || '')
      return id ? `https://player.vimeo.com/video/${id}` : null
    }

    return null
  }

  const embedLink = processEmbedLink(link)

  return (
    <div className="video-block-container" style={{ backgroundColor, color: fontColor }}>
      <div className="video-block">
        <div className="video-container">
          {embedLink ? (
            <iframe
              src={embedLink}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Embedded Video"
            ></iframe>
          ) : (
            <video controls>
              <source src={link} type="video/mp4" />
              Seu navegador não suporta vídeos HTML5.
            </video>
          )}
        </div>

        {videoSubtitle && (
          <RichText
            as="div"
            className="video-subtitle"
            html={videoSubtitle}
            style={{
              textAlign,
              fontSize: fontSize
                ? typeof fontSize === 'number'
                  ? `${fontSize}px`
                  : fontSize
                : '14px',
              marginTop: '8px',
              color: fontColor
            }}
          />
        )}
      </div>
    </div>
  )
}

export default Video
