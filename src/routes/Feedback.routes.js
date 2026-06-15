import express from 'express';
import {
  submitFeedback,
  getPublicReviews,
  getAllFeedbacks,
  getFeedbackById,
  updateFeedbackStatus,
  toggleFeatured,
  deleteFeedback,
  rateLimiter,
} from '../controllers/Feedback.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/feedback/submit:
 *   post:
 *     summary: Submit feedback
 *     description: |
 *       Public endpoint for submitting a feedback entry.
 *       Submissions start with `pending` status and must be approved by an admin
 *       before they can be featured as public reviews.
 *       Rate limited to **3 submissions per IP per hour**.
 *     tags:
 *       - Feedback – Public
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackSubmit'
 *           example:
 *             name: Tunde Okafor
 *             role: Independent Artist
 *             country: Nigeria
 *             feedback: Beat Circle is exactly what the African music scene has been missing. Can't wait for launch!
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Thank you for your feedback! 🙏" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: 665f1a2b3c4d5e6f7a8b9c0d }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Too many submissions. Please try again later.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/submit', rateLimiter, submitFeedback);

/**
 * @swagger
 * /api/feedback/reviews:
 *   get:
 *     summary: Get public featured reviews
 *     description: |
 *       Returns feedback entries that have been **approved and featured** by an admin.
 *       Use this on the public-facing site to display community reviews.
 *     tags:
 *       - Feedback – Public
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 12
 *         description: Number of reviews to return (max 50)
 *     responses:
 *       200:
 *         description: List of featured reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicReview'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/reviews', getPublicReviews);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — all require Bearer JWT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/feedback/admin:
 *   get:
 *     summary: List all feedback (admin)
 *     description: |
 *       Returns a paginated, searchable list of all feedback submissions.
 *       Supports filtering by `status` and `featured`.
 *     tags:
 *       - Feedback – Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 25, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search name, role, country, or feedback text
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, status, featured, country]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated feedback list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FeedbackEntry' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/admin', protect, getAllFeedbacks);

/**
 * @swagger
 * /api/feedback/admin/{id}:
 *   get:
 *     summary: Get single feedback entry (admin)
 *     tags:
 *       - Feedback – Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: 665f1a2b3c4d5e6f7a8b9c0d
 *     responses:
 *       200:
 *         description: Feedback entry
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/FeedbackEntry' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/admin/:id', protect, getFeedbackById);

/**
 * @swagger
 * /api/feedback/admin/{id}/status:
 *   patch:
 *     summary: Approve or reject feedback (admin)
 *     description: |
 *       Updates the moderation status of a feedback entry.
 *       - Setting status to `rejected` automatically removes the featured flag.
 *       - Only `approved` feedback can be featured via the `/feature` endpoint.
 *     tags:
 *       - Feedback – Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: 665f1a2b3c4d5e6f7a8b9c0d
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *                 example: approved
 *               adminNotes:
 *                 type: string
 *                 example: Great testimonial, feature this one.
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Status updated to "approved".' }
 *                 data: { $ref: '#/components/schemas/FeedbackEntry' }
 *       400:
 *         description: Invalid status value
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/admin/:id/status', protect, updateFeedbackStatus);

/**
 * @swagger
 * /api/feedback/admin/{id}/feature:
 *   patch:
 *     summary: Toggle featured (public review) flag (admin)
 *     description: |
 *       Toggles whether an approved feedback entry appears as a public review.
 *       **The feedback must be `approved` first** — attempting to feature a
 *       `pending` or `rejected` entry returns a 400 error.
 *     tags:
 *       - Feedback – Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: 665f1a2b3c4d5e6f7a8b9c0d
 *     responses:
 *       200:
 *         description: Featured status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Feedback is now featured as a public review. }
 *                 data: { $ref: '#/components/schemas/FeedbackEntry' }
 *       400:
 *         description: Feedback is not approved yet
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               message: Only approved feedback can be featured. Approve it first.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/admin/:id/feature', protect, toggleFeatured);

/**
 * @swagger
 * /api/feedback/admin/{id}:
 *   delete:
 *     summary: Delete a feedback entry (admin)
 *     description: Permanently removes a feedback entry. **Cannot be undone.**
 *     tags:
 *       - Feedback – Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: 665f1a2b3c4d5e6f7a8b9c0d
 *     responses:
 *       200:
 *         description: Feedback deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *             example:
 *               success: true
 *               message: Feedback deleted.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/admin/:id', protect, deleteFeedback);

export default router;