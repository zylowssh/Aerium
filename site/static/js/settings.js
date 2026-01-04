document.addEventListener("DOMContentLoaded", () => {
  let isSnapping = false;
  let autoSaveTimeout;

  // ========================================
  // TAB SWITCHING
  // ========================================
  const navItems = document.querySelectorAll(".settings-nav-item");
  const panels = document.querySelectorAll(".settings-panel");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tabName = item.getAttribute("data-tab");
      
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");
      
      // Update active panel
      panels.forEach(panel => panel.classList.remove("active"));
      document.getElementById(`${tabName}-panel`).classList.add("active");
    });
  });

  // ========================================
  // ELEMENT SELECTORS
  // ========================================
  const toggle = document.getElementById("toggle-analysis");
  const goodSlider = document.getElementById("good-threshold");
  const warningSlider = document.getElementById("warning-threshold");
  const criticalSlider = document.getElementById("critical-threshold");
  
  if (!toggle || !goodSlider) return;

  const audioAlertsToggle = document.getElementById("toggle-audio-alerts");
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
  
  // Account settings
  const currentPasswordInput = document.getElementById("current-password");
  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const changePasswordBtn = document.getElementById("change-password-btn");
  const accountUsername = document.getElementById("account-username");
  const accountEmail = document.getElementById("account-email");
  const accountRole = document.getElementById("account-role");
  
  // Database settings
  const dbInfoDiv = document.getElementById("db-info");
  const dbSchemaDiv = document.getElementById("db-schema");
  const backupDbBtn = document.getElementById("backup-db-btn");
  const restoreDbBtn = document.getElementById("restore-db-btn");
  const exportDataBtn = document.getElementById("export-data-btn");

  const MIN = 400;
  const MAX = 2000;
  const STEP = 50;

  // ========================================
  // AUDIO ALERTS TOGGLE
  // ========================================
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
  // SYNC THRESHOLDS
  // ========================================
  function syncThresholds(changedSlider = null) {
    let good = +goodSlider.value;
    let warning = +warningSlider.value;
    let critical = +criticalSlider.value;

    good = Math.max(MIN, Math.min(good, MAX));
    warning = Math.max(MIN, Math.min(warning, MAX));
    critical = Math.max(MIN, Math.min(critical, MAX));

    if (!changedSlider) {
      if (good >= warning) warning = good + STEP;
      if (warning >= critical) critical = warning + STEP;
      if (critical > MAX) critical = MAX;
    } else {
      if (changedSlider === goodSlider) {
        if (good >= warning) warning = good + STEP;
        if (warning >= critical) critical = warning + STEP;
      } else if (changedSlider === warningSlider) {
        if (warning <= good) good = warning - STEP;
        if (warning >= critical) critical = warning + STEP;
      } else if (changedSlider === criticalSlider) {
        if (critical <= warning) warning = critical - STEP;
        if (warning <= good) good = warning - STEP;
      }
    }

    good = Math.max(MIN, Math.min(good, MAX));
    warning = Math.max(MIN, Math.min(warning, MAX));
    critical = Math.max(MIN, Math.min(critical, MAX));

    goodSlider.value = good;
    warningSlider.value = warning;
    criticalSlider.value = critical;
  }

  // ========================================
  // UPDATE VISUALIZATION
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
    slider.value = snapped;
    syncThresholds();
    updateLiveValues();
    updateVisualization();
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
    }, 800);
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
      syncThresholds(slider);
      updateVisualization();
      updateLiveValues();
      scheduleAutoSave();
    });
  });

  // ========================================
  // LOAD SETTINGS
  // ========================================
  async function loadSettings() {
    try {
      console.log('📋 Loading settings from /api/settings...');
      const res = await fetch("/api/settings");
      const settings = await res.json();
      console.log('📋 Settings received:', settings);

      toggle.checked = settings.analysis_running !== false;
      goodSlider.value = settings.good_threshold || 800;
      warningSlider.value = settings.warning_threshold || 1000;
      criticalSlider.value = settings.critical_threshold || 1200;

      realisticMode.checked = settings.realistic_mode !== false;
      updateSpeed.value = settings.update_speed || 1;
      overviewUpdateSpeed.value = settings.overview_update_speed || 5;

      speedValue.textContent = `${updateSpeed.value} seconde${updateSpeed.value != 1 ? "s" : ""}`;
      overviewSpeedValue.textContent = `${overviewUpdateSpeed.value} seconde${overviewUpdateSpeed.value != 1 ? "s" : ""}`;

      syncThresholds();
      updateLiveValues();
      console.log('✓ Values updated. Good:', goodSlider.value, 'Warning:', warningSlider.value, 'Critical:', criticalSlider.value);
      
      updateVisualization();
      console.log('✓ Visualization updated');
      requestAnimationFrame(() => {
        updateVisualization();
      });
    } catch (e) {
      console.error("❌ Load settings error:", e);
      toggle.checked = true;
      goodSlider.value = 800;
      warningSlider.value = 1000;
      criticalSlider.value = 1200;
      speedValue.textContent = "1 seconde";
      overviewSpeedValue.textContent = "5 secondes";
      syncThresholds();
      updateLiveValues();
      updateVisualization();
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

  // ========================================
  // ACCOUNT SETTINGS
  // ========================================
  async function loadAccountInfo() {
    try {
      // Fetch user profile from session
      const res = await fetch("/api/user/profile");
      if (!res.ok) return;
      const user = await res.json();
      
      if (accountUsername) accountUsername.textContent = `Utilisateur: ${user.username || '-'}`;
      if (accountEmail) accountEmail.textContent = `Email: ${user.email || '-'}`;
      if (accountRole) accountRole.textContent = `Rôle: ${user.role || 'Utilisateur'}`;
    } catch (e) {
      console.error("Error loading account info:", e);
    }
  }

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async () => {
      if (newPasswordInput.value !== confirmPasswordInput.value) {
        showToast("❌ Les mots de passe ne correspondent pas", 3000);
        return;
      }

      if (newPasswordInput.value.length < 8) {
        showToast("❌ Le mot de passe doit avoir au moins 8 caractères", 3000);
        return;
      }

      changePasswordBtn.disabled = true;
      changePasswordBtn.textContent = "⏳ Changement...";

      try {
        const res = await fetch("/api/user/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: currentPasswordInput.value,
            new_password: newPasswordInput.value
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Changement échoué");
        }

        showToast("✓ Mot de passe changé avec succès", 2000);
        currentPasswordInput.value = "";
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";
      } catch (e) {
        console.error("Password change error:", e);
        showToast(`❌ ${e.message}`, 3000);
      } finally {
        changePasswordBtn.disabled = false;
        changePasswordBtn.textContent = "🔐 Changer le mot de passe";
      }
    });
  }

  // ========================================
  // DATABASE SETTINGS
  // ========================================
  async function loadDatabaseInfo() {
    try {
      const res = await fetch("/api/admin/database-info");
      if (!res.ok) return;
      const data = await res.json();
      
      if (dbInfoDiv) {
        dbInfoDiv.innerHTML = `
          <p><strong>Fichier:</strong> ${data.file || 'unknown'}</p>
          <p><strong>Taille:</strong> ${formatBytes(data.size || 0)}</p>
          <p><strong>Tables:</strong> ${data.tables?.length || 0}</p>
          <p><strong>Dernière modification:</strong> ${new Date(data.modified || 0).toLocaleString()}</p>
        `;
      }

      if (dbSchemaDiv && data.schema) {
        dbSchemaDiv.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word;">${data.schema}</pre>`;
      }
    } catch (e) {
      console.error("Error loading database info:", e);
      if (dbInfoDiv) dbInfoDiv.innerHTML = '<p style="color: red;">Erreur de chargement</p>';
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  if (backupDbBtn) {
    backupDbBtn.addEventListener("click", async () => {
      backupDbBtn.disabled = true;
      backupDbBtn.textContent = "⏳ Création...";

      try {
        const res = await fetch("/api/admin/backup-database", { method: "POST" });
        if (!res.ok) throw new Error("Backup failed");
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `morpheus-backup-${new Date().toISOString().split('T')[0]}.db`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        showToast("✓ Sauvegarde créée et téléchargée", 2000);
      } catch (e) {
        console.error("Backup error:", e);
        showToast("❌ Erreur lors de la sauvegarde", 3000);
      } finally {
        backupDbBtn.disabled = false;
        backupDbBtn.textContent = "💾 Créer une sauvegarde";
      }
    });
  }

  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", async () => {
      exportDataBtn.disabled = true;
      exportDataBtn.textContent = "⏳ Export...";

      try {
        const res = await fetch("/api/export-csv");
        if (!res.ok) throw new Error("Export failed");
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `co2-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        showToast("✓ Données exportées", 2000);
      } catch (e) {
        console.error("Export error:", e);
        showToast("❌ Erreur lors de l'export", 3000);
      } finally {
        exportDataBtn.disabled = false;
        exportDataBtn.textContent = "📤 Exporter les données";
      }
    });
  }

  // ========================================
  // PRESET BUTTONS
  // ========================================
  const presetBtns = document.querySelectorAll(".preset-btn");
  presetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const preset = btn.getAttribute("data-preset");
      applyPreset(preset);
    });
  });

  function applyPreset(preset) {
    let good, warning, critical;
    
    switch(preset) {
      case "office":
        good = 800;
        warning = 1000;
        critical = 1200;
        break;
      case "school":
        good = 700;
        warning = 900;
        critical = 1100;
        break;
      case "strict":
        good = 600;
        warning = 800;
        critical = 1000;
        break;
      default:
        return;
    }

    goodSlider.value = good;
    warningSlider.value = warning;
    criticalSlider.value = critical;
    
    syncThresholds();
    updateLiveValues();
    updateVisualization();
    scheduleAutoSave();
    
    showToast(`✓ Préset "${preset}" appliqué`, 2000);
  }

  // ========================================
  // INITIALIZE
  // ========================================
  loadSettings();
  loadAccountInfo();
  loadDatabaseInfo();
});
