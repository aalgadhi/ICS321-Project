const pool = require('./db');

const userQueries = {
    // Get user by username with their role information
    getUserByUsername: async (username) => {
        try {
            // First get the user account information
            const userResult = await pool.query(
                `SELECT ua.username, ua.password, ua.kfupm_id, ua.full_name, ua.date_of_birth,
                    CASE 
                        WHEN a.username IS NOT NULL THEN 'admin'
                        WHEN g.username IS NOT NULL THEN 'guest'
                        ELSE 'user'
                    END as role
                FROM USER_ACCOUNT ua
                LEFT JOIN ADMIN a ON ua.username = a.username
                LEFT JOIN GUEST g ON ua.username = g.username
                WHERE ua.username = $1`,
                [username]
            );
            
            if (userResult.rows.length === 0) {
                return null;
            }

            return userResult.rows[0];
        } catch (error) {
            console.error('Error fetching user by username:', error);
            throw error;
        }
    },

    // Create a new user
    async createUser({ username, password, kfupm_id, full_name, date_of_birth }) {
        try {
            console.log('Executing createUser query with:', {
                username,
                kfupm_id,
                full_name,
                date_of_birth,
                password_length: password ? password.length : 0
            });

            const result = await pool.query(
                `INSERT INTO USER_ACCOUNT (username, password, kfupm_id, full_name, date_of_birth) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING username, kfupm_id, full_name, date_of_birth`,
                [username, password, kfupm_id, full_name, date_of_birth]
            );

            console.log('User created successfully:', result.rows[0]);
            return result.rows[0];
        } catch (error) {
            console.error('Error in createUser query:', {
                message: error.message,
                detail: error.detail,
                constraint: error.constraint,
                code: error.code,
                table: error.table,
                schema: error.schema
            });
            throw error;
        }
    },

    // Get user by KFUPM ID
    async getUserByKFUPMId(kfupm_id) {
        const result = await pool.query(
            'SELECT * FROM USER_ACCOUNT WHERE kfupm_id = $1',
            [kfupm_id]
        );
        return result.rows[0];
    },

    // Update user profile
    async updateUserProfile(username, { full_name, date_of_birth }) {
        const result = await pool.query(
            `UPDATE USER_ACCOUNT 
            SET full_name = $1, date_of_birth = $2 
            WHERE username = $3 
            RETURNING username, kfupm_id, full_name, date_of_birth`,
            [full_name, date_of_birth, username]
        );
        return result.rows[0];
    }
};

module.exports = userQueries; 