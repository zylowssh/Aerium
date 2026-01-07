# 🏗️ PHASE 1 ARCHITECTURE OVERVIEW

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         MORPHEUS CO₂ MONITOR                         │
│                        Phase 1 Architecture                           │
└──────────────────────────────────────────────────────────────────────┘

                              USER BROWSER
                     ┌─────────────────────────┐
                     │   Web Interface         │
                     │  (HTML/CSS/JavaScript)  │
                     └──────────┬──────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │    PWA       │ │  Advanced   │ │Collaboration
        │  Features    │ │   Charts    │ │   WebSocket
        └───────┬──────┘ └──────┬──────┘ └─────┬──────┘
                │               │               │
┌───────────────────────────────────────────────────────────┐
│              SERVICE WORKER (Offline Support)            │
│  ├─ Cache Strategy: Network-first                       │
│  ├─ Background Sync: Enabled                            │
│  ├─ Push Notifications: Ready                           │
│  └─ Offline Pages: Cached                               │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                    FLASK APP SERVER                       │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Routes & Blueprints                                │ │
│  │                                                       │ │
│  │  /advanced-charts                   [HTML Template]  │ │
│  │  /manifest.json                    [PWA Manifest]   │ │
│  │  /sw.js                            [Service Worker]  │ │
│  │  /api/analytics/custom             [Chart Data]      │ │
│  │                                                       │ │
│  │  /api/collaboration/*              [Collab API]      │ │
│  │    ├─ /dashboards                  [List]            │ │
│  │    ├─ /dashboard                   [CRUD]            │ │
│  │    ├─ /dashboard/{id}/share        [Sharing]         │ │
│  │    ├─ /dashboard/{id}/collaborators [Permissions]   │ │
│  │    ├─ /dashboard/{id}/state        [Save Layout]     │ │
│  │    ├─ /dashboard/{id}/comment      [Comments]        │ │
│  │    └─ /dashboard/{id}/activity     [Audit Log]       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  WebSocket / SocketIO (Real-time)                   │ │
│  │                                                       │ │
│  │  Events:                                             │ │
│  │  ├─ join_dashboard                                  │ │
│  │  ├─ leave_dashboard                                 │ │
│  │  ├─ dashboard_update                                │ │
│  │  ├─ send_comment                                    │ │
│  │  └─ request_sync                                    │ │
│  │                                                       │ │
│  │  Rooms: dashboard_{id}                              │ │
│  │  Broadcasting: active_users, comments, state        │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                       │
│                                                            │
│  Existing Tables:                                          │
│  ├─ users                                                 │
│  ├─ co2_readings                                          │
│  ├─ user_settings                                         │
│  ├─ teams & team_members                                  │
│  └─ ... [other tables]                                    │
│                                                            │
│  NEW - Collaboration Tables:                              │
│  ├─ shared_dashboards           [Dashboard metadata]      │
│  ├─ shared_dashboard_collaborators [Permissions]          │
│  ├─ dashboard_states            [Layout/widgets]          │
│  ├─ dashboard_comments          [Annotations]             │
│  └─ collaboration_activity      [Audit trail]             │
│                                                            │
│  Indexes: All collaboration tables indexed                │
│  Performance: Fast queries even with 1000s of records    │
└───────────────────────────────────────────────────────────┘

                    EXTERNAL SERVICES
            ┌──────────────────────────────────┐
            │  TradingView Charts Library      │
            │  (CDN: unpkg.com)               │
            │  - Candlestick charts           │
            │  - Technical indicators         │
            │  - Real-time updates            │
            └──────────────────────────────────┘
```

---

## Feature Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                 3 INTEGRATED FEATURES                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 1. ADVANCED FINANCIAL CHARTS                                │
│                                                             │
│    Access: /advanced-charts                                │
│    Template: advanced-charts.html (600+ lines)             │
│    Library: TradingView Lightweight Charts v3.8.0         │
│    Data Source: /api/analytics/custom endpoint            │
│                                                             │
│    Features:                                                │
│    ├─ Chart Types: Candlestick, Area, Bar, Line           │
│    ├─ Time Periods: 1D, 1W, 1M, 3M, 6M, 1Y               │
│    ├─ Indicators: SMA20, SMA50, Volume, RSI (ready)       │
│    ├─ Data Sources: Live, Simulated, Imported             │
│    ├─ Statistics: Current, Change%, High, Low, Avg, Vol   │
│    ├─ Responsive: Mobile-first design (320px+)            │
│    └─ Dark Mode: Theme toggle support                      │
│                                                             │
│    Integration:                                             │
│    ├─ Navbar Link: 📈 Données → 💹 Graphiques Avancés     │
│    ├─ Login Required: ✅ Yes                               │
│    ├─ Real-time Updates: ✅ Every 30 seconds              │
│    └─ Collaborative: ✅ Can share via collaboration       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. MOBILE PWA                                               │
│                                                             │
│    Components:                                              │
│    ├─ Manifest: /manifest.json                             │
│    ├─ Service Worker: /sw.js                               │
│    ├─ Meta Tags: apple-mobile-web-app-capable             │
│    └─ Install Prompt: Built-in browser UI                  │
│                                                             │
│    Features:                                                │
│    ├─ Installation: Android/iOS/Desktop                    │
│    ├─ Offline: Network-first caching                       │
│    ├─ Background Sync: Data sync when online              │
│    ├─ Push Notifications: Configured and ready             │
│    ├─ Cache Size: ~8MB of static assets                    │
│    └─ Theme: Dark mode, brand colors                       │
│                                                             │
│    Integration:                                             │
│    ├─ base.html: PWA meta tags + SW registration          │
│    ├─ All Pages: Service Worker caching                    │
│    ├─ Home Screen: Full app experience                     │
│    └─ Offline: Graceful degradation                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. REAL-TIME COLLABORATION                                  │
│                                                             │
│    API Endpoints: 9 REST routes                             │
│    WebSocket Events: 5 real-time handlers                   │
│    Database Tables: 5 collaboration tables                  │
│                                                             │
│    REST API:                                                │
│    ├─ GET /api/collaboration/dashboards                    │
│    ├─ POST /api/collaboration/dashboard                    │
│    ├─ GET /api/collaboration/dashboard/{id}               │
│    ├─ POST /api/collaboration/dashboard/{id}/share        │
│    ├─ PUT /api/collaboration/dashboard/{id}/collaborators  │
│    ├─ DELETE /api/collaboration/dashboard/{id}/collaborators│
│    ├─ POST /api/collaboration/dashboard/{id}/state        │
│    ├─ POST /api/collaboration/dashboard/{id}/comment      │
│    └─ GET /api/collaboration/dashboard/{id}/activity      │
│                                                             │
│    WebSocket Events:                                        │
│    ├─ join_dashboard → Presence tracking                   │
│    ├─ leave_dashboard → Cleanup                            │
│    ├─ dashboard_update → Broadcast changes                 │
│    ├─ send_comment → Real-time comments                    │
│    └─ request_sync → State reconciliation                  │
│                                                             │
│    Features:                                                │
│    ├─ Shared Dashboards: Multi-user editing                │
│    ├─ Permissions: viewer, editor, admin                   │
│    ├─ Comments: Real-time annotations                      │
│    ├─ Activity Log: Full audit trail                       │
│    └─ Presence: Active user tracking                       │
│                                                             │
│    Integration:                                             │
│    ├─ Blueprint: blueprints/collaboration.py               │
│    ├─ app.py: Blueprint registration + WebSocket           │
│    └─ Database: 5 new collaboration tables                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Advanced Charts Flow
```
User Browser                    Server                 Database
      │                            │                        │
      │─── GET /advanced-charts ──→│                        │
      │                            │─ load template         │
      │← HTML response ────────────│                        │
      │                            │                        │
      │─── GET /api/analytics/custom ──→│                   │
      │                            │─ Query analytics      ──│
      │                            │← Get CO₂ data ────────│
      │← JSON data ────────────────│                        │
      │                            │                        │
      │ (Charts.js initialize)     │                        │
      │ (Load TradingView)         │                        │
      │ (Render candlesticks)      │                        │
      │                            │                        │
      │ (User interacts)           │                        │
      │ └─ Time period change      │                        │
      │ └─ Chart type switch       │                        │
      │ └─ Indicator toggle        │                        │
```

### Real-time Collaboration Flow
```
User A                        WebSocket Server              Database
   │                              │                            │
   │─ POST /api/.../dashboard ───→│                            │
   │                              │── Create dashboard ────────│
   │← {dashboard_id: 123} ────────│                            │
   │                              │                            │
   │─ POST /api/.../share ────────│                            │
   │   {user_id: B} ──────────────→│── Link collaborators ─────│
   │                              │                            │
   │─ socket.emit('join_dashboard') →│                         │
   │    {dashboard_id: 123}        │── Add to room          ──│
   │                              │── Broadcast users      ──│
   │                              │← active_users ────────────│
   │                              │                            │
   │                         User B connects                   │
   │                              │                            │
   │                         ┌────▼────┐                      │
   │                         │ Join room│                      │
   │                         └────┬────┘                       │
   │                              │                            │
   │─ socket.emit('dashboard_update') ──────→│               │
   │    {state: {...}}            │         Save state  ─────│
   │                              │                            │
   │                              │─ Broadcast in room ────→  │
   │                              ├──────→ User A (self)       │
   │                              └──────→ User B (other)      │
   │                                                           │
   │─ socket.emit('send_comment') ────────→│                 │
   │    {text: "..."}              │      Save comment  ──────│
   │                              │                            │
   │                              │─ Broadcast comment ──────→
   │                              └──────→ Both users          │
```

### PWA/Offline Flow
```
User Browser              Service Worker              Network
     │                          │                         │
     │─ Page load ──────────────→│                        │
     │                    (Check cache)                    │
     │                          │                         │
     │◄─────────── Cached response (if available)────────│
     │                          │                         │
     ┌─ Offline mode          │                         │
     │  (Network unavailable)  │                         │
     │                          │                         │
     │─ Page request ──────────→│                        │
     │                    (Network failed)                │
     │                          │                         │
     │◄─────── Return from cache ───────────────────────│
     │                          │                         │
     └─ Back online           │                         │
        (Network restored)      │                         │
                                │─ Background Sync ───→│
                                │  (Upload queued data) │
                                │                         │
                                │◄ Resume normal ops───│
```

---

## Database Schema Relationships

```
users (existing)
  ├─ id (PK)
  ├─ username
  ├─ email
  └─ password_hash

  ▼ (FK)
  
shared_dashboards (new)
  ├─ id (PK)
  ├─ owner_id (FK → users.id)
  ├─ dashboard_name
  ├─ description
  ├─ share_token (unique)
  ├─ is_public
  ├─ created_at
  └─ updated_at
  
    ▼ (one-to-many)
    
  ├─► shared_dashboard_collaborators (new)
  │   ├─ id (PK)
  │   ├─ dashboard_id (FK)
  │   ├─ user_id (FK)
  │   ├─ permission_level (viewer/editor/admin)
  │   └─ added_at
  │
  ├─► dashboard_states (new)
  │   ├─ id (PK)
  │   ├─ dashboard_id (FK)
  │   ├─ user_id (FK)
  │   ├─ state_data (JSON)
  │   └─ saved_at
  │
  ├─► dashboard_comments (new)
  │   ├─ id (PK)
  │   ├─ dashboard_id (FK)
  │   ├─ user_id (FK)
  │   ├─ comment_text
  │   ├─ data_point
  │   ├─ created_at
  │   └─ updated_at
  │
  └─► collaboration_activity (new)
      ├─ id (PK)
      ├─ dashboard_id (FK)
      ├─ user_id (FK)
      ├─ activity_type
      ├─ activity_data
      └─ created_at
```

---

## Feature Interaction Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    FEATURE SYNERGIES                       │
└────────────────────────────────────────────────────────────┘

Advanced Charts + Collaboration:
  ┌──────────────────────┐
  │ Advanced Charts      │
  │ (/advanced-charts)   │
  └──────────┬───────────┘
             │
             │ Can be
             │ embedded in
             ▼
  ┌──────────────────────┐
  │ Shared Dashboard     │
  │ (Collaboration API)  │
  └──────────────────────┘
             │
             ├─ Multiple users view same chart
             ├─ Comments on data points
             └─ Real-time updates via WebSocket


Advanced Charts + PWA:
  ┌──────────────────────┐
  │ Advanced Charts      │
  │ (Web Page)           │
  └──────────┬───────────┘
             │
             │ Cached via
             │ Service Worker
             ▼
  ┌──────────────────────┐
  │ PWA Features         │
  │ (Offline)            │
  └──────────────────────┘
             │
             ├─ Works offline with cached data
             ├─ Charts still functional
             └─ Syncs when reconnected


Collaboration + PWA:
  ┌──────────────────────┐
  │ Real-time Collab     │
  │ (WebSocket)          │
  └──────────┬───────────┘
             │
             │ Enhanced by
             │ Service Worker
             ▼
  ┌──────────────────────┐
  │ PWA Features         │
  │ (Background Sync)    │
  └──────────────────────┘
             │
             ├─ Queued updates sync when online
             ├─ Offline comments saved
             └─ Pull changes when reconnected
```

---

## Component Interaction Timeline

```
Session Start
│
├─ 1. Initialize Flask app (app.py)
│
├─ 2. Register blueprints
│   ├─ collab_bp (collaboration routes)
│   └─ socketio handlers
│
├─ 3. Initialize database
│   ├─ Run init_db()
│   ├─ Create collaboration tables
│   └─ Create indexes
│
├─ 4. Start Flask server
│   ├─ Listen on port 5000
│   └─ Register routes
│
└─ 5. Ready for requests
   │
   User Interaction
   │
   ├─ Access /advanced-charts
   │  ├─ Load template
   │  ├─ Register Service Worker
   │  ├─ Fetch chart data (/api/analytics/custom)
   │  └─ Render charts
   │
   ├─ Create dashboard
   │  ├─ POST /api/collaboration/dashboard
   │  ├─ Create DB record
   │  └─ Return dashboard_id
   │
   ├─ Share dashboard
   │  ├─ POST /api/collaboration/dashboard/{id}/share
   │  ├─ Link users
   │  └─ Set permissions
   │
   ├─ Join collaboration
   │  ├─ socket.emit('join_dashboard')
   │  ├─ Add to WebSocket room
   │  └─ Broadcast active users
   │
   ├─ Real-time updates
   │  ├─ socket.emit('dashboard_update')
   │  ├─ Broadcast to room
   │  └─ All users see changes
   │
   └─ Offline functionality
      ├─ Service Worker intercepts requests
      ├─ Returns cached responses
      ├─ Queues updates
      └─ Syncs when reconnected
```

---

## Security Architecture

```
┌──────────────────────────────────────────────┐
│         SECURITY LAYERS                      │
└──────────────────────────────────────────────┘

Layer 1: Authentication
  ├─ Login required on /advanced-charts ✅
  ├─ Session validation on all API routes ✅
  ├─ Token expiration (24 hours) ✅
  └─ Secure password hashing ✅

Layer 2: Authorization
  ├─ Collaboration permission levels ✅
  │  ├─ viewer (read-only)
  │  ├─ editor (modify)
  │  └─ admin (full control)
  └─ Check permissions before API calls ✅

Layer 3: Data Protection
  ├─ Parameterized SQL queries ✅
  ├─ XSS protection (template escaping) ✅
  ├─ CSRF protection (CORS headers) ✅
  └─ Rate limiting on endpoints ✅

Layer 4: Network Security
  ├─ HTTPS recommended for production ✅
  ├─ Secure WebSocket (WSS) ✅
  ├─ CORS configuration ✅
  └─ Session secure cookies ✅

Layer 5: Data Validation
  ├─ Input sanitization ✅
  ├─ Type checking ✅
  ├─ Length limits ✅
  └─ Reject invalid data ✅
```

---

## Performance Optimization Strategy

```
┌──────────────────────────────────────────────┐
│         PERFORMANCE OPTIMIZATIONS            │
└──────────────────────────────────────────────┘

Charts:
  ├─ TradingView library (optimized) ✅
  ├─ Lazy loading of indicators ✅
  ├─ Limit to 1000 data points ✅
  └─ Cache OHLC calculations ✅

PWA/Caching:
  ├─ Service Worker cache strategy ✅
  ├─ Static asset compression ✅
  ├─ Browser cache headers ✅
  └─ Cache versioning ✅

Database:
  ├─ Indexes on foreign keys ✅
  ├─ Indexes on timestamp columns ✅
  ├─ Indexes on user_id columns ✅
  ├─ Query optimization ✅
  └─ Connection pooling ✅

WebSocket:
  ├─ Room-based broadcasting ✅
  ├─ Message debouncing ✅
  ├─ Connection limits ✅
  └─ Memory cleanup ✅

Frontend:
  ├─ Debounced updates (100ms) ✅
  ├─ Lazy loading images ✅
  ├─ CSS minification ✅
  └─ JS bundling ready ✅
```

---

**Architecture Documentation**  
**Created**: January 7, 2026  
**Version**: 1.0  
**Status**: Complete

