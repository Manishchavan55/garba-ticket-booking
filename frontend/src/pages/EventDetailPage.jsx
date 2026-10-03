import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEvent, getTicketCategories } from '../api/events.js';
import StatusMessage from '../components/StatusMessage.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';

const EVENT_IMAGE = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=90';
const formatDate = (value) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
const formatTime = (value) => value?.slice(0, 5) ?? '';
const formatPrice = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [eventStatus, setEventStatus] = useState('loading');
  const [ticketStatus, setTicketStatus] = useState('loading');
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    let active = true;
    getEvent(id).then((data) => { if (active) { setEvent(data); setEventStatus('success'); } }).catch((error) => { if (active) setEventStatus(error?.response?.status === 404 ? 'not-found' : 'error'); });
    getTicketCategories(id).then((data) => { if (active) { setCategories(data); setTicketStatus('success'); setQuantities(Object.fromEntries(data.map((item) => [item.id, 0]))); } }).catch((error) => { if (active) setTicketStatus(error?.response?.status === 404 ? 'not-found' : 'error'); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => { document.title = event ? `${event.name} | Kesariya` : 'Event | Kesariya'; }, [event]);

  const selected = categories.filter((category) => Number(quantities[category.id]) > 0);
  const total = selected.reduce((sum, category) => sum + Number(category.price) * quantities[category.id], 0);
  const totalItems = selected.reduce((sum, category) => sum + quantities[category.id], 0);

  const changeQuantity = (categoryId, delta) => setQuantities((current) => ({ ...current, [categoryId]: Math.max(0, Number(current[categoryId] || 0) + delta) }));
  const bookingTarget = selected[0] ? `/events/${id}/book?category=${selected[0].id}` : `/events/${id}/book`;

  if (eventStatus === 'loading') return <PublicLayout><main className="public-content"><StatusMessage title="Loading event" message="Fetching event details." /></main></PublicLayout>;
  if (eventStatus === 'not-found') return <PublicLayout><main className="public-content"><StatusMessage title="Event not found" message="The requested event could not be found." tone="error" /><Link className="text-link" to="/events">Back to events</Link></main></PublicLayout>;
  if (eventStatus === 'error' || !event) return <PublicLayout><main className="public-content"><StatusMessage title="Event unavailable" message="We could not load this event right now." tone="error" /></main></PublicLayout>;

  return (
    <PublicLayout>
      <main>
        <section className="detail-hero" style={{ '--hero-image': `url(${EVENT_IMAGE})` }}>
          <div className="detail-hero__content">
            <p className="eyebrow">Kesariya Garba Night</p>
            <h1>{event.name}</h1>
            <div className="detail-hero__meta"><span>▣ {formatDate(event.event_date)}</span><span>◷ {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}</span><span>⌖ {event.venue}</span></div>
          </div>
        </section>

        <section className="detail-layout">
          <div className="detail-copy">
            <p className="eyebrow">About Event</p>
            <h2>Bring your people. Bring your energy.</h2>
            <p>{event.guidelines || `Join us for an unforgettable night of Garba, music and culture at ${event.venue}. Experience traditional beats with modern vibes, great food and a grand venue.`}</p>
            <ul className="detail-highlights">
              <li>♫ <span>Live DJ & Orchestra</span></li><li>🍴 <span>Food Stalls</span></li><li>▣ <span>Ample Parking</span></li><li>♥ <span>Secure & Family Friendly</span></li><li>✣ <span>Traditional & Modern Garba</span></li><li>★ <span>Exciting Prizes</span></li>
            </ul>
          </div>

          <aside className="ticket-selector" aria-label="Select tickets">
            <div className="ticket-selector__header"><h2>Select Tickets</h2><span>{totalItems} selected</span></div>
            {ticketStatus === 'loading' && <StatusMessage title="Loading tickets" message="Fetching ticket categories." />}
            {ticketStatus === 'error' && <StatusMessage title="Tickets unavailable" message="Ticket information could not be loaded." tone="error" />}
            {ticketStatus === 'not-found' && <StatusMessage title="Tickets unavailable" message="No ticket information was found." tone="error" />}
            {ticketStatus === 'success' && categories.map((category) => {
              const available = category.availability_status === 'available';
              return <div className="ticket-row" key={category.id}><div><strong>{category.name}</strong><small>{category.description || 'Entry pass'}</small></div><strong>{formatPrice(category.price)}</strong><div className="quantity"><button type="button" onClick={() => changeQuantity(category.id, -1)} disabled={!available || !quantities[category.id]} aria-label={`Remove ${category.name}`}>−</button><span>{quantities[category.id] || 0}</span><button type="button" onClick={() => changeQuantity(category.id, 1)} disabled={!available} aria-label={`Add ${category.name}`}>+</button></div></div>;
            })}
            <div className="ticket-selector__footer"><Link className={`button button--wide ${!totalItems ? 'button--disabled' : ''}`} to={bookingTarget} aria-disabled={!totalItems} onClick={(event) => { if (!totalItems) event.preventDefault(); }}>Proceed to Checkout</Link><strong>{formatPrice(total)}</strong></div>
          </aside>
        </section>
      </main>
    </PublicLayout>
  );
}
