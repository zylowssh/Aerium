from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.screenmanager import MDScreenManager
from kivymd.uix.navigationbar import (
    MDNavigationBar, MDNavigationItem,
    MDNavigationItemIcon, MDNavigationItemLabel
)
#* Projet
from dbdata import DBData
from co2page import CO2Screen
from alarm_screen import AlarmScreen
from login_user import LoginScreen


class MainApp(MDApp):

    def build(self):
        self.theme_cls.theme_style = "Dark"
        self.theme_cls.primary_palette = "Blue"
        self.db = DBData()
        self.user_id = None
        self.sm = MDScreenManager()

        # login screen
        login = LoginScreen(
            db=self.db,
            on_success=self.on_login_success,
            name="login"
        )
        self.sm.add_widget(login)

        return self.sm

    def on_login_success(self, user_id):
        """Appelé après connexion ou inscription réussie."""
        self.user_id = user_id
        self._build_main_ui()
        self.sm.current = "main"

    def _build_main_ui(self):
        """Construit l'UI principale et l'ajoute au screen manager."""
        if self.sm.has_screen("main"):
            return

        self.co2_screen = CO2Screen(db=self.db, user_id=self.user_id, name="co2")
        self.alarm_screen = AlarmScreen(user_data_dir=self.user_data_dir, name="alarmes")

        # wrapper avec inner_sm + nav bar
        main_wrapper = MDScreen(name="main")
        layout = MDBoxLayout(orientation="vertical")

        self.inner_sm = MDScreenManager()
        self.inner_sm.add_widget(self.co2_screen)
        self.inner_sm.add_widget(self.alarm_screen)

        nav_bar = MDNavigationBar(on_switch_tabs=self.on_switch_tabs)
        nav_bar.add_widget(MDNavigationItem(
            MDNavigationItemIcon(icon="chart-line"),
            MDNavigationItemLabel(text="CO2"),
        ))
        nav_bar.add_widget(MDNavigationItem(
            MDNavigationItemIcon(icon="bell-outline"),
            MDNavigationItemLabel(text="Alarmes"),
        ))

        layout.add_widget(self.inner_sm)
        layout.add_widget(nav_bar)
        main_wrapper.add_widget(layout)
        self.sm.add_widget(main_wrapper)

    def on_switch_tabs(self, bar, item, item_icon, item_text):
        screen_map = {"CO2": "co2", "Alarmes": "alarmes"}
        self.inner_sm.current = screen_map[item_text]

    def show_days_dialog(self, time, thisalarm=None):
        self.alarm_screen.show_days_dialog(time, thisalarm)

    def on_stop(self):
        self.db.close()
        if hasattr(self, "co2_screen"):
            self.co2_screen.close()


MainApp().run()