from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255))
    role = db.Column(db.String(50), default='user')  # 'user' ou 'admin'
    avatar_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    sensors = db.relationship('Sensor', backref='owner', lazy=True, cascade='all, delete-orphan')
    
    def vers_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Sensor(db.Model):
    __tablename__ = 'sensors'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='en ligne')  # 'en ligne', 'hors ligne', 'avertissement'
    sensor_type = db.Column(db.String(50), default='simulation')  # 'réel' ou 'simulation'
    sensor_model = db.Column(db.String(120), nullable=True)  # Ex: MQ-135, SCD30
    connection_method = db.Column(db.String(50), nullable=True)  # Ex: http_push, mqtt_bridge
    battery = db.Column(db.Integer, default=100)
    is_live = db.Column(db.Boolean, default=True)
    
    # Seuils personnalisés par capteur (nullable signifie utiliser les val défaut)
    threshold_co2 = db.Column(db.Float, nullable=True)  # PPM
    threshold_temp_min = db.Column(db.Float, nullable=True)  # Celsius
    threshold_temp_max = db.Column(db.Float, nullable=True)  # Celsius
    threshold_humidity = db.Column(db.Float, nullable=True)  # Pourcentage
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    readings = db.relationship('SensorReading', backref='sensor', lazy=True, cascade='all, delete-orphan')
    
    def vers_dict(self, inclure_dernière_lecture=False):
        result = {
            'id': str(self.id),
            'user_id': self.user_id,
            'name': self.name,
            'location': self.location,
            'status': self.status,
            'sensor_type': self.sensor_type,
            'sensor_model': self.sensor_model if self.sensor_type == 'real' else None,
            'connection_method': (self.connection_method or 'http_push') if self.sensor_type == 'real' else None,
            'battery': self.battery if self.sensor_type != 'simulation' else None,
            'is_live': self.is_live,
            'thresholds': {
                'co2': self.threshold_co2,
                'temp_min': self.threshold_temp_min,
                'temp_max': self.threshold_temp_max,
                'humidity': self.threshold_humidity
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if inclure_dernière_lecture:
            # Always expose reading keys so the frontend gets a stable payload.
            result['co2'] = 0
            result['temperature'] = 0
            result['humidity'] = 0
            result['lastReading'] = None

            # Fetch only the latest reading instead of loading all readings in memory.
            dernière = SensorReading.query.filter_by(sensor_id=self.id).order_by(
                SensorReading.recorded_at.desc()
            ).first()
            if dernière:
                result['co2'] = dernière.co2
                result['temperature'] = dernière.temperature
                result['humidity'] = dernière.humidity
                result['lastReading'] = dernière.recorded_at.isoformat()
        
        return result


class SensorReading(db.Model):
    __tablename__ = 'sensor_readings'
    
    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey('sensors.id'), nullable=False)
    co2 = db.Column(db.Float, nullable=False)
    temperature = db.Column(db.Float, nullable=False)
    humidity = db.Column(db.Float, nullable=False)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def vers_dict(self):
        return {
            'id': self.id,
            'sensor_id': self.sensor_id,
            'co2': self.co2,
            'temperature': self.temperature,
            'humidity': self.humidity,
            'recorded_at': self.recorded_at.isoformat()
        }


class Alert(db.Model):
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey('sensors.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    alert_type = db.Column(db.String(50), nullable=False)  # 'avertissement', 'critique', 'info'
    message = db.Column(db.String(500), nullable=False)
    value = db.Column(db.Float)
    status = db.Column(db.String(50), default='nouvelle')  # 'nouvelle', 'reconnue', 'résolue'
    acknowledged_at = db.Column(db.DateTime)
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def vers_dict(self):
        sensor = Sensor.query.get(self.sensor_id)
        result = {
            'id': str(self.id),
            'sensorId': str(self.sensor_id),
            'sensorName': sensor.name if sensor else 'Inconnu',
            'type': self.alert_type,
            'message': self.message,
            'value': self.value,
            'status': self.status,
            'timestamp': self.created_at.isoformat()
        }
        # Ajouter des champs optionnels s'ils existent
        if hasattr(self, 'acknowledged_at') and self.acknowledged_at:
            result['acknowledgedAt'] = self.acknowledged_at.isoformat()
        if hasattr(self, 'resolved_at') and self.resolved_at:
            result['resolvedAt'] = self.resolved_at.isoformat()
        return result


class AlertHistory(db.Model):
    __tablename__ = 'alert_history'
    
    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey('sensors.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    alert_type = db.Column(db.String(50), nullable=False)  # 'avertissement', 'critique', 'info'
    metric = db.Column(db.String(100), nullable=False)  # 'co2', 'température', 'humidité'
    metric_value = db.Column(db.Float, nullable=False)
    threshold_value = db.Column(db.Float)
    message = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(50), default='triggered')  # 'déclenché', 'reconnu', 'résolu'
    acknowledged_at = db.Column(db.DateTime)
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def vers_dict(self):
        sensor = Sensor.query.get(self.sensor_id)
        return {
            'id': str(self.id),
            'sensorId': str(self.sensor_id),
            'sensorName': sensor.name if sensor else 'Inconnu',
            'sensorLocation': sensor.location if sensor else 'Inconnu',
            'alertType': self.alert_type,
            'metric': self.metric,
            'metricValue': self.metric_value,
            'thresholdValue': self.threshold_value,
            'message': self.message,
            'status': self.status,
            'createdAt': self.created_at.isoformat(),
            'acknowledgedAt': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'resolvedAt': self.resolved_at.isoformat() if self.resolved_at else None
        }


class Maintenance(db.Model):
    __tablename__ = 'maintenance'
    
    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey('sensors.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'étalonnage', 'batterie', 'inspection', 'réparation', 'remplacement'
    status = db.Column(db.String(50), default='scheduled')  # 'planifié', 'en_cours', 'terminé', 'en retard'
    scheduled_date = db.Column(db.DateTime, nullable=False)
    completed_date = db.Column(db.DateTime)
    description = db.Column(db.String(500))
    notes = db.Column(db.Text)
    priority = db.Column(db.String(50), default='normal')  # 'bas', 'normal', 'élevé'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def vers_dict(self):
        sensor = Sensor.query.get(self.sensor_id)
        return {
            'id': str(self.id),
            'sensorId': str(self.sensor_id),
            'sensorName': sensor.name if sensor else 'Inconnu',
            'type': self.type,
            'status': self.status,
            'scheduledDate': self.scheduled_date.isoformat(),
            'completedDate': self.completed_date.isoformat() if self.completed_date else None,
            'description': self.description,
            'notes': self.notes,
            'priority': self.priority,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }


def init_db():
    """Initialiser la base de données et créer les tables"""
    db.create_all()
    print("Base de données initialisée avec succès")


def vérifier_colonnes_seuil_capteur(app):
    """Vérifier le schéma capteur: avertir pour les seuils, auto-ajouter les colonnes de connexion réelle."""
    try:
        with app.app_context():
            inspecteur = inspect(db.engine)
            if 'sensors' not in inspecteur.get_table_names():
                return

            colonnes = {col['name'] for col in inspecteur.get_columns('sensors')}
            attendues = {
                'threshold_co2',
                'threshold_temp_min',
                'threshold_temp_max',
                'threshold_humidity'
            }
            manquantes = sorted(attendues - colonnes)
            if manquantes:
                app.logger.warning(
                    '[DB] Colonnes de seuil de capteur manquantes: %s. Exécutez la migration ou recréez la BD.',
                    ', '.join(manquantes)
                )

            # Colonnes nécessaires pour configurer les capteurs réels (ajout non destructif).
            colonnes_connexion = {
                'sensor_model': 'VARCHAR(120)',
                'connection_method': 'VARCHAR(50)'
            }
            manquantes_connexion = [
                nom_colonne for nom_colonne in colonnes_connexion.keys() if nom_colonne not in colonnes
            ]
            if manquantes_connexion:
                with db.engine.begin() as connexion:
                    for nom_colonne in manquantes_connexion:
                        type_sql = colonnes_connexion[nom_colonne]
                        connexion.execute(text(f'ALTER TABLE sensors ADD COLUMN {nom_colonne} {type_sql}'))

                    connexion.execute(text(
                        """
                        UPDATE sensors
                        SET connection_method = 'http_push'
                        WHERE sensor_type = 'real'
                          AND (connection_method IS NULL OR TRIM(connection_method) = '')
                        """
                    ))

                app.logger.info(
                    '[DB] Colonnes de configuration capteur réel ajoutées automatiquement: %s',
                    ', '.join(manquantes_connexion)
                )
    except Exception as exc:
        app.logger.warning('[DB] La vérification du schéma a échoué: %s', exc)
