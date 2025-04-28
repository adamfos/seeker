from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from dotenv import load_dotenv
from search import generate_optimized_search_string  

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
FLASK_API_URL = os.getenv("FLASK_API_URL")
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(app)

# Database model
class Search(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    query = db.Column(db.String(512), nullable=False)

# Create tables if they don't exist
with app.app_context():
    db.create_all()

# ======== Frontend Routes ========
@app.route('/')
def homepage():
    # Pass environment variable to frontend
    return render_template('index.html', api_url=FLASK_API_URL)

@app.route('/admin', methods=['GET'])
def admin_page():
    return render_template('admin.html')

@app.route('/users', methods=['GET'])
def users_page():
    return render_template('users.html')

@app.route('/settings', methods=['GET'])
def settings_page():
    return render_template('settings.html')

@app.route('/security', methods=['GET'])
def security_page():
    return render_template('security.html')

# ======== API Routes ========

@app.route('/generate-search', methods=['POST'])
def generate_search():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON"}), 400

    search_query = data.get('userInput') or data.get('search')
    if not search_query:
        return jsonify({"error": "Missing 'search' field"}), 400

    # Use the function from search.py to generate the optimized search string
    result = generate_optimized_search_string(search_query)

    # Save the search query to the database
    new_search = Search(query=search_query)
    db.session.add(new_search)
    db.session.commit()

    return jsonify(result)  # Return the result from search.py (optimized search string)

@app.route('/api/admin-stats', methods=['GET'])
def admin_stats():
    total_users = db.session.execute('SELECT COUNT(*) FROM users').scalar() or 0
    academic_users = db.session.execute("SELECT COUNT(*) FROM users WHERE user_type = 'academic'").scalar() or 0
    return jsonify({
        "success": True,
        "totalUsers": total_users,
        "academicUsers": academic_users
    })

@app.route('/api/db', methods=['POST'])
def db_query():
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({"error": "Missing query"}), 400

    try:
        query = data['query']
        params = data.get('params', [])
        result = db.session.execute(db.text(query), params)
        rows = [dict(row) for row in result]
        return jsonify({"rows": rows})
    except Exception as e:
        print(f"DB error: {e}")
        return jsonify({"error": str(e)}), 500

# ======== Error Handling ========

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

# ======== App Runner ========

if __name__ == '__main__':
    app.run(debug=True)