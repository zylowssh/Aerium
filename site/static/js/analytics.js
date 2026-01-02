(() => {
  const analyticsRoot = document.getElementById("analytics-chart");
  const aeriumBtn = document.getElementById("use-aerium");
  const csvBtn = document.getElementById("use-csv");
  const csvUpload = document.getElementById("csv-upload");
  const csvInput = document.getElementById("csv-file");
  const rangeSelect = document.getElementById("aerium-range");
  const customRangeDiv = document.getElementById("custom-range");
  const rangeFrom = document.getElementById("range-from");
  const rangeTo = document.getElementById("range-to");
  const applyRangeBtn = document.getElementById("apply-range");

  // Only run on the analytics page where these elements exist
  if (!analyticsRoot || !aeriumBtn || !csvBtn || !csvUpload || !csvInput || !rangeSelect) return;

  let analyticsChart;
  let analyticsSource = "aerium";
  let currentData = [];

  const avgEl = document.getElementById("m-avg");
  const minEl = document.getElementById("m-min");
  const maxEl = document.getElementById("m-max");
  const badEl = document.getElementById("m-bad");

  const GOOD = 800;
  const BAD = 1200;

  /* ===============================
     CUSTOM RANGE HANDLING
  =============================== */
  rangeSelect.onchange = () => {
    if (rangeSelect.value === "custom") {
      customRangeDiv.style.display = "flex";
      // Set default dates (last 7 days)
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      rangeTo.value = today.toISOString().split("T")[0];
      rangeFrom.value = lastWeek.toISOString().split("T")[0];
    } else {
      customRangeDiv.style.display = "none";
      loadAerium();
    }
  };

  applyRangeBtn?.addEventListener("click", async () => {
    const fromDate = new Date(rangeFrom.value);
    const toDate = new Date(rangeTo.value);
    
    if (isNaN(fromDate) || isNaN(toDate) || fromDate > toDate) {
      alert("Dates invalides");
      return;
    }

    applyRangeBtn.disabled = true;
    applyRangeBtn.textContent = "⏳ Chargement...";

    try {
      const res = await fetch("/api/history/today"); // Fallback; ideally fetch all and filter
      let data = await res.json();
      
      // Filter by date range (client-side for now)
      data = data.filter((d) => {
        const timestamp = new Date(d.timestamp);
        return timestamp >= fromDate && timestamp <= toDate;
      });

      currentData = data;
      analyze(data);
    } catch (e) {
      console.error(e);
    } finally {
      applyRangeBtn.disabled = false;
      applyRangeBtn.textContent = "Appliquer";
    }
  });

  /* ===============================
     SOURCE SWITCH
  =============================== */
  aeriumBtn.onclick = () => {
    analyticsSource = "aerium";
    aeriumBtn.classList.add("active");
    csvBtn.classList.remove("active");
    csvUpload.classList.add("hidden");
    loadAerium();
  };

  csvBtn.onclick = () => {
    analyticsSource = "csv";
    csvBtn.classList.add("active");
    aeriumBtn.classList.remove("active");
    csvUpload.classList.remove("hidden");
  };

  document.querySelector(".csv-drop")?.addEventListener("click", () => {
    document.getElementById("csv-file")?.click();
  });

  /* ===============================
     ANALYSIS
  =============================== */
  function analyze(data) {
    if (!data.length || !avgEl || !minEl || !maxEl || !badEl) return;

    const values = data.map((d) => d.ppm);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const bad = values.filter((v) => v >= BAD).length;

    avgEl.textContent = avg + " ppm";
    minEl.textContent = min + " ppm";
    maxEl.textContent = max + " ppm";
    badEl.textContent = bad + " min";

    drawChart(data);
  }

  /* ===============================
     CHART
  =============================== */
  function drawChart(data) {
    const labels = data.map((d) => new Date(d.timestamp).toLocaleString());
    const values = data.map((d) => d.ppm);

    if (!analyticsChart) {
      analyticsChart = new Chart(analyticsRoot, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              data: values,
              borderWidth: 3,
              tension: 0.35,
              borderColor: "#4ade80",
              fill: false,
            },
          ],
        },
        options: {
          animation: false,
          plugins: { legend: { display: false } },
          scales: { y: { min: 400, max: 2000 } },
        },
      });
    } else {
      analyticsChart.data.labels = labels;
      analyticsChart.data.datasets[0].data = values;
      analyticsChart.update("none");
    }
  }

  /* ===============================
     AERIUM DATA
  =============================== */
  async function loadAerium() {
    const range = rangeSelect.value;
    const res = await fetch(`/api/history/${range}`);
    const data = await res.json();

    currentData = data;
    analyze(data);
  }

  rangeSelect.onchange = loadAerium;

  /* ===============================
     CSV IMPORT (TEMP)
  =============================== */
  csvInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const csvUploadDiv = document.querySelector(".csv-drop");
    const uploadFeedback = document.getElementById("upload-feedback") || document.createElement("div");
    uploadFeedback.id = "upload-feedback";
    uploadFeedback.style.cssText = "margin-top: 8px; padding: 8px; background: rgba(74,222,128,0.15); border-radius: 6px; color: #4ade80; font-size: 0.85rem;";

    uploadFeedback.textContent = "⏳ Analyse du fichier...";
    if (!document.getElementById("upload-feedback")) {
      csvUploadDiv.parentNode.insertBefore(uploadFeedback, csvUploadDiv.nextSibling);
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = res.data
          .map((r) => ({
            timestamp: r.timestamp || r.time || r.date,
            ppm: Number(r.ppm || r.co2 || r.value),
          }))
          .filter((d) => d.timestamp && !isNaN(d.ppm));

        const invalid = res.data.length - parsed.length;
        uploadFeedback.textContent = `✓ ${parsed.length} lignes importées`;
        if (invalid > 0) {
          uploadFeedback.textContent += ` (${invalid} lignes invalides ignorées)`;
        }

        currentData = parsed;
        analyze(parsed);
      },
      error: (err) => {
        uploadFeedback.textContent = "✗ Erreur: " + err.message;
        uploadFeedback.style.background = "rgba(248,113,113,0.15)";
        uploadFeedback.style.color = "#f87171";
      }
    });
  };

  /* ===============================
     EMPTY STATE HANDLING
  =============================== */
  function showEmptyState() {
    if (analyticsChart && analyticsChart.ctx) {
      const canvas = analyticsChart.ctx.canvas;
      const parent = canvas.parentElement;
      parent.innerHTML = '';
      const empty = createEmptyState(
        '📊',
        'Aucune donnée disponible',
        'Chargez des données ou importez un fichier CSV pour commencer'
      );
      parent.appendChild(empty);
    }
    avgEl && (avgEl.textContent = '—');
    minEl && (minEl.textContent = '—');
    maxEl && (maxEl.textContent = '—');
    badEl && (badEl.textContent = '—');
  }

  /* ===============================
     ENHANCED ERROR HANDLING
  =============================== */
  const originalLoadAerium = loadAerium;
  function loadAerium() {
    aeriumBtn.disabled = true;
    aeriumBtn.textContent = '⏳ Chargement...';
    
    try {
      originalLoadAerium();
      showNotification('✓ Données Aerium chargées', 'success', 2000);
    } catch (err) {
      console.error('Aerium load failed:', err);
      showNotification('✗ Erreur lors du chargement des données', 'error', 3000);
      showEmptyState();
    } finally {
      aeriumBtn.disabled = false;
      aeriumBtn.textContent = 'Données Aerium';
    }
  }

  /* INIT */
  loadAerium();
})();
