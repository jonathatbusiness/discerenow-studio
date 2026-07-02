import { Link } from 'react-router-dom'
import './Header.css'

const Header = () => {
  return (
    <header className="main-header">
      <div className="logo-area">
        <Link to="/">
          <img
            src="./DiscereNowLogo.webp"
            alt="Logo do Curso"
            className="logo"
            style={{ cursor: 'pointer' }}
          />
        </Link>
      </div>
      <div className="header-content"></div>
    </header>
  )
}

export default Header
