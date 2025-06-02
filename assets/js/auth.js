const BASE_API_URL = 'http://127.0.0.1:3000/api/db';


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
    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters long' };
    }

    const checkUser = await executeQuery(
        'SELECT * FROM users WHERE email = %s OR username = %s',
        [email, username]
    );

    if (checkUser.rows && checkUser.rows.length > 0) {
        return { error: 'User with this email or username already exists' };
    }

    try {
        const response = await fetch('http://127.0.0.1:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                email,
                password,
                user_type: userType,
                institution,
            }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            return {
                user_id: result.user_id,
                username: result.username,
                email: result.email,
                user_type: result.user_type,
                institution: result.institution
            };
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
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.ok && !result.error) {
            return result;
        } else {
            return { error: result.error || 'Login failed' };
        }
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