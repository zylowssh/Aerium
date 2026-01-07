# 🚀 QUICK REFERENCE - ADVANCED FEATURES API

## Advanced Charts API

### Basic Usage
```html
<!-- Charts are accessed at /advanced-charts route -->
<a href="/advanced-charts">View Advanced Charts</a>
```

### Data Endpoint
```javascript
// GET /api/analytics/custom
fetch('/api/analytics/custom?period=1W&source=live')
  .then(r => r.json())
  .then(data => console.log(data))

// Parameters:
// - period: '1D', '1W', '1M', '3M', '6M', '1Y'
// - source: 'live', 'simulated', 'imported'
```

### Chart Types (TradingView Lightweight Charts)
```javascript
// Candlestick (default for financial data)
createCandlestickSeries()

// Area chart
createAreaSeries()

// Line chart
createLineSeries()

// Bar chart
createBarSeries()
```

### Adding Data to Charts
```javascript
// Format: {time, open, high, low, close, volume}
const data = [
  {time: '2026-01-01', open: 800, high: 820, low: 790, close: 810, volume: 1000},
  {time: '2026-01-02', open: 810, high: 850, low: 805, close: 840, volume: 1200},
];

series.setData(data);
```

### Technical Indicators
```javascript
// Add SMA20 indicator
const sma20 = chart.addLineSeries({color: 'blue'});
sma20.setData(calculateSMA(data, 20));

// Add Volume bars
const volumeSeries = chart.addBarSeries({color: 'gray'});
volumeSeries.setData(data.map(d => ({time: d.time, value: d.volume})));
```

---

## PWA / Service Worker API

### Check Service Worker Registration
```javascript
// Automatically registered via base.html
navigator.serviceWorker.ready
  .then(reg => console.log('Service Worker active', reg))
  .catch(err => console.log('Service Worker failed', err))
```

### Detect PWA Installation
```javascript
// Check if app is installed
let isInstalled = false;
if (navigator.standalone === true) {
  // iOS
  isInstalled = true;
} else if (window.matchMedia('(display-mode: standalone)').matches) {
  // Android/Web
  isInstalled = true;
}
```

### Offline Detection
```javascript
// Check current connection status
if (navigator.onLine) {
  console.log('Online');
} else {
  console.log('Offline - using cached data');
}

// Listen for connection changes
window.addEventListener('online', () => console.log('Back online'));
window.addEventListener('offline', () => console.log('Offline'));
```

### Cache Management
```javascript
// Manually clear cache
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// List cached items
caches.open('static-v1').then(cache => {
  cache.keys().then(requests => {
    console.log('Cached URLs:', requests.map(r => r.url));
  });
});
```

### Install Prompt
```javascript
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
  document.getElementById('install-btn').style.display = 'block';
});

document.getElementById('install-btn').addEventListener('click', async () => {
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to install prompt: ${outcome}`);
  deferredPrompt = null;
});
```

---

## Real-time Collaboration API

### REST Endpoints

#### List Dashboards
```bash
GET /api/collaboration/dashboards
# Returns: [{id, dashboard_name, description, collaborators[], activity[]}, ...]
```

#### Create Dashboard
```bash
POST /api/collaboration/dashboard
Content-Type: application/json

{
  "dashboard_name": "Q1 CO2 Analysis",
  "description": "CO2 trends for Q1 2026"
}

# Returns: {id, owner_id, share_token, created_at}
```

#### Get Dashboard Details
```bash
GET /api/collaboration/dashboard/123
# Returns: Dashboard object with all collaborators and activity
```

#### Share Dashboard
```bash
POST /api/collaboration/dashboard/123/share
Content-Type: application/json

{
  "user_id": 456,
  "permission_level": "editor"  # or "viewer", "admin"
}

# Returns: {success: true, collaborator: {...}}
```

#### Update Collaborator Permission
```bash
PUT /api/collaboration/dashboard/123/collaborators/456
Content-Type: application/json

{
  "permission_level": "admin"
}
```

#### Remove Collaborator
```bash
DELETE /api/collaboration/dashboard/123/collaborators/456
# Returns: {success: true}
```

#### Save Dashboard State
```bash
POST /api/collaboration/dashboard/123/state
Content-Type: application/json

{
  "state_data": "{...layout and widget config...}"
}
```

#### Add Comment
```bash
POST /api/collaboration/dashboard/123/comment
Content-Type: application/json

{
  "comment_text": "Check the spike at 2pm",
  "data_point": "2026-01-07T14:00:00Z"
}
```

#### Get Activity Log
```bash
GET /api/collaboration/dashboard/123/activity
# Returns: [{id, user_id, activity_type, activity_data, created_at}, ...]
```

### WebSocket Events

#### Connect & Join
```javascript
// Connect (automatic via SocketIO)
const socket = io();

// Join a dashboard
socket.emit('join_dashboard', {
  dashboard_id: 123
});

// Server broadcasts
socket.on('active_users_updated', (data) => {
  console.log('Active users:', data.users);
});
```

#### Real-time Updates
```javascript
// Listen for dashboard updates
socket.on('dashboard_updated', (data) => {
  console.log('Dashboard state changed:', data);
  // Refresh chart or UI
});

// Send updates
socket.emit('dashboard_update', {
  dashboard_id: 123,
  state: newState,
  timestamp: Date.now()
});
```

#### Comments
```javascript
// Send comment
socket.emit('send_comment', {
  dashboard_id: 123,
  comment: 'Great analysis!',
  user_id: currentUserId
});

// Receive comments
socket.on('comment_added', (data) => {
  console.log(data.user, ':', data.comment);
  // Add to UI
});
```

#### Sync & Reconnect
```javascript
// Request full state sync
socket.emit('request_sync', {
  dashboard_id: 123
});

// Receive synced state
socket.on('state_synced', (data) => {
  console.log('Synced dashboard state:', data);
});
```

#### Leave Dashboard
```javascript
socket.emit('leave_dashboard', {
  dashboard_id: 123
});
```

### Permission Levels
- **viewer**: Can view dashboard and comments, read-only
- **editor**: Can modify dashboard, add comments
- **admin**: Full control, manage collaborators, delete dashboard

### Error Handling
```javascript
// Errors returned as JSON
fetch('/api/collaboration/dashboard/999')
  .then(r => r.json())
  .then(data => {
    if (data.error) {
      console.error(data.error);
      // Handle error
    }
  });
```

---

## Database Schema

### Collaboration Tables
```sql
-- Main dashboards table
CREATE TABLE shared_dashboards (
  id INTEGER PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  dashboard_name TEXT NOT NULL,
  description TEXT,
  share_token TEXT UNIQUE,
  is_public BOOLEAN DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME
);

-- Collaborators with permissions
CREATE TABLE shared_dashboard_collaborators (
  id INTEGER PRIMARY KEY,
  dashboard_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  permission_level TEXT DEFAULT 'viewer',
  added_at DATETIME,
  UNIQUE(dashboard_id, user_id)
);

-- Dashboard layouts and widget configurations
CREATE TABLE dashboard_states (
  id INTEGER PRIMARY KEY,
  dashboard_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  state_data TEXT,
  saved_at DATETIME,
  UNIQUE(dashboard_id, user_id)
);

-- Comments and annotations
CREATE TABLE dashboard_comments (
  id INTEGER PRIMARY KEY,
  dashboard_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  comment_text TEXT NOT NULL,
  data_point TEXT,
  created_at DATETIME,
  updated_at DATETIME
);

-- Audit trail
CREATE TABLE collaboration_activity (
  id INTEGER PRIMARY KEY,
  dashboard_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data TEXT,
  created_at DATETIME
);
```

---

## Integration Examples

### Example 1: Embed Advanced Charts
```html
<a href="/advanced-charts" class="btn btn-primary">
  📊 View Advanced Charts
</a>
```

### Example 2: Create & Share Dashboard
```javascript
async function createAndShareDashboard() {
  // Create dashboard
  const res1 = await fetch('/api/collaboration/dashboard', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      dashboard_name: 'CO2 Analysis',
      description: 'Real-time analysis'
    })
  });
  const dashboard = await res1.json();
  
  // Share with user
  const res2 = await fetch(`/api/collaboration/dashboard/${dashboard.id}/share`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      user_id: 456,
      permission_level: 'editor'
    })
  });
  
  console.log('Dashboard shared!');
}
```

### Example 3: Real-time Collaboration
```javascript
// Initialize WebSocket
const socket = io();

// Join dashboard
socket.emit('join_dashboard', {dashboard_id: 123});

// Listen for updates
socket.on('dashboard_updated', (data) => {
  // Update UI with new state
  updateCharts(data.state);
});

// Send update
function updateDashboard(newState) {
  socket.emit('dashboard_update', {
    dashboard_id: 123,
    state: newState,
    timestamp: Date.now()
  });
}
```

### Example 4: Offline Functionality
```javascript
// Check if online
if (!navigator.onLine) {
  console.log('App is offline - using cached data');
}

// Listen for reconnection
window.addEventListener('online', async () => {
  console.log('Reconnected - syncing data');
  socket.emit('request_sync', {dashboard_id: 123});
});
```

---

## Configuration

### Enable/Disable Features
```python
# In app.py or config.py
ADVANCED_CHARTS_ENABLED = True
PWA_ENABLED = True
COLLABORATION_ENABLED = True

# Collaboration settings
COLLAB_MAX_CONCURRENT_USERS = 100
COLLAB_ACTIVITY_RETENTION_DAYS = 90
COLLAB_SOCKET_TIMEOUT = 30
```

### Cache Manifest
```json
// /manifest.json
{
  "name": "Morpheus CO₂ Monitor",
  "short_name": "Morpheus",
  "display": "standalone",
  "start_url": "/",
  "scope": "/",
  "theme_color": "#3dd98f",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/static/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

---

## Troubleshooting

### Advanced Charts Not Loading
```javascript
// Check if data endpoint is accessible
fetch('/api/analytics/custom?period=1W')
  .then(r => r.json())
  .then(data => console.log('Data:', data))
  .catch(err => console.error('Error:', err));
```

### Service Worker Not Registering
```javascript
// Check browser console for errors
navigator.serviceWorker.getRegistrations()
  .then(registrations => console.log(registrations));
```

### WebSocket Connection Issues
```javascript
// Check connection
console.log('WebSocket state:', socket.connected);

// Reconnect manually
socket.connect();
```

### Permission Errors
```javascript
// Check current user's permissions
fetch('/api/collaboration/dashboard/123')
  .then(r => {
    if (r.status === 403) {
      console.log('Access denied - insufficient permissions');
    }
  });
```

---

## Performance Tips

1. **Charts**: Limit to 1000 data points per chart
2. **Updates**: Debounce WebSocket updates (100ms minimum)
3. **Cache**: Service Worker caches ~8MB of static assets
4. **Database**: Collaboration tables are indexed for fast queries
5. **Offline**: Only critical features work offline

---

## Security Notes

- All endpoints require authentication (except public dashboards)
- Parameterized SQL queries prevent injection
- CORS headers configured for cross-origin requests
- WebSocket events validated server-side
- Session tokens expire after 24 hours
- Rate limiting on API endpoints

---

**Last Updated**: January 7, 2026  
**API Version**: 1.0  
**Compatibility**: Chrome 60+, Firefox 55+, Safari 11+

