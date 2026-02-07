"""
Upgrade a user to admin role
Usage: python make_user_admin.py <email>
"""
import sys
from app import app
from database import db, User

def make_admin(email):
    """Upgrade user to admin role"""
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        
        if not user:
            print(f"❌ User not found: {email}")
            return False
        
        user.role = 'admin'
        db.session.commit()
        
        print(f"✅ User {email} is now an admin!")
        return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python make_user_admin.py <email>")
        print("\nExample: python make_user_admin.py demo@aerium.app")
        sys.exit(1)
    
    email = sys.argv[1]
    make_admin(email)
