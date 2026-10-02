import { beforeEach, describe, expect, it, vi } from 'vitest';

const execute = vi.fn();
const getConnection = vi.fn();
const release = vi.fn();
const mockPool = { execute, getConnection };

vi.mock('../src/database/connection.js', () => ({
  getDatabasePool: () => mockPool,
}));

const {
  listPublicSponsors,
  listAdminSponsors,
  getAdminSponsor,
  createAdminSponsor,
  updateAdminSponsor,
  deleteAdminSponsor,
} = await import('../src/services/sponsor.service.js');

describe('sponsor service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getConnection.mockResolvedValue({ execute, release });
  });

  it('lists only active sponsors publicly and excludes admin fields', async () => {
    execute.mockResolvedValueOnce([[{ name: 'Sponsor A', logo_url: 'https://example.com/a.png' }]]);
    await expect(listPublicSponsors()).resolves.toEqual([
      { name: 'Sponsor A', logo_url: 'https://example.com/a.png' },
    ]);
    expect(execute.mock.calls[0][0]).toContain('WHERE is_active = TRUE');
    expect(execute.mock.calls[0][0]).not.toContain('inquiry_information');
  });

  it('lists all sponsor records for administrators', async () => {
    execute.mockResolvedValueOnce([[{ id: 1, name: 'A', is_active: 1 }, { id: 2, name: 'B', is_active: 0 }]]);
    await expect(listAdminSponsors()).resolves.toHaveLength(2);
  });

  it('returns an admin sponsor and releases the connection', async () => {
    execute.mockResolvedValueOnce([[{ id: 4, name: 'Sponsor A' }]]);
    await expect(getAdminSponsor(4)).resolves.toEqual({ id: 4, name: 'Sponsor A' });
    expect(release).toHaveBeenCalledOnce();
  });

  it('creates a sponsor using the existing schema fields', async () => {
    execute
      .mockResolvedValueOnce([{ insertId: 9 }])
      .mockResolvedValueOnce([[{ id: 9, name: 'Sponsor A', is_active: 1 }]]);
    await expect(createAdminSponsor({
      name: 'Sponsor A', logoUrl: 'https://example.com/logo.png', inquiryInformation: 'Contact us', isActive: true,
    })).resolves.toEqual({ id: 9, name: 'Sponsor A', is_active: 1 });
  });

  it('updates a sponsor without changing the schema', async () => {
    execute
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ id: 3, name: 'Updated', is_active: 0 }]]);
    await expect(updateAdminSponsor(3, {
      name: 'Updated', logoUrl: null, inquiryInformation: null, isActive: false,
    })).resolves.toEqual({ id: 3, name: 'Updated', is_active: 0 });
  });

  it('deletes an existing sponsor', async () => {
    execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(deleteAdminSponsor(3)).resolves.toBeUndefined();
  });
});
