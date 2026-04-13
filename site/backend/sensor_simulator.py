"""
Module de simulation de capteurs à la demande
Génère des données réalistes de capteurs lorsque demandé, plutôt que en continu en arrière-plan
"""

from datetime import datetime, timedelta
import random

# Profils de capteurs avec des valeurs de base réalistes
PROFILS_CAPTEURS = {
    'Bureau Principal': {'base_co2': 650, 'base_temp': 22.5, 'base_humidity': 45, 'occupancy_factor': 0.8},
    'Salle de Réunion Alpha': {'base_co2': 800, 'base_temp': 23.2, 'base_humidity': 48, 'occupancy_factor': 1.5},
    'Open Space Dev': {'base_co2': 750, 'base_temp': 21.8, 'base_humidity': 52, 'occupancy_factor': 1.2},
    'Cafétéria': {'base_co2': 600, 'base_temp': 23.5, 'base_humidity': 42, 'occupancy_factor': 1.0},
    'Salle Serveur': {'base_co2': 450, 'base_temp': 19.0, 'base_humidity': 35, 'occupancy_factor': 0.1},
}


def obtenir_profil_capteur(nom_capteur):
    """Obtenir le profil du capteur ou retourner le profil par défaut"""
    return PROFILS_CAPTEURS.get(nom_capteur, {
        'base_co2': 700, 
        'base_temp': 22.0, 
        'base_humidity': 50, 
        'occupancy_factor': 1.0
    })


def generer_motif_co2(heure, valeur_base, facteur_occupance=1.0, nom_capteur=''):
    """Générer des motifs de CO2 réalistes basés sur l'heure du jour et le type d'espace"""
    # Motif d'heures de bureau (plus d'occupation pendant les heures de travail)
    if 'Salle de Réunion' in nom_capteur:
        # Salles de réunion: pics pendant les heures de réunion
        heures_reunion = {
            9: 300, 10: 400, 11: 350, 14: 400, 15: 350, 16: 300
        }
        decalage_motif = heures_reunion.get(heure, 0)
    elif 'Cafétéria' in nom_capteur:
        # Cafétéria: pics pendant les heures de repas et de pause
        heures_repas = {
            8: 150, 9: 100, 12: 350, 13: 300, 17: 200, 18: 150
        }
        decalage_motif = heures_repas.get(heure, -100)
    elif 'Serveur' in nom_capteur:
        # Salle serveur: constamment bas avec variation minimale
        decalage_motif = random.randint(-20, 20)
    else:
        # Bureau/défaut: augmentation graduelle pendant les heures de travail
        motifs = {
            0: -200, 1: -220, 2: -230, 3: -240, 4: -230, 5: -200,
            6: -150, 7: -50, 8: 100, 9: 200, 10: 250, 11: 280,
            12: 250, 13: 280, 14: 300, 15: 280, 16: 250, 17: 150,
            18: 50, 19: -50, 20: -100, 21: -150, 22: -180, 23: -190
        }
        decalage_motif = motifs.get(heure, 0)
    
    # Appliquer le facteur d'occupation
    decalage_motif = int(decalage_motif * facteur_occupance)
    
    # Ajouter une variation aléatoire (±50 ppm)
    variation = random.randint(-50, 50)
    
    # Calculer la valeur finale
    valeur_finale = valeur_base + decalage_motif + variation
    
    # Limiter aux plages réalistes
    return max(400, min(1500, valeur_finale))


def generer_temperature(temp_base, heure, nom_capteur=''):
    """Générer des variations de température réalistes"""
    if 'Serveur' in nom_capteur:
        # Salle serveur: plus fraîche et plus stable
        variation = (random.random() - 0.5) * 0.3
    else:
        # Pièces normales: légère variation tout au long de la journée
        motif_quotidien = {
            0: -0.5, 1: -0.6, 2: -0.7, 3: -0.7, 4: -0.6, 5: -0.5,
            6: -0.3, 7: 0.0, 8: 0.3, 9: 0.5, 10: 0.7, 11: 0.8,
            12: 0.8, 13: 0.9, 14: 1.0, 15: 0.9, 16: 0.7, 17: 0.5,
            18: 0.3, 19: 0.0, 20: -0.2, 21: -0.3, 22: -0.4, 23: -0.5
        }
        decalage_quotidien = motif_quotidien.get(heure, 0)
        variation = decalage_quotidien + (random.random() - 0.5) * 0.4
    
    return round((temp_base + variation) * 10) / 10


def generer_humidite(humidite_base, heure, nom_capteur=''):
    """Générer des variations d'humidité réalistes"""
    if 'Serveur' in nom_capteur:
        # Salle serveur: humidité plus basse et mieux contrôlée
        variation = (random.random() - 0.5) * 2
    else:
        # Variation normale (±5%)
        variation = (random.random() - 0.5) * 10
    
    return max(30, min(70, round(humidite_base + variation)))


def generate_current_simulated_reading(nom_capteur):
    """Générer une lecture simulée unique pour l'heure actuelle"""
    profil = obtenir_profil_capteur(nom_capteur)
    temps_actuel = datetime.now()
    heure = temps_actuel.hour
    
    co2 = generer_motif_co2(
        heure, 
        profil['base_co2'], 
        profil['occupancy_factor'],
        nom_capteur
    )
    temp = generer_temperature(profil['base_temp'], heure, nom_capteur)
    humidite = generer_humidite(profil['base_humidity'], heure, nom_capteur)
    
    return {
        'co2': co2,
        'temperature': temp,
        'humidity': humidite
    }


def generate_historical_simulated_readings(nom_capteur, heures=24):
    """Générer des lectures simulées historiques pour les N dernières heures"""
    profil = obtenir_profil_capteur(nom_capteur)
    lectures = []
    
    maintenant = datetime.utcnow()
    
    # Générer des lectures pour les N dernières heures (toutes les 30 minutes = 2 lectures par heure)
    nombre_lectures = heures * 2
    
    for i in range(nombre_lectures):
        decalage_temps = timedelta(minutes=30 * i)
        temps_lecture = maintenant - timedelta(hours=heures) + decalage_temps
        heure = temps_lecture.hour
        
        co2 = generer_motif_co2(
            heure,
            profil['base_co2'],
            profil['occupancy_factor'],
            nom_capteur
        )
        temp = generer_temperature(profil['base_temp'], heure, nom_capteur)
        humidite = generer_humidite(profil['base_humidity'], heure, nom_capteur)
        
        lectures.append({
            'co2': co2,
            'temperature': temp,
            'humidity': humidite,
            'recorded_at': temps_lecture.isoformat()
        })
    
    return lectures
