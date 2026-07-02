import './Footer.css'

const Footer = ({ className = '' }) => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`main-footer ${className}`}>
      <p>{currentYear}, DiscereNow. Desenvolvido por Jonatha Teixeira.</p>
    </footer>
  )
}

export default Footer
