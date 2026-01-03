/*
================================================================================
                  MORPHEUS CO₂ MONITORING - ENTRY POINT
================================================================================
Main application entry point that coordinates module loading and initialization.
Individual pages load their own feature modules (live.js, overview.js, etc).

Module loading order (see base.html):
  1. utils.js       - Shared utilities, constants, state management
  2. settings.js    - Settings page functionality
  3. analytics.js   - Analytics page functionality
  4. live.js        - Live page functionality
  5. overview.js    - Overview/home page functionality
  6. main.js        - This file (minimal entry point)
================================================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initThemeToggle();
  initGlobalState();
  initWebSocket(); // Initialize WebSocket connection
  initNavSparkline();
  initKeyboardShortcuts();
});

// Bootstrap application
(async () => {
  // Load shared settings and initialize global state
  await loadSharedSettings();
  const state = await loadSystemState();
  updateNavAnalysisState(state.analysis_running);

  // Start system state watcher for navbar updates
  startSystemStateWatcher();

  // Initialize analytics CSV import if on analytics page
  initAnalyticsCSVImport();

  // Initialize page-specific modules
  if (isLivePage) initLivePage();
  if (isOverviewPage) {
    // Initialize overview update speed from settings
    const ovSettings = getCachedSettings();
    if (ovSettings && ovSettings.overview_update_speed) {
      overviewUpdateSpeed = ovSettings.overview_update_speed;
    }
    startOverviewRefresh(); // Use dynamic interval based on settings
  }

  console.log("✓ Morpheus app loaded");
  console.log("🔧 Settings loaded:", getCachedSettings());
})();

/*
================================================================================
                      THEME TOGGLE
================================================================================
*/

function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  if (!toggleBtn) return;

  const icon = toggleBtn.querySelector(".theme-icon");
  const isDark = localStorage.getItem("theme") !== "light";
  
  // Set initial icon
  icon.textContent = isDark ? "🌙" : "☀️";

  toggleBtn.addEventListener("click", () => {
    const currentDark = localStorage.getItem("theme") !== "light";
    applyTheme(currentDark); // Toggle to opposite
    icon.textContent = localStorage.getItem("theme") === "light" ? "☀️" : "🌙";
  });
}

/*
================================================================================
                      NAVBAR SPARKLINE (PPM)
================================================================================
*/

const NAV_SPARK_MAX = 40;
let navSparkValues = [];

function drawNavSparkline() {
  const canvas = document.getElementById("nav-ppm-spark");
  const valueEl = document.getElementById("nav-ppm-value");
  if (!canvas || !valueEl || !navSparkValues.length) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const min = Math.min(...navSparkValues);
  const max = Math.max(...navSparkValues);
  const range = Math.max(max - min, 1);

  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 2;
  ctx.beginPath();

  navSparkValues.forEach((v, i) => {
    const x = (i / Math.max(navSparkValues.length - 1, 1)) * (w - 2) + 1;
    const norm = (v - min) / range;
    const y = h - norm * (h - 2) - 1;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function pushNavPpm(ppm) {
  const valueEl = document.getElementById("nav-ppm-value");
  if (valueEl && typeof ppm === "number") {
    valueEl.textContent = `${ppm} ppm`;
  }

  if (typeof ppm !== "number" || Number.isNaN(ppm)) return;
  navSparkValues.push(ppm);
  if (navSparkValues.length > NAV_SPARK_MAX) navSparkValues.shift();
  drawNavSparkline();
}

window.pushNavPpm = pushNavPpm;

async function initNavSparkline() {
  const canvas = document.getElementById("nav-ppm-spark");
  const valueEl = document.getElementById("nav-ppm-value");
  if (!canvas || !valueEl) return;

  try {
    const res = await fetch("/api/history/latest/40");
    const data = await res.json();
    const values = data.map((d) => d.ppm).filter((v) => typeof v === "number" && !Number.isNaN(v));
    navSparkValues = values.slice(-NAV_SPARK_MAX);
    if (navSparkValues.length) {
      valueEl.textContent = `${navSparkValues[navSparkValues.length - 1]} ppm`;
    }
    drawNavSparkline();
  } catch (e) {
    console.warn("Nav sparkline load failed", e);
  }
}

/*
================================================================================
                      KEYBOARD SHORTCUTS
================================================================================
*/

function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Ctrl+S: Save settings (if on settings page)
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      const saveBtn = document.getElementById("save-settings");
      if (saveBtn && !saveBtn.disabled) {
        saveBtn.click();
      }
    }

    // Ctrl+E: Export live data (if on live page)
    if ((e.ctrlKey || e.metaKey) && e.key === "e") {
      e.preventDefault();
      const exportBtn = document.getElementById("export");
      if (exportBtn && !exportBtn.disabled) {
        exportBtn.click();
      }
    }

    // Ctrl+Shift+K: Toggle live smoothing (if on live page)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "k") {
      e.preventDefault();
      const smoothToggle = document.getElementById("toggle-smooth");
      if (smoothToggle) {
        smoothToggle.checked = !smoothToggle.checked;
        smoothToggle.dispatchEvent(new Event("change"));
      }
    }

    // Ctrl+Shift+T: Toggle theme
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "t") {
      e.preventDefault();
      applyTheme(darkMode === true);
    }

    // Ctrl+H: Show keyboard help
    if ((e.ctrlKey || e.metaKey) && e.key === "h") {
      e.preventDefault();
      showKeyboardHelp();
    }
  });
}

/*
================================================================================
                      TREND DISPLAY UPDATES
================================================================================
*/

function updateNavTrendDisplay() {
  const trend = getTrendPercent();
  if (!trend) return;

  const label = document.getElementById("nav-transport-label");
  if (!label) return;

  const trendText = trend > 0 ? `↑ +${trend}%` : trend < 0 ? `↓ ${trend}%` : "→ 0%";
  const trendColor = trend > 10 ? "#f87171" : trend < -10 ? "#4ade80" : "#facc15";
  
  // Show trend after current text
  if (!label.querySelector(".trend-badge")) {
    const badge = document.createElement("span");
    badge.className = "trend-badge";
    badge.style.cssText = `
      display: inline-block;
      margin-left: 6px;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
      color: ${trendColor};
      background: ${trendColor}22;
      font-weight: 600;
    `;
    badge.textContent = trendText;
    label.appendChild(badge);
  } else {
    const badge = label.querySelector(".trend-badge");
    badge.textContent = trendText;
    badge.style.color = trendColor;
    badge.style.background = trendColor + "22";
  }
}

setInterval(updateNavTrendDisplay, 5000);

/*
================================================================================
                      ALERT LOG SIDEBAR
================================================================================
*/

function initAlertLog() {
  const alertPanel = document.createElement("div");
  alertPanel.id = "alert-log-panel";
  alertPanel.style.cssText = `
    position: fixed; right: 0; top: 60px; width: 320px; max-width: 100%;
    height: calc(100vh - 60px); overflow-y: auto;
    background: rgba(20,24,38,0.95); border-left: 1px solid var(--border-light);
    padding: 0; z-index: 9998;
    transform: translateX(320px); transition: transform 0.3s ease;
    font-size: 0.85rem; display: flex; flex-direction: column;
  `;
  document.body.appendChild(alertPanel);

  // Header with close button
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1);
    display: flex; justify-content: space-between; align-items: center;
    flex-shrink: 0; background: rgba(0,0,0,0.2);
  `;
  header.innerHTML = `<h3 style="margin: 0; font-size: 0.95rem; font-weight: 600;">Alertes</h3>`;
  
  const closeBtn = document.createElement("button");
  closeBtn.className = "alert-log-close";
  closeBtn.textContent = "✕";
  closeBtn.title = "Fermer";
  header.appendChild(closeBtn);
  alertPanel.appendChild(header);

  // Alert entries container
  const alertsContainer = document.createElement("div");
  alertsContainer.style.cssText = `
    padding: 16px; overflow-y: auto; flex: 1;
  `;
  alertPanel.appendChild(alertsContainer);

  // Toggle button in bottom right as floating action button
  const toggleBtn = document.createElement("button");
  toggleBtn.style.cssText = `
    position: fixed; right: 24px; bottom: 24px; z-index: 9997;
    background: linear-gradient(135deg, #4ade80, #22c55e);
    border: none; color: #0b0d12; padding: 14px 18px; border-radius: 50px;
    cursor: pointer; font-weight: 700; font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
    transition: all 0.3s ease; display: flex; align-items: center; gap: 6px;
    hover: box-shadow 0 6px 20px rgba(74, 222, 128, 0.4);
  `;
  toggleBtn.textContent = "🔔";
  toggleBtn.title = "Afficher les alertes";
  toggleBtn.addEventListener("mouseenter", () => {
    toggleBtn.style.boxShadow = "0 6px 20px rgba(74, 222, 128, 0.4)";
    toggleBtn.style.transform = "scale(1.1)";
  });
  toggleBtn.addEventListener("mouseleave", () => {
    toggleBtn.style.boxShadow = "0 4px 12px rgba(74, 222, 128, 0.3)";
    toggleBtn.style.transform = "scale(1)";
  });
  document.body.appendChild(toggleBtn);

  let panelOpen = false;
  toggleBtn.addEventListener("click", () => {
    panelOpen = !panelOpen;
    alertPanel.style.transform = panelOpen ? "translateX(0)" : "translateX(320px)";
  });

  closeBtn.addEventListener("click", () => {
    panelOpen = false;
    alertPanel.style.transform = "translateX(320px)";
  });

  // Update panel on alert
  window.addEventListener("alert-updated", (e) => {
    const { type, message, value, timestamp } = e.detail;
    const entry = document.createElement("div");
    entry.style.cssText = `
      padding: 8px; margin-bottom: 8px; background: rgba(255,255,255,0.05);
      border-left: 3px solid ${type === "threshold" ? "#f87171" : "#4ade80"};
      border-radius: 4px; color: var(--text);
    `;
    entry.innerHTML = `
      <div style="font-weight: 600; font-size: 0.8rem;">${message}</div>
      <div style="color: var(--muted); font-size: 0.75rem; margin-top: 2px;">
        ${value ? value + " ppm · " : ""}${timestamp.toLocaleTimeString()}
      </div>
    `;
    alertsContainer.insertBefore(entry, alertsContainer.firstChild);
    
    // Keep only 10 entries
    while (alertsContainer.children.length > 10) {
      alertsContainer.removeChild(alertsContainer.lastChild);
    }
  });
}

initAlertLog();
/*
================================================================================
                   NOTIFICATION SYSTEM
================================================================================
*/

function showNotification(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `notification-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

window.showNotification = showNotification;

/*
================================================================================
                   ERROR HANDLING & FEEDBACK
================================================================================
*/

function handleAPIError(error, context = '') {
  console.error(`[${context}]`, error);
  const message = error.message || 'Une erreur est survenue';
  showNotification(`❌ ${message}`, 'error', 4000);
}

window.handleAPIError = handleAPIError;

/*
================================================================================
                   EMPTY STATE DETECTION
================================================================================
*/

function createEmptyState(icon, title, message) {
  const state = document.createElement('div');
  state.className = 'empty-state';
  state.innerHTML = `
    <div class="empty-state-icon">${icon}</div>
    <div class="empty-state-title">${title}</div>
    <div class="empty-state-message">${message}</div>
  `;
  return state;
}

window.createEmptyState = createEmptyState;

/*
================================================================================
                   TREND INDICATORS
================================================================================
*/

let lastTrendValue = null;

function updateTrendIndicator(currentValue, previousValue) {
  if (!currentValue || !previousValue) return null;
  const change = currentValue - previousValue;
  const percent = Math.round((change / previousValue) * 100);
  lastTrendValue = percent;
  return percent;
}

function getTrendIcon(percent) {
  if (!percent) return '→';
  return percent > 0 ? '↑' : '↓';
}

function getTrendColor(percent) {
  if (!percent) return '#facc15'; // neutral yellow
  // For CO2: higher is worse, so positive = red, negative = green
  return percent > 0 ? '#f87171' : '#4ade80';
}

window.updateTrendIndicator = updateTrendIndicator;
window.getTrendIcon = getTrendIcon;
window.getTrendColor = getTrendColor;

/*
================================================================================
                   KEYBOARD SHORTCUTS DOCUMENTATION
================================================================================
*/

function showKeyboardHelp() {
  const help = `
    ⌨️ RACCOURCIS CLAVIER
    ═══════════════════════════════════════════
    Ctrl+H      • Afficher cette aide
    Ctrl+S      • Sauvegarder les paramètres
    Ctrl+E      • Exporter les données (page live)
    Ctrl+Shift+K • Lisser le graphique (page live)
    Ctrl+Shift+T • Basculer le thème (clair/sombre)
    Escape      • Fermer les panneaux ouverts
  `;
  showNotification(help, 'info', 5000);
}

window.showKeyboardHelp = showKeyboardHelp;

// Add Escape key handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close alert panel if open
    const alertPanel = document.getElementById('alert-log-panel');
    if (alertPanel && alertPanel.style.transform === 'translateX(0)') {
      alertPanel.style.transform = 'translateX(320px)';
    }
  }
});

/*
================================================================================
                   SETTINGS PERSISTENCE
================================================================================
*/

function saveUserPreferences(key, value) {
  try {
    localStorage.setItem(`pref_${key}`, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('Failed to save preference:', e);
    return false;
  }
}

function loadUserPreferences(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(`pref_${key}`);
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.warn('Failed to load preference:', e);
    return defaultValue;
  }
}

window.saveUserPreferences = saveUserPreferences;
window.loadUserPreferences = loadUserPreferences;

/*
================================================================================
                   ACCESSIBILITY IMPROVEMENTS
================================================================================
*/

// Add keyboard focus visible styles
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    document.body.style.outlineOffset = '2px';
  }
});

document.addEventListener('click', () => {
  document.body.style.outlineOffset = '-2px';
});

// ARIA live region for status updates
function createLiveRegion() {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  region.style.display = 'none';
  region.id = 'aria-live-region';
  document.body.appendChild(region);
  return region;
}

const liveRegion = createLiveRegion();

function announceToScreenReaders(message) {
  liveRegion.textContent = message;
}

window.announceToScreenReaders = announceToScreenReaders;

/*
================================================================================
                   PERFORMANCE MONITORING
================================================================================
*/

function logPerformanceMetric(name, duration) {
  if (window.performance && window.performance.mark) {
    console.debug(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }
}

window.logPerformanceMetric = logPerformanceMetric;

/*
================================================================================
                   ENHANCED KEYBOARD SHORTCUTS WITH HELP
================================================================================
*/

const originalInitKeyboardShortcuts = initKeyboardShortcuts;

function initKeyboardShortcuts() {
  originalInitKeyboardShortcuts();

  // Add ? key for help
  document.addEventListener("keydown", (e) => {
    if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      // Check if focus is not in an input
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        showKeyboardHelp();
      }
    }
  });
}

/*
================================================================================
                   INITIAL SETUP & VERIFICATION
================================================================================
*/

// Verify theme persistence on load
(function verifyThemePersistence() {
  const savedTheme = localStorage.getItem('theme');
  const currentTheme = document.documentElement.style.getPropertyValue('--bg');
  if (savedTheme && !currentTheme) {
    applyTheme(savedTheme === 'light');
  }
})();

// Log session start
console.log('✨ Aerium session started', new Date().toLocaleTimeString());