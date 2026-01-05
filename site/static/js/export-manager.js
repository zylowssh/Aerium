// Export Manager JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeExportManager();
});

function initializeExportManager() {
    // Load initial data
    loadSensors();
    loadExportHistory();
    loadScheduledExports();
    
    // Bind event listeners
    bindExportEvents();
    bindScheduleEvents();
}

function loadSensors() {
    // Fetch available sensors from the server
    fetch('/api/sensors')
        .then(response => response.json())
        .then(data => {
            const sensorSelect = document.getElementById('export-sensor');
            const scheduleSensorSelect = document.getElementById('schedule-sensor');
            
            if (sensorSelect && data.sensors) {
                sensorSelect.innerHTML = '<option value="">Select a sensor...</option>';
                data.sensors.forEach(sensor => {
                    const option = document.createElement('option');
                    option.value = sensor.id;
                    option.textContent = sensor.name;
                    sensorSelect.appendChild(option);
                });
            }
            
            if (scheduleSensorSelect && data.sensors) {
                scheduleSensorSelect.innerHTML = '<option value="">Select a sensor...</option>';
                data.sensors.forEach(sensor => {
                    const option = document.createElement('option');
                    option.value = sensor.id;
                    option.textContent = sensor.name;
                    scheduleSensorSelect.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error loading sensors:', error));
}

function bindExportEvents() {
    const exportForm = document.getElementById('export-form');
    if (!exportForm) return;
    
    // Format button handlers
    document.querySelectorAll('.btn-format').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-format').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('export-format').value = this.dataset.format || this.className.match(/\b(csv|excel|pdf)\b/)[1];
        });
    });
    
    // Export button handler
    const exportBtn = document.querySelector('button[onclick*="exportData"]');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
}

function bindScheduleEvents() {
    const scheduleBtn = document.querySelector('button[onclick*="scheduleExport"]');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', scheduleExport);
    }
}

function exportData() {
    const sensorId = document.getElementById('export-sensor')?.value;
    const period = document.getElementById('export-period')?.value;
    const format = document.getElementById('export-format')?.value;
    
    if (!sensorId || !period || !format) {
        alert('Please fill all fields');
        return;
    }
    
    // Show loading state
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Exporting...';
    btn.disabled = true;
    
    fetch('/api/advanced/export/immediate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sensor_id: sensorId,
            period: period,
            format: format
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Export failed');
        return response.json();
    })
    .then(data => {
        if (data.file_url) {
            // Download the file
            window.location.href = data.file_url;
            
            // Refresh history after a short delay
            setTimeout(loadExportHistory, 1000);
        }
        showNotification('Export completed successfully!', 'success');
    })
    .catch(error => {
        console.error('Export error:', error);
        showNotification('Export failed: ' + error.message, 'error');
    })
    .finally(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

function scheduleExport() {
    const sensorId = document.getElementById('schedule-sensor')?.value;
    const format = document.getElementById('schedule-format')?.value;
    const frequency = document.getElementById('schedule-frequency')?.value;
    const email = document.getElementById('schedule-email')?.value;
    
    if (!sensorId || !format || !frequency || !email) {
        alert('Please fill all fields');
        return;
    }
    
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Scheduling...';
    btn.disabled = true;
    
    fetch('/api/advanced/export/schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sensor_id: sensorId,
            format: format,
            frequency: frequency,
            email: email
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Schedule failed');
        return response.json();
    })
    .then(data => {
        // Reset form
        document.getElementById('schedule-form').reset();
        
        // Refresh scheduled exports list
        loadScheduledExports();
        showNotification('Export scheduled successfully!', 'success');
    })
    .catch(error => {
        console.error('Schedule error:', error);
        showNotification('Schedule failed: ' + error.message, 'error');
    })
    .finally(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

function loadExportHistory() {
    fetch('/api/advanced/export/history')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('.history-table table tbody');
            if (!tbody || !data.history) return;
            
            tbody.innerHTML = '';
            
            if (data.history.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">No exports yet</td></tr>';
                return;
            }
            
            data.history.forEach(export_item => {
                const row = document.createElement('tr');
                const date = new Date(export_item.created_at).toLocaleString();
                
                row.innerHTML = `
                    <td>${export_item.sensor_name}</td>
                    <td>${export_item.format.toUpperCase()}</td>
                    <td>${date}</td>
                    <td><span class="status ${export_item.status.toLowerCase()}">${export_item.status}</span></td>
                    <td>
                        ${export_item.file_url ? `<a href="${export_item.file_url}" download>Download</a>` : '-'}
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error loading export history:', error));
}

function loadScheduledExports() {
    fetch('/api/advanced/export/scheduled')
        .then(response => response.json())
        .then(data => {
            const container = document.querySelector('.scheduled-list');
            if (!container || !data.scheduled) return;
            
            container.innerHTML = '';
            
            if (data.scheduled.length === 0) {
                container.innerHTML = '<p class="text-muted">No scheduled exports</p>';
                return;
            }
            
            data.scheduled.forEach(schedule => {
                const item = document.createElement('div');
                item.className = 'scheduled-item';
                
                item.innerHTML = `
                    <div class="scheduled-item-info">
                        <h4>${schedule.sensor_name}</h4>
                        <p><strong>Frequency:</strong> ${schedule.frequency}</p>
                        <p><strong>Format:</strong> ${schedule.format.toUpperCase()}</p>
                        <p><strong>Email:</strong> ${schedule.email}</p>
                    </div>
                    <div class="scheduled-item-actions">
                        <button class="btn btn-secondary" onclick="editScheduledExport(${schedule.id})">Edit</button>
                        <button class="btn" style="background: #dc3545; color: white;" onclick="deleteScheduledExport(${schedule.id})">Delete</button>
                    </div>
                `;
                
                container.appendChild(item);
            });
        })
        .catch(error => console.error('Error loading scheduled exports:', error));
}

function editScheduledExport(scheduleId) {
    // Implementation for editing scheduled export
    fetch(`/api/advanced/export/scheduled/${scheduleId}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('schedule-sensor').value = data.sensor_id;
            document.getElementById('schedule-format').value = data.format;
            document.getElementById('schedule-frequency').value = data.frequency;
            document.getElementById('schedule-email').value = data.email;
            
            // Scroll to form
            document.getElementById('schedule-form').scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => console.error('Error loading schedule:', error));
}

function deleteScheduledExport(scheduleId) {
    if (!confirm('Are you sure you want to delete this scheduled export?')) {
        return;
    }
    
    fetch(`/api/advanced/export/scheduled/${scheduleId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) throw new Error('Delete failed');
        loadScheduledExports();
        showNotification('Scheduled export deleted', 'success');
    })
    .catch(error => {
        console.error('Delete error:', error);
        showNotification('Delete failed: ' + error.message, 'error');
    });
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
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
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

// Add slide animations
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
