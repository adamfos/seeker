const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv'); // Load environment variables from .env file
dotenv.config(); // Load environment variables from .env file
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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
        console.log("Fetching admin stats...");
        
        // Query to count total number of users
        const totalUsersQuery = await pool.query('SELECT COUNT(*) FROM users');
        console.log("Total users query result:", totalUsersQuery.rows[0].count);
        
        // Query to count academic users
        const academicUsersQuery = await pool.query("SELECT COUNT(*) FROM users WHERE user_type = 'academic'");
        console.log("Academic users query result:", academicUsersQuery.rows[0].count);
        
        const responseData = {
            success: true,
            totalUsers: parseInt(totalUsersQuery.rows[0].count, 10),
            academicUsers: parseInt(academicUsersQuery.rows[0].count, 10)
        };
        
        console.log("Sending response:", responseData);
        res.json(responseData);
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