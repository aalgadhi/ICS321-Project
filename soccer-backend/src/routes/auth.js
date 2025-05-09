const express = require('express');
const router = express.Router();
const pool = require('../db');
const userQueries = require('../queries');

// Signup route
router.post('/signup', async (req, res) => {
    const { username, password, kfupm_id, full_name, date_of_birth } = req.body;
    
    try {
        console.log('Received signup request with data:', {
            username,
            kfupm_id,
            full_name,
            date_of_birth,
            password_length: password ? password.length : 0
        });
        
        const user = await userQueries.createUser({
            username,
            password,
            kfupm_id,
            full_name,
            date_of_birth
        });

        res.status(201).json({ 
            message: 'User registered successfully', 
            user: {
                username: user.username,
                kfupm_id: user.kfupm_id,
                full_name: user.full_name
            }
        });

    } catch (error) {
        console.error('Signup error details:', {
            message: error.message,
            detail: error.detail,
            constraint: error.constraint,
            code: error.code,
            stack: error.stack,
            table: error.table,
            schema: error.schema
        });
        
        // Check for unique violation errors
        if (error.constraint === 'user_account_pkey') {
            res.status(409).json({ message: `Username "${username}" already exists.` });
        } else if (error.constraint === 'user_account_kfupm_id_key') {
            res.status(409).json({ message: `KFUPM ID ${kfupm_id} is already registered.` });
        } else {
            res.status(500).json({ 
                message: 'Error registering user', 
                error: error.detail || error.message 
            });
        }
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await userQueries.getUserByUsername(username);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Simple password comparison
        if (password !== user.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Only 'admin' is treated as admin, all others are 'guest'
        const userRole = user.role === 'admin' ? 'admin' : 'guest';

        // Return user info (excluding password)
        const { password: _, ...userInfo } = user;
        res.json({ 
            message: 'Login successful', 
            user: { ...userInfo, role: userRole }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get current user info
router.get('/me', async (req, res) => {
    try {
        const { password, ...userInfo } = req.user;
        res.json(userInfo);
    } catch (error) {
        console.error('Error getting user info:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', async (req, res) => {
    const { full_name, date_of_birth } = req.body;
    try {
        const result = await pool.query(
            `UPDATE USER_ACCOUNT 
            SET full_name = $1, date_of_birth = $2 
            WHERE username = $3 
            RETURNING username, kfupm_id, full_name, date_of_birth`,
            [full_name, date_of_birth, req.user.username]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Change password
router.put('/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        // Verify current password
        if (currentPassword !== req.user.password) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        await pool.query(
            'UPDATE USER_ACCOUNT SET password = $1 WHERE username = $2',
            [newPassword, req.user.username]
        );
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;