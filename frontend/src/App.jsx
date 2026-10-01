import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import './styles/global.css';

const FoundationPage = () => (
  <main className="shell">
    <section className="foundation-card" aria-labelledby="foundation-title">
      <p className="eyebrow">KESARIYA Dandiya Nights</p>
      <h1 id="foundation-title">Application foundation is running.</h1>
      <p>
        The React application shell, routing foundation, and API client are ready for the next implementation phase.
      </p>
      <Link className="text-link" to="/status">View application status</Link>
    </section>
  </main>
);

const StatusPage = () => (
  <main className="shell">
    <section className="foundation-card" aria-labelledby="status-title">
      <p className="eyebrow">System status</p>
      <h1 id="status-title">Frontend is running.</h1>
      <p>Backend integration is available through the configured API client.</p>
      <Link className="text-link" to="/">Back to foundation</Link>
    </section>
  </main>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FoundationPage />} />
        <Route path="/status" element={<StatusPage />} />
      </Routes>
    </BrowserRouter>
  );
}
