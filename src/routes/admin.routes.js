import express from 'express';
import {
  login,
  getDashboard,
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  exportCSV,
} from '../controllers/admin.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
/**
 * @route  POST /api/admin/login
 * @desc   Authenticate admin and receive JWT
 * @access Public
 */
router.post('/login', login);

// ── Protected (Bearer JWT required) ──────────────────────────────────────────
/**
 * @route  GET /api/admin/dashboard
 * @desc   Aggregated stats for the admin dashboard
 */
router.get('/dashboard', protect, getDashboard);

/**
 * @route  GET /api/admin/users/export
 * @desc   Download all (or filtered) entries as a CSV file
 * NOTE: must be declared BEFORE /:id to avoid "export" being treated as an id
 */
router.get('/users/export', protect, exportCSV);

/**
 * @route  GET /api/admin/users
 * @desc   Paginated & filterable list of waitlist entries
 */
router.get('/users', protect, getUsers);

/**
 * @route  GET /api/admin/users/:id
 * @desc   Single waitlist entry details
 */
router.get('/users/:id', protect, getUserById);

/**
 * @route  PATCH /api/admin/users/:id/status
 * @desc   Update entry status (pending / approved / rejected) and optional admin notes
 */
router.patch('/users/:id/status', protect, updateUserStatus);

/**
 * @route  DELETE /api/admin/users/:id
 * @desc   Permanently remove a waitlist entry
 */
router.delete('/users/:id', protect, deleteUser);

export default router;
