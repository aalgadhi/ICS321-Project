const pool = require('../db');
const userQueries = require('../queries');

const authenticateToken = async (req, res, next) => {
    const sessionId = req.sessionID;
    if (!sessionId) {
        return res.status(401).json({ message: 'No session found' });
    }

    try {
        const activeSession = await userQueries.getActiveSession(sessionId);
        if (!activeSession) {
            return res.status(401).json({ message: 'Session expired or invalid' });
        }

        const user = await userQueries.getUserByUsername(activeSession.username);
        if (!user || user.is_active !== 'Y') {
            return res.status(401).json({ message: 'User not found or inactive' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = authenticateToken;
