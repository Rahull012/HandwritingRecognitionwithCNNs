// middleware/auth.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // Assuming your JWT contains `id`
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Authorization failed' });
  }
};

module.exports = { authMiddleware };