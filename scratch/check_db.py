import sqlite3
import os

DB_PATH = 'backend/health_monitoring.db'

def check_db():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- Users ---")
    users = cursor.execute("SELECT id, username, role, full_name FROM users").fetchall()
    for user in users:
        print(dict(user))
    
    conn.close()

if __name__ == "__main__":
    check_db()
