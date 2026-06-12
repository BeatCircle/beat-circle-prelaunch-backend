import Waitlist from '../models/waitlist.model.js';

// ─── Simple in-memory rate limiter (per IP) ──────────────────────────────────
const ipLog = new Map();
const WINDOW_MS   = 60 * 60 * 1000; // 1 hour
const MAX_PER_WIN = 3;

export const rateLimiter = (req, res, next) => {
  const ip  = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();

  const timestamps = (ipLog.get(ip) || []).filter(t => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_PER_WIN) {
    return res.status(429).json({
      success: false,
      message: 'Too many submissions from this IP. Please try again later.',
    });
  }

  timestamps.push(now);
  ipLog.set(ip, timestamps);
  next();
};

// ─── POST /api/waitlist/submit ────────────────────────────────────────────────
export const submitWaitlist = async (req, res) => {
  try {
    const {
      userType,
      fullName,
      email,
      stageName,
      primaryGenre,
      country,
      musicLink,
    } = req.body;

    // ── Validate required fields ──
    const missingFields = [];
    if (!userType)  missingFields.push('userType');
    if (!fullName)  missingFields.push('fullName');
    if (!email)     missingFields.push('email');
    if (!country)   missingFields.push('country');

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // ── Validate userType ──
    const validTypes = ['artist', 'producer', 'music_fan', 'brand_investor'];
    if (!validTypes.includes(userType)) {
      return res.status(400).json({ success: false, message: 'Invalid user type.' });
    }

    // ── Duplicate email check ──
    const exists = await Waitlist.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'This email is already on the waitlist.',
      });
    }

    const entry = await Waitlist.create({
      userType,
      fullName:     fullName.trim(),
      email:        email.toLowerCase().trim(),
      stageName:    stageName?.trim()    || undefined,
      primaryGenre: primaryGenre?.trim() || undefined,
      country:      country.trim(),
      musicLink:    musicLink?.trim()    || undefined,
    });

    return res.status(201).json({
      success: true,
      message: "You're on the waitlist! We'll be in touch within 72 hours. 🎵",
      data: { id: entry._id },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg });
    }
    console.error('Waitlist submission error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};
