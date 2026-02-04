"""
Alarm Screen - Manage alarms
"""

from kivymd.uix.screen import MDScreen
from kivymd.uix.list import MDList, TwoLineIconListItem, IconLeftWidget
from kivymd.uix.button import MDFloatingActionButton
from kivymd.uix.scrollview import MDScrollView
from kivy.metrics import dp
from kivymd.app import MDApp


class AlarmScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.build_ui()
    
    def build_ui(self):
        # Scrollable alarm list
        scroll = MDScrollView()
        self.alarm_list = MDList()
        scroll.add_widget(self.alarm_list)
        
        # Add alarm button
        add_btn = MDFloatingActionButton(
            icon="plus",
            pos_hint={"center_x": 0.9, "center_y": 0.1},
            on_release=self.add_alarm
        )
        
        self.add_widget(scroll)
        self.add_widget(add_btn)
    
    def add_alarm(self, *args):
        # TODO: Open alarm dialog
        pass
