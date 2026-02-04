"""
Storage Service - Handles local data storage
"""

import json
import os


class StorageService:
    def __init__(self):
        self.data_dir = os.path.join(os.path.expanduser("~"), ".aerium_alarm")
        os.makedirs(self.data_dir, exist_ok=True)
    
    def save_data(self, key, data):
        """Save data to local storage"""
        file_path = os.path.join(self.data_dir, f"{key}.json")
        
        try:
            with open(file_path, "w") as f:
                json.dump(data, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving data: {e}")
            return False
    
    def load_data(self, key, default=None):
        """Load data from local storage"""
        file_path = os.path.join(self.data_dir, f"{key}.json")
        
        if not os.path.exists(file_path):
            return default
        
        try:
            with open(file_path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading data: {e}")
            return default
    
    def delete_data(self, key):
        """Delete data from local storage"""
        file_path = os.path.join(self.data_dir, f"{key}.json")
        
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                return True
            except Exception as e:
                print(f"Error deleting data: {e}")
        
        return False
