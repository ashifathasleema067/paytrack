const express = require('express');
const { db, updateOverdueStatuses } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/invoices/next-number
router.get('/next-number', (req, res) => {
  try {
    const year = new Date().getFullYear();
    const countRow = db.prepare(`
      SELECT count(*) as total FROM invoices WHERE freelancer_id = ?
    `).get(req.user.id);
    const nextNum = (countRow.total || 0) + 1;
    const formatted = `INV-${year}-${String(nextNum).padStart(3, '0')}`;
    res.json({ nextInvoiceNumber: formatted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate invoice number.' });
  }
});

// GET /api/invoices
router.get('/', (req, res) => {
  try {
    updateOverdueStatuses();
    const { status, clientId, search } = req.query;

    let query = `
      SELECT 
        i.*,
        c.name as client_name,
        c.company as client_company,
        c.email as client_email,
        (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) as item_count
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.freelancer_id = ?
    `;
    const params = [req.user.id];

    if (status && status !== 'all') {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    if (clientId) {
      query += ` AND i.client_id = ?`;
      params.push(clientId);
    }

    if (search) {
      query += ` AND (i.invoice_number LIKE ? OR c.name LIKE ? OR c.company LIKE ?)`;
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY i.date_issued DESC, i.id DESC`;

    const invoices = db.prepare(query).all(...params);
    res.json(invoices);
  } catch (error) {
    console.error('Fetch invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices.' });
  }
});

// GET /api/invoices/:id
router.get('/:id', (req, res) => {
  try {
    updateOverdueStatuses();
    const invoice = db.prepare(`
      SELECT 
        i.*,
        c.name as client_name,
        c.company as client_company,
        c.email as client_email,
        c.phone as client_phone,
        c.address as client_address,
        u.name as freelancer_name,
        u.business_name,
        u.business_email,
        u.business_phone,
        u.business_address,
        u.currency
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      JOIN users u ON i.freelancer_id = u.id
      WHERE i.id = ? AND i.freelancer_id = ?
    `).get(req.params.id, req.user.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const items = db.prepare(`
      SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC
    `).all(invoice.id);

    const payments = db.prepare(`
      SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC
    `).all(invoice.id);

    res.json({
      ...invoice,
      items,
      payments
    });
  } catch (error) {
    console.error('Fetch invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice details.' });
  }
});

// POST /api/invoices
router.post('/', (req, res) => {
  try {
    const { client_id, invoice_number, date_issued, due_date, notes, items } = req.body;

    if (!client_id || !due_date || !items || !items.length) {
      return res.status(400).json({ error: 'Client, due date, and at least one item are required.' });
    }

    // Verify client belongs to current user
    const client = db.prepare('SELECT id FROM clients WHERE id = ? AND freelancer_id = ?').get(client_id, req.user.id);
    if (!client) {
      return res.status(400).json({ error: 'Selected client does not exist or belong to you.' });
    }

    // Calculate total amount
    let total_amount = 0;
    const validatedItems = items.map(item => {
      const quantity = Math.max(0.01, parseFloat(item.quantity) || 1);
      const rate = Math.max(0, parseFloat(item.rate) || 0);
      const amount = Math.round(quantity * rate * 100) / 100;
      total_amount += amount;
      return {
        description: item.description ? item.description.trim() : 'Service Item',
        quantity,
        rate,
        amount
      };
    });

    // Check overdue status immediately based on due date
    const today = new Date().toISOString().split('T')[0];
    const initialStatus = due_date < today ? 'Overdue' : 'Pending';

    let invNumber = invoice_number ? invoice_number.trim() : null;
    if (!invNumber) {
      const year = new Date().getFullYear();
      const countRow = db.prepare('SELECT count(*) as total FROM invoices WHERE freelancer_id = ?').get(req.user.id);
      invNumber = `INV-${year}-${String((countRow.total || 0) + 1).padStart(3, '0')}`;
    }

    const issueDate = date_issued || today;

    // Insert Invoice
    const insertInvoice = db.prepare(`
      INSERT INTO invoices (freelancer_id, client_id, invoice_number, date_issued, due_date, status, total_amount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const invResult = insertInvoice.run(
      req.user.id,
      client_id,
      invNumber,
      issueDate,
      due_date,
      initialStatus,
      total_amount,
      notes ? notes.trim() : ''
    );

    const invoiceId = invResult.lastInsertRowid;

    // Insert items
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of validatedItems) {
      insertItem.run(invoiceId, item.description, item.quantity, item.rate, item.amount);
    }

    res.status(201).json({
      message: 'Invoice created successfully!',
      invoiceId
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice.' });
  }
});

// PUT /api/invoices/:id
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM invoices WHERE id = ? AND freelancer_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const { client_id, invoice_number, date_issued, due_date, notes, items } = req.body;
    if (!client_id || !due_date || !items || !items.length) {
      return res.status(400).json({ error: 'Client, due date, and at least one item are required.' });
    }

    let total_amount = 0;
    const validatedItems = items.map(item => {
      const quantity = Math.max(0.01, parseFloat(item.quantity) || 1);
      const rate = Math.max(0, parseFloat(item.rate) || 0);
      const amount = Math.round(quantity * rate * 100) / 100;
      total_amount += amount;
      return {
        description: item.description ? item.description.trim() : 'Service Item',
        quantity,
        rate,
        amount
      };
    });

    const today = new Date().toISOString().split('T')[0];
    let newStatus = existing.status;
    if (existing.status !== 'Paid') {
      newStatus = due_date < today ? 'Overdue' : 'Pending';
    }

    db.prepare(`
      UPDATE invoices
      SET client_id = ?,
          invoice_number = ?,
          date_issued = ?,
          due_date = ?,
          status = ?,
          total_amount = ?,
          notes = ?
      WHERE id = ? AND freelancer_id = ?
    `).run(
      client_id,
      invoice_number || existing.invoice_number,
      date_issued || existing.date_issued,
      due_date,
      newStatus,
      total_amount,
      notes || '',
      req.params.id,
      req.user.id
    );

    // Replace items
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of validatedItems) {
      insertItem.run(req.params.id, item.description, item.quantity, item.rate, item.amount);
    }

    res.json({ message: 'Invoice updated successfully!' });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice.' });
  }
});

// PATCH /api/invoices/:id/pay
// Mark invoice as paid and record payment entry
router.patch('/:id/pay', (req, res) => {
  try {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND freelancer_id = ?').get(req.params.id, req.user.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    if (invoice.status === 'Paid') {
      return res.status(400).json({ error: 'This invoice is already marked as paid.' });
    }

    const { payment_date, payment_method, notes } = req.body;
    const paidDate = payment_date || new Date().toISOString().split('T')[0];
    const paidMethod = payment_method || 'Bank Transfer';

    // Update invoice status
    db.prepare(`
      UPDATE invoices
      SET status = 'Paid',
          payment_date = ?,
          payment_method = ?
      WHERE id = ? AND freelancer_id = ?
    `).run(paidDate, paidMethod, invoice.id, req.user.id);

    // Record in payments table
    db.prepare(`
      INSERT INTO payments (freelancer_id, invoice_id, client_id, amount, payment_date, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      invoice.id,
      invoice.client_id,
      invoice.total_amount,
      paidDate,
      paidMethod,
      notes ? notes.trim() : `Payment recorded for ${invoice.invoice_number}`
    );

    res.json({
      message: `Invoice ${invoice.invoice_number} marked as Paid!`,
      status: 'Paid',
      payment_date: paidDate,
      payment_method: paidMethod
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ error: 'Failed to record payment.' });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', (req, res) => {
  try {
    const invoice = db.prepare('SELECT id FROM invoices WHERE id = ? AND freelancer_id = ?').get(req.params.id, req.user.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoice.id);
    db.prepare('DELETE FROM payments WHERE invoice_id = ?').run(invoice.id);
    db.prepare('DELETE FROM invoices WHERE id = ? AND freelancer_id = ?').run(invoice.id, req.user.id);

    res.json({ message: 'Invoice deleted successfully.' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice.' });
  }
});

module.exports = router;
