const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: 'postgresql://ao7079:908c2sis@pgserver.mau.se:5432/seeker',
    ssl: { rejectUnauthorized: false }
});

app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const result = await pool.query("DELETE FROM users WHERE user_id = $1", [userId]);
        res.json({ success: result.rowCount > 0 });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin-stats', async (req, res) => {
    try {
        const totalUsersQuery = await pool.query('SELECT COUNT(*) FROM users');
        const academicUsersQuery = await pool.query("SELECT COUNT(*) FROM users WHERE user_type = 'Academic'");
        const recentActivityQuery = await pool.query(`
            SELECT action, description, created_at FROM activity_log 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        const recentActivity = recentActivityQuery.rows.map(row => ({
            type: row.action.includes('error') ? 'warning' : 'success',
            icon: row.action.includes('login') ? 'fas fa-sign-in-alt' : 'fas fa-user-plus',
            message: row.description,
            time: new Date(row.created_at).toLocaleString()
        }));

        res.json({
            success: true,
            totalUsers: parseInt(totalUsersQuery.rows[0].count, 10),
            academicUsers: parseInt(academicUsersQuery.rows[0].count, 10),
            recentActivity
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});


app.get('/api/test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({ success: true, time: result.rows[0].current_time });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/db', async (req, res) => {
    console.log('Received query:', req.body.query);
    try {
        const { query, params } = req.body;
        const result = await pool.query(query, params);
        console.log('Query succeeded:', result.command, result.rowCount);
        res.json(result);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});