from kivymd.app import MDApp
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.anchorlayout import AnchorLayout
from kivy.clock import Clock
from kivy.metrics import dp
from kivymd.uix.label import MDLabel
from kivymd.uix.button import MDButton, MDButtonText, MDButtonIcon
from kivymd.uix.menu import MDDropdownMenu


#Projet
from graph import CO2Graph
from dbdata import DBData
from statcard import StatCard

class MainApp(MDApp):

    def build(self):
        self.db   = DBData()
        self.mode = "flux"
        self.theme_cls.theme_style = "Dark"

        root = BoxLayout(
            orientation="vertical",
            padding=dp(12),
            spacing=dp(10)
        )

        # titre + bouton dropdown
        top_bar = BoxLayout(
            orientation="horizontal",
            size_hint_y=None,
            height=dp(48),
            spacing=dp(10)
        )

        title_lbl = MDLabel(
            text="Tableau de bord CO2",
            font_style="Title",
            role="large",
            halign="left",
            size_hint_x=1
        )

        btn_anchor = AnchorLayout(
            anchor_x="right",
            size_hint_x=None,
            width=dp(190)
        )
        self.mode_btn = MDButton(
            style="outlined",
            size_hint=(1, None),
            height=dp(40)
        )
        self.mode_btn.add_widget(MDButtonText(text="   5 flux actuels"[:3]))
        self.mode_btn.add_widget(MDButtonIcon(icon="chevron-down"))
        self.mode_btn.bind(on_release=self.open_menu)

        btn_anchor.add_widget(self.mode_btn)
        top_bar.add_widget(title_lbl)
        top_bar.add_widget(btn_anchor)

        # 3 carte de stats
        cards_row = BoxLayout(
            orientation="horizontal",
            size_hint_y=None,
            height=dp(110),
            spacing=dp(10)
        )

        self.card_co2 = StatCard(
            "CO2", "---", "ppm",
            badge="---",
            accent_color=(0.400, 0.749, 1.0, 1)
        )
        self.card_temp = StatCard(
            "Temperature", "---", "°C",
            accent_color=(0.400, 0.898, 0.647, 1)
        )
        self.card_hum = StatCard(
            "Humidite", "---", "%",
            accent_color=(0.980, 0.855, 0.369, 1)
        )

        cards_row.add_widget(self.card_co2)
        cards_row.add_widget(self.card_temp)
        cards_row.add_widget(self.card_hum)

        #Graph
        self.graph = CO2Graph()


        root.add_widget(top_bar)
        root.add_widget(cards_row)
        root.add_widget(self.graph)
        
        # menu dropdown,
        menu_items = [
            {
                "text": "5 flux actuels",
                "leading_icon": "chart-line",
                "on_release": lambda: self.set_mode("flux")
            },
            {
                "text": "30 derniers jours",
                "leading_icon": "calendar-month",
                "on_release": lambda: self.set_mode("jours")
            },
        ]
        self.menu = MDDropdownMenu(
            caller=self.mode_btn,
            items=menu_items
        )


        self.refresh(0)
        Clock.schedule_interval(self.refresh, 5)

        return root


    def open_menu(self, btn):
        """Ouvre le menu et bascule l'icône en chevron-up."""
        for child in self.mode_btn.children:
            if isinstance(child, MDButtonIcon):
                child.icon = "chevron-up"
        self.menu.open()

    def set_mode(self, mode):
        """Ferme le menu, met à jour le bouton et recharge les données."""
        self.mode = mode

        label = "5 flux actuels" if mode == "flux" else "30 derniers jours"

        for child in self.mode_btn.children:
            if isinstance(child, MDButtonText):
                child.text = label
            if isinstance(child, MDButtonIcon):
                child.icon = "chevron-down"

        self.menu.dismiss()
        self.refresh(0)

    def refresh(self, dt):
        """Récupère les données BDD et met à jour le graphique et les cartes."""

        if self.mode == "flux":
            data = self.db.get_latest_co2(limit=5)
            data.reverse()
            # la BDD retourne du plus récent au plus ancien
            # on inverse pour avoir l'ordre chronologique 
        else:
            data = self.db.get_co2_by_day()

        self.graph.update_data(data, mode=self.mode)

        if data:
            last = data[-1]

            if self.mode == "flux":
                co2_val = last["ppm"]
                temp_val = round(last["temperature"], 1)
                hum_val = round(last["humidity"],    1)
            else:
                co2_val = round(last["avg_co2"],          0)
                temp_val = round(last.get("avg_temp", 0),  1)
                hum_val = round(last.get("avg_hum",  0),  1)

            badge_text, badge_color = self.db.get_co2_badge(co2_val)

            self.card_co2.update(f"{co2_val}",
                                 badge=badge_text,
                                 badge_color=badge_color)
            self.card_temp.update(f"{temp_val}")
            self.card_hum.update(f"{hum_val}")

    def on_stop(self):
        """Ferme la connexion SQLite proprement à la fermeture de l'app."""
        self.db.close()



MainApp().run()