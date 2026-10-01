import { describe, expect, it, vi, beforeEach } from 'vitest';

const transactionMock = vi.hoisted(() => ({
  withTransaction: vi.fn(),
}));

vi.mock('../src/database/transaction.js', () => transactionMock);

const { initiatePayment, verifyPayment } = await import('../src/services/payment.service.js');

const makeConnection = (responses) => ({
  execute: vi.fn().mockImplementation(async () => {
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return response;
  }),
});

const runTransactionMocks = (connections) => {
  let index = 0;
  transactionMock.withTransaction.mockImplementation(async (operation) => {
    const connection = connections[index];
    index += 1;
    expect(typeof operation).toBe('function');
    expect(connection).toBeDefined();
    return operation(connection);
  });
};

const mockProvider = (overrides = {}) => ({
  name: 'test-provider',
  createCheckout: vi.fn().mockResolvedValue({
    providerTransactionReference: 'test-txn-123',
    checkoutUrl: 'https://provider.invalid/checkout/test-txn-123',
  }),
  verifyPayment: vi.fn().mockResolvedValue({
    provider: 'test-provider',
    providerTransactionReference: 'test-txn-123',
    amount: '499.00',
    currency: 'INR',
    status: 'successful',
  }),
  verifyWebhook: vi.fn(),
  normalizeStatus: vi.fn(),
  ...overrides,
});

const pendingBooking = {
  id: 10,
  booking_id: 'KDN-12345678-1234-4234-8234-123456789012',
  booking_status: 'pending',
  total_amount: '499.00',
  currency: 'INR',
};

describe('Payment service', () => {
  beforeEach(() => transactionMock.withTransaction.mockReset());

  it('initiates checkout using the authoritative booking amount', async () => {
    const connection = makeConnection([
      [[pendingBooking]],
      [[]],
      [[]],
      [{ insertId: 44 }],
    ]);
    const provider = mockProvider();
    runTransactionMocks([connection, makeConnection([[{ affectedRows: 1 }]])]);

    const result = await initiatePayment(pendingBooking.booking_id, 'payment-init-idempotency-1', provider);

    expect(provider.createCheckout).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: pendingBooking.booking_id,
      paymentId: 44,
      amount: '499.00',
      currency: 'INR',
      idempotencyKey: 'payment-init-idempotency-1',
    }));
    expect(result.status).toBe('pending');
    expect(result.amount).toBe('499.00');
    expect(result.checkout.checkoutUrl).toContain('provider.invalid');
  });

  it('rejects a nonexistent booking', async () => {
    const connection = makeConnection([
      [[]],
    ]);
    const provider = mockProvider();
    runTransactionMocks([connection]);

    await expect(initiatePayment('KDN-12345678-1234-4234-8234-123456789012', 'payment-init-idempotency-2', provider))
      .rejects.toMatchObject({ statusCode: 404, code: 'BOOKING_NOT_FOUND' });
    expect(provider.createCheckout).not.toHaveBeenCalled();
  });

  it('rejects an already paid booking', async () => {
    const connection = makeConnection([[
      {
        ...pendingBooking,
        booking_status: 'confirmed',
      },
    ]]);
    const provider = mockProvider();
    runTransactionMocks([connection]);

    await expect(initiatePayment(pendingBooking.booking_id, 'payment-init-idempotency-3', provider))
      .rejects.toMatchObject({ statusCode: 409, code: 'BOOKING_ALREADY_PAID' });
  });

  it('rejects a provider amount mismatch without changing payment state', async () => {
    const context = {
      payment_id: 44,
      booking_id: 10,
      provider: 'test-provider',
      gateway_transaction_reference: 'test-txn-123',
      payment_amount: '499.00',
      payment_currency: 'INR',
      payment_status: 'pending',
      public_booking_id: pendingBooking.booking_id,
      booking_status: 'pending',
      booking_amount: '499.00',
      booking_currency: 'INR',
    };
    const connection = makeConnection([[context], [context]]);
    const provider = mockProvider({
      verifyPayment: vi.fn().mockResolvedValue({
        provider: 'test-provider',
        providerTransactionReference: 'test-txn-123',
        amount: '500.00',
        currency: 'INR',
        status: 'successful',
      }),
    });
    runTransactionMocks([connection, connection]);

    await expect(verifyPayment(pendingBooking.booking_id, { providerData: 'opaque' }, provider))
      .rejects.toMatchObject({ statusCode: 409, code: 'PAYMENT_AMOUNT_MISMATCH' });
    expect(transactionMock.withTransaction).toHaveBeenCalledTimes(2);
  });

  it('rejects a currency mismatch without marking the booking paid', async () => {
    const context = {
      payment_id: 44,
      booking_id: 10,
      provider: 'test-provider',
      gateway_transaction_reference: 'test-txn-123',
      payment_amount: '499.00',
      payment_currency: 'INR',
      payment_status: 'pending',
      public_booking_id: pendingBooking.booking_id,
      booking_status: 'pending',
      booking_amount: '499.00',
      booking_currency: 'INR',
    };
    const connection = makeConnection([[context], [context]]);
    const provider = mockProvider({
      verifyPayment: vi.fn().mockResolvedValue({
        provider: 'test-provider',
        providerTransactionReference: 'test-txn-123',
        amount: '499.00',
        currency: 'USD',
        status: 'successful',
      }),
    });
    runTransactionMocks([connection, connection]);

    await expect(verifyPayment(pendingBooking.booking_id, { providerData: 'opaque' }, provider))
      .rejects.toMatchObject({ statusCode: 409, code: 'PAYMENT_CURRENCY_MISMATCH' });
    expect(transactionMock.withTransaction).toHaveBeenCalledTimes(2);
  });

  it('confirms the booking only after verified successful payment', async () => {
    const context = {
      payment_id: 44,
      booking_id: 10,
      provider: 'test-provider',
      gateway_transaction_reference: 'test-txn-123',
      payment_amount: '499.00',
      payment_currency: 'INR',
      payment_status: 'pending',
      public_booking_id: pendingBooking.booking_id,
      booking_status: 'pending',
      booking_amount: '499.00',
      booking_currency: 'INR',
    };
    const readConnection = makeConnection([[context]]);
    const writeConnection = makeConnection([[context], [[]], [{ affectedRows: 1 }], [{ affectedRows: 1 }]]);
    const provider = mockProvider();
    runTransactionMocks([readConnection, writeConnection]);

    const result = await verifyPayment(pendingBooking.booking_id, { providerData: 'opaque' }, provider);

    expect(result).toEqual({ status: 'successful', bookingStatus: 'confirmed', idempotent: false });
    expect(writeConnection.execute.mock.calls[1][0]).toContain('UPDATE payments');
    expect(writeConnection.execute.mock.calls[2][0]).toContain('UPDATE bookings');
  });

  it('records a failed payment without confirming the booking', async () => {
    const context = {
      payment_id: 44,
      booking_id: 10,
      provider: 'test-provider',
      gateway_transaction_reference: 'test-txn-123',
      payment_amount: '499.00',
      payment_currency: 'INR',
      payment_status: 'pending',
      public_booking_id: pendingBooking.booking_id,
      booking_status: 'pending',
      booking_amount: '499.00',
      booking_currency: 'INR',
    };
    const readConnection = makeConnection([[context]]);
    const writeConnection = makeConnection([[context], [{ affectedRows: 1 }]]);
    const provider = mockProvider({
      verifyPayment: vi.fn().mockResolvedValue({
        provider: 'test-provider',
        providerTransactionReference: 'test-txn-123',
        amount: '499.00',
        currency: 'INR',
        status: 'failed',
      }),
    });
    runTransactionMocks([readConnection, writeConnection]);

    const result = await verifyPayment(pendingBooking.booking_id, { providerData: 'opaque' }, provider);

    expect(result).toEqual({ status: 'failed', bookingStatus: 'pending', idempotent: false });
    expect(writeConnection.execute.mock.calls[0][0]).toContain('UPDATE payments');
    expect(writeConnection.execute).toHaveBeenCalledTimes(1);
  });

  it('treats a repeated successful verification as idempotent', async () => {
    const context = {
      payment_id: 44,
      booking_id: 10,
      provider: 'test-provider',
      gateway_transaction_reference: 'test-txn-123',
      payment_amount: '499.00',
      payment_currency: 'INR',
      payment_status: 'successful',
      public_booking_id: pendingBooking.booking_id,
      booking_status: 'confirmed',
      booking_amount: '499.00',
      booking_currency: 'INR',
    };
    const readConnection = makeConnection([[context]]);
    const writeConnection = makeConnection([[context]]);
    const provider = mockProvider();
    runTransactionMocks([readConnection, writeConnection]);

    const result = await verifyPayment(pendingBooking.booking_id, { providerData: 'duplicate' }, provider);

    expect(result).toEqual({ status: 'successful', bookingStatus: 'confirmed', idempotent: true });
    expect(writeConnection.execute).toHaveBeenCalledTimes(1);
  });
});
