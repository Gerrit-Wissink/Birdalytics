const dotenv = require('dotenv');
const sequelize = require('./config/database');
const app = require('./app');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8000;

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

        // Start server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Express started on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (err) {
        console.log('DB not ready, retrying in 3s...');
        setTimeout(connectWithRetry, 3000);
    }
};

connectWithRetry();
