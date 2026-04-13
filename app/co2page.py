from kivy.uix.boxlayout import BoxLayout
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.anchorlayout import AnchorLayout
from kivy.clock import Clock
from kivy.metrics import dp
from kivymd.uix.screen import MDScreen
from kivymd.uix.label import MDLabel
from kivymd.uix.button import MDButton, MDButtonText, MDButtonIcon, MDFabButton
from kivymd.uix.menu import MDDropdownMenu
from kivymd.uix.snackbar import MDSnackbar, MDSnackbarText

from graph import CO2Graph
from statcard import StatCard
from co2_reader import Co2Reader

class CO2Screen(MDScreen):

    def __init__(self, db,user_id, **kwargs):
        super().__init__(**kwargs)
        self.db = db
        self.user_id = user_id
        self.reader = Co2Reader()
        self.mode = "flux"
        self._record_event = None

        root = FloatLayout()
        main = BoxLayout(
            orientation="vertical",
            padding=dp(12),
            spacing=dp(10),
            size_hint=(1, 1),
            pos_hint={"x": 0, "y": 0}
        )

        main.add_widget(self._build_top_bar())
        main.add_widget(self._build_cards_row())

        self.graph = CO2Graph()
        main.add_widget(self.graph)

        root.add_widget(main)
        root.add_widget(self._build_fab())
        self.add_widget(root)

        self._build_menu()

        self.refresh(0)
        Clock.schedule_interval(self.refresh, 5)

    def _build_top_bar(self):
        top_bar = BoxLayout(
            orientation="horizontal",
            size_hint_y=None,
            height=dp(48),
            spacing=dp(10)
        )
        title_lbl = MDLabel(
            text="Analyse du CO2",
            font_style="Title",
            role="large",
            halign="left",
            size_hint_x=1
        )
        btn_anchor = AnchorLayout(anchor_x="right", size_hint_x=None, width=dp(190))
        self.mode_btn = MDButton(style="outlined", size_hint=(1, None), height=dp(40))
        self.mode_btn.add_widget(MDButtonText(text="   5 flux actuels"[:3]))
        self.mode_btn.add_widget(MDButtonIcon(icon="chevron-down"))
        self.mode_btn.bind(on_release=self.open_menu)
        btn_anchor.add_widget(self.mode_btn)
        top_bar.add_widget(title_lbl)
        top_bar.add_widget(btn_anchor)
        return top_bar

    def _build_cards_row(self):
        cards_row = BoxLayout(
            orientation="horizontal",
            size_hint_y=None,
            height=dp(110),
            spacing=dp(10)
        )
        self.card_co2 = StatCard("CO2", "---", "ppm", badge="---", accent_color=(0.400, 0.749, 1.0,  1))
        self.card_temp = StatCard("Temperature", "---", "°C", accent_color=(0.400, 0.898, 0.647, 1))
        self.card_hum = StatCard("Humidite", "---", "%", accent_color=(0.980, 0.855, 0.369, 1))
        cards_row.add_widget(self.card_co2)
        cards_row.add_widget(self.card_temp)
        cards_row.add_widget(self.card_hum)
        return cards_row

    def _build_fab(self):
        self.fab = MDFabButton(
            icon= "leaf",
            style= "standard",
            pos_hint= {"right": 0.95, "y": 0.08},
            md_bg_color= (0.400, 0.749, 1.0, 1),
            theme_bg_color= "Custom",
            theme_icon_color= "Custom",
            icon_color= (0.082, 0.094, 0.149, 1),
        )
        self.fab.bind(on_release=self.capture_reading)
        return self.fab

    def _build_menu(self):
        menu_items = [
            {"text": "5 flux actuels", "leading_icon": "chart-line", "on_release": lambda: self.set_mode("flux")},
            {"text": "30 derniers jours", "leading_icon": "calendar-month", "on_release": lambda: self.set_mode("jours")},
        ]
        self.menu = MDDropdownMenu(caller=self.mode_btn, items=menu_items)

    def open_menu(self, btn):
        for child in self.mode_btn.children:
            if isinstance(child, MDButtonIcon):
                child.icon = "chevron-up"
        self.menu.open()

    def set_mode(self, mode):
        self.mode = mode
        label = "5 flux actuels" if mode == "flux" else "30 derniers jours"
        for child in self.mode_btn.children:
            if isinstance(child, MDButtonText): child.text = label
            if isinstance(child, MDButtonIcon): child.icon = "chevron-down"
        self.menu.dismiss()
        self.refresh(0)

    def refresh(self, dt):
        if self.mode == "flux":
            data = self.db.get_latest_co2(limit=5)
            data.reverse()
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
                co2_val = round(last["avg_co2"],         0)
                temp_val = round(last.get("avg_temp", 0), 1)
                hum_val = round(last.get("avg_hum",  0), 1)

            badge_text, badge_color = self.db.get_co2_badge(co2_val)
            self.card_co2.update(f"{co2_val}", badge=badge_text, badge_color=badge_color)
            self.card_temp.update(f"{temp_val}")
            self.card_hum.update(f"{hum_val}")

    def capture_reading(self, *args):
        if self._record_event is None:
            self._record_event = Clock.schedule_interval(self._do_reading, 5)
            self._do_reading(0)
            self.fab.icon = "stop"
            self.fab.md_bg_color = (0.953, 0.545, 0.659, 1)
        else:
            self._record_event.cancel()
            self._record_event = None
            self.fab.icon = "leaf"
            self.fab.md_bg_color = (0.400, 0.749, 1.0, 1)


    def _do_reading(self, dt):
        reading = self.reader.read_and_save()
        quality = reading['quality']
        if quality == "B":
            quality = "Bon"
        elif quality == "M":
            quality = "Moyen"  
        else:
            quality = "Mauvais"
        MDSnackbar(
            MDSnackbarText(text=f"{reading['ppm']} ppm : {quality}"),
            y=dp(84),
            pos_hint={"center_x": 0.5},
            size_hint_x=0.9,
            duration=1,
        ).open()
        print(reading)
        self.refresh(0)

    def on_leave(self):
        """Stoppe l'enregistrement si on quitte l'écran."""
        if self._record_event:
            self._record_event.cancel()
            self._record_event = None
            self.fab.icon = "leaf"
            self.fab.md_bg_color = (0.400, 0.749, 1.0, 1)

    def close(self):
        self.reader.close()