import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvents, getTicketCategories } from '../api/events.js';
import StatusMessage from '../components/StatusMessage.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';

const EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=90',
];

const formatDate = (value) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
const formatTime = (value) => value?.slice(0, 5) ?? '';
const formatPrice = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    document.title = 'Kesariya Garba Nights';
    getEvents().then((data) => { setEvents(data); setStatus('success'); }).catch(() => setStatus('error'));
  }, []);

  return (
    <PublicLayout>
      <main>
        <section className="home-hero">
          <div className="home-hero__image" aria-hidden="true" />
          <div className="home-hero__content">
            <p className="eyebrow">Celebrate • Dance • Belong</p>
            <h1>Feel the Rhythm<br /><span>of Traditions</span></h1>
            <p>Join us for the most vibrant Garba nights in your city.<br />Music • Dance • Culture • Togetherness</p>
            <Link className="button button--hero" to="/events">View Events <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        <section className="feature-strip" aria-label="Event highlights">
          <div><span>♫</span><strong>Live DJ & Orchestra</strong></div>
          <div><span>♡</span><strong>Safe & Secure Venue</strong></div>
          <div><span>✣</span><strong>Delicious Food Stalls</strong></div>
          <div><span>★</span><strong>Exciting Prizes</strong></div>
        </section>

        <section className="home-section" aria-labelledby="upcoming-title">
          <div className="section-heading-row">
            <div><p className="eyebrow">Find your night</p><h2 id="upcoming-title">Upcoming Garba Events</h2></div>
            <Link className="section-link" to="/events">View All →</Link>
          </div>

          {status === 'loading' && <StatusMessage title="Loading events" message="Finding the latest Garba nights." />}
          {status === 'error' && <StatusMessage title="Events unavailable" message="We could not load events right now. Please try again later." tone="error" />}
          {status === 'success' && events.length === 0 && <StatusMessage title="No event published" message="There is no public event available yet." />}
          {status === 'success' && events.length > 0 && (
            <div className="home-event-grid">
              {events.slice(0, 3).map((event, index) => (
                <article className="mini-event-card" key={event.id}>
                  <img src={EVENT_IMAGES[index % EVENT_IMAGES.length]} alt="Garba night atmosphere" />
                  <div className="mini-event-card__body">
                    <h3>{event.name}</h3>
                    <p>◷ {formatDate(event.event_date)} &nbsp;⌖ {event.city || event.venue}</p>
                    <strong>{formatPrice(event.starting_price ?? event.price ?? 299)} onwards</strong>
                    <Link to={`/events/${event.id}`}>View Details</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="home-story">
          <div><p className="eyebrow">The Kesariya experience</p><h2>More than a ticket. It's your night to remember.</h2></div>
          <p>From the first beat to the final circle, every detail is designed around music, movement, community and the colours of Navratri.</p>
        </section>

        {events[0] && <TicketPreview eventId={events[0].id} />}
      </main>
    </PublicLayout>
  );
}

function TicketPreview({ eventId }) {
  const [categories, setCategories] = useState([]);
  useEffect(() => { getTicketCategories(eventId).then(setCategories).catch(() => setCategories([])); }, [eventId]);
  if (!categories.length) return null;
  return (
    <section className="home-section home-section--tickets" aria-labelledby="ticket-preview-title">
      <div className="section-heading-row"><div><p className="eyebrow">Choose your entry</p><h2 id="ticket-preview-title">Tickets from {formatPrice(Math.min(...categories.map((item) => Number(item.price))))}</h2></div></div>
      <div className="ticket-preview-row">
        {categories.slice(0, 3).map((category) => <div className="ticket-preview" key={category.id}><span>{category.name}</span><strong>{formatPrice(category.price)}</strong></div>)}
      </div>
    </section>
  );
}
