import { verifyToken } from '../utils/auth.js';
import { getUserById } from '../utils/dataLayer.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);

    // Refresh acting_role AND department_id from live data (they change when HOD leave is approved)
    // This ensures the middleware always has the latest role state without re-login
    const liveUser = await getUserById(decoded.id);
    req.user = {
      ...decoded,
      acting_role:   liveUser?.acting_role   ?? null,
      department_id: liveUser?.department_id ?? decoded.department_id,
      role:          liveUser?.role          ?? decoded.role,
    };

    return next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  // Check both permanent role and acting_role
  const effectiveRole = req.user.role;
  const actingRole    = req.user.acting_role;

  const hasRole = allowedRoles.some(
    (r) => r === effectiveRole || r === actingRole
  );

  if (!hasRole) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
  }
  return next();
};
