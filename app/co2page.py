from co2_reader import Co2Reader
from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.card import MDCard
from kivymd.uix.label import MDLabel
from kivymd.uix.appbar import MDTopAppBar, MDTopAppBarTitle

class Co2App(MDApp):
    def build(self):
        self.theme_cls.theme_style = "Dark"
        self.theme_cls.primary_palette = "Blue"
        screen = MDScreen()
        co2Reader = Co2Reader()
        
        self.ppm = co2Reader.fake_read_co2()
        self.quality = co2Reader.get_air_quality(self.ppm)
        self.alert_ppm = co2Reader.alert_needed(self.ppm)
        self.temp = co2Reader.get_temp()
        self.humidity = co2Reader.get_humidity()
        self.timestamp = co2Reader.get_timestamp()
        
        topbar = MDTopAppBar(
            MDTopAppBarTitle(text="Aerium", halign="center"),
            type="large",
            pos_hint={"top": 1},
        )
        screen.add_widget(topbar)
        
        
        main_layout = MDBoxLayout(
            orientation="vertical",
            padding="20dp",
            spacing="20dp"
        )    
        # CO2 card
        ppm_card = MDCard(
            orientation="vertical",
            padding="30dp",
            spacing="10dp",
            size_hint_y=None,
            height="220dp"
        )
        
        ppm_label = MDLabel(
            text=f"CO2 Level \n {self.ppm} ppm",
            halign="center",
            font_size="24sp",
            
        )
        alert_label = MDLabel(
            text="Alerte !",
            halign="center",
            font_size="18sp",
            theme_text_color="Error"
        )
        
        ppm_card.add_widget(ppm_label)
        if self.alert_ppm:
            ppm_card.add_widget(alert_label)
        main_layout.add_widget(ppm_card)
        
        # temp humidité qualité card
        env_card = MDCard(
            orientation="vertical",
            padding="15dp",
            spacing="10dp",
            size_hint_y=None,
            height="100dp"
        )
        
        env_layout = MDBoxLayout(orientation="horizontal", spacing="10dp")
        
        # Temp
        temp_box = MDBoxLayout(orientation="vertical", spacing="5dp")
        temp_box.add_widget(MDLabel(text="Temp", halign="center", font_size="12sp"))
        self.temp_label = MDLabel(text=f"{self.temp} °C", halign="center", font_size="16sp")
        temp_box.add_widget(self.temp_label)
        env_layout.add_widget(temp_box)
        
        # Humidity
        humid_box = MDBoxLayout(orientation="vertical", spacing="5dp")
        humid_box.add_widget(MDLabel(text="Humidity", halign="center", font_size="12sp"))
        self.humid_label = MDLabel(text=f"{self.humidity} %", halign="center", font_size="16sp")
        humid_box.add_widget(self.humid_label)
        env_layout.add_widget(humid_box)
        
        # Quality
        quality_box = MDBoxLayout(orientation="vertical", spacing="5dp")
        quality_box.add_widget(MDLabel(text="Quality", halign="center", font_size="12sp"))
        self.quality_label = MDLabel(text=self.quality, halign="center", font_size="16sp")
        quality_box.add_widget(self.quality_label)
        env_layout.add_widget(quality_box)
        
        env_card.add_widget(env_layout)
        main_layout.add_widget(env_card)
        
        self.timestamp_label = MDLabel(
            text=f"Last update: {self.timestamp}",
            halign="center",
            font_size="12sp",
            size_hint_y=None,
            height="30dp"
        )
        main_layout.add_widget(self.timestamp_label)
        screen.add_widget(main_layout)
        return screen
    
if __name__ == "__main__":
    Co2App().run()