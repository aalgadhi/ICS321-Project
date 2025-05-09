const express = require('express');
const router = express.Router();
const pool = require('../db');
// const authenticateToken = require('../middleware/auth');

// router.use(authenticateToken); // Removed: Guests do not need to be logged in

router.get('/tournaments', async (req, res) => {
  try {
    const result = await pool.query('SELECT tr_id, tr_name FROM tournament ORDER BY tr_name');
    if (result.rows.length === 0) {
      console.warn('No tournaments found in the database.');
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ message: 'Error fetching tournaments' });
  }
});

// NOTE: The match_played table must have a tr_id column referencing tournament.tr_id for tournament filtering to work.
// If you get an error about mp.tr_id not existing, you must add this column to your schema.
router.get('/tournaments/:trId/matches', async (req, res) => {
  const { trId } = req.params;
  try {
    const result = await pool.query(`
      SELECT
          mp.match_no,
          mp.tr_id,
          mp.play_stage,
          mp.play_date,
          t1.team_name AS team1_name,
          t2.team_name AS team2_name,
          mp.results,
          mp.goal_score,
          v.venue_name,
          mp.audience,
          p.name AS player_of_match_name
      FROM
          match_played mp
      LEFT JOIN
          team t1 ON mp.team_id1 = t1.team_id
      LEFT JOIN
          team t2 ON mp.team_id2 = t2.team_id
      LEFT JOIN
          venue v ON mp.venue_id = v.venue_id
      LEFT JOIN
          player pl ON mp.player_of_match = pl.player_id
      LEFT JOIN
          person p ON pl.player_id = p.kfupm_id
      WHERE
          mp.tr_id = $1
      ORDER BY
          mp.play_date;
    `, [trId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching match results:', error);
    res.status(500).json({ message: 'Error fetching match results.' });
  }
});

router.get('/players/highest-scorer', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
          p.kfupm_id,
          p.name,
          COUNT(gd.goal_id) as total_goals
      FROM
          PERSON p
      JOIN
          PLAYER pl ON p.kfupm_id = pl.player_id
      JOIN
          GOAL_DETAILS gd ON pl.player_id = gd.player_id
      WHERE gd.goal_type = 'N' OR gd.goal_type = 'O' -- Count normal/own goals, exclude penalties per typical highest scorer logic
      GROUP BY
          p.kfupm_id, p.name
      ORDER BY
          total_goals DESC
      LIMIT 1;
    `);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'No goals recorded yet' });
    }
  } catch (error) {
    console.error('Error fetching highest scorer:', error);
    res.status(500).json({ message: 'Error fetching highest scorer' });
  }
});

router.get('/teams/red-cards', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
          t.team_id,
          t.team_name,
          p.kfupm_id AS player_id,
          p.name AS player_name,
          mp.match_no,
          mp.tr_id,
          mp.play_date
      FROM
          PLAYER_BOOKED pb
      JOIN
          TEAM t ON pb.team_id = t.team_id
      JOIN
          PLAYER pl ON pb.player_id = pl.player_id
      JOIN
          PERSON p ON pl.player_id = p.kfupm_id
      JOIN
          MATCH_PLAYED mp ON pb.match_no = mp.match_no AND pb.tr_id = mp.tr_id
      WHERE
          pb.sent_off = 'Y'
      ORDER BY
          t.team_name, mp.play_date;
    `);
    // Group by team name for better display
    const teamsWithRedCards = result.rows.reduce((acc, row) => {
        const team = acc.find(t => t.team_id === row.team_id);
        if (!team) {
            acc.push({
                team_id: row.team_id,
                team_name: row.team_name,
                players: [{ player_id: row.player_id, player_name: row.player_name, match_no: row.match_no, tr_id: row.tr_id, match_date: row.play_date }]
            });
        } else {
            team.players.push({ player_id: row.player_id, player_name: row.player_name, match_no: row.match_no, tr_id: row.tr_id, match_date: row.play_date });
        }
        return acc;
    }, []);
    res.json(teamsWithRedCards);
  } catch (error) {
    console.error('Error fetching red card players:', error);
    res.status(500).json({ message: 'Error fetching red card players' });
  }
});


router.get('/teams/:teamId/:trId/members', async (req, res) => {
    const { teamId, trId } = req.params;
    try {
        // Get Players
        const playersResult = await pool.query(`
            SELECT p.kfupm_id, p.name, 'Player' as role
            FROM team_player tp
            JOIN player pl ON tp.player_id = pl.player_id
            JOIN person p ON pl.player_id = p.kfupm_id
            WHERE tp.team_id = $1 AND tp.tr_id = $2
        `, [teamId, trId]);

        // Get Support Staff (Coach, Asst Coach, Manager, etc.)
        const supportResult = await pool.query(`
            SELECT p.kfupm_id, p.name, s.support_desc as role
            FROM team_support ts
            JOIN person p ON ts.support_id = p.kfupm_id
            JOIN support s ON ts.support_type = s.support_type
            WHERE ts.team_id = $1 AND ts.tr_id = $2
        `, [teamId, trId]);

        // Combine results
        const members = [...playersResult.rows, ...supportResult.rows];
        res.json(members);
    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ message: 'Error fetching team members' });
    }
});

// Get all teams
router.get('/teams', async (req, res) => {
  try {
    const result = await pool.query('SELECT team_id, team_name FROM team ORDER BY team_name');
    if (result.rows.length === 0) {
      console.warn('No teams found in the database.');
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Error fetching teams' });
  }
});

// Add: Endpoint for next matches in a tournament
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
        t2.team_name AS team2_name
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
    console.error('Error fetching next matches:', error);
    res.status(500).json({ message: 'Error fetching next matches.' });
  }
});

// Get all venues
router.get('/venues', async (req, res) => {
  try {
    const result = await pool.query('SELECT venue_id, venue_name FROM venue ORDER BY venue_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ message: 'Error fetching venues' });
  }
});

module.exports = router;