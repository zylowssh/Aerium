from kivymd.app import MDApp
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.screenmanager import MDScreenManager
from kivymd.uix.navigationbar import (
    MDNavigationBar, MDNavigationItem,
    MDNavigationItemIcon, MDNavigationItemLabel
)

from dbdata import DBData
from co2page import CO2Screen
from alarm_screen import AlarmScreen


class MainApp(MDApp):

    def build(self):
        self.theme_cls.theme_style     = "Dark"
        self.theme_cls.primary_palette = "Blue"

        self.db = DBData()

        root = MDBoxLayout(orientation="vertical")

        self.sm = MDScreenManager()

        self.co2_screen   = CO2Screen(db=self.db, name="co2")
        self.alarm_screen = AlarmScreen(user_data_dir=self.user_data_dir, name="alarmes")

        
        self.sm.add_widget(self.alarm_screen)
        self.sm.add_widget(self.co2_screen)
        
        nav_bar = MDNavigationBar(on_switch_tabs=self.on_switch_tabs)


        nav_bar.add_widget(MDNavigationItem(
            MDNavigationItemIcon(icon="bell-outline"),
            MDNavigationItemLabel(text="Alarmes"),
        ))
        nav_bar.add_widget(MDNavigationItem(
            MDNavigationItemIcon(icon="chart-line"),
            MDNavigationItemLabel(text="CO2"),
        ))
        root.add_widget(self.sm)
        root.add_widget(nav_bar)

        return root

    def on_switch_tabs(self, bar, item, item_icon, item_text):
        screen_map = {
            "Alarmes": "alarmes",
            "CO2":     "co2",
        }
        self.sm.current = screen_map[item_text]
        
    def show_days_dialog(self, time, thisalarm=None):
        self.alarm_screen.show_days_dialog(time, thisalarm)
        
    def on_stop(self):
        self.db.close()
        self.co2_screen.close()


MainApp().run()