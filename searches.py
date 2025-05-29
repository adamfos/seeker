import psycopg2
import os
from dotenv import load_dotenv

# Ladda miljövariabler från .env
load_dotenv()

# Hämta och parsa DATABASE_URL
DATABASE_URL = os.getenv('DATABASE_URL')
DATABASE_URL = DATABASE_URL.replace('postgresql://', '')  # Ta bort prefix

user_pass, host_port_db = DATABASE_URL.split('@')  # Dela upp user info och host info
user, password = user_pass.split(':')              # Dela upp användare och lösenord
host_port, database = host_port_db.split('/')      # Dela upp host och databas
host, port = host_port.split(':')                  # Dela upp host och port

# Funktion för att skapa databasanslutning
def get_db_connection():
    return psycopg2.connect(
        database=database,
        user=user,
        password=password,
        host=host,
        port=port
    )

def save_search(conn, user_id, original_query):
    """Sparar en sökning i tabellen 'searches' med alla obligatoriska fält."""
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO searches (
                    user_id,
                    original_query,
                    generated_query,
                    search_engine,
                    search_date,
                    result_count,
                    search_parameters,
                    is_saved
                ) VALUES (
                    %s, %s, '', 'default', NOW(), 0, '{}', FALSE
                )
                RETURNING search_id
            """, (user_id, original_query))
            
            # Hämta det genererade ID:t
            search_id = cur.fetchone()[0]
            conn.commit()
            return search_id
    except Exception as e:
        print("Error saving search:", e)
        conn.rollback()
        return None

    conn.close()