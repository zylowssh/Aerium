"""
CO2 Monitor Screen
"""

from kivymd.uix.screen import MDScreen
from kivymd.uix.label import MDLabel
from kivymd.uix.card import MDCard
from kivy.metrics import dp


class CO2MonitorScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.build_ui()
    
    def build_ui(self):
        card = MDCard(
            size_hint=(0.9, 0.8),
            pos_hint={"center_x": 0.5, "center_y": 0.5},
            padding=dp(20)
        )
        
        label = MDLabel(
            text="CO₂ Monitor\nReal-time data from Aerium server",
            halign="center",
            theme_text_color="Primary"
        )
        
        card.add_widget(label)
        self.add_widget(card)
