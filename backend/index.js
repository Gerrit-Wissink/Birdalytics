const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const path = require('path');
const authMiddleware = require('./middleware/auth');
const fs = require('fs');

// Import routes
const userRoutes = require('./routes/userRoutes');
const birdRoutes = require('./routes/birdRoutes');
const recordRoutes = require('./routes/recordRoutes');
const boxRoutes = require('./routes/boxRoutes');
const imageRoutes = require('./routes/imageRoutes');
const speciesRoutes = require('./routes/speciesRoutes');
const jobRoutes = require('./routes/jobRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Optional database sync - controlled by environment variable
// Set SYNC_DB=true in .env to enable syncing
const connectWithRetry = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        if (process.env.SYNC_DB === 'true') {
            await sequelize.sync({ alter: true });
            console.log('Database synced successfully');
        }

    } catch (err) {
        console.log('DB not ready, retrying in 3s...');
        setTimeout(connectWithRetry, 3000);
    }
};

connectWithRetry();

// Routes
app.get('/api', (req, res) => {
    res.json({
        message: 'Birdalytics API',
        version: '1.0.0',
        status: 'running'
    });
});

// API Routes
app.use('/api/users', userRoutes);

/* commenting out
app.use('/api/users', userRoutes);
app.use('/api/guess', birdRoutes);
app.use('/api/record', recordRoutes);
app.use('/api/boxes', boxRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/species', speciesRoutes);
app.use('/api/jobs', jobRoutes);
*/

app.use('/api/guess', authMiddleware, birdRoutes);
app.use('/api/record', authMiddleware, recordRoutes);
app.use('/api/boxes', authMiddleware, boxRoutes);
app.use('/api/images', authMiddleware, imageRoutes);
app.use('/api/species', authMiddleware, speciesRoutes);
app.use('/api/jobs', authMiddleware, jobRoutes);

//Serve static files
const staticDir = path.join(__dirname, 'static');
const indexPath = path.join(staticDir, 'index.html');
const hasFrontendBuild = fs.existsSync(indexPath);

// Serve static files only when the frontend build exists
if (hasFrontendBuild) {
    app.use(express.static(staticDir));

    // React catch-all for non-API GET routes
    app.get('/{*splat}', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }

        res.sendFile(indexPath);
    });
} else {
    console.warn(`Frontend build not found at ${indexPath}. Skipping static file hosting.`);
}

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express started on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
