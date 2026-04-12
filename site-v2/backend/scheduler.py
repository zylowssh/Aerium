from apscheduler.schedulers.background import BackgroundScheduler
from database import db, Sensor, Maintenance
from datetime import datetime
import random

scheduler = BackgroundScheduler()

# Contrôle global de la vitesse de simulation (secondes entre les mises à jour)
VITESSE_SIMULATION = 5

# Profils de capteurs avec des valeurs de base réalistes
PROFILS_CAPTEURS = {
    'Bureau Principal': {'base_co2': 650, 'base_temp': 22.5, 'base_humidity': 45, 'facteur_occupance': 0.8},
    'Salle de Réunion Alpha': {'base_co2': 800, 'base_temp': 23.2, 'base_humidity': 48, 'facteur_occupance': 1.5},
    'Open Space Dev': {'base_co2': 750, 'base_temp': 21.8, 'base_humidity': 52, 'facteur_occupance': 1.2},
    'Cafétéria': {'base_co2': 600, 'base_temp': 23.5, 'base_humidity': 42, 'facteur_occupance': 1.0},
    'Salle Serveur': {'base_co2': 450, 'base_temp': 19.0, 'base_humidity': 35, 'facteur_occupance': 0.1},
}

def obtenir_profil_capteur(nom_capteur):
    """Obtenir le profil du capteur ou retourner le profil par défaut"""
    return PROFILS_CAPTEURS.get(nom_capteur, {
        'base_co2': 700, 
        'base_temp': 22.0, 
        'base_humidity': 50, 
        'facteur_occupance': 1.0
    })

def générer_motif_co2(hour, base_value, facteur_occupance=1.0, nom_capteur=''):
    """Générer des motifs de CO2 réalistes en fonction de l'heure et du type d'espace"""
    # Motif des heures de bureau (plus d'occupance pendant les heures de travail)
    if 'Salle de Réunion' in nom_capteur:
        # Salles de réunion: pics pendant les heures de réunion
        heures_reunion = {
            9: 300, 10: 400, 11: 350, 14: 400, 15: 350, 16: 300
        }
        decalage_motif = heures_reunion.get(hour, 0)
    elif 'Cafétéria' in nom_capteur:
        # Cafétéria: pics pendant les repas et pauses
        heures_repas = {
            8: 150, 9: 100, 12: 350, 13: 300, 17: 200, 18: 150
        }
        decalage_motif = heures_repas.get(hour, -100)
    elif 'Serveur' in nom_capteur:
        # Salle serveur: consistemment faible avec variation minimale
        decalage_motif = random.randint(-20, 20)
    else:
        # Bureau/défaut: augmentation progressive pendant les heures de travail
        motifs = {
            0: -200, 1: -220, 2: -230, 3: -240, 4: -230, 5: -200,
            6: -150, 7: -50, 8: 100, 9: 200, 10: 250, 11: 280,
            12: 250, 13: 280, 14: 300, 15: 280, 16: 250, 17: 150,
            18: 50, 19: -50, 20: -100, 21: -150, 22: -180, 23: -190
        }
        decalage_motif = motifs.get(hour, 0)
    
    # Appliquer le facteur d'occupance
    decalage_motif = int(decalage_motif * facteur_occupance)
    
    # Ajouter une variation aléatoire (±50 ppm)
    variation = random.randint(-50, 50)
    
    # Calculer la valeur finale
    valeur_finale = base_value + decalage_motif + variation
    
    # Limiter aux plages réalistes
    return max(400, min(1500, valeur_finale))


def générer_température(temp_base, hour, nom_capteur=''):
    """Générer des variations de température réalistes"""
    if 'Serveur' in nom_capteur:
        # Salle serveur: plus froide et plus stable
        variation = (random.random() - 0.5) * 0.3
    else:
        # Pièces normales: légère variation tout au long de la journée
        motif_quotidien = {
            0: -0.5, 1: -0.6, 2: -0.7, 3: -0.7, 4: -0.6, 5: -0.5,
            6: -0.3, 7: 0.0, 8: 0.3, 9: 0.5, 10: 0.7, 11: 0.8,
            12: 0.8, 13: 0.9, 14: 1.0, 15: 0.9, 16: 0.7, 17: 0.5,
            18: 0.3, 19: 0.0, 20: -0.2, 21: -0.3, 22: -0.4, 23: -0.5
        }
        decalage_quotidien = motif_quotidien.get(hour, 0)
        variation = decalage_quotidien + (random.random() - 0.5) * 0.4
    
    return round((temp_base + variation) * 10) / 10


def générer_humidité(humidite_base, hour, nom_capteur=''):
    """Générer des variations d'humidité réalistes"""
    if 'Serveur' in nom_capteur:
        # Salle serveur: humidité plus basse et plus contrôlée
        variation = (random.random() - 0.5) * 2
    else:
        # Variation normale (±5%)
        variation = (random.random() - 0.5) * 10
    
    return max(30, min(70, round(humidite_base + variation)))


def simuler_lectures_capteurs(app, socketio):
    """
    Générer et émettre les lectures des capteurs aux clients WebSocket connectés.
    S'exécute périodiquement pour fournir des mises à jour en temps réel pour les capteurs simulés.
    """
    with app.app_context():
        # Obtenir tous les capteurs simulés (sensor_type='simulation')
        sensors = Sensor.query.filter_by(sensor_type='simulation').all()
        
        if not sensors:
            return
        
        # Importer ici pour éviter les importations circulaires
        from sensor_simulator import generate_current_simulated_reading
        
        for sensor in sensors:
            try:
                # Générer des données simulées fraìhes
                simulated_data = generate_current_simulated_reading(sensor.name)
                
                # Mettre à jour l'état du capteur en fonction des niveaux de CO2 (correction critique)
                co2_value = simulated_data['co2']
                if co2_value > 1200:
                    sensor.status = 'avertissement'
                elif co2_value >= 1000:
                    sensor.status = 'avertissement'
                else:
                    sensor.status = 'en ligne'
                
                sensor.updated_at = datetime.utcnow()
                db.session.commit()
                
                # Préparer la charge WebSocket - correspond au format attendu par le frontend
                reading_data = {
                    'sensor_id': sensor.id,
                    'sensor_name': sensor.name,
                    'reading': {
                        'co2': simulated_data['co2'],
                        'temperature': simulated_data['temperature'],
                        'humidity': simulated_data['humidity'],
                        'recorded_at': datetime.utcnow().isoformat()
                    },
                    'status': sensor.status  # Inclure le statut mis à jour
                }
                
                # Emettre à l'utilisateur propriétaire et aux administrateurs uniquement
                socketio.emit('sensor_update', reading_data, room=f'user_{sensor.user_id}')
                socketio.emit('sensor_update', reading_data, room='admin')
                
            except Exception as e:
                print(f"Erreur lors de la génération de la lecture pour le capteur {sensor.name}: {e}")


def initialiser_planificateur(app, socketio):
    """Initialiser le planificateur pour les tâches périodiques"""
    # Programmer l'émission de données de capteur en temps réel toutes les 5 secondes (configurable via VITESSE_SIMULATION)
    scheduler.add_job(
        func=simuler_lectures_capteurs,
        trigger='interval',
        seconds=VITESSE_SIMULATION,
        args=[app, socketio],
        id='sensor_simulation',
        name='Simulation de capteur en temps réel',
        replace_existing=True
    )

    scheduler.add_job(
        func=marquer_maintenance_en_retard,
        trigger='interval',
        minutes=10,
        args=[app],
        id='maintenance_overdue_check',
        name='Vérification de la maintenance en retard',
        replace_existing=True
    )
    
    scheduler.start()
    print(f"✓ Planificateur initialisé - Mises à jour de capteurs en temps réel actives (toutes les {VITESSE_SIMULATION} secondes)")
    print("✓ Émissions WebSocket activées pour les capteurs simulés")


def marquer_maintenance_en_retard(app):
    """Marquer les tâches de maintenance planifiées comme en retard si la date limite est dépassée."""
    with app.app_context():
        now = datetime.utcnow()
        updated = Maintenance.query.filter(
            Maintenance.status == 'scheduled',
            Maintenance.scheduled_date < now
        ).update({Maintenance.status: 'overdue'}, synchronize_session=False)

        if updated:
            db.session.commit()


def mettre_a_jour_vitesse_simulation(nouvelle_vitesse: float):
    """Mettre à jour la vitesse de simulation de manière dynamique"""
    global VITESSE_SIMULATION
    VITESSE_SIMULATION = nouvelle_vitesse
    
    # Reprogrammer le travail de simulation avec la nouvelle vitesse
    if scheduler.get_job('sensor_simulation'):
        scheduler.reschedule_job(
            'sensor_simulation',
            trigger='interval',
            seconds=nouvelle_vitesse
        )
        return True
    return False

