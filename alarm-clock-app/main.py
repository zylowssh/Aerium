"""
================================================================================
                    AERIUM ALARM CLOCK - MAIN APPLICATION
================================================================================
A KivyMD-based alarm clock mobile app that syncs with CO2 readings from Aerium
and triggers alarms based on air quality thresholds.
================================================================================
"""

from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.screenmanager import MDScreenManager
from kivy.clock import Clock
from kivy.properties import StringProperty, NumericProperty, BooleanProperty
import datetime
import json
import os

# Import screens
from screens.home_screen import HomeScreen
from screens.alarm_screen import AlarmScreen
from screens.settings_screen import SettingsScreen
from screens.co2_monitor_screen import CO2MonitorScreen

# Import services
from services.alarm_service import AlarmService
from services.co2_service import CO2Service
from services.notification_service import NotificationService
from services.storage_service import StorageService


class AeriumAlarmApp(MDApp):
    """
    Main application class for Aerium Alarm Clock
    """
    
    # App properties
    current_time = StringProperty("")
    current_date = StringProperty("")
    co2_level = NumericProperty(0)
    co2_status = StringProperty("Good")
    is_alarm_ringing = BooleanProperty(False)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Initialize services
        self.alarm_service = AlarmService(self)
        self.co2_service = CO2Service(self)
        self.notification_service = NotificationService(self)
        self.storage_service = StorageService()
        
        # Clock update event
        self.clock_event = None
        
    def build(self):
        """
        Build the application UI
        """
        self.theme_cls.primary_palette = "DeepPurple"
        self.theme_cls.primary_hue = "500"
        self.theme_cls.theme_style = "Dark"
        self.theme_cls.material_style = "M3"
        
        # Create screen manager
        self.screen_manager = MDScreenManager()
        
        # Add screens
        self.screen_manager.add_widget(HomeScreen(name="home"))
        self.screen_manager.add_widget(AlarmScreen(name="alarms"))
        self.screen_manager.add_widget(SettingsScreen(name="settings"))
        self.screen_manager.add_widget(CO2MonitorScreen(name="co2_monitor"))
        
        # Start clock updates
        self.clock_event = Clock.schedule_interval(self.update_time, 1)
        
        # Start CO2 monitoring
        Clock.schedule_interval(self.update_co2, 30)  # Every 30 seconds
        
        # Load saved data
        self.load_app_data()
        
        return self.screen_manager
    
    def update_time(self, dt):
        """
        Update current time and date
        """
        now = datetime.datetime.now()
        self.current_time = now.strftime("%H:%M:%S")
        self.current_date = now.strftime("%A, %B %d, %Y")
        
        # Check alarms
        self.alarm_service.check_alarms(now)
    
    def update_co2(self, dt):
        """
        Update CO2 levels from Aerium server
        """
        co2_data = self.co2_service.get_current_co2()
        if co2_data:
            self.co2_level = co2_data.get("level", 0)
            self.co2_status = co2_data.get("status", "Unknown")
            
            # Check CO2 thresholds for alarms
            self.alarm_service.check_co2_thresholds(self.co2_level)
    
    def load_app_data(self):
        """
        Load saved application data
        """
        # Load alarms
        alarms = self.storage_service.load_data("alarms", [])
        self.alarm_service.load_alarms(alarms)
        
        # Load settings
        settings = self.storage_service.load_data("settings", {})
        self.apply_settings(settings)
    
    def save_app_data(self):
        """
        Save application data
        """
        # Save alarms
        alarms = self.alarm_service.get_all_alarms()
        self.storage_service.save_data("alarms", alarms)
        
        # Save settings
        settings = self.get_current_settings()
        self.storage_service.save_data("settings", settings)
    
    def apply_settings(self, settings):
        """
        Apply settings to the app
        """
        # Apply theme
        theme = settings.get("theme", "Dark")
        self.theme_cls.theme_style = theme
        
        # Apply CO2 server URL
        server_url = settings.get("co2_server_url", "http://localhost:5000")
        self.co2_service.set_server_url(server_url)
        
        # Apply notification settings
        enable_notifications = settings.get("enable_notifications", True)
        self.notification_service.set_enabled(enable_notifications)
    
    def get_current_settings(self):
        """
        Get current app settings
        """
        return {
            "theme": self.theme_cls.theme_style,
            "co2_server_url": self.co2_service.server_url,
            "enable_notifications": self.notification_service.enabled
        }
    
    def trigger_alarm(self, alarm):
        """
        Trigger an alarm
        """
        self.is_alarm_ringing = True
        self.notification_service.show_alarm_notification(alarm)
        
        # Switch to home screen to show alarm
        self.screen_manager.current = "home"
    
    def snooze_alarm(self):
        """
        Snooze the current alarm
        """
        self.is_alarm_ringing = False
        self.alarm_service.snooze_current_alarm()
    
    def dismiss_alarm(self):
        """
        Dismiss the current alarm
        """
        self.is_alarm_ringing = False
        self.alarm_service.dismiss_current_alarm()
    
    def on_pause(self):
        """
        Handle app pause (Android)
        """
        self.save_app_data()
        return True
    
    def on_resume(self):
        """
        Handle app resume (Android)
        """
        self.load_app_data()
    
    def on_stop(self):
        """
        Clean up when app stops
        """
        self.save_app_data()
        if self.clock_event:
            self.clock_event.cancel()


if __name__ == "__main__":
    AeriumAlarmApp().run()
