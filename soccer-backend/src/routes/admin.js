const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.use(authenticateToken);
router.use(adminAuth);

router.post('/tournaments', async (req, res) => {
  const { tr_id, tr_name, start_date, end_date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO TOURNAMENT (tr_id, tr_name, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [tr_id, tr_name, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding tournament:', error);
    res.status(500).json({ message: 'Error adding tournament', error: error.detail || error.message });
  }
});

router.delete('/tournaments/:trId', async (req, res) => {
    const { trId } = req.params;
    try {
        // CASCADE DELETE should handle related records in TOURNAMENT_TEAM, MATCH_PLAYED, etc.
        const result = await pool.query('DELETE FROM TOURNAMENT WHERE tr_id = $1 RETURNING *', [trId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        res.json({ message: 'Tournament deleted successfully', tournament: result.rows[0] });
    } catch (error) {
        console.error('Error deleting tournament:', error);
        res.status(500).json({ message: 'Error deleting tournament', error: error.detail || error.message });
    }
});


router.post('/tournaments/:trId/teams', async (req, res) => {
  const { trId } = req.params;
  const { team_id, team_group } = req.body;
  try {
    // Check if team exists
    const teamExists = await pool.query('SELECT 1 FROM TEAM WHERE team_id = $1', [team_id]);
    if (teamExists.rows.length === 0) {
        return res.status(404).json({ message: 'Team not found' });
    }
    // Check if tournament exists
     const tournExists = await pool.query('SELECT 1 FROM TOURNAMENT WHERE tr_id = $1', [trId]);
    if (tournExists.rows.length === 0) {
        return res.status(404).json({ message: 'Tournament not found' });
    }
    const result = await pool.query(
      'INSERT INTO TOURNAMENT_TEAM (team_id, tr_id, team_group) VALUES ($1, $2, $3) RETURNING *',
      [team_id, trId, team_group]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding team to tournament:', error);
     res.status(500).json({ message: 'Error adding team to tournament', error: error.detail || error.message });
  }
});

router.post('/tournaments/:trId/teams/:teamId/captain/:playerId', async (req, res) => {
  const { trId, teamId, playerId } = req.params;
  try {
    // First, check if the player is in the team for this tournament
    const playerInTeam = await pool.query(
      'SELECT * FROM TEAM_PLAYER WHERE player_id = $1 AND team_id = $2 AND tr_id = $3',
      [playerId, teamId, trId]
    );

    if (playerInTeam.rows.length === 0) {
      return res.status(404).json({ message: 'Player not found in this team for this tournament' });
    }

    // Remove captain status from any other player in this team/tournament
     await pool.query(
        'UPDATE TEAM_PLAYER SET is_captain = false WHERE team_id = $1 AND tr_id = $2',
        [teamId, trId]
     );

    // Set the selected player as captain
    const result = await pool.query(
      'UPDATE TEAM_PLAYER SET is_captain = true WHERE player_id = $1 AND team_id = $2 AND tr_id = $3 RETURNING *',
      [playerId, teamId, trId]
    );

    res.json({ message: 'Captain selected successfully', teamPlayer: result.rows[0] });
  } catch (error) {
    console.error('Error selecting captain:', error);
    res.status(500).json({ message: 'Error selecting captain', error: error.detail || error.message });
  }
});

 router.post('/tournaments/:trId/teams/:teamId/players/:playerId', async (req, res) => {
    const { trId, teamId, playerId } = req.params;
    // This assumes "approving" a player means adding them to the TEAM_PLAYER table.
    // A more complex flow would involve a separate 'applications' table.
    try {
         // Check if player exists
        const playerExists = await pool.query('SELECT 1 FROM PLAYER WHERE player_id = $1', [playerId]);
        if (playerExists.rows.length === 0) {
            return res.status(404).json({ message: 'Player not found' });
        }
         // Check if team exists
        const teamExists = await pool.query('SELECT 1 FROM TEAM WHERE team_id = $1', [teamId]);
        if (teamExists.rows.length === 0) {
            return res.status(404).json({ message: 'Team not found' });
        }
        // Check if tournament exists
        const tournExists = await pool.query('SELECT 1 FROM TOURNAMENT WHERE tr_id = $1', [trId]);
        if (tournExists.rows.length === 0) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        // Check if player is already in the team for this tournament
        const existingEntry = await pool.query(
            'SELECT 1 FROM TEAM_PLAYER WHERE player_id = $1 AND team_id = $2 AND tr_id = $3',
            [playerId, teamId, trId]
        );

        if (existingEntry.rows.length > 0) {
             return res.status(409).json({ message: 'Player is already in this team for this tournament' });
        }

        const result = await pool.query(
            'INSERT INTO TEAM_PLAYER (player_id, team_id, tr_id) VALUES ($1, $2, $3) RETURNING *',
            [playerId, teamId, trId]
        );
        res.status(201).json({ message: 'Player approved and added to team', teamPlayer: result.rows[0] });
    } catch (error) {
        console.error('Error approving player:', error);
        res.status(500).json({ message: 'Error approving player', error: error.detail || error.message });
    }
});

// Route to get all players (might be useful for approving)
router.get('/players', async (req, res) => {
     try {
        const result = await pool.query('SELECT p.kfupm_id, p.name, pl.jersey_no, pp.position_desc FROM PLAYER pl JOIN PERSON p ON pl.player_id = p.kfupm_id JOIN PLAYING_POSITION pp ON pl.position_to_play = pp.position_id');
        res.json(result.rows);
     } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ message: 'Error fetching players' });
     }
});

 // Route to get all teams
router.get('/teams', async (req, res) => {
     try {
        const result = await pool.query('SELECT * FROM TEAM');
        res.json(result.rows);
     } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ message: 'Error fetching teams' });
     }
});


module.exports = router;