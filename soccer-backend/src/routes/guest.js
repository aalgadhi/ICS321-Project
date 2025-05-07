const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken); // Guests also need to be logged in based on project description (System login/logout)

router.get('/tournaments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM TOURNAMENT ORDER BY start_date');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ message: 'Error fetching tournaments' });
  }
});

router.get('/tournaments/:trId/matches', async (req, res) => {
  const { trId } = req.params;
  try {
    const result = await pool.query(`
      SELECT
          mp.match_no,
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
          MATCH_PLAYED mp
      JOIN
          TEAM t1 ON mp.team_id1 = t1.team_id
      JOIN
          TEAM t2 ON mp.team_id2 = t2.team_id
      JOIN
          VENUE v ON mp.venue_id = v.venue_id
      LEFT JOIN
          PLAYER pl ON mp.player_of_match = pl.player_id
      LEFT JOIN
          PERSON p ON pl.player_id = p.kfupm_id
      WHERE
          mp.tr_id = $1
      ORDER BY
          mp.play_date;
    `, [trId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching match results:', error);
    res.status(500).json({ message: 'Error fetching match results' });
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
          MATCH_PLAYED mp ON pb.match_no = mp.match_no
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
                players: [{ player_id: row.player_id, player_name: row.player_name, match_no: row.match_no, match_date: row.play_date }]
            });
        } else {
            team.players.push({ player_id: row.player_id, player_name: row.player_name, match_no: row.match_no, match_date: row.play_date });
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
            FROM TEAM_PLAYER tp
            JOIN PLAYER pl ON tp.player_id = pl.player_id
            JOIN PERSON p ON pl.player_id = p.kfupm_id
            WHERE tp.team_id = $1 AND tp.tr_id = $2
        `, [teamId, trId]);

         // Get Support Staff (Coach, Asst Coach, Manager)
        const supportResult = await pool.query(`
            SELECT p.kfupm_id, p.name, s.support_desc as role
            FROM TEAM_SUPPORT ts
            JOIN PERSON p ON ts.support_id = p.kfupm_id
            JOIN SUPPORT s ON ts.support_type = s.support_type
            WHERE ts.team_id = $1 AND ts.tr_id = $2 AND ts.support_type IN ('CH', 'AC', 'MG')
        `, [teamId, trId]);

        // Get Captain (if one is set using the is_captain flag we added)
         const captainResult = await pool.query(`
             SELECT p.kfupm_id, p.name, 'Captain' as role
             FROM TEAM_PLAYER tp
             JOIN PLAYER pl ON tp.player_id = pl.player_id
             JOIN PERSON p ON pl.player_id = p.kfupm_id
             WHERE tp.team_id = $1 AND tp.tr_id = $2 AND tp.is_captain = true
         `, [teamId, trId]);

        // Combine results - ensure no duplicates for captain if they are also listed as player
        const members = [...supportResult.rows];
        const captain = captainResult.rows[0]; // Assuming max one captain per team/tournament

        playersResult.rows.forEach(player => {
            // Add player if not the captain
            if (!captain || player.kfupm_id !== captain.kfupm_id) {
                 members.push(player);
            }
        });

        if (captain) {
            // Add captain first or ensure they are marked as captain
             // Find if captain was also listed in support (e.g., Player-Coach) and update role
             const existingCaptainIndex = members.findIndex(m => m.kfupm_id === captain.kfupm_id);
             if(existingCaptainIndex !== -1) {
                 // Could concatenate roles or just mark as captain
                 members[existingCaptainIndex].role = 'Captain (' + members[existingCaptainIndex].role + ')';
             } else {
                 // If captain wasn't in support or player list initially (shouldn't happen with this schema), add them
                 // This path is unlikely if the captain is also a PLAYER.
                  members.push(captain);
             }
        }


        res.json(members);

    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ message: 'Error fetching team members' });
    }
});


module.exports = router;