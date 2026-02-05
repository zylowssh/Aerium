"""
CO₂ WebSocket Client for KivyMD
================================
Complete example of connecting to Aerium WebSocket server
and displaying real-time CO₂ data in a KivyMD app.

Usage:
    1. Install: pip install python-socketio websocket-client
    2. Update SERVER_URL with your server IP address
    3. Run: python co2_websocket_client.py
"""

from kivy.clock import Clock
from kivy.properties import StringProperty, NumericProperty, BooleanProperty, ListProperty
from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.label import MDLabel
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.card import MDCard
from kivymd.uix.button import MDButton, MDButtonText
import socketio
import threading
from datetime import datetime

# ============================================================================
# CONFIGURATION
# ============================================================================

SERVER_URL = "http://localhost:5000"  # Change to your server IP (e.g., "http://192.168.1.100:5000")

# ============================================================================
# MAIN SCREEN
# ============================================================================

class CO2MonitorScreen(MDScreen):
    """Main screen for CO₂ monitoring"""
    
    # Properties that auto-update UI when changed
    current_ppm = NumericProperty(0)
    quality_text = StringProperty("--")
    quality_color = ListProperty([0.4, 0.4, 0.4, 1])  # RGBA
    is_connected = BooleanProperty(False)
    analysis_running = BooleanProperty(False)
    last_update = StringProperty("--")
    
    # Settings
    good_threshold = NumericProperty(800)
    bad_threshold = NumericProperty(1200)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.sio = None
        self.build_ui()
        self.setup_websocket()
    
    def build_ui(self):
        """Build the user interface"""
        main_layout = MDBoxLayout(
            orientation="vertical",
            padding="20dp",
            spacing="20dp"
        )
        
        # ─────────────────────────────────────────────────────────────
        # Connection Status Card
        # ─────────────────────────────────────────────────────────────
        status_card = MDCard(
            orientation="vertical",
            padding="16dp",
            size_hint=(1, None),
            height="80dp",
            style="elevated"
        )
        
        self.status_label = MDLabel(
            text="🔌 Connecting to server...",
            halign="center",
            theme_text_color="Secondary",
            font_style="Label",
            role="large"
        )
        status_card.add_widget(self.status_label)
        main_layout.add_widget(status_card)
        
        # ─────────────────────────────────────────────────────────────
        # CO₂ Display Card
        # ─────────────────────────────────────────────────────────────
        co2_card = MDCard(
            orientation="vertical",
            padding="24dp",
            spacing="12dp",
            size_hint=(1, None),
            height="280dp",
            style="elevated"
        )
        
        # PPM Value
        self.ppm_label = MDLabel(
            text="-- ppm",
            halign="center",
            font_style="Display",
            role="large"
        )
        co2_card.add_widget(self.ppm_label)
        
        # Quality Text
        self.quality_label = MDLabel(
            text="--",
            halign="center",
            font_style="Headline",
            role="medium"
        )
        co2_card.add_widget(self.quality_label)
        
        # Last Update Time
        self.time_label = MDLabel(
            text="Last update: --",
            halign="center",
            theme_text_color="Secondary",
            font_style="Body",
            role="medium"
        )
        co2_card.add_widget(self.time_label)
        
        main_layout.add_widget(co2_card)
        
        # ─────────────────────────────────────────────────────────────
        # Control Buttons
        # ─────────────────────────────────────────────────────────────
        button_layout = MDBoxLayout(
            orientation="horizontal",
            spacing="12dp",
            size_hint=(1, None),
            height="56dp"
        )
        
        # Reconnect Button
        reconnect_btn = MDButton(
            style="filled",
            size_hint=(0.5, 1)
        )
        reconnect_btn.bind(on_release=self.manual_reconnect)
        reconnect_btn.add_widget(MDButtonText(text="🔄 Reconnect"))
        button_layout.add_widget(reconnect_btn)
        
        # Request Data Button
        request_btn = MDButton(
            style="outlined",
            size_hint=(0.5, 1)
        )
        request_btn.bind(on_release=self.request_data)
        request_btn.add_widget(MDButtonText(text="📊 Update"))
        button_layout.add_widget(request_btn)
        
        main_layout.add_widget(button_layout)
        
        # ─────────────────────────────────────────────────────────────
        # Info Card
        # ─────────────────────────────────────────────────────────────
        info_card = MDCard(
            orientation="vertical",
            padding="16dp",
            spacing="8dp",
            size_hint=(1, None),
            height="120dp",
            style="elevated"
        )
        
        self.threshold_label = MDLabel(
            text=f"Thresholds: Good < {self.good_threshold} < Medium < {self.bad_threshold} < Bad",
            halign="center",
            theme_text_color="Secondary",
            font_style="Label",
            role="medium"
        )
        info_card.add_widget(self.threshold_label)
        
        self.server_label = MDLabel(
            text=f"Server: {SERVER_URL}",
            halign="center",
            theme_text_color="Hint",
            font_style="Label",
            role="small"
        )
        info_card.add_widget(self.server_label)
        
        main_layout.add_widget(info_card)
        
        self.add_widget(main_layout)
    
    # ═══════════════════════════════════════════════════════════════════════
    # WEBSOCKET SETUP & HANDLERS
    # ═══════════════════════════════════════════════════════════════════════
    
    def setup_websocket(self):
        """Initialize WebSocket connection"""
        print(f"🔌 Initializing WebSocket client for {SERVER_URL}")
        
        self.sio = socketio.Client(
            reconnection=True,
            reconnection_delay=1,
            reconnection_delay_max=5,
            reconnection_attempts=10,
            logger=False,
            engineio_logger=False
        )
        
        # Register all event handlers
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('connect_error', self.on_connect_error)
        self.sio.on('co2_update', self.on_co2_update)
        self.sio.on('settings_update', self.on_settings_update)
        self.sio.on('status', self.on_status)
        
        # Connect in background thread
        threading.Thread(target=self.connect_to_server, daemon=True).start()
    
    def connect_to_server(self):
        """Connect to WebSocket server (background thread)"""
        try:
            print(f"📡 Attempting connection to {SERVER_URL}...")
            self.sio.connect(SERVER_URL)
        except Exception as e:
            print(f"❌ Connection error: {e}")
            error_msg = str(e)  # Capture error message before lambda
            Clock.schedule_once(
                lambda dt: self.update_status(f"❌ Connection Failed: {error_msg}", False)
            )
    
    def on_connect(self):
        """Called when connected to server"""
        print("✅ Connected to WebSocket server!")
        Clock.schedule_once(lambda dt: self.update_status("✅ Connected", True))
    
    def on_disconnect(self):
        """Called when disconnected from server"""
        print("⚠️ Disconnected from WebSocket server")
        Clock.schedule_once(lambda dt: self.update_status("⚠️ Disconnected", False))
    
    def on_connect_error(self, error):
        """Called when connection error occurs"""
        print(f"❌ Connection error: {error}")
        error_msg = str(error)  # Capture error message before lambda
        Clock.schedule_once(
            lambda dt: self.update_status(f"❌ Error: {error_msg}", False)
        )
    
    def on_status(self, data):
        """Called when status message received"""
        print(f"📢 Status: {data}")
    
    def on_co2_update(self, data):
        """Called when CO₂ data is received from server"""
        print(f"📊 CO₂ Update: {data}")
        
        # Update UI on main thread
        Clock.schedule_once(lambda dt: self.update_co2_display(data))
    
    def on_settings_update(self, settings):
        """Called when settings are updated on server"""
        print(f"⚙️ Settings Update: {settings}")
        
        # Update thresholds
        if 'good_threshold' in settings:
            self.good_threshold = settings['good_threshold']
        if 'bad_threshold' in settings:
            self.bad_threshold = settings['bad_threshold']
        if 'analysis_running' in settings:
            self.analysis_running = settings['analysis_running']
        
        # Update threshold display
        Clock.schedule_once(lambda dt: self.update_threshold_display())
    
    # ═══════════════════════════════════════════════════════════════════════
    # UI UPDATE METHODS (called on main thread)
    # ═══════════════════════════════════════════════════════════════════════
    
    def update_status(self, text, connected):
        """Update connection status display"""
        self.is_connected = connected
        self.status_label.text = text
    
    def update_co2_display(self, data):
        """Update CO₂ display with new data"""
        # Check if analysis is running
        if not data.get('analysis_running', False):
            self.ppm_label.text = "-- ppm"
            self.quality_label.text = "⏸️ Analysis Paused"
            self.quality_label.text_color = [0.6, 0.6, 0.6, 1]
            self.time_label.text = "Analysis is paused"
            return
        
        # Get PPM value
        ppm = data.get('ppm', 0)
        if ppm is None:
            return
        
        self.current_ppm = ppm
        self.ppm_label.text = f"{ppm} ppm"
        
        # Update quality indicator
        if ppm < self.good_threshold:
            self.quality_text = "🟢 Excellent"
            self.quality_color = [0.29, 0.87, 0.5, 1]  # Green
            self.quality_label.text = "🟢 Excellent"
        elif ppm < self.bad_threshold:
            self.quality_text = "🟡 Moyen"
            self.quality_color = [0.98, 0.8, 0.13, 1]  # Yellow
            self.quality_label.text = "🟡 Moyen"
        else:
            self.quality_text = "🔴 Mauvais"
            self.quality_color = [0.97, 0.44, 0.44, 1]  # Red
            self.quality_label.text = "🔴 Mauvais"
        
        self.quality_label.text_color = self.quality_color
        
        # Update timestamp
        timestamp = data.get('timestamp', '')
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                time_str = dt.strftime('%H:%M:%S')
                self.last_update = time_str
                self.time_label.text = f"Last update: {time_str}"
            except:
                self.time_label.text = "Last update: just now"
        else:
            self.time_label.text = "Last update: just now"
    
    def update_threshold_display(self):
        """Update threshold display"""
        self.threshold_label.text = (
            f"Thresholds: Good < {int(self.good_threshold)} < "
            f"Medium < {int(self.bad_threshold)} < Bad"
        )
    
    # ═══════════════════════════════════════════════════════════════════════
    # USER ACTIONS
    # ═══════════════════════════════════════════════════════════════════════
    
    def manual_reconnect(self, *args):
        """Manually reconnect to server"""
        print("🔄 Manual reconnect requested")
        if self.sio and self.sio.connected:
            self.sio.disconnect()
        
        threading.Thread(target=self.connect_to_server, daemon=True).start()
    
    def request_data(self, *args):
        """Request immediate data update from server"""
        if self.sio and self.sio.connected:
            print("📡 Requesting data from server...")
            self.sio.emit('request_data')
        else:
            print("⚠️ Not connected to server")
    
    # ═══════════════════════════════════════════════════════════════════════
    # CLEANUP
    # ═══════════════════════════════════════════════════════════════════════
    
    def disconnect(self):
        """Disconnect from server"""
        if self.sio and self.sio.connected:
            print("👋 Disconnecting from server...")
            self.sio.disconnect()
    
    def on_leave(self, *args):
        """Called when leaving the screen"""
        self.disconnect()


# ============================================================================
# APP CLASS
# ============================================================================

class CO2MonitorApp(MDApp):
    """Main application class"""
    
    def build(self):
        """Build the app"""
        self.theme_cls.theme_style = "Dark"
        self.theme_cls.primary_palette = "Blue"
        
        screen = CO2MonitorScreen()
        return screen
    
    def on_stop(self):
        """Called when app is closing"""
        print("🛑 App closing, disconnecting...")
        if hasattr(self.root, 'disconnect'):
            self.root.disconnect()


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🌬️ Aerium CO₂ Monitor - WebSocket Client")
    print("=" * 60)
    print(f"Server URL: {SERVER_URL}")
    print("=" * 60)
    
    CO2MonitorApp().run()
