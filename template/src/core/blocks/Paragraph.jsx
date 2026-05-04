import blockThemes from "../../theme/blockThemes";
import "./Paragraph.css";

const Paragraph = ({ content, theme, textAlign, fontSize }) => {
  const { backgroundColor, fontColor, boldColor } =
    blockThemes[theme] || blockThemes.default;

  return (
    <div
      className="block-paragraph-container"
      style={{
        backgroundColor,
        color: fontColor,
      }}
    >
      <div className="block-paragraph">
        {content.map((text, index) => (
          <p
            key={index}
            style={{
              textAlign,
              fontSize: fontSize
                ? typeof fontSize === "number"
                  ? `${fontSize}px`
                  : fontSize
                : undefined,
            }}
            dangerouslySetInnerHTML={{
              __html: boldColor
                ? text.replace(
                    /<b>(.*?)<\/b>/g,
                    `<b style="color: ${boldColor}">$1</b>`
                  )
                : text,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Paragraph;
