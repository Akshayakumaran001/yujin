/**
 * Role middleware — enforce RBAC.
 * Usage: requireRole('ADMIN') or requireRole(['ADMIN', 'CORE_MEMBER'])
 */
function requireRole(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `Requires role: ${allowed.join(' or ')}` } });
    }
    next();
  };
}

module.exports = { requireRole };
