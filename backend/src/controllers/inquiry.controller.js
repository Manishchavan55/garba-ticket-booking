import { sendSuccess } from '../utils/response.js';
import {
  createPublicInquiry,
  deleteAdminInquiry,
  getAdminInquiry,
  listAdminInquiries,
  updateAdminInquiry,
} from '../services/inquiry.service.js';

export const createInquiry = async (req, res) => {
  sendSuccess(res, await createPublicInquiry(req.body), 201);
};

export const listInquiries = async (_req, res) => {
  sendSuccess(res, await listAdminInquiries());
};

export const getInquiry = async (req, res) => {
  sendSuccess(res, await getAdminInquiry(req.params.id));
};

export const updateInquiry = async (req, res) => {
  sendSuccess(res, await updateAdminInquiry(req.params.id, req.body));
};

export const deleteInquiry = async (req, res) => {
  await deleteAdminInquiry(req.params.id);
  sendSuccess(res, null);
};
