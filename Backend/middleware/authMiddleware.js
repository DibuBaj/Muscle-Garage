const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded.id;

    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Token is not valid', error: err.message });
  }
};

module.exports = authMiddleware;
