import sqlite3

db_path = 'C:/Users/Zylow/Documents/NSI/PROJECT/Morpheus/site/data/aerium.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
print("✅ Database Tables Created:")
for t in tables:
    cur2 = conn.cursor()
    cols = cur2.execute(f"PRAGMA table_info({t[0]})").fetchall()
    print(f"\n  📋 {t[0]} ({len(cols)} columns)")
    for col in cols[:3]:
        print(f"     - {col[1]} ({col[2]})")
    if len(cols) > 3:
        print(f"     ... and {len(cols)-3} more columns")

conn.close()
