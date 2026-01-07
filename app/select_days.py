from kivy.uix.boxlayout import BoxLayout
from kivy.uix.togglebutton import ToggleButton
from kivy.uix.button import Button
from kivy.uix.popup import Popup
from kivy.utils import get_color_from_hex
from kivy.app import App

class DaysDialog(Popup):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.title = "Sélectionne les jours"
        self.size_hint = (0.8, 0.5)
        self.auto_dismiss = False
        self.state = True
        self.days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
        self.selected_days = []
        
        main_layout = BoxLayout(orientation="vertical", spacing=10, padding=10)
        self.days_layout = BoxLayout(orientation="horizontal", spacing=5, size_hint_y=None, height=50)
        main_layout.add_widget(self.days_layout)

        self.toggle_buttons = {}
        for day in self.days:
            btn = ToggleButton(
                text=day,
                size_hint_x=None,
                width=80,
                background_normal='',
                background_down='',
                background_color=get_color_from_hex('#0A0A0A'),
                color=(1,1,1,1)
            )
            btn.bind(state=self.update_button_color)
            self.days_layout.add_widget(btn)
            self.toggle_buttons[day] = btn

        btn_layout = BoxLayout(orientation="horizontal", spacing=10, size_hint_y=None, height=40)
        main_layout.add_widget(btn_layout)

        cancel_btn = Button(text="Annuler", background_normal='', background_color=get_color_from_hex("#A94B4B"))
        cancel_btn.bind(on_release=self.cancel)
        btn_layout.add_widget(cancel_btn)

        accept_btn = Button(text="Accepter", background_normal='', background_color=get_color_from_hex("#4876B6"))
        accept_btn.bind(on_release=self.ok)
        btn_layout.add_widget(accept_btn)

        self.content = main_layout

    def update_button_color(self, instance, value):
        if value == 'down':
            instance.background_color = get_color_from_hex("#2E48D8")
        else:
            instance.background_color = get_color_from_hex('#0A0A0A')

    def ok(self, *args):
        self.selected_days = [day for day, btn in self.toggle_buttons.items() if btn.state == "down"]
        self.state = False
        self.dismiss()
    
    def cancel(self, *args):
        self.dismiss()