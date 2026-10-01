import { describe, expect, it, vi } from 'vitest';

const transactionMock = vi.hoisted(() => ({
  withTransaction: vi.fn(),
}));

vi.mock('../src/database/transaction.js', () => transactionMock);

const { createBooking } = await import('../src/services/booking.service.js');

const makeConnection = (responses) => ({
  execute: vi.fn()
    .mockImplementation(async () => {
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return response;
    }),
});

describe('Booking service', () => {
  it('loads price from the database and calculates an exact decimal total', async () => {
    const connection = makeConnection([
      [[]],
      [[{ id: 7, event_id: 2, price: '499.50', availability_status: 'available' }]],
      [{ affectedRows: 1 }],
    ]);
    transactionMock.withTransaction.mockImplementationOnce(async (operation) => operation(connection));

    const result = await createBooking({
      ticketCategoryId: 7,
      quantity: 3,
      customerName: 'Customer',
      customerEmail: 'customer@example.com',
      customerPhone: '+919999999999',
    }, 'kdn-service-test-idempotency');

    expect(result.amount).toBe('1498.50');
    expect(result.status).toBe('pending');
    expect(connection.execute.mock.calls[1][0]).toContain('FROM ticket_categories');
    expect(connection.execute.mock.calls[2][1]).toEqual(expect.arrayContaining(['1498.50', '1498.50']));
  });

  it('rejects a missing ticket category', async () => {
    const connection = makeConnection([[]]);
    transactionMock.withTransaction.mockImplementationOnce(async (operation) => operation(connection));

    await expect(createBooking({
      ticketCategoryId: 99,
      quantity: 1,
      customerName: 'Customer',
      customerEmail: 'customer@example.com',
      customerPhone: '+919999999999',
    }, 'kdn-missing-category-1234')).rejects.toMatchObject({
      statusCode: 404,
      code: 'TICKET_CATEGORY_NOT_FOUND',
    });
  });

  it('rejects an unavailable ticket category', async () => {
    const connection = makeConnection([
      [[]],
      [[{ id: 7, event_id: 2, price: '499.00', availability_status: 'unavailable' }]],
    ]);
    transactionMock.withTransaction.mockImplementationOnce(async (operation) => operation(connection));

    await expect(createBooking({
      ticketCategoryId: 7,
      quantity: 1,
      customerName: 'Customer',
      customerEmail: 'customer@example.com',
      customerPhone: '+919999999999',
    }, 'kdn-unavailable-category-1234')).rejects.toMatchObject({
      statusCode: 409,
      code: 'TICKET_CATEGORY_UNAVAILABLE',
    });
  });

  it('returns the existing booking for a repeated idempotency key', async () => {
    const connection = makeConnection([
      [[{ booking_id: 'KDN-existing', booking_status: 'pending', total_amount: '499.00', currency: 'INR' }]],
    ]);
    transactionMock.withTransaction.mockImplementationOnce(async (operation) => operation(connection));

    const result = await createBooking({
      ticketCategoryId: 7,
      quantity: 1,
      customerName: 'Customer',
      customerEmail: 'customer@example.com',
      customerPhone: '+919999999999',
    }, 'kdn-repeat-idempotency-1234');

    expect(result).toEqual({
      bookingId: 'KDN-existing',
      status: 'pending',
      amount: '499.00',
      currency: 'INR',
      reused: true,
    });
  });
});
