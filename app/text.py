from kivy.graphics import Color, Rectangle, PushMatrix, PopMatrix, Rotate, Translate
from kivy.core.text import Label as CoreLabel


class Text:

    def __init__(self, text: str,font_size=12,color=(0.729, 0.761, 0.871, 1),bold=False,angle=0):
        self.text = text
        self.font_size = font_size
        self.color = color
        self.bold = bold
        self.angle = angle


    def _create_texture(self):
        label = CoreLabel(
            text=self.text,
            font_size=self.font_size,
            bold=self.bold
        )
        label.refresh()
        return label.texture, label.texture.size


    def draw(self, canvas, x, y):
        texture, (tw, th) = self._create_texture()

        with canvas:
            Color(*self.color)

            if self.angle != 0:
                PushMatrix()

                Translate(x, y)

                Rotate(angle=self.angle, axis=(0, 0, 1))

                Rectangle(
                    texture=texture,
                    pos=(-tw / 2, -th / 2),
                    size=(tw, th)
                )

                PopMatrix()
            else:
                Rectangle(
                    texture=texture,
                    pos=(x - tw / 2, y - th / 2),
                    size=(tw, th)
                )