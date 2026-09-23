const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/payments
router.get('/', (req, res) => {
  try {
    const { clientId, startDate, endDate } = req.query;

    let query = `
      SELECT 
        p.*,
        i.invoice_number,
        i.total_amount as invoice_total,
        c.name as client_name,
        c.company as client_company,
        c.email as client_email
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN clients c ON p.client_id = c.id
      WHERE p.freelancer_id = ?
    `;
    const params = [req.user.id];

    if (clientId) {
      query += ` AND p.client_id = ?`;
      params.push(clientId);
    }

    if (startDate) {
      query += ` AND p.payment_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND p.payment_date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY p.payment_date DESC, p.id DESC`;

    const payments = db.prepare(query).all(...params);
    res.json(payments);
  } catch (error) {
    console.error('Fetch payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history.' });
  }
});

// GET /api/payments/export-csv
router.get('/export-csv', (req, res) => {
  try {
    const query = `
      SELECT 
        p.id as payment_id,
        i.invoice_number,
        c.name as client_name,
        COALESCE(c.company, '') as client_company,
        p.payment_date,
        p.payment_method,
        p.amount,
        COALESCE(p.notes, '') as notes
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN clients c ON p.client_id = c.id
      WHERE p.freelancer_id = ?
      ORDER BY p.payment_date DESC
    `;
    const payments = db.prepare(query).all(req.user.id);

    const headers = ['Payment ID', 'Invoice Number', 'Client Name', 'Company', 'Payment Date', 'Payment Method', 'Amount ($)', 'Notes'];
    const rows = payments.map(p => [
      p.payment_id,
      `"${p.invoice_number.replace(/"/g, '""')}"`,
      `"${p.client_name.replace(/"/g, '""')}"`,
      `"${p.client_company.replace(/"/g, '""')}"`,
      p.payment_date,
      `"${p.payment_method.replace(/"/g, '""')}"`,
      p.amount.toFixed(2),
      `"${p.notes.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=PayTrack-Payments-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export payment history CSV.' });
  }
});

module.exports = router;
