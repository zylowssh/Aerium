"""
CO2 Service - Fetches CO2 data from Aerium server
"""

import requests
import json


class CO2Service:
    def __init__(self, app):
        self.app = app
        self.server_url = "http://localhost:5000"
        self.last_reading = None
    
    def set_server_url(self, url):
        """Set the Aerium server URL"""
        self.server_url = url
    
    def get_current_co2(self):
        """Fetch current CO2 level from Aerium server"""
        try:
            response = requests.get(
                f"{self.server_url}/api/readings/latest",
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract CO2 level
                co2_level = data.get("co2", 0)
                
                # Determine status
                if co2_level < 800:
                    status = "Good"
                elif co2_level < 1200:
                    status = "Moderate"
                else:
                    status = "Poor"
                
                self.last_reading = {
                    "level": co2_level,
                    "status": status,
                    "timestamp": data.get("timestamp", "")
                }
                
                return self.last_reading
            
        except Exception as e:
            print(f"Error fetching CO2 data: {e}")
            # Return last known reading or default
            if self.last_reading:
                return self.last_reading
            return {"level": 0, "status": "Unknown", "timestamp": ""}
        
        return None
    
    def get_historical_data(self, hours=24):
        """Fetch historical CO2 data"""
        try:
            response = requests.get(
                f"{self.server_url}/api/readings/history",
                params={"hours": hours},
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
        
        except Exception as e:
            print(f"Error fetching historical data: {e}")
        
        return []
