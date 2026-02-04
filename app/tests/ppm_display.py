"""
Aerium Kivy PPM Display - Simple Working Version
================================================
Minimal Kivy app that displays PPM from selected sensor.
"""

from kivy.clock import Clock
from kivy.properties import StringProperty, NumericProperty
from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.card import MDCard
from kivymd.uix.label import MDLabel
from kivymd.uix.button import MDButton, MDButtonText
from kivymd.uix.menu import MDDropdownMenu
import socketio
import threading
from datetime import datetime
import requests

# ============================================================================
# CONFIGURATION
# ============================================================================

WEBSOCKET_URL = "http://localhost:5000"

# Test credentials (for testing only - in production use proper auth)
TEST_EMAIL = "demo@aerium.app"
TEST_PASSWORD = "demo123"

# ============================================================================
# WEBSOCKET CLIENT
# ============================================================================

class PPMWebSocketManager:
    """Manages WebSocket connection for real-time PPM data"""
    
    def __init__(self, server_url=WEBSOCKET_URL, on_data_callback=None):
        self.server_url = server_url
        self.on_data_callback = on_data_callback
        self.sio = None
        self.connected = False
        self.current_sensor_id = None
        self.setup_websocket()
    
    def setup_websocket(self):
        """Initialize WebSocket connection"""
        print(f"🔌 Initializing WebSocket at {self.server_url}")
        
        self.sio = socketio.Client(
            reconnection=True,
            reconnection_delay=1,
            reconnection_delay_max=5,
            logger=False,
            engineio_logger=False
        )
        
        # Register event handlers
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('connect_error', self.on_connect_error)
        self.sio.on('sensor_reading', self.on_sensor_reading)
        
        # Connect in background thread
        threading.Thread(target=self.connect_to_server, daemon=True).start()
    
    def connect_to_server(self):
        """Connect to WebSocket server"""
        try:
            print(f"📡 Attempting connection...")
            if self.sio:
                self.sio.connect(self.server_url)
        except Exception as e:
            print(f"❌ Connection error: {e}")
    
    def on_connect(self):
        """Called when connected"""
        print("✅ Connected to WebSocket!")
        self.connected = True
        if self.on_data_callback:
            self.on_data_callback({'status': 'connected'})
    
    def on_disconnect(self):
        """Called when disconnected"""
        print("⚠️ Disconnected from WebSocket")
        self.connected = False
        if self.on_data_callback:
            self.on_data_callback({'status': 'disconnected'})
    
    def on_connect_error(self, error):
        """Called on connection error"""
        print(f"❌ Connection error: {error}")
        if self.on_data_callback:
            self.on_data_callback({'status': 'error'})
    
    def on_sensor_reading(self, data):
        """Called when sensor reading received"""
        print(f"📊 Received data: {data}")
        if self.on_data_callback:
            self.on_data_callback({
                'status': 'data',
                'sensor_id': data.get('sensor_id'),
                'co2': data.get('co2', 0),
                'temperature': data.get('temperature', 0),
                'humidity': data.get('humidity', 0),
            })
    
    def subscribe_to_sensor(self, sensor_id):
        """Subscribe to specific sensor updates"""
        if self.sio and self.connected:
            self.current_sensor_id = sensor_id
            try:
                self.sio.emit('subscribe_sensor', {'sensor_id': sensor_id})
                print(f"📌 Subscribed to sensor {sensor_id}")
            except Exception as e:
                print(f"Error subscribing to sensor: {e}")

# ============================================================================
# MAIN SCREEN
# ============================================================================

class PPMDisplayScreen(MDScreen):
    """Main PPM display screen"""
    
    status_text = StringProperty("Connecting...")
    current_ppm = NumericProperty(0)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.ws_manager = None
        self.access_token = None
        self.sensors = []
        self.selected_sensor = None
        self.polling_event = None
        self.polling_thread = None
        self.rate_limit_backoff = 0  # Backoff counter for rate limiting
        self.build_ui()
        self.authenticate()
        self.setup_websocket()
    
    def build_ui(self):
        """Build the user interface"""
        main_layout = MDBoxLayout(
            orientation="vertical",
            padding="20dp",
            spacing="20dp"
        )
        
        # Status Card
        status_card = MDCard(
            orientation="vertical",
            padding="15dp",
            size_hint_y=None,
            height="80dp"
        )
        
        self.status_label = MDLabel(
            text="Connecting...",
            halign="center",
            font_size="18sp"
        )
        status_card.add_widget(self.status_label)
        main_layout.add_widget(status_card)
        
        # Sensor Selection
        sensor_card = MDCard(
            orientation="vertical",
            padding="15dp",
            size_hint_y=None,
            height="80dp"
        )
        
        sensor_layout = MDBoxLayout(orientation="horizontal", spacing="10dp")
        
        sensor_label = MDLabel(
            text="Sensor:",
            size_hint_x=0.3,
            font_size="16sp"
        )
        
        self.sensor_button = MDButton(
            MDButtonText(text="Select Sensor"),
            style="outlined",
            size_hint_x=0.7
        )
        self.sensor_button.bind(on_release=self.show_sensor_menu)
        
        sensor_layout.add_widget(sensor_label)
        sensor_layout.add_widget(self.sensor_button)
        sensor_card.add_widget(sensor_layout)
        main_layout.add_widget(sensor_card)
        
        # PPM Display
        ppm_card = MDCard(
            orientation="vertical",
            padding="30dp",
            spacing="10dp",
            size_hint_y=None,
            height="220dp"
        )
        
        ppm_label = MDLabel(
            text="CO2 Level",
            halign="center",
            font_size="16sp",
            size_hint_y=0.3
        )
        
        self.ppm_value_label = MDLabel(
            text="-- ppm",
            halign="center",
            font_size="72sp",
            size_hint_y=0.7
        )
        
        ppm_card.add_widget(ppm_label)
        ppm_card.add_widget(self.ppm_value_label)
        main_layout.add_widget(ppm_card)
        
        # Environment Data
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
        self.temp_label = MDLabel(text="-- °C", halign="center", font_size="16sp")
        temp_box.add_widget(self.temp_label)
        env_layout.add_widget(temp_box)
        
        # Humidity
        humid_box = MDBoxLayout(orientation="vertical", spacing="5dp")
        humid_box.add_widget(MDLabel(text="Humidity", halign="center", font_size="12sp"))
        self.humid_label = MDLabel(text="-- %", halign="center", font_size="16sp")
        humid_box.add_widget(self.humid_label)
        env_layout.add_widget(humid_box)
        
        # Quality
        quality_box = MDBoxLayout(orientation="vertical", spacing="5dp")
        quality_box.add_widget(MDLabel(text="Quality", halign="center", font_size="12sp"))
        self.quality_label = MDLabel(text="--", halign="center", font_size="16sp")
        quality_box.add_widget(self.quality_label)
        env_layout.add_widget(quality_box)
        
        env_card.add_widget(env_layout)
        main_layout.add_widget(env_card)
        
        # Timestamp
        self.timestamp_label = MDLabel(
            text="Last update: --",
            halign="center",
            font_size="12sp",
            size_hint_y=None,
            height="30dp"
        )
        main_layout.add_widget(self.timestamp_label)
        
        self.add_widget(main_layout)
    
    def setup_websocket(self):
        """Setup WebSocket connection"""
        self.ws_manager = PPMWebSocketManager(
            server_url=WEBSOCKET_URL,
            on_data_callback=self.on_websocket_data
        )
    
    def authenticate(self):
        """Authenticate with backend and get JWT token"""
        print("Authenticating...")
        try:
            response = requests.post(
                f"{WEBSOCKET_URL}/api/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access_token')
                print("Authentication successful!")
                # Fetch sensors after successful authentication
                self.fetch_sensors()
            else:
                print(f"Authentication failed: {response.text}")
        except Exception as e:
            print(f"Authentication error: {e}")
    
    def fetch_sensors(self):
        """Fetch sensors for the authenticated user"""
        if not self.access_token:
            print("Not authenticated, cannot fetch sensors")
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            response = requests.get(
                f"{WEBSOCKET_URL}/api/sensors",
                headers=headers,
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                self.sensors = [
                    {'id': sensor['id'], 'name': sensor['name']}
                    for sensor in data.get('sensors', [])
                ]
                print(f"Fetched {len(self.sensors)} sensors")
                for sensor in self.sensors:
                    print(f"   - {sensor['name']} (ID: {sensor['id']})")
            else:
                print(f"Error fetching sensors: {response.status_code}")
        except Exception as e:
            print(f"Error fetching sensors: {e}")
    
    def on_websocket_data(self, data):
        """Handle WebSocket data updates"""
        status = data.get('status')
        
        if status == 'connected':
            self.status_text = "Connected"
            Clock.schedule_once(lambda dt: self._update_status())
        elif status == 'disconnected':
            self.status_text = "Disconnected"
            Clock.schedule_once(lambda dt: self._update_status())
        elif status == 'error':
            self.status_text = "Error"
            Clock.schedule_once(lambda dt: self._update_status())
        elif status == 'data' and self.selected_sensor:
            if data.get('sensor_id') == self.selected_sensor['id']:
                Clock.schedule_once(lambda dt: self._update_display(data))
    
    def _update_status(self):
        """Update status label"""
        self.status_label.text = self.status_text
    
    def _update_display(self, data):
        """Update display with sensor data"""
        co2 = data.get('co2', 0)
        temp = data.get('temperature', 0)
        humid = data.get('humidity', 0)
        
        self.ppm_value_label.text = f"{int(co2)} ppm"
        self.temp_label.text = f"{temp:.1f}°C"
        self.humid_label.text = f"{humid:.1f}%"
        
        # Quality
        if co2 < 800:
            quality = "Good"
        elif co2 < 1200:
            quality = "Fair"
        else:
            quality = "Poor"
        
        self.quality_label.text = quality
        self.timestamp_label.text = f"Last: {datetime.now().strftime('%H:%M:%S')}"
    
    def show_sensor_menu(self, *args):
        """Show sensor selection menu"""
        menu_items = [
            {
                "text": sensor['name'],
                "on_release": lambda s=sensor: self.select_sensor(s),
            }
            for sensor in self.sensors
        ]
        
        menu = MDDropdownMenu(
            caller=self.sensor_button,
            items=menu_items,
        )
        menu.open()
    
    def select_sensor(self, sensor):
        """Select a sensor"""
        self.selected_sensor = sensor
        self.sensor_button.text = sensor['name']
        print(f"Selected: {sensor['name']} (ID: {sensor['id']})")
        # Cancel previous polling
        if self.polling_event:
            self.polling_event.cancel()
        
        if self.ws_manager and self.ws_manager.connected:
            self.ws_manager.subscribe_to_sensor(sensor['id'])
        
        # Reset rate limit backoff
        self.rate_limit_backoff = 0
        
        # Start polling for sensor data (every 5 seconds instead of 2)
        self.poll_sensor_data()
        self.polling_event = Clock.schedule_interval(lambda dt: self.poll_sensor_data(), 5.0)
        
        # Reset display
        self.ppm_value_label.text = "-- ppm"
        self.quality_label.text = "--"
        self.temp_label.text = "-- °C"
        self.humid_label.text = "-- %"
    
    def poll_sensor_data(self):
        """Poll sensor data from API"""
        if not self.selected_sensor:
            return
        
        threading.Thread(
            target=self._fetch_sensor_data,
            args=(self.selected_sensor['id'],),
            daemon=True
        ).start()
    
    def _fetch_sensor_data(self, sensor_id):
        """Fetch sensor data from API in background thread"""
        if not self.access_token:
            print("Not authenticated")
            return
        
        # Skip if we're in rate limit backoff
        if self.rate_limit_backoff > 0:
            self.rate_limit_backoff -= 1
            return
        
        try:
            # Get latest reading with JWT authentication
            headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            response = requests.get(
                f"{WEBSOCKET_URL}/api/readings/latest/{sensor_id}",
                headers=headers,
                timeout=2
            )
            if response.status_code == 200:
                data = response.json()
                reading = data.get('reading', {})
                Clock.schedule_once(lambda dt: self._update_display(reading))
                # Reset backoff on success
                self.rate_limit_backoff = 0
            elif response.status_code == 429:
                # Rate limited - back off for 30 seconds (6 polling cycles)
                print(f"⏱️ Rate limited, backing off for 30s...")
                self.rate_limit_backoff = 6
        except Exception as e:
            print(f"Error fetching sensor data: {e}")

# ============================================================================
# MAIN APP
# ============================================================================

class PPMDisplayApp(MDApp):
    """Main Kivy app"""
    
    def build(self):
        self.title = "Aerium PPM Monitor"
        self.theme_cls.theme_style = "Dark"
        self.theme_cls.primary_palette = "Blue"
        
        return PPMDisplayScreen()

if __name__ == '__main__':
    app = PPMDisplayApp()
    app.run()
