"""
Migration de base de données: Ajouter des colonnes de seuils à la table des capteurs
Exécutez ce script pour ajouter des colonnes de seuils personnalisées sans perdre de données existantes
"""

import sqlite3
import os

# Chemin vers la base de données
CHEMIN_BD = os.path.join(os.path.dirname(__file__), 'instance', 'aerium.db')

def migrer():
    print("Démarrage de la migration de la base de données...")
    print(f"Base de données: {CHEMIN_BD}")
    
    if not os.path.exists(CHEMIN_BD):
        print("❌ Base de données introuvable! Exécutez d'abord l'application pour la créer.")
        return
    
    connexion = sqlite3.connect(CHEMIN_BD)
    curseur = connexion.cursor()
    
    # Vérifier si les colonnes existent déjà
    curseur.execute("PRAGMA table_info(sensors)")
    colonnes = [col[1] for col in curseur.fetchall()]
    
    migrations_necessaires = []
    if 'threshold_co2' not in colonnes:
        migrations_necessaires.append('threshold_co2')
    if 'threshold_temp_min' not in colonnes:
        migrations_necessaires.append('threshold_temp_min')
    if 'threshold_temp_max' not in colonnes:
        migrations_necessaires.append('threshold_temp_max')
    if 'threshold_humidity' not in colonnes:
        migrations_necessaires.append('threshold_humidity')
    
    if not migrations_necessaires:
        print("✓ Toutes les colonnes de seuils existent déjà. Aucune migration nécessaire.")
        connexion.close()
        return
    
    print(f"Ajout des colonnes: {', '.join(migrations_necessaires)}")
    
    try:
        # Ajouter les colonnes de seuils
        if 'threshold_co2' in migrations_necessaires:
            curseur.execute('ALTER TABLE sensors ADD COLUMN threshold_co2 FLOAT')
            print("✓ Ajout de threshold_co2")
        
        if 'threshold_temp_min' in migrations_necessaires:
            curseur.execute('ALTER TABLE sensors ADD COLUMN threshold_temp_min FLOAT')
            print("✓ Ajout de threshold_temp_min")
        
        if 'threshold_temp_max' in migrations_necessaires:
            curseur.execute('ALTER TABLE sensors ADD COLUMN threshold_temp_max FLOAT')
            print("✓ Ajout de threshold_temp_max")
        
        if 'threshold_humidity' in migrations_necessaires:
            curseur.execute('ALTER TABLE sensors ADD COLUMN threshold_humidity FLOAT')
            print("✓ Ajout de threshold_humidity")
        
        connexion.commit()
        print("\n✅ Migration terminée avec succès!")
        print("Redémarrez le serveur Flask pour que les modifications prennent effet.")
        
    except Exception as e:
        connexion.rollback()
        print(f"\n❌ Échec de la migration: {e}")
        
    finally:
        connexion.close()

if __name__ == '__main__':
    migrer()
