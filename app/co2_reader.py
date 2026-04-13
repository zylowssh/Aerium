import random
from datetime import datetime
from dbdata import DBData  # adapte l'import selon ton arborescence


class Co2Reader:
    def __init__(self, user_id=1):
        self.user_id = user_id
        self.db = DBData()


    def fake_read_co2(self) -> int:
        return random.randint(400, 2000)

    def get_temp(self) -> float:
        return round(random.uniform(15, 30), 1)

    def get_humidity(self) -> float:
        return round(random.uniform(30, 70), 1)


    def get_air_quality(self, ppm: int) -> str:
        badge = self.db.get_co2_badge(ppm,self.user_id)[0]
        if badge:
            return badge[0]
        # si pas de seuil en base
        if ppm < 800:   return "Bon"
        if ppm < 1200:  return "Moyen"
        return "Mauvais"

    def save_reading(self, ppm: int, temperature: float, humidity: float) -> dict:
        """
        Insère une lecture dans co2_readings.
        Retourne le dict complet de la mesure.
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        self.db.cursor.execute(
            """
            INSERT INTO co2_readings (timestamp, ppm, temperature, humidity, user_id)
            VALUES (?, ?, ?, ?, ?)
            """,
            (timestamp, ppm, temperature, humidity, self.user_id),
        )

        self.db.conn.commit()

        return {
            "timestamp":   timestamp,
            "ppm":         ppm,
            "temperature": temperature,
            "humidity":    humidity,
            "user_id":     self.user_id,
            "quality":     self.get_air_quality(ppm),
        }

    def read_and_save(self) -> dict:
        ppm         = self.fake_read_co2()
        temperature = self.get_temp()
        humidity    = self.get_humidity()
        return self.save_reading(ppm, temperature, humidity)

    def close(self):
        self.db.close()