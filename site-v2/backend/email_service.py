"""
Email notification service for sending alerts to users
"""
from flask_mail import Mail, Message
from flask import current_app
import logging

mail = Mail()
logger = logging.getLogger(__name__)


def init_email(app):
    """Initialize Flask-Mail with app"""
    mail.init_app(app)


def send_alert_email(to_email, sensor_name, alert_type, alert_value, threshold):
    """
    Send alert email to user
    
    Args:
        to_email: User email address
        sensor_name: Name of the sensor
        alert_type: Type of alert (e.g., "High CO2", "High Temperature")
        alert_value: Current value that triggered the alert
        threshold: Threshold that was exceeded
    """
    if not current_app.config.get('ENABLE_EMAIL_NOTIFICATIONS'):
        logger.info(f"Email notifications disabled, skipping email to {to_email}")
        return
    
    try:
        subject = f"🚨 Air Sense Alert: {alert_type} on {sensor_name}"
        
        body = f"""
Hello,

An alert has been triggered on your sensor: {sensor_name}

Alert Type: {alert_type}
Current Value: {alert_value}
Threshold: {threshold}
Timestamp: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Please check the Air Sense Dashboard for more details.

Best regards,
Air Sense Dashboard
        """
        
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2>🚨 Air Sense Alert</h2>
                    <p>Hello,</p>
                    <p>An alert has been triggered on your sensor: <strong>{sensor_name}</strong></p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background-color: #f5f5f5;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Alert Type</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{alert_type}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Current Value</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{alert_value}</td>
                        </tr>
                        <tr style="background-color: #f5f5f5;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Threshold</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{threshold}</td>
                        </tr>
                    </table>
                    <p>Please check the <a href="{current_app.config.get('FRONTEND_URL', 'http://localhost:5173')}/alerts">Air Sense Dashboard</a> for more details.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">Air Sense Dashboard</p>
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
        logger.info(f"Alert email sent to {to_email} for {sensor_name}")
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")


def send_daily_report_email(to_email, user_name, report_data):
    """
    Send daily sensor report email
    
    Args:
        to_email: User email address
        user_name: User's display name
        report_data: Dictionary with report statistics
    """
    if not current_app.config.get('ENABLE_EMAIL_NOTIFICATIONS'):
        return
    
    try:
        subject = "📊 Daily Air Sense Report"
        
        body = f"""
Hello {user_name},

Here's your daily air quality report:

Sensors Monitored: {report_data.get('sensor_count', 0)}
Alerts Triggered: {report_data.get('alert_count', 0)}
Average CO2: {report_data.get('avg_co2', 'N/A')} ppm
Average Temperature: {report_data.get('avg_temp', 'N/A')} °C
Average Humidity: {report_data.get('avg_humidity', 'N/A')} %

Check the dashboard for detailed analytics.

Best regards,
Air Sense Dashboard
        """
        
        msg = Message(
            subject=subject,
            recipients=[to_email],
            body=body
        )
        
        mail.send(msg)
        logger.info(f"Daily report email sent to {to_email}")
        
    except Exception as e:
        logger.error(f"Failed to send report email to {to_email}: {str(e)}")
