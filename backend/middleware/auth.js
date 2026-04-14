const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        /* commenting out
        const token = req.header('Authorization')?.replace('Bearer ', '');
        */

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication token required'
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured');
            return res.status(500).json({
                success: false,
                error: 'Server authentication is not configured'
            });
        }

        const token = authHeader.replace('Bearer ', '').trim();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired authentication token'
        });
    }
};

module.exports = authMiddleware;
