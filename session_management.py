import uuid
from datetime import datetime, timedelta

def create_session(cursor, conn, user_id, ip_address, user_agent, duration_seconds=30):
    """
    Create a new session for a user.
    """
    try:
        session_id = str(uuid.uuid4())
        created_at = datetime.utcnow()
        expires_at = created_at + timedelta(seconds=duration_seconds)

        cursor.execute("""
            INSERT INTO user_sessions (session_id, user_id, ip_address, user_agent, created_at, expires_at, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (session_id, user_id, ip_address, user_agent, created_at, expires_at, True))
        conn.commit()

        return {'success': True, 'session_id': session_id, 'expires_at': expires_at}
    except Exception as e:
        print("Error creating session:", e)
        return {'success': False, 'message': str(e)}

def get_valid_session_user(cursor, conn, session_id):
    """
    Validate a session and return the user_id if valid.
    """
    try:
        cursor.execute("""
            SELECT user_id, is_active, expires_at
            FROM user_sessions
            WHERE session_id = %s
        """, (session_id,))
        session = cursor.fetchone()

        if not session:
            return {'success': False, 'message': 'Session not found'}

        user_id, is_active, expires_at = session

        if not is_active or expires_at < datetime.utcnow():
            # Deactivate the session if expired or inactive
            cursor.execute("""
                UPDATE user_sessions
                SET is_active = FALSE
                WHERE session_id = %s
            """, (session_id,))
            conn.commit()
            return {'success': False, 'message': 'Session expired or inactive'}

        return {'success': True, 'user_id': user_id}
    except Exception as e:
        print("Error validating session:", e)
        return {'success': False, 'message': str(e)}