import express from 'express';
import { submitWaitlist, rateLimiter } from '../controllers/waitlist.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/waitlist/submit:
 *   post:
 *     summary: Submit a founding member application
 *     description: |
 *       Adds a new applicant to the Beat Circle founding member waitlist.
 *
 *       **Required for all user types:** `userType`, `fullName`, `email`, `country`
 *
 *       **Recommended for artists & producers:** `stageName`, `primaryGenre`, `musicLink`
 *
 *       Each email address can only be submitted once. Duplicate submissions
 *       return a `409 Conflict` response.
 *
 *       This endpoint is **rate-limited to 3 requests per IP per hour**.
 *     tags:
 *       - Waitlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WaitlistSubmit'
 *           examples:
 *             artist:
 *               summary: Artist application (full)
 *               value:
 *                 userType: artist
 *                 fullName: Tunde Okafor
 *                 email: tunde@example.com
 *                 stageName: T-Smooth
 *                 primaryGenre: Afrobeats
 *                 country: Nigeria
 *                 musicLink: https://soundcloud.com/tsmooth
 *             producer:
 *               summary: Producer application
 *               value:
 *                 userType: producer
 *                 fullName: Emeka Adeyemi
 *                 email: emeka@example.com
 *                 stageName: BeatsByEmeka
 *                 primaryGenre: Amapiano
 *                 country: South Africa
 *                 musicLink: https://open.spotify.com/artist/abc123
 *             musicFan:
 *               summary: Music fan application (minimal)
 *               value:
 *                 userType: music_fan
 *                 fullName: Amina Bello
 *                 email: amina@example.com
 *                 country: Ghana
 *             brandInvestor:
 *               summary: Brand / investor application
 *               value:
 *                 userType: brand_investor
 *                 fullName: Lagos Sound Group
 *                 email: partnerships@lagossound.com
 *                 country: Nigeria
 *     responses:
 *       201:
 *         description: Application submitted successfully
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
 *                   example: "You're on the waitlist! We'll be in touch within 72 hours. 🎵"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: MongoDB ObjectId of the new entry
 *                       example: 665f1a2b3c4d5e6f7a8b9c0d
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already registered on the waitlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: This email is already on the waitlist.
 *       429:
 *         description: Rate limit exceeded — too many submissions from this IP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Too many submissions from this IP. Please try again later.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/submit', rateLimiter, submitWaitlist);

export default router;