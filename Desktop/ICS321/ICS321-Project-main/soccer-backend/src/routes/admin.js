const express = require('express');
const router = express.Router();
const pool = require('../db');
// const authenticateToken = require('../middleware/auth');
// const adminAuth = require('../middleware/adminAuth');

// router.use(authenticateToken);
// router.use(adminAuth);

router.post('/tournaments', async (req, res) => {
  const { tr_id, tr_name, start_date, end_date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO TOURNAMENT (tr_id, tr_name, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [tr_id, tr_name, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      // Unique violation (duplicate primary key)
      res.status(409).json({ message: 'A tournament with this ID already exists.' });
    } else {
      console.error('Error adding tournament:', error);
      res.status(500).json({ message: 'Error adding tournament', error: error.detail || error.message });
    }
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
    if (error.code === '23505') {
      res.status(409).json({ message: 'This team is already registered for this tournament.' });
    } else {
      console.error('Error adding team to tournament:', error);
      res.status(500).json({ message: 'Error adding team to tournament', error: error.detail || error.message });
    }
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

// Add a new played match
router.post('/tournaments/:trId/matches', async (req, res) => {
  const { trId } = req.params;
  const {
    match_no,
    play_stage,
    play_date,
    team_id1,
    team_id2,
    results,
    decided_by,
    goal_score,
    venue_id,
    audience,
    player_of_match
  } = req.body;

  try {
    // Check if tournament exists
    const tournExists = await pool.query('SELECT 1 FROM TOURNAMENT WHERE tr_id = $1', [trId]);
    if (tournExists.rows.length === 0) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Check if teams exist and are in the tournament
    const teamsExist = await pool.query(
      'SELECT 1 FROM TOURNAMENT_TEAM WHERE tr_id = $1 AND team_id IN ($2, $3)',
      [trId, team_id1, team_id2]
    );
    if (teamsExist.rows.length !== 2) {
      return res.status(400).json({ message: 'Both teams must be registered in this tournament' });
    }

    // Check if venue exists
    const venueExists = await pool.query('SELECT 1 FROM VENUE WHERE venue_id = $1', [venue_id]);
    if (venueExists.rows.length === 0) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Check if player of match exists and is in one of the teams
    const playerExists = await pool.query(
      'SELECT 1 FROM TEAM_PLAYER WHERE player_id = $1 AND team_id IN ($2, $3) AND tr_id = $4',
      [player_of_match, team_id1, team_id2, trId]
    );
    if (playerExists.rows.length === 0) {
      return res.status(400).json({ message: 'Player of match must be from one of the playing teams' });
    }

    const result = await pool.query(
      `INSERT INTO MATCH_PLAYED (
        match_no, tr_id, play_stage, play_date, team_id1, team_id2,
        results, decided_by, goal_score, venue_id, audience, player_of_match
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [match_no, trId, play_stage, play_date, team_id1, team_id2,
       results, decided_by, goal_score, venue_id, audience, player_of_match]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'A match with this number already exists in this tournament' });
    } else {
      console.error('Error adding match:', error);
      res.status(500).json({ message: 'Error adding match', error: error.detail || error.message });
    }
  }
});

// Update a played match
router.put('/tournaments/:trId/matches/:matchNo', async (req, res) => {
  const { trId, matchNo } = req.params;
  const {
    play_stage,
    play_date,
    team_id1,
    team_id2,
    results,
    decided_by,
    goal_score,
    venue_id,
    audience,
    player_of_match
  } = req.body;

  try {
    // Check if match exists
    const matchExists = await pool.query(
      'SELECT 1 FROM MATCH_PLAYED WHERE match_no = $1 AND tr_id = $2',
      [matchNo, trId]
    );
    if (matchExists.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const result = await pool.query(
      `UPDATE MATCH_PLAYED SET
        play_stage = $1,
        play_date = $2,
        team_id1 = $3,
        team_id2 = $4,
        results = $5,
        decided_by = $6,
        goal_score = $7,
        venue_id = $8,
        audience = $9,
        player_of_match = $10
      WHERE match_no = $11 AND tr_id = $12
      RETURNING *`,
      [play_stage, play_date, team_id1, team_id2, results, decided_by,
       goal_score, venue_id, audience, player_of_match, matchNo, trId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ message: 'Error updating match', error: error.detail || error.message });
  }
});

// Delete a played match
router.delete('/tournaments/:trId/matches/:matchNo', async (req, res) => {
  const { trId, matchNo } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM MATCH_PLAYED WHERE match_no = $1 AND tr_id = $2 RETURNING *',
      [matchNo, trId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json({ message: 'Match deleted successfully', match: result.rows[0] });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ message: 'Error deleting match', error: error.detail || error.message });
  }
});

// Add a next match
router.post('/tournaments/:trId/next-matches', async (req, res) => {
  const { trId } = req.params;
  const {
    match_no,
    play_date,
    play_stage,
    venue_id,
    team_id1,
    team_id2
  } = req.body;

  try {
    // Check if tournament exists
    const tournExists = await pool.query('SELECT 1 FROM TOURNAMENT WHERE tr_id = $1', [trId]);
    if (tournExists.rows.length === 0) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Check if teams exist and are in the tournament
    const teamsExist = await pool.query(
      'SELECT 1 FROM TOURNAMENT_TEAM WHERE tr_id = $1 AND team_id IN ($2, $3)',
      [trId, team_id1, team_id2]
    );
    if (teamsExist.rows.length !== 2) {
      return res.status(400).json({ message: 'Both teams must be registered in this tournament' });
    }

    // Check if venue exists
    const venueExists = await pool.query('SELECT 1 FROM VENUE WHERE venue_id = $1', [venue_id]);
    if (venueExists.rows.length === 0) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    const result = await pool.query(
      `INSERT INTO NEXT_MATCH (
        match_no, tr_id, play_date, play_stage, venue_id, team_id1, team_id2
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [match_no, trId, play_date, play_stage, venue_id, team_id1, team_id2]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'A match with this number already exists in this tournament' });
    } else {
      console.error('Error adding next match:', error);
      res.status(500).json({ message: 'Error adding next match', error: error.detail || error.message });
    }
  }
});

// Update a next match
router.put('/tournaments/:trId/next-matches/:matchNo', async (req, res) => {
  const { trId, matchNo } = req.params;
  const {
    play_date,
    play_stage,
    venue_id,
    team_id1,
    team_id2
  } = req.body;

  try {
    // Check if match exists
    const matchExists = await pool.query(
      'SELECT 1 FROM NEXT_MATCH WHERE match_no = $1 AND tr_id = $2',
      [matchNo, trId]
    );
    if (matchExists.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const result = await pool.query(
      `UPDATE NEXT_MATCH SET
        play_date = $1,
        play_stage = $2,
        venue_id = $3,
        team_id1 = $4,
        team_id2 = $5
      WHERE match_no = $6 AND tr_id = $7
      RETURNING *`,
      [play_date, play_stage, venue_id, team_id1, team_id2, matchNo, trId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating next match:', error);
    res.status(500).json({ message: 'Error updating next match', error: error.detail || error.message });
  }
});

// Delete a next match
router.delete('/tournaments/:trId/next-matches/:matchNo', async (req, res) => {
  const { trId, matchNo } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM NEXT_MATCH WHERE match_no = $1 AND tr_id = $2 RETURNING *',
      [matchNo, trId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json({ message: 'Next match deleted successfully', match: result.rows[0] });
  } catch (error) {
    console.error('Error deleting next match:', error);
    res.status(500).json({ message: 'Error deleting next match', error: error.detail || error.message });
  }
});

// Move a next match to played matches
router.post('/tournaments/:trId/next-matches/:matchNo/play', async (req, res) => {
  const { trId, matchNo } = req.params;
  const {
    decided_by,
    goal_score,
    venue_id,
    audience,
    player_of_match,
    stop1_sec,
    stop2_sec,
    // match_details for both teams
    team1_win_lose,
    team1_penalty_score,
    team1_player_gk,
    team2_win_lose,
    team2_penalty_score,
    team2_player_gk
  } = req.body;

  try {
    await pool.query('BEGIN');

    // Get the next match details
    const nextMatch = await pool.query(
      'SELECT * FROM NEXT_MATCH WHERE match_no = $1 AND tr_id = $2',
      [matchNo, trId]
    );

    if (nextMatch.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Next match not found' });
    }

    const match = nextMatch.rows[0];
    // Calculate results
    const [team1Goals, team2Goals] = goal_score.split('-').map(Number);
    let results = 'draw';
    if (team1Goals > team2Goals) results = 'team1-won';
    else if (team1Goals < team2Goals) results = 'team2-won';

    // Insert into match_played with all attributes
    const playedResult = await pool.query(
      `INSERT INTO MATCH_PLAYED (
        match_no, tr_id, play_stage, play_date, team_id1, team_id2,
        results, decided_by, goal_score, venue_id, audience, player_of_match, stop1_sec, stop2_sec
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [match.match_no, match.tr_id, match.play_stage, match.play_date,
       match.team_id1, match.team_id2, results, decided_by, goal_score,
       venue_id, audience, player_of_match, stop1_sec, stop2_sec]
    );

    // Insert into match_details for both teams
    await pool.query(
      `INSERT INTO match_details (match_no, tr_id, team_id, win_lose, decided_by, goal_score, penalty_score, player_gk)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [match.match_no, match.tr_id, match.team_id1, team1_win_lose, decided_by, team1Goals, team1_penalty_score, team1_player_gk]
    );
    await pool.query(
      `INSERT INTO match_details (match_no, tr_id, team_id, win_lose, decided_by, goal_score, penalty_score, player_gk)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [match.match_no, match.tr_id, match.team_id2, team2_win_lose, decided_by, team2Goals, team2_penalty_score, team2_player_gk]
    );

    // Delete from next_match
    await pool.query(
      'DELETE FROM NEXT_MATCH WHERE match_no = $1 AND tr_id = $2',
      [matchNo, trId]
    );

    await pool.query('COMMIT');
    res.status(201).json(playedResult.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error moving match to played:', error);
    res.status(500).json({ message: 'Error moving match to played', error: error.detail || error.message });
  }
});

// Get all upcoming matches for a tournament (admin)
router.get('/tournaments/:trId/next-matches', async (req, res) => {
  const { trId } = req.params;
  try {
    const result = await pool.query(`
      SELECT
        nm.match_no,
        nm.tr_id,
        nm.play_date,
        nm.play_stage,
        v.venue_name,
        t1.team_name AS team1_name,
        t2.team_name AS team2_name,
        nm.venue_id,
        nm.team_id1,
        nm.team_id2
      FROM
        next_match nm
      LEFT JOIN team t1 ON nm.team_id1 = t1.team_id
      LEFT JOIN team t2 ON nm.team_id2 = t2.team_id
      LEFT JOIN venue v ON nm.venue_id = v.venue_id
      WHERE nm.tr_id = $1
      ORDER BY nm.play_date;
    `, [trId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching next matches (admin):', error);
    res.status(500).json({ message: 'Error fetching next matches.' });
  }
});

module.exports = router;