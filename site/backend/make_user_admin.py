"""
Promouvoir un utilisateur au rôle d'administrateur
Usage: python make_user_admin.py <email>
"""
import sys
from app import app
from database import db, User

def rendre_admin(email):
    """Promouvoir un utilisateur au rôle d'administrateur"""
    with app.app_context():
        utilisateur = User.query.filter_by(email=email).first()
        
        if not utilisateur:
            print(f"❌ Utilisateur non trouvé: {email}")
            return False
        
        utilisateur.role = 'admin'
        db.session.commit()
        
        print(f"✅ L'utilisateur {email} est maintenant administrateur!")
        return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python make_user_admin.py <email>")
        print("\nExemple: python make_user_admin.py demo@aerium.app")
        sys.exit(1)
    
    email = sys.argv[1]
    rendre_admin(email)
