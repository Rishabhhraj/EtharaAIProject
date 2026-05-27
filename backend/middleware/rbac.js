export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
  }
  next();
};

export const requireAdminOrMember = (req, res, next) => {
  if (!['admin', 'member'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Valid role required.',
    });
  }
  next();
};
