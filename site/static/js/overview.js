/*
================================================================================
                      OVERVIEW PAGE MODULE
================================================================================
Homepage: air health status, daily statistics, CO₂ thermometer.
================================================================================
*/

const isOverviewPage = !!document.querySelector(".air-health");
let lastSubPPM = null;
let overviewUpdateInterval = null;
let overviewUpdateSpeed = 5; // Default 5 seconds
let simulateLive = null; // tracks if we are in simulator mode
let overviewSource = localStorage.getItem("overviewSource") || "real"; // 'real' or 'sim'

/*
================================================================================
                      AIR HEALTH CARD
================================================================================
*/

function updateAirHealth(avgPPM) {
  const card = document.querySelector(".air-health");
  const status = document.getElementById("air-status");
  const advice = document.getElementById("air-advice");

  if (!card || !status || !advice) return;

  card.className = "card air-health";

  card.classList.remove("status-change");
  void card.offsetWidth; // force reflow
  card.classList.add("status-change");

  if (avgPPM < goodThreshold) {
    card.classList.add("good");
    status.textContent = "Excellent";
    advice.textContent = "Air sain, aucune action nécessaire";
  } else if (avgPPM < badThreshold) {
    card.classList.add("medium");
    status.textContent = "Acceptable";
    advice.textContent = "Surveillez la qualité de l'air";
  } else {
    card.classList.add("bad");
    status.textContent = "Mauvais";
    advice.textContent = "Aérez la pièce dès que possible";
  }
}

/*
================================================================================
                      SUB VALUE ANIMATION
================================================================================
*/

function animateSubValue(ppm, el) {
  if (!el) return;

  if (lastSubPPM === null) {
    el.textContent = `CO₂ actuel · ${ppm} ppm`;
    el.style.color = ppmColor(ppm);
    lastSubPPM = ppm;
    return;
  }

  const start = lastSubPPM;
  const startTime = performance.now();

  function animate(time) {
    const progress = Math.min((time - startTime) / VALUE_ANIMATION_DURATION, 1);
    const eased = easeOutCubic(progress);
    const current = Math.round(start + (ppm - start) * eased);

    el.textContent = `CO₂ actuel · ${current} ppm`;

    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
  el.style.color = ppmColor(ppm);

  if (lastSubPPM < badThreshold && ppm >= badThreshold) {
    el.classList.add("blink-warning");
    setTimeout(() => el.classList.remove("blink-warning"), 900);
  }

  lastSubPPM = ppm;
}

/*
================================================================================
                      CO₂ THERMOMETER
================================================================================
*/

function updateCO2Thermo(value) {
  const fill = document.getElementById("co2-fill");
  const label = document.getElementById("co2-mini-value");

  if (!fill || !label) return;

  const max = 2000;
  const percent = Math.min(value / max, 1) * 100;

  fill.style.height = percent + "%";
  label.textContent = value + " ppm";

  if (value < 800) {
    fill.style.background = "var(--good)";
  } else if (value < 1200) {
    fill.style.background = "var(--medium)";
  } else {
    fill.style.background = "var(--bad)";
  }
}

// Compute minutes spent in degraded air using timestamps
function computeBadMinutes(readings) {
  if (!readings?.length) return 0;

  let badMs = 0;

  for (let i = 0; i < readings.length; i++) {
    const current = readings[i];
    if (current.ppm < badThreshold) continue;

    const start = new Date(current.timestamp).getTime();
    const end = i < readings.length - 1
      ? new Date(readings[i + 1].timestamp).getTime()
      : Date.now();

    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      badMs += end - start;
    }
  }

  return Math.max(0, Math.round(badMs / 60000));
}

/*
================================================================================
                      STATS LOADING
================================================================================
*/

async function loadOverviewStats() {
  const avgEl = document.getElementById("avg-ppm");
  const maxEl = document.getElementById("max-ppm");
  const badEl = document.getElementById("bad-time");
  const statusEl = document.getElementById("air-status");
  const subEl = document.getElementById("air-sub");
  const airCard = document.querySelector(".air-health");
  const analysisEl = document.getElementById("analysis-status");
  const analysisWidget = document.getElementById("analysis-widget");
  const thresholdsEl = document.getElementById("co2-thresholds");

  if (!airCard || !statusEl) return;

  try {
    // Use cached settings from WebSocket or global state
    let settings = getCachedSettings();
    if (!settings) {
      // Use global state already loaded by loadSharedSettings()
      // No HTTP fallback here to avoid unnecessary requests
      settings = {
        analysis_running: analysisRunning ?? false,
        good_threshold: goodThreshold,
        bad_threshold: badThreshold
      };
    }
    
    // Persist simulate_live flag if provided by settings (only for info; we do not use it to show data)
    if (settings.simulate_live !== undefined) {
      simulateLive = settings.simulate_live;
    }

    const useSim = overviewSource === "sim";
    const simulationActive = useSim; // only user toggle controls sim view
    
    // Update global simulation state for navbar
    window.simulationActive = simulationActive;

    // Fetch latest payload to detect no-sensor state (real path)
    const live = simulationActive ? null : await fetchLatestData();
    const noSensor = !simulationActive && live?.reason === "no_sensor";

    const isRunning = settings.analysis_running !== false && !simulationActive && !noSensor;

    const pauseReason = noSensor ? "no_sensor" : (isRunning ? null : "paused");
    updateNavAnalysisState(isRunning, pauseReason);

    if (analysisEl) {
      if (simulationActive) analysisEl.textContent = "Simulation";
      else if (noSensor) analysisEl.textContent = "Aucun capteur";
      else if (noSensor) analysisEl.textContent = "Aucun capteur";
      else analysisEl.textContent = isRunning ? "Active" : "Pause";
    }

    analysisWidget?.classList.toggle("paused", !isRunning);
    analysisWidget?.classList.toggle("good", isRunning && !noSensor);

    if (thresholdsEl) {
      thresholdsEl.textContent = `${settings.good_threshold} / ${settings.bad_threshold} ppm`;
    }

    // Simulation: disable system status visuals
    if (simulationActive) {
      airCard.classList.remove("good", "medium", "bad");
      airCard.classList.add("paused");
      statusEl.textContent = "Mode simulation";
      if (subEl) {
        subEl.textContent = "État du système désactivé en simulation";
        subEl.style.color = "var(--muted)";
      }
      if (document.getElementById("air-advice")) {
        document.getElementById("air-advice").textContent = "Connectez un capteur réel pour suivre l'état";
      }
      updateCO2Thermo?.(0);
      // Still show daily stats below even in simulation
    }

    /* TODAY HISTORY - show nothing when no sensor to avoid stale values */
    const data = noSensor
      ? []
      : await fetchTodayHistory(simulationActive ? "sim" : "real");

    if (data.length) {
      const values = data.map((d) => d.ppm);
      const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      const max = Math.max(...values);
      const badMinutes = computeBadMinutes(data);
      const last = data[data.length - 1];

      if (avgEl) avgEl.textContent = `${avg} ppm`;
      if (maxEl) maxEl.textContent = `${max} ppm`;
      if (badEl) badEl.textContent = `${badMinutes} min`;

      // Update visuals based on last reading and sensor state
      if (simulationActive) {
        // Already handled above; keep visuals muted
        updateCO2Thermo?.(0);
      } else if (noSensor) {
        airCard.classList.remove("good", "medium", "bad");
        airCard.classList.add("paused");
        statusEl.textContent = "Aucun capteur";
        if (subEl) {
          subEl.textContent = "Connectez un capteur pour afficher l'état";
          subEl.style.color = "var(--muted)";
        }
        if (document.getElementById("air-advice")) {
          document.getElementById("air-advice").textContent = "En attente d'un capteur";
        }
        updateCO2Thermo?.(0);
      } else if (isRunning) {
        updateAirHealth(last.ppm);
        animateSubValue(last.ppm, subEl);
        updateCO2Thermo?.(last.ppm);
      } else {
        airCard.classList.remove("good", "medium", "bad");
        airCard.classList.add("paused");
        statusEl.textContent = "Analyse en pause";
        if (subEl) {
          subEl.textContent = `Dernier relevé · ${last.ppm} ppm`;
          subEl.style.color = ppmColor(last.ppm);
        }
        updateCO2Thermo?.(last.ppm);
      }
    } else {
      if (avgEl) avgEl.textContent = "—";
      if (maxEl) maxEl.textContent = "—";
      if (badEl) badEl.textContent = "—";
      if (!isRunning) {
        airCard.classList.add("paused");
        statusEl.textContent = "Analyse en pause";
        if (subEl) subEl.textContent = "Aucune donnée disponible";
      }
      updateCO2Thermo?.(0);
    }

    /* ▶️ LIVE SNAPSHOT when running and sensor present */
    if (simulationActive) {
      // Pull one simulator sample for display (does not affect history already loaded)
      try {
        const sim = await fetch("/api/simulator/latest", { cache: "no-store" }).then(r => r.json());
        if (sim?.ppm != null) {
          statusEl.textContent = "Simulation";
          updateAirHealth(sim.ppm);
          updateCO2Thermo(sim.ppm);
          animateSubValue(sim.ppm, subEl);
        }
      } catch (e) {
        console.warn("Simulator latest failed", e);
      }
    } else if (isRunning) {
      if (live?.ppm != null) {
        updateAirHealth(live.ppm);
        updateCO2Thermo(live.ppm);
        animateSubValue(live.ppm, subEl);
      }
    }
  } catch (e) {
    console.error("Overview stats failed", e);
  }
}

/*
================================================================================
                      INITIALIZATION
================================================================================
*/

function startOverviewRefresh() {
  if (overviewUpdateInterval) clearInterval(overviewUpdateInterval);
  loadOverviewStats();
  overviewUpdateInterval = setInterval(loadOverviewStats, overviewUpdateSpeed * 1000);
}

function stopOverviewRefresh() {
  if (overviewUpdateInterval) {
    clearInterval(overviewUpdateInterval);
    overviewUpdateInterval = null;
  }
}

// WebSocket handler for settings changes
window.handleOverviewSettings = function(settings) {
  if (settings.overview_update_speed !== undefined) {
    overviewUpdateSpeed = settings.overview_update_speed;
  }
  if (isOverviewPage) {
    startOverviewRefresh(); // Restart with new interval
  }
};

// WebSocket handler for CO₂ updates - DISABLED on overview page
// Overview uses a fixed interval timer (startOverviewRefresh) to avoid duplicate updates
window.handleOverviewCO2Update = function(data) {
  if (!isOverviewPage) return;
  // No-op: let the timer-based interval control updates
};

if (isOverviewPage) {
  document.addEventListener("DOMContentLoaded", async () => {
    // Load settings from server to get correct overview_update_speed
    try {
      const res = await fetch("/api/settings");
      const settings = await res.json();
      if (settings.overview_update_speed !== undefined) {
        overviewUpdateSpeed = settings.overview_update_speed;
      }
      if (settings.simulate_live !== undefined) {
        simulateLive = settings.simulate_live;
      }
    } catch (e) {
      console.warn("Could not load settings, using default interval", e);
    }
    
    startOverviewRefresh();

    // Wire source selector if present
    const sourceSelect = document.getElementById("overview-source");
    if (sourceSelect) {
      sourceSelect.value = overviewSource;
      sourceSelect.addEventListener("change", (e) => {
        overviewSource = e.target.value === "sim" ? "sim" : "real";
        localStorage.setItem("overviewSource", overviewSource);
        startOverviewRefresh();
      });
    }
  });
}

/*
================================================================================
                      EXPORT BUTTONS
================================================================================
*/

document.getElementById("export-day-csv")?.addEventListener("click", async () => {
  const data = await fetchTodayHistory();

  let csv = "time,ppm\n";
  data.forEach((d) => {
    const time = new Date(d.timestamp).toLocaleTimeString();
    csv += `${time},${d.ppm}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "rapport_journalier.csv";
  a.click();
});

document.getElementById("export-day-pdf")?.addEventListener("click", () => {
  window.open("/api/report/daily/pdf", "_blank");
});
