const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

// Import models
const User = require('./models/User');
// const Example = require('./models/Example');

// Import routes
const userRoutes = require('./routes/userRoutes');
// const exampleRoutes = require('./routes/exampleRoutes');

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

// Sync database (creates tables if they don't exist)
// Use { force: true } to drop tables on every restart (development only)
// Use { alter: true } to update tables to match models

if (process.env.SYNC_DB ==='true'){
    sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
    .then(() => {
        console.log('Database synced successfully');
    })
    .catch(err => {
        console.error('Error syncing database:', err);
    });
} else {
    console.log('Database sync disabled (set SYNC_DB=true in .env to enable)');
}


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
// app.use('/api/examples', exampleRoutes);

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

