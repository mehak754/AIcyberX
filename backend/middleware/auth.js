const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'aicyberx_secret';

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token)
    return res.status(401).json({ error: 'Access denied. Please log in.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};
