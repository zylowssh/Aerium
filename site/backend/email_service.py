"""
Service de notification par courrier électronique pour envoyer des alertes aux utilisateurs
"""
from flask_mail import Mail, Message
from flask import current_app
import logging

mail = Mail()
logger = logging.getLogger(__name__)


def initialiser_email(app):
    """Initialiser Flask-Mail avec l'app"""
    mail.init_app(app)


def envoyer_email_alerte(to_email, sensor_name, alert_type, alert_value, threshold):
    """
    Envoyer un courrier électronique d'alerte à l'utilisateur
    
    Args:
        to_email: Adresse e-mail de l'utilisateur
        sensor_name: Nom du capteur
        alert_type: Type d'alerte (ex: "CO2 élevé", "Température élevée")
        alert_value: Valeur actuelle qui a déclenché l'alerte
        threshold: Seuil qui a été dépassé
    """
    if not current_app.config.get('ENABLE_EMAIL_NOTIFICATIONS'):
        logger.info(f"Notifications par courrier électronique désactivées, non envoyées à {to_email}")
        return
    
    try:
        subject = f"🚨 Alerte Aerium: {alert_type} sur {sensor_name}"
        
        body = f"""
Bonjour,

Une alerte a été déclenchée sur votre capteur: {sensor_name}

Type d'alerte: {alert_type}
Valeur actuelle: {alert_value}
Seuil: {threshold}
Horodatage: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Veuillez vérifier le tableau de bord Aerium pour plus de détails.

Meilleurs vœux,
Tableau de bord Aerium
        """
        
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2>🚨 Alerte Aerium</h2>
                    <p>Bonjour,</p>
                    <p>Une alerte a été déclenchée sur votre capteur: <strong>{sensor_name}</strong></p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background-color: #f5f5f5;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Type d'alerte</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{alert_type}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Valeur actuelle</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{alert_value}</td>
                        </tr>
                        <tr style="background-color: #f5f5f5;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Seuil</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{threshold}</td>
                        </tr>
                    </table>
                    <p>Veuillez vérifier le <a href="{current_app.config.get('FRONTEND_URL', 'http://localhost:5173')}/alerts">tableau de bord Aerium</a> pour plus de détails.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">Tableau de bord Aerium</p>
                </div>
            </body>
        </html>
        """
        
        msg = Message(
            subject=subject,
            recipients=[to_email],
            body=body,
            html=html
        )
        
        mail.send(msg)
        logger.info(f"E-mail d'alerte envoyé à {to_email} pour {sensor_name}")
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi du courrier électronique à {to_email}: {str(e)}")


def envoyer_email_rapport_quotidien(to_email, user_name, report_data):
    """
    Envoyer un rapport quotidien par e-mail
    
    Args:
        to_email: Adresse e-mail de l'utilisateur
        user_name: Nom d'affichage de l'utilisateur
        report_data: Dictionnaire avec les statistiques du rapport
    """
    if not current_app.config.get('ENABLE_EMAIL_NOTIFICATIONS'):
        return
    
    try:
        subject = "📊 Rapport quotidien Aerium"
        
        body = f"""
Bonjour {user_name},

Voici votre rapport quotidien sur la qualité de l'air:

Capteurs surveillés: {report_data.get('sensor_count', 0)}
Alertes déclenchées: {report_data.get('alert_count', 0)}
Moyenne CO2: {report_data.get('avg_co2', 'N/A')} ppm
Température moyenne: {report_data.get('avg_temp', 'N/A')} °C
Humidité moyenne: {report_data.get('avg_humidity', 'N/A')} %

Vérifiez le tableau de bord pour une analyse détaillée.

Meilleurs vœux,
Tableau de bord Aerium
        """
        
        msg = Message(
            subject=subject,
            recipients=[to_email],
            body=body
        )
        
        mail.send(msg)
        logger.info(f"E-mail de rapport quotidien envoyé à {to_email}")
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi du courrier électronique de rapport à {to_email}: {str(e)}")
