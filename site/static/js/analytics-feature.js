function loadPredictions() {
    const hours = document.getElementById('pred-hours').value;
    const container = document.getElementById('predictions-container');
    container.innerHTML = '<div class="loading">Loading predictions for next ' + hours + ' hours...</div>';
    
    fetch('/api/analytics/predict/' + hours)
        .then(r => r.json())
        .then(data => {
            if (data.success && data.predictions) {
                let html = '<div class="data-display">';
                html += '<h3>Predictions for Next ' + hours + ' Hours</h3>';
                html += '<div class="prediction-list">';
                data.predictions.forEach((pred, i) => {
                    html += `<div class="prediction-item">
                        <span class="pred-time">+${i}h</span>
                        <span class="pred-value">${pred.toFixed(1)} ppm</span>
                        <span class="pred-bar" style="width: ${(pred/1000)*100}%"></span>
                    </div>`;
                });
                html += '</div>';
                html += '<p class="info-text">Based on historical patterns and current trends</p>';
                html += '</div>';
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="error">Could not load predictions</div>';
            }
        })
        .catch(e => {
            container.innerHTML = '<div class="error">Error: ' + e.message + '</div>';
        });
}

function loadAnomalies() {
    const container = document.getElementById('anomalies-container');
    container.innerHTML = '<div class="loading">Detecting anomalies...</div>';
    
    fetch('/api/analytics/anomalies')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.anomalies) {
                let html = '<div class="data-display">';
                html += '<h3>Detected Anomalies</h3>';
                if (data.anomalies.length === 0) {
                    html += '<p class="success">✓ No anomalies detected - Your data looks normal!</p>';
                } else {
                    html += '<div class="anomaly-list">';
                    data.anomalies.forEach((anom, i) => {
                        html += `<div class="anomaly-item severity-${anom.severity}">
                            <div class="anomaly-header">
                                <span class="anomaly-score">Score: ${anom.score.toFixed(2)}</span>
                                <span class="anomaly-severity">${anom.severity.toUpperCase()}</span>
                            </div>
                            <p class="anomaly-description">${anom.description}</p>
                            <span class="anomaly-time">${anom.time}</span>
                        </div>`;
                    });
                    html += '</div>';
                }
                html += '</div>';
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="error">Could not detect anomalies</div>';
            }
        })
        .catch(e => {
            container.innerHTML = '<div class="error">Error: ' + e.message + '</div>';
        });
}

function loadInsights() {
    const container = document.getElementById('insights-container');
    container.innerHTML = '<div class="loading">Generating insights...</div>';
    
    fetch('/api/analytics/insights')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.insights) {
                let html = '<div class="data-display">';
                html += '<h3>AI-Generated Insights</h3>';
                html += '<div class="insights-list">';
                data.insights.forEach((insight, i) => {
                    html += `<div class="insight-item">
                        <div class="insight-icon">${insight.type === 'positive' ? '✓' : '⚠'}</div>
                        <div class="insight-content">
                            <h4>${insight.title}</h4>
                            <p>${insight.description}</p>
                        </div>
                    </div>`;
                });
                html += '</div>';
                html += '</div>';
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="error">Could not generate insights</div>';
            }
        })
        .catch(e => {
            container.innerHTML = '<div class="error">Error: ' + e.message + '</div>';
        });
}

function loadHealth() {
    const container = document.getElementById('health-container');
    container.innerHTML = '<div class="loading">Loading health recommendations...</div>';
    
    fetch('/api/health/recommendations')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.recommendations) {
                let html = '<div class="data-display">';
                html += '<h3>Your Health Recommendations</h3>';
                html += '<div class="recommendations-list">';
                data.recommendations.forEach((rec, i) => {
                    html += `<div class="recommendation-item">
                        <div class="rec-icon">${rec.category === 'action' ? '→' : '📋'}</div>
                        <div class="rec-content">
                            <h4>${rec.title}</h4>
                            <p>${rec.description}</p>
                            <span class="rec-priority">${rec.priority}</span>
                        </div>
                    </div>`;
                });
                html += '</div>';
                html += '</div>';
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="error">Could not load recommendations</div>';
            }
        })
        .catch(e => {
            container.innerHTML = '<div class="error">Error: ' + e.message + '</div>';
        });
}

// Load initial data
window.addEventListener('load', () => {
    loadPredictions();
    loadAnomalies();
    loadInsights();
    loadHealth();
});
