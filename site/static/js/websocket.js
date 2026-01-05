/*
================================================================================
                          WEBSOCKET MODULE
================================================================================
Real-time WebSocket communication with Flask backend using Socket.IO.
Replaces polling with push-based updates for live CO₂ data.
================================================================================
*/

let socket = null;
let wsConnected = false;
// NOTE: sharedSettings is declared in utils.js and populated here

/**
 * Initialize WebSocket connection
 */
function initWebSocket() {
  if (socket !== null) return; // Already connected
  
  socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    transports: ['websocket', 'polling']
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Connection Events
  // ─────────────────────────────────────────────────────────────────────────
  
  socket.on('connect', () => {
    wsConnected = true;
    console.log('✓ WebSocket connected:', socket.id);
    updateWSIndicator(true);
    // If live page polling is running, stop it to avoid duplicate updates
    if (window.stopPolling) {
      try { window.stopPolling(); } catch (e) {}
    }
    // Pause global state polling since WebSocket will push updates
    if (window.pauseStateRefresh) {
      try { window.pauseStateRefresh(); } catch (e) {}
    }
  });

  socket.on('disconnect', () => {
    wsConnected = false;
    console.log('✗ WebSocket disconnected');
    updateWSIndicator(false);
    // If live page is present, resume polling fallback
    if (window.startPolling) {
      try { window.startPolling(); } catch (e) {}
    }
    // Resume global state polling when WebSocket is down
    if (window.resumeStateRefresh) {
      try { window.resumeStateRefresh(); } catch (e) {}
    }
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    updateWSIndicator(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Data Events
  // ─────────────────────────────────────────────────────────────────────────
  
  socket.on('co2_update', (data) => {
    // Handle CO₂ update from server
    if (window.handleCO2Update) {
      window.handleCO2Update(data);
    }
    
    // Also notify overview page
    if (window.handleOverviewCO2Update) {
      window.handleOverviewCO2Update(data);
    }
  });

  socket.on('settings_update', (settings) => {
    // Cache settings and propagate to all modules
    sharedSettings = settings;
    console.log('📋 Settings updated via WebSocket:', settings);
    
    // ✅ UPDATE GLOBAL STATE IMMEDIATELY
    if (settings.good_threshold !== undefined) {
      goodThreshold = settings.good_threshold;
    }
    if (settings.bad_threshold !== undefined) {
      badThreshold = settings.bad_threshold;
    }
    if (settings.analysis_running !== undefined) {
      analysisRunning = settings.analysis_running;
      // Update nav status when analysis state changes
      if (window.updateNavAnalysisState) {
        window.updateNavAnalysisState(analysisRunning, settings.pause_reason);
      }
    }
    
    if (window.handleSettingsUpdate) {
      window.handleSettingsUpdate(settings);
    }
    
    // Also notify overview page of settings changes
    if (window.handleOverviewSettings) {
      window.handleOverviewSettings(settings);
    }
  });

  socket.on('status', (data) => {
    console.log('Server status:', data);
  });
}

/**
 * Close WebSocket connection
 */
function closeWebSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    wsConnected = false;
  }
}

/**
 * Send settings change to server
 */
function sendSettingsChange(settings) {
  if (wsConnected && socket) {
    socket.emit('settings_change', settings);
  }
}

/**
 * Request latest CO₂ data
 */
function requestLatestData() {
  if (wsConnected && socket) {
    socket.emit('request_data');
  }
}

/**
 * Update WebSocket connection indicator in navbar
 */
function updateWSIndicator(connected) {
  // Update the navbar status using the centralized function
  if (window.updateNavAnalysisState) {
    // Trigger a refresh of the navbar state
    if (window.refreshSystemState) {
      window.refreshSystemState();
    }
  }
  
  // Toggle polling fallback on WS state
  if (!connected && window.startPolling) {
    try { window.startPolling(); } catch (e) {}
  }
  if (connected && window.stopPolling) {
    try { window.stopPolling(); } catch (e) {}
  }
}

/**
 * Check if WebSocket is connected
 */
function isWSConnected() {
  return wsConnected && socket && socket.connected;
}

// Initialize WebSocket when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initWebSocket();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  closeWebSocket();
});

