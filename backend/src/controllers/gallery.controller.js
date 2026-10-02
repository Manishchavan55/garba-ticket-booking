import { sendSuccess } from '../utils/response.js';
import {
  createAdminGallery,
  deleteAdminGallery,
  getAdminGallery,
  listAdminGallery,
  listPublicGallery,
  updateAdminGallery,
} from '../services/gallery.service.js';

export const listGallery = async (_req, res) => {
  sendSuccess(res, await listPublicGallery());
};

export const listAdminGalleryItems = async (_req, res) => {
  sendSuccess(res, await listAdminGallery());
};

export const getAdminGalleryItem = async (req, res) => {
  sendSuccess(res, await getAdminGallery(req.params.id));
};

export const createGalleryItem = async (req, res) => {
  sendSuccess(res, await createAdminGallery(req.body), 201);
};

export const updateGalleryItem = async (req, res) => {
  sendSuccess(res, await updateAdminGallery(req.params.id, req.body));
};

export const deleteGalleryItem = async (req, res) => {
  await deleteAdminGallery(req.params.id);
  sendSuccess(res, null);
};
