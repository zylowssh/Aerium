import json 
import os


class DataManager:
    def __init__(self, dirbase, filename="reveil.json"):
        self.path = os.path.join(dirbase, filename)
        
    def look_state(self):
        return os.path.exists(self.path)   
    
    def write(self,data):
        try:    
            with open(self.path,'w') as f:
                json.dump(data,f, indent=4)
        except Exception as e:
            print(f"Bug ecriture json sur ce chemin {self.path} Erreur : {e}")
            return {}
        
    def read(self):
        if not self.look_state():
            return {}
        try:
            with open(self.path,'r') as f:
                data =  json.load(f)
        except Exception as e:
            print(f"Bug lecture json sur ce chemin {self.path} Erreur : {e}")
            return {}
        return data
    
    def change(self,id_alarm,new_data):
        all_data = self.read()
        all_data[id_alarm] = new_data
        self.write(all_data)
        
    def get_data(self,id_alarm):
        all_data = self.read()
        return id_alarm,all_data[id_alarm]
    
    def delete(self,id_alarm):
        all_data = self.read()
        if id_alarm in all_data:
            del all_data[id_alarm]
            self.write(all_data)
            
    @staticmethod
    def format_days(days_list):
        return (
            ", ".join(day[:3] for day in days_list)
            if days_list else "Tous les jours"
        )