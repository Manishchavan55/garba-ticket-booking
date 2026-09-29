import { useScrollReveal } from '../../hooks/useScrollReveal.js';

export default function EventInfo({ backendStatus }) {
  const [ref, visible] = useScrollReveal();

  return (
    <section id="event" ref={ref} className={`event-section section-shell reveal-section ${visible ? 'is-visible' : ''}`}>
      <div className="section-intro">
        <p className="section-label">01 / The event</p>
        <h2>A night built around <span>rhythm, colour</span> &amp; connection.</h2>
      </div>

      <div className="event-grid">
        <article className="event-card event-card-main">
          <div className="card-icon">✦</div>
          <p className="card-label">When</p>
          <h3>Navratri 2026</h3>
          <p>Date and session timings will be announced with the event schedule.</p>
        </article>
        <article className="event-card">
          <div className="card-icon">◎</div>
          <p className="card-label">Where</p>
          <h3>Venue TBA</h3>
          <p>Location details will be published before ticket sales open.</p>
        </article>
        <article className="event-card event-card-dark">
          <div className="card-icon">◌</div>
          <p className="card-label">The energy</p>
          <h3>Live Garba Night</h3>
          <p>Music, movement, lights and a crowd made for celebration.</p>
        </article>
      </div>

      <div className="backend-status" aria-live="polite">
        <span className={`status-dot ${backendStatus}`} />
        <span>Booking platform {backendStatus === 'online' ? 'connected' : backendStatus === 'offline' ? 'offline' : 'checking'}</span>
      </div>
    </section>
  );
}
