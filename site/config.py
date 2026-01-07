import os

class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "morpheus-co2-secret-key")
    SESSION_PERMANENT = False
    PERMANENT_SESSION_LIFETIME_DAYS = int(os.getenv("SESSION_LIFETIME_DAYS", "7"))

    # Email configuration
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = bool(str(os.getenv('MAIL_USE_TLS', 'True')).lower() in ('true', '1', 'yes'))
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@morpheus-co2.local')

    # Flask-Limiter defaults (still can be overridden in-app)
    RATE_LIMITS_DAY = os.getenv('RATE_LIMITS_DAY', '500 per day')
    RATE_LIMITS_HOUR = os.getenv('RATE_LIMITS_HOUR', '150 per hour')

class DevelopmentConfig(BaseConfig):
    DEBUG = True

class ProductionConfig(BaseConfig):
    DEBUG = False


def get_config():
    env = os.getenv('AERIUM_ENV') or os.getenv('FLASK_ENV') or 'development'
    if env.lower() in ('prod', 'production'):
        return ProductionConfig
    return DevelopmentConfig
