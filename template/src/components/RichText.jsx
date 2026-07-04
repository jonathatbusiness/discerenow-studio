const withAccentBold = (html, accentColor) => {
  if (!accentColor) return html
  return html
    .replace(/<strong>/g, `<strong style="color: ${accentColor}">`)
    .replace(/<b>/g, `<b style="color: ${accentColor}">`)
}

const RichText = ({ as: Tag = 'span', html = '', accentColor, ...props }) => (
  <Tag
    {...props}
    dangerouslySetInnerHTML={{
      __html: withAccentBold(String(html), accentColor)
    }}
  />
)

export default RichText
