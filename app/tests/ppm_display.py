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
import threading
from datetime import datetime
import requests
import logging

# ============================================================================
# CONFIGURATION
# ============================================================================

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WEBSOCKET_URL = "http://localhost:5000"

# Test credentials (for testing only - in production use proper auth)
TEST_EMAIL = "demo@aerium.app"
TEST_PASSWORD = "demo123"

# ============================================================================
# WEBSOCKET CLIENT (FALLBACK VERSION)
# ============================================================================

class PPMWebSocketManager:
    """Manages WebSocket connection for real-time PPM data"""
    
    def __init__(self, server_url=WEBSOCKET_URL, on_data_callback=None):
        self.server_url = server_url
        self.on_data_callback = on_data_callback
        self.sio = None
        self.connected = False
        self.current_sensor_id = None
        
        # Try to import socketio, but handle if it's not available
        try:
            import socketio
            self.socketio_available = True
            self.setup_websocket()
        except ImportError:
            logger.warning("python-socketio not installed. WebSocket features disabled.")
            self.socketio_available = False
            if self.on_data_callback:
                self.on_data_callback({'status': 'error', 'message': 'SocketIO not installed'})
    
    def setup_websocket(self):
        """Initialize WebSocket connection"""
        if not self.socketio_available:
            return
            
        logger.info(f"Initializing WebSocket at {self.server_url}")
        
        import socketio
        
        try:
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
        except Exception as e:
            logger.error(f"Failed to initialize WebSocket: {e}")
            if self.on_data_callback:
                self.on_data_callback({'status': 'error', 'message': str(e)})
    
    def connect_to_server(self):
        """Connect to WebSocket server"""
        if not self.sio:
            return
            
        try:
            logger.info("Attempting WebSocket connection...")
            self.sio.connect(self.server_url, wait_timeout=5)
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            if self.on_data_callback:
                self.on_data_callback({'status': 'error', 'message': str(e)})
    
    def on_connect(self):
        """Called when connected"""
        logger.info("Connected to WebSocket!")
        self.connected = True
        if self.on_data_callback:
            self.on_data_callback({'status': 'connected'})
    
    def on_disconnect(self):
        """Called when disconnected"""
        logger.warning("Disconnected from WebSocket")
        self.connected = False
        if self.on_data_callback:
            self.on_data_callback({'status': 'disconnected'})
    
    def on_connect_error(self, error):
        """Called on connection error"""
        logger.error(f"WebSocket connection error: {error}")
        if self.on_data_callback:
            self.on_data_callback({'status': 'error', 'message': str(error)})
    
    def on_sensor_reading(self, data):
        """Called when sensor reading received"""
        logger.info(f"Received sensor data: {data}")
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
                logger.info(f"Subscribed to sensor {sensor_id}")
            except Exception as e:
                logger.error(f"Error subscribing to sensor: {e}")

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
        self.rate_limit_backoff = 0  # Backoff counter for rate limiting
        self.demo_mode = False
        self.demo_event = None
        self.build_ui()
        self.setup_websocket()
        Clock.schedule_once(self.delayed_authenticate, 0.5)
    
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
            text="Initializing...",
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
        
        # Add demo sensors by default
        self.sensors = [
            {'id': 'demo-1', 'name': 'Demo Sensor 1'},
            {'id': 'demo-2', 'name': 'Demo Sensor 2'},
            {'id': 'demo-3', 'name': 'Demo Sensor 3'}
        ]
        
        self.add_widget(main_layout)
    
    def delayed_authenticate(self, dt):
        """Delayed authentication to let UI load first"""
        threading.Thread(target=self.authenticate, daemon=True).start()
    
    def setup_websocket(self):
        """Setup WebSocket connection"""
        self.ws_manager = PPMWebSocketManager(
            server_url=WEBSOCKET_URL,
            on_data_callback=self.on_websocket_data
        )
    
    def authenticate(self):
        """Authenticate with backend and get JWT token"""
        logger.info("Authenticating...")
        try:
            response = requests.post(
                f"{WEBSOCKET_URL}/api/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access_token')
                logger.info("Authentication successful!")
                # Fetch sensors after successful authentication
                self.fetch_sensors()
            else:
                logger.warning(f"Authentication failed: {response.status_code}")
                Clock.schedule_once(lambda dt: self._update_status_display("Demo Mode (Auth Failed)"))
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            Clock.schedule_once(lambda dt: self._update_status_display("Demo Mode (Server Offline)"))
    
    def _update_status_display(self, text):
        """Update status display on main thread"""
        self.status_text = text
        self.status_label.text = text
    
    def enable_demo_mode(self):
        """Enable demo mode with simulated data"""
        if not self.demo_mode:
            self.demo_mode = True
            logger.info("Running in demo mode")
            
            # Cancel any existing demo events
            if self.demo_event:
                self.demo_event.cancel()
            
            # Schedule demo data updates
            self.demo_event = Clock.schedule_interval(self.update_demo_data, 2.0)
    
    def update_demo_data(self, dt):
        """Update with demo data for testing"""
        if not self.selected_sensor:
            return
            
        # Simulate realistic CO2 data (400-2000 ppm)
        import random
        import time
        
        # Generate slowly changing values for realism
        if not hasattr(self, 'last_co2'):
            self.last_co2 = 600
            self.last_temp = 22.0
            self.last_humid = 50.0
        
        # Small random changes
        self.last_co2 += random.randint(-20, 20)
        self.last_co2 = max(400, min(2000, self.last_co2))
        
        self.last_temp += random.uniform(-0.5, 0.5)
        self.last_temp = max(18.0, min(28.0, self.last_temp))
        
        self.last_humid += random.uniform(-2, 2)
        self.last_humid = max(30.0, min(70.0, self.last_humid))
        
        data = {
            'co2': self.last_co2,
            'temperature': self.last_temp,
            'humidity': self.last_humid,
            'sensor_id': self.selected_sensor['id']
        }
        
        self._update_display(data)
    
    def fetch_sensors(self):
        """Fetch sensors for the authenticated user"""
        if not self.access_token:
            logger.warning("Not authenticated, cannot fetch sensors")
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
                server_sensors = [
                    {'id': sensor['id'], 'name': sensor['name']}
                    for sensor in data.get('sensors', [])
                ]
                if server_sensors:
                    self.sensors = server_sensors
                    logger.info(f"Fetched {len(self.sensors)} sensors")
                    for sensor in self.sensors:
                        logger.info(f"   - {sensor['name']} (ID: {sensor['id']})")
                else:
                    logger.warning("No sensors found on server")
            else:
                logger.warning(f"Error fetching sensors: {response.status_code}")
        except Exception as e:
            logger.error(f"Error fetching sensors: {e}")
    
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
            error_msg = data.get('message', 'Connection Error')
            self.status_text = error_msg
            Clock.schedule_once(lambda dt: self._update_status())
            # If it's a socketio not installed error, enable demo mode
            if 'SocketIO' in error_msg:
                self.enable_demo_mode()
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
            self.quality_label.theme_text_color = "Custom"
            self.quality_label.text_color = (0, 1, 0, 1)  # Green
        elif co2 < 1200:
            quality = "Fair"
            self.quality_label.theme_text_color = "Custom"
            self.quality_label.text_color = (1, 1, 0, 1)  # Yellow
        else:
            quality = "Poor"
            self.quality_label.theme_text_color = "Custom"
            self.quality_label.text_color = (1, 0, 0, 1)  # Red
        
        self.quality_label.text = quality
        self.timestamp_label.text = f"Last: {datetime.now().strftime('%H:%M:%S')}"
    
    def show_sensor_menu(self, *args):
        """Show sensor selection menu"""
        if not self.sensors:
            menu_items = [{"text": "No sensors available", "on_release": lambda: None}]
        else:
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
        logger.info(f"Selected: {sensor['name']} (ID: {sensor['id']})")
        
        # Cancel any existing polling
        if self.polling_event:
            self.polling_event.cancel()
        
        # Cancel demo mode if active
        if self.demo_event:
            self.demo_event.cancel()
            self.demo_mode = False
        
        # If WebSocket is available, subscribe
        if self.ws_manager and hasattr(self.ws_manager, 'socketio_available') and self.ws_manager.socketio_available:
            if self.ws_manager.connected:
                self.ws_manager.subscribe_to_sensor(sensor['id'])
        
        # Reset rate limit backoff
        self.rate_limit_backoff = 0
        
        # Start polling for sensor data
        self.poll_sensor_data()
        self.polling_event = Clock.schedule_interval(lambda dt: self.poll_sensor_data(), 5.0)
        
        # Reset display
        self.ppm_value_label.text = "-- ppm"
        self.quality_label.text = "--"
        self.temp_label.text = "-- °C"
        self.humid_label.text = "-- %"
        
        # If we don't have WebSocket or server, enable demo mode
        if not hasattr(self.ws_manager, 'socketio_available') or not self.ws_manager.socketio_available:
            self.enable_demo_mode()
    
    def poll_sensor_data(self):
        """Poll sensor data from API"""
        if not self.selected_sensor:
            return
        
        # If in demo mode, don't poll
        if self.demo_mode:
            return
        
        threading.Thread(
            target=self._fetch_sensor_data,
            args=(self.selected_sensor['id'],),
            daemon=True
        ).start()
    
    def _fetch_sensor_data(self, sensor_id):
        """Fetch sensor data from API in background thread"""
        if not self.access_token:
            logger.warning("Not authenticated")
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
                logger.warning(f"Rate limited, backing off for 30s...")
                self.rate_limit_backoff = 6
        except Exception as e:
            logger.error(f"Error fetching sensor data: {e}")

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