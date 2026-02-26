"""
Paramètres de configuration pour l'application Aerium
"""
import os
from datetime import timedelta

class Config:
    """Configuration de base"""
    SECRET_KEY = 'aerium-cle-secrete'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///aerium.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'aerium-jwt-secrete'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # Limitation de débit
    RATELIMIT_STORAGE_URL = 'memory://'
    RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '200/day;50/hour;10/minute')
    RATELIMIT_STORAGE_OPTIONS = {}
    
    # Journalisation
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'logs/aerium.log')
    LOG_MAX_BYTES = int(os.getenv('LOG_MAX_BYTES', 10485760))  # 10MB
    LOG_BACKUP_COUNT = int(os.getenv('LOG_BACKUP_COUNT', 10))
    
    # Fonctionnalités
    ENABLE_RATE_LIMITING = os.getenv('ENABLE_RATE_LIMITING', 'True') == 'True'
    
    # Seuils d'alerte (ppm, Celsius, %)
    ALERT_CO2_THRESHOLD = float(os.getenv('ALERT_CO2_THRESHOLD', 1200))
    ALERT_TEMP_MIN = float(os.getenv('ALERT_TEMP_MIN', 15))
    ALERT_TEMP_MAX = float(os.getenv('ALERT_TEMP_MAX', 28))
    ALERT_HUMIDITY_THRESHOLD = float(os.getenv('ALERT_HUMIDITY_THRESHOLD', 80))
    ALERT_SEND_INTERVAL = int(os.getenv('ALERT_SEND_INTERVAL', 300))  # Secondes entre les alertes par courrier électronique
    
    # URL du frontend
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')


class DevelopmentConfig(Config):
    """Configuration de développement"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Configuration de production"""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Configuration de test"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
