// Collaboration JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeCollaboration();
});

function initializeCollaboration() {
    // Initialize tabs
    initializeTabs();
    
    // Load initial data
    loadTeamStats();
    loadSharedDashboards();
    loadAlerts();
    loadComments();
    loadActivityFeed();
    
    // Bind event listeners
    bindModalEvents();
    bindFormEvents();
    initWebSocket();
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(`${tabId}-content`)?.classList.add('active');
        });
    });
}

function bindModalEvents() {
    // Share Dashboard Modal
    const shareModal = document.getElementById('share-modal');
    const shareBtn = document.querySelector('[onclick*="openShareModal"]');
    const shareClose = document.querySelector('[data-modal="share"] .modal-close');
    
    if (shareBtn) {
        shareBtn.addEventListener('click', openShareModal);
    }
    
    if (shareClose) {
        shareClose.addEventListener('click', closeShareModal);
    }
    
    // Alert Modal
    const alertModal = document.getElementById('alert-modal');
    const alertBtn = document.querySelector('[onclick*="openAlertModal"]');
    const alertClose = document.querySelector('[data-modal="alert"] .modal-close');
    
    if (alertBtn) {
        alertBtn.addEventListener('click', openAlertModal);
    }
    
    if (alertClose) {
        alertClose.addEventListener('click', closeAlertModal);
    }
    
    // Close modals on outside click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
}

function bindFormEvents() {
    // Share form
    const shareForm = document.getElementById('share-form');
    if (shareForm) {
        shareForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitShareDashboard();
        });
    }
    
    // Alert form
    const alertForm = document.getElementById('alert-form');
    if (alertForm) {
        alertForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitCreateAlert();
        });
    }
    
    // Comment form
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitComment();
        });
    }
    
    // Activity filter
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadActivityFeed(this.getAttribute('data-filter'));
        });
    });
}

function openShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('share-form')?.reset();
    }
}

function openAlertModal() {
    const modal = document.getElementById('alert-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeAlertModal() {
    const modal = document.getElementById('alert-modal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('alert-form')?.reset();
    }
}

function loadTeamStats() {
    fetch('/api/advanced/collaboration/stats')
        .then(response => response.json())
        .then(data => {
            if (data.stats) {
                document.querySelector('[data-stat="members"]').textContent = data.stats.active_members || 0;
                document.querySelector('[data-stat="alerts"]').textContent = data.stats.alerts || 0;
                document.querySelector('[data-stat="comments"]').textContent = data.stats.comments || 0;
                document.querySelector('[data-stat="events"]').textContent = data.stats.events || 0;
            }
        })
        .catch(error => console.error('Error loading stats:', error));
}

function loadSharedDashboards() {
    fetch('/api/advanced/collaboration/shares')
        .then(response => response.json())
        .then(data => {
            const grid = document.querySelector('.share-grid');
            if (!grid || !data.shares) return;
            
            grid.innerHTML = '';
            
            if (data.shares.length === 0) {
                grid.innerHTML = '<p class="text-muted">No shared dashboards yet</p>';
                return;
            }
            
            data.shares.forEach(share => {
                const card = document.createElement('div');
                card.className = 'share-card';
                
                const sharedWith = share.shared_with.join(', ') || 'No one';
                
                card.innerHTML = `
                    <h3>${share.dashboard_name}</h3>
                    <p><strong>Shared by:</strong> ${share.shared_by}</p>
                    <p><strong>Created:</strong> ${new Date(share.created_at).toLocaleDateString()}</p>
                    <div class="share-users">
                        <strong>Shared with:</strong> ${sharedWith}
                    </div>
                    <div class="share-actions">
                        <button class="btn-action" onclick="editShare(${share.id})">Edit</button>
                        <button class="btn-action" style="color: #dc3545;" onclick="revokeShare(${share.id})">Revoke</button>
                    </div>
                `;
                
                grid.appendChild(card);
            });
        })
        .catch(error => console.error('Error loading shares:', error));
}

function loadAlerts() {
    fetch('/api/advanced/collaboration/alerts')
        .then(response => response.json())
        .then(data => {
            const list = document.querySelector('.alerts-list');
            if (!list || !data.alerts) return;
            
            list.innerHTML = '';
            
            if (data.alerts.length === 0) {
                list.innerHTML = '<p class="text-muted">No alerts configured</p>';
                return;
            }
            
            data.alerts.forEach(alert => {
                const item = document.createElement('div');
                item.className = `alert-item ${alert.severity.toLowerCase()}`;
                
                item.innerHTML = `
                    <div class="alert-content">
                        <h4>${alert.name}</h4>
                        <p><strong>Condition:</strong> ${alert.condition}</p>
                        <p><strong>Threshold:</strong> ${alert.threshold}</p>
                    </div>
                    <span class="alert-trigger ${alert.severity.toLowerCase()}">${alert.severity}</span>
                `;
                
                list.appendChild(item);
            });
        })
        .catch(error => console.error('Error loading alerts:', error));
}

function loadComments() {
    fetch('/api/advanced/collaboration/comments')
        .then(response => response.json())
        .then(data => {
            const list = document.querySelector('.comments-list');
            if (!list || !data.comments) return;
            
            list.innerHTML = '';
            
            // Group comments by reading_id
            const grouped = {};
            data.comments.forEach(comment => {
                if (!grouped[comment.reading_id]) {
                    grouped[comment.reading_id] = [];
                }
                grouped[comment.reading_id].push(comment);
            });
            
            if (Object.keys(grouped).length === 0) {
                list.innerHTML = '<p class="text-muted">No comments yet</p>';
                return;
            }
            
            Object.entries(grouped).forEach(([readingId, comments]) => {
                const thread = document.createElement('div');
                thread.className = 'comment-thread';
                
                thread.innerHTML = `<h4>Reading #${readingId}</h4>`;
                
                comments.forEach(comment => {
                    const commentDiv = document.createElement('div');
                    commentDiv.className = 'comment-item';
                    
                    commentDiv.innerHTML = `
                        <div>
                            <span class="comment-author">${comment.user_name}</span>
                            <span class="comment-time">${new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <div class="comment-text">${comment.text}</div>
                    `;
                    
                    thread.appendChild(commentDiv);
                });
                
                // Add comment form
                const form = document.createElement('div');
                form.className = 'comment-form';
                form.innerHTML = `
                    <textarea placeholder="Add a comment..." data-reading-id="${readingId}"></textarea>
                    <button class="btn-comment" onclick="submitComment(${readingId})">Comment</button>
                `;
                
                thread.appendChild(form);
                list.appendChild(thread);
            });
        })
        .catch(error => console.error('Error loading comments:', error));
}

function loadActivityFeed(filter = 'all') {
    let url = '/api/advanced/collaboration/activity';
    if (filter !== 'all') {
        url += `?filter=${filter}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const list = document.querySelector('.activity-list');
            if (!list || !data.activity) return;
            
            list.innerHTML = '';
            
            if (data.activity.length === 0) {
                list.innerHTML = '<p class="text-muted">No activity</p>';
                return;
            }
            
            data.activity.forEach(activity => {
                const item = document.createElement('div');
                item.className = 'activity-item';
                
                const iconMap = {
                    'share': '📤',
                    'comment': '💬',
                    'alert': '🔔',
                    'update': '✏️'
                };
                
                item.innerHTML = `
                    <div class="activity-icon">${iconMap[activity.type] || '📝'}</div>
                    <div class="activity-content">
                        <h4>${activity.title}</h4>
                        <p>${activity.description}</p>
                        <span class="activity-time">${new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                `;
                
                list.appendChild(item);
            });
        })
        .catch(error => console.error('Error loading activity feed:', error));
}

function submitShareDashboard() {
    const formData = new FormData(document.getElementById('share-form'));
    
    fetch('/api/advanced/collaboration/shares', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeShareModal();
            loadSharedDashboards();
            showNotification('Dashboard shared successfully!', 'success');
        } else {
            showNotification('Error sharing dashboard', 'error');
        }
    })
    .catch(error => {
        console.error('Error sharing dashboard:', error);
        showNotification('Error sharing dashboard', 'error');
    });
}

function submitCreateAlert() {
    const formData = new FormData(document.getElementById('alert-form'));
    
    fetch('/api/advanced/collaboration/alerts', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeAlertModal();
            loadAlerts();
            showNotification('Alert created successfully!', 'success');
        } else {
            showNotification('Error creating alert', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating alert:', error);
        showNotification('Error creating alert', 'error');
    });
}

function submitComment(readingId) {
    const textarea = document.querySelector(`textarea[data-reading-id="${readingId}"]`);
    const text = textarea.value.trim();
    
    if (!text) {
        alert('Please enter a comment');
        return;
    }
    
    fetch('/api/advanced/collaboration/comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            reading_id: readingId,
            text: text
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            textarea.value = '';
            loadComments();
            showNotification('Comment added', 'success');
        } else {
            showNotification('Error adding comment', 'error');
        }
    })
    .catch(error => {
        console.error('Error adding comment:', error);
        showNotification('Error adding comment', 'error');
    });
}

function editShare(shareId) {
    alert('Edit share ' + shareId);
}

function revokeShare(shareId) {
    if (!confirm('Are you sure you want to revoke this share?')) {
        return;
    }
    
    fetch(`/api/advanced/collaboration/shares/${shareId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadSharedDashboards();
            showNotification('Share revoked', 'success');
        } else {
            showNotification('Error revoking share', 'error');
        }
    })
    .catch(error => {
        console.error('Error revoking share:', error);
        showNotification('Error revoking share', 'error');
    });
}

function initWebSocket() {
    // Initialize WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/socket.io/?transport=websocket`);
    
    ws.onopen = function() {
        console.log('WebSocket connected for collaboration');
    };
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        // Handle real-time updates
        if (data.type === 'new_activity') {
            loadActivityFeed();
        } else if (data.type === 'new_comment') {
            loadComments();
        } else if (data.type === 'new_alert') {
            loadAlerts();
            loadTeamStats();
        }
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
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
