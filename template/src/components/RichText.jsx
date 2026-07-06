import './RichText.css'

const withAccentBold = (html, accentColor) => {
  if (!accentColor) return html
  return html
    .replace(/<strong>/g, `<strong style="color: ${accentColor}">`)
    .replace(/<b>/g, `<b style="color: ${accentColor}">`)
}

const RichText = ({ as: Tag = 'span', html = '', accentColor, className, ...props }) => {
  const classes = [className, Tag === 'p' ? 'rich-text-paragraph' : null].filter(Boolean).join(' ')
  const paragraphs =
    Tag === 'p'
      ? String(html)
          .split(/<br\s*\/?>/gi)
          .filter((part) => part.trim())
      : []

  if (paragraphs.length > 1) {
    return paragraphs.map((paragraph, index) => (
      <p
        {...props}
        className={[classes, index > 0 ? 'rich-text-paragraph--continuation' : null]
          .filter(Boolean)
          .join(' ')}
        dangerouslySetInnerHTML={{
          __html: withAccentBold(paragraph, accentColor)
        }}
        key={index}
      />
    ))
  }

  return (
    <Tag
      {...props}
      className={classes || undefined}
      dangerouslySetInnerHTML={{
        __html: withAccentBold(paragraphs[0] || String(html), accentColor)
      }}
    />
  )
}

export default RichText
