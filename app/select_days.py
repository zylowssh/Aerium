from kivy.uix.boxlayout import BoxLayout
from kivy.uix.togglebutton import ToggleButton
from kivy.uix.button import Button
from kivy.uix.popup import Popup
from kivy.uix.gridlayout import GridLayout
from kivy.utils import get_color_from_hex
from kivy.metrics import dp

class DaysDialog(Popup):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.title = "Sélectionne les jours"
        self.size_hint = (0.8, 0.6)  
        self.auto_dismiss = False
        self.state = True
        self.days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
        self.selected_days = []
        
        main_layout = BoxLayout(orientation="vertical", spacing=dp(10), padding=dp(10))
        
        # Layout principal pour les jours avec orientation adaptable
        self.days_layout = GridLayout(
            cols=7,  # 7 colonnes pour 7 jour
            spacing=dp(5),
            size_hint=(1, None),
            height=dp(100)  # Hi
        )
        
        # Layout pour contenir le GridLayout et permettre le centrage
        days_container = BoxLayout(orientation="vertical", size_hint=(1, 1))
        days_container.add_widget(self.days_layout)
        main_layout.add_widget(days_container)

        self.toggle_buttons = {}
        for day in self.days:
            btn = ToggleButton(
                text=day,
                size_hint=(None, None),
                size=(dp(80), dp(40)),  # Taille de base
                background_normal='',
                background_down='',
                background_color=get_color_from_hex('#0A0A0A'),
                color=(1, 1, 1, 1),
                halign='center',
                valign='middle'
            )
            btn.bind(
                state=self.update_button_color,
                size=self.on_button_size  # Pour adapter le texte
            )
            self.days_layout.add_widget(btn)
            self.toggle_buttons[day] = btn

        # Layout pour les boutons de contrôle
        btn_layout = BoxLayout(
            orientation="horizontal", 
            spacing=dp(10), 
            size_hint_y=None, 
            height=dp(40),
            padding=(dp(20), 0)  # Padding horizontal
        )
        main_layout.add_widget(btn_layout)

        cancel_btn = Button(
            text="Annuler", 
            size_hint=(0.5, 1),
            background_normal='', 
            background_color=get_color_from_hex("#A94B4B")
        )
        cancel_btn.bind(on_release=self.cancel)
        btn_layout.add_widget(cancel_btn)

        accept_btn = Button(
            text="Accepter", 
            size_hint=(0.5, 1),
            background_normal='', 
            background_color=get_color_from_hex("#4876B6")
        )
        accept_btn.bind(on_release=self.ok)
        btn_layout.add_widget(accept_btn)

        self.content = main_layout
        
        # Bind pour adapter le layout quand la taille change
        self.bind(size=self.adjust_layout)
        self.bind(on_open=self.adjust_layout)

    def adjust_layout(self, *args):
        """Adapte la disposition en fonction de la taille disponible"""
        # Largeur disponible pour les boutons
        available_width = self.width * 0.9  # 90% de la largeur de la popup
        
        # Calcul du nombre de colonnes optimal
        btn_width = dp(80) + self.days_layout.spacing[0]
        max_cols = max(1, int(available_width // btn_width))
        
        # Pour 7 jours, on peut avoir différentes configurations
        if max_cols >= 7:
            self.days_layout.cols = 7
        elif max_cols >= 4:
            self.days_layout.cols = max_cols
        elif max_cols >= 2:
            self.days_layout.cols = 2
        else:
            self.days_layout.cols = 1
        
        # Ajuste la largeur des boutons pour remplir l'espace disponible
        for btn in self.toggle_buttons.values():
            if self.days_layout.cols > 1:
                # En mode grille, on garde une taille raisonnable
                btn.size_hint = (None, None)
                btn.width = min(dp(100), (available_width - 
                                         (self.days_layout.cols - 1) * self.days_layout.spacing[0]) 
                                         / self.days_layout.cols)
                btn.height = dp(40)
            else:
                # En mode une colonne, boutons pleine largeur
                btn.size_hint = (1, None)
                btn.height = dp(40)
        
        # Ajuste la hauteur du layout en fonction du nombre de lignes
        num_rows = (len(self.days) + self.days_layout.cols - 1) // self.days_layout.cols
        row_height = dp(45)  # Hauteur par ligne (bouton + spacing)
        self.days_layout.height = num_rows * row_height
        
        # Force le recalcul du texte
        self.adjust_button_text()

    def adjust_button_text(self):
        """Adapte la taille du texte en fonction de la largeur du bouton"""
        for btn in self.toggle_buttons.values():
            # Ajuste la police si le bouton est trop petit
            if btn.width < dp(70):
                btn.font_size = dp(10)
            elif btn.width < dp(90):
                btn.font_size = dp(12)
            else:
                btn.font_size = dp(14)

    def on_button_size(self, instance, value):
        """Callback quand la taille d'un bouton change"""
        self.adjust_button_text()

    def update_button_color(self, instance, value):
        if value == 'down':
            instance.background_color = get_color_from_hex("#2E48D8")
        else:
            instance.background_color = get_color_from_hex('#0A0A0A')

    def ok(self, *args):
        self.selected_days = [day for day, btn in self.toggle_buttons.items() 
                            if btn.state == "down"]
        self.state = False
        self.dismiss()
    
    def cancel(self, *args):
        self.dismiss()