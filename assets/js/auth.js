const BASE_API_URL = 'http://127.0.0.1:3000/api/db';

async function executeQuery(query, params = []) {
    try {
        const response = await fetch(BASE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, params }),
        });
        const data = await response.json();
        console.log('Query result:', data);
        return data;
    } catch (error) {
        console.error('Network error:', error);
        return { error: error.message };
    }
}

export async function registerUser(username, email, password, userType, institution = '') {
    const checkUser = await executeQuery(
        'SELECT * FROM users WHERE email = %s OR username = %s', 
        [email, username]
    );
    
    if (checkUser.rows && checkUser.rows.length > 0) {
        return { error: 'User with this email or username already exists' };
    }

    const result = await executeQuery(
        `INSERT INTO users (username, email, password_hash, user_type, institution, registration_date)
         VALUES (%s, %s, %s, %s, %s, NOW())
         RETURNING user_id, username, email, user_type`,
        [username, email, password, userType, institution]
    );

    if (result.rows && result.rows.length > 0) {
        return result.rows[0];
    }
    if (result.success) {
        return { success: true, message: 'Registration was successful' };
    }
    return { error: 'Registration failed' };
}

export async function loginUser(email, password) {
    const result = await executeQuery(
        `SELECT u.user_id, u.username, u.email, u.user_type, 
                CASE WHEN a.admin_id IS NOT NULL THEN true ELSE false END as is_admin
         FROM users u
         LEFT JOIN admin_users a ON u.user_id = a.user_id
         WHERE u.email = %s AND u.password_hash = %s`,
        [email, password]
    );
    
    if (result.rows && result.rows.length > 0) {
        return result.rows[0];
    }
    return { error: 'Invalid email or password.' };
}

export function setAuthToken(userData) {
    localStorage.setItem('seeker_user', JSON.stringify(userData));
}

export function getAuthToken() {
    const user = localStorage.getItem('seeker_user');
    return user ? JSON.parse(user) : null;
}

export function logout() {
    localStorage.removeItem('seeker_user');
    window.location.href = '/';
}