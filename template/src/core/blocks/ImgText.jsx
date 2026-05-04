import { useState } from "react";
import blockThemes from "../../theme/blockThemes";
import "./ImgText.css";
import { FaSearch } from "react-icons/fa";

const ImgText = ({
  content,
  image,
  imageSide,
  theme,
  textAlign,
  fontSize,
  zoom,
  altText,
  imgSubtitle,
}) => {
  const { backgroundColor, fontColor, boldColor } =
    blockThemes[theme] || blockThemes.default;

  const [showModal, setShowModal] = useState(false);
  const toggleModal = () => setShowModal(!showModal);

  const shouldZoom = zoom === "yes";

  return (
    <>
      <div
        className="block-imgtext-container"
        style={{ backgroundColor, color: fontColor }}
      >
        <div
          className={`block-imgtext ${imageSide === "right" ? "reverse" : ""}`}
        >
          <div
            className="img-wrapper"
            onClick={shouldZoom ? toggleModal : undefined}
            style={{ cursor: shouldZoom ? "zoom-in" : "default" }}
          >
            <img src={image} alt={altText || ""} />
            {shouldZoom && (
              <div className="overlay-icon">
                <FaSearch />
              </div>
            )}

            {imgSubtitle && (
              <div
                className="img-subtitle"
                style={{
                  fontSize: "14px",
                  color: fontColor,
                  textAlign: "center",
                  marginTop: "8px",
                }}
              >
                {imgSubtitle}
              </div>
            )}
          </div>

          <div
            className="text"
            style={{
              textAlign,
              fontSize: fontSize
                ? typeof fontSize === "number"
                  ? `${fontSize}px`
                  : fontSize
                : undefined,
            }}
          >
            {content.map((t, i) => (
              <p
                key={i}
                dangerouslySetInnerHTML={{
                  __html: boldColor
                    ? t.replace(
                        /<b>(.*?)<\/b>/g,
                        `<b style="color: ${boldColor}">$1</b>`
                      )
                    : t,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal para zoom */}
      {shouldZoom && showModal && (
        <div className="img-modal" onClick={toggleModal}>
          <img src={image} alt={altText || "Imagem ampliada"} />
        </div>
      )}
    </>
  );
};

export default ImgText;
