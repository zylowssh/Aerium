// UI helpers
function setTableMessage(tbodyId, message, colspan) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading">${message}</td></tr>`;
}

function setBlockMessage(containerId, message) {
    const el = document.getElementById(containerId);
    if (el) {
        el.innerHTML = `<div class="loading">${message}</div>`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadAuditLogs();
    loadSessions();
    loadRetentionPolicies();
    loadSystemStats();
    loadBackups();
    loadUsers();
    loadAnalytics();
    loadMaintenanceStatus();
    
    // Auto-refresh system stats every 30 seconds
    setInterval(loadSystemStats, 30000);
});

// Tab Switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// ==================== AUDIT LOGS ====================
async function loadAuditLogs() {
    const days = document.getElementById('audit-days').value || 30;
    const action = document.getElementById('audit-action').value || '';
    const userId = document.getElementById('audit-user-id').value || '';
    
    try {
        const response = await fetch(
            `/admin/audit-logs?limit=100&days=${days}${action ? '&action=' + action : ''}${userId ? '&user_id=' + userId : ''}`
        );
        if (!response.ok) {
            setTableMessage('audit-logs-tbody', 'Erreur de chargement des journaux', 7);
            return;
        }
        const data = await response.json();
        
        if (!data.success) {
            setTableMessage('audit-logs-tbody', data.error || 'Impossible de récupérer les journaux', 7);
            return;
        }
        
        // Update summary
        document.getElementById('audit-total').textContent = data.summary.total_actions || 0;
        document.getElementById('audit-high').textContent = data.summary.by_severity?.high || 0;
        document.getElementById('audit-medium').textContent = data.summary.by_severity?.medium || 0;
        document.getElementById('audit-low').textContent = data.summary.by_severity?.low || 0;
        
        // Populate table
        const tbody = document.getElementById('audit-logs-tbody');
        tbody.innerHTML = '';
        
        if (!data.logs || data.logs.length === 0) {
            setTableMessage('audit-logs-tbody', "Aucun journal d'audit trouvé", 7);
            return;
        }
        
        data.logs.forEach(log => {
            const row = document.createElement('tr');
            const timestamp = new Date(log.timestamp).toLocaleString('fr-FR');
            const statusBadge = log.status === 'success' 
                ? `<span class="status-success">✓ Succès</span>`
                : `<span class="status-failure">✗ Erreur</span>`;
            const severityBadge = `<span class="severity-${log.severity}">${log.severity?.charAt(0).toUpperCase() + log.severity?.slice(1) || 'N/A'}</span>`;
            
            row.innerHTML = `
                <td>${timestamp}</td>
                <td>${log.username || '—'}</td>
                <td>${log.action}</td>
                <td>${log.entity_type || ''}${log.entity_id ? ` (${log.entity_id})` : ''}</td>
                <td>${log.ip_address || 'n/a'}</td>
                <td>${statusBadge}</td>
                <td>${severityBadge}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading audit logs:', error);
        setTableMessage('audit-logs-tbody', 'Erreur réseau lors du chargement', 7);
    }
}

// ==================== SESSIONS ====================
async function loadSessions() {
    try {
        const response = await fetch('/admin/sessions/active');
        if (!response.ok) {
            setTableMessage('sessions-tbody', 'Impossible de charger les sessions', 6);
            return;
        }
        const data = await response.json();
        
        if (!data.success) {
            setTableMessage('sessions-tbody', data.error || 'Erreur côté serveur', 6);
            return;
        }
        
        document.getElementById('active-sessions-count').textContent = data.total_active || 0;
        
        const tbody = document.getElementById('sessions-tbody');
        tbody.innerHTML = '';
        
        if (!data.sessions || data.sessions.length === 0) {
            setTableMessage('sessions-tbody', 'Aucune session active', 6);
            return;
        }
        
        data.sessions.forEach(session => {
            const loginTime = new Date(session.login_time);
            const lastActivity = new Date(session.last_activity);
            const duration = new Date() - loginTime;
            const hours = Math.floor(duration / 3600000);
            const minutes = Math.floor((duration % 3600000) / 60000);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${session.username || '—'}</td>
                <td>${session.ip_address || 'n/a'}</td>
                <td>${loginTime.toLocaleString('fr-FR')}</td>
                <td>${lastActivity.toLocaleString('fr-FR')}</td>
                <td>${hours}h ${minutes}m</td>
                <td>
                    <button class="backup-btn" onclick="terminateSession('${session.session_token}')">
                        🚫 Terminer
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading sessions:', error);
        setTableMessage('sessions-tbody', 'Erreur réseau lors du chargement', 6);
    }
}

async function loadLoginHistory() {
    const days = document.getElementById('history-days').value || 30;
    
    try {
        const response = await fetch(`/admin/sessions/history?days=${days}&limit=50`);
        if (!response.ok) {
            setTableMessage('history-tbody', 'Impossible de charger l\'historique', 4);
            return;
        }
        const data = await response.json();
        
        if (!data.success) {
            setTableMessage('history-tbody', data.error || 'Erreur côté serveur', 4);
            return;
        }
        
        const tbody = document.getElementById('history-tbody');
        tbody.innerHTML = '';
        
        if (!data.history || data.history.length === 0) {
            setTableMessage('history-tbody', 'Aucun historique trouvé', 4);
            return;
        }
        
        data.history.forEach(entry => {
            const loginTime = new Date(entry.login_time).toLocaleString('fr-FR');
            const result = entry.success ? '✓ Succès' : '✗ Échec';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.username || '—'}</td>
                <td>${loginTime}</td>
                <td>${entry.ip_address || 'n/a'}</td>
                <td>${result}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading login history:', error);
        setTableMessage('history-tbody', 'Erreur réseau lors du chargement', 4);
    }
}

async function terminateSession(sessionToken) {
    if (!confirm('Êtes-vous sûr de vouloir terminer cette session ?')) return;
    
    try {
        const response = await fetch('/admin/sessions/terminate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_token: sessionToken })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Session terminée avec succès');
            loadSessions();
        } else {
            alert('Erreur: ' + data.error);
        }
    } catch (error) {
        console.error('Error terminating session:', error);
    }
}

// ==================== RETENTION ====================
async function loadRetentionPolicies() {
    try {
        const response = await fetch('/admin/retention/policies');
        if (!response.ok) {
            setBlockMessage('policy-container', 'Impossible de charger les politiques');
            return;
        }
        const data = await response.json();
        
        if (!data.success) {
            setBlockMessage('policy-container', data.error || 'Erreur côté serveur');
            return;
        }
        
        const container = document.getElementById('policy-container');
        container.innerHTML = '';
        
        if (!data.policies || data.policies.length === 0) {
            setBlockMessage('policy-container', 'Aucune politique trouvée');
            return;
        }
        
        data.policies.forEach(policy => {
            const card = document.createElement('div');
            card.className = 'policy-card';
            card.innerHTML = `
                <h4>${policy.entity_type}</h4>
                <div class="policy-field">
                    <label>Jours de Rétention</label>
                    <input type="number" value="${policy.retention_days}" 
                           onchange="updatePolicy(${policy.id}, this.value)">
                </div>
                <div class="policy-field">
                    <label>
                        <input type="checkbox" ${policy.enabled ? 'checked' : ''} 
                               onchange="updatePolicy(${policy.id}, ${policy.retention_days}, this.checked)">
                        Activé
                    </label>
                </div>
                <div class="policy-field">
                    <label>
                        <input type="checkbox" ${policy.auto_delete ? 'checked' : ''} 
                               onchange="updatePolicy(${policy.id}, ${policy.retention_days}, ${policy.enabled}, this.checked)">
                        Suppression Automatique
                    </label>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading retention policies:', error);
        setBlockMessage('policy-container', 'Erreur réseau lors du chargement');
    }
}

async function updatePolicy(policyId, retention_days, enabled = true, auto_delete = true) {
    try {
        const response = await fetch(`/admin/retention/policies/${policyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                retention_days: parseInt(retention_days),
                enabled: Boolean(enabled),
                auto_delete: Boolean(auto_delete)
            })
        });
        
        const data = await response.json();
        if (data.success) {
            loadRetentionPolicies();
        }
    } catch (error) {
        console.error('Error updating policy:', error);
    }
}

// ==================== SYSTEM STATS ====================
async function loadSystemStats() {
    try {
        const response = await fetch('/admin/system/stats');
        if (!response.ok) {
            document.getElementById('db-status').textContent = 'Erreur';
            setBlockMessage('system-details', 'Impossible de charger les métriques');
            setBlockMessage('db-details', 'Impossible de charger les métriques');
            return;
        }
        const data = await response.json();
        
        if (!data.success) {
            document.getElementById('db-status').textContent = 'Erreur';
            setBlockMessage('system-details', data.error || 'Erreur côté serveur');
            setBlockMessage('db-details', data.error || 'Erreur côté serveur');
            return;
        }
        
        // Update UI with system stats
        if (data.system) {
            document.getElementById('cpu-percent').textContent = data.system.cpu_percent + '%';
            document.getElementById('cpu-bar').style.width = data.system.cpu_percent + '%';
            
            document.getElementById('memory-percent').textContent = data.system.memory_percent + '%';
            document.getElementById('memory-bar').style.width = data.system.memory_percent + '%';
            
            document.getElementById('disk-percent').textContent = data.system.disk_percent + '%';
            document.getElementById('disk-bar').style.width = data.system.disk_percent + '%';
            
            const systemDetails = `
                <li><strong>Mémoire Totale:</strong> ${data.system.memory_total_gb} GB</li>
                <li><strong>Mémoire Utilisée:</strong> ${data.system.memory_used_gb} GB</li>
                <li><strong>Disque Total:</strong> ${data.system.disk_total_gb} GB</li>
                <li><strong>Disque Utilisé:</strong> ${data.system.disk_used_gb} GB</li>
            `;
            document.getElementById('system-details').innerHTML = systemDetails;
        }
        
        // Update database stats
        if (data.database) {
            const dbDetails = `
                <li><strong>Utilisateurs:</strong> ${data.database.users}</li>
                <li><strong>Lectures CO2:</strong> ${data.database.readings}</li>
                <li><strong>Journaux d'Audit:</strong> ${data.database.audit_logs}</li>
                <li><strong>Taille DB:</strong> ${data.database.size_mb} MB</li>
            `;
            document.getElementById('db-details').innerHTML = dbDetails;
        }
        
        // Update health status
        if (data.health) {
            document.getElementById('db-status').textContent = 
                data.health.database === 'healthy' ? '✓ Sain' : '✗ Erreur';
        }
    } catch (error) {
        console.error('Error loading system stats:', error);
        document.getElementById('db-status').textContent = 'Erreur';
        setBlockMessage('system-details', 'Erreur réseau lors du chargement');
        setBlockMessage('db-details', 'Erreur réseau lors du chargement');
    }
}

// ==================== BACKUPS ====================
async function loadBackups() {
    try {
        const response = await fetch('/admin/backups');
        if (!response.ok) {
            setBlockMessage('backups-list', 'Impossible de charger les sauvegardes');
            return;
        }
        const data = await response.json();
        
        if (!data.success) {
            setBlockMessage('backups-list', data.error || 'Erreur côté serveur');
            return;
        }
        
        const container = document.getElementById('backups-list');
        container.innerHTML = '';
        
        if (!data.backups || data.backups.length === 0) {
            setBlockMessage('backups-list', 'Aucune sauvegarde disponible');
            return;
        }
        
        data.backups.forEach(backup => {
            const item = document.createElement('div');
            item.className = 'backup-item';
            const created = new Date(backup.created).toLocaleString('fr-FR');
            
            item.innerHTML = `
                <div class="backup-info-text">
                    <div class="backup-name">💾 ${backup.name}</div>
                    <div class="backup-meta">${created} • ${backup.size_mb} MB</div>
                </div>
                <div class="backup-actions">
                    <button class="backup-btn" onclick="restoreBackup('${backup.name}')">
                        🔄 Restaurer
                    </button>
                    <button class="backup-btn danger" onclick="deleteBackupConfirm('${backup.name}')">
                        🗑️ Supprimer
                    </button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading backups:', error);
        setBlockMessage('backups-list', 'Erreur réseau lors du chargement');
    }
}

async function createBackup() {
    const backupName = document.getElementById('backup-name').value || null;
    
    try {
        const response = await fetch('/admin/backups/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ backup_name: backupName })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('✓ Sauvegarde créée: ' + data.backup_name);
            document.getElementById('backup-name').value = '';
            loadBackups();
        } else {
            alert('Erreur: ' + data.error);
        }
    } catch (error) {
        console.error('Error creating backup:', error);
    }
}

async function restoreBackup(backupName) {
    if (!confirm(`Êtes-vous sûr de vouloir restaurer '${backupName}' ? Cette action remplacera les données actuelles.`)) {
        return;
    }
    
    try {
        const response = await fetch('/admin/backups/restore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ backup_name: backupName })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('✓ Sauvegarde restaurée avec succès');
            loadBackups();
        } else {
            alert('Erreur: ' + data.error);
        }
    } catch (error) {
        console.error('Error restoring backup:', error);
    }
}

function deleteBackupConfirm(backupName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer '${backupName}' ?`)) {
        return;
    }
    deleteBackup(backupName);
}

async function deleteBackup(backupName) {
    try {
        const response = await fetch('/admin/backups/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ backup_name: backupName })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('✓ Sauvegarde supprimée');
            loadBackups();
        } else {
            alert('Erreur: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting backup:', error);
    }
}

// User Management Functions
async function loadUsers() {
    const page = document.getElementById('user-page')?.value || 1;
    const per_page = document.getElementById('user-per-page')?.value || 50;
    
    try {
        const response = await fetch(`/admin/users?page=${page}&per_page=${per_page}`);
        if (!response.ok) {
            setTableMessage('users-tbody', 'Impossible de charger les utilisateurs', 8);
            return;
        }
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('users-tbody');
            if (!data.users || data.users.length === 0) {
                setTableMessage('users-tbody', 'Aucun utilisateur trouvé', 8);
                return;
            }
            tbody.innerHTML = data.users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.is_admin ? '✓' : '✗'}</td>
                    <td>${user.is_active ? '✓' : '✗'}</td>
                    <td>${new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>${user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : '-'}</td>
                    <td>
                        <button onclick="viewUserActivity(${user.id})" class="mini-btn">👁️</button>
                        ${!user.is_active ? `<button onclick="enableUser(${user.id})" class="mini-btn">✓</button>` : ''}
                        ${user.is_active ? `<button onclick="disableUser(${user.id})" class="mini-btn">✗</button>` : ''}
                        <button onclick="resetUserPassword(${user.id})" class="mini-btn">🔑</button>
                        ${!user.is_admin ? `<button onclick="promoteUser(${user.id})" class="mini-btn">⬆️</button>` : ''}
                    </td>
                </tr>
            `).join('');
            
            document.getElementById('users-pagination').textContent = 
                `Page ${data.page} de ${data.pages} (${data.total} utilisateurs)`;
        } else {
            setTableMessage('users-tbody', data.error || 'Erreur côté serveur', 8);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        setTableMessage('users-tbody', 'Erreur réseau lors du chargement', 8);
    }
}

async function enableUser(userId) {
    if (confirm('Activer cet utilisateur ?')) {
        const response = await fetch(`/admin/users/${userId}/enable`, {method: 'POST'});
        const data = await response.json();
        if (data.success) {
            alert('✓ Utilisateur activé');
            loadUsers();
        }
    }
}

async function disableUser(userId) {
    if (confirm('Désactiver cet utilisateur ?')) {
        const response = await fetch(`/admin/users/${userId}/disable`, {method: 'POST'});
        const data = await response.json();
        if (data.success) {
            alert('✓ Utilisateur désactivé');
            loadUsers();
        }
    }
}

async function resetUserPassword(userId) {
    const password = prompt('Nouveau mot de passe (min 8 caractères):');
    if (password && password.length >= 8) {
        const response = await fetch(`/admin/users/${userId}/reset-password`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({password})
        });
        const data = await response.json();
        if (data.success) alert('✓ Mot de passe réinitialisé');
    }
}

async function promoteUser(userId) {
    if (confirm('Promouvoir cet utilisateur en administrateur ?')) {
        const response = await fetch(`/admin/users/${userId}/admin/promote`, {method: 'POST'});
        const data = await response.json();
        if (data.success) {
            alert('✓ Utilisateur promu');
            loadUsers();
        }
    }
}

async function viewUserActivity(userId) {
    const response = await fetch(`/admin/users/${userId}/activity`);
    const data = await response.json();
    if (data.success) {
        alert(`Activité Utilisateur:\n` +
              `Connexions: ${data.user.login_count}\n` +
              `Actions (30j): ${data.recent_actions}\n` +
              `Dernier accès: ${data.user.last_login || 'Jamais'}`);
    }
}

// Analytics Functions
async function loadAnalytics() {
    const days = document.getElementById('analytics-days')?.value || 30;
    try {
        const response = await fetch(`/admin/analytics/stats?days=${days}`);
        const data = await response.json();
        
        if (data.success) {
            // Top Actions
            const actionsHtml = Object.entries(data.top_actions)
                .slice(0, 5)
                .map(([action, count]) => `<div>${action}: <strong>${count}</strong></div>`)
                .join('');
            document.getElementById('top-actions').innerHTML = actionsHtml || 'Aucune donnée';
            
            // Top Users
            const usersHtml = Object.entries(data.top_users)
                .slice(0, 5)
                .map(([user, count]) => `<div>${user}: <strong>${count}</strong></div>`)
                .join('');
            document.getElementById('top-users').innerHTML = usersHtml || 'Aucune donnée';
            
            // Stats
            document.getElementById('analytics-stats').innerHTML = 
                `Actions Échouées: <strong>${data.failed_actions}</strong><br>Période: ${days} jours`;
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

async function searchLogs() {
    const query = document.getElementById('search-query')?.value || '';
    const action = document.getElementById('search-action')?.value || '';
    
    try {
        const params = new URLSearchParams({q: query, action: action, days: 30});
        const response = await fetch(`/admin/analytics/search?${params}`);
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('search-results-tbody');
            tbody.innerHTML = data.logs.map(log => `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                    <td>${log.username}</td>
                    <td>${log.action}</td>
                    <td>${log.entity_type}</td>
                    <td>${log.status}</td>
                </tr>
            `).join('') || '<tr><td colspan="5">Aucun résultat</td></tr>';
        }
    } catch (error) {
        console.error('Error searching logs:', error);
    }
}

async function exportLogsCSV() {
    const days = document.getElementById('analytics-days')?.value || 30;
    window.location.href = `/admin/analytics/export/csv?days=${days}`;
}

async function exportLogsJSON() {
    const days = document.getElementById('analytics-days')?.value || 30;
    window.location.href = `/admin/analytics/export/json?days=${days}`;
}

// Maintenance Functions
async function loadMaintenanceStatus() {
    try {
        const response = await fetch('/admin/maintenance/status');
        if (!response.ok) {
            document.getElementById('db-size').textContent = 'Erreur';
            document.getElementById('log-count').textContent = '—';
            document.getElementById('backup-count').textContent = '—';
            return;
        }
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('db-size').textContent = `${data.database_size_mb} MB`;
            document.getElementById('log-count').textContent = data.audit_logs;
            document.getElementById('backup-count').textContent = data.backups;
        } else {
            document.getElementById('db-size').textContent = 'Erreur';
            document.getElementById('log-count').textContent = 'Erreur';
            document.getElementById('backup-count').textContent = 'Erreur';
        }
    } catch (error) {
        console.error('Error loading maintenance status:', error);
        document.getElementById('db-size').textContent = 'Erreur';
        document.getElementById('log-count').textContent = '—';
        document.getElementById('backup-count').textContent = '—';
    }
}

async function optimizeDatabase() {
    if (confirm('Optimiser la base de données ? (peut prendre quelques minutes)')) {
        try {
            const response = await fetch('/admin/maintenance/optimize', {method: 'POST'});
            const data = await response.json();
            alert(data.success ? '✓ Optimisation complète' : '✗ Erreur: ' + data.error);
            loadMaintenanceStatus();
        } catch (error) {
            alert('Erreur: ' + error);
        }
    }
}

async function rotateLogs() {
    const days = document.getElementById('rotate-days').value || 90;
    if (confirm(`Supprimer les journaux plus anciens que ${days} jours ?`)) {
        try {
            const response = await fetch('/admin/maintenance/rotate-logs', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({days: parseInt(days)})
            });
            const data = await response.json();
            alert(data.success ? `✓ ${data.records_deleted} enregistrements supprimés` : '✗ Erreur');
        } catch (error) {
            alert('Erreur: ' + error);
        }
    }
}

async function cleanupBackups() {
    const keep = document.getElementById('keep-backups').value || 10;
    if (confirm(`Garder les ${keep} sauvegardes les plus récentes ?`)) {
        try {
            const response = await fetch('/admin/maintenance/cleanup-backups', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({keep_count: parseInt(keep)})
            });
            const data = await response.json();
            alert(data.success ? `✓ ${data.deleted} sauvegardes supprimées` : '✗ Erreur');
            loadMaintenanceStatus();
        } catch (error) {
            alert('Erreur: ' + error);
        }
    }
}
