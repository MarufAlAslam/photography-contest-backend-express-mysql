const jwt = require('jsonwebtoken');

const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, admin) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });

        // Check if the user is an admin
        if (!admin.isAdmin) return res.status(403).json({ message: 'Not authorized as admin' });

        req.admin = admin;
        next();
    });
};

module.exports = { authenticateAdmin };
