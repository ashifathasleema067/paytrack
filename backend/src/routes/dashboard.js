const express = require('express');
const { db, updateOverdueStatuses } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  try {
    updateOverdueStatuses();
    const userId = req.user.id;

    // 1. Core KPIs
    const kpiRow = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN total_amount ELSE 0 END), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN status = 'Overdue' THEN total_amount ELSE 0 END), 0) as total_overdue,
        COUNT(DISTINCT client_id) as active_clients,
        COUNT(*) as total_invoices,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END), 0) as paid_invoices_count,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pending_invoices_count,
        COALESCE(SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END), 0) as overdue_invoices_count
      FROM invoices
      WHERE freelancer_id = ?
    `).get(userId);

    // 2. Freelancer Health Score calculation
    // - On-time payment rate: of paid invoices, how many paid <= due_date
    const onTimeRow = db.prepare(`
      SELECT 
        COUNT(*) as paid_total,
        COALESCE(SUM(CASE WHEN payment_date <= due_date THEN 1 ELSE 0 END), 0) as on_time_count
      FROM invoices
      WHERE freelancer_id = ? AND status = 'Paid'
    `).get(userId);

    const paidTotal = onTimeRow.paid_total || 0;
    const onTimeTotal = onTimeRow.on_time_count || 0;
    const onTimeRate = paidTotal > 0 ? Math.round((onTimeTotal / paidTotal) * 100) : 100;

    const totalBilled = (kpiRow.total_earned || 0) + (kpiRow.total_outstanding || 0) + (kpiRow.total_overdue || 0);
    const overdueRatio = totalBilled > 0 ? ((kpiRow.total_overdue || 0) / totalBilled) : 0;

    // Health Score calculation (0 - 100):
    // Baseline: onTimeRate * 0.7 + (1 - overdueRatio) * 30
    let healthScore = 100;
    if (totalBilled > 0) {
      healthScore = Math.max(10, Math.min(100, Math.round((onTimeRate * 0.7) + ((1 - Math.min(1, overdueRatio * 2)) * 30))));
    }

    let healthStatus = 'Excellent';
    let healthMessage = 'Your cash flow and client payment reliability are outstanding.';
    if (healthScore < 60) {
      healthStatus = 'Action Needed';
      healthMessage = 'Multiple invoices are overdue. Consider sending automated payment reminders.';
    } else if (healthScore < 80) {
      healthStatus = 'Good';
      healthMessage = 'Consistent payments with minor overdue balances. Follow up on pending work.';
    }

    // 3. Monthly Earnings Trend & Paid vs Pending (past 6 calendar months)
    const monthlyStats = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      const yearMonth = `${year}-${month}`;

      // Invoices issued or paid in this month
      const row = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'Paid' AND substr(payment_date, 1, 7) = ? THEN total_amount ELSE 0 END), 0) as paid_amount,
          COALESCE(SUM(CASE WHEN status = 'Pending' AND substr(date_issued, 1, 7) = ? THEN total_amount ELSE 0 END), 0) as pending_amount,
          COALESCE(SUM(CASE WHEN status = 'Overdue' AND substr(date_issued, 1, 7) = ? THEN total_amount ELSE 0 END), 0) as overdue_amount,
          COALESCE(SUM(CASE WHEN substr(date_issued, 1, 7) = ? THEN total_amount ELSE 0 END), 0) as total_issued
        FROM invoices
        WHERE freelancer_id = ?
      `).get(yearMonth, yearMonth, yearMonth, yearMonth, userId);

      monthlyStats.push({
        month: monthLabel,
        yearMonth,
        earnings: row.paid_amount || 0,
        paid: row.paid_amount || 0,
        pending: row.pending_amount || 0,
        overdue: row.overdue_amount || 0,
        totalIssued: row.total_issued || 0
      });
    }

    // 4. Status Breakdown Donut data
    const statusBreakdown = [
      { name: 'Paid', value: kpiRow.paid_invoices_count, amount: kpiRow.total_earned, color: '#10b981' },
      { name: 'Pending', value: kpiRow.pending_invoices_count, amount: kpiRow.total_outstanding, color: '#f59e0b' },
      { name: 'Overdue', value: kpiRow.overdue_invoices_count, amount: kpiRow.total_overdue, color: '#ef4444' }
    ];

    // 5. Recent Invoices
    const recentInvoices = db.prepare(`
      SELECT 
        i.*,
        c.name as client_name,
        c.company as client_company
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.freelancer_id = ?
      ORDER BY i.date_issued DESC
      LIMIT 6
    `).all(userId);

    res.json({
      kpis: {
        totalEarned: kpiRow.total_earned,
        totalOutstanding: kpiRow.total_outstanding,
        totalOverdue: kpiRow.total_overdue,
        activeClients: kpiRow.active_clients,
        totalInvoices: kpiRow.total_invoices,
        paidCount: kpiRow.paid_invoices_count,
        pendingCount: kpiRow.pending_invoices_count,
        overdueCount: kpiRow.overdue_invoices_count
      },
      health: {
        score: healthScore,
        onTimeRate,
        onTimeCount: onTimeTotal,
        paidTotal,
        status: healthStatus,
        message: healthMessage
      },
      monthlyTrends: monthlyStats,
      statusBreakdown,
      recentInvoices
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to generate dashboard statistics.' });
  }
});

module.exports = router;
