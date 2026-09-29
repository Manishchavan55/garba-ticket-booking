import { useScrollReveal } from '../../hooks/useScrollReveal.js';
import { ticketCategories } from '../../services/ticketCategories.js';

export default function TicketCards() {
  const [ref, visible] = useScrollReveal();

  return (
    <section id="tickets" ref={ref} className={`tickets-section section-shell reveal-section ${visible ? 'is-visible' : ''}`}>
      <div className="ticket-heading">
        <div>
          <p className="section-label">03 / Tickets</p>
          <h2>Choose your <span>entry.</span></h2>
        </div>
        <p>Categories are UI-ready for the future ticket API. Final pricing will be supplied by the backend.</p>
      </div>

      <div className="ticket-grid">
        {ticketCategories.map((ticket) => (
          <article className={`ticket-card ${ticket.featured ? 'featured' : ''}`} key={ticket.id}>
            {ticket.featured && <span className="ticket-ribbon">Most popular</span>}
            <div className="ticket-card-top">
              <span className="ticket-symbol">✺</span>
              <span className="ticket-type">{ticket.name}</span>
            </div>
            <h3>{ticket.priceLabel}</h3>
            <p>{ticket.subtitle}</p>
            <ul>
              {ticket.perks.map((perk) => <li key={perk}><span>✓</span>{perk}</li>)}
            </ul>
            <a className="ticket-action" href="#home">Select {ticket.name} <span>→</span></a>
          </article>
        ))}
      </div>
    </section>
  );
}
