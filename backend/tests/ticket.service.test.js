import { describe, expect, it, vi, beforeEach } from 'vitest';

const poolMock = vi.hoisted(() => ({
  getDatabasePool: vi.fn(),
}));

const qrMock = vi.hoisted(() => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,test-qr'),
}));

vi.mock('../src/database/connection.js', () => poolMock);
vi.mock('qrcode', () => ({ default: qrMock }));

const {
  issueTicketsForConfirmedBooking,
  verifyQrTicket,
} = await import('../src/services/ticket.service.js');

const confirmedBooking = {
  id: 10,
  booking_id: 'KDN-12345678-1234-4234-8234-123456789012',
  quantity: 1,
  booking_status: 'confirmed',
};

const successfulPayment = { id: 44, payment_status: 'successful' };

const existingTicket = (qrIdentifier = 'A'.repeat(43), overrides = {}) => ({
  id: 101,
  booking_id: 10,
  qr_identifier: qrIdentifier,
  verification_status: 'unused',
  verified_at: null,
  used_at: null,
  created_at: '2026-10-01T20:00:00.000Z',
  ...overrides,
});

const makeConnection = ({
  booking = confirmedBooking,
  payment = successfulPayment,
  tickets = [],
  updateResult = { affectedRows: 1 },
  failInsert = false,
} = {}) => ({
  beginTransaction: vi.fn().mockResolvedValue(undefined),
  commit: vi.fn().mockResolvedValue(undefined),
  rollback: vi.fn().mockResolvedValue(undefined),
  release: vi.fn(),
  execute: vi.fn().mockImplementation(async (sql) => {
    if (sql.includes('SELECT id, booking_id, quantity, booking_status')) {
      return [booking ? [booking] : [], []];
    }

    if (sql.includes('SELECT id, payment_status') && sql.includes('FROM payments')) {
      return [payment ? [payment] : [], []];
    }

    if (sql.includes('SELECT id, booking_id, qr_identifier, verification_status')) {
      return [tickets, []];
    }

    if (sql.includes('INSERT INTO qr_tickets')) {
      if (failInsert) throw new Error('ticket insert failed');
      return [{ insertId: 200 + tickets.length }, []];
    }

    if (sql.includes('UPDATE qr_tickets')) {
      return [updateResult, []];
    }

    throw new Error(`Unexpected SQL in ticket service test: ${sql}`);
  }),
});

const runTransactionMock = (connection) => {
  const pool = {
    getConnection: vi.fn().mockResolvedValue(connection),
  };
  poolMock.getDatabasePool.mockReturnValue(pool);
  return pool;
};

describe('Ticket service', () => {
  beforeEach(() => {
    poolMock.getDatabasePool.mockReset();
    qrMock.toDataURL.mockClear();
  });

  it('issues one ticket for quantity 1 and returns a QR image', async () => {
    const connection = makeConnection();
    const pool = runTransactionMock(connection);

    const result = await issueTicketsForConfirmedBooking(confirmedBooking.id);

    expect(result.quantity).toBe(1);
    expect(result.tickets).toHaveLength(1);
    expect(result.tickets[0].qrIdentifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.tickets[0].verificationStatus).toBe('unused');
    expect(result.tickets[0].qrImageDataUrl).toBe('data:image/png;base64,test-qr');
    expect(qrMock.toDataURL).toHaveBeenCalledWith(result.tickets[0].qrIdentifier, expect.any(Object));
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
    expect(pool.getConnection).toHaveBeenCalledTimes(1);
  });

  it('issues exactly the persisted booking quantity', async () => {
    const connection = makeConnection({ booking: { ...confirmedBooking, quantity: 3 } });
    runTransactionMock(connection);

    const result = await issueTicketsForConfirmedBooking(confirmedBooking.id);

    expect(result.tickets).toHaveLength(3);
    expect(new Set(result.tickets.map((ticket) => ticket.qrIdentifier)).size).toBe(3);
  });

  it('reuses existing tickets without creating duplicates', async () => {
    const tickets = [existingTicket('A'.repeat(43)), existingTicket('B'.repeat(43)), existingTicket('C'.repeat(43))];
    const connection = makeConnection({ booking: { ...confirmedBooking, quantity: 3 }, tickets });
    runTransactionMock(connection);

    const result = await issueTicketsForConfirmedBooking(confirmedBooking.id);

    expect(result.tickets.map((ticket) => ticket.qrIdentifier)).toEqual(['A'.repeat(43), 'B'.repeat(43), 'C'.repeat(43)]);
    expect(connection.execute.mock.calls.filter(([sql]) => sql.includes('INSERT INTO qr_tickets'))).toHaveLength(0);
  });

  it.each([
    ['missing booking', null, successfulPayment, 'BOOKING_NOT_FOUND'],
    ['unpaid booking', confirmedBooking, { id: 44, payment_status: 'pending' }, 'PAYMENT_NOT_SUCCESSFUL'],
    ['failed payment', confirmedBooking, { id: 44, payment_status: 'failed' }, 'PAYMENT_NOT_SUCCESSFUL'],
    ['cancelled booking', { ...confirmedBooking, booking_status: 'cancelled' }, successfulPayment, 'BOOKING_NOT_CONFIRMED'],
    ['invalid booking state', { ...confirmedBooking, booking_status: 'pending' }, successfulPayment, 'BOOKING_NOT_CONFIRMED'],
  ])('rejects %s', async (_name, booking, payment, code) => {
    const connection = makeConnection({ booking, payment });
    runTransactionMock(connection);

    await expect(issueTicketsForConfirmedBooking(confirmedBooking.id)).rejects.toMatchObject({ code });
    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back when ticket insertion fails', async () => {
    const connection = makeConnection({ failInsert: true });
    runTransactionMock(connection);

    await expect(issueTicketsForConfirmedBooking(confirmedBooking.id)).rejects.toThrow('ticket insert failed');
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('rejects a malformed QR identifier before opening a transaction', async () => {
    await expect(verifyQrTicket('not-a-valid-qr')).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_QR_IDENTIFIER',
    });
    expect(poolMock.getDatabasePool).not.toHaveBeenCalled();
  });

  it('atomically consumes a valid unused QR ticket', async () => {
    const qrIdentifier = 'D'.repeat(43);
    const connection = makeConnection({
      tickets: [],
      updateResult: { affectedRows: 1 },
    });
    connection.execute.mockImplementation(async (sql) => {
      if (sql.includes('FROM qr_tickets q')) {
        return [[{
          id: 101,
          booking_id: 10,
          qr_identifier: qrIdentifier,
          verification_status: 'unused',
          public_booking_id: confirmedBooking.booking_id,
          booking_status: 'confirmed',
          payment_status: 'successful',
        }], []];
      }
      if (sql.includes('UPDATE qr_tickets')) return [{ affectedRows: 1 }, []];
      throw new Error(`Unexpected SQL in QR verification test: ${sql}`);
    });
    runTransactionMock(connection);

    const result = await verifyQrTicket(qrIdentifier);

    expect(result).toEqual({ verified: true, status: 'used', bookingId: confirmedBooking.booking_id });
    expect(connection.execute.mock.calls.some(([sql]) => sql.includes('WHERE id = ? AND verification_status = ?'))).toBe(true);
    expect(connection.commit).toHaveBeenCalledTimes(1);
  });

  it('rejects an already-used QR ticket without mutation', async () => {
    const qrIdentifier = 'E'.repeat(43);
    const connection = makeConnection();
    connection.execute.mockImplementation(async (sql) => {
      if (sql.includes('FROM qr_tickets q')) {
        return [[{
          id: 101,
          booking_id: 10,
          qr_identifier: qrIdentifier,
          verification_status: 'used',
          public_booking_id: confirmedBooking.booking_id,
          booking_status: 'confirmed',
          payment_status: 'successful',
        }], []];
      }
      throw new Error(`Unexpected SQL in used QR verification test: ${sql}`);
    });
    runTransactionMock(connection);

    await expect(verifyQrTicket(qrIdentifier)).rejects.toMatchObject({
      statusCode: 409,
      code: 'QR_TICKET_ALREADY_USED',
    });
    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.execute.mock.calls.some(([sql]) => sql.includes('UPDATE qr_tickets'))).toBe(false);
  });

  it('rejects an invalid QR ticket state', async () => {
    const qrIdentifier = 'H'.repeat(43);
    const connection = makeConnection();
    connection.execute.mockImplementation(async (sql) => {
      if (sql.includes('FROM qr_tickets q')) {
        return [[{
          id: 101,
          booking_id: 10,
          qr_identifier: qrIdentifier,
          verification_status: 'invalid',
          public_booking_id: confirmedBooking.booking_id,
          booking_status: 'confirmed',
          payment_status: 'successful',
        }], []];
      }
      throw new Error(`Unexpected SQL in invalid QR verification test: ${sql}`);
    });
    runTransactionMock(connection);

    await expect(verifyQrTicket(qrIdentifier)).rejects.toMatchObject({
      statusCode: 409,
      code: 'QR_TICKET_INVALID',
    });
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });

  it('rejects a nonexistent QR ticket', async () => {
    const connection = makeConnection();
    connection.execute.mockImplementation(async (sql) => {
      if (sql.includes('FROM qr_tickets q')) return [[], []];
      throw new Error(`Unexpected SQL in missing QR verification test: ${sql}`);
    });
    runTransactionMock(connection);

    await expect(verifyQrTicket('F'.repeat(43))).rejects.toMatchObject({
      statusCode: 404,
      code: 'QR_TICKET_NOT_FOUND',
    });
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });

  it('rejects a concurrent verification that loses the conditional update', async () => {
    const qrIdentifier = 'G'.repeat(43);
    const connection = makeConnection({ updateResult: { affectedRows: 0 } });
    connection.execute.mockImplementation(async (sql) => {
      if (sql.includes('FROM qr_tickets q')) {
        return [[{
          id: 101,
          booking_id: 10,
          qr_identifier: qrIdentifier,
          verification_status: 'unused',
          public_booking_id: confirmedBooking.booking_id,
          booking_status: 'confirmed',
          payment_status: 'successful',
        }], []];
      }
      if (sql.includes('UPDATE qr_tickets')) return [{ affectedRows: 0 }, []];
      throw new Error(`Unexpected SQL in concurrent QR verification test: ${sql}`);
    });
    runTransactionMock(connection);

    await expect(verifyQrTicket(qrIdentifier)).rejects.toMatchObject({
      statusCode: 409,
      code: 'QR_TICKET_ALREADY_USED',
    });
    expect(connection.rollback).toHaveBeenCalledTimes(1);
  });
});
