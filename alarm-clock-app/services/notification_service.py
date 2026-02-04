"""
Notification Service - Handles notifications
"""


class NotificationService:
    def __init__(self):
        self.enabled = True
    
    def set_enabled(self, enabled):
        """Enable or disable notifications"""
        self.enabled = enabled
    
    def show_alarm_notification(self, alarm):
        """Show alarm notification"""
        if not self.enabled:
            return
        
        # TODO: Implement platform-specific notifications
        # For Android: use plyer or android notification API
        # For iOS: use plyer or iOS notification API
        print(f"Alarm notification: {alarm.get('name', 'Alarm')}")
    
    def show_co2_alert(self, level, status):
        """Show CO2 alert notification"""
        if not self.enabled:
            return
        
        print(f"CO2 Alert: {level} ppm ({status})")
