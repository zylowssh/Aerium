# 🔌 WebSocket Client Guide for KivyMD

This guide shows how to connect your KivyMD mobile app to the Aerium WebSocket server to receive real-time CO₂ data.

---

## 📋 Overview

The Flask server (`site/app.py`) broadcasts CO₂ readings via WebSocket on port 5000. Your KivyMD app can connect as a client to receive:
- Real-time CO₂ readings
- Settings updates
- System status changes

---

## 🚀 Quick Start

### 1. Install Required Packages

Add to your `requirements.txt`:
```txt
python-socketio==5.9.0
websocket-client==1.6.4
```

Install:
```bash
pip install python-socketio websocket-client
```

---

## 💻 KivyMD WebSocket Client Implementation

### Example: Real-Time CO₂ Monitor Screen

Create `app/co2_live_screen.py`:

```python
from kivy.clock import Clock
from kivy.properties import StringProperty, NumericProperty, BooleanProperty
from kivymd.uix.screen import MDScreen
from kivymd.uix.label import MDLabel
from kivymd.uix.boxlayout import MDBoxLayout
import socketio
import threading


class CO2LiveScreen(MDScreen):
    """Screen that displays real-time CO₂ data from WebSocket"""
    
    # Kivy properties that auto-update UI
    current_ppm = NumericProperty(0)
    quality_text = StringProperty("--")
    quality_color = StringProperty("#666666")
    is_connected = BooleanProperty(False)
    analysis_running = BooleanProperty(False)
    
    # WebSocket client
    sio = None
    
    def __init__(self, server_url="http://localhost:5000", **kwargs):
        super().__init__(**kwargs)
        self.server_url = server_url
        
        # Build UI
        self.build_ui()
        
        # Initialize WebSocket
        self.setup_websocket()
    
    def build_ui(self):
        """Build the UI layout"""
        layout = MDBoxLayout(
            orientation="vertical",
            padding="20dp",
            spacing="20dp"
        )
        
        # Connection status
        self.status_label = MDLabel(
            text="Connecting...",
            halign="center",
            theme_text_color="Secondary"
        )
        layout.add_widget(self.status_label)
        
        # CO₂ value display
        self.ppm_label = MDLabel(
            text="-- ppm",
            halign="center",
            font_style="Display",
            role="large"
        )
        layout.add_widget(self.ppm_label)
        
        # Quality indicator
        self.quality_label = MDLabel(
            text="--",
            halign="center",
            font_style="Headline",
            role="medium"
        )
        layout.add_widget(self.quality_label)
        
        self.add_widget(layout)
    
    def setup_websocket(self):
        """Initialize WebSocket connection"""
        self.sio = socketio.Client(
            reconnection=True,
            reconnection_delay=1,
            reconnection_delay_max=5
        )
        
        # Register event handlers
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('co2_update', self.on_co2_update)
        self.sio.on('settings_update', self.on_settings_update)
        
        # Connect in background thread to avoid blocking UI
        threading.Thread(target=self.connect_to_server, daemon=True).start()
    
    def connect_to_server(self):
        """Connect to WebSocket server (runs in background thread)"""
        try:
            self.sio.connect(self.server_url)
        except Exception as e:
            print(f"Connection error: {e}")
            # Schedule UI update on main thread
            Clock.schedule_once(lambda dt: self.update_status("Connection Failed", False))
    
    def on_connect(self):
        """Called when connected to server"""
        print("✓ Connected to WebSocket server")
        # Update UI on main thread
        Clock.schedule_once(lambda dt: self.update_status("Connected", True))
    
    def on_disconnect(self):
        """Called when disconnected from server"""
        print("✗ Disconnected from WebSocket server")
        Clock.schedule_once(lambda dt: self.update_status("Disconnected", False))
    
    def on_co2_update(self, data):
        """Called when CO₂ data is received"""
        print(f"📊 CO₂ Update: {data}")
        
        # Schedule UI update on main thread (Kivy requirement)
        Clock.schedule_once(lambda dt: self.update_co2_display(data))
    
    def on_settings_update(self, settings):
        """Called when settings change"""
        print(f"⚙️ Settings Update: {settings}")
        
        if 'analysis_running' in settings:
            self.analysis_running = settings['analysis_running']
    
    def update_status(self, text, connected):
        """Update connection status (called on main thread)"""
        self.is_connected = connected
        self.status_label.text = text
        self.status_label.theme_text_color = "Primary" if connected else "Error"
    
    def update_co2_display(self, data):
        """Update CO₂ display (called on main thread)"""
        if not data.get('analysis_running'):
            self.ppm_label.text = "-- ppm"
            self.quality_label.text = "Analysis Paused"
            return
        
        ppm = data.get('ppm', 0)
        self.current_ppm = ppm
        self.ppm_label.text = f"{ppm} ppm"
        
        # Update quality indicator
        if ppm < 800:
            self.quality_text = "🟢 Excellent"
            self.quality_color = "#4ade80"
        elif ppm < 1200:
            self.quality_text = "🟡 Moyen"
            self.quality_color = "#facc15"
        else:
            self.quality_text = "🔴 Mauvais"
            self.quality_color = "#f87171"
        
        self.quality_label.text = self.quality_text
        self.quality_label.text_color = self.quality_color
    
    def disconnect(self):
        """Disconnect from server (call when screen is closed)"""
        if self.sio and self.sio.connected:
            self.sio.disconnect()
    
    def on_leave(self):
        """Called when leaving the screen"""
        self.disconnect()
```

---

## 🎯 Integration with Existing App

### Update your `homepage.py`:

```python
from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.screenmanager import MDScreenManager
from co2_live_screen import CO2LiveScreen

class MainApp(MDApp):
    def build(self):
        self.theme_cls.theme_style = "Dark"
        self.theme_cls.primary_palette = "Blue"
        
        # Create screen manager
        sm = MDScreenManager()
        
        # Add CO₂ live screen
        co2_screen = CO2LiveScreen(
            name="co2_live",
            server_url="http://192.168.1.100:5000"  # Replace with your server IP
        )
        sm.add_widget(co2_screen)
        
        # Add other screens...
        
        return sm

if __name__ == "__main__":
    MainApp().run()
```

---

## 🌐 Server Configuration

### 1. Find Your Server IP Address

On the computer running the Flask server:

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**Linux/Mac:**
```bash
ifconfig
```

### 2. Update Server to Accept External Connections

The server already accepts external connections:
```python
socketio.run(app, debug=True, host='0.0.0.0', port=5000)
```

### 3. Firewall Configuration

**Windows:**
```powershell
New-NetFirewallRule -DisplayName "Aerium Server" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

---

## 📱 Advanced Usage Examples

### Example 1: Alarm System Based on CO₂

```python
class CO2AlarmScreen(CO2LiveScreen):
    """Extends CO2LiveScreen with alarm functionality"""
    
    alarm_threshold = NumericProperty(1200)
    alarm_active = BooleanProperty(False)
    
    def on_co2_update(self, data):
        """Override to add alarm logic"""
        super().on_co2_update(data)
        
        if data.get('ppm', 0) >= self.alarm_threshold:
            if not self.alarm_active:
                self.trigger_alarm()
        else:
            self.alarm_active = False
    
    def trigger_alarm(self):
        """Trigger alarm notification"""
        self.alarm_active = True
        
        # Play sound
        from kivy.core.audio import SoundLoader
        sound = SoundLoader.load('assets/alarm.wav')
        if sound:
            sound.play()
        
        # Show notification
        from plyer import notification
        notification.notify(
            title="Alerte CO₂",
            message=f"Niveau élevé détecté: {self.current_ppm} ppm",
            app_name="Aerium"
        )
```

### Example 2: Historical Data with Graph

```python
from kivy_garden.graph import Graph, MeshLinePlot
import requests

class CO2GraphScreen(MDScreen):
    """Display historical CO₂ data with graph"""
    
    def __init__(self, server_url="http://localhost:5000", **kwargs):
        super().__init__(**kwargs)
        self.server_url = server_url
        self.build_ui()
        self.load_history()
    
    def build_ui(self):
        """Build UI with graph"""
        layout = MDBoxLayout(orientation="vertical", padding="20dp")
        
        # Create graph
        self.graph = Graph(
            xlabel='Time',
            ylabel='CO₂ (ppm)',
            x_ticks_minor=5,
            x_ticks_major=25,
            y_ticks_major=200,
            y_grid_label=True,
            x_grid_label=True,
            padding=5,
            x_grid=True,
            y_grid=True,
            xmin=0,
            xmax=100,
            ymin=0,
            ymax=2000
        )
        
        layout.add_widget(self.graph)
        self.add_widget(layout)
    
    def load_history(self):
        """Load historical data from server"""
        try:
            # Fetch today's history
            response = requests.get(f"{self.server_url}/api/history/today")
            data = response.json()
            
            # Create plot
            plot = MeshLinePlot(color=[0.29, 0.87, 0.5, 1])  # Green
            plot.points = [(i, d['ppm']) for i, d in enumerate(data)]
            
            self.graph.add_plot(plot)
        except Exception as e:
            print(f"Error loading history: {e}")
```

### Example 3: Settings Control from App

```python
class CO2SettingsScreen(MDScreen):
    """Control server settings from mobile app"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.sio = socketio.Client()
        self.sio.connect("http://192.168.1.100:5000")
    
    def update_threshold(self, good_threshold, bad_threshold):
        """Send settings update to server"""
        settings = {
            "good_threshold": good_threshold,
            "bad_threshold": bad_threshold,
            "analysis_running": True,
            "realistic_mode": True,
            "update_speed": 1,
            "overview_update_speed": 5
        }
        
        # Emit settings change event
        self.sio.emit('settings_change', settings)
    
    def toggle_analysis(self, state):
        """Start/stop analysis from app"""
        settings = {
            "analysis_running": state,
            "good_threshold": 800,
            "bad_threshold": 1200,
            "realistic_mode": True,
            "update_speed": 1,
            "overview_update_speed": 5
        }
        
        self.sio.emit('settings_change', settings)
```

---

## 🔒 Production Considerations

### Security

1. **Add Authentication:**
```python
# In Flask app
@socketio.on('connect')
def handle_connect(auth):
    if not verify_token(auth.get('token')):
        return False  # Reject connection
```

2. **Use HTTPS/WSS:**
```python
socketio.run(app, 
    host='0.0.0.0', 
    port=5000,
    certfile='cert.pem',
    keyfile='key.pem'
)
```

### Error Handling

```python
def setup_websocket(self):
    self.sio = socketio.Client(
        reconnection=True,
        reconnection_attempts=10,
        reconnection_delay=1,
        reconnection_delay_max=5,
        logger=True,
        engineio_logger=True
    )
    
    @self.sio.on('connect_error')
    def on_error(data):
        print(f"Connection Error: {data}")
        Clock.schedule_once(lambda dt: self.show_error_dialog())
```

---

## 📊 Available WebSocket Events

### Events the Server Sends:

| Event | Data | Description |
|-------|------|-------------|
| `connect` | - | Connection established |
| `status` | `{'data': 'Connected to Morpheus CO₂ Monitor'}` | Initial status message |
| `co2_update` | `{'analysis_running': bool, 'ppm': int, 'timestamp': str}` | Real-time CO₂ reading (every 1s) |
| `settings_update` | `{...all settings...}` | Settings changed (thresholds, speeds, etc.) |

### Events You Can Send:

| Event | Data | Description |
|-------|------|-------------|
| `request_data` | - | Request immediate CO₂ reading |
| `settings_change` | `{...settings...}` | Update server settings |

---

## 🎨 Complete Working Example

See `app/co2_websocket_client.py` for a complete, production-ready example with:
- Automatic reconnection
- Error handling
- Graph display
- Alarm system
- Settings control

---

## 🐛 Troubleshooting

### "Connection Refused"
- Check server is running: `python site/app.py`
- Check firewall allows port 5000
- Verify IP address is correct

### "No Data Received"
- Check WebSocket connection in browser console
- Verify `broadcast_thread` is running on server
- Check server logs for errors

### "App Crashes on Connect"
- Always use threading for WebSocket connection
- Use `Clock.schedule_once()` for UI updates
- Check Python version compatibility

---

## 📚 Additional Resources

- [Python-SocketIO Docs](https://python-socketio.readthedocs.io/)
- [KivyMD Documentation](https://kivymd.readthedocs.io/)
- [Kivy Clock Documentation](https://kivy.org/doc/stable/api-kivy.clock.html)

---

## 🎯 Next Steps

1. Create `co2_live_screen.py` with the example code
2. Update your main app to include the screen
3. Test connection on local network
4. Add your custom features (alarms, graphs, etc.)
