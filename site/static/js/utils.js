/*
================================================================================
                        SHARED UTILITIES
================================================================================
Common functions used across all modules: animations, color logic, API calls,
state management.
================================================================================
*/

/*
================================================================================
                      CONFIGURATION & CONSTANTS
================================================================================
*/
const MAX_POINTS = 25;
const DEFAULT_GOOD_THRESHOLD = 800;
const DEFAULT_MEDIUM_THRESHOLD = 1200;
const DEFAULT_BAD_THRESHOLD = 1200;
const POLLING_INTERVAL = 1000; // ms
const STATE_SYNC_INTERVAL = 2000; // ms
const OVERVIEW_REFRESH_INTERVAL = 5000; // ms
const CHART_ANIMATION_DURATION = 450; // ms
const VALUE_ANIMATION_DURATION = 500; // ms

/*
================================================================================
                        GLOBAL STATE
================================================================================
*/
let goodThreshold = DEFAULT_GOOD_THRESHOLD;
let mediumThreshold = DEFAULT_MEDIUM_THRESHOLD;
let badThreshold = DEFAULT_BAD_THRESHOLD;

let prevGoodThreshold = goodThreshold;
let prevBadThreshold = badThreshold;

let analysisRunning = true;
let bgFade = 1;
let sharedSettings = null; // Cached settings from WebSocket (populated by websocket.js)

// Theme management
let darkMode = localStorage.getItem("theme") !== "light";

// Alerts & trend tracking
let lastHourData = [];
let alertLog = [];
let lastBadAlert = null;

/*
================================================================================
                    UTILITY FUNCTIONS
================================================================================
*/

/**
 * Get cached settings from WebSocket (returns null if not cached yet)
 */
function getCachedSettings() {
  return sharedSettings;
}

/* ─────────────────────────────────────────────────────────────────────────── 
   Animation Easing
──────────────────────────────────────────────────────────────────────────── */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function forceLayout(el) {
  el.getBoundingClientRect();
}

/* ─────────────────────────────────────────────────────────────────────────── 
   Color & Value Interpolation
──────────────────────────────────────────────────────────────────────────── */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {
  return `rgb(
    ${Math.round(lerp(c1[0], c2[0], t))},
    ${Math.round(lerp(c1[1], c2[1], t))},
    ${Math.round(lerp(c1[2], c2[2], t))}
  )`;
}

function ppmColor(ppm) {
  if (goodThreshold === badThreshold) {
    return ppm < goodThreshold ? "#4ade80" : "#f87171";
  }

  if (ppm < goodThreshold) return "#4ade80";
  if (ppm < badThreshold) return "#facc15";
  return "#f87171";
}

function ppmColorSmooth(ppm) {
  const green = [74, 222, 128];
  const yellow = [250, 204, 21];
  const red = [248, 113, 113];

  if (ppm <= goodThreshold) return `rgb(${green})`;

  if (ppm <= badThreshold) {
    const t = (ppm - goodThreshold) / (badThreshold - goodThreshold);
    return lerpColor(green, yellow, t);
  }

  const t = Math.min((ppm - badThreshold) / badThreshold, 1);
  return lerpColor(yellow, red, t);
}

function qualityText(ppm) {
  if (goodThreshold === badThreshold) {
    return ppm < goodThreshold ? "Bon" : "Mauvais";
  }

  if (ppm < goodThreshold) return "Bon";
  if (ppm < badThreshold) return "Moyen";
  return "Mauvais";
}

/*
================================================================================
                      API & DATA FETCHING
================================================================================
*/

/* ─────────────────────────────────────────────────────────────────────────── 
   System State API
──────────────────────────────────────────────────────────────────────────── */
async function loadSystemState() {
  // Try to get cached settings from WebSocket first
  let s = getCachedSettings();
  
  // If not cached, use global thresholds (already set by loadSharedSettings())
  if (!s) {
    s = {
      analysis_running: analysisRunning,
      good_threshold: goodThreshold,
      bad_threshold: badThreshold
    };
  }
  
  return s;
}

/* ─────────────────────────────────────────────────────────────────────────── 
   Settings API
──────────────────────────────────────────────────────────────────────────── */
async function loadSharedSettings() {
  try {
    // Try to get cached settings from WebSocket first
    let s = getCachedSettings();
    
    // Fallback to HTTP if not cached
    if (!s) {
      const res = await fetch("/api/settings");
      s = await res.json();
      // Store in cache so other modules can use it
      sharedSettings = s;
    }

    // Update global state
    if (s.good_threshold !== undefined) {
      goodThreshold = s.good_threshold;
    }
    if (s.bad_threshold !== undefined) {
      badThreshold = s.bad_threshold;
      mediumThreshold = badThreshold;
    }
    if (s.analysis_running !== undefined) {
      analysisRunning = s.analysis_running;
    }
  } catch {
    console.warn("Failed to load shared settings");
  }
}

/* ─────────────────────────────────────────────────────────────────────────── 
   Live Data API
──────────────────────────────────────────────────────────────────────────── */
async function fetchLatestData() {
  const res = await fetch("/api/latest", {
    cache: "no-store",
  });
  return await res.json();
}

/* ─────────────────────────────────────────────────────────────────────────── 
   History API
──────────────────────────────────────────────────────────────────────────── */
async function fetchTodayHistory() {
  const res = await fetch("/api/history/today");
  return await res.json();
}

/*
================================================================================
                    AIR QUALITY LOGIC
================================================================================
*/

function getAirQuality(ppm) {
  if (ppm < goodThreshold) {
    return {
      level: "good",
      label: "Bon",
      advice: "Air sain",
      color: "var(--good)",
    };
  }

  if (ppm < badThreshold) {
    return {
      level: "medium",
      label: "Moyen",
      advice: "Air correct",
      color: "var(--medium)",
    };
  }

  return {
    level: "bad",
    label: "Mauvais",
    advice: "Aérez immédiatement",
    color: "var(--bad)",
  };
}

/*
================================================================================
                    SYSTEM STATE MANAGEMENT
================================================================================
*/

function updateNavAnalysisState(isRunning) {
  // Navbar
  const nav = document.getElementById("nav-analysis");
  const label = document.getElementById("nav-analysis-label");

  // Overview system pill
  const pill = document.querySelector(".system-pill");

  // Navbar update
  if (nav && label) {
    nav.classList.remove("is-running", "is-paused");

    if (isRunning) {
      nav.classList.add("is-running");
      label.textContent = "Analyse active";
    } else {
      nav.classList.add("is-paused");
      label.textContent = "Analyse en pause";
    }
  }

  // Overview pill update (safe even if not on overview page)
  if (pill) {
    pill.classList.toggle("running", isRunning);
    pill.classList.toggle("paused", !isRunning);
    pill.innerHTML = `<span class="dot"></span> ${
      isRunning ? "Analyse active" : "Analyse en pause"
    }`;
  }
}

function startSystemStateWatcher() {
  setInterval(async () => {
    try {
      const state = await loadSystemState();
      updateNavAnalysisState(state.analysis_running);
    } catch {
      console.warn("Failed to refresh system state");
    }
  }, STATE_SYNC_INTERVAL);
}

async function refreshSystemState() {
  try {
    const state = await loadSystemState();
    updateNavAnalysisState(state.analysis_running);
  } catch {
    console.warn("State sync failed");
  }
}

function initGlobalState() {
  refreshSystemState();
  setInterval(refreshSystemState, STATE_SYNC_INTERVAL);
}

/*
================================================================================
                      NAVBAR MANAGEMENT
================================================================================
*/

function initNavbar() {
  const navCenter = document.querySelector(".nav-center");
  const underline = document.querySelector(".nav-underline");
  const links = navCenter?.querySelectorAll("a");

  if (!navCenter || !underline || !links) return;

  const path = window.location.pathname;

  function getActiveLink() {
    return [...links].find((link) => link.getAttribute("href") === path);
  }

  function moveUnderline(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = navCenter.getBoundingClientRect();
    underline.style.width = `${r.width}px`;
    underline.style.left = `${r.left - p.left}px`;
    underline.style.opacity = "1";
  }

  // Initialize on load with active link
  const active = getActiveLink();
  if (active) {
    active.classList.add("active");
    // Wait for everything to be laid out and painted
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        moveUnderline(active);
      });
    });
  }

  // Move underline on hover
  links.forEach((l) => {
    l.addEventListener("mouseenter", () => moveUnderline(l));
  });

  // Return to active link on mouse leave
  navCenter.addEventListener("mouseleave", () => {
    const activeLink = getActiveLink();
    if (activeLink) moveUnderline(activeLink);
  });

  // Reposition on window resize
  window.addEventListener("resize", () => {
    const activeLink = getActiveLink();
    if (activeLink) moveUnderline(activeLink);
  });
}

/*
================================================================================
                      THEME MANAGEMENT
================================================================================
*/

function applyTheme(lightMode) {
  const root = document.documentElement;
  if (lightMode) {
    root.style.setProperty("--bg", "#ffffff");
    root.style.setProperty("--card", "#f3f4f6");
    root.style.setProperty("--text", "#111827");
    root.style.setProperty("--muted", "#6b7280");
    root.style.setProperty("--good", "#059669");
    root.style.setProperty("--medium", "#d97706");
    root.style.setProperty("--bad", "#dc2626");
    document.documentElement.style.setProperty("--border-light", "rgba(0,0,0,0.1)");
    document.documentElement.style.setProperty("--border-dark", "rgba(0,0,0,0.06)");
    darkMode = false;
    localStorage.setItem("theme", "light");
  } else {
    root.style.setProperty("--bg", "#0b0d12");
    root.style.setProperty("--card", "#141826");
    root.style.setProperty("--text", "#e5e7eb");
    root.style.setProperty("--muted", "#9ca3af");
    root.style.setProperty("--good", "#4ade80");
    root.style.setProperty("--medium", "#facc15");
    root.style.setProperty("--bad", "#f87171");
    document.documentElement.style.setProperty("--border-light", "rgba(255,255,255,0.08)");
    document.documentElement.style.setProperty("--border-dark", "rgba(255,255,255,0.06)");
    darkMode = true;
    localStorage.setItem("theme", "dark");
  }
}

// Apply saved theme on load
applyTheme(darkMode === false);

// Expose for settings page
window.applyTheme = applyTheme;
window.getDarkMode = () => darkMode;

/*
================================================================================
                      ALERT & TREND MANAGEMENT
================================================================================
*/

function addAlert(type, message, value) {
  const event = {
    type, // 'threshold', 'pause', 'resume'
    message,
    value,
    timestamp: new Date(),
  };
  alertLog.unshift(event); // Add to front
  if (alertLog.length > 10) alertLog.pop(); // Keep last 10

  // Dispatch custom event for panels to update
  window.dispatchEvent(new CustomEvent("alert-updated", { detail: event }));
}

function getTrendPercent() {
  if (!lastHourData || lastHourData.length < 2) return 0;
  const oldest = lastHourData[0];
  const newest = lastHourData[lastHourData.length - 1];
  const change = ((newest - oldest) / oldest) * 100;
  return Math.round(change);
}

function pushToHourly(ppm) {
  lastHourData.push(ppm);
  // Keep only 60 readings (roughly 1 minute at 1s intervals, scaled for different speeds)
  if (lastHourData.length > 60) lastHourData.shift();
}

/*
================================================================================
                      TOAST NOTIFICATIONS
================================================================================
*/
function showToast(message, type = 'info', duration = 3000) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9998;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 360px;
    `;
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const bgColor = type === 'success' ? 'rgba(61, 217, 143, 0.15)' :
                  type === 'error' ? 'rgba(239, 83, 80, 0.15)' :
                  type === 'warning' ? 'rgba(249, 199, 79, 0.15)' :
                  'rgba(77, 184, 255, 0.15)';
  
  const borderColor = type === 'success' ? 'rgba(61, 217, 143, 0.4)' :
                      type === 'error' ? 'rgba(239, 83, 80, 0.4)' :
                      type === 'warning' ? 'rgba(249, 199, 79, 0.4)' :
                      'rgba(77, 184, 255, 0.4)';
  
  const textColor = type === 'success' ? '#3dd98f' :
                    type === 'error' ? '#ef5350' :
                    type === 'warning' ? '#f9c74f' :
                    '#4db8ff';
  
  const icon = type === 'success' ? '✓' :
               type === 'error' ? '✕' :
               type === 'warning' ? '⚠' :
               'ℹ';
  
  toast.style.cssText = `
    background: ${bgColor};
    border: 1px solid ${borderColor};
    color: ${textColor};
    padding: 14px 16px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideInRight 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;
  
  toast.innerHTML = `<span style="font-size: 1.1rem;">${icon}</span><span>${message}</span>`;
  
  toastContainer.appendChild(toast);
  
  // Auto-remove after duration
  const timeout = setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
  
  // Allow manual dismiss
  toast.addEventListener('click', () => {
    clearTimeout(timeout);
    toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  });
  
  return toast;
}

/*
================================================================================
                      INITIALIZATION BOOTSTRAP
================================================================================
*/
// Bootstrapping now lives in main.js to avoid double initialization here.
