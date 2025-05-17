export const API_BASE = import.meta.env.VITE_PROXYME_API || 'http://localhost:5000';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export function registerAgent(scopes = []) {
  return request('/register_agent', {
    method: 'POST',
    body: JSON.stringify({ scopes }),
  });
}

export function delegate(user_id, agent_id, scopes = []) {
  return request('/delegate', {
    method: 'POST',
    body: JSON.stringify({ user_id, agent_id, scopes }),
  });
}

export function validateDelegation(delegation_token) {
  return request('/validate_delegation', {
    method: 'POST',
    body: JSON.stringify({ delegation_token }),
  });
}

export function revokeDelegation(delegation_token) {
  return request('/revoke_delegation', {
    method: 'POST',
    body: JSON.stringify({ delegation_token }),
  });
}

export function getAuditLogs(filters = {}) {
  return request('/audit_logs', {
    method: 'POST',
    body: JSON.stringify(filters),
  });
}
