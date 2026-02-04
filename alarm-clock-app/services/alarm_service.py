"""
Alarm Service - Manages alarms and triggers
"""

import datetime


class AlarmService:
    def __init__(self, app):
        self.app = app
        self.alarms = []
        self.current_alarm = None
    
    def load_alarms(self, alarms):
        """Load alarms from storage"""
        self.alarms = alarms
    
    def get_all_alarms(self):
        """Get all alarms"""
        return self.alarms
    
    def add_alarm(self, alarm_data):
        """Add a new alarm"""
        self.alarms.append(alarm_data)
        self.app.save_app_data()
    
    def remove_alarm(self, alarm_id):
        """Remove an alarm"""
        self.alarms = [a for a in self.alarms if a.get("id") != alarm_id]
        self.app.save_app_data()
    
    def check_alarms(self, now):
        """Check if any alarms should trigger"""
        for alarm in self.alarms:
            if not alarm.get("enabled", True):
                continue
            
            alarm_time = alarm.get("time", "00:00")
            hour, minute = map(int, alarm_time.split(":"))
            
            if now.hour == hour and now.minute == minute and now.second == 0:
                self.trigger_alarm(alarm)
    
    def check_co2_thresholds(self, co2_level):
        """Check CO2 threshold alarms"""
        for alarm in self.alarms:
            if alarm.get("type") == "co2" and alarm.get("enabled", True):
                threshold = alarm.get("threshold", 1000)
                if co2_level >= threshold:
                    self.trigger_alarm(alarm)
    
    def trigger_alarm(self, alarm):
        """Trigger an alarm"""
        self.current_alarm = alarm
        self.app.trigger_alarm(alarm)
    
    def snooze_current_alarm(self):
        """Snooze the current alarm for 5 minutes"""
        if self.current_alarm:
            # TODO: Implement snooze logic
            self.current_alarm = None
    
    def dismiss_current_alarm(self):
        """Dismiss the current alarm"""
        self.current_alarm = None
