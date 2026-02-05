from alarmprocess import StartAlarmProcess
from kivymd.app import MDApp
from kivymd.uix.button import MDIconButton
from datamanager import DataManager
from kivymd.uix.card import MDCard
from kivymd.uix.relativelayout import MDRelativeLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.selectioncontrol import MDSwitch
from kivy.animation import Animation

from kivymd.uix.menu import MDDropdownMenu

class AlarmCard(MDCard):
    def __init__(self, time_text, selected_days, alarm_id, alarm_data, value=True):
        super().__init__()

        self.padding = "4dp"
        self.size_hint = (1, None)
        self.height = "102dp"
        self.radius = [15]
        self.colors = (0.5, 0.5, 0.5, 1)
        self.alarm_id = alarm_id
        layout = MDRelativeLayout()
        self.dataManager = DataManager(MDApp.get_running_app().user_data_dir)
        # Heure
        label_time = MDLabel(
            text=time_text,
            adaptive_size=True,
            pos_hint={"center_y": 0.7, "x": 0.1},
            halign="left",
            text_color=(0.5, 0.5, 0.5, 1)
        )
        self.selected_days = selected_days
        self.alarm_data = alarm_data

        
        # Bouton menu (trois points verticaux)
        menu_button = MDIconButton( 
            icon="dots-vertical",
            theme_icon_color="Custom",
            icon_color=(0.7,0.7,0.7, 1),
            pos_hint={"center_y": 0.5,"right": 0.96},
            ripple_scale=0.7,
            size_hint=(None, None),
            size=("40dp", "40dp")
        )
        
        menu_button.bind(on_release=self.show_menu)
        
        # Switch
        switch = MDSwitch(
            pos_hint={"center_y": 0.5, "right": 0.88},
            x=-20,
        )
        
        # Alarme active par defaut
        switch.active = value 
        # Heure
        label_day = MDLabel(
            text=self.selected_days,
            adaptive_size=True,
            pos_hint={"center_y": 0.25, "x": 0.1},
            halign="left",
            text_color=(0.5, 0.5, 0.5, 1)
            
        )
        def if_switch_active(switch, value):
            white_text = (0.9, 0.9, 0.9, 1) if value else (0.5, 0.5, 0.5, 1)
            label_day.text_color = (0.75, 0.75, 0.75, 1) if value else (0.5, 0.5, 0.5, 1)
            label_time
            label_day_anim = Animation(
                text_color=white_text,
                duration=0.25,
                t="out_quad"
            )
            label_time_anim = Animation(
                text_color=white_text,
                duration=0.25,
                t="out_quad"
            )
            label_day_anim.start(label_day)
            label_time_anim.start(label_time)
            self.alarm_data['active'] = value
            self.dataManager.change(self.alarm_id, self.alarm_data)
        switch.bind(active=if_switch_active)

        layout.add_widget(menu_button)
        layout.add_widget(label_time)
        layout.add_widget(switch)
        layout.add_widget(label_day)
        self.add_widget(layout)
        

    def show_menu(self, instance):
        """Affiche le menu contextuel avec options Modifier/Supprimer"""
        menu_items = [
            {
                "text": "Modifier",
                "height": 48,
                "on_release": lambda: self.edit_alarm(),
            },
            {
                "text": "Supprimer",
                "height": 48,
                "on_release": lambda: self.delete_alarm(),
            },
        ]
        
        self.menu = MDDropdownMenu(
            caller=instance,
            items=menu_items,
            width_mult=4,
            max_height=96,  # 2 items * 48dp + padding
        )
        self.menu.open()

    def edit_alarm(self):
        self.alarmProcess = StartAlarmProcess(thisalarm=self)
        self.alarmProcess.open()
        self.menu.dismiss()

    def delete_alarm(self):
        self.dataManager.delete(self.alarm_id)
        self.parent.remove_widget(self)
        self.menu.dismiss()