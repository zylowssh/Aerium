"""
Configuration settings for the Aerium application
"""
import os
from datetime import timedelta

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'aerium-dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///aerium.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # Email Configuration
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'localhost')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@aerium.app')
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL = 'memory://'
    RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '200/day;50/hour;10/minute')
    RATELIMIT_STORAGE_OPTIONS = {}
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'logs/aerium.log')
    LOG_MAX_BYTES = int(os.getenv('LOG_MAX_BYTES', 10485760))  # 10MB
    LOG_BACKUP_COUNT = int(os.getenv('LOG_BACKUP_COUNT', 10))
    
    # Features
    ENABLE_EMAIL_NOTIFICATIONS = os.getenv('ENABLE_EMAIL_NOTIFICATIONS', 'True') == 'True'
    ENABLE_RATE_LIMITING = os.getenv('ENABLE_RATE_LIMITING', 'True') == 'True'
    
    # Alert Thresholds (ppm, Celsius, %)
    ALERT_CO2_THRESHOLD = float(os.getenv('ALERT_CO2_THRESHOLD', 1200))
    ALERT_TEMP_MIN = float(os.getenv('ALERT_TEMP_MIN', 15))
    ALERT_TEMP_MAX = float(os.getenv('ALERT_TEMP_MAX', 28))
    ALERT_HUMIDITY_THRESHOLD = float(os.getenv('ALERT_HUMIDITY_THRESHOLD', 80))
    ALERT_SEND_INTERVAL = int(os.getenv('ALERT_SEND_INTERVAL', 300))  # Seconds between alert emails
    
    # Frontend URL
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
