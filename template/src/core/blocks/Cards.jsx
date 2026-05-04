import { useState } from "react";
import blockThemes from "../../theme/blockThemes";
import "./Cards.css";
import { FaSearch } from "react-icons/fa";

const Cards = ({ theme, textAlign, fontSize, items }) => {
  const { backgroundColor, boldColor } =
    blockThemes[theme] || blockThemes.default;

  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState("");

  const handleZoom = (img) => {
    setModalImage(img);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalImage("");
  };

  return (
    <>
      <div className="cards-block-container" style={{ backgroundColor }}>
        <div className="cards-grid">
          {items.map((item, index) => (
            <div key={index} className="card-item" style={{ boldColor }}>
              {item.img && (
                <div
                  className="card-image"
                  style={{
                    cursor: item.zoom === "yes" ? "zoom-in" : "default",
                    position: "relative",
                  }}
                  onClick={
                    item.zoom === "yes" ? () => handleZoom(item.img) : undefined
                  }
                >
                  <img src={item.img} alt={item.altText || ""} />
                  {item.zoom === "yes" && (
                    <div className="overlay-icon">
                      <FaSearch />
                    </div>
                  )}
                </div>
              )}

              {item.subtitle && (
                <div
                  className="card-subtitle"
                  style={{ fontSize: "14px", textAlign }}
                >
                  {item.subtitle}
                </div>
              )}

              <div className="card-content" style={{ textAlign }}>
                {item.title && <h4 style={{ fontSize }}>{item.title}</h4>}
                {item.content && <p style={{ fontSize }}>{item.content}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="img-modal" onClick={closeModal}>
          <img src={modalImage} alt="Imagem ampliada" />
        </div>
      )}
    </>
  );
};

export default Cards;
