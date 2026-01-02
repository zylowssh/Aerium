document.addEventListener("DOMContentLoaded", () => {
  let isSnapping = false;
  let savePending = false;

  const toggle = document.getElementById("toggle-analysis");
  const goodSlider = document.getElementById("good-threshold");
  if (!toggle || !goodSlider) return;

  const lightModeToggle = document.getElementById("toggle-light-mode");
  const audioAlertsToggle = document.getElementById("toggle-audio-alerts");
  const themeHint = document.getElementById("theme-hint");

  const badSlider = document.getElementById("bad-threshold");
  const statusText = document.getElementById("status-text");
  const goodValue = document.getElementById("good-value");
  const badValue = document.getElementById("bad-value");
  const goodLabel = document.getElementById("good-label");
  const badLabel = document.getElementById("bad-label");

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

  const goodSeg = document.querySelector(".good-seg");
  const midSeg = document.querySelector(".medium-seg");
  const badSeg = document.querySelector(".bad-seg");

  const MIN = 0;
  const MAX = 2000;

  const PRESETS = {
    office: { good_threshold: 800, bad_threshold: 1200 },
    school: { good_threshold: 700, bad_threshold: 1100 },
    strict: { good_threshold: 600, bad_threshold: 1000 },
  };

  const DEFAULTS = {
    analysis_running: true,
    good_threshold: 800,
    bad_threshold: 1200,
    realistic_mode: true,
    update_speed: 1,
    overview_update_speed: 5,
  };

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

  function updateLiveValues() {
    goodValue.textContent = `${snap(+goodSlider.value)} ppm`;
    badValue.textContent = `${snap(+badSlider.value)} ppm`;
  }

  function snap(value) {
    const STEP = 50;
    return Math.round(value / STEP) * STEP;
  }

  /* =========================
     TOAST NOTIFICATIONS
  ========================= */
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

  /* =========================
     THRESHOLDS & ZONES SETUP
  ========================= */

  /* =========================
     RETENTION SLIDER
  ========================= */
  if (retentionDays) {
    retentionDays.addEventListener("input", () => {
      retentionValue.textContent = `${retentionDays.value} jours`;
    });
  }

  if (cleanupBtn) {
    cleanupBtn.addEventListener("click", async () => {
      const days = retentionDays ? +retentionDays.value : 90;
      if (!confirm(`Supprimer les données de plus de ${days} jours?`)) return;
      
      cleanupBtn.disabled = true;
      cleanupBtn.textContent = "⏳ Nettoyage...";
      
      try {
        const res = await fetch("/api/cleanup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days }),
        });
        const data = await res.json();
        showToast(`${data.deleted} lignes supprimées`);
      } catch (e) {
        showToast("Erreur nettoyage", 3000);
        console.error(e);
      } finally {
        cleanupBtn.disabled = false;
        cleanupBtn.textContent = "🗑️ Nettoyer maintenant";
      }
    });
  }

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
        // 🔒 FINAL HARD LOCK
        slider.value = target;

        isSnapping = false;

        updateLiveValues();
        updateTexts();
        updateVisualization();
        if (onDone) onDone();
      }
    }

    requestAnimationFrame(animate);
  }

  /* =========================
     TEXT
  ========================= */
  function updateTexts() {
    statusText.textContent = toggle.checked
      ? "Analyse en direct activée"
      : "Analyse en direct désactivée";

    statusText.classList.toggle("on", toggle.checked);
    statusText.classList.toggle("off", !toggle.checked);

    goodValue.textContent = `${goodSlider.value} ppm`;
    badValue.textContent = `${badSlider.value} ppm`;
    speedValue.textContent = `${updateSpeed.value} secondes`;
    overviewSpeedValue.textContent = `${overviewUpdateSpeed.value} secondes`;

    goodLabel.textContent = goodSlider.value;
    badLabel.textContent = badSlider.value;
  }

  /* =========================
     LINKED SLIDERS
  ========================= */
  function syncThresholds(changed) {
    let good = +goodSlider.value;
    let bad = +badSlider.value;

    good = Math.max(MIN, Math.min(good, MAX));
    bad = Math.max(MIN, Math.min(bad, MAX));

    // 🔗 Always move the OTHER slider
    if (good > bad) {
      if (changed === goodSlider) bad = good;
      else good = bad;
    }

    goodSlider.value = good;
    badSlider.value = bad;
  }

  function updateThresholdLabels() {
    const good = +goodSlider.value;
    const bad = +badSlider.value;

    const goodPct = (good / MAX) * 100;
    const badPct = (bad / MAX) * 100;

    goodLabel.style.left = `${goodPct}%`;
    badLabel.style.left = `${badPct}%`;

    // 🔥 COLLISION HANDLING
    const distance = Math.abs(goodPct - badPct);

    if (distance < 6) {
      goodLabel.style.transform = "translate(-50%, -6px)";
      badLabel.style.transform = "translate(-50%, 10px)";
    } else {
      goodLabel.style.transform = "translateX(-50%)";
      badLabel.style.transform = "translateX(-50%)";
    }
  }

  /* =========================
     VISUAL ZONES
  ========================= */
  function updateVisualization() {
    const good = +goodSlider.value;
    const bad = +badSlider.value;

    if (good === bad) {
      const pct = (good / MAX) * 100;
      goodSeg.style.width = `${pct}%`;
      badSeg.style.width = `${100 - pct}%`;
      midSeg.style.display = "none";
      updateThresholdLabels();
      return;
    }

    midSeg.style.display = "flex";

    const goodW = (good / MAX) * 100;
    const midW  = ((bad - good) / MAX) * 100;
    const badW  = 100 - goodW - midW;

    goodSeg.style.width = `${goodW}%`;
    midSeg.style.width  = `${midW}%`;
    badSeg.style.width  = `${badW}%`;

    updateThresholdLabels(); // ✅ single call
  }

  /* =========================
     LOAD
  ========================= */
  async function loadSettings() {
    try {
      // Always fetch from server to ensure we have latest settings
      const res = await fetch("/api/settings");
      const s = await res.json();

      toggle.checked = s.analysis_running;
      const good = Number.isFinite(s.good_threshold)
        ? s.good_threshold
        : DEFAULTS.good_threshold;
      const bad = Number.isFinite(s.bad_threshold)
        ? s.bad_threshold
        : DEFAULTS.bad_threshold;

      goodSlider.value = Math.min(Math.max(good, MIN), MAX);
      badSlider.value = Math.min(Math.max(bad, MIN), MAX);

      realisticMode.checked = s.realistic_mode;
      updateSpeed.value = s.update_speed;
      overviewUpdateSpeed.value = s.overview_update_speed || DEFAULTS.overview_update_speed;
    } catch {
      // Fallback to defaults on error
      toggle.checked = DEFAULTS.analysis_running;
      goodSlider.value = DEFAULTS.good_threshold;
      badSlider.value = DEFAULTS.bad_threshold;
      realisticMode.checked = DEFAULTS.realistic_mode;
      updateSpeed.value = DEFAULTS.update_speed;
      overviewUpdateSpeed.value = DEFAULTS.overview_update_speed;
    }

    syncThresholds();
    updateTexts();
    updateVisualization();
  }

  /* =========================
     SAVE (DEBOUNCED)
  ========================= */
  saveBtn.addEventListener("click", async () => {
    if (savePending) return;
    
    syncThresholds();
    savePending = true;
    saveBtn.disabled = true;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "⏳ Enregistrement...";

    const settingsData = {
      analysis_running: toggle.checked,
      good_threshold: +goodSlider.value,
      bad_threshold: +badSlider.value,
      realistic_mode: realisticMode.checked,
      update_speed: +updateSpeed.value,
      overview_update_speed: +overviewUpdateSpeed.value,
    };

    try {
      // Use WebSocket if available, fallback to HTTP
      if (isWSConnected && isWSConnected() && socket) {
        socket.emit('settings_change', settingsData);
      } else {
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsData),
        });
        if (!res.ok) throw new Error('Settings save failed');
      }
      
      showNotification('✓ Paramètres enregistrés avec succès', 'success', 2000);
      saveBtn.textContent = originalText;
      
      // Save to localStorage for persistence
      saveUserPreferences('settings', settingsData);
    } catch (e) {
      console.error('Settings save error:', e);
      showNotification('❌ Erreur lors de l\'enregistrement', 'error', 3000);
      saveBtn.textContent = originalText;
    } finally {
      savePending = false;
      saveBtn.disabled = false;
    }
  });

  resetBtn.addEventListener("click", async () => {
    if (!confirm("Réinitialiser tous les paramètres? Cette action est irréversible.")) return;
    
    resetBtn.disabled = true;
    const originalText = resetBtn.textContent;
    resetBtn.textContent = "⏳ Réinitialisation...";

    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      if (!res.ok) throw new Error('Reset failed');
      
      await loadSettings();
      showNotification('✓ Paramètres réinitialisés', 'success', 2000);
      localStorage.removeItem('pref_settings');
    } catch (e) {
      console.error('Settings reset error:', e);
      showNotification('❌ Erreur lors de la réinitialisation', 'error', 3000);
    } finally {
      resetBtn.disabled = false;
      resetBtn.textContent = originalText;
    }
  });


  /* =========================
     LIVE INPUT
  ========================= */
  [goodSlider, badSlider].forEach((el) =>
    el.addEventListener("input", (e) => {
      if (isSnapping) return;

      syncThresholds(e.target);
      updateVisualization();
      updateLiveValues();
    })
  );

  // Update live speed display when slider changes
  updateSpeed.addEventListener("input", () => {
    updateTexts();
  });

  // Update overview speed display when slider changes and trigger handler to restart interval
  overviewUpdateSpeed.addEventListener("input", () => {
    updateTexts();
    // Immediately apply the new interval to the overview page
    if (window.handleOverviewSettings) {
      window.handleOverviewSettings({
        overview_update_speed: +overviewUpdateSpeed.value
      });
    }
  });

  /* =========================
     PRESET BUTTONS
  ========================= */
  const presetButtons = document.querySelectorAll(".preset-btn");
  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.dataset.preset.toLowerCase();
      if (!PRESETS[preset]) return;

      const { good_threshold, bad_threshold } = PRESETS[preset];
      goodSlider.value = good_threshold;
      badSlider.value = bad_threshold;

      syncThresholds();
      updateTexts();
      updateVisualization();
      showToast(`✓ Préset "${preset}" appliqué`);
    });
  });

  /* =========================
     RETENTION & CLEANUP
  ========================= */
  if (retentionDays) {
    retentionDays.addEventListener("input", () => {
      retentionValue.textContent = `${retentionDays.value} jours`;
    });
  }

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
          body: JSON.stringify({ retention_days: days }),
        });
        const data = await res.json();
        showToast(`✓ ${data.deleted} lignes supprimées`);
      } catch (e) {
        showToast("✗ Erreur nettoyage", 3000);
        console.error(e);
      } finally {
        cleanupBtn.disabled = false;
        cleanupBtn.textContent = "🗑️ Nettoyer maintenant";
      }
    });
  }

  loadSettings();

  function snapOne(slider) {
    const snapped = snap(+slider.value);

    springTo(slider, snapped, () => {
      slider.value = snapped;
      syncThresholds(slider);
      updateTexts();
      updateVisualization();
    });
  }

  goodSlider.addEventListener("change", () => snapOne(goodSlider));
  badSlider.addEventListener("change", () => snapOne(badSlider));

  // ─────────────────────────────────────────────────────────────────────────
  // WebSocket Settings Update Handler
  // ─────────────────────────────────────────────────────────────────────────
  window.handleSettingsUpdate = function(settings) {
    // Update UI when settings change from another source (e.g., reset button, another tab)
    if (settings.analysis_running !== undefined) {
      toggle.checked = settings.analysis_running;
    }
    if (settings.good_threshold !== undefined) {
      goodSlider.value = Math.min(Math.max(settings.good_threshold, MIN), MAX);
    }
    if (settings.bad_threshold !== undefined) {
      badSlider.value = Math.min(Math.max(settings.bad_threshold, MIN), MAX);
    }
    if (settings.realistic_mode !== undefined) {
      realisticMode.checked = settings.realistic_mode;
    }
    if (settings.update_speed !== undefined) {
      updateSpeed.value = settings.update_speed;
    }
    if (settings.overview_update_speed !== undefined) {
      overviewUpdateSpeed.value = settings.overview_update_speed;
    }
    
    syncThresholds();
    updateTexts();
    updateVisualization();
  };
});
