import { useEffect, useState } from 'react';
import {
  createAdminEvent,
  createAdminTicketCategory,
  deleteAdminEvent,
  deleteAdminTicketCategory,
  listAdminEvents,
  listAdminTicketCategories,
  updateAdminEvent,
  updateAdminTicketCategory,
} from '../api/adminEvents.js';

const EMPTY_EVENT = {
  name: '',
  event_date: '',
  start_time: '',
  end_time: '',
  venue: '',
  guidelines: '',
};

const EMPTY_CATEGORY = { name: '', price: '', availability_status: 'available' };

const getErrorMessage = (error) => error?.response?.data?.error?.message ?? 'Something went wrong. Please try again.';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listAdminEvents();
      setEvents(result.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (eventId) => {
    if (!eventId) return;
    setCategoriesLoading(true);
    setError('');
    try {
      const result = await listAdminTicketCategories(eventId);
      setCategories(result.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  useEffect(() => {
    if (selectedEventId) loadCategories(selectedEventId);
    else setCategories([]);
  }, [selectedEventId]);

  const handleEventSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editingEventId) await updateAdminEvent(editingEventId, eventForm);
      else await createAdminEvent(eventForm);
      setMessage(editingEventId ? 'Event updated successfully.' : 'Event created successfully.');
      setEventForm(EMPTY_EVENT);
      setEditingEventId(null);
      await loadEvents();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event? Events with ticket categories cannot be deleted.')) return;
    setError('');
    setMessage('');
    try {
      await deleteAdminEvent(eventId);
      if (selectedEventId === eventId) setSelectedEventId(null);
      setMessage('Event deleted successfully.');
      await loadEvents();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const startEventEdit = (eventItem) => {
    setEditingEventId(eventItem.id);
    setEventForm({
      name: eventItem.name,
      event_date: String(eventItem.event_date).slice(0, 10),
      start_time: String(eventItem.start_time).slice(0, 5),
      end_time: eventItem.end_time ? String(eventItem.end_time).slice(0, 5) : '',
      venue: eventItem.venue,
      guidelines: eventItem.guidelines ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    if (!selectedEventId) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editingCategoryId) await updateAdminTicketCategory(editingCategoryId, categoryForm);
      else await createAdminTicketCategory(selectedEventId, categoryForm);
      setCategoryForm(EMPTY_CATEGORY);
      setEditingCategoryId(null);
      setMessage(editingCategoryId ? 'Ticket category updated successfully.' : 'Ticket category created successfully.');
      await loadCategories(selectedEventId);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this ticket category? Categories with booking history cannot be deleted.')) return;
    setError('');
    setMessage('');
    try {
      await deleteAdminTicketCategory(categoryId);
      setMessage('Ticket category deleted successfully.');
      await loadCategories(selectedEventId);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const selectedEvent = events.find((item) => item.id === selectedEventId);

  return (
    <main className="page-shell admin-events-page">
      <section className="section-heading">
        <p className="eyebrow">Protected administration</p>
        <h1>Events &amp; ticket categories</h1>
        <p className="muted-copy">Manage event details and ticket category pricing without changing historical booking or payment records.</p>
      </section>

      {message && <p className="status-message" role="status">{message}</p>}
      {error && <p className="status-message status-message--error" role="alert">{error}</p>}

      <section className="admin-management-grid">
        <form className="booking-form" onSubmit={handleEventSubmit}>
          <h2>{editingEventId ? 'Edit event' : 'Create event'}</h2>
          <label htmlFor="event-name">Name</label>
          <input id="event-name" value={eventForm.name} maxLength={200} required onChange={(event) => setEventForm({ ...eventForm, name: event.target.value })} />
          <label htmlFor="event-date">Event date</label>
          <input id="event-date" type="date" value={eventForm.event_date} required onChange={(event) => setEventForm({ ...eventForm, event_date: event.target.value })} />
          <label htmlFor="event-start">Start time</label>
          <input id="event-start" type="time" value={eventForm.start_time} required onChange={(event) => setEventForm({ ...eventForm, start_time: event.target.value })} />
          <label htmlFor="event-end">End time</label>
          <input id="event-end" type="time" value={eventForm.end_time} onChange={(event) => setEventForm({ ...eventForm, end_time: event.target.value })} />
          <label htmlFor="event-venue">Venue</label>
          <input id="event-venue" value={eventForm.venue} maxLength={255} required onChange={(event) => setEventForm({ ...eventForm, venue: event.target.value })} />
          <label htmlFor="event-guidelines">Guidelines</label>
          <textarea id="event-guidelines" rows="5" value={eventForm.guidelines} onChange={(event) => setEventForm({ ...eventForm, guidelines: event.target.value })} />
          <div className="booking-actions">
            <button className="button" type="submit" disabled={saving}>{saving ? 'Saving…' : editingEventId ? 'Save event' : 'Create event'}</button>
            {editingEventId && <button className="button" type="button" onClick={() => { setEditingEventId(null); setEventForm(EMPTY_EVENT); }}>Cancel</button>}
          </div>
        </form>

        <section>
          <div className="section-heading"><h2>Events</h2></div>
          {loading ? <p className="status-message">Loading events…</p> : events.length === 0 ? <p className="status-message">No events yet. Create the first event above.</p> : (
            <div className="event-list">
              {events.map((eventItem) => (
                <article className="event-card" key={eventItem.id}>
                  <div>
                    <h3>{eventItem.name}</h3>
                    <p>{eventItem.event_date} · {eventItem.start_time?.slice(0, 5)} · {eventItem.venue}</p>
                  </div>
                  <div className="booking-actions">
                    <button className="button" type="button" onClick={() => setSelectedEventId(eventItem.id)}>Categories</button>
                    <button className="button" type="button" onClick={() => startEventEdit(eventItem)}>Edit</button>
                    <button className="button" type="button" onClick={() => handleDeleteEvent(eventItem.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {selectedEvent && (
        <section className="content-section--accent admin-category-section">
          <div className="section-heading">
            <p className="eyebrow">Selected event</p>
            <h2>{selectedEvent.name}</h2>
          </div>
          <div className="admin-management-grid">
            <form className="booking-form" onSubmit={handleCategorySubmit}>
              <h3>{editingCategoryId ? 'Edit ticket category' : 'Create ticket category'}</h3>
              <label htmlFor="category-name">Name</label>
              <input id="category-name" value={categoryForm.name} maxLength={120} required onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} />
              <label htmlFor="category-price">Price</label>
              <input id="category-price" inputMode="decimal" min="0" step="0.01" value={categoryForm.price} required onChange={(event) => setCategoryForm({ ...categoryForm, price: event.target.value })} />
              <label htmlFor="category-status">Availability</label>
              <select id="category-status" value={categoryForm.availability_status} onChange={(event) => setCategoryForm({ ...categoryForm, availability_status: event.target.value })}>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
              <div className="booking-actions">
                <button className="button" type="submit" disabled={saving}>{saving ? 'Saving…' : editingCategoryId ? 'Save category' : 'Create category'}</button>
                {editingCategoryId && <button className="button" type="button" onClick={() => { setEditingCategoryId(null); setCategoryForm(EMPTY_CATEGORY); }}>Cancel</button>}
              </div>
            </form>

            <section>
              <h3>Ticket categories</h3>
              {categoriesLoading ? <p className="status-message">Loading ticket categories…</p> : categories.length === 0 ? <p className="status-message">No ticket categories for this event.</p> : (
                <div className="event-list">
                  {categories.map((category) => (
                    <article className="event-card" key={category.id}>
                      <div>
                        <h3>{category.name}</h3>
                        <p>₹{Number(category.price).toFixed(2)} · {category.availability_status}</p>
                      </div>
                      <div className="booking-actions">
                        <button className="button" type="button" onClick={() => { setEditingCategoryId(category.id); setCategoryForm({ name: category.name, price: String(category.price), availability_status: category.availability_status }); }}>Edit</button>
                        <button className="button" type="button" onClick={() => handleDeleteCategory(category.id)}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      )}
    </main>
  );
}
