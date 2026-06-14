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

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     description: |
 *       Authenticates an admin user and returns a signed JWT token.
 *
 *       The token must be included as a `Bearer` token in the `Authorization`
 *       header for all protected admin routes:
 *       ```
 *       Authorization: Bearer <token>
 *       ```
 *       Tokens expire after **24 hours**.
 *
 *       Create the first admin account by running:
 *       ```bash
 *       node src/scripts/createAdmin.js <username> <email> <password>
 *       ```
 *     tags:
 *       - Admin – Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLogin'
 *           example:
 *             username: admin
 *             password: YourPassword123
 *     responses:
 *       200:
 *         description: Login successful — returns JWT and admin info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT Bearer token (valid 24 h)
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 admin:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: admin
 *                     email:
 *                       type: string
 *                       example: admin@beatcircle.app
 *       400:
 *         description: Username or password missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Username and password are required.
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid credentials.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/login', login);

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     description: |
 *       Returns aggregated statistics for the admin dashboard:
 *       - **total** — overall submission count
 *       - **byType** — breakdown by user type (artist, producer, music_fan, brand_investor)
 *       - **byStatus** — breakdown by review status (pending, approved, rejected)
 *       - **recentEntries** — the 5 most recent submissions
 *     tags:
 *       - Admin – Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardStats'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/dashboard', protect, getDashboard);

// ─────────────────────────────────────────────────────────────────────────────
// USERS — EXPORT  (must come BEFORE /:id to avoid route collision)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/users/export:
 *   get:
 *     summary: Export waitlist entries as CSV
 *     description: |
 *       Downloads all waitlist entries as a UTF-8 CSV file (with BOM for Excel
 *       compatibility). Supports the same `userType` and `status` filters as
 *       the list endpoint.
 *
 *       The CSV includes these columns:
 *       `ID, Full Name, Email, User Type, Stage Name, Primary Genre,
 *       Country, Music Link, Status, Admin Notes, Submitted At`
 *     tags:
 *       - Admin – Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [artist, producer, music_fan, brand_investor]
 *         description: Filter by user type
 *         example: artist
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by review status
 *         example: approved
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Suggested filename for the download
 *             schema:
 *               type: string
 *               example: attachment; filename="beatcircle-waitlist-1718000000000.csv"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/users/export', protect, exportCSV);

// ─────────────────────────────────────────────────────────────────────────────
// USERS — LIST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List waitlist entries
 *     description: |
 *       Returns a paginated, searchable, filterable list of all waitlist entries.
 *
 *       **Search** matches against `fullName`, `email`, `stageName`, and `country`.
 *
 *       **Default sort:** newest first (`createdAt desc`).
 *     tags:
 *       - Admin – Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 25
 *         description: Results per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term (matches name, email, stage name, country)
 *         example: tunde
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [artist, producer, music_fan, brand_investor]
 *         description: Filter by user type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by review status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, fullName, email, country, status, userType]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Paginated list of waitlist entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WaitlistEntry'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/users', protect, getUsers);

// ─────────────────────────────────────────────────────────────────────────────
// USERS — SINGLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get a single waitlist entry
 *     description: Returns the full details of one waitlist entry by its MongoDB ObjectId.
 *     tags:
 *       - Admin – Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the entry
 *         example: 665f1a2b3c4d5e6f7a8b9c0d
 *     responses:
 *       200:
 *         description: Entry found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WaitlistEntry'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/users/:id', protect, getUserById);

// ─────────────────────────────────────────────────────────────────────────────
// USERS — UPDATE STATUS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Update entry status and admin notes
 *     description: |
 *       Changes the review status of a waitlist entry and optionally
 *       adds an internal admin note.
 *
 *       Valid status transitions:
 *       - `pending` → `approved` or `rejected`
 *       - `approved` → `rejected` or `pending`
 *       - `rejected` → `approved` or `pending`
 *
 *       Admin notes are **internal only** and never exposed to applicants.
 *     tags:
 *       - Admin – Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the entry
 *         example: 665f1a2b3c4d5e6f7a8b9c0d
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusUpdate'
 *           examples:
 *             approve:
 *               summary: Approve an applicant
 *               value:
 *                 status: approved
 *                 adminNotes: Strong portfolio. Approve for founding batch.
 *             reject:
 *               summary: Reject an applicant
 *               value:
 *                 status: rejected
 *                 adminNotes: Profile incomplete. Can reapply next cycle.
 *             reset:
 *               summary: Reset to pending
 *               value:
 *                 status: pending
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Status updated to "approved".'
 *                 data:
 *                   $ref: '#/components/schemas/WaitlistEntry'
 *       400:
 *         description: Invalid status value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid status value.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/users/:id/status', protect, updateUserStatus);

// ─────────────────────────────────────────────────────────────────────────────
// USERS — DELETE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a waitlist entry
 *     description: |
 *       Permanently removes a waitlist entry from the database.
 *       **This action cannot be undone.**
 *     tags:
 *       - Admin – Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the entry to delete
 *         example: 665f1a2b3c4d5e6f7a8b9c0d
 *     responses:
 *       200:
 *         description: Entry deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               success: true
 *               message: Entry deleted.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/users/:id', protect, deleteUser);

export default router;