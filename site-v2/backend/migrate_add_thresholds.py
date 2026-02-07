"""
Database migration: Add threshold columns to sensors table
Run this script to add custom threshold columns without losing existing data
"""

import sqlite3
import os

# Path to database
DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'aerium.db')

def migrate():
    print("Starting database migration...")
    print(f"Database: {DB_PATH}")
    
    if not os.path.exists(DB_PATH):
        print("❌ Database not found! Run the application first to create it.")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(sensors)")
    columns = [col[1] for col in cursor.fetchall()]
    
    migrations_needed = []
    if 'threshold_co2' not in columns:
        migrations_needed.append('threshold_co2')
    if 'threshold_temp_min' not in columns:
        migrations_needed.append('threshold_temp_min')
    if 'threshold_temp_max' not in columns:
        migrations_needed.append('threshold_temp_max')
    if 'threshold_humidity' not in columns:
        migrations_needed.append('threshold_humidity')
    
    if not migrations_needed:
        print("✓ All threshold columns already exist. No migration needed.")
        conn.close()
        return
    
    print(f"Adding columns: {', '.join(migrations_needed)}")
    
    try:
        # Add threshold columns
        if 'threshold_co2' in migrations_needed:
            cursor.execute('ALTER TABLE sensors ADD COLUMN threshold_co2 FLOAT')
            print("✓ Added threshold_co2")
        
        if 'threshold_temp_min' in migrations_needed:
            cursor.execute('ALTER TABLE sensors ADD COLUMN threshold_temp_min FLOAT')
            print("✓ Added threshold_temp_min")
        
        if 'threshold_temp_max' in migrations_needed:
            cursor.execute('ALTER TABLE sensors ADD COLUMN threshold_temp_max FLOAT')
            print("✓ Added threshold_temp_max")
        
        if 'threshold_humidity' in migrations_needed:
            cursor.execute('ALTER TABLE sensors ADD COLUMN threshold_humidity FLOAT')
            print("✓ Added threshold_humidity")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        print("Restart the Flask server for changes to take effect.")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
