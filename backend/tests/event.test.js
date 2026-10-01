import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const eventService = vi.hoisted(() => ({
  getPublicEvents: vi.fn(),
  getPublicEventById: vi.fn(),
  getPublicTicketCategories: vi.fn(),
}));

vi.mock('../src/services/event.service.js', () => eventService);

const { createApp } = await import('../src/app.js');
const app = createApp();

describe('Public event API', () => {
  it('returns public events in the standard response contract', async () => {
    eventService.getPublicEvents.mockResolvedValueOnce([
      {
        id: 1,
        name: 'KESARIYA Dandiya Nights - Development Event',
        event_date: '2030-10-12',
        start_time: '18:00:00',
        end_time: '23:00:00',
        venue: 'Development Venue',
        guidelines: 'Development-only sample event.',
      },
    ]);

    const response = await request(app).get('/api/events');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: [expect.objectContaining({ id: 1, name: 'KESARIYA Dandiya Nights - Development Event' })],
    });
  });

  it('returns one public event', async () => {
    eventService.getPublicEventById.mockResolvedValueOnce({
      id: 1,
      name: 'KESARIYA Dandiya Nights - Development Event',
      event_date: '2030-10-12',
      start_time: '18:00:00',
      end_time: '23:00:00',
      venue: 'Development Venue',
      guidelines: 'Development-only sample event.',
    });

    const response = await request(app).get('/api/events/1');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(1);
  });

  it('returns 404 when an event does not exist', async () => {
    eventService.getPublicEventById.mockResolvedValueOnce(null);

    const response = await request(app).get('/api/events/999999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Event not found',
      },
    });
  });

  it('returns 400 for a malformed event identifier', async () => {
    const response = await request(app).get('/api/events/not-an-id');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Event ID must be a positive integer',
      },
    });
  });

  it('returns public ticket categories for an existing event', async () => {
    eventService.getPublicEventById.mockResolvedValueOnce({ id: 1 });
    eventService.getPublicTicketCategories.mockResolvedValueOnce([
      { name: 'General Entry - Development', price: '499.00', availability_status: 'available' },
    ]);

    const response = await request(app).get('/api/events/1/ticket-categories');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: [
        { name: 'General Entry - Development', price: '499.00', availability_status: 'available' },
      ],
    });
  });

  it('returns 404 for ticket categories of a nonexistent event', async () => {
    eventService.getPublicEventById.mockResolvedValueOnce(null);

    const response = await request(app).get('/api/events/999999/ticket-categories');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
