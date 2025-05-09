const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function setupDatabase() {
    try {
        // Read the SQL file
        const sql = fs.readFileSync(path.join(__dirname, 'setup.sql'), 'utf8');
        
        // Execute the SQL
        await pool.query(sql);
        console.log('Database setup completed successfully');
    } catch (error) {
        console.error('Error setting up database:', error);
        throw error;
    }
}

// Run the setup
setupDatabase().catch(console.error); 