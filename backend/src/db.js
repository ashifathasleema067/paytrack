const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'paytrack.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for better concurrency and integrity
db.exec('PRAGMA foreign_keys = ON;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      business_name TEXT,
      business_email TEXT,
      business_phone TEXT,
      business_address TEXT,
      currency TEXT DEFAULT 'USD',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      freelancer_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(freelancer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      freelancer_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      date_issued TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      payment_date TEXT,
      payment_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      rate REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      freelancer_id INTEGER NOT NULL,
      invoice_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_freelancer ON invoices(freelancer_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_clients_freelancer ON clients(freelancer_id);
    CREATE INDEX IF NOT EXISTS idx_payments_freelancer ON payments(freelancer_id);
  `);
}

/**
 * Auto-detect and transition any Pending invoices whose due_date < current date to 'Overdue'
 */
function updateOverdueStatuses() {
  const today = new Date().toISOString().split('T')[0];
  const stmt = db.prepare(`
    UPDATE invoices
    SET status = 'Overdue'
    WHERE status = 'Pending' AND due_date < ?
  `);
  stmt.run(today);
}

/**
 * Seed realistic demo data for the Demo account
 */
function seedDemoData() {
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('alex@paytrack.dev');
  if (existingUser) {
    return existingUser.id;
  }

  const hashedPassword = bcrypt.hashSync('demo123', 10);
  const userResult = db.prepare(`
    INSERT INTO users (name, email, password, business_name, business_email, business_phone, business_address, currency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Alex Morgan',
    'alex@paytrack.dev',
    hashedPassword,
    'Morgan Studio & Digital Craft',
    'alex@morganstudio.design',
    '+1 (555) 234-8901',
    '450 Mission Street, Suite 300, San Francisco, CA 94105',
    'USD'
  );

  const userId = userResult.lastInsertRowid;
  seedUserData(userId);
  return userId;
}

function resetUserData(userId) {
  // Clear existing items, invoices, payments, and clients
  db.exec('PRAGMA foreign_keys = OFF;');
  db.prepare('DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE freelancer_id = ?)').run(userId);
  db.prepare('DELETE FROM payments WHERE freelancer_id = ?').run(userId);
  db.prepare('DELETE FROM invoices WHERE freelancer_id = ?').run(userId);
  db.prepare('DELETE FROM clients WHERE freelancer_id = ?').run(userId);
  db.exec('PRAGMA foreign_keys = ON;');

  seedUserData(userId);
}

function seedUserData(userId) {
  const clientStmt = db.prepare(`
    INSERT INTO clients (freelancer_id, name, email, phone, company, address, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const c1 = clientStmt.run(userId, 'Sarah Jenkins', 'sarah@acmedigital.com', '+1 (555) 301-8842', 'Acme Digital Agency', '100 Broadway, New York, NY', 'Key client for brand design and ongoing UI/UX consulting. Net-15 payment terms.').lastInsertRowid;
  const c2 = clientStmt.run(userId, 'Marcus Vance', 'marcus@technovahq.io', '+1 (555) 442-9910', 'TechNova Labs', '742 Evergreen Terr, Austin, TX', 'Series-A startup. Web app frontend development & design system implementation.').lastInsertRowid;
  const c3 = clientStmt.run(userId, 'Elena Rostova', 'elena@starlightmedia.co', '+1 (555) 670-1234', 'Starlight Media', '500 Sunset Blvd, Los Angeles, CA', 'Creative video & motion graphics client. Prompt payer.').lastInsertRowid;
  const c4 = clientStmt.run(userId, 'David Chen', 'dchen@zenithcloud.com', '+1 (555) 892-4567', 'Zenith Cloud Systems', '88 1st Ave, Seattle, WA', 'Enterprise cloud dashboard UI refresh. Net-30 payment terms.').lastInsertRowid;
  const c5 = clientStmt.run(userId, 'Priya Patel', 'priya@bloomcollective.org', '+1 (555) 123-7890', 'Bloom Collective', '350 Michigan Ave, Chicago, IL', 'Non-profit redesign initiative. Friendly team, fast approvals.').lastInsertRowid;

  const invStmt = db.prepare(`
    INSERT INTO invoices (freelancer_id, client_id, invoice_number, date_issued, due_date, status, total_amount, notes, payment_date, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const itemStmt = db.prepare(`
    INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount)
    VALUES (?, ?, ?, ?, ?)
  `);

  const paymentStmt = db.prepare(`
    INSERT INTO payments (freelancer_id, invoice_id, client_id, amount, payment_date, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Today is approximately 2026-09-23. Let's seed invoices spanning 6 months (April to September 2026)
  // 1. April Paid (INV-2026-001)
  const inv1 = invStmt.run(userId, c1, 'INV-2026-001', '2026-04-02', '2026-04-17', 'Paid', 3600, 'Brand Identity & Design System sprint', '2026-04-14', 'Bank Transfer').lastInsertRowid;
  itemStmt.run(inv1, 'Brand Identity Guidelines & Vector Assets', 1, 2000, 2000);
  itemStmt.run(inv1, 'Figma Design System & Component Library', 16, 100, 1600);
  paymentStmt.run(userId, inv1, c1, 3600, '2026-04-14', 'Bank Transfer', 'Received via ACH transfer #ACH-9821');

  // 2. May Paid (INV-2026-002)
  const inv2 = invStmt.run(userId, c2, 'INV-2026-002', '2026-05-05', '2026-05-20', 'Paid', 4800, 'Frontend Prototype & Dashboard Development', '2026-05-18', 'Stripe').lastInsertRowid;
  itemStmt.run(inv2, 'React Dashboard Scaffold & Theme Setup', 20, 120, 2400);
  itemStmt.run(inv2, 'Interactive Analytics & Recharts Integration', 20, 120, 2400);
  paymentStmt.run(userId, inv2, c2, 4800, '2026-05-18', 'Stripe', 'Stripe balance payout #ch_991823');

  // 3. June Paid (INV-2026-003)
  const inv3 = invStmt.run(userId, c3, 'INV-2026-003', '2026-06-10', '2026-06-25', 'Paid', 2750, 'Social Campaign Creative & Video Titles', '2026-06-22', 'PayPal').lastInsertRowid;
  itemStmt.run(inv3, 'Animated Title Sequences (5 variations)', 5, 350, 1750);
  itemStmt.run(inv3, 'Instagram & TikTok Story Asset Pack', 1, 1000, 1000);
  paymentStmt.run(userId, inv3, c3, 2750, '2026-06-22', 'PayPal', 'PayPal Transaction #PP-0192934');

  // 4. July Paid (INV-2026-004)
  const inv4 = invStmt.run(userId, c1, 'INV-2026-004', '2026-07-02', '2026-07-17', 'Paid', 4200, 'Mobile Application UI Kit Phase 2', '2026-07-15', 'Bank Transfer').lastInsertRowid;
  itemStmt.run(inv4, 'iOS & Android Screen Mockups (35 screens)', 35, 100, 3500);
  itemStmt.run(inv4, 'Interactive Clickable Prototyping', 7, 100, 700);
  paymentStmt.run(userId, inv4, c1, 4200, '2026-07-15', 'Bank Transfer', 'Wire transfer received #WT-77621');

  // 5. July Paid (INV-2026-005)
  const inv5 = invStmt.run(userId, c4, 'INV-2026-005', '2026-07-14', '2026-08-14', 'Paid', 5500, 'Enterprise Cloud Console Architecture Review', '2026-08-10', 'Bank Transfer').lastInsertRowid;
  itemStmt.run(inv5, 'Design Architecture Audit & Usability Report', 1, 2500, 2500);
  itemStmt.run(inv5, 'Design Token Migration & Tailwind Config', 25, 120, 3000);
  paymentStmt.run(userId, inv5, c4, 5500, '2026-08-10', 'Bank Transfer', 'ACH deposit from Zenith Accounts Payable');

  // 6. August Paid (INV-2026-006)
  const inv6 = invStmt.run(userId, c5, 'INV-2026-006', '2026-08-01', '2026-08-16', 'Paid', 1900, 'Non-profit Landing Page & Donation Flow', '2026-08-15', 'Credit Card').lastInsertRowid;
  itemStmt.run(inv6, 'Responsive Landing Page Wireframing & Design', 1, 1200, 1200);
  itemStmt.run(inv6, 'Custom Donation Step-by-Step Flow', 1, 700, 700);
  paymentStmt.run(userId, inv6, c5, 1900, '2026-08-15', 'Credit Card', 'Online credit card invoice portal');

  // 7. August Paid (INV-2026-007)
  const inv7 = invStmt.run(userId, c2, 'INV-2026-007', '2026-08-18', '2026-09-02', 'Paid', 3200, 'API Integration & Realtime Websockets UI', '2026-08-30', 'Bank Transfer').lastInsertRowid;
  itemStmt.run(inv7, 'WebSocket Connection State & Reconnection UI', 16, 125, 2000);
  itemStmt.run(inv7, 'Live Notification Center & Toast Component', 8, 150, 1200);
  paymentStmt.run(userId, inv7, c2, 3200, '2026-08-30', 'Bank Transfer', 'Direct deposit #DD-1290');

  // 8. Overdue Invoice (INV-2026-008) - Due earlier this month (e.g. Sept 8)
  const inv8 = invStmt.run(userId, c4, 'INV-2026-008', '2026-08-20', '2026-09-08', 'Overdue', 3800, 'Cloud Billing Analytics Module', null, null).lastInsertRowid;
  itemStmt.run(inv8, 'Cost Allocation Charts & Filtering Views', 20, 120, 2400);
  itemStmt.run(inv8, 'Exportable CSV / PDF Reporting Engine', 10, 140, 1400);

  // 9. Overdue Invoice (INV-2026-009) - Due Sept 15
  const inv9 = invStmt.run(userId, c3, 'INV-2026-009', '2026-08-28', '2026-09-15', 'Overdue', 1500, 'Teaser Reel Motion Graphics', null, null).lastInsertRowid;
  itemStmt.run(inv9, 'Teaser Reel Motion Graphics (30s 4K)', 1, 1500, 1500);

  // 10. Pending Invoice (INV-2026-010) - Due Sept 28 (upcoming)
  const inv10 = invStmt.run(userId, c1, 'INV-2026-010', '2026-09-12', '2026-09-28', 'Pending', 4500, 'Q4 Marketing Website Refresh', null, null).lastInsertRowid;
  itemStmt.run(inv10, 'Hero Section 3D Interactive Illustration', 1, 1800, 1800);
  itemStmt.run(inv10, 'Conversion-Optimized Pricing Calculator', 18, 150, 2700);

  // 11. Pending Invoice (INV-2026-011) - Due Oct 05 (upcoming)
  const inv11 = invStmt.run(userId, c2, 'INV-2026-011', '2026-09-18', '2026-10-05', 'Pending', 2850, 'User Permissions & Role Management Screen', null, null).lastInsertRowid;
  itemStmt.run(inv11, 'Role-Based Access Control UI (RBAC)', 15, 130, 1950);
  itemStmt.run(inv11, 'Audit Log Viewer & Search Filters', 6, 150, 900);

  // 12. Pending Invoice (INV-2026-012) - Due Oct 12 (upcoming)
  const inv12 = invStmt.run(userId, c5, 'INV-2026-012', '2026-09-20', '2026-10-12', 'Pending', 1200, 'Accessibility (a11y) & WCAG 2.1 AA Audit', null, null).lastInsertRowid;
  itemStmt.run(inv12, 'Screen Reader & Contrast Remediations', 10, 120, 1200);

  updateOverdueStatuses();
}

// Initialize tables and demo data on load
initSchema();
seedDemoData();

module.exports = {
  db,
  updateOverdueStatuses,
  resetUserData,
  seedDemoData
};
