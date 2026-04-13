"""
Amorcer l'historique des alertes avec des données de test
"""
from app import app
from database import db, User, Sensor, AlertHistory
from datetime import datetime, timedelta
import random

def amorcer_historique_alertes():
    """Créer des données d'historique d'alertes de test"""
    with app.app_context():
        # Obtenir l'utilisateur de démonstration
        utilisateur_demo = User.query.filter_by(email='demo@aerium.app').first()
        if not utilisateur_demo:
            print("❌ Utilisateur de démonstration non trouvé. Veuillez d'abord exécuter seed_database.py.")
            return
        
        # Obtenir les capteurs de l'utilisateur de démonstration
        capteurs = Sensor.query.filter_by(user_id=utilisateur_demo.id).all()
        if not capteurs:
            print("❌ Aucun capteur trouvé pour l'utilisateur de démonstration. Veuillez d'abord exécuter seed_database.py.")
            return
        
        print(f"🌱 Création de l'historique des alertes pour {len(capteurs)} capteurs...")
        
        types_alertes = ['info', 'avertissement', 'critique']
        metriques = ['co2', 'temperature', 'humidity']
        statuts = ['triggered', 'acknowledged', 'resolved']
        
        maintenant = datetime.utcnow()
        compteur_alertes = 0
        
        # Créer 5-10 alertes par capteur sur les 30 derniers jours
        for capteur in capteurs:
            nombre_alertes = random.randint(5, 10)
            
            for _ in range(nombre_alertes):
                # Heure aléatoire dans les 30 derniers jours
                jours_passes = random.randint(0, 29)
                heures_passees = random.randint(0, 23)
                cree_a = maintenant - timedelta(days=jours_passes, hours=heures_passees)
                
                type_alerte = random.choice(types_alertes)
                metrique = random.choice(metriques)
                statut = random.choice(statuts)
                
                # Définir les seuils et valeurs en fonction de la métrique
                if metrique == 'co2':
                    seuil = random.choice([800, 1000, 1200])
                    valeur = seuil + random.randint(50, 300)
                elif metrique == 'temperature':
                    seuil = 25
                    valeur = seuil + random.uniform(0.5, 5.0)
                else:  # humidity
                    seuil = 70
                    valeur = seuil + random.uniform(5, 15)
                
                alerte = AlertHistory(
                    sensor_id=capteur.id,
                    user_id=utilisateur_demo.id,
                    alert_type=type_alerte,
                    metric=metrique,
                    metric_value=round(valeur, 2),
                    threshold_value=seuil,
                    message=f"{metrique.capitalize()} a dépassé le seuil de {seuil}",
                    status=statut,
                    created_at=cree_a,
                    acknowledged_at=cree_a + timedelta(minutes=random.randint(5, 60)) if statut in ['acknowledged', 'resolved'] else None,
                    resolved_at=cree_a + timedelta(minutes=random.randint(60, 240)) if statut == 'resolved' else None
                )
                
                db.session.add(alerte)
                compteur_alertes += 1
        
        db.session.commit()
        print(f"✅ {compteur_alertes} enregistrements d'historique d'alertes créés")
        print(f"\n📊 Statistiques de l'historique des alertes:")
        print(f"   Total des alertes: {AlertHistory.query.count()}")
        print(f"   Déclenchées: {AlertHistory.query.filter_by(status='triggered').count()}")
        print(f"   Accusées réception: {AlertHistory.query.filter_by(status='acknowledged').count()}")
        print(f"   Résolues: {AlertHistory.query.filter_by(status='resolved').count()}")


if __name__ == '__main__':
    amorcer_historique_alertes()
