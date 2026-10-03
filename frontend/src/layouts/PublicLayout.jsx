import { NavLink, Link } from 'react-router-dom';

const navItems = [
  ['/', 'Home'],
  ['/events', 'Events'],
  ['/gallery', 'About'],
  ['/contact', 'Contact'],
];

export default function PublicLayout({ children }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Kesariya Garba Nights home">
          <span className="brand__mark" aria-hidden="true">♨</span>
          <span className="brand__text"><strong>Kesariya</strong><small>Garba Nights</small></span>
        </Link>
        <nav aria-label="Primary navigation">
          {navItems.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="cart-button" to="/events" aria-label="View events">🛒</Link>
          <Link className="login-button" to="/admin/login">Login</Link>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div><strong>Kesariya Garba Nights</strong><span>Tradition • Rhythm • Togetherness</span></div>
        <p>Celebrate safely. Dance freely. Make memories.</p>
      </footer>
    </div>
  );
}
