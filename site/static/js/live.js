/*
================================================================================
                        LIVE PAGE MODULE
================================================================================
Real-time CO₂ monitoring: chart, animations, polling, live data updates.
================================================================================
*/

let chart;
let lastPPM = null;
let lastCo2Timestamp = null; // used to dedupe rapid duplicate updates
let lastQualityPPM = null;
let lastRotation = 0;
let pollingDelay = POLLING_INTERVAL;
let pollInterval = null;
let analysisRunningLocal = true;
let useWebSocket = true; // Use WebSocket by default

let smoothEnabled = false;
let outliersEnabled = false;
let recentValues = [];

let audioEnabled = localStorage.getItem("audioAlerts") !== "false";
let lastBadAlertTime = 0;

const valueEl = document.getElementById("value");
const trendEl = document.getElementById("trend");
const qualityEl = document.getElementById("quality");
const chartCanvas = document.getElementById("chart");
const pausedOverlay = document.getElementById("paused-overlay");
const exportBtn = document.getElementById("export");
const resetBtn = document.getElementById("reset-btn");
const smoothToggle = document.getElementById("toggle-smooth");
const outlierToggle = document.getElementById("toggle-outliers");

const isLivePage = !!(valueEl && qualityEl && chartCanvas);

// Smooth & Outlier toggles
if (isLivePage) {
  smoothToggle?.addEventListener("change", () => { smoothEnabled = smoothToggle.checked; });
  outlierToggle?.addEventListener("change", () => { outliersEnabled = outlierToggle.checked; });
}

/* ─────────────────────────────────────────────────────────────────────────── 
   Alert Notifications
──────────────────────────────────────────────────────────────────────────── */

function playAlertSound() {
  if (!audioEnabled) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.frequency.value = 800; // Hz
  osc.type = "sine";
  
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

function showAlertNotification(message, level = "warning") {
  if (!isLivePage) return;

  // Visual alert
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed; top: 80px; right: 20px; z-index: 10000;
    background: ${level === "critical" ? "#f87171" : "#facc15"};
    color: #0b0d12;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: 600;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 4000);
  
  // Desktop notification if available
  if (Notification.permission === "granted") {
    new Notification("Morpheus CO₂ Alert", {
      body: message,
      icon: level === "critical" ? "🔴" : "🟡",
    });
  }
  
  // Audio alert
  playAlertSound();
}

/*
================================================================================
                      CHART PLUGIN & SETUP
================================================================================
*/

/* ─────────────────────────────────────────────────────────────────────────── 
   Chart Background Plugin (Zone Visualization)
──────────────────────────────────────────────────────────────────────────── */
const zoneBackgroundPlugin = {
  id: "zoneBackground",
  beforeDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;

    const { top, bottom, left, right } = chartArea;
    const y = scales.y;

    const good = prevGoodThreshold + (goodThreshold - prevGoodThreshold) * bgFade;
    const bad = prevBadThreshold + (badThreshold - prevBadThreshold) * bgFade;

    const yGood = y.getPixelForValue(good);
    const yBad = y.getPixelForValue(bad);

    const gradient = ctx.createLinearGradient(0, top, 0, bottom);
    const gStop = (yGood - top) / (bottom - top);
    const bStop = (yBad - top) / (bottom - top);

    if (good === bad) {
      gradient.addColorStop(0, "rgba(248,113,113,0.20)");
      gradient.addColorStop(bStop, "rgba(248,113,113,0.15)");
      gradient.addColorStop(bStop, "rgba(74,222,128,0.18)");
      gradient.addColorStop(1, "rgba(74,222,128,0.12)");
    } else {
      gradient.addColorStop(0, "rgba(248,113,113,0.20)");
      gradient.addColorStop(bStop, "rgba(248,113,113,0.15)");
      gradient.addColorStop(bStop, "rgba(250,204,21,0.18)");
      gradient.addColorStop(gStop, "rgba(250,204,21,0.15)");
      gradient.addColorStop(gStop, "rgba(74,222,128,0.18)");
      gradient.addColorStop(1, "rgba(74,222,128,0.12)");
    }

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(left, top, right - left, bottom - top);
    ctx.restore();
  },
};

if (typeof Chart !== "undefined") {
  Chart.register(zoneBackgroundPlugin);
}

/* ─────────────────────────────────────────────────────────────────────────── 
   Chart Creation
──────────────────────────────────────────────────────────────────────────── */
function createChart() {
  chart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "CO₂",
          data: [],
          normalized: true,
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          backgroundColor: "rgba(11,13,18,0.30)",
          borderColor: "#9ca3af",

          animations: {
            y: {
              from: (ctx) => {
                if (!ctx || ctx.parsed == null) return undefined;

                const data = ctx.chart.data.datasets[0].data;
                const i = ctx.dataIndex;

                if (i === data.length - 1 && data.length > 1) {
                  return data[i - 1];
                }

                return ctx.parsed.y;
              },
              duration: 400,
              easing: "easeOutCubic",
            },

            fill: {
              duration: 0,
            },
          },

          segment: {
            borderColor: (ctx) => {
              const v = ctx.p1?.parsed?.y;
              return v == null ? "#9ca3af" : ppmColor(v);
            },
          },
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBorderColor: "#0b0d12",
          pointBackgroundColor: (ctx) => {
            const v = ctx.parsed?.y;
            return v == null ? "#9ca3af" : ppmColor(v);
          },
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 0 },
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          min: 400,
          max: 2000,
          animation: false,
          grid: { color: "rgba(255,255,255,0.06)" },
        },
        x: {
          animation: false,
          grid: { color: "rgba(255,255,255,0.04)" },
        },
      },
    },
  });
}

/* ─────────────────────────────────────────────────────────────────────────── 
   Chart Updates
──────────────────────────────────────────────────────────────────────────── */
function updateChart(ppm, timestamp) {
  if (!chart) return;

  // Prefer server-provided timestamp for consistent labels across views
  const timeLabel = timestamp
    ? new Date(timestamp).toLocaleTimeString()
    : new Date(Date.now()).toLocaleTimeString();

  chart.data.labels.push(timeLabel);
  chart.data.datasets[0].data.push(ppm);

  chart.update({ duration: 0 });

  if (chart.data.labels.length > MAX_POINTS) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
    chart.update("none");
  }
}

/*
================================================================================
                      OVERLAY & UI
================================================================================
*/

function showPausedOverlay() {
  pausedOverlay?.classList.add("active");
  valueEl.textContent = "⏸";
  valueEl.style.color = "#9ca3af";
  trendEl.textContent = "";
  qualityEl.textContent = "Analyse en pause";
  qualityEl.style.color = "#9ca3af";
  qualityEl.style.background = "rgba(255,255,255,0.08)";
}

function hidePausedOverlay() {
  pausedOverlay?.classList.remove("active");
}

/*
================================================================================
                      ANIMATIONS
================================================================================
*/

function animateValue(ppm) {
  if (lastPPM === null) {
    valueEl.textContent = `${ppm} ppm`;
    valueEl.style.color = ppmColor(ppm);
    lastPPM = ppm;
    return;
  }

  const start = lastPPM;
  const startTime = performance.now();

  function frame(time) {
    const t = Math.min((time - startTime) / CHART_ANIMATION_DURATION, 1);
    const eased = easeOutCubic(t);
    const current = Math.round(start + (ppm - start) * eased);
    valueEl.textContent = `${current} ppm`;
    if (t < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
  valueEl.style.color = ppmColor(ppm);

  lastPPM = ppm;
}

function updateTrend(prev, current) {
  if (prev === null) return;

  let target = current > prev ? -45 : current < prev ? 45 : 0;
  if (target <= lastRotation) target += 360;

  trendEl.style.transform = `rotate(${target}deg)`;
  trendEl.style.color = ppmColor(current);
  lastRotation = target;
}

function animateQuality(ppm) {
  if (!qualityEl) return;

  const color = ppmColor(ppm);
  const label = qualityText(ppm);

  qualityEl.textContent = label;
  qualityEl.style.color = color;
  qualityEl.style.background = color + "22";
  qualityEl.style.border = `1px solid ${color}55`;
  qualityEl.style.boxShadow = `0 0 12px ${color}33`;

  if (
    lastQualityPPM !== null &&
    lastQualityPPM < badThreshold &&
    ppm >= badThreshold
  ) {
    qualityEl.classList.add("blink-warning");
    setTimeout(() => qualityEl.classList.remove("blink-warning"), 900);
  }

  lastQualityPPM = ppm;
}

/*
================================================================================
                      SETTINGS & POLLING
================================================================================
*/

async function loadLiveSettings() {
  // Use cached settings (already loaded by loadSharedSettings() in main.js)
  let s = getCachedSettings();
  
  // If still not cached (shouldn't happen), use global thresholds already set by loadSharedSettings()
  if (!s) {
    return; // Use already-set global thresholds
  }

  prevGoodThreshold = goodThreshold;
  prevBadThreshold = badThreshold;

  goodThreshold = Math.min(s.good_threshold, 2000 - 50);
  badThreshold = Math.min(s.bad_threshold, 2000);

  updatePollingSpeed(s.update_speed || 1);

  bgFade = 0;

  const start = performance.now();
  const duration = 500;

  function animateFade(time) {
    const t = Math.min((time - start) / duration, 1);
    bgFade = easeOutCubic(t);
    chart.update("none");
    if (t < 1) requestAnimationFrame(animateFade);
  }

  requestAnimationFrame(animateFade);
}

function startPolling() {
  // Use WebSocket for live updates (no polling needed)
  if (useWebSocket && isWSConnected()) {
    console.log("✓ Using WebSocket for live updates");
    return;
  }
  
  // Fallback to polling if WebSocket not available
  if (!analysisRunningLocal) return;
  stopPolling();
  console.log("⚠ Falling back to polling (WebSocket not available)");
  pollInterval = setInterval(poll, pollingDelay);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// Expose for websocket.js fallback hooks
window.startPolling = startPolling;
window.stopPolling = stopPolling;

function updatePollingSpeed(seconds) {
  pollingDelay = seconds * 1000;
  // Only restart polling if not using WebSocket
  if (!useWebSocket || !isWSConnected()) {
    startPolling();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// WebSocket Handler for CO₂ Updates
// ─────────────────────────────────────────────────────────────────────────

window.handleCO2Update = function(data) {
  if (!isLivePage) return;

  // Deduplicate updates coming from both request-response and broadcast
  try {
    if (data && data.timestamp) {
      if (data.timestamp === lastCo2Timestamp) return;
      lastCo2Timestamp = data.timestamp;
    }
  } catch (e) {
    // ignore
  }

  /* ⏸ PAUSE HANDLING */
  if (data.analysis_running === false) {
    analysisRunningLocal = false;
    updateNavAnalysisState(false);
    hidePausedOverlay();
    showPausedOverlay();
    stopPolling();
    return;
  }

  /* ▶️ RESUME HANDLING */
  if (!analysisRunningLocal && data.analysis_running === true) {
    analysisRunningLocal = true;
    updateNavAnalysisState(true);
    hidePausedOverlay();
    startPolling();
  }

  if (!analysisRunningLocal) return;

  hidePausedOverlay();

  if (!data || data.ppm == null) return;

  let ppm = data.ppm;

  // Apply outlier filtering
  if (outliersEnabled && lastPPM !== null) {
    const threshold = lastPPM * 0.2; // Cap at +20%
    if (ppm > lastPPM + threshold) {
      ppm = lastPPM + threshold;
    }
  }

  // Apply smoothing (3-point moving average)
  if (smoothEnabled) {
    recentValues.push(ppm);
    if (recentValues.length > 3) recentValues.shift();
    ppm = Math.round(recentValues.reduce((a, b) => a + b, 0) / recentValues.length);
  }

  console.log("📊 New PPM (WebSocket):", ppm);

  // Track hourly trends
  pushToHourly(ppm);
  
  // Check for threshold alerts
  const now = Date.now();
  if (lastPPM !== null) {
    if (lastPPM < badThreshold && ppm >= badThreshold) {
      // Just crossed into bad zone
      showAlertNotification(`⚠️ Air dégradé: ${ppm} ppm`, "critical");
      addAlert("threshold", "Dépassement du seuil mauvais", ppm);
      lastBadAlertTime = now;
    } else if (lastPPM >= badThreshold && ppm < badThreshold) {
      // Just left bad zone
      showAlertNotification(`✓ Air acceptable: ${ppm} ppm`, "success");
      addAlert("threshold", "Retour à air acceptable", ppm);
    }
  }

  if (window.pushNavPpm) {
    try { window.pushNavPpm(ppm, data.timestamp); } catch (e) {}
  }

  updateTrend(lastPPM, ppm);
  animateValue(ppm);
  animateQuality(ppm);
  updateChart(ppm, data.timestamp);
};

window.handleSettingsUpdate = function(settings) {
  goodThreshold = settings.good_threshold || goodThreshold;
  badThreshold = settings.bad_threshold || badThreshold;
  
  // Update polling speed if changed
  if (settings.update_speed && settings.update_speed !== pollingDelay / 1000) {
    updatePollingSpeed(settings.update_speed);
  }
  
  chart.update("none");
};


/*
================================================================================
                      POLLING & DATA
================================================================================
*/

async function poll() {
  const data = await fetchLatestData();

  /* ⏸ PAUSE HANDLING */
  if (data.analysis_running === false) {
    analysisRunningLocal = false;
    updateNavAnalysisState(false);
    hidePausedOverlay();
    showPausedOverlay();
    stopPolling();
    return;
  }

  /* ▶️ RESUME HANDLING */
  if (!analysisRunningLocal && data.analysis_running === true) {
    analysisRunningLocal = true;
    updateNavAnalysisState(true);
    hidePausedOverlay();
    startPolling();
  }

  if (!analysisRunningLocal) return;

  if (isLivePage) hidePausedOverlay();

  if (!data || data.ppm == null) return;

  const ppm = data.ppm;
  console.log("New PPM", ppm);

  if (window.pushNavPpm) {
    try { window.pushNavPpm(ppm, data.timestamp); } catch (e) {}
  }

  if (isLivePage) {
    // Dedupe by timestamp to avoid duplicate inserts when both poll and WS send
    try {
      if (data.timestamp) {
        if (data.timestamp === lastCo2Timestamp) return;
        lastCo2Timestamp = data.timestamp;
      }
    } catch (e) {}

    updateTrend(lastPPM, ppm);
    animateValue(ppm);
    animateQuality(ppm);
    updateChart(ppm, data.timestamp);
  }
}

/*
================================================================================
                      INITIALIZATION
================================================================================
*/

function initLivePage() {
  if (!isLivePage) return;

  analysisRunningLocal = true;
  createChart();
  loadLiveSettings();
  
  // Use WebSocket for live updates
  if (useWebSocket && socket) {
    console.log("✓ Initializing WebSocket live updates");
    // Initial data fetch
    if (isWSConnected()) {
      socket.emit('request_data');
    } else {
      // Fallback while WebSocket connects
      startPolling();
    }
  } else {
    // Fallback to polling
    console.log("⚠ Initializing polling fallback");
    poll();
    startPolling();
  }
}

/* ─────────────────────────────────────────────────────────────────────────── 
   Button Handlers
──────────────────────────────────────────────────────────────────────────── */
exportBtn?.addEventListener("click", () => {
  if (!chart || !chart.data || chart.data.labels.length === 0) {
    showNotification('❌ Aucune donnée à exporter', 'error', 2000);
    return;
  }

  try {
    let csv = "time,ppm\n";
    chart.data.labels.forEach((t, i) => {
      const ppm = chart.data.datasets[0].data[i];
      csv += `${t},${ppm}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10);
    a.download = `co2_${timestamp}.csv`;
    a.click();
    
    showNotification(`✓ Exporté ${chart.data.labels.length} données`, 'success', 2000);
  } catch (err) {
    console.error('Export failed:', err);
    showNotification('❌ Erreur lors de l\'export', 'error', 2000);
  }
});

resetBtn?.addEventListener("click", () => {
  if (chart && chart.data.labels.length === 0) {
    showNotification('Graphique déjà vide', 'info', 1500);
    return;
  }
  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.update();
  showNotification('✓ Graphique réinitialisé', 'success', 1500);
});

if (isLivePage) {
  document.addEventListener("DOMContentLoaded", initLivePage);
}
