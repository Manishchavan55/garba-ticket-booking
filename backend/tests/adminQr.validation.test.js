import { describe, expect, it, vi } from 'vitest';
import { validateAdminQrTicketId, validateVenueQrPayload } from '../src/validation/adminQr.validation.js';

describe('admin QR validation', () => {
  it('accepts a positive QR ticket ID', () => {
    const next = vi.fn();
    validateAdminQrTicketId({ params: { ticketId: '12' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects malformed QR ticket IDs', () => {
    const next = vi.fn();
    validateAdminQrTicketId({ params: { ticketId: '0' } }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
  });

  it('accepts the server-generated QR identifier format', () => {
    const next = vi.fn();
    validateVenueQrPayload({ body: { qrIdentifier: 'A'.repeat(32) } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects malformed QR identifiers', () => {
    const next = vi.fn();
    validateVenueQrPayload({ body: { qrIdentifier: 'not-a-qr' } }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, code: 'INVALID_QR_IDENTIFIER' });
  });
});
