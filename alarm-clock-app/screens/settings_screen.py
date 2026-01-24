"""
Settings Screen
"""

from kivymd.uix.screen import MDScreen
from kivymd.uix.list import MDList, OneLineListItem
from kivymd.uix.scrollview import MDScrollView


class SettingsScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.build_ui()
    
    def build_ui(self):
        scroll = MDScrollView()
        settings_list = MDList()
        
        # Add settings items
        settings_list.add_widget(OneLineListItem(text="Theme"))
        settings_list.add_widget(OneLineListItem(text="CO2 Server URL"))
        settings_list.add_widget(OneLineListItem(text="Notifications"))
        settings_list.add_widget(OneLineListItem(text="About"))
        
        scroll.add_widget(settings_list)
        self.add_widget(scroll)
