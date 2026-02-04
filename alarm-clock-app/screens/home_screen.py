"""
================================================================================
                         HOME SCREEN
================================================================================
Main screen showing current time, date, and CO2 levels
================================================================================
"""

from kivymd.uix.screen import MDScreen
from kivymd.uix.label import MDLabel
from kivymd.uix.card import MDCard
from kivymd.uix.button import MDRaisedButton, MDFlatButton
from kivymd.uix.boxlayout import MDBoxLayout
from kivy.uix.floatlayout import FloatLayout
from kivy.metrics import dp
from kivymd.app import MDApp


class HomeScreen(MDScreen):
    """
    Home screen with clock display and quick access buttons
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.build_ui()
    
    def build_ui(self):
        """
        Build the home screen UI
        """
        layout = FloatLayout()
        
        # Main container
        container = MDBoxLayout(
            orientation="vertical",
            padding=dp(20),
            spacing=dp(20),
            pos_hint={"center_x": 0.5, "center_y": 0.5}
        )
        
        # Time display card
        time_card = MDCard(
            size_hint=(1, None),
            height=dp(200),
            elevation=4,
            padding=dp(20),
            md_bg_color=(0.15, 0.15, 0.3, 1)
        )
        
        time_layout = MDBoxLayout(
            orientation="vertical",
            adaptive_height=True
        )
        
        # Current time
        self.time_label = MDLabel(
            text="00:00:00",
            halign="center",
            theme_text_color="Custom",
            text_color=(1, 1, 1, 1),
            font_style="H2"
        )
        self.time_label.font_size = dp(60)
        
        # Current date
        self.date_label = MDLabel(
            text="Loading...",
            halign="center",
            theme_text_color="Custom",
            text_color=(0.8, 0.8, 0.8, 1),
            font_style="H6"
        )
        
        time_layout.add_widget(self.time_label)
        time_layout.add_widget(self.date_label)
        time_card.add_widget(time_layout)
        
        # CO2 status card
        co2_card = MDCard(
            size_hint=(1, None),
            height=dp(120),
            elevation=4,
            padding=dp(20),
            md_bg_color=(0.15, 0.3, 0.15, 1)
        )
        
        co2_layout = MDBoxLayout(
            orientation="vertical",
            adaptive_height=True
        )
        
        # CO2 level
        self.co2_label = MDLabel(
            text="CO₂: 0 ppm",
            halign="center",
            theme_text_color="Custom",
            text_color=(1, 1, 1, 1),
            font_style="H4"
        )
        
        # CO2 status
        self.co2_status_label = MDLabel(
            text="Air Quality: Good",
            halign="center",
            theme_text_color="Custom",
            text_color=(0.2, 1, 0.2, 1),
            font_style="Body1"
        )
        
        co2_layout.add_widget(self.co2_label)
        co2_layout.add_widget(self.co2_status_label)
        co2_card.add_widget(co2_layout)
        
        # Navigation buttons
        nav_layout = MDBoxLayout(
            orientation="horizontal",
            spacing=dp(10),
            size_hint=(1, None),
            height=dp(60)
        )
        
        # Alarms button
        alarms_btn = MDRaisedButton(
            text="Alarms",
            size_hint=(0.5, 1),
            md_bg_color=(0.4, 0.3, 0.7, 1),
            on_release=lambda x: self.go_to_screen("alarms")
        )
        
        # CO2 Monitor button
        co2_btn = MDRaisedButton(
            text="CO₂ Monitor",
            size_hint=(0.5, 1),
            md_bg_color=(0.3, 0.5, 0.3, 1),
            on_release=lambda x: self.go_to_screen("co2_monitor")
        )
        
        nav_layout.add_widget(alarms_btn)
        nav_layout.add_widget(co2_btn)
        
        # Settings button
        settings_btn = MDFlatButton(
            text="Settings",
            size_hint=(1, None),
            height=dp(50),
            on_release=lambda x: self.go_to_screen("settings")
        )
        
        # Alarm ringing indicator (hidden by default)
        self.alarm_indicator = MDCard(
            size_hint=(1, None),
            height=dp(100),
            elevation=8,
            padding=dp(15),
            md_bg_color=(0.8, 0.2, 0.2, 1),
            opacity=0
        )
        
        alarm_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(10)
        )
        
        alarm_text = MDLabel(
            text="🔔 ALARM RINGING!",
            halign="center",
            theme_text_color="Custom",
            text_color=(1, 1, 1, 1),
            font_style="H5"
        )
        
        alarm_btn_layout = MDBoxLayout(
            orientation="horizontal",
            spacing=dp(10),
            size_hint=(1, None),
            height=dp(50)
        )
        
        snooze_btn = MDRaisedButton(
            text="Snooze",
            size_hint=(0.5, 1),
            on_release=self.snooze_alarm
        )
        
        dismiss_btn = MDRaisedButton(
            text="Dismiss",
            size_hint=(0.5, 1),
            on_release=self.dismiss_alarm
        )
        
        alarm_btn_layout.add_widget(snooze_btn)
        alarm_btn_layout.add_widget(dismiss_btn)
        
        alarm_layout.add_widget(alarm_text)
        alarm_layout.add_widget(alarm_btn_layout)
        self.alarm_indicator.add_widget(alarm_layout)
        
        # Add widgets to container
        container.add_widget(time_card)
        container.add_widget(co2_card)
        container.add_widget(nav_layout)
        container.add_widget(settings_btn)
        
        layout.add_widget(container)
        layout.add_widget(self.alarm_indicator)
        
        self.add_widget(layout)
        
        # Bind to app properties
        self.bind_app_properties()
    
    def bind_app_properties(self):
        """
        Bind to app-level properties
        """
        app = MDApp.get_running_app()
        app.bind(current_time=self.update_time)
        app.bind(current_date=self.update_date)
        app.bind(co2_level=self.update_co2)
        app.bind(co2_status=self.update_co2_status)
        app.bind(is_alarm_ringing=self.toggle_alarm_indicator)
    
    def update_time(self, instance, value):
        """Update time label"""
        self.time_label.text = value
    
    def update_date(self, instance, value):
        """Update date label"""
        self.date_label.text = value
    
    def update_co2(self, instance, value):
        """Update CO2 level"""
        self.co2_label.text = f"CO₂: {value} ppm"
    
    def update_co2_status(self, instance, value):
        """Update CO2 status and color"""
        self.co2_status_label.text = f"Air Quality: {value}"
        
        # Change color based on status
        if value == "Good":
            self.co2_status_label.text_color = (0.2, 1, 0.2, 1)
        elif value == "Moderate":
            self.co2_status_label.text_color = (1, 0.8, 0.2, 1)
        else:
            self.co2_status_label.text_color = (1, 0.2, 0.2, 1)
    
    def toggle_alarm_indicator(self, instance, value):
        """Show/hide alarm indicator"""
        if value:
            self.alarm_indicator.opacity = 1
            self.alarm_indicator.pos_hint = {"center_x": 0.5, "center_y": 0.5}
        else:
            self.alarm_indicator.opacity = 0
    
    def snooze_alarm(self, *args):
        """Snooze the alarm"""
        app = MDApp.get_running_app()
        app.snooze_alarm()
    
    def dismiss_alarm(self, *args):
        """Dismiss the alarm"""
        app = MDApp.get_running_app()
        app.dismiss_alarm()
    
    def go_to_screen(self, screen_name):
        """Navigate to another screen"""
        self.manager.current = screen_name
