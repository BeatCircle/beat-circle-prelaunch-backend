import Feedback from '../models/feedback.model.js';

// ─── Simple rate limiter (3 submissions / IP / hour) ──────────────────────────
const ipLog   = new Map();
const WIN_MS  = 60 * 60 * 1000;
const MAX_REQ = 3;

export const rateLimiter = (req, res, next) => {
  const ip  = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const hits = (ipLog.get(ip) || []).filter(t => now - t < WIN_MS);
  if (hits.length >= MAX_REQ) {
    return res.status(429).json({ success: false, message: 'Too many submissions. Please try again later.' });
  }
  hits.push(now);
  ipLog.set(ip, hits);
  next();
};

// ─── POST /api/feedback/submit ────────────────────────────────────────────────
export const submitFeedback = async (req, res) => {
  try {
    const { name, role, country, feedback } = req.body;

    const missing = ['name', 'role', 'country', 'feedback'].filter(f => !req.body[f]);
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
    }

    if (feedback.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Feedback must be at least 10 characters.' });
    }

    const entry = await Feedback.create({
      name:     name.trim(),
      role:     role.trim(),
      country:  country.trim(),
      feedback: feedback.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! 🙏',
      data: { id: entry._id },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg });
    }
    console.error('Feedback submit error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─── GET /api/feedback/reviews ────────────────────────────────────────────────
// Public — returns featured + approved feedbacks for display on the site
export const getPublicReviews = async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 12);

    const reviews = await Feedback.find({ status: 'approved', featured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name role country feedback createdAt');

    return res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('Get reviews error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/feedback ──────────────────────────────────────────────────
export const getAllFeedbacks = async (req, res) => {
  try {
    const {
      page      = 1,
      limit     = 25,
      search,
      status,
      featured,
      sortBy    = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    if (search) {
      const re = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ name: re }, { role: re }, { country: re }, { feedback: re }];
    }
    if (status)   query.status   = status;
    if (featured !== undefined) query.featured = featured === 'true';

    const allowedSort = ['createdAt', 'name', 'status', 'featured', 'country'];
    const safeSortBy  = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir     = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page, 10));
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [items, total] = await Promise.all([
      Feedback.find(query)
        .sort({ [safeSortBy]: sortDir })
        .skip((pageNum - 1) * perPage)
        .limit(perPage),
      Feedback.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: { total, page: pageNum, limit: perPage, pages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error('Get feedbacks error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/feedback/:id ─────────────────────────────────────────────
export const getFeedbackById = async (req, res) => {
  try {
    const item = await Feedback.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Feedback not found.' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PATCH /api/admin/feedback/:id/status ────────────────────────────────────
export const updateFeedbackStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const valid = ['pending', 'approved', 'rejected'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const update = { status };
    if (status === 'rejected') update.featured = false; // auto-unfeature on rejection
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const item = await Feedback.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Feedback not found.' });

    return res.json({ success: true, message: `Status updated to "${status}".`, data: item });
  } catch (err) {
    console.error('Update feedback status error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PATCH /api/admin/feedback/:id/feature ────────────────────────────────────
export const toggleFeatured = async (req, res) => {
  try {
    const item = await Feedback.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Feedback not found.' });

    if (item.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved feedback can be featured. Approve it first.',
      });
    }

    item.featured = !item.featured;
    await item.save();

    return res.json({
      success: true,
      message: item.featured ? 'Feedback is now featured as a public review.' : 'Feedback removed from public reviews.',
      data: item,
    });
  } catch (err) {
    console.error('Toggle feature error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DELETE /api/admin/feedback/:id ──────────────────────────────────────────
export const deleteFeedback = async (req, res) => {
  try {
    const item = await Feedback.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Feedback not found.' });
    return res.json({ success: true, message: 'Feedback deleted.' });
  } catch (err) {
    console.error('Delete feedback error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};