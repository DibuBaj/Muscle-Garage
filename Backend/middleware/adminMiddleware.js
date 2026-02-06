const jwt = require('jsonwebtoken');

const adminMiddleware = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the token is for admin
    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    req.admin = decoded.email || decoded.id;
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

module.exports = adminMiddleware;
