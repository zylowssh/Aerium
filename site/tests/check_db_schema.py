import sqlite3

conn = sqlite3.connect('site/data/aerium.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cursor.fetchall()]
print("Tables:", tables)

for table in tables:
    cursor.execute(f"PRAGMA table_info({table})")
    cols = cursor.fetchall()
    print(f"\n{table}:")
    for col in cols:
        print(f"  {col[1]} ({col[2]})")

conn.close()
