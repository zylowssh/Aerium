import sqlite3
class DBData:
    def __init__(self):
        self.conn = sqlite3.connect("data/aerium.sqlite")
        self.cursor = self.conn.cursor()
    
    def get_all_tables(self):
        #* retourne toute les tables de la db
        self.cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = self.cursor.fetchall()
        return [table[0] for table in tables]          

    def get_column_info(self, table_name):
        #* retourne la liste des noms de colonne d'une table
        self.cursor.execute(f"PRAGMA table_info({table_name})")
        info = self.cursor.fetchall()
        return [name[1] for name in info]

    
    def get_all_column_info(self):
        # retourne un dico de toutes les tables et leurs colonnes respective
        tables = self.get_all_tables()
        info = {}
        for i in tables:
            info[i] = self.get_column_info(i)
            
        return info
    def dico_value(self, table_name, value):
        columns = self.get_column_info(table_name)
        return {columns[i]:value[i] for i in range(len(value))}
    
    def get_values(self, table_name):
        #* retourne un dico de toutes les tables et leurs valeurs respective
        self.cursor.execute(f"SELECT * FROM {table_name}")
        values = self.cursor.fetchall()
        list_values = [self.dico_value(table_name,i) for i in values]
        
        return list_values
    
    def close(self):
        self.conn.close()
        
        
    #* CO2   
    def get_latest_co2(self, limit=5, user_id=None):
        #* retourne les dernières lectures de co2
        if user_id is None:
            self.cursor.execute(f"SELECT * FROM co2_readings ORDER BY timestamp DESC LIMIT {limit}")
        else:
            self.cursor.execute(f"SELECT * FROM co2_readings WHERE user_id = ? ORDER BY timestamp DESC LIMIT {limit}", (user_id,))
        values = self.cursor.fetchall()
        list_values = [self.dico_value("co2_readings",i) for i in values]
        
        return list_values
    
    def get_co2_by_period(self, start, end,user_id=None):
        #* retourne les lectures de co2 entre deux dates
        if user_id is None:
            self.cursor.execute(f"SELECT * FROM co2_readings WHERE timestamp BETWEEN ? AND ?", (start, end))
        else:
            self.cursor.execute(f"SELECT * FROM co2_readings WHERE timestamp BETWEEN ? AND ? AND user_id = ?", (start, end, user_id))
        values = self.cursor.fetchall()
        list_values = [self.dico_value("co2_readings",i) for i in values]
        
        return list_values
    
    def get_co2_stats(self, user_id=None):
        #* Moyenne, min, max
        if user_id is None:
            self.cursor.execute("SELECT AVG(co2_level), MIN(co2_level), MAX(co2_level) FROM co2_readings")
        else:
            self.cursor.execute("SELECT AVG(co2_level), MIN(co2_level), MAX(co2_level) FROM co2_readings WHERE user_id = ?", (user_id,))
        avg, min_, max_ = self.cursor.fetchone()
        return {"avg": avg, "min": min_, "max": max_}
        
    #* Sueil
    def get_thresholds(self, user_id=None):
        #* Récupère les seuils d'alerte de l'utilisateur
        if user_id is None:
            self.cursor.execute("SELECT * FROM user_thresholds")
        else:
            self.cursor.execute("SELECT * FROM user_thresholds WHERE user_id = ?", (user_id,))
        return [self.dico_value("user_thresholds", i) for i in self.cursor.fetchall()]
    
    
    def get_alert(self, user_id=None):
        #* Récupère les alertes de l'utilisateur
        if user_id is None:
            self.cursor.execute("SELECT * FROM notifications")
        else:
            self.cursor.execute("SELECT * FROM notifications WHERE user_id = ?", (user_id,))
        return [self.dico_value("notifications", i) for i in self.cursor.fetchall()]

    def get_co2_by_day(self, days=30, user_id=None):
        #* retourne la moyenne de co2, temperature et humidité par jour
        if user_id is None:
            self.cursor.execute("""
                SELECT 
                    DATE(timestamp)     AS date,
                    AVG(ppm)            AS avg_co2,
                    MIN(ppm)            AS min_co2,
                    MAX(ppm)            AS max_co2,
                    AVG(temperature)    AS avg_temp,
                    AVG(humidity)       AS avg_hum
                FROM co2_readings
                WHERE timestamp >= DATE('now', ? || ' days')
                GROUP BY DATE(timestamp)
                ORDER BY date ASC
            """, (f"-{days}",))
        else:
            self.cursor.execute("""
                SELECT 
                    DATE(timestamp)     AS date,
                    AVG(ppm)            AS avg_co2,
                    MIN(ppm)            AS min_co2,
                    MAX(ppm)            AS max_co2,
                    AVG(temperature)    AS avg_temp,
                    AVG(humidity)       AS avg_hum
                FROM co2_readings
                WHERE timestamp >= DATE('now', ? || ' days')
                AND user_id = ?
                GROUP BY DATE(timestamp)
                ORDER BY date ASC
            """, (f"-{days}", user_id))

        rows = self.cursor.fetchall()
        return [
            {
                "date":     row[0],
                "avg_co2":  round(row[1], 1) if row[1] else 0,
                "min_co2":  round(row[2], 1) if row[2] else 0,
                "max_co2":  round(row[3], 1) if row[3] else 0,
                "avg_temp": round(row[4], 1) if row[4] else 0,
                "avg_hum":  round(row[5], 1) if row[5] else 0,
            }
            for row in rows
        ]
    
    def get_co2_badge(self, ppm, user_id=None):
        thresholds = self.get_thresholds(user_id)
        level = thresholds[0]
        if ppm < level["good_level"]:
            return "Bon",     (0.400, 0.898, 0.647, 1)  # vert
        elif level["good_level"] <= ppm < level["warning_level"]:
            return "Moyen",   (0.980, 0.702, 0.529, 1)  # orange
        elif ppm >= level["warning_level"]:
            return "Mauvais", (0.953, 0.545, 0.659, 1)  # rouge
        
    def get_user(self, username):
        self.cursor.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        )
        row = self.cursor.fetchone()
        if row is None:
            return None
        return self.dico_value("users", row)

    def create_user(self, username, password_hash, email) -> int:  # ← email en paramètre
        self.cursor.execute(
            "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
            (username, password_hash, email)
        )
        self.conn.commit()
        return self.cursor.lastrowid
db= DBData()
print(db.get_column_info("users"))