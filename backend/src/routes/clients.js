const express = require('express');
const { db, updateOverdueStatuses } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/clients
// Returns all clients with aggregated financial metrics
router.get('/', (req, res) => {
  try {
    updateOverdueStatuses();
    const clients = db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT i.id) as invoice_count,
        COALESCE(SUM(CASE WHEN i.status = 'Paid' THEN i.total_amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN i.status IN ('Pending', 'Overdue') THEN i.total_amount ELSE 0 END), 0) as total_outstanding,
        COALESCE(SUM(i.total_amount), 0) as total_billed
      FROM clients c
      LEFT JOIN invoices i ON c.id = i.client_id
      WHERE c.freelancer_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all(req.user.id);

    res.json(clients);
  } catch (error) {
    console.error('Fetch clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients.' });
  }
});

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  try {
    updateOverdueStatuses();
    const client = db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT i.id) as invoice_count,
        COALESCE(SUM(CASE WHEN i.status = 'Paid' THEN i.total_amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN i.status IN ('Pending', 'Overdue') THEN i.total_amount ELSE 0 END), 0) as total_outstanding,
        COALESCE(SUM(i.total_amount), 0) as total_billed
      FROM clients c
      LEFT JOIN invoices i ON c.id = i.client_id
      WHERE c.id = ? AND c.freelancer_id = ?
      GROUP BY c.id
    `).get(req.params.id, req.user.id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    const invoices = db.prepare(`
      SELECT id, invoice_number, date_issued, due_date, status, total_amount, payment_date, payment_method, created_at
      FROM invoices
      WHERE client_id = ? AND freelancer_id = ?
      ORDER BY date_issued DESC
    `).all(client.id, req.user.id);

    const payments = db.prepare(`
      SELECT p.*, i.invoice_number
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE p.client_id = ? AND p.freelancer_id = ?
      ORDER BY p.payment_date DESC
    `).all(client.id, req.user.id);

    res.json({
      client,
      invoices,
      payments
    });
  } catch (error) {
    console.error('Fetch client detail error:', error);
    res.status(500).json({ error: 'Failed to fetch client details.' });
  }
});

// POST /api/clients
router.post('/', (req, res) => {
  try {
    const { name, email, phone, company, address, notes } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Client name and email are required.' });
    }

    const result = db.prepare(`
      INSERT INTO clients (freelancer_id, name, email, phone, company, address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      name.trim(),
      email.toLowerCase().trim(),
      phone ? phone.trim() : null,
      company ? company.trim() : null,
      address ? address.trim() : null,
      notes ? notes.trim() : null
    );

    const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      message: 'Client added successfully!',
      client: { ...newClient, invoice_count: 0, total_paid: 0, total_outstanding: 0, total_billed: 0 }
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client.' });
  }
});

// PUT /api/clients/:id
router.put('/:id', (req, res) => {
  try {
    const { name, email, phone, company, address, notes } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Client name and email are required.' });
    }

    const existing = db.prepare('SELECT id FROM clients WHERE id = ? AND freelancer_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    db.prepare(`
      UPDATE clients
      SET name = ?, email = ?, phone = ?, company = ?, address = ?, notes = ?
      WHERE id = ? AND freelancer_id = ?
    `).run(
      name.trim(),
      email.toLowerCase().trim(),
      phone ? phone.trim() : null,
      company ? company.trim() : null,
      address ? address.trim() : null,
      notes ? notes.trim() : null,
      req.params.id,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    res.json({ message: 'Client updated successfully!', client: updated });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client.' });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM clients WHERE id = ? AND freelancer_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    // SQLite cascade will remove related invoices & items & payments automatically
    db.prepare('DELETE FROM clients WHERE id = ? AND freelancer_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Client and associated records deleted successfully.' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client.' });
  }
});

module.exports = router;
