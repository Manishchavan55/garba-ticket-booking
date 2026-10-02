import { beforeEach, describe, expect, it, vi } from 'vitest';

const execute = vi.fn();
const getConnection = vi.fn();
const release = vi.fn();
const mockPool = { execute, getConnection };

vi.mock('../src/database/connection.js', () => ({
  getDatabasePool: () => mockPool,
}));

const { listPublicGallery, listAdminGallery, getAdminGallery, createAdminGallery, updateAdminGallery, deleteAdminGallery } = await import('../src/services/gallery.service.js');

describe('gallery service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getConnection.mockResolvedValue({ execute, release });
  });

  it('lists only active public gallery items', async () => {
    execute.mockResolvedValueOnce([[{ id: 1, media_type: 'image', is_active: 1 }]]);
    const result = await listPublicGallery();
    expect(result).toEqual([{ id: 1, media_type: 'image', is_active: 1 }]);
    expect(execute.mock.calls[0][0]).toContain('WHERE is_active = TRUE');
  });

  it('lists all gallery items for administrators', async () => {
    execute.mockResolvedValueOnce([[{ id: 1, is_active: 0 }, { id: 2, is_active: 1 }]]);
    await expect(listAdminGallery()).resolves.toHaveLength(2);
  });

  it('returns an admin gallery item and releases the connection', async () => {
    execute.mockResolvedValueOnce([[{ id: 4, title: 'Night', media_type: 'image' }]]);
    await expect(getAdminGallery(4)).resolves.toEqual({ id: 4, title: 'Night', media_type: 'image' });
    expect(release).toHaveBeenCalledOnce();
  });

  it('creates a gallery item using the existing schema fields', async () => {
    execute
      .mockResolvedValueOnce([{ insertId: 9 }])
      .mockResolvedValueOnce([[{ id: 9, media_type: 'video' }]]);
    await expect(createAdminGallery({ title: 'Highlights', mediaType: 'video', mediaUrl: 'https://example.com/video', altText: null, isActive: true }))
      .resolves.toEqual({ id: 9, media_type: 'video' });
  });

  it('updates a gallery item without changing the schema', async () => {
    execute
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ id: 3, is_active: 0 }]]);
    await expect(updateAdminGallery(3, { title: 'Updated', mediaType: 'image', mediaUrl: 'https://example.com/a.jpg', altText: 'Updated', isActive: false }))
      .resolves.toEqual({ id: 3, is_active: 0 });
  });

  it('deletes an existing gallery item', async () => {
    execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(deleteAdminGallery(3)).resolves.toBeUndefined();
  });
});
