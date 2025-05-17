const API_BASE_URL = 'http://127.0.0.1:5001';

// Helper function to display results
function displayResult(elementId, data, isError = false) {
    const element = document.getElementById(elementId);
    if (isError) {
        element.innerHTML = `<div class="alert alert-danger">${data.error || data}</div>`;
    } else {
        element.innerHTML = `<div class="alert alert-success">${JSON.stringify(data, null, 2)}</div>`;
    }
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
}

// Helper function to format details
function formatDetails(details) {
    if (!details) return '';
    try {
        const parsed = JSON.parse(details);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return details;
    }
}

// Load audit logs
async function loadAuditLogs() {
    try {
        const eventType = document.getElementById('eventTypeFilter').value;
        const userId = document.getElementById('userIdFilter').value;
        const agentId = document.getElementById('agentIdFilter').value;
        const status = document.getElementById('statusFilter').value;

        const response = await fetch(`${API_BASE_URL}/audit_logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_type: eventType || undefined,
                user_id: userId || undefined,
                agent_id: agentId || undefined,
                status: status || undefined
            })
        });

        const logs = await response.json();
        const tableBody = document.getElementById('auditLogsTable');
        tableBody.innerHTML = '';

        logs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatTimestamp(log.timestamp)}</td>
                <td>${log.event_type}</td>
                <td>${log.action}</td>
                <td><span class="badge ${log.status === 'success' ? 'bg-success' : 'bg-danger'}">${log.status}</span></td>
                <td>${log.user_id || '-'}</td>
                <td>${log.agent_id || '-'}</td>
                <td>${log.ip_address || '-'}</td>
                <td><pre class="mb-0">${formatDetails(log.details)}</pre></td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading audit logs:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Register Agent Form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const scopes = Array.from(document.querySelectorAll('input[name="scopes"]:checked')).map(cb => cb.value);
        
        try {
            const response = await fetch(`${API_BASE_URL}/register_agent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ scopes })
            });
            const data = await response.json();
            displayResult('registerResult', data);
            loadAuditLogs(); // Refresh logs after registration
        } catch (error) {
            displayResult('registerResult', error, true);
        }
    });

    // Delegate Token Form
    document.getElementById('delegateForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const scopes = Array.from(document.querySelectorAll('input[name="scopes"]:checked')).map(cb => cb.value);
        
        try {
            const response = await fetch(`${API_BASE_URL}/delegate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: formData.get('user_id'),
                    agent_id: formData.get('agent_id'),
                    scopes
                })
            });
            const data = await response.json();
            displayResult('delegateResult', data);
            loadAuditLogs(); // Refresh logs after delegation
        } catch (error) {
            displayResult('delegateResult', error, true);
        }
    });

    // Validate Token Form
    document.getElementById('validateForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(`${API_BASE_URL}/validate_delegation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    delegation_token: formData.get('delegation_token')
                })
            });
            const data = await response.json();
            displayResult('validateResult', data);
            loadAuditLogs(); // Refresh logs after validation
        } catch (error) {
            displayResult('validateResult', error, true);
        }
    });

    // Revoke Token Form
    document.getElementById('revokeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(`${API_BASE_URL}/revoke_delegation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    delegation_token: formData.get('delegation_token')
                })
            });
            const data = await response.json();
            displayResult('revokeResult', data);
            loadAuditLogs(); // Refresh logs after revocation
        } catch (error) {
            displayResult('revokeResult', error, true);
        }
    });

    // Audit Log Filters
    document.getElementById('eventTypeFilter').addEventListener('change', loadAuditLogs);
    document.getElementById('userIdFilter').addEventListener('input', loadAuditLogs);
    document.getElementById('agentIdFilter').addEventListener('input', loadAuditLogs);
    document.getElementById('statusFilter').addEventListener('change', loadAuditLogs);

    // Refresh and Clear Filter Buttons
    document.getElementById('refreshLogs').addEventListener('click', loadAuditLogs);
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('eventTypeFilter').value = '';
        document.getElementById('userIdFilter').value = '';
        document.getElementById('agentIdFilter').value = '';
        document.getElementById('statusFilter').value = '';
        loadAuditLogs();
    });

    // Initial load of audit logs
    loadAuditLogs();
}); 