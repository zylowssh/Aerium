
import uuid
#* KivyMD 
from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.appbar import MDTopAppBar, MDTopAppBarTitle
from kivymd.uix.button import MDFabButton
from kivymd.uix.label import MDLabel
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView

#* fichier projet
from alarmcard import AlarmCard
from select_days import DaysDialog
from datamanager import DataManager
from alarmprocess import StartAlarmProcess

class MainApp(MDApp):

    def build(self):
        self.theme_cls.theme_style = "Dark"
        self.theme_cls.primary_palette = "Blue"

        self.dataManager = DataManager(self.user_data_dir)
        self.total_alarms = {}
        screen = MDScreen()

        #* topBar
        topbar = MDTopAppBar(
            MDTopAppBarTitle(text="Aerium", halign="center"),
            type="large",
            pos_hint={"top": 1},
        )
        screen.add_widget(topbar)
        #* layout principal
        self.main_layout = MDBoxLayout(
            orientation="vertical",
            padding=("20dp", "160dp", "20dp", "22dp"),
            spacing="20dp",
        )
        #* label par defaut quand il n'y a pas d'alarme
        self.label = MDLabel(
            text="Ajoutez une alarme !",
            halign="center",
            font_style="Headline",
        )
        self.main_layout.add_widget(self.label)
        #* scrollview pour les alarmes
        scroll = MDScrollView(size_hint=(1, 1))

        self.alarms_layout = MDBoxLayout(
            orientation="vertical",
            spacing="15dp",
            size_hint_y=None,
        )
        self.alarms_layout.bind(
            minimum_height=self.alarms_layout.setter("height")
        )

        scroll.add_widget(self.alarms_layout)
        self.main_layout.add_widget(scroll)
        screen.add_widget(self.main_layout)
        
        #* FAB
        fab = MDFabButton(
            icon="plus",
            pos_hint={"right": 0.95, "y": 0.04},
            on_release=self.alarm_process,
        )
        screen.add_widget(fab)

        return screen
    
    #* Des le lancement de l'application, charge toute les alarmes sauvegardees
    def on_start(self):
        self.total_alarms = self.dataManager.read()
        self.alarm_from_data()
        
    #* ajoute les alarmes enregistrees en json a l'interfaces 
    def alarm_from_data(self):
        for alarm_id, data in self.total_alarms.items():
            hour_min = data["hour_min"]
            days_list = data["selected_days"]
            active = data["active"]
            selected_days = DataManager.format_days(days_list)
            self.add_alarm(hour_min, selected_days, alarm_id, data, active)
            
    #* lance le time picker
    def alarm_process(self, *args):
        self.alarmProcess = StartAlarmProcess()
        self.alarmProcess.open()
                
    #* gere l'ouverture de la popup selection des jours  
    def show_days_dialog(self, time):
        dialog = DaysDialog()
        #* fonction intermediaire pour passer le temps selectionne sinon kivy pleure
        dialog.bind(
            on_dismiss=lambda dialog: self.on_dialog_dismiss(dialog, time)
        )
        dialog.open()  

    #* gere la fermeture de la popup selection des jours
    def on_dialog_dismiss(self, dialog, time):
        if dialog.state is False:
            alarm_data = {
                "hour_min": time,
                "selected_days": dialog.selected_days,
                "active": True
            }

            all_data = self.dataManager.read()
            #* genere un id unique pour chaque alarme
            alarm_id = str(uuid.uuid4())
            all_data[alarm_id] = alarm_data

            self.dataManager.write(all_data)
            self.total_alarms = all_data
            
            #* formate les jours selectionnes pour l'affichage "Lun, Mar, Mer"
            selected_days = DataManager.format_days(dialog.selected_days)

            self.add_alarm(time, selected_days, alarm_id, alarm_data, alarm_data["active"])
            
    #* ajoute une alarme a l'interface
    def add_alarm(self, time, selected_days, alarm_id, alarm_data, active):
        #* Supprime le texte si c'est la premiere alarme
        if self.label.parent:
            self.label.parent.remove_widget(self.label)

        card = AlarmCard(time, selected_days, alarm_id, alarm_data, active)
        self.alarms_layout.add_widget(card)     

if __name__ == "__main__":
    MainApp().run()
