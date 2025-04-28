from flask import Flask, request, jsonify, render_template, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
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

@app.route('/', methods=['GET'])
def homepage():
    return render_template('index.html')

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

    # Optional Gemini API connection
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [{"text": search_query}]
            }
        ]
    }

    gemini_response_text = ""

    try:
        gemini_response = requests.post(f"{gemini_url}?key={gemini_api_key}", headers=headers, json=payload)
        if gemini_response.status_code == 200:
            gemini_data = gemini_response.json()
            gemini_response_text = gemini_data['candidates'][0]['content']['parts'][0]['text']
        else:
            gemini_response_text = "Gemini API error"
    except Exception as e:
        print(f"Gemini error: {e}")
        gemini_response_text = "Gemini connection failed"

    # Save search query to database
    new_search = Search(query=search_query)
    db.session.add(new_search)
    db.session.commit()

    return jsonify({
        "original_query": search_query,
        "gemini_response": gemini_response_text
    })

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