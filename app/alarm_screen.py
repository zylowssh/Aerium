import uuid
from kivy.uix.floatlayout import FloatLayout
from kivymd.uix.screen import MDScreen
from kivymd.uix.appbar import MDTopAppBar, MDTopAppBarTitle
from kivymd.uix.button import MDFabButton
from kivymd.uix.label import MDLabel
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView

from alarmcard import AlarmCard
from select_days import DaysDialog
from datamanager import DataManager
from alarmprocess import StartAlarmProcess


class AlarmScreen(MDScreen):

    def __init__(self, user_data_dir, **kwargs):
        super().__init__(**kwargs)
        self.dataManager = DataManager(user_data_dir)
        self.total_alarms = {}


        topbar = MDTopAppBar(
            MDTopAppBarTitle(text="Alarmes", halign="center"),
            type="small",
            pos_hint={"top": 1},
        )
        self.add_widget(topbar)

        main_layout = MDBoxLayout(
            orientation="vertical",
            padding=("20dp", "100dp", "20dp", "72dp"),
            spacing="20dp",
        )

        self.label = MDLabel(
            text="Ajoutez une alarme !",
            halign="center",
            font_style="Headline",
        )
        main_layout.add_widget(self.label)

        scroll = MDScrollView(size_hint=(1, 1))
        self.alarms_layout = MDBoxLayout(
            orientation="vertical",
            spacing="15dp",
            size_hint_y=None,
        )
        self.alarms_layout.bind(minimum_height=self.alarms_layout.setter("height"))
        scroll.add_widget(self.alarms_layout)
        main_layout.add_widget(scroll)

        root = FloatLayout(size_hint=(1, 1))
        root.add_widget(main_layout)

        fab = MDFabButton(
            icon="plus",
            pos_hint={"right": 0.95, "y": 0.08},
            on_release=self.alarm_process,
        )
        root.add_widget(fab)
        self.add_widget(root)

    def on_enter(self):
        self.total_alarms = self.dataManager.read()
        self.alarms_layout.clear_widgets()
        if self.label.parent is None:
            self.alarms_layout.add_widget(self.label)
        self.alarm_from_data()



    def alarm_from_data(self):
        for alarm_id, data in self.total_alarms.items():
            selected_days = DataManager.format_days(data["selected_days"])
            self.add_alarm(data["hour_min"], selected_days, alarm_id, data, data["active"])

    def alarm_process(self, *args):
        self.alarmProcess = StartAlarmProcess()
        self.alarmProcess.open()

    def show_days_dialog(self, time, thisalarm=None):
        dialog = DaysDialog()
        dialog.bind(on_dismiss=lambda d: self.on_dialog_dismiss(d, time, thisalarm))
        dialog.open()

    def on_dialog_dismiss(self, dialog, time, thisalarm=None):
        if dialog.state is False:
            alarm_data    = {"hour_min": time, "selected_days": dialog.selected_days, "active": True}
            selected_days = DataManager.format_days(dialog.selected_days)

            if thisalarm is not None:
                self.dataManager.change(thisalarm.alarm_id, alarm_data)
                self.total_alarms[thisalarm.alarm_id] = alarm_data
                self.alarms_layout.clear_widgets()
                self.on_enter()
                return

            alarm_id = str(uuid.uuid4())
            all_data = self.dataManager.read()
            all_data[alarm_id] = alarm_data
            self.dataManager.write(all_data)
            self.total_alarms = all_data
            self.add_alarm(time, selected_days, alarm_id, alarm_data, True)

    def add_alarm(self, time, selected_days, alarm_id, alarm_data, active):
        if self.label.parent:
            self.label.parent.remove_widget(self.label)
        card = AlarmCard(time, selected_days, alarm_id, alarm_data, active)
        self.alarms_layout.add_widget(card)