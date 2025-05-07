const pool = require('../db');

const authenticateToken = async (req, res, next) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.sendStatus(401); // Unauthorized
  }
  try {
    // This is line 8. Ensure it matches exactly, including the $1 placeholder.
    const result = await pool.query('SELECT * FROM USERS WHERE kfupm_id = $1', [userId]);
    if (result.rows.length > 0) {
      req.user = result.rows[0]; // Attach user info to request
      next();
    } else {
      res.sendStatus(403); // Forbidden (user not found in DB)
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.sendStatus(500); // Internal Server Error
  }
};

module.exports = authenticateToken;
