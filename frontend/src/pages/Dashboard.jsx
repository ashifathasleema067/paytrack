import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  AlertCircle, 
  Users, 
  ArrowUpRight, 
  PlusCircle, 
  FileText,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import HealthScoreRing from '../components/HealthScoreRing';
import MarkPaidModal from '../components/MarkPaidModal';
import CurrencyToggle from '../components/CurrencyToggle';

export default function Dashboard({ onNavigate, onNewInvoice, onViewInvoice }) {
  const { user } = useAuth();
  const { currency, currencySymbol, formatCurrency, convertAmount } = useCurrency();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Loading your financial dashboard...</p>
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const health = stats?.health || {};
  const monthlyTrendsRaw = stats?.monthlyTrends || [];
  const statusBreakdownRaw = stats?.statusBreakdown || [];
  const recentInvoices = stats?.recentInvoices || [];

  // Convert chart trends dynamically according to selected currency
  const monthlyTrends = monthlyTrendsRaw.map(m => ({
    ...m,
    earnings: Math.round(convertAmount(m.earnings)),
    paid: Math.round(convertAmount(m.paid)),
    pending: Math.round(convertAmount(m.pending)),
    overdue: Math.round(convertAmount(m.overdue))
  }));

  const statusBreakdown = statusBreakdownRaw.map(s => ({
    ...s,
    convertedAmount: convertAmount(s.amount)
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
          <p className="font-bold text-slate-300">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {currencySymbol}{Number(entry.value).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Here is your current cash flow and invoice performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('invoices')}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            All Invoices
          </button>
          <button
            onClick={onNewInvoice}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Earned"
          value={formatCurrency(kpis.totalEarned)}
          icon={DollarSign}
          variant="emerald"
          subtitle={`${kpis.paidCount || 0} invoices settled`}
          trend={{ value: '100% Collected', positive: true }}
        />
        <StatCard
          title="Total Outstanding"
          value={formatCurrency(kpis.totalOutstanding)}
          icon={Clock}
          variant="amber"
          subtitle={`${kpis.pendingCount || 0} pending payments`}
        />
        <StatCard
          title="Overdue Amount"
          value={formatCurrency(kpis.totalOverdue)}
          icon={AlertCircle}
          variant="rose"
          subtitle={`${kpis.overdueCount || 0} past due date`}
        />
        <StatCard
          title="Active Clients"
          value={kpis.activeClients || 0}
          icon={Users}
          variant="default"
          subtitle="Invoicing relationships"
        />
      </div>

      {/* Primary Analytics Section: Monthly Earnings Trend & Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Earnings Area Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Earnings Trend</h3>
              <p className="text-xs text-slate-500">Collected cash flow over the last 6 months</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                {currency} ({currencySymbol})
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  name="Earned"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#earningsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Freelancer Health Score Ring */}
        <div className="lg:col-span-4 flex flex-col">
          <HealthScoreRing health={health} />
        </div>
      </div>

      {/* Secondary Analytics: Paid vs Pending Comparison & Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Paid vs Pending Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Paid vs Pending by Month</h3>
              <p className="text-xs text-slate-500">Compare completed payments against pending pipeline</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 16, fontSize: 12 }}
                />
                <Bar dataKey="paid" name="Paid" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Donut Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Invoice Status Breakdown</h3>
            <p className="text-xs text-slate-500">Proportion of invoice count across states</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name, item) => [`${val} invoices (${formatCurrency(item.payload.amount)})`, name]} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center pointer-events-none">
              <span className="text-xl font-black text-slate-800">{kpis.totalInvoices || 0}</span>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            {statusBreakdown.map((item, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-[11px] font-semibold text-slate-500" style={{ color: item.color }}>
                  {item.name}
                </span>
                <span className="font-extrabold text-slate-800 text-sm">{item.value}</span>
                <span className="block text-[10px] text-slate-400">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Invoices</h3>
            <p className="text-xs text-slate-500">Latest billing activity and payment states</p>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            <span>View All Invoices</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Invoice #</th>
                <th className="py-3 px-6">Client</th>
                <th className="py-3 px-6">Due Date</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900">
                    <button
                      onClick={() => onViewInvoice(inv.id)}
                      className="hover:text-brand-600 transition-colors text-left"
                    >
                      {inv.invoice_number}
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-slate-900">{inv.client_name}</p>
                      <p className="text-xs text-slate-400">{inv.client_company}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{inv.due_date}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {formatCurrency(inv.total_amount, { decimals: 2 })}
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => setSelectedInvoiceForPay(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Paid</span>
                        </button>
                      )}
                      <button
                        onClick={() => onViewInvoice(inv.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Paid Modal */}
      <MarkPaidModal
        invoice={selectedInvoiceForPay}
        isOpen={!!selectedInvoiceForPay}
        onClose={() => setSelectedInvoiceForPay(null)}
        onSuccess={() => fetchStats()}
      />
    </div>
  );
}
