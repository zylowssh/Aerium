import sqlite3

db = sqlite3.connect('data/aerium.sqlite')

# Add the role column if it doesn't exist
cursor = db.cursor()
try:
    cursor.execute('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"')
    db.commit()
    print('Added role column to users table')
except sqlite3.OperationalError as e:
    if 'duplicate column' in str(e):
        print('Role column already exists')
    else:
        print(f'Error: {e}')

# Also add other missing columns if needed
try:
    cursor.execute('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0')
    db.commit()
    print('Added email_verified column')
except sqlite3.OperationalError as e:
    if 'duplicate column' in str(e):
        print('email_verified column already exists')

try:
    cursor.execute('ALTER TABLE users ADD COLUMN remember_me_token TEXT')
    db.commit()
    print('Added remember_me_token column')
except sqlite3.OperationalError as e:
    if 'duplicate column' in str(e):
        print('remember_me_token column already exists')

# Now update the admin user
user = db.execute('SELECT id, username, role FROM users WHERE username = ?', ('admin',)).fetchone()
if user:
    print(f'\nFound user: id={user[0]}, username={user[1]}, current_role={user[2]}')
    db.execute('UPDATE users SET role = ? WHERE id = ?', ('admin', user[0]))
    db.commit()
    # Verify
    updated = db.execute('SELECT role FROM users WHERE id = ?', (user[0],)).fetchone()
    print(f'✓ Updated to admin role: {updated[0]}')
else:
    print('\nNo admin user found - you need to create an account first')

db.close()
