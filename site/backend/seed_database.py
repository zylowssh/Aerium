"""
Database seeding script for demonstration accounts
Run this script to populate the database with demo users and sensors
"""
from app import app
from database import db, User, Sensor, SensorReading
import bcrypt
from datetime import datetime, timedelta
import random

def generate_co2_pattern(hour, base_value):
    """Generate realistic CO2 patterns based on time of day"""
    patterns = {
        0: -200, 1: -220, 2: -230, 3: -240, 4: -230, 5: -200,
        6: -150, 7: -50, 8: 50, 9: 150, 10: 200, 11: 250,
        12: 200, 13: 250, 14: 300, 15: 280, 16: 250, 17: 150,
        18: 50, 19: -50, 20: -100, 21: -150, 22: -180, 23: -190
    }
    
    variation = (random.random() - 0.5) * 100
    return max(350, base_value + patterns.get(hour, 0) + variation)


def amorcer_base_donnees():
    """Amorcer la base de données avec des données de démonstration"""
    with app.app_context():
        print("[INFO] Amorcage de la base de donnees avec des donnees de demonstration...")
        
        # Vérifier si les comptes de démonstration existent déjà
        demo_existant = User.query.filter_by(email='demo@aerium.app').first()
        admin_existant = User.query.filter_by(email='admin@aerium.app').first()

        if demo_existant and admin_existant:
            print("[WARN] Les comptes de demonstration existent deja. Amorcage ignore.")
            return
        
        utilisateur_demo = demo_existant
        utilisateur_admin = admin_existant

        # Créer les comptes manquants uniquement
        if not utilisateur_demo:
            mot_de_passe_demo = bcrypt.hashpw('demo123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            utilisateur_demo = User(
                email='demo@aerium.app',
                password_hash=mot_de_passe_demo,
                full_name='Utilisateur Démo',
                role='user'
            )
            db.session.add(utilisateur_demo)
            print("[OK] Utilisateur de demonstration cree: demo@aerium.app (mot de passe: demo123)")
        else:
            print("[INFO] Compte demo@aerium.app deja present")

        if not utilisateur_admin:
            mot_de_passe_admin = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            utilisateur_admin = User(
                email='admin@aerium.app',
                password_hash=mot_de_passe_admin,
                full_name='Administrateur',
                role='admin'
            )
            db.session.add(utilisateur_admin)
            print("[OK] Utilisateur administrateur cree: admin@aerium.app (mot de passe: admin123)")
        else:
            print("[INFO] Compte admin@aerium.app deja present")

        db.session.commit()

        # Ne générer les données démo complètes que si aucun capteur n'existe pour l'utilisateur démo.
        demo_a_deja_des_capteurs = Sensor.query.filter_by(user_id=utilisateur_demo.id).count() > 0
        if demo_a_deja_des_capteurs:
            print("[INFO] Donnees capteurs demo deja presentes, generation ignoree")
        else:
        # Créer des capteurs pour l'utilisateur de démonstration
            donnees_capteurs = [
                {
                    'name': 'Bureau Principal',
                    'location': 'Bâtiment A, 2ᵉ étage',
                    'base_co2': 750,
                    'base_temp': 22.5,
                    'base_humidity': 45
                },
                {
                    'name': 'Salle de Réunion Alpha',
                    'location': 'Bâtiment A, 3ᵉ étage',
                    'base_co2': 850,
                    'base_temp': 23.2,
                    'base_humidity': 48
                },
                {
                    'name': 'Open Space Dev',
                    'location': 'Bâtiment B, 1ᵉʳ étage',
                    'base_co2': 920,
                    'base_temp': 21.8,
                    'base_humidity': 52
                },
                {
                    'name': 'Cafétéria',
                    'location': 'Bâtiment A, RDC',
                    'base_co2': 680,
                    'base_temp': 23.5,
                    'base_humidity': 42
                }
            ]
            
            capteurs = []
            for donnees_capteur in donnees_capteurs:
                capteur = Sensor(
                    user_id=utilisateur_demo.id,
                    name=donnees_capteur['name'],
                    location=donnees_capteur['location'],
                    status='en ligne',
                    sensor_type='simulation',
                    battery=None,
                    is_live=True
                )
                db.session.add(capteur)
                capteurs.append((capteur, donnees_capteur))
            
            db.session.commit()
            print(f"[OK] {len(capteurs)} capteurs de demonstration crees")
            
            # Créer des lectures historiques (dernières 24 heures)
            maintenant = datetime.utcnow()
            compteur_lectures = 0
            
            for capteur, donnees_capteur in capteurs:
                # Générer des lectures pour les dernières 24 heures (toutes les 30 minutes = 48 lectures)
                for i in range(48):
                    decalage_temps = timedelta(minutes=30 * i)
                    heure_lecture = maintenant - timedelta(hours=24) + decalage_temps
                    heure = heure_lecture.hour
                    
                    # Générer des variations réalistes
                    co2 = round(generate_co2_pattern(heure, donnees_capteur['base_co2']))
                    temp = round((donnees_capteur['base_temp'] + (random.random() - 0.5) * 2) * 10) / 10
                    humidite = round(donnees_capteur['base_humidity'] + (random.random() - 0.5) * 10)
                    
                    lecture = SensorReading(
                        sensor_id=capteur.id,
                        co2=co2,
                        temperature=temp,
                        humidity=max(20, min(80, humidite)),
                        recorded_at=heure_lecture
                    )
                    db.session.add(lecture)
                    compteur_lectures += 1
            
            # Mettre à jour les statuts des capteurs en fonction des dernières lectures
            for capteur, _ in capteurs:
                derniere_lecture = SensorReading.query.filter_by(
                    sensor_id=capteur.id
                ).order_by(SensorReading.recorded_at.desc()).first()
                
                if derniere_lecture:
                    if derniere_lecture.co2 > 1200:
                        capteur.status = 'avertissement'
                    elif derniere_lecture.co2 > 1000:
                        capteur.status = 'avertissement'
                    else:
                        capteur.status = 'en ligne'
            
            db.session.commit()
            print(f"[OK] {compteur_lectures} lectures de capteurs historiques creees")
        
        # Créer un capteur administrateur uniquement si aucun capteur admin n'existe.
        admin_a_deja_des_capteurs = Sensor.query.filter_by(user_id=utilisateur_admin.id).count() > 0
        if admin_a_deja_des_capteurs:
            print("[INFO] Donnees capteurs administrateur deja presentes, generation ignoree")
        else:
            capteur_admin = Sensor(
                user_id=utilisateur_admin.id,
                name='Salle Serveur',
                location='Datacenter',
                status='en ligne',
                sensor_type='simulation',
                battery=None,
                is_live=True
            )
            db.session.add(capteur_admin)
            db.session.commit()
            print("[OK] Capteur administrateur cree")
        
        print("\n[OK] Amorcage de la base de donnees termine")
        print("\n[INFO] Comptes de demonstration:")
        print("   Utilisateur regulier:")
        print("   - Email: demo@aerium.app")
        print("   - Mot de passe: demo123")
        print("\n   Utilisateur administrateur:")
        print("   - Email: admin@aerium.app")
        print("   - Mot de passe: admin123")
        print("\n[INFO] Vous pouvez maintenant vous connecter avec ces comptes")


if __name__ == '__main__':
    amorcer_base_donnees()
