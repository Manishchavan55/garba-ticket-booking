import { NavLink, Link } from 'react-router-dom';

const navItems = [
  ['/', 'Events'],
  ['/gallery', 'Gallery'],
  ['/sponsors', 'Sponsors'],
  ['/contact', 'Contact'],
];

export default function PublicLayout({ children }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="KESARIYA Dandiya Nights home">
          KESARIYA <span>Dandiya Nights</span>
        </Link>
        <nav aria-label="Primary navigation">
          {navItems.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <p><strong>KESARIYA Dandiya Nights</strong></p>
        <p>Celebrate together • Dance with energy • Book with confidence</p>
      </footer>
    </div>
  );
}
