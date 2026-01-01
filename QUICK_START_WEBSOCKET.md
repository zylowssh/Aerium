# 🚀 Quick Start: Testing WebSocket Connection

## Step 1: Start the Server

Open a terminal in the `site` folder:

```bash
cd site
python app.py
```

You should see:
```
* Running on http://0.0.0.0:5000
[OK] WebSocket broadcast thread started
```

---

## Step 2: Find Your Server IP

### On Windows (PowerShell):
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.100`)

### On the same computer (for testing):
Use `http://localhost:5000`

---

## Step 3: Test with Web Browser First

1. Open browser: `http://localhost:5000/live`
2. Open browser console (F12)
3. You should see:
   ```
   ✓ WebSocket connected: <socket-id>
   📋 Settings updated via WebSocket: {...}
   📊 CO₂ Update: {analysis_running: true, ppm: 650, ...}
   ```

If this works, your server is ready! ✅

---

## Step 4: Update Mobile App Configuration

Edit `app/co2_websocket_client.py`:

```python
# Line 21 - Change this:
SERVER_URL = "http://localhost:5000"

# To your server IP (from Step 2):
SERVER_URL = "http://192.168.1.100:5000"  # Your actual IP
```

---

## Step 5: Install Dependencies

In your main project folder:

```bash
pip install python-socketio websocket-client
```

---

## Step 6: Run the Mobile App

```bash
cd app
python co2_websocket_client.py
```

You should see:
```
============================================================
🌬️ Aerium CO₂ Monitor - WebSocket Client
============================================================
Server URL: http://192.168.1.100:5000
============================================================
🔌 Initializing WebSocket client for http://192.168.1.100:5000
📡 Attempting connection to http://192.168.1.100:5000...
✅ Connected to WebSocket server!
📊 CO₂ Update: {'analysis_running': True, 'ppm': 678, ...}
```

---

## Step 7: Verify Data Flow

In the app window, you should see:
- ✅ Status: "Connected"
- Real-time CO₂ values updating every 1-2 seconds
- Quality indicator (🟢/🟡/🔴)
- Timestamp of last update

---

## 🐛 Troubleshooting

### "Connection Refused" Error

**Check firewall:**
```powershell
# Windows: Allow port 5000
New-NetFirewallRule -DisplayName "Aerium Server" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

**Or temporarily disable firewall to test**

---

### "Module not found" Error

```bash
pip install python-socketio websocket-client kivymd
```

---

### Server shows no connections

Check `site/app.py` - ensure it's running with:
```python
socketio.run(app, debug=True, host='0.0.0.0', port=5000)
```

The `host='0.0.0.0'` is critical for external connections!

---

### Mobile app shows old data

The server broadcasts automatically. If you're seeing stale data:
1. Click "Update" button in the app
2. Check server terminal for broadcast logs
3. Restart server: Ctrl+C and run `python app.py` again

---

## 📱 Integration with Your Existing App

To add this to your existing `homepage.py`:

```python
from kivymd.app import MDApp
from kivymd.uix.screenmanager import MDScreenManager
from co2_websocket_client import CO2MonitorScreen

class MainApp(MDApp):
    def build(self):
        self.theme_cls.theme_style = "Dark"
        self.theme_cls.primary_palette = "Blue"
        
        # Create screen manager
        sm = MDScreenManager()
        
        # Add your existing screens
        # sm.add_widget(YourHomeScreen(name="home"))
        # sm.add_widget(YourAlarmsScreen(name="alarms"))
        
        # Add CO₂ monitor screen
        co2_screen = CO2MonitorScreen(name="co2_monitor")
        sm.add_widget(co2_screen)
        
        return sm
```

---

## 🎯 Next Steps

Once the basic connection works:

1. **Customize the UI** - Modify `co2_websocket_client.py` to match your design
2. **Add alarms** - Use the alert example from `WEBSOCKET_CLIENT_GUIDE.md`
3. **Add graphs** - Display historical data with Kivy Garden Graph
4. **Multiple sensors** - Connect to different rooms/locations

---

## 📚 Full Documentation

- **Complete guide:** `WEBSOCKET_CLIENT_GUIDE.md`
- **Feature ideas:** `FEATURE_SUGGESTIONS.md`
- **Server API:** Check `site/app.py` for all endpoints

---

## ✅ Success Checklist

- [ ] Server running on port 5000
- [ ] Web browser can connect to `/live` page
- [ ] Browser console shows WebSocket messages
- [ ] Mobile app connects successfully
- [ ] CO₂ data updates in real-time
- [ ] Settings changes sync between web and mobile

When all checked, you're ready to build your custom features! 🎉
