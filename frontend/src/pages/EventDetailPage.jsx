import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEvent, getTicketCategories } from '../api/events.js';
import StatusMessage from '../components/StatusMessage.jsx';
import TicketCategoryCard from '../components/TicketCategoryCard.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';

const formatDate = (value) => new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'full',
}).format(new Date(`${value}T00:00:00`));

const formatTime = (value) => value?.slice(0, 5) ?? '';

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [eventStatus, setEventStatus] = useState('loading');
  const [ticketStatus, setTicketStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    setEventStatus('loading');

    getEvent(id)
      .then((data) => {
        if (!active) return;
        setEvent(data);
        setEventStatus('success');
      })
      .catch((error) => {
        if (!active) return;
        setEventStatus(error?.response?.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    setTicketStatus('loading');

    getTicketCategories(id)
      .then((data) => {
        if (!active) return;
        setCategories(data);
        setTicketStatus('success');
      })
      .catch((error) => {
        if (!active) return;
        setTicketStatus(error?.response?.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    document.title = event ? `${event.name} | KESARIYA Dandiya Nights` : 'Event | KESARIYA Dandiya Nights';

    if (!event) return undefined;

    const description = event.guidelines || `${event.name} at ${event.venue}.`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description.slice(0, 160);

    return undefined;
  }, [event]);

  if (eventStatus === 'loading') {
    return <PublicLayout><main className="content-section"><StatusMessage title="Loading event" message="Fetching event details and ticket information." /></main></PublicLayout>;
  }

  if (eventStatus === 'not-found') {
    return (
      <PublicLayout>
        <main className="content-section">
          <StatusMessage title="Event not found" message="The requested event could not be found." tone="error" />
          <Link className="text-link" to="/">Return to events</Link>
        </main>
      </PublicLayout>
    );
  }

  if (eventStatus === 'error' || !event) {
    return (
      <PublicLayout>
        <main className="content-section">
          <StatusMessage title="Event unavailable" message="We could not load this event right now. Please try again later." tone="error" />
          <Link className="text-link" to="/">Return to events</Link>
        </main>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <main>
        <section className="event-hero" aria-labelledby="event-title">
          <div className="content-section event-hero__inner">
            <p className="eyebrow">{formatDate(event.event_date)}</p>
            <h1 id="event-title">{event.name}</h1>
            <p className="event-hero__venue">{event.venue}</p>
            <p>{formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}</p>
          </div>
        </section>

        <section className="content-section" aria-labelledby="details-title">
          <div className="section-heading">
            <p className="eyebrow">Know before you go</p>
            <h2 id="details-title">Event details</h2>
          </div>
          <div className="detail-grid">
            <div className="detail-card"><h3>Date</h3><p>{formatDate(event.event_date)}</p></div>
            <div className="detail-card"><h3>Time</h3><p>{formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}</p></div>
            <div className="detail-card"><h3>Venue</h3><p>{event.venue}</p></div>
          </div>
        </section>

        <section className="content-section" aria-labelledby="tickets-title">
          <div className="section-heading">
            <p className="eyebrow">Ticket information</p>
            <h2 id="tickets-title">Choose your category</h2>
          </div>
          {ticketStatus === 'loading' && <StatusMessage title="Loading tickets" message="Fetching available ticket categories." />}
          {ticketStatus === 'error' && <StatusMessage title="Tickets unavailable" message="Ticket information could not be loaded right now." tone="error" />}
          {ticketStatus === 'not-found' && <StatusMessage title="Tickets unavailable" message="Ticket information could not be found for this event." tone="error" />}
          {ticketStatus === 'success' && categories.length === 0 && <StatusMessage title="No ticket categories" message="Ticket categories have not been published for this event yet." />}
          {ticketStatus === 'success' && categories.length > 0 && (
            <div className="ticket-grid">
              {categories.map((category) => <TicketCategoryCard category={category} key={`${category.name}-${category.price}`} />)}
            </div>
          )}
        </section>

        {event.guidelines && (
          <section className="content-section content-section--accent" aria-labelledby="guidelines-title">
            <p className="eyebrow">Guidelines</p>
            <h2 id="guidelines-title">Event guidelines</h2>
            <p className="preserved-text">{event.guidelines}</p>
          </section>
        )}

        <section className="content-section" aria-labelledby="booking-title">
          <div className="booking-placeholder">
            <p className="eyebrow">Booking</p>
            <h2 id="booking-title">Book Tickets</h2>
            <p>Online booking will be enabled in a later phase. No booking or payment is processed from this page.</p>
            <button className="button button--disabled" type="button" disabled aria-disabled="true">Booking coming soon</button>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
