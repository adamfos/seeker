from datetime import datetime
import psycopg2

def save_search(conn, user_id, search_id, title, notes, tags=None, goal=None):
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO saved_searches (
                    user_id, search_id, title, notes, saved_date, tags, goal
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (user_id, search_id, title, notes, datetime.now(), tags, goal))
        conn.commit()
        return True
    except Exception as e:
        print("Error saving search:", e)
        conn.rollback()
        return False

def log_search_query(conn, query):
    """Log a search query to the searches table"""
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO searches (original_query)
                VALUES (%s)
            """, (query,))
        conn.commit()
        return True
    except Exception as e:
        print("Error logging search query:", e)
        conn.rollback()
        return False
