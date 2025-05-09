from flask import Flask, send_from_directory, jsonify, request
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get Google API key from environment variables
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')

# Initialize Flask app and set static folder for assets
app = Flask(__name__, static_folder='assets', static_url_path='/assets')

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

# Run the Flask server
if __name__ == '__main__':
    app.run(debug=True, port=PORT)
