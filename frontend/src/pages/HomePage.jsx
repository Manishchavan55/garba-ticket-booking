import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../api/events.js';
import StatusMessage from '../components/StatusMessage.jsx';
import TicketCategoryCard from '../components/TicketCategoryCard.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';

const formatDate = (value) => new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'full',
}).format(new Date(`${value}T00:00:00`));

const formatTime = (value) => value?.slice(0, 5) ?? '';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    getEvents()
      .then((data) => {
        setEvents(data);
        setStatus('success');
      })
      .catch(() => {
        setError('We could not load the event information right now. Please try again later.');
        setStatus('error');
      });
  }, []);

  return (
    <PublicLayout>
      <main>
        <section className="hero" aria-labelledby="home-title">
          <div className="hero__content">
            <p className="eyebrow">Celebrate • Dance • Dandiya</p>
            <h1 id="home-title">KESARIYA Dandiya Nights</h1>
            <p className="hero__intro">Discover the event, venue details, guidelines, and available ticket categories.</p>
          </div>
        </section>

        <section className="content-section" aria-labelledby="events-title">
          <div className="section-heading">
            <p className="eyebrow">Event information</p>
            <h2 id="events-title">Upcoming event</h2>
          </div>

          {status === 'loading' && <StatusMessage title="Loading event" message="Fetching the latest public event information." />}
          {status === 'error' && <StatusMessage title="Event unavailable" message={error} tone="error" />}
          {status === 'success' && events.length === 0 && (
            <StatusMessage title="No event published" message="There is no public event available yet." />
          )}

          {status === 'success' && events.length > 0 && (
            <div className="event-list">
              {events.map((event) => (
                <article className="event-card" key={event.id}>
                  <div>
                    <p className="eyebrow">{formatDate(event.event_date)}</p>
                    <h3>{event.name}</h3>
                    <p>{event.venue}</p>
                    <p>
                      {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                    </p>
                  </div>
                  <Link className="button" to={`/events/${event.id}`}>View event</Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="content-section content-section--accent" aria-labelledby="experience-title">
          <p className="eyebrow">Your event experience</p>
          <h2 id="experience-title">Plan your night before you arrive.</h2>
          <p>Explore event details and ticket availability now. The ticket booking flow will be introduced separately.</p>
        </section>

        {status === 'success' && events[0] && (
          <section className="content-section" aria-labelledby="tickets-preview-title">
            <div className="section-heading">
              <p className="eyebrow">Tickets</p>
              <h2 id="tickets-preview-title">Available categories</h2>
            </div>
            <TicketPreview eventId={events[0].id} />
          </section>
        )}
      </main>
    </PublicLayout>
  );
}

function TicketPreview({ eventId }) {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    import('../api/events.js').then(({ getTicketCategories }) => getTicketCategories(eventId))
      .then((data) => {
        setCategories(data);
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [eventId]);

  if (status === 'loading') return <StatusMessage title="Loading tickets" message="Fetching available ticket categories." />;
  if (status === 'error') return <StatusMessage title="Tickets unavailable" message="Ticket information could not be loaded right now." tone="error" />;
  if (categories.length === 0) return <StatusMessage title="No ticket categories" message="Ticket categories have not been published yet." />;

  return (
    <div className="ticket-grid">
      {categories.map((category) => <TicketCategoryCard category={category} key={`${category.name}-${category.price}`} />)}
    </div>
  );
}
