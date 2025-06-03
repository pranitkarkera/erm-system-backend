const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid authentication token' });
  }
};

// Middleware to check if user is a manager
const isManager = (req, res, next) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Access denied. Manager role required.' });
  }
  next();
};

// Middleware to check if user is an engineer
const isEngineer = (req, res, next) => {
  if (req.user.role !== 'engineer') {
    return res.status(403).json({ message: 'Access denied. Engineer role required.' });
  }
  next();
};

// Middleware to check if user is either a manager or the engineer themselves
const isManagerOrSelf = (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.userId !== req.params.id) {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  next();
};

module.exports = {
  auth,
  isManager,
  isEngineer,
  isManagerOrSelf
}; 