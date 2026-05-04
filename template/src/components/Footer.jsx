import React from "react";
import "./Footer.css";

const Footer = ({ className = "" }) => {
  return (
    <footer className={`main-footer ${className}`}>
      <p>2025, DiscereNow. Desenvolvido por Jonatha Teixeira.</p>
    </footer>
  );
};

export default Footer;
