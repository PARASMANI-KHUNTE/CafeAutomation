const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Verify token middleware (renamed from authenticateToken for consistency)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token.' });
    }
};

// Check if user is admin middleware
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    next();
};

// For backward compatibility
const authenticateToken = verifyToken;

module.exports = { authenticateToken, verifyToken, isAdmin };