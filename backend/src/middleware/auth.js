const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const accessSecret = process.env.JWT_ACCESS_SECRET || 'your_jwt_access_secret_key_12345';
    const decoded = jwt.verify(token, accessSecret);
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User matching token not found' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: 'User account is suspended' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired access token' });
  }
};

module.exports = authenticateJWT;
