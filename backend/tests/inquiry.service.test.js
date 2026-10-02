import { beforeEach, describe, expect, it, vi } from 'vitest';

const execute = vi.fn();
const getConnection = vi.fn();
const release = vi.fn();
const mockPool = { execute, getConnection };

vi.mock('../src/database/connection.js', () => ({ getDatabasePool: () => mockPool }));

const {
  createPublicInquiry,
  listAdminInquiries,
  getAdminInquiry,
  updateAdminInquiry,
  deleteAdminInquiry,
} = await import('../src/services/inquiry.service.js');

describe('inquiry service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getConnection.mockResolvedValue({ execute, release });
  });

  it('creates a public inquiry without exposing the database id', async () => {
    execute.mockResolvedValueOnce([{ insertId: 12 }]);
    await expect(createPublicInquiry({ name: ' A ', email: ' a@example.com ', phone: ' 123 ', message: ' Hello ' }))
      .resolves.toEqual({ submitted: true });
    expect(execute.mock.calls[0][1]).toEqual(['A', 'a@example.com', '123', 'Hello']);
  });

  it('lists inquiries for administrators', async () => {
    execute.mockResolvedValueOnce([[{ id: 1, inquiry_status: 'new' }, { id: 2, inquiry_status: 'resolved' }]]);
    await expect(listAdminInquiries()).resolves.toHaveLength(2);
  });

  it('retrieves an inquiry and releases the connection', async () => {
    execute.mockResolvedValueOnce([[{ id: 5, name: 'A' }]]);
    await expect(getAdminInquiry(5)).resolves.toEqual({ id: 5, name: 'A' });
    expect(release).toHaveBeenCalledOnce();
  });

  it('updates only the existing inquiry status field', async () => {
    execute
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ id: 5, inquiry_status: 'resolved' }]]);
    await expect(updateAdminInquiry(5, { inquiryStatus: 'resolved' }))
      .resolves.toEqual({ id: 5, inquiry_status: 'resolved' });
  });

  it('deletes an inquiry', async () => {
    execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(deleteAdminInquiry(5)).resolves.toBeUndefined();
  });
});
