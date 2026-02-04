# Aerium Alarm Clock - Mobile App

A KivyMD-based alarm clock mobile application that syncs with CO₂ readings from the Aerium air quality monitoring system.

## Features

- **⏰ Smart Alarm Clock**: Set regular time-based alarms
- **🌡️ CO₂ Threshold Alarms**: Get alerted when CO₂ levels exceed safe thresholds
- **📊 Real-time CO₂ Monitoring**: View current and historical CO₂ data from Aerium server
- **🔔 Notifications**: Receive push notifications for alarms and air quality alerts
- **🌓 Dark/Light Theme**: Customizable appearance
- **💾 Local Storage**: Saves alarms and settings locally

## Installation

### Prerequisites

- Python 3.8+
- Aerium server running (for CO₂ data sync)

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the app:
```bash
python main.py
```

### Building for Android

To build for Android, you need to install Buildozer:

```bash
pip install buildozer
```

Then run:

```bash
buildozer android debug
```

### Building for iOS

For iOS, you need to use XCode on macOS. Follow the Kivy documentation for iOS deployment.

## Configuration

### Connecting to Aerium Server

1. Open the app
2. Go to **Settings**
3. Update the **CO₂ Server URL** to point to your Aerium instance (e.g., `http://192.168.1.100:5000`)

### Setting Up Alarms

#### Time-based Alarms

1. Go to **Alarms** screen
2. Tap the **+** button
3. Set time and enable alarm
4. Choose alarm sound and snooze duration

#### CO₂ Threshold Alarms

1. Go to **Alarms** screen
2. Tap **+** button
3. Select **CO₂ Alarm** type
4. Set threshold (e.g., 1200 ppm)
5. Enable alarm

When CO₂ levels from the Aerium server exceed this threshold, you'll be alerted.

## Project Structure

```
alarm-clock-app/
├── main.py                    # Main application entry point
├── screens/                   # UI screens
│   ├── home_screen.py        # Home screen with clock and CO₂ display
│   ├── alarm_screen.py       # Alarm management screen
│   ├── settings_screen.py    # Settings screen
│   └── co2_monitor_screen.py # CO₂ monitoring screen
├── services/                  # Backend services
│   ├── alarm_service.py      # Alarm logic and triggers
│   ├── co2_service.py        # CO₂ data fetching from Aerium
│   ├── notification_service.py # Notification handling
│   └── storage_service.py    # Local data persistence
├── assets/                    # Images, sounds, etc.
├── utils/                     # Utility functions
└── requirements.txt          # Python dependencies
```

## API Integration

The app connects to the Aerium server's REST API:

- `GET /api/readings/latest` - Get current CO₂ reading
- `GET /api/readings/history` - Get historical CO₂ data

Make sure your Aerium server has these endpoints enabled and accessible.

## Customization

### Changing Theme

Edit `main.py` and modify:

```python
self.theme_cls.primary_palette = "DeepPurple"  # Change color
self.theme_cls.theme_style = "Dark"  # "Dark" or "Light"
```

### Adding Custom Alarm Sounds

Place audio files in `assets/sounds/` and reference them in the alarm service.

## Troubleshooting

### App won't connect to Aerium server

- Ensure the server URL is correct in Settings
- Check that your device is on the same network as the Aerium server
- Verify the Aerium server is running and accessible
- Check firewall settings

### Alarms not triggering

- Ensure alarms are enabled
- Check notification permissions on your device
- Verify the app is not being killed by battery optimization

### CO₂ data not updating

- Check server connection in Settings
- Verify Aerium server is sending data
- Check the app has network permissions

## Development

### Running in Development Mode

```bash
python main.py
```

### Testing on Emulator

For Android:
```bash
buildozer android debug deploy run logcat
```

## License

MIT License - See main Aerium project for details

## Contributing

Contributions are welcome! Please follow the same guidelines as the main Aerium project.

## Support

For issues and questions:
- Check the main Aerium documentation
- Open an issue on GitHub
- Contact the development team

---

**Made with ❤️ for better air quality**
