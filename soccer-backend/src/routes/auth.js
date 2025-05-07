const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM USERS WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
          req.session.userId = user.kfupm_id;
          req.session.role = user.role;
          res.json({ message: 'Login successful', user: { id: user.kfupm_id, username: user.username, role: user.role } });
      } else {
           res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

router.get('/status', authenticateToken, (req, res) => {
    res.json({ isLoggedIn: true, user: { id: req.user.kfupm_id, username: req.user.username, role: req.user.role } });
});

router.post('/signup', async (req, res) => {
    const { kfupm_id, name, date_of_birth, username, password } = req.body; // Expect kfupm_id from body
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert into PERSON table, INCLUDING kfupm_id from the body
        const personResult = await client.query(
            'INSERT INTO PERSON (kfupm_id, name, date_of_birth) VALUES ($1, $2, $3) RETURNING kfupm_id', // Return ID to confirm insertion
            [kfupm_id, name, date_of_birth]
        );
        const newPersonId = personResult.rows[0].kfupm_id; // Get the ID that was just inserted

        // Insert into USERS table using the provided kfupm_id
        const userResult = await client.query(
            'INSERT INTO USERS (kfupm_id, username, password, role) VALUES ($1, $2, $3, $4) RETURNING kfupm_id, username, role',
            [newPersonId, username, hashedPassword, 'guest']
        );

        await client.query('COMMIT');

        res.status(201).json({ message: 'User registered successfully', user: userResult.rows[0] });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Signup error:', error);
        // Check for unique violation errors
        if (error.constraint === 'person_pkey' || error.constraint === 'users_kfupm_id_fkey') { // person_pkey if kfupm_id exists in PERSON
             res.status(409).json({ message: `User with KFUPM ID ${kfupm_id} already exists.` });
        } else if (error.constraint === 'users_username_key') { // users_username_key if username exists in USERS
             res.status(409).json({ message: `Username "${username}" already exists.` });
        }
         else {
             res.status(500).json({ message: 'Error registering user', error: error.detail || error.message });
        }
    } finally {
        client.release();
    }
});


module.exports = router;