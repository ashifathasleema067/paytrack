import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Download, 
  Search, 
  Calendar, 
  Building, 
  DollarSign, 
  Filter, 
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import EmptyState from '../components/EmptyState';
import CurrencyToggle from '../components/CurrencyToggle';

export default function PaymentHistory({ onViewInvoice }) {
  const { addToast } = useAuth();
  const { formatCurrency, currency, currencySymbol } = useCurrency();
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchPaymentsData = async () => {
    try {
      const [payList, clientList] = await Promise.all([
        api.getPayments({ clientId, startDate, endDate }),
        api.getClients()
      ]);
      setPayments(payList);
      setClients(clientList);
    } catch (err) {
      console.error('Error fetching payments:', err);
      addToast('Failed to load payment history: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, [clientId, startDate, endDate]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await api.exportPaymentsCsv();
      addToast('Payment history exported to CSV successfully!', 'success');
    } catch (err) {
      addToast('Failed to export CSV: ' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const totalCollected = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Payment History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Chronological audit ledger of all completed invoice settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CurrencyToggle />
          <button
            onClick={handleExportCsv}
            disabled={exporting || payments.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 active:scale-95"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>{exporting ? 'Generating CSV...' : 'Export to CSV'}</span>
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">Total Collected in Ledger</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
            {formatCurrency(totalCollected, { decimals: 2 })}
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            {payments.length} verified payment transactions logged
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 self-start sm:self-auto">
          <span className="block text-xs uppercase font-bold text-emerald-100">Settlement Reliability</span>
          <span className="text-xl font-black">100% Verified</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Client Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Client:</span>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            >
              <option value="">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            />
          </div>

          {(clientId || startDate || endDate) && (
            <button
              onClick={() => { setClientId(''); setStartDate(''); setEndDate(''); }}
              className="text-xs text-brand-600 font-semibold hover:underline px-2 py-1"
            >
              Clear Filters
            </button>
          )}
        </div>

        <span className="text-xs font-semibold text-slate-400">
          Showing {payments.length} {payments.length === 1 ? 'transaction' : 'transactions'}
        </span>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading payment records...</p>
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No completed payments found"
          description={
            clientId || startDate || endDate
              ? 'No payments matched the selected filter criteria.'
              : 'Payments will appear here automatically when pending invoices are marked as paid.'
          }
          actionLabel={clientId || startDate || endDate ? 'Reset Filters' : undefined}
          onAction={() => { setClientId(''); setStartDate(''); setEndDate(''); }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Payment Date</th>
                  <th className="py-3 px-6">Invoice #</th>
                  <th className="py-3 px-6">Client</th>
                  <th className="py-3 px-6">Method</th>
                  <th className="py-3 px-6">Notes / Reference</th>
                  <th className="py-3 px-6 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.payment_date}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <button
                        onClick={() => onViewInvoice(p.invoice_id)}
                        className="hover:text-brand-600 transition-colors"
                      >
                        {p.invoice_number}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-slate-900">{p.client_name}</p>
                        {p.client_company && (
                          <p className="text-xs text-slate-400">{p.client_company}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        <CreditCard className="w-3 h-3 text-slate-500" />
                        <span>{p.payment_method}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">
                      {p.notes || '—'}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-emerald-600 text-base">
                      {formatCurrency(p.amount, { decimals: 2, signPrefix: '+' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
