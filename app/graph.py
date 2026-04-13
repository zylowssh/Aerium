from kivy.uix.widget import Widget
from kivy.graphics import (
    Line, Color, Rectangle, Ellipse
)
from topx import to_px
from text import Text



class CO2Graph(Widget):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.data = []
        self.mode = "flux"
        self.bind(size=self.draw, pos=self.draw)


    def update_data(self, data, mode="flux"):
        self.data = data
        self.mode = mode
        self.draw()

    def draw(self, *args):
        self.canvas.clear()

        if not self.data:
            return
        
        #dimension
        w, h = self.width, self.height
        px, py = self.x, self.y

        margin_left = 75
        margin_right = 70   
        margin_top = 30   
        margin_bottom = 60   

        graph_w = w - margin_left - margin_right
        graph_h = h - margin_top - margin_bottom

        x0 = px + margin_left    
        y0 = py + margin_bottom  

        #donnée 
        co2s,temps,hums,labels_x = self.value_mode()

        n = len(co2s)
        if n == 0:
            return

        #* Plage de valeur
        co2_min = max(0, min(co2s)  - 100)
        co2_max = max(co2s)  + 100
        temp_min = max(0, min(temps) - 5)
        temp_max = max(temps) + 5
        hum_min = max(0, min(hums)  - 10)
        hum_max = min(100, max(hums)  + 10)

        with self.canvas:

            #* fond sobmre
            Color(0.082, 0.094, 0.149, 1)
            Rectangle(pos=(px, py), size=(w, h))

            #* zones air 
            
            # danger  > 1500 ppm
            self.draw_zone(x0, y0, graph_w, graph_h,co2_min, co2_max,1500, co2_max,(0.953, 0.545, 0.659, 0.08))
            
            # moyen   1000-1500 ppm
            self.draw_zone(x0, y0, graph_w, graph_h,
                           co2_min, co2_max,
                           1000, 1500,
                           (0.980, 0.702, 0.529, 0.08))  
            
            # bon     < 1000 ppm 
            self.draw_zone(x0, y0, graph_w, graph_h,
                           co2_min, co2_max,
                           co2_min, 1000,
                           (0.651, 0.890, 0.631, 0.05))   
            
            #* grille  et labels axe y gauche 
            nb_lignes = 5
            for i in range(nb_lignes + 1):
                ratio = i / nb_lignes
                gy = y0 + ratio * graph_h
                val = int(co2_min + ratio * (co2_max - co2_min))

                Color(0.2, 0.22, 0.32, 0.6)
                Line(points=[x0, gy, x0 + graph_w, gy], width=0.8)

                Text(str(val), font_size=10).draw(
                    self.canvas,
                    x=px + margin_left - 35,
                    y=gy
                )

            #* Titre axe Y gauche co2
            Text("CO2 (ppm)", font_size=11, bold=True,
                 color=(0.400, 0.749, 1.0, 1), angle=90).draw(
                self.canvas,
                x=px + 12,
                y=py + h / 2
            )

            #* labels axe Y droit 
            for i in range(nb_lignes + 1):
                ratio = i / nb_lignes
                val_h = int(hum_min + ratio * (hum_max - hum_min))
                gy = y0 + ratio * graph_h

                Text(f"{val_h}%", font_size=10,
                     color=(0.980, 0.855, 0.369, 0.8)).draw(
                    self.canvas,
                    x=px + w - margin_right + 25,
                    y=gy
                )

            Text("Humidite (%)", font_size=11, bold=True,
                 color=(0.980, 0.855, 0.369, 1), angle=90).draw(
                self.canvas,
                x=px + w - 12,
                y=py + h / 2
            )

            #* Labels axe X 
            step = max(1, n // 8)
            # affiche au maximum 8 labels pour éviter la surcharge visuelle

            for i, t in enumerate(labels_x):
                if i % step == 0:
                    Text(t, font_size=10).draw(
                        self.canvas,
                        x=to_px(i, 0, n - 1, x0, graph_w),
                        y=y0 - 18
                    )

            #* Titre axe X
            titre_x = "Heure" if self.mode == "flux" else "Date"
            Text(titre_x, font_size=11, bold=True,
                 color=(0.400, 0.749, 1.0, 1)).draw(
                self.canvas,
                x=x0 + graph_w / 2,
                y=py + 8
            )

            # COUCHE 7 — Légende
            legend_items = [
                ("CO2",             (0.400, 0.749, 1.0, 1)),
                ("Temperature (C)", (0.400, 0.898, 0.647, 1)),
                ("Humidite (%)",    (0.980, 0.855, 0.369, 1)),
            ]
            lx = x0 + graph_w / 2 - 160
            ly = py + h - 18

            for label_t, col in legend_items:
                Color(*col)
                Ellipse(pos=(lx - 5, ly - 4), size=(8, 8))
                # petit cercle coloré avant chaque label

                Text(label_t, font_size=10, color=col).draw(
                    self.canvas,
                    x=lx + 35,
                    y=ly
                )
                lx += 130

            #* Courbe CO2 bleue
            self.draw_curve(co2s, co2_min, co2_max, x0, y0, graph_w, graph_h, (0.400, 0.749, 1.0, 1))
            # Points sur chaque mesure 
            self.draw_points(co2s, co2_min, co2_max, x0, y0, graph_w, graph_h, color=(0.400, 0.749, 1.0, 1), ring=True, size=[8,8,4,4])
            
            #* Courbe température verte
            self.draw_curve(temps, temp_min, temp_max, x0, y0, graph_w, graph_h, (0.400, 0.898, 0.647, 1))
            self.draw_points(temps, temp_min, temp_max, x0, y0, graph_w, graph_h,color=(0.400, 0.898, 0.647, 1), size=[6,6,4,4])
            
            #* Courbe humidité jaune
            self.draw_curve(hums, hum_min, hum_max, x0, y0, graph_w, graph_h, (0.980, 0.855, 0.369, 1))
            self.draw_points(hums, hum_min, hum_max, x0, y0, graph_w, graph_h, color=(0.980, 0.855, 0.369, 1), size=[6,6,4,4])
            
            
            #* valeur du dernier point de co2
            if co2s:
                Text(f"{co2s[-1]} ppm", font_size=12, bold=True,
                     color=(0.400, 0.749, 1.0, 1)).draw(
                    self.canvas,
                    x=to_px(n - 1, 0, n - 1, x0, graph_w) - 20,
                    y=to_px(co2s[-1], co2_min, co2_max, y0, graph_h) + 14
                )
                     
    def value_mode(self):
        if self.mode == "flux":
            co2s     = [d["ppm"]         for d in self.data]
            temps    = [d["temperature"] for d in self.data]
            hums     = [d["humidity"]    for d in self.data]
            labels_x = [d["timestamp"][11:16] for d in self.data] # Pour hhmm
        else:
            co2s     = [d["avg_co2"]         for d in self.data]
            temps    = [d.get("avg_temp", 0) for d in self.data]
            hums     = [d.get("avg_hum",  0) for d in self.data]
            labels_x = [d["date"][-5:]       for d in self.data]
        return co2s, temps, hums, labels_x
    
    def draw_curve(self,l, co2_min, co2_max, x0, y0, graph_w, graph_h, color):
        Color(*color)
        n = len(l)
        pts = []
        for i, v in enumerate(l):
            pts += [to_px(i, 0, n - 1, x0, graph_w), to_px(v, co2_min, co2_max, y0, graph_h)]
        Line(points=pts, width=2.0)
        
        
    def draw_points(self, l, co2_min, co2_max, x0, y0, graph_w, graph_h,color,ring=False,size=[6,6,6,6]):
        n = len(l)
        for i, v in enumerate(l):
            cx, cy = to_px(i, 0, n - 1, x0, graph_w), to_px(v, co2_min, co2_max, y0, graph_h)
            Color(*color)
            Ellipse(pos=(cx - 4, cy - 4), size=(size[0], size[1]))
            if ring:
                # cercle extérieur bleu
                Color(0.082, 0.094, 0.149, 1)
                Ellipse(pos=(cx - 2, cy - 2), size=(size[2], size[3]))
                
                
    def draw_zone(self,x0, y0, graph_w, graph_h,y_min, y_max,value_min, value_max,color):
        
        # clamp pour éviter de dépasser la plage
        v_min = max(y_min, min(value_min, y_max))
        v_max = max(y_min, min(value_max, y_max))

        y1 = to_px(v_min, y_min, y_max, y0, graph_h)
        y2 = to_px(v_max, y_min, y_max, y0, graph_h)

        if y2 > y1: 
            Color(*color)
            Rectangle(
                pos=(x0, y1),
                size=(graph_w, y2 - y1)
            )