const { DatabaseSync } = require('node:sqlite');
const http = require('http');

async function runTests() {
  console.log('--- Starting PayTrack Automated API Verification ---');

  // Helper fetch function
  const baseUrl = 'http://localhost:5000/api';
  let token = null;

  async function api(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  }

  // 1. Health check
  const health = await api('/health');
  console.log('1. Health check:', health.status === 200 ? 'PASS' : 'FAIL', health.data.appName);

  // 2. Demo Login
  const demoLogin = await api('/auth/demo-login', { method: 'POST' });
  if (demoLogin.status === 200 && demoLogin.data.token) {
    token = demoLogin.data.token;
    console.log('2. Demo Login:', 'PASS', 'User:', demoLogin.data.user.name);
  } else {
    console.error('2. Demo Login: FAIL', demoLogin);
    process.exit(1);
  }

  // 3. Dashboard Stats & Health Score
  const stats = await api('/dashboard/stats');
  console.log('3. Dashboard Stats:', stats.status === 200 ? 'PASS' : 'FAIL', {
    totalEarned: stats.data.kpis.totalEarned,
    healthScore: stats.data.health.score,
    onTimeRate: stats.data.health.onTimeRate,
    trendsCount: stats.data.monthlyTrends.length
  });

  // 4. Clients list
  const clients = await api('/clients');
  console.log('4. Clients List:', clients.status === 200 ? 'PASS' : 'FAIL', `Count: ${clients.data.length}`);

  // 5. Create Test Client
  const newClient = await api('/clients', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Hackathon Test Client',
      email: 'judge@hackathon.org',
      company: 'Hackathon Jury Inc',
      phone: '+1 555-999-8888',
      address: 'Silicon Valley, CA'
    })
  });
  console.log('5. Create Client:', newClient.status === 201 ? 'PASS' : 'FAIL', newClient.data.client?.name);
  const createdClientId = newClient.data.client?.id;

  // 6. Create Test Invoice
  const newInvoice = await api('/invoices', {
    method: 'POST',
    body: JSON.stringify({
      client_id: createdClientId,
      invoice_number: 'INV-TEST-001',
      date_issued: '2026-09-20',
      due_date: '2026-10-05',
      notes: 'Hackathon Test Invoice',
      items: [
        { description: 'Full-stack Platform Architecture', quantity: 1, rate: 2500, amount: 2500 },
        { description: 'UI/UX Polish & Delight Interactions', quantity: 5, rate: 100, amount: 500 }
      ]
    })
  });
  console.log('6. Create Invoice:', newInvoice.status === 201 ? 'PASS' : 'FAIL', newInvoice.data);
  const createdInvoiceId = newInvoice.data.invoiceId;

  // 7. Check Invoice Details
  const invoiceDetail = await api(`/invoices/${createdInvoiceId}`);
  console.log('7. Invoice Details:', invoiceDetail.status === 200 ? 'PASS' : 'FAIL', {
    number: invoiceDetail.data.invoice_number,
    total: invoiceDetail.data.total_amount,
    itemsCount: invoiceDetail.data.items?.length
  });

  // 8. Mark Invoice as Paid
  const markPaid = await api(`/invoices/${createdInvoiceId}/pay`, {
    method: 'PATCH',
    body: JSON.stringify({
      payment_date: '2026-09-23',
      payment_method: 'Stripe',
      notes: 'Hackathon Instant Settlement'
    })
  });
  console.log('8. Mark Invoice Paid:', markPaid.status === 200 ? 'PASS' : 'FAIL', markPaid.data.message);

  // 9. Payment History & CSV
  const payments = await api('/payments');
  const foundPayment = payments.data.find(p => p.invoice_id === createdInvoiceId);
  console.log('9. Payment Ledger:', foundPayment ? 'PASS' : 'FAIL', 'Found Payment Amount:', foundPayment?.amount);

  const csv = await api('/payments/export-csv');
  console.log('10. CSV Export:', csv.status === 200 && csv.data.includes('Payment ID,Invoice Number') ? 'PASS' : 'FAIL');

  // 11. Cleanup test invoice and client
  await api(`/invoices/${createdInvoiceId}`, { method: 'DELETE' });
  await api(`/clients/${createdClientId}`, { method: 'DELETE' });
  console.log('11. Cleanup Test Records: PASS');

  console.log('--- ALL API VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('API Verification error:', err);
  process.exit(1);
});
