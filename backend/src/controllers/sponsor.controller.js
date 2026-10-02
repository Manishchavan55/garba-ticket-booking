import { sendSuccess } from '../utils/response.js';
import {
  createAdminSponsor,
  deleteAdminSponsor,
  getAdminSponsor,
  listAdminSponsors,
  listPublicSponsors,
  updateAdminSponsor,
} from '../services/sponsor.service.js';

export const listSponsors = async (_req, res) => {
  sendSuccess(res, await listPublicSponsors());
};

export const listAdminSponsorItems = async (_req, res) => {
  sendSuccess(res, await listAdminSponsors());
};

export const getAdminSponsorItem = async (req, res) => {
  sendSuccess(res, await getAdminSponsor(req.params.id));
};

export const createSponsorItem = async (req, res) => {
  sendSuccess(res, await createAdminSponsor(req.body), 201);
};

export const updateSponsorItem = async (req, res) => {
  sendSuccess(res, await updateAdminSponsor(req.params.id, req.body));
};

export const deleteSponsorItem = async (req, res) => {
  await deleteAdminSponsor(req.params.id);
  sendSuccess(res, null);
};
