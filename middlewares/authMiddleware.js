const jwt = require('jsonwebtoken');
// console.log('Middleware reached!');

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('Middleware reached!');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.error('Token not found in Authorization header');
        return res.status(401).json({ message: 'Access denied' });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT Secret is not defined');
        return res.status(500).json({ message: 'Internal server error' });
    }

    console.log('Auth Header:', authHeader);
    console.log('Extracted Token:', token);
    console.log('JWT Secret:', process.env.JWT_SECRET);

    console.log('Final Token to Verify:', token);
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };
