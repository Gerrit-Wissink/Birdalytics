const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const path = require('path');

// Import routes
const userRoutes = require('./routes/userRoutes');
const birdRoutes = require('./routes/birdRoutes');

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
if (process.env.SYNC_DB === 'true') {
    sequelize.sync({ alter: true })
        .then(() => {
            console.log('Database synced successfully');
        })
        .catch(err => {
            console.error('Error syncing database:', err);
        });
} else {
    console.log('Database sync disabled (set SYNC_DB=true in .env to enable)');
}

//Serve static files
app.use(express.static(path.join(__dirname, 'static')));

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Birdalytics API', 
        version: '1.0.0',
        status: 'running'
    });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/guess', birdRoutes);

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
app.listen(PORT, () => {
    console.log(`Express started on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

