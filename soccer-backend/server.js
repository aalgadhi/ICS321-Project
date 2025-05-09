const express = require('express');
const pool = require('./src/db');
require('dotenv').config();
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const guestRoutes = require('./src/routes/guest');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Database test route
app.get('/api/test-db', async (req, res) => {
    try {
        // Test basic connection
        const result = await pool.query('SELECT NOW()');
        
        // Test schema by checking some key tables
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);

        // Test tournament table specifically
        const tournamentCount = await pool.query('SELECT COUNT(*) FROM tournament');
        
        res.json({ 
            message: 'Database is connected!',
            timestamp: result.rows[0].now,
            database: process.env.DB_DATABASE,
            tables: tables.rows.map(t => t.table_name),
            tournamentCount: tournamentCount.rows[0].count
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ 
            message: 'Database connection failed',
            error: error.message,
            database: process.env.DB_DATABASE
        });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/guest', guestRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});