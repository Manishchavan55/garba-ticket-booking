import { Link } from 'react-router-dom';

export default function PublicLayout({ children }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="KESARIYA Dandiya Nights home">
          KESARIYA <span>Dandiya Nights</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link to="/">Events</Link>
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <p>KESARIYA Dandiya Nights</p>
        <p>Public event information • Booking will be available in a later phase</p>
      </footer>
    </div>
  );
}
