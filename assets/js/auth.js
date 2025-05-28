import bcrypt from 'bcryptjs';
import validator from 'validator';

const BASE_API_URL = '/api/db';

async function executeQuery(query, params = []) {
    try {
        const response = await fetch(BASE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, params }),
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Server returned ${response.status}`);
        }
        console.log('Query result:', data);
        return data;
    } catch (error) {
        console.error('Network/server error:', { query, params, error: error.message });
        return { error: error.message };
    }
}

export async function registerUser(username, email, password, userType, institution = '') {
    // Validate input
    if (!validator.isEmail(email)) {
        return { error: 'Invalid email format' };
    }
    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters long' };
    }

    // Check if user already exists
    const checkUser = await executeQuery(
        'SELECT * FROM users WHERE email = %s OR username = %s', 
        [email, username]
    );
    if (checkUser.rows && checkUser.rows.length > 0) {
        return { error: 'User with this email or username already exists' };
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Send the registration data to the backend
        const response = await fetch('http://127.0.0.1:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                password: hashedPassword, // Send hashed password
                user_type: userType,
                institution,
            }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            return { success: true, message: 'Registration was successful' };
        } else {
            return { error: result.error || 'Registration failed' };
        }
    } catch (error) {
        console.error('Error during registration:', error);
        return { error: 'An error occurred during registration. Please try again.' };
    }
}

export async function loginUser(email, password) {
    try {
        // Fetch user data from the database
        const result = await executeQuery(
            `SELECT user_id, username, email, user_type, password_hash 
             FROM users WHERE email = %s`,
            [email]
        );

        if (result.rows && result.rows.length > 0) {
            const user = result.rows[0];
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (isPasswordValid) {
                delete user.password_hash; // Remove sensitive data
                return user;
            }
        }
        return { error: 'Invalid email or password.' };
    } catch (error) {
        console.error('Error during login:', error);
        return { error: 'An error occurred during login. Please try again.' };
    }
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