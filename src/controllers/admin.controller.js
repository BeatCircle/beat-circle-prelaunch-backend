import jwt      from 'jsonwebtoken';
import Admin    from '../models/admin.model.js';
import Waitlist from '../models/waitlist.model.js';

// ─── POST /api/admin/login ────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });

    if (!admin || !admin.validatePassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.json({
      success: true,
      token,
      admin: { username: admin.username, email: admin.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
export const getDashboard = async (_req, res) => {
  try {
    const [total, byTypeArr, byStatusArr, recentEntries] = await Promise.all([
      Waitlist.countDocuments(),
      Waitlist.aggregate([{ $group: { _id: '$userType', count: { $sum: 1 } } }]),
      Waitlist.aggregate([{ $group: { _id: '$status',   count: { $sum: 1 } } }]),
      Waitlist.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('fullName email userType status createdAt'),
    ]);

    const byType   = Object.fromEntries(byTypeArr.map(b => [b._id, b.count]));
    const byStatus = Object.fromEntries(byStatusArr.map(b => [b._id, b.count]));

    return res.json({
      success: true,
      data: { total, byType, byStatus, recentEntries },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const {
      page     = 1,
      limit    = 25,
      search,
      userType,
      status,
      sortBy    = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      const re = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ fullName: re }, { email: re }, { stageName: re }, { country: re }];
    }
    if (userType) query.userType = userType;
    if (status)   query.status   = status;

    const allowedSortFields = ['createdAt', 'fullName', 'email', 'userType', 'status', 'country'];
    const safeSortBy        = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir           = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page, 10));
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [users, total] = await Promise.all([
      Waitlist.find(query)
        .sort({ [safeSortBy]: sortDir })
        .skip((pageNum - 1) * perPage)
        .limit(perPage),
      Waitlist.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page:  pageNum,
        limit: perPage,
        pages: Math.ceil(total / perPage),
      },
    });
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const user = await Waitlist.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PATCH /api/admin/users/:id/status ───────────────────────────────────────
export const updateUserStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const update = { status };
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const user = await Waitlist.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.json({ success: true, data: user, message: `Status updated to "${status}".` });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const user = await Waitlist.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, message: 'Entry deleted.' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/admin/users/export ─────────────────────────────────────────────
export const exportCSV = async (req, res) => {
  try {
    const { userType, status } = req.query;
    const query = {};
    if (userType) query.userType = userType;
    if (status)   query.status   = status;

    const users = await Waitlist.find(query).sort({ createdAt: -1 }).lean();

    const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const headers = [
      'ID', 'Full Name', 'Email', 'User Type', 'Stage Name',
      'Primary Genre', 'Country', 'Music Link', 'Status', 'Admin Notes', 'Submitted At',
    ];

    const rows = users.map(u => [
      u._id,
      u.fullName,
      u.email,
      u.userType,
      u.stageName    || '',
      u.primaryGenre || '',
      u.country,
      u.musicLink    || '',
      u.status,
      u.adminNotes   || '',
      new Date(u.createdAt).toISOString(),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(escape).join(','))
      .join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="beatcircle-waitlist-${Date.now()}.csv"`
    );
    return res.send('\uFEFF' + csv); // BOM for Excel
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
