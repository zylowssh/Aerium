from kivy.uix.widget import Widget
from kivy.graphics import Color,RoundedRectangle 

from kivy.metrics import dp

from text import Text
class StatCard(Widget):

    def __init__(self, title, value, unit,
                 badge=None, badge_color=None, accent_color=None, **kwargs):
        super().__init__(**kwargs)

        self.title        = title
        self.value        = str(value)
        self.unit         = unit
        self.badge        = badge
        self.badge_color  = badge_color  or (0.400, 0.898, 0.647, 1)
        self.accent_color = accent_color or (0.400, 0.749, 1.0,   1)

        self.bind(size=self.draw, pos=self.draw)

    def update(self, value, badge=None, badge_color=None):
        """Met à jour la valeur affichée et redessine."""
        self.value = str(value)
        if badge:
            self.badge = badge
        if badge_color:
            self.badge_color = badge_color
        self.draw()

    def draw(self, *args):
        self.canvas.clear()

        w, h   = self.width, self.height
        px, py = self.x, self.y
        r = dp(12)

        with self.canvas:

            Color(0.11, 0.13, 0.20, 1)
            RoundedRectangle(pos=(px, py), size=(w, h), radius=[r])

            # Bordure colorée en haut
            Color(*self.accent_color)
            RoundedRectangle(pos=(px, py + h - dp(3)), size=(w, dp(3)),
                             radius=[r, r, 0, 0])
            #coins arrondis seulement en haut

            Text(self.title, font_size=11,
                 color=(0.55, 0.60, 0.75, 1)).draw(
                self.canvas,
                x=px + w / 2,
                y=py + h - dp(22)
            )

            Text(self.value, font_size=28, bold=True,
                 color=(0.93, 0.94, 0.98, 1)).draw(
                self.canvas,
                x=px + w / 2,
                y=py + h / 2 + dp(8)
            )

            Text(self.unit, font_size=12,
                 color=(0.55, 0.60, 0.75, 1)).draw(
                self.canvas,
                x=px + w / 2,
                y=py + h / 2 - dp(14)
            )

            if self.badge:
                bw, bh = dp(70), dp(20)
                bx = px + w / 2 - bw / 2
                by = py + dp(10)

                # fond du badge 
                Color(*self.badge_color[:3], 0.2)
                RoundedRectangle(pos=(bx, by), size=(bw, bh), radius=[dp(10)])

                # texte du badge
                Text(self.badge, font_size=11, bold=True,
                     color=self.badge_color).draw(
                    self.canvas,
                    x=px + w / 2,
                    y=by + bh / 2
                )
