import random
from datetime import datetime

#* cette classe simule des valeur de lecture de Co2, a remplacer par la lecture réelle du capteur. 
class Co2Reader:
    def __init__(self):
        self.all_data = [] 

    def fake_read_co2(self):
        """
        Simule une valeur de CO₂ entre 400 et 2000 ppm.
        """
        co2 = random.randint(400, 2000)
        return co2


    def get_air_quality(self,ppm):
        """
        Retourne une classification de la qualité de l'air en fonction du ppm.
        """
        if ppm < 800:
            return "Bon"
        elif ppm < 1200:
            return "Moyen"
        else:
            return "Mauvais"

    def get_temp(self):
        """
        Simule une lecture de température entre 15 et 30 °C.
        """
        temp = round(random.uniform(15, 30), 1)
        return temp
    
    def get_humidity(self):
        """
        Simule une lecture d'humidité entre 30 et 70 %.
        """
        humidity = round(random.uniform(30, 70), 1)
        return humidity
    
    
    def get_timestamp(self):
        """
        Retourne l'heure actuelle au format HH:MM:SS.
        """
        date = datetime.now().strftime("%H:%M:%S")
        return date
    
    
    def alert_needed(self, ppm, threshold=1200):
        """
        Retourne True si le ppm dépasse le seuil d'alerte défini.
        Par défaut : 1200 ppm.
        """
        return ppm > threshold

