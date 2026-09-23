const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('paytrack_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('paytrack_token', token);
  } else {
    localStorage.removeItem('paytrack_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    setAuthToken(null);
    window.dispatchEvent(new Event('auth-expired'));
  }

  // Handle CSV export or non-json
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    if (!response.ok) throw new Error('Failed to export CSV');
    return await response.blob();
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong with the server request.');
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (userData) => request('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
  demoLogin: () => request('/auth/demo-login', { method: 'POST' }),
  getCurrentUser: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  resetDemoData: () => request('/auth/reset-demo', { method: 'POST' }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Clients
  getClients: () => request('/clients'),
  getClient: (id) => request(`/clients/${id}`),
  createClient: (clientData) => request('/clients', { method: 'POST', body: JSON.stringify(clientData) }),
  updateClient: (id, clientData) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(clientData) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.clientId) query.append('clientId', params.clientId);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return request(`/invoices${qs ? `?${qs}` : ''}`);
  },
  getNextInvoiceNumber: () => request('/invoices/next-number'),
  getInvoice: (id) => request(`/invoices/${id}`),
  createInvoice: (invoiceData) => request('/invoices', { method: 'POST', body: JSON.stringify(invoiceData) }),
  updateInvoice: (id, invoiceData) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(invoiceData) }),
  markAsPaid: (id, paymentData) => request(`/invoices/${id}/pay`, { method: 'PATCH', body: JSON.stringify(paymentData) }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),

  // Payments
  getPayments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.clientId) query.append('clientId', params.clientId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    const qs = query.toString();
    return request(`/payments${qs ? `?${qs}` : ''}`);
  },
  exportPaymentsCsv: async () => {
    const blob = await request('/payments/export-csv');
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PayTrack-Payments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};
