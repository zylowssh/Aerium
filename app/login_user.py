import hashlib
from kivy.metrics import dp, sp
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.behaviors import ButtonBehavior
from kivy.graphics import (
    Color, Ellipse, Rectangle, Line, RoundedRectangle
)
from kivy.animation import Animation
from kivy.clock import Clock
from kivymd.uix.screen import MDScreen
from kivymd.uix.label import MDLabel
from kivymd.uix.textfield import MDTextField, MDTextFieldHintText
from kivymd.uix.snackbar import MDSnackbar, MDSnackbarText


def hash_password(p: str) -> str:
    return hashlib.sha256(p.encode()).hexdigest()


BG      = (0.071, 0.082, 0.133, 1)
BLUE    = (0.318, 0.690, 0.961, 1)
WHITE   = (1.000, 1.000, 1.000, 1)
WHITE70 = (1.000, 1.000, 1.000, 0.70)
WHITE30 = (1.000, 1.000, 1.000, 0.30)
WHITE10 = (1.000, 1.000, 1.000, 0.08)
GREEN   = (0.400, 0.898, 0.647, 1)
RED     = (0.953, 0.545, 0.659, 1)
DARK    = (0.071, 0.082, 0.133, 1)



class Background(FloatLayout):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.bind(size=self._draw, pos=self._draw)

    def _draw(self, *a):
        self.canvas.before.clear()
        w, h = self.size
        cx = self.x + w / 2
        cy = self.y + h * 0.78

        with self.canvas.before:
            Color(*BG)
            Rectangle(pos=self.pos, size=self.size)

            for r, col in [
                (dp(200), (0.318, 0.690, 0.961, 0.06)),
                (dp(155), (0.318, 0.690, 0.961, 0.09)),
                (dp(110), (0.318, 0.690, 0.961, 0.13)),
                (dp(72),  (0.318, 0.690, 0.961, 0.20)),
                (dp(42),  (0.318, 0.690, 0.961, 0.38)),
            ]:
                Color(*col)
                Ellipse(pos=(cx - r, cy - r), size=(r * 2, r * 2))

            Color(0.96, 0.97, 1.0, 1)
            ar = dp(38)
            Ellipse(pos=(cx - ar, cy - ar), size=(ar * 2, ar * 2))

            Color(*BLUE)
            Line(circle=(cx, cy, ar + dp(6)),  width=1.2)
            Line(circle=(cx, cy, ar + dp(12)), width=0.5)



class CleanField(BoxLayout):
    def __init__(self, hint,password=False, **kwargs):
        super().__init__(
            orientation="horizontal",
            size_hint_y=None,
            height=dp(54),
            spacing=0,
            **kwargs
        )
        self.bind(size=self._draw_bg, pos=self._draw_bg)

        # Champ texte transparent
        self.field = MDTextField(
            MDTextFieldHintText(text=hint),
            mode="filled",
            password=password,
            size_hint=(1, None),
            height=dp(54),
            theme_bg_color="Custom",
            fill_color_normal=(0, 0, 0, 0),
            fill_color_focus=(0, 0, 0, 0),
            theme_line_color="Custom",
            line_color_normal=(0, 0, 0, 0),
            line_color_focus=(0, 0, 0, 0),
        )
        self.field.hint_text_color_normal = (*WHITE30[:3], 0.55)
        self.field.hint_text_color_focus = (*BLUE[:3], 0.85)
        self.field.text_color_normal = WHITE
        self.field.text_color_focus = WHITE


        self.add_widget(self.field)

    def _draw_bg(self, *a):
        self.canvas.before.clear()
        with self.canvas.before:
            Color(*WHITE10)
            RoundedRectangle(pos=self.pos, size=self.size, radius=[dp(14)])
            Color(*WHITE30)
            Line(rounded_rectangle=(*self.pos, *self.size, dp(14)), width=0.6)

    @property
    def text(self):
        return self.field.text


# ─────────────────────────────────────────────────────────────
#  Bouton principal — fond blanc plein dessiné sur canvas
# ─────────────────────────────────────────────────────────────
class SolidButton(ButtonBehavior, BoxLayout):
    def __init__(self, text, **kwargs):
        super().__init__(
            orientation="vertical",
            size_hint_y=None,
            height=dp(54),
            **kwargs
        )
        self.bind(size=self._draw, pos=self._draw)

        self.lbl = MDLabel(
            text=text,
            halign="center",
            valign="center",
            bold=True,
            font_size=sp(14),
            theme_text_color="Custom",
            text_color=DARK,
        )
        self.add_widget(self.lbl)

    def _draw(self, *a):
        self.canvas.before.clear()
        with self.canvas.before:
            Color(*WHITE)
            RoundedRectangle(pos=self.pos, size=self.size, radius=[dp(14)])

    def on_press(self):
        Animation(opacity=0.75, duration=0.08).start(self)

    def on_release(self):
        Animation(opacity=1.0, duration=0.12).start(self)

    @property
    def text(self):
        return self.lbl.text

    @text.setter
    def text(self, v):
        self.lbl.text = v



class OutlineButton(ButtonBehavior, BoxLayout):
    def __init__(self, text, **kwargs):
        super().__init__(
            orientation="vertical",
            size_hint_y=None,
            height=dp(40),
            **kwargs
        )
        self.lbl = MDLabel(
            text=text,
            halign="center",
            valign="center",
            font_size=sp(13),
            theme_text_color="Custom",
            text_color=(*BLUE[:3], 0.9),
        )
        self.add_widget(self.lbl)

    def on_press(self):
        Animation(opacity=0.6, duration=0.08).start(self.lbl)

    def on_release(self):
        Animation(opacity=1.0, duration=0.12).start(self.lbl)

    @property
    def text(self):
        return self.lbl.text

    @text.setter
    def text(self, v):
        self.lbl.text = v


class LoginScreen(MDScreen):

    def __init__(self, db, on_success, **kwargs):
        super().__init__(**kwargs)
        self.db = db
        self.on_success = on_success
        self._mode = "login"

        self.add_widget(Background(size_hint=(1, 1)))

        root = FloatLayout(size_hint=(1, 1))

        avatar_icon = MDLabel(
            text="\U000F0004",
            font_name="Icons",
            font_size=sp(40),
            halign="center",
            valign="center",
            size_hint=(None, None),
            size=(dp(80), dp(80)),
            pos_hint={"center_x": 0.5, "top": 0.97},
            theme_text_color="Custom",
            text_color=(0.25, 0.30, 0.45, 1),
        )
        root.add_widget(avatar_icon)

        app_title = MDLabel(
            text="Aerium",
            bold=True,
            font_style="Display",
            role="small",
            halign="center",
            size_hint=(1, None),
            height=dp(42),
            pos_hint={"center_x": 0.5, "top": 0.73},
            theme_text_color="Custom",
            text_color=WHITE,
        )
        root.add_widget(app_title)

        #* Formulaire
        self.form = BoxLayout(
            orientation="vertical",
            spacing=dp(16),
            padding=(dp(28), dp(0), dp(28), dp(0)),
            size_hint=(1, None),
            pos_hint={"center_x": 0.5, "top": 0.64},
        )
        self.form.bind(minimum_height=self.form.setter("height"))

        self.sub_lbl = MDLabel(
            text="Connectez-vous a votre espace",
            halign="center",
            font_size=sp(13),
            size_hint_y=None,
            height=dp(28),
            theme_text_color="Custom",
            text_color=WHITE70,
        )

        # Champs
        self.field_user  = CleanField("Identifiant")
        self.field_email = CleanField("Email")
        self.field_pass = CleanField("Mot de passe", password=True)
        self.field_pass2 = CleanField("Confirmer",    password=True)

        # email et confirm cachés par défaut (mode login)
        for field in [self.field_email, self.field_pass2]:
            field.opacity = 0
            field.disabled = True
            field.height = 0

        #* Bouton principal
        self.btn_main = SolidButton("SE CONNECTER")
        self.btn_main.bind(on_release=self.submit)

        #* Séparateur
        sep = MDLabel(
            text="- ou -",
            halign="center",
            font_size=sp(11),
            size_hint_y=None,
            height=dp(24),
            theme_text_color="Custom",
            text_color=(*WHITE30[:3], 0.40),
        )

        #* Bouton switch
        self.btn_switch = OutlineButton("Pas encore de compte ?  S'inscrire")
        self.btn_switch.bind(on_release=self.toggle_mode)

        for w in [
            self.sub_lbl,
            self.field_user, self.field_email,
            self.field_pass, self.field_pass2,
            self.btn_main, sep, self.btn_switch,
        ]:
            self.form.add_widget(w)

        root.add_widget(self.form)
        self.add_widget(root)

        #* Animation d'entrée
        self.form.opacity = 0
        Clock.schedule_once(
            lambda dt: Animation(opacity=1, duration=0.5).start(self.form), 0.15
        )

    def toggle_mode(self, *a):
        if self._mode == "login":
            self._mode = "register"
            self.sub_lbl.text = "Creez votre compte Aerium"
            self.btn_main.text = "CREER UN COMPTE"
            self.btn_switch.text = "J'ai deja un compte  →"
            self.field_email.disabled = False
            self.field_pass2.disabled = False
            Animation(opacity=1, height=dp(54), duration=0.25).start(self.field_email)
            Animation(opacity=1, height=dp(54), duration=0.25).start(self.field_pass2)
        else:
            self._mode  = "login"
            self.sub_lbl.text = "Connectez-vous a votre espace"
            self.btn_main.text = "SE CONNECTER"
            self.btn_switch.text = "Pas encore de compte ?  S'inscrire"
            for field in [self.field_email, self.field_pass2]:
                anim = Animation(opacity=0, height=0, duration=0.2)
                anim.bind(on_complete=lambda *a, f=field: setattr(f, "disabled", True))
                anim.start(field)

    def submit(self, *a):
        username = self.field_user.text.strip()
        password = self.field_pass.text
        if not username or not password:
            self._toast("Remplis tous les champs.", error=True)
            return
        if self._mode == "login":
            self._login(username, password)
        else:
            self._register(username, password)

    def _login(self, username, password):
        user = self.db.get_user(username)
        if user is None:
            self._toast("Identifiant introuvable.", error=True)
            return
        if user["password_hash"] != hash_password(password):
            self._toast("Mot de passe incorrect.", error=True)
            return
        self._toast(f"Bienvenue {username} !", error=False)
        Clock.schedule_once(lambda dt: self.on_success(user["id"]), 0.7)

    def _register(self, username, password):
        email = self.field_email.text.strip()
        if not email or "@" not in email:
            self._toast("Adresse email invalide.", error=True)
            return
        if password != self.field_pass2.text:
            self._toast("Les mots de passe ne correspondent pas.", error=True)
            return
        if len(password) < 6:
            self._toast("6 caracteres minimum.", error=True)
            return
        if self.db.get_user(username) is not None:
            self._toast("Cet identifiant est deja pris.", error=True)
            return
        uid = self.db.create_user(username, hash_password(password), email)
        self._toast(f"Compte cree ! Bienvenue {username}", error=False)
        Clock.schedule_once(lambda dt: self.on_success(uid), 0.8)

    def _toast(self, message, error=True):
        MDSnackbar(
            MDSnackbarText(
                text=message,
                theme_text_color="Custom",
                text_color=RED if error else GREEN,
            ),
            y=dp(32),
            pos_hint={"center_x": 0.5},
            size_hint_x=0.88,
            duration=2.5,
        ).open()