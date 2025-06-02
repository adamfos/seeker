from flask import Flask, send_from_directory, jsonify, request, session
import psycopg2
import os
from dotenv import load_dotenv
from searches import save_search
import bcrypt

from werkzeug.security import check_password_hash


# Load environment variables from .env file
load_dotenv()

# Get Google API key from environment variables
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')

# Initialize Flask app and set static folder for assets
app = Flask(__name__, static_folder='assets', static_url_path='/assets')

# Secret key for session management
app.secret_key = os.getenv('SECRET_KEY', 'your-default-secret-key')

# Get the port number from environment variables (default to 3000)
PORT = int(os.getenv('PORT', 3000))

# Get database connection details from environment variables
DATABASE_URL = os.getenv('DATABASE_URL')

# Parse the DATABASE_URL into components
DATABASE_URL = DATABASE_URL.replace('postgresql://', '')  # Remove prefix
user_pass, host_port_db = DATABASE_URL.split('@')  # Split user info and host info
user, password = user_pass.split(':')  # Split username and password
host_port, database = host_port_db.split('/')  # Split host and database name
host, port = host_port.split(':')  # Split host and port

# Connect to the PostgreSQL database
conn = psycopg2.connect(
    database=database,
    user=user,
    password=password,
    host=host,
    port=port
)

cursor = conn.cursor()

# Enable Cross-Origin Resource Sharing (CORS) for all routes
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    return response

# Serve the main HTML file (index.html) at the root URL
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Serve static assets (CSS, JS, images, etc.)
@app.route('/assets/<path:path>')
def serve_assets(path):
    return send_from_directory('assets', path)

# Serve other HTML pages
@app.route('/<path:filename>')
def serve_page(filename):
    return send_from_directory('.', filename)

# === API Endpoints ===

# Test the database connection
@app.route('/api/test', methods=['GET'])
def test_db():
    try:
        cursor.execute('SELECT NOW()')  # Get the current time from the database
        result = cursor.fetchone()
        return jsonify({ 'success': True, 'time': result[0] })
    except Exception as e:
        print('Database test error:', e)
        return jsonify({ 'success': False, 'error': str(e) })

# Delete a user by ID
@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        cursor.execute('DELETE FROM users WHERE user_id = %s', (user_id,))
        conn.commit()  # Save changes to the database
        return jsonify({ 'success': cursor.rowcount > 0 })  # Check if a row was deleted
    except Exception as e:
        print('Delete user error:', e)
        return jsonify({ 'success': False, 'error': str(e) })

# Get admin statistics (total users and academic users)
@app.route('/api/admin-stats', methods=['GET'])
def admin_stats():
    try:
        # Get total number of users
        cursor.execute('SELECT COUNT(*) FROM users')
        total_users = cursor.fetchone()[0]

        # Get number of academic users
        cursor.execute("SELECT COUNT(*) FROM users WHERE user_type = 'academic'")
        academic_users = cursor.fetchone()[0]

        return jsonify({
            'success': True,
            'totalUsers': total_users,
            'academicUsers': academic_users
        })
    except Exception as e:
        print('Error fetching admin stats:', e)
        return jsonify({ 'success': False, 'error': str(e) })
    
# User login: verify credentials and set session
@app.route('/api/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')  # Plain text password

        # Fetch the hashed password from the database
        cursor.execute("SELECT user_id, username, password_hash FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
            # Password matches
            return jsonify({'success': True, 'user_id': user[0], 'username': user[1]})
        else:
            # Invalid credentials
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
    except Exception as e:
        print('Error logging in user:', e)
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/check-session', methods=['GET'])
def check_session():

    user = session.get('user_id')  # Tracking the login site
    if user:
        return jsonify({ 'loggedIn': True })
    else:
        return jsonify({ 'loggedIn': False }), 401

# User logout: clear session
@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True})

# Execute a general database query
@app.route('/api/db', methods=['POST'])
def db_query():
    try:
        data   = request.get_json()
        query  = data.get('query', '')
        params = data.get('params', [])

        # swap $1, $2… for %s
        for i in range(1, len(params) + 1):
            query = query.replace(f"${i}", "%s")

        cursor.execute(query, params)

        # normalize & detect returning
        upper = query.strip().upper()
        if upper.startswith('SELECT') or 'RETURNING' in upper:
            rows = cursor.fetchall()
            conn.commit()
            return jsonify({ 'rows': rows })

        # non‐select, non‐returning
        conn.commit()
        return jsonify({ 'success': True, 'rowCount': cursor.rowcount })

    except Exception as e:
        conn.rollback()
        app.logger.error('Database error: %s', e)
        return jsonify({ 'success': False, 'error': str(e) }), 400

# Provide the Google API key to the frontend
@app.route('/api/config/google-api-key', methods=['GET'])
def get_google_api_key():
    return jsonify({ 'apiKey': GOOGLE_API_KEY })


@app.route('/api/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')  # Plain text password
        user_type = data.get('user_type', 'regular')  # Default to 'regular'
        institution = data.get('institution', '') 


        # Hash the password using bcrypt
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insert the user into the database
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, user_type, institution, registration_date)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """, (username, email, hashed_password, user_type, institution))

                # 🆕 Hämta user_id direkt efter INSERT
        cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
        user_id = cursor.fetchone()[0]

        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user_id,
            'username': username,
            'email': email,
            'user_type': user_type,
            'institution': institution
        })

    except Exception as e:
        print('Error registering user:', e)
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)})
    
@app.route('/api/save-search', methods=['POST'])
def save_search_route():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        search_string = data.get('search_string')
        goal = data.get('goal')

        save_search(conn, user_id, search_string, goal)
        return jsonify({'success': True, 'message': 'Search saved successfully'})
    except Exception as e:
        print('Error saving search:', e)
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/get-searches/<int:user_id>', methods=['GET'])
def get_saved_searches(user_id):
    try:
        cursor.execute("""
            SELECT original_query, search_date
            FROM searches
            WHERE user_id = %s
            ORDER BY search_date DESC
        """, (user_id,))
        rows = cursor.fetchall()

        searches = []
        for row in rows:
            searches.append({
                'original_query': row[0],
                'search_date': row[1]
            })

        return jsonify({'success': True, 'searches': searches})
    except Exception as e:
        print('Error fetching searches:', e)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/saved-searches/<int:user_id>', methods=['GET'])
def get_saved_searches_full(user_id):
    try:
        print(f"Hämtar sparade sökningar för user_id: {user_id}")
        cursor.execute("""
            SELECT ss.saved_search_id, ss.title, ss.notes, ss.saved_date,
                   s.original_query, s.generated_query, s.search_engine
            FROM saved_searches ss
            JOIN searches s ON ss.search_id = s.search_id
            WHERE ss.user_id = %s
            ORDER BY ss.saved_date DESC
        """, (user_id,))
        rows = cursor.fetchall()

        searches = []
        for row in rows:
            searches.append({
                'saved_search_id': row[0],
                'title': row[1],
                'notes': row[2],
                'saved_date': row[3],
                'original_query': row[4],
                'generated_query': row[5],
                'search_engine': row[6]
            })

        return jsonify({'success': True, 'saved_searches': searches})
    except Exception as e:
        print('Error fetching saved searches:', e)
        return jsonify({'success': False, 'error': str(e)}), 500



# Run the Flask server
if __name__ == '__main__':
    app.run(debug=True, port=PORT)
