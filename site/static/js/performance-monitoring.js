// Performance Monitoring JavaScript

let performanceCharts = {};

document.addEventListener('DOMContentLoaded', function() {
    initializePerformanceMonitoring();
});

function initializePerformanceMonitoring() {
    // Initialize tabs
    initializeTabs();
    
    // Load real-time metrics
    loadRealtimeMetrics();
    setInterval(loadRealtimeMetrics, 5000); // Update every 5 seconds
    
    // Initialize charts
    initializeCharts();
    
    // Bind event listeners
    bindTabEvents();
    bindActionButtons();
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class
            this.classList.add('active');
            document.getElementById(`${tabId}-content`)?.classList.add('active');
            
            // Redraw charts if tab contains them
            setTimeout(() => {
                if (tabId === 'history') {
                    redrawHistoryChart();
                } else if (tabId === 'cache') {
                    redrawCacheChart();
                }
            }, 100);
        });
    });
}

function loadRealtimeMetrics() {
    fetch('/api/admin/performance/metrics')
        .then(response => response.json())
        .then(data => {
            updateMetricCards(data);
            updateRealtimeCharts(data);
        })
        .catch(error => console.error('Error loading metrics:', error));
}

function updateMetricCards(data) {
    if (!data.metrics) return;
    
    const metrics = data.metrics;
    
    // Cache metrics
    document.getElementById('cache-hit-rate').textContent = 
        (metrics.cache_hit_rate * 100).toFixed(1) + '%';
    document.getElementById('cache-size').textContent = 
        (metrics.cache_size_mb).toFixed(0);
    document.getElementById('cache-items').textContent = 
        metrics.cache_items.toLocaleString();
    updateStatusIndicator('cache-status', metrics.cache_hit_rate > 0.8 ? 'good' : 
                          metrics.cache_hit_rate > 0.6 ? 'warning' : 'danger');
    
    // Latency metrics
    document.getElementById('latency-p95').textContent = 
        metrics.latency_p95.toFixed(0) + ' ms';
    document.getElementById('latency-median').textContent = 
        metrics.latency_median.toFixed(0);
    document.getElementById('requests-per-sec').textContent = 
        metrics.requests_per_sec.toFixed(0);
    updateStatusIndicator('latency-status', metrics.latency_p95 < 200 ? 'good' : 
                          metrics.latency_p95 < 500 ? 'warning' : 'danger');
    
    // Database metrics
    document.getElementById('db-connections').textContent = 
        metrics.db_connections + ' / ' + metrics.db_max_connections;
    document.getElementById('db-queries-per-sec').textContent = 
        metrics.db_queries_per_sec.toFixed(0);
    document.getElementById('slow-queries').textContent = 
        metrics.slow_queries;
    updateStatusIndicator('db-status', metrics.db_connections < 70 ? 'good' : 
                          metrics.db_connections < 85 ? 'warning' : 'danger');
    
    // System metrics
    document.getElementById('system-cpu').textContent = 
        metrics.system_cpu_percent.toFixed(0) + '%';
    document.getElementById('system-memory').textContent = 
        metrics.system_memory_percent.toFixed(0);
    document.getElementById('system-disk').textContent = 
        metrics.system_disk_percent.toFixed(0);
    updateStatusIndicator('system-status', metrics.system_cpu_percent < 70 ? 'good' : 
                          metrics.system_cpu_percent < 85 ? 'warning' : 'danger');
}

function updateStatusIndicator(elementId, status) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.classList.remove('good', 'warning', 'danger');
    element.classList.add(status);
}

function initializeCharts() {
    // Latency chart
    const latencyCtx = document.getElementById('latency-chart');
    if (latencyCtx) {
        performanceCharts.latency = new Chart(latencyCtx, {
            type: 'line',
            data: {
                labels: generateTimeLabels(60),
                datasets: [{
                    label: 'Latence API (ms)',
                    data: generateMockData(60, 50, 150),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: getChartOptions('Latence API (dernière heure)')
        });
    }
    
    // Requests per second chart
    const requestsCtx = document.getElementById('requests-chart');
    if (requestsCtx) {
        performanceCharts.requests = new Chart(requestsCtx, {
            type: 'line',
            data: {
                labels: generateTimeLabels(60),
                datasets: [{
                    label: 'Requêtes/sec',
                    data: generateMockData(60, 100, 200),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: getChartOptions('Requêtes par seconde (dernière heure)')
        });
    }
}

function updateRealtimeCharts(data) {
    if (performanceCharts.latency && data.latency_history) {
        performanceCharts.latency.data.datasets[0].data = data.latency_history;
        performanceCharts.latency.update('none');
    }
    
    if (performanceCharts.requests && data.requests_history) {
        performanceCharts.requests.data.datasets[0].data = data.requests_history;
        performanceCharts.requests.update('none');
    }
}

function redrawHistoryChart() {
    const period = document.getElementById('history-period')?.value || '7days';
    const metric = document.getElementById('history-metric')?.value || 'latency';
    
    fetch(`/api/admin/performance/history/${metric}?period=${period}`)
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('history-chart');
            if (!ctx) return;
            
            if (performanceCharts.history) {
                performanceCharts.history.destroy();
            }
            
            performanceCharts.history = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: getMetricLabel(metric),
                        data: data.values,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: getChartOptions(`${getMetricLabel(metric)} - ${getPeriodLabel(period)}`)
            });
            
            // Update stats
            updateHistoryStats(data);
        })
        .catch(error => console.error('Error loading history:', error));
}

function redrawCacheChart() {
    const ctx = document.getElementById('cache-distribution-chart');
    if (!ctx) return;
    
    fetch('/api/admin/performance/cache/distribution')
        .then(response => response.json())
        .then(data => {
            if (performanceCharts.cache) {
                performanceCharts.cache.destroy();
            }
            
            performanceCharts.cache = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.types,
                    datasets: [{
                        data: data.sizes,
                        backgroundColor: [
                            '#4CAF50',
                            '#2196F3',
                            '#FF9800',
                            '#9C27B0'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error loading cache distribution:', error));
}

function bindTabEvents() {
    const historyPeriod = document.getElementById('history-period');
    const historyMetric = document.getElementById('history-metric');
    const queryFilter = document.getElementById('query-filter');
    
    if (historyPeriod) {
        historyPeriod.addEventListener('change', redrawHistoryChart);
    }
    if (historyMetric) {
        historyMetric.addEventListener('change', redrawHistoryChart);
    }
    if (queryFilter) {
        queryFilter.addEventListener('change', loadQueries);
    }
}

function bindActionButtons() {
    const clearCacheBtn = document.querySelector('button[onclick*="clearCache"]');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', clearCache);
    }
    
    const rateLimitForm = document.getElementById('rate-limit-form');
    if (rateLimitForm) {
        rateLimitForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitRateLimit();
        });
    }
}

function clearCache() {
    if (!confirm('Êtes-vous sûr de vouloir vider le cache?')) {
        return;
    }
    
    fetch('/api/admin/performance/cache/clear', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Cache vidé avec succès', 'success');
            loadRealtimeMetrics();
        } else {
            showNotification('Erreur lors du vidage du cache', 'error');
        }
    })
    .catch(error => {
        console.error('Error clearing cache:', error);
        showNotification('Erreur lors du vidage du cache', 'error');
    });
}

function showCacheConfig() {
    alert('Configuration du cache - À implémenter');
}

function loadQueries() {
    const filter = document.getElementById('query-filter')?.value || 'all';
    
    fetch(`/api/admin/performance/queries?filter=${filter}`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('.queries-table table tbody');
            if (!tbody || !data.queries) return;
            
            tbody.innerHTML = '';
            
            data.queries.forEach(query => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${query.endpoint}</td>
                    <td>${query.calls.toLocaleString()}</td>
                    <td>${query.avg_time.toFixed(0)}ms</td>
                    <td>${query.p95_time.toFixed(0)}ms</td>
                    <td>${(query.error_rate * 100).toFixed(2)}%</td>
                    <td>
                        <span class="recommendation ${query.recommendation_type}">
                            ${query.recommendation}
                        </span>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            // Load slow queries log
            loadSlowQueriesLog(data.slow_queries);
        })
        .catch(error => console.error('Error loading queries:', error));
}

function loadSlowQueriesLog(slowQueries) {
    const logDiv = document.getElementById('slow-queries-log');
    if (!logDiv) return;
    
    logDiv.innerHTML = '';
    
    if (!slowQueries || slowQueries.length === 0) {
        logDiv.innerHTML = '<p style="color: #4CAF50;">✓ Pas de requête lente détectée</p>';
        return;
    }
    
    slowQueries.forEach(query => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        entry.innerHTML = `
            <div class="log-time">${new Date(query.timestamp).toLocaleString()}</div>
            <div>Durée: <span class="log-duration">${query.duration.toFixed(2)}s</span></div>
            <div style="margin-top: 8px; font-size: 0.8rem; color: var(--text-secondary);">
                ${query.query.substring(0, 150)}...
            </div>
        `;
        
        logDiv.appendChild(entry);
    });
}

function submitRateLimit() {
    const user = document.getElementById('limit-user')?.value;
    const limit = document.getElementById('limit-value')?.value;
    
    if (!user || !limit) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    fetch('/api/admin/performance/rate-limit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user: user,
            limit: parseInt(limit)
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('rate-limit-form').reset();
            showNotification('Limite appliquée avec succès', 'success');
            // Reload user limits table
        } else {
            showNotification('Erreur lors de l\'application de la limite', 'error');
        }
    })
    .catch(error => {
        console.error('Error applying rate limit:', error);
        showNotification('Erreur', 'error');
    });
}

function updateHistoryStats(data) {
    if (!data.stats) return;
    
    document.getElementById('stat-min').textContent = data.stats.min?.toFixed(2) || '--';
    document.getElementById('stat-avg').textContent = data.stats.avg?.toFixed(2) || '--';
    document.getElementById('stat-max').textContent = data.stats.max?.toFixed(2) || '--';
    document.getElementById('stat-p95').textContent = data.stats.p95?.toFixed(2) || '--';
}

// Helper functions

function getChartOptions(title) {
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            title: {
                display: true,
                text: title
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };
}

function generateTimeLabels(count) {
    const labels = [];
    for (let i = count; i > 0; i--) {
        const date = new Date();
        date.setMinutes(date.getMinutes() - i);
        labels.push(date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        }));
    }
    return labels;
}

function generateMockData(count, min, max) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push(Math.random() * (max - min) + min);
    }
    return data;
}

function getMetricLabel(metric) {
    const labels = {
        'latency': 'Latence API',
        'requests': 'Requêtes/sec',
        'cache': 'Cache Hit Rate',
        'errors': 'Taux d\'erreur'
    };
    return labels[metric] || metric;
}

function getPeriodLabel(period) {
    const labels = {
        '7days': 'Derniers 7 jours',
        '30days': 'Derniers 30 jours',
        '90days': 'Derniers 90 jours',
        '1year': 'Dernière année'
    };
    return labels[period] || period;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 6px;
        color: white;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
