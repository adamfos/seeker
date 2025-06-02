from datetime import datetime

def save_search(conn, user_id, search_string, goal=None):
    try:
        with conn.cursor() as cur:
            print(">>> Sparar ny sökning...")
            print("Användare:", user_id)
            print("Söksträng:", search_string)

            # Lägg till i searches
            cur.execute("""
                INSERT INTO searches (user_id, original_query, generated_query, search_engine, search_date, result_count, search_parameters, is_saved)
                VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
                RETURNING search_id
            """, (user_id, search_string, search_string, 'google', datetime.now(), 0, ''))

            search_id = cur.fetchone()[0]
            print(">>> Ny search_id:", search_id)

            # Lägg till i saved_searches
            cur.execute("""
                INSERT INTO saved_searches (user_id, search_id, title, notes, saved_date, tags)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, search_id, 'Sparad sökning', '', datetime.now(), ''))

        conn.commit()
        print(">>> Sökning sparad! ✅")
        return True
    except Exception as e:
        print("❌ Error saving search:", e)
        conn.rollback()
        return False