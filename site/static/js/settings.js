document.addEventListener("DOMContentLoaded", () => {
  let isSnapping = false;
  let savePending = false;

  const toggle = document.getElementById("toggle-analysis");
  const goodSlider = document.getElementById("good-threshold");
  const warningSlider = document.getElementById("warning-threshold");
  const criticalSlider = document.getElementById("critical-threshold");
  
  if (!toggle || !goodSlider) return;

  const lightModeToggle = document.getElementById("toggle-light-mode");
  const audioAlertsToggle = document.getElementById("toggle-audio-alerts");
  const themeHint = document.getElementById("theme-hint");

  const goodValue = document.getElementById("good-value");
  const warningValue = document.getElementById("warning-value");
  const criticalValue = document.getElementById("critical-value");

  const goodSeg = document.querySelector(".good-seg");
  const warningSeg = document.querySelector(".warning-seg");
  const badSeg = document.querySelector(".bad-seg");

  const realisticMode = document.getElementById("realistic-mode");
  const updateSpeed = document.getElementById("update-speed");
  const speedValue = document.getElementById("speed-value");
  const overviewUpdateSpeed = document.getElementById("overview-update-speed");
  const overviewSpeedValue = document.getElementById("overview-speed-value");

  const retentionDays = document.getElementById("retention-days");
  const retentionValue = document.getElementById("retention-value");
  const cleanupBtn = document.getElementById("cleanup-btn");

  const saveBtn = document.getElementById("save-settings");
  const resetBtn = document.getElementById("reset-settings");
  let autoSaveTimeout;

  const MIN = 400;
  const MAX = 2000;
  const STEP = 50;

  /* =========================
     THEME MANAGEMENT
  ========================= */
  if (lightModeToggle) {
    const isLight = localStorage.getItem("theme") === "light";
    lightModeToggle.checked = isLight;
    themeHint.textContent = `Actuellement: Mode ${isLight ? "clair" : "sombre"}`;

    lightModeToggle.addEventListener("change", () => {
      applyTheme(lightModeToggle.checked);
      themeHint.textContent = `Actuellement: Mode ${lightModeToggle.checked ? "clair" : "sombre"}`;
    });
  }

  /* =========================
     AUDIO ALERTS TOGGLE
  ========================= */
  if (audioAlertsToggle) {
    audioAlertsToggle.checked = localStorage.getItem("audioAlerts") !== "false";
    audioAlertsToggle.addEventListener("change", () => {
      localStorage.setItem("audioAlerts", audioAlertsToggle.checked ? "true" : "false");
    });
  }

  // Snap to nearest 50
  function snap(value) {
    return Math.round(value / STEP) * STEP;
  }

  // Toast notifications
  function showToast(message, duration = 2000) {
    const container = document.getElementById("toast-container");
    const toast = document.getElementById("toast");
    if (!container || !toast) return;
    
    toast.textContent = message;
    container.style.display = "block";
    setTimeout(() => {
      container.style.display = "none";
    }, duration);
  }
  // ========================================
  // UPDATE LIVE VALUES
  // ========================================
  function updateLiveValues() {
    goodValue.textContent = `${goodSlider.value} ppm`;
    warningValue.textContent = `${warningSlider.value} ppm`;
    criticalValue.textContent = `${criticalSlider.value} ppm`;
  }

  // ========================================
  // SYNC THRESHOLDS (PUSH BACK)
  // ========================================
  function syncThresholds(changedSlider = null) {
    let good = +goodSlider.value;
    let warning = +warningSlider.value;
    let critical = +criticalSlider.value;

    // Clamp to bounds
    good = Math.max(MIN, Math.min(good, MAX));
    warning = Math.max(MIN, Math.min(warning, MAX));
    critical = Math.max(MIN, Math.min(critical, MAX));

    // If no slider specified, just ensure order
    if (!changedSlider) {
      if (good >= warning) warning = good + STEP;
      if (warning >= critical) critical = warning + STEP;
      if (critical > MAX) critical = MAX;
    } else {
      // Push behavior: only move other sliders if they're in the way
      if (changedSlider === goodSlider) {
        // Moving good: if it goes above warning, push warning up
        if (good >= warning) warning = good + STEP;
        if (warning >= critical) critical = warning + STEP;
      } else if (changedSlider === warningSlider) {
        // Moving warning: push good down or critical up as needed
        if (warning <= good) good = warning - STEP;
        if (warning >= critical) critical = warning + STEP;
      } else if (changedSlider === criticalSlider) {
        // Moving critical: if it goes below warning, push warning down
        if (critical <= warning) warning = critical - STEP;
        if (warning <= good) good = warning - STEP;
      }
    }

    // Final bounds check
    good = Math.max(MIN, Math.min(good, MAX));
    warning = Math.max(MIN, Math.min(warning, MAX));
    critical = Math.max(MIN, Math.min(critical, MAX));

    goodSlider.value = good;
    warningSlider.value = warning;
    criticalSlider.value = critical;
  }

  // ========================================
  // SPRING ANIMATION
  // ========================================
  function springTo(slider, target, onDone) {
    if (isSnapping) return;

    isSnapping = true;

    const start = +slider.value;
    const diff = target - start;
    const duration = 220;
    const startTime = performance.now();

    function animate(time) {
      const t = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      slider.value = Math.round(start + diff * eased);
      updateVisualization();

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        slider.value = target;
        isSnapping = false;
        updateLiveValues();
        updateVisualization();
        if (onDone) onDone();
      }
    }

    requestAnimationFrame(animate);
  }

  // ========================================
  // UPDATE VISUALIZATION (Répartition des zones)
  // ========================================
  function updateVisualization() {
    const good = +goodSlider.value;
    const warning = +warningSlider.value;
    const critical = +criticalSlider.value;

    const goodW = ((good - MIN) / (MAX - MIN)) * 100;
    const warningW = ((warning - good) / (MAX - MIN)) * 100;
    const badW = ((critical - warning) / (MAX - MIN)) * 100;
    const extraW = ((MAX - critical) / (MAX - MIN)) * 100;

    goodSeg.style.width = `${goodW}%`;
    warningSeg.style.width = `${warningW}%`;
    badSeg.style.width = `${badW + extraW}%`;
  }

  // ========================================
  // SNAP SLIDERS ON CHANGE
  // ========================================
  function snapSlider(slider) {
    const snapped = snap(+slider.value);
    springTo(slider, snapped, () => {
      slider.value = snapped;
      syncThresholds();
      updateLiveValues();
      updateVisualization();
    });
  }

  goodSlider.addEventListener("change", () => snapSlider(goodSlider));
  warningSlider.addEventListener("change", () => snapSlider(warningSlider));
  criticalSlider.addEventListener("change", () => snapSlider(criticalSlider));

  // ========================================
  // LIVE INPUT WHILE DRAGGING + AUTOSAVE
  // ========================================
  function scheduleAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      autoSaveSettings();
    }, 800); // Save 800ms after user stops dragging
  }

  async function autoSaveSettings() {
    const settingsData = {
      analysis_running: toggle.checked,
      good_threshold: +goodSlider.value,
      warning_threshold: +warningSlider.value,
      critical_threshold: +criticalSlider.value,
      realistic_mode: realisticMode.checked,
      update_speed: +updateSpeed.value,
      overview_update_speed: +overviewUpdateSpeed.value,
    };

    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });
    } catch (e) {
      console.error("Auto-save error:", e);
    }
  }

  [goodSlider, warningSlider, criticalSlider].forEach(slider => {
    slider.addEventListener("input", () => {
      if (isSnapping) return;
      syncThresholds(slider); // Pass which slider changed
      updateVisualization();
      updateLiveValues();
      scheduleAutoSave(); // Trigger autosave
    });
  });

  // ========================================
  // LOAD SETTINGS
  // ========================================
  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const settings = await res.json();

      toggle.checked = settings.analysis_running !== false;
      goodSlider.value = settings.good_threshold || 800;
      warningSlider.value = settings.warning_threshold || 1000;
      criticalSlider.value = settings.critical_threshold || 1200;

      realisticMode.checked = settings.realistic_mode !== false;
      updateSpeed.value = settings.update_speed || 1;
      overviewUpdateSpeed.value = settings.overview_update_speed || 5;

      syncThresholds();
      updateLiveValues();
      
      // Force visualization after browser renders
      requestAnimationFrame(() => {
        updateVisualization();
      });
    } catch (e) {
      console.error("Load settings error:", e);
      // Use defaults
      toggle.checked = true;
      goodSlider.value = 800;
      warningSlider.value = 1000;
      criticalSlider.value = 1200;
      updateLiveValues();
      
      requestAnimationFrame(() => {
        updateVisualization();
      });
    }
  }

  // ========================================
  // UPDATE SPEED DISPLAY
  // ========================================
  updateSpeed.addEventListener("input", () => {
    speedValue.textContent = `${updateSpeed.value} seconde${updateSpeed.value != 1 ? "s" : ""}`;
    scheduleAutoSave();
  });

  overviewUpdateSpeed.addEventListener("input", () => {
    overviewSpeedValue.textContent = `${overviewUpdateSpeed.value} seconde${overviewUpdateSpeed.value != 1 ? "s" : ""}`;
    scheduleAutoSave();
  });

  if (retentionDays) {
    retentionDays.addEventListener("input", () => {
      retentionValue.textContent = `${retentionDays.value} jours`;
      scheduleAutoSave();
    });
  }

  // Autosave toggle and checkbox changes
  toggle.addEventListener("change", () => {
    scheduleAutoSave();
  });

  realisticMode.addEventListener("change", () => {
    scheduleAutoSave();
  });

  // ========================================
  // SAVE SETTINGS
  // ========================================
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "⏳ Enregistrement...";

    const settingsData = {
      analysis_running: toggle.checked,
      good_threshold: +goodSlider.value,
      warning_threshold: +warningSlider.value,
      critical_threshold: +criticalSlider.value,
      realistic_mode: realisticMode.checked,
      update_speed: +updateSpeed.value,
      overview_update_speed: +overviewUpdateSpeed.value,
    };

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });

      if (!res.ok) throw new Error("Save failed");
      
      showToast("✓ Paramètres enregistrés avec succès", 2000);
    } catch (e) {
      console.error("Save error:", e);
      showToast("❌ Erreur lors de l'enregistrement", 3000);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  });

  // Save thresholds button (alternative)
  if (saveThresholdsBtn) {
    saveThresholdsBtn.addEventListener("click", () => {
      saveBtn.click();
    });
  }

  // Save thresholds button (alternative)
  if (saveThresholdsBtn) {
    saveThresholdsBtn.addEventListener("click", () => {
      saveBtn.click();
    });
  }

  // ========================================
  // RESET SETTINGS
  // ========================================
  resetBtn.addEventListener("click", async () => {
    if (!confirm("Réinitialiser tous les paramètres?")) return;
    
    resetBtn.disabled = true;
    const originalText = resetBtn.textContent;
    resetBtn.textContent = "⏳ Réinitialisation...";

    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      if (!res.ok) throw new Error("Reset failed");
      
      await loadSettings();
      showToast("✓ Paramètres réinitialisés", 2000);
    } catch (e) {
      console.error("Reset error:", e);
      showToast("❌ Erreur lors de la réinitialisation", 3000);
    } finally {
      resetBtn.disabled = false;
      resetBtn.textContent = originalText;
    }
  });

  // ========================================
  // CLEANUP OLD DATA
  // ========================================
  if (cleanupBtn) {
    cleanupBtn.addEventListener("click", async () => {
      const days = retentionDays ? +retentionDays.value : 90;
      if (!confirm(`Supprimer les données de plus de ${days} jours?`)) return;

      cleanupBtn.disabled = true;
      cleanupBtn.textContent = "🔄 Nettoyage...";

      try {
        const res = await fetch("/api/cleanup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days }),
        });
        const data = await res.json();
        showToast(`✓ ${data.deleted} lignes supprimées`);
      } catch (e) {
        console.error("Cleanup error:", e);
        showToast("✗ Erreur nettoyage", 3000);
      } finally {
        cleanupBtn.disabled = false;
        cleanupBtn.textContent = "🗑️ Nettoyer maintenant";
      }
    });
  }

  // Load settings on page load
  loadSettings();});