from database import get_db

db = get_db()
try:
    users = db.execute('SELECT id, username, is_admin FROM users LIMIT 5').fetchall()
    print("Users found:")
    for u in users:
        print(f"  ID: {u[0]}, Username: {u[1]}, Is Admin: {u[2]}")
    if not users:
        print("  No users found")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
