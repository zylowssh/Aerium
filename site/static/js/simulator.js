/*
================================================================================
                        SIMULATOR PAGE MODULE
================================================================================
Dedicated simulator UI that stays isolated from the live feed.
- Polls /api/simulator/latest for chart updates
- Polls /api/simulator/status for scenario metadata
- Provides helpers for scenario switching and reset
================================================================================
*/

const simValueEl = document.getElementById("sim-value");
const simQualityEl = document.getElementById("sim-quality");
const simTrendEl = document.getElementById("sim-trend");
const simTrendInfoEl = document.getElementById("sim-trend-info");
const simChartCanvas = document.getElementById("sim-chart");
const simDataPointsEl = document.getElementById("sim-data-points");
const simTimeRangeEl = document.getElementById("sim-time-range");
const statusMessageEl = document.getElementById("statusMessage");

const simCo2El = document.getElementById("sim-co2");
const simTempEl = document.getElementById("sim-temp");
const simHumidityEl = document.getElementById("sim-humidity");
const simScenarioEl = document.getElementById("sim-scenario");
const simPauseBtn = document.getElementById("sim-pause-btn");
const simPausedOverlay = document.getElementById("sim-paused-overlay");

let simStatusInterval = null;
let simDataInterval = null;

let simChart = null;
let simLastPPM = null;
let simPaused = false;

function showMessage(message, type = "success") {
  if (!statusMessageEl) return;
  statusMessageEl.textContent = message;
  statusMessageEl.className = `status-message ${type}`;
  setTimeout(() => {
    statusMessageEl.className = "status-message";
  }, 4000);
}

function initSimChart() {
  if (!simChartCanvas) return;
  simChart = new Chart(simChartCanvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "CO₂",
          data: [],
          yAxisID: "y",
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          backgroundColor: "rgba(61, 217, 143, 0.12)",
          borderColor: "#4ade80",
          pointRadius: 3,
        },
        {
          label: "Température (°C)",
          data: [],
          yAxisID: "yEnv",
          borderWidth: 2,
          tension: 0.35,
          fill: false,
          borderColor: "#38bdf8",
          pointRadius: 2,
        },
        {
          label: "Humidité (%)",
          data: [],
          yAxisID: "yEnv",
          borderWidth: 2,
          tension: 0.35,
          fill: false,
          borderColor: "#facc15",
          pointRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "#cbd5e1",
            usePointStyle: true,
          },
        },
      },
      scales: {
        y: {
          min: 200,
          max: 2000,
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: { color: "#cbd5e1" },
        },
        yEnv: {
          position: "right",
          min: 0,
          max: 100,
          grid: { drawOnChartArea: false, color: "rgba(255,255,255,0.08)" },
          ticks: { color: "#cbd5e1" },
        },
        x: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { color: "#cbd5e1" },
        },
      },
    },
  });
}

function updateSimChart({ ppm, temp, humidity, timestamp }) {
  if (!simChart) return;
  const label = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
  const { labels, datasets } = simChart.data;

  labels.push(label);
  datasets[0].data.push(ppm);
  datasets[1].data.push(temp != null ? Number(temp) : null);
  datasets[2].data.push(humidity != null ? Number(humidity) : null);

  if (labels.length > 50) {
    labels.shift();
    datasets.forEach((ds) => ds.data.shift());
  }
  simChart.update("none");
  if (simDataPointsEl) simDataPointsEl.textContent = `Points: ${labels.length}`;
}

function updateSimUI(data) {
  if (!data || data.ppm == null) return;

  const ppm = data.ppm;
  const color = typeof ppmColor === "function" ? ppmColor(ppm) : "#4ade80";

  if (simValueEl) {
    simValueEl.textContent = `${ppm} ppm`;
    simValueEl.style.color = color;
  }

  if (simQualityEl) {
    simQualityEl.textContent = ppm < 800 ? "Bon" : ppm < 1200 ? "Moyen" : "Mauvais";
    simQualityEl.style.color = color;
    simQualityEl.style.border = `1px solid ${color}55`;
    simQualityEl.style.background = `${color}22`;
  }

  if (simTrendInfoEl && simLastPPM !== null) {
    const delta = ppm - simLastPPM;
    const pct = Math.round((delta / Math.max(simLastPPM, 1)) * 100);
    if (pct > 5) {
      simTrendInfoEl.textContent = `📈 +${pct}% (hausse)`;
      simTrendInfoEl.style.color = "#f87171";
    } else if (pct < -5) {
      simTrendInfoEl.textContent = `📉 ${pct}% (baisse)`;
      simTrendInfoEl.style.color = "#4ade80";
    } else {
      simTrendInfoEl.textContent = "➡️ Stable";
      simTrendInfoEl.style.color = "#9ca3af";
    }
  }

  if (simTrendEl) {
    const rotation = simLastPPM !== null ? (ppm > simLastPPM ? -45 : ppm < simLastPPM ? 45 : 0) : 0;
    simTrendEl.style.transform = `rotate(${rotation}deg)`;
    simTrendEl.style.color = color;
  }

  simLastPPM = ppm;
  if (simTimeRangeEl) simTimeRangeEl.textContent = simPaused ? "Simulation en pause" : "Simulation en direct";
  if (!simPaused) {
    updateSimChart({
      ppm,
      temp: data.temp,
      humidity: data.humidity,
      timestamp: data.timestamp,
    });
  }

  // Mirror into status cards
  if (simCo2El) simCo2El.innerHTML = `${ppm}<span class="status-unit">ppm</span>`;
  if (simTempEl && data.temp != null) simTempEl.innerHTML = `${Number(data.temp).toFixed(1)}<span class="status-unit">°C</span>`;
  if (simHumidityEl && data.humidity != null) simHumidityEl.innerHTML = `${Number(data.humidity).toFixed(1)}<span class="status-unit">%</span>`;
}

function updatePauseUI() {
  if (simPauseBtn) {
    simPauseBtn.textContent = simPaused ? "▶️ Reprendre" : "⏸ Mettre en pause";
  }
  if (simPausedOverlay) {
    simPausedOverlay.classList.toggle("active", simPaused);
  }
}

async function fetchSimulatorLatest() {
  try {
    const res = await fetch("/api/simulator/latest", { cache: "no-store" });
    if (!res.ok) {
      showMessage("Session expirée ou accès refusé", "error");
      stopSimIntervals();
      return;
    }
    const data = await res.json();
    updateSimUI(data);
  } catch (e) {
    console.error("Simulator poll failed", e);
    showMessage("Erreur réseau sur le flux simulé", "error");
  }
}

async function loadSimulatorStatus() {
  try {
    const response = await fetch("/api/simulator/status");
    if (!response.ok) {
      showMessage("Session expirée ou accès refusé", "error");
      stopSimIntervals();
      return;
    }
    const data = await response.json();

    if (data.success && data.simulator) {
      const sim = data.simulator;
      simPaused = !!sim.paused;
      updatePauseUI();
      
      // Format scenario name for display
      const scenarioMap = {
        'normal': 'Normal',
        'office_hours': 'Bureau',
        'sleep': 'Sommeil',
        'ventilation': 'Ventilation',
        'anomaly': 'Anomalie'
      };
      const displayName = scenarioMap[sim.scenario] || sim.scenario;
      if (simScenarioEl) simScenarioEl.textContent = displayName;
      
      // Highlight active scenario card
      document.querySelectorAll('.scenario-card').forEach(card => {
        card.classList.toggle('active', card.dataset.scenario === sim.scenario);
      });
      
      if (simCo2El) simCo2El.innerHTML = `${Math.round(sim.co2)}<span class="status-unit">ppm</span>`;
      if (simTempEl) simTempEl.innerHTML = `${Number(sim.temperature).toFixed(1)}<span class="status-unit">°C</span>`;
      if (simHumidityEl) simHumidityEl.innerHTML = `${Number(sim.humidity).toFixed(1)}<span class="status-unit">%</span>`;
    }
  } catch (error) {
    console.error("Error loading simulator status:", error);
    showMessage("Erreur réseau sur le statut", "error");
  }
}

async function togglePause() {
  const desired = !simPaused;
  try {
    const res = await fetch("/api/simulator/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: desired }),
    });
    if (!res.ok) {
      showMessage("Impossible de changer l'état (auth?)", "error");
      return;
    }
    const data = await res.json();
    simPaused = !!data.paused;
    updatePauseUI();
    showMessage(simPaused ? "⏸ Simulation en pause" : "▶️ Simulation reprise", "success");
    // Refresh status cards quickly
    loadSimulatorStatus();
  } catch (e) {
    console.error("Pause toggle failed", e);
    showMessage("Erreur lors du pause/resume", "error");
  }
}

async function setSimulatorScenario(scenario) {
  const durationInput = document.getElementById(`${scenario}-duration`);
  const duration = parseInt(durationInput?.value || 0, 10);

  try {
    const response = await fetch(`/api/simulator/scenario/${scenario}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration: duration * 60 }),
    });
    const data = await response.json();

    if (data.success) {
      showMessage(`✓ Scénario activé: ${scenario}`, "success");
      setTimeout(loadSimulatorStatus, 300);
    } else {
      showMessage(`✗ Erreur: ${data.error}`, "error");
    }
  } catch (error) {
    showMessage(`Erreur: ${error}`, "error");
  }
}

async function resetSimulator() {
  const baseCO2 = prompt("Valeur CO2 initiale (ppm):", "600");
  if (!baseCO2 || isNaN(baseCO2)) return;

  try {
    const response = await fetch("/api/simulator/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_co2: parseInt(baseCO2, 10),
        scenario: "normal",
      }),
    });
    const data = await response.json();

    if (data.success) {
      showMessage("✓ Simulateur réinitialisé", "success");
      setTimeout(() => {
        loadSimulatorStatus();
        fetchSimulatorLatest();
      }, 300);
    } else {
      showMessage(`✗ Erreur: ${data.error}`, "error");
    }
  } catch (error) {
    showMessage(`Erreur: ${error}`, "error");
  }
}

function wireSimulatorButtons() {
  const refreshBtn = document.querySelector(".refresh-btn");
  if (refreshBtn) refreshBtn.addEventListener("click", loadSimulatorStatus);

  const resetBtn = document.querySelector(".reset-btn");
  if (resetBtn) resetBtn.addEventListener("click", resetSimulator);

  if (simPauseBtn) simPauseBtn.addEventListener("click", togglePause);
}

// Expose helpers for inline handlers (scenarios)
window.setSimulatorScenario = setSimulatorScenario;
window.resetSimulator = resetSimulator;
window.loadSimulatorStatus = loadSimulatorStatus;

function stopSimIntervals() {
  if (simDataInterval) {
    clearInterval(simDataInterval);
    simDataInterval = null;
  }
  if (simStatusInterval) {
    clearInterval(simStatusInterval);
    simStatusInterval = null;
  }
}

// Bootstrap simulator page
window.addEventListener("DOMContentLoaded", () => {
  // Mark simulation as active for navbar status
  window.simulationActive = true;
  // Update navbar status
  if (window.updateNavAnalysisState) {
    window.updateNavAnalysisState(true);
  }
  
  initSimChart();
  wireSimulatorButtons();
  updatePauseUI();
  loadSimulatorStatus();
  fetchSimulatorLatest();
  simDataInterval = setInterval(fetchSimulatorLatest, 1000);
  simStatusInterval = setInterval(loadSimulatorStatus, 5000);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopSimIntervals();
  } else {
    // Restart polling when tab becomes visible again
    fetchSimulatorLatest();
    loadSimulatorStatus();
    simDataInterval = setInterval(fetchSimulatorLatest, 1000);
    simStatusInterval = setInterval(loadSimulatorStatus, 5000);
  }
});

// Reset simulation flag when leaving the page
window.addEventListener("beforeunload", () => {
  window.simulationActive = false;
});
