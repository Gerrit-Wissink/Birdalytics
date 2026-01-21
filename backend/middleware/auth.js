// Example authentication middleware
const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No authentication token provided'
            });
        }
        
        // Add your JWT verification logic here
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = decoded;
        
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid authentication token'
        });
    }
};

module.exports = authMiddleware;
