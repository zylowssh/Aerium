from kivymd.uix.pickers import MDTimePickerDialVertical
from kivymd.app import MDApp
class StartAlarmProcess(MDTimePickerDialVertical):
    def __init__(self,):
        super().__init__()
        self.bind(on_ok=self.on_ok, on_cancel=self.on_cancel)
        self.bind(on_dismiss=self.on_dismiss)
        
    def on_ok(self, *args):
        hour = self.hour
        minute = self.minute
        self.time = f"{hour.zfill(2)}:{minute.zfill(2)}"
        self.dismiss()
        
    def on_cancel(self, *args):
        self.time = None
        self.dismiss()
              
    def on_dismiss(self, *args):
        if self.time:
            #* ouvre la popup de selection des jours
            MDApp.get_running_app().show_days_dialog(self.time)
            self.time = None