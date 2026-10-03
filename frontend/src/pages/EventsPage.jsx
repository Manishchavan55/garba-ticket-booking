import { useEffect, useMemo, useState } from 'react';
import { getEvents } from '../api/events.js';
import StatusMessage from '../components/StatusMessage.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import { Link } from 'react-router-dom';

const EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=85',
];

const formatDate = (value) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
const formatTime = (value) => value?.slice(0, 5) ?? '';
const formatPrice = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    document.title = 'Events | Kesariya Garba Nights';
    getEvents().then((data) => { setEvents(data); setStatus('success'); }).catch(() => setStatus('error'));
  }, []);

  const cities = useMemo(() => ['all', ...new Set(events.map((event) => event.city || event.venue?.split(',').at(-1)?.trim()).filter(Boolean))], [events]);
  const filtered = useMemo(() => events.filter((event) => {
    const haystack = `${event.name} ${event.venue} ${event.city || ''}`.toLowerCase();
    const matchesQuery = haystack.includes(query.trim().toLowerCase());
    const eventCity = event.city || event.venue?.split(',').at(-1)?.trim();
    const matchesCity = city === 'all' || eventCity === city;
    const matchesDate = dateFilter === 'all' || (dateFilter === 'soon' && new Date(event.event_date) >= new Date());
    return matchesQuery && matchesCity && matchesDate;
  }), [events, query, city, dateFilter]);

  return (
    <PublicLayout>
      <main className="events-page">
        <section className="page-intro">
          <div>
            <p className="eyebrow">Find your night</p>
            <h1>Events</h1>
            <p>Explore upcoming Garba nights in your city.</p>
          </div>
        </section>

        <section className="events-toolbar" aria-label="Event filters">
          <label className="search-field"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events or city..." /></label>
          <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Filter by city">
            {cities.map((value) => <option key={value} value={value}>{value === 'all' ? 'All Cities' : value}</option>)}
          </select>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter by date">
            <option value="all">All Dates</option>
            <option value="soon">Upcoming</option>
          </select>
        </section>

        {status === 'loading' && <div className="public-content"><StatusMessage title="Loading events" message="Finding the latest Garba nights." /></div>}
        {status === 'error' && <div className="public-content"><StatusMessage title="Events unavailable" message="We could not load events right now. Please try again later." tone="error" /></div>}
        {status === 'success' && filtered.length === 0 && <div className="public-content"><StatusMessage title="No events found" message="Try another city or search term." /></div>}
        {status === 'success' && filtered.length > 0 && (
          <section className="event-card-grid" aria-label="Available events">
            {filtered.map((event, index) => (
              <article className="event-tile" key={event.id}>
                <img src={EVENT_IMAGES[index % EVENT_IMAGES.length]} alt="Garba night atmosphere" />
                <div className="event-tile__body">
                  <div className="event-tile__meta"><span>◷ {formatDate(event.event_date)}</span><span>⌖ {event.city || event.venue}</span></div>
                  <h2>{event.name}</h2>
                  <p>{formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}</p>
                  <strong>{formatPrice(event.starting_price ?? event.price ?? 299)} onwards</strong>
                  <Link className="button button--wide" to={`/events/${event.id}`}>View Details <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </PublicLayout>
  );
}
