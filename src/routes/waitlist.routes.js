import express from 'express';
import { submitWaitlist, rateLimiter } from '../controllers/waitlist.controller.js';

const router = express.Router();

/**
 * @route  POST /api/waitlist/submit
 * @desc   Submit a founding-member waitlist application
 * @access Public (rate limited: 3 requests / IP / hour)
 */
router.post('/waitlist/submit', rateLimiter, submitWaitlist);

export default router;
