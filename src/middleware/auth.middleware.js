import jwt from 'jsonwebtoken';

/**
 * Protects routes — requires a valid Bearer token in the Authorization header.
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // { id, username, iat, exp }
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid or expired token' });
  }
};
