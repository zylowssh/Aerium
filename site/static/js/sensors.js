document.addEventListener("DOMContentLoaded", () => {
  const sensorModal = document.getElementById("sensor-modal");
  const sensorsList = document.getElementById("sensors-list");
  const addSensorBtn = document.getElementById("add-sensor-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelModalBtn = document.getElementById("cancel-modal-btn");
  const saveSensorBtn = document.getElementById("save-sensor-btn");
  const testSensorBtn = document.getElementById("test-sensor-btn");
  const modalTitle = document.getElementById("modal-title");
  const sensorNameInput = document.getElementById("sensor-name");
  const sensorTypeSelect = document.getElementById("sensor-type");
  const sensorInterfaceSelect = document.getElementById("sensor-interface");
  const i2cConfig = document.getElementById("i2c-config");
  const serialConfig = document.getElementById("serial-config");
  const toggleThresholdsBtn = document.getElementById("toggle-thresholds-btn");
  const thresholdsSection = document.getElementById("thresholds-section");
  const thresholdGoodInput = document.getElementById("sensor-threshold-good");
  const thresholdWarningInput = document.getElementById("sensor-threshold-warning");
  const thresholdCriticalInput = document.getElementById("sensor-threshold-critical");

  let currentSensorId = null;
  let sensors = [];

  // Toggle thresholds section
  toggleThresholdsBtn.addEventListener("click", () => {
    const isOpen = thresholdsSection.style.display !== "none";
    thresholdsSection.style.display = isOpen ? "none" : "block";
    toggleThresholdsBtn.textContent = isOpen ? "▶ Seuils CO₂ personnalisés" : "▼ Seuils CO₂ personnalisés";
  });

  // Show/hide protocol configs based on interface selection
  sensorInterfaceSelect.addEventListener("change", () => {
    const iface = sensorInterfaceSelect.value;
    i2cConfig.style.display = iface === "i2c" ? "block" : "none";
    serialConfig.style.display = (iface === "uart" || iface === "usb") ? "block" : "none";
  });

  // Load sensors on page load
  async function loadSensors() {
    try {
      const response = await fetch("/api/sensors");
      if (!response.ok) throw new Error("Failed to load sensors");
      sensors = await response.json();
      renderSensorsList();
      updateStats();
    } catch (error) {
      console.error("Error loading sensors:", error);
      showToast("❌ Erreur lors du chargement des capteurs", 2000);
    }
  }

  // Load sensor thresholds for modal
  async function loadSensorThresholds(sensorId) {
    try {
      const response = await fetch(`/api/sensor/${sensorId}/thresholds`);
      if (!response.ok) return;
      const thresholds = await response.json();
      thresholdGoodInput.value = thresholds.good || 800;
      thresholdWarningInput.value = thresholds.warning || 1000;
      thresholdCriticalInput.value = thresholds.critical || 1200;
    } catch (error) {
      console.error("Error loading thresholds:", error);
    }
  }

  // Render sensors list
  function renderSensorsList() {
    if (sensors.length === 0) {
      sensorsList.innerHTML = `
        <div style="padding: 16px; background: rgba(0,0,0,0.3); border-radius: 8px; text-align: center; color: var(--muted);">
          Aucun capteur configuré
        </div>
      `;
      return;
    }

    sensorsList.innerHTML = sensors
      .map((sensor) => {
        const statusColor = sensor.available ? "#4ade80" : "#f87171";
        const statusIcon = sensor.available ? "✓" : "❌";
        return `
          <div style="padding: 16px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid #667eea;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <div>
                <h3 style="margin: 0 0 4px 0; color: #e5e7eb;">${sensor.name}</h3>
                <p style="margin: 0; font-size: 0.85rem; color: var(--muted);">${getSensorTypeLabel(sensor.type)}</p>
              </div>
              <div style="display: flex; gap: 8px;">
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; background: rgba(102,126,234,0.2); color: #667eea;">${sensor.interface.toUpperCase()}</span>
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; background: rgba(0,0,0,0.3); color: ${statusColor};">${statusIcon} ${sensor.available ? "Disponible" : "Indisponible"}</span>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 8px;">
              <div>
                <div style="font-size: 0.75rem; color: var(--muted);">Type</div>
                <div style="font-size: 0.9rem; color: #e5e7eb;">${sensor.type}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--muted);">Interface</div>
                <div style="font-size: 0.9rem; color: #e5e7eb;">${sensor.interface}</div>
              </div>
              <div style="text-align: right;">
                <button onclick="editSensor(${sensor.id})" style="background: rgba(102,126,234,0.3); border: 1px solid rgba(102,126,234,0.5); border-radius: 4px; color: #667eea; padding: 4px 8px; cursor: pointer; font-size: 0.75rem; margin-right: 4px;">✏️ Modifier</button>
                <button onclick="deleteSensor(${sensor.id})" style="background: rgba(248,113,113,0.2); border: 1px solid rgba(248,113,113,0.4); border-radius: 4px; color: #f87171; padding: 4px 8px; cursor: pointer; font-size: 0.75rem;">🗑️ Supprimer</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  // Update stats display
  function updateStats() {
    const activeCount = sensors.filter((s) => s.active).length;
    const availableCount = sensors.filter((s) => s.available).length;
    document.getElementById("active-sensor-count").textContent = activeCount;
    document.getElementById("available-sensor-count").textContent = availableCount;
  }

  // Get sensor type label
  function getSensorTypeLabel(type) {
    const labels = {
      scd30: "🌡️ SCD30 (CO₂ + T/RH)",
      mhz19: "💨 MH-Z19 (CO₂ via UART)",
      senseair: "🔬 Senseair (CO₂ via Serial)",
      other: "📡 Autre",
    };
    return labels[type] || type;
  }

  // Open add sensor modal
  addSensorBtn.addEventListener("click", () => {
    currentSensorId = null;
    modalTitle.textContent = "Ajouter un capteur";
    sensorNameInput.value = "";
    sensorTypeSelect.value = "scd30";
    sensorInterfaceSelect.value = "i2c";
    i2cConfig.style.display = "block";
    serialConfig.style.display = "none";
    thresholdsSection.style.display = "none";
    toggleThresholdsBtn.textContent = "▶ Seuils CO₂ personnalisés";
    document.getElementById("sensor-i2c-bus").value = "1";
    document.getElementById("sensor-i2c-addr").value = "0x61";
    document.getElementById("sensor-port").value = "/dev/ttyUSB0";
    document.getElementById("sensor-baudrate").value = "9600";
    thresholdGoodInput.value = "800";
    thresholdWarningInput.value = "1000";
    thresholdCriticalInput.value = "1200";
    sensorModal.style.display = "flex";
  });

  // Close modal
  function closeModal() {
    sensorModal.style.display = "none";
    currentSensorId = null;
  }

  closeModalBtn.addEventListener("click", closeModal);
  cancelModalBtn.addEventListener("click", closeModal);

  // Global edit function for inline buttons
  window.editSensor = function (sensorId) {
    const sensor = sensors.find((s) => s.id === sensorId);
    if (!sensor) return;

    currentSensorId = sensorId;
    modalTitle.textContent = `Modifier: ${sensor.name}`;
    sensorNameInput.value = sensor.name;
    sensorTypeSelect.value = sensor.type;
    sensorInterfaceSelect.value = sensor.interface;

    // Close thresholds section by default
    thresholdsSection.style.display = "none";
    toggleThresholdsBtn.textContent = "▶ Seuils CO₂ personnalisés";

    if (sensor.interface === "i2c") {
      document.getElementById("sensor-i2c-bus").value = sensor.config?.bus || "1";
      document.getElementById("sensor-i2c-addr").value = sensor.config?.address || "0x61";
      i2cConfig.style.display = "block";
      serialConfig.style.display = "none";
    } else if (["uart", "usb"].includes(sensor.interface)) {
      document.getElementById("sensor-port").value = sensor.config?.port || "/dev/ttyUSB0";
      document.getElementById("sensor-baudrate").value = sensor.config?.baudrate || "9600";
      i2cConfig.style.display = "none";
      serialConfig.style.display = "block";
    }

    // Load thresholds
    loadSensorThresholds(sensorId);

    sensorModal.style.display = "flex";
  };

  // Global delete function
  window.deleteSensor = async function (sensorId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce capteur?")) return;

    try {
      const response = await fetch(`/api/sensors/${sensorId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");

      sensors = sensors.filter((s) => s.id !== sensorId);
      renderSensorsList();
      updateStats();
      showToast("✓ Capteur supprimé", 2000);
    } catch (error) {
      console.error("Error deleting sensor:", error);
      showToast("❌ Erreur lors de la suppression", 2000);
    }
  };

  // Save sensor
  saveSensorBtn.addEventListener("click", async () => {
    const name = sensorNameInput.value.trim();
    if (!name) {
      showToast("❌ Veuillez entrer un nom", 2000);
      return;
    }

    const sensorData = {
      name,
      type: sensorTypeSelect.value,
      interface: sensorInterfaceSelect.value,
      config: {},
    };

    if (sensorInterfaceSelect.value === "i2c") {
      sensorData.config = {
        bus: document.getElementById("sensor-i2c-bus").value,
        address: document.getElementById("sensor-i2c-addr").value,
      };
    } else if (["uart", "usb"].includes(sensorInterfaceSelect.value)) {
      sensorData.config = {
        port: document.getElementById("sensor-port").value,
        baudrate: document.getElementById("sensor-baudrate").value,
      };
    }

    try {
      const method = currentSensorId ? "PUT" : "POST";
      const url = currentSensorId ? `/api/sensors/${currentSensorId}` : "/api/sensors";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sensorData),
      });

      if (!response.ok) throw new Error("Save failed");

      const savedSensor = await response.json();
      
      // Save thresholds if sensor was created/updated successfully
      if (savedSensor.id) {
        const thresholdData = {
          good: parseInt(thresholdGoodInput.value) || 800,
          warning: parseInt(thresholdWarningInput.value) || 1000,
          critical: parseInt(thresholdCriticalInput.value) || 1200
        };
        
        try {
          await fetch(`/api/sensor/${savedSensor.id}/thresholds`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(thresholdData)
          });
        } catch (err) {
          console.warn("Warning: Thresholds might not have been saved", err);
        }
      }

      closeModal();
      await loadSensors();
      showToast(`✓ Capteur ${currentSensorId ? "modifié" : "créé"}`, 2000);
    } catch (error) {
      console.error("Error saving sensor:", error);
      showToast("❌ Erreur lors de la sauvegarde", 2000);
    }
  });

  // Test sensor
  testSensorBtn.addEventListener("click", async () => {
    const sensorData = {
      type: sensorTypeSelect.value,
      interface: sensorInterfaceSelect.value,
    };

    if (sensorInterfaceSelect.value === "i2c") {
      sensorData.config = {
        bus: parseInt(document.getElementById("sensor-i2c-bus").value),
        address: document.getElementById("sensor-i2c-addr").value,
      };
    } else if (["uart", "usb"].includes(sensorInterfaceSelect.value)) {
      sensorData.config = {
        port: document.getElementById("sensor-port").value,
        baudrate: parseInt(document.getElementById("sensor-baudrate").value),
      };
    }

    testSensorBtn.disabled = true;
    testSensorBtn.textContent = "🔌 Test en cours...";

    try {
      const response = await fetch("/api/sensors/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sensorData),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`✓ Capteur détecté! CO₂: ${data.co2}ppm`, 3000);
      } else {
        showToast(`❌ ${data.error}`, 3000);
      }
    } catch (error) {
      console.error("Test error:", error);
      showToast(`❌ Erreur de test`, 3000);
    } finally {
      testSensorBtn.disabled = false;
      testSensorBtn.textContent = "🔌 Tester";
    }
  });

  // Toast helper
  function showToast(message, duration = 2000) {
    const container = document.getElementById("toast-container");
    const toast = document.getElementById("toast");
    toast.textContent = message;
    container.style.display = "block";
    setTimeout(() => {
      container.style.display = "none";
    }, duration);
  }

  // Initialize
  loadSensors();
});
