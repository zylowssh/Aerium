// Tenant Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeTenantManagement();
});

function initializeTenantManagement() {
    // Initialize tabs
    initializeTabs();
    
    // Load initial data
    loadOrganizations();
    loadMembers();
    loadLocations();
    loadQuotas();
    
    // Bind event listeners
    bindCreateOrgModal();
    bindFormSubmission();
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

function bindCreateOrgModal() {
    const modal = document.getElementById('create-org-modal');
    const openBtn = document.querySelector('[onclick*="openCreateOrgModal"]');
    const closeBtn = document.querySelector('[onclick*="closeCreateOrgModal"]');
    
    if (openBtn) {
        openBtn.addEventListener('click', openCreateOrgModal);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCreateOrgModal);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeCreateOrgModal();
            }
        });
    }
}

function openCreateOrgModal() {
    const modal = document.getElementById('create-org-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeCreateOrgModal() {
    const modal = document.getElementById('create-org-modal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('create-org-form')?.reset();
    }
}

function bindFormSubmission() {
    // Create organization form
    const createOrgForm = document.getElementById('create-org-form');
    if (createOrgForm) {
        createOrgForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitCreateOrg();
        });
    }
    
    // Add member form
    const addMemberForm = document.getElementById('add-member-form');
    if (addMemberForm) {
        addMemberForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitAddMember();
        });
    }
    
    // Add location form
    const addLocationForm = document.getElementById('add-location-form');
    if (addLocationForm) {
        addLocationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitAddLocation();
        });
    }
}

function loadOrganizations() {
    fetch('/api/advanced/tenants')
        .then(response => response.json())
        .then(data => {
            const grid = document.querySelector('.org-grid');
            if (!grid || !data.tenants) return;
            
            grid.innerHTML = '';
            
            if (data.tenants.length === 0) {
                grid.innerHTML = '<p class="text-muted">No organizations yet</p>';
                return;
            }
            
            data.tenants.forEach(org => {
                const card = document.createElement('div');
                card.className = 'org-card';
                
                card.innerHTML = `
                    <h3>${org.name}</h3>
                    <p><strong>Subscription:</strong> ${org.subscription_tier}</p>
                    <p><strong>Users:</strong> ${org.member_count || 0}</p>
                    <p><strong>Created:</strong> ${new Date(org.created_at).toLocaleDateString()}</p>
                    <span class="org-plan">${org.subscription_tier.toUpperCase()}</span>
                    <div style="margin-top: 15px; display: flex; gap: 10px;">
                        <button class="btn btn-secondary" onclick="editOrganization(${org.id})">Edit</button>
                        <button class="btn" style="background: #dc3545; color: white;" onclick="deleteOrganization(${org.id})">Delete</button>
                    </div>
                `;
                
                grid.appendChild(card);
            });
        })
        .catch(error => console.error('Error loading organizations:', error));
}

function loadMembers() {
    fetch('/api/advanced/tenants/members')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('.members-table table tbody');
            if (!tbody || !data.members) return;
            
            tbody.innerHTML = '';
            
            if (data.members.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">No members yet</td></tr>';
                return;
            }
            
            data.members.forEach(member => {
                const row = document.createElement('tr');
                const joinDate = new Date(member.created_at).toLocaleDateString();
                
                row.innerHTML = `
                    <td>${member.user_name}</td>
                    <td>${member.email}</td>
                    <td><span class="role-badge ${member.role.toLowerCase()}">${member.role}</span></td>
                    <td>
                        <button class="btn-action" onclick="editMember(${member.id})">Edit</button>
                        <button class="btn-action" style="color: #dc3545;" onclick="removeMember(${member.id})">Remove</button>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error loading members:', error));
}

function loadLocations() {
    fetch('/api/advanced/tenants/locations')
        .then(response => response.json())
        .then(data => {
            const container = document.querySelector('.locations-list');
            if (!container || !data.locations) return;
            
            container.innerHTML = '';
            
            if (data.locations.length === 0) {
                container.innerHTML = '<p class="text-muted">No locations yet</p>';
                return;
            }
            
            data.locations.forEach(location => {
                const item = document.createElement('div');
                item.className = 'location-item';
                
                item.innerHTML = `
                    <div class="location-info">
                        <h4>${location.name}</h4>
                        <p><strong>Address:</strong> ${location.address}</p>
                        <p><strong>Sensors:</strong> ${location.sensor_count || 0}</p>
                    </div>
                    <div class="location-actions" style="display: flex; gap: 10px;">
                        <button class="btn-action" onclick="editLocation(${location.id})">Edit</button>
                        <button class="btn-action" style="color: #dc3545;" onclick="deleteLocation(${location.id})">Delete</button>
                    </div>
                `;
                
                container.appendChild(item);
            });
        })
        .catch(error => console.error('Error loading locations:', error));
}

function loadQuotas() {
    fetch('/api/advanced/tenants/quotas')
        .then(response => response.json())
        .then(data => {
            const container = document.querySelector('.quota-grid');
            if (!container || !data.quotas) return;
            
            container.innerHTML = '';
            
            data.quotas.forEach(quota => {
                const card = document.createElement('div');
                card.className = 'quota-card';
                
                const usagePercent = (quota.used / quota.limit) * 100;
                
                card.innerHTML = `
                    <h3>${quota.resource_type}</h3>
                    
                    <div class="quota-row">
                        <div class="quota-label">
                            <span>API Calls</span>
                            <span>${quota.used} / ${quota.limit}</span>
                        </div>
                        <div class="quota-bar">
                            <div class="quota-fill" style="width: ${Math.min(usagePercent, 100)}%"></div>
                        </div>
                    </div>
                    
                    <div class="quota-row">
                        <div class="quota-label">
                            <span>Storage</span>
                            <span>${quota.storage_used} / ${quota.storage_limit} GB</span>
                        </div>
                        <div class="quota-bar">
                            <div class="quota-fill" style="width: ${Math.min((quota.storage_used / quota.storage_limit) * 100, 100)}%"></div>
                        </div>
                    </div>
                    
                    <div class="quota-tier">
                        <strong>Plan: ${quota.plan_name}</strong>
                        <p>Renewal: ${new Date(quota.renewal_date).toLocaleDateString()}</p>
                        ${usagePercent > 80 ? '<p style="color: #dc3545;">⚠️ Usage exceeds 80%</p>' : ''}
                    </div>
                `;
                
                container.appendChild(card);
            });
        })
        .catch(error => console.error('Error loading quotas:', error));
}

function submitCreateOrg() {
    const formData = new FormData(document.getElementById('create-org-form'));
    
    fetch('/api/advanced/tenants', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeCreateOrgModal();
            loadOrganizations();
            showNotification('Organization created successfully!', 'success');
        } else {
            showNotification('Error: ' + (data.message || 'Failed to create organization'), 'error');
        }
    })
    .catch(error => {
        console.error('Error creating organization:', error);
        showNotification('Error creating organization', 'error');
    });
}

function submitAddMember() {
    const formData = new FormData(document.getElementById('add-member-form'));
    
    fetch('/api/advanced/tenants/members', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('add-member-form').reset();
            loadMembers();
            showNotification('Member added successfully!', 'success');
        } else {
            showNotification('Error: ' + (data.message || 'Failed to add member'), 'error');
        }
    })
    .catch(error => {
        console.error('Error adding member:', error);
        showNotification('Error adding member', 'error');
    });
}

function submitAddLocation() {
    const formData = new FormData(document.getElementById('add-location-form'));
    
    fetch('/api/advanced/tenants/locations', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('add-location-form').reset();
            loadLocations();
            showNotification('Location added successfully!', 'success');
        } else {
            showNotification('Error: ' + (data.message || 'Failed to add location'), 'error');
        }
    })
    .catch(error => {
        console.error('Error adding location:', error);
        showNotification('Error adding location', 'error');
    });
}

function editOrganization(orgId) {
    // Implementation for editing organization
    alert('Edit organization ' + orgId);
}

function deleteOrganization(orgId) {
    if (!confirm('Are you sure you want to delete this organization?')) {
        return;
    }
    
    fetch(`/api/advanced/tenants/${orgId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadOrganizations();
            showNotification('Organization deleted', 'success');
        } else {
            showNotification('Error deleting organization', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting organization:', error);
        showNotification('Error deleting organization', 'error');
    });
}

function editMember(memberId) {
    alert('Edit member ' + memberId);
}

function removeMember(memberId) {
    if (!confirm('Are you sure you want to remove this member?')) {
        return;
    }
    
    fetch(`/api/advanced/tenants/members/${memberId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadMembers();
            showNotification('Member removed', 'success');
        } else {
            showNotification('Error removing member', 'error');
        }
    })
    .catch(error => {
        console.error('Error removing member:', error);
        showNotification('Error removing member', 'error');
    });
}

function editLocation(locationId) {
    alert('Edit location ' + locationId);
}

function deleteLocation(locationId) {
    if (!confirm('Are you sure you want to delete this location?')) {
        return;
    }
    
    fetch(`/api/advanced/tenants/locations/${locationId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadLocations();
            showNotification('Location deleted', 'success');
        } else {
            showNotification('Error deleting location', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting location:', error);
        showNotification('Error deleting location', 'error');
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
