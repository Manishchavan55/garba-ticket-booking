import { useState } from 'react';

function MenuIcon() {
  return <span className="menu-icon" aria-hidden="true"><i /><i /><i /></span>;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="navbar">
      <a className="brand" href="#home" onClick={closeMenu} aria-label="Garba home">
        <span className="brand-mark" aria-hidden="true">✦</span>
        <span>GARBA<span>26</span></span>
      </a>

      <button
        className="menu-toggle"
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MenuIcon />
      </button>

      <nav className={`nav-links ${open ? 'is-open' : ''}`} aria-label="Primary navigation">
        <a href="#event" onClick={closeMenu}>The Event</a>
        <a href="#highlights" onClick={closeMenu}>Experience</a>
        <a href="#tickets" onClick={closeMenu}>Tickets</a>
        <a className="nav-cta" href="#tickets" onClick={closeMenu}>Book Tickets <span>↗</span></a>
      </nav>
    </header>
  );
}
