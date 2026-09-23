import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  FileText, 
  PlusCircle, 
  Calendar,
  CheckCircle2,
  DollarSign,
  Receipt
} from 'lucide-react';
import { api } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import StatusBadge from '../components/StatusBadge';
import MarkPaidModal from '../components/MarkPaidModal';
import EmptyState from '../components/EmptyState';
import CurrencyToggle from '../components/CurrencyToggle';

export default function ClientDetail({ clientId, onBack, onNewInvoice, onViewInvoice }) {
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);

  const fetchClientDetails = async () => {
    try {
      const res = await api.getClient(clientId);
      setData(res);
    } catch (err) {
      console.error('Error fetching client details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchClientDetails();
  }, [clientId]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading client details...</p>
      </div>
    );
  }

  const client = data?.client || {};
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-xs"
            title="Back to Clients"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{client.name}</h1>
              {client.company && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                  {client.company}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Client Profile & Invoicing Record</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CurrencyToggle />
          <button
            onClick={() => onNewInvoice(client.id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Invoice for Client</span>
          </button>
        </div>
      </div>

      {/* Info & Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Contact Details</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-brand-600 shrink-0" />
              <a href={`mailto:${client.email}`} className="text-brand-600 hover:underline truncate">
                {client.email}
              </a>
            </div>
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">{client.address}</span>
              </div>
            )}
            {client.notes && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed mt-3">
                <span className="font-semibold text-slate-700 block mb-0.5">Notes:</span>
                {client.notes}
              </div>
            )}
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Billed</span>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {formatCurrency(client.total_billed || 0, { decimals: 0 })}
            </p>
            <span className="text-xs text-slate-400 mt-1">{client.invoice_count || 0} invoices issued</span>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-soft flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Paid</span>
            <p className="text-2xl font-black text-emerald-600 mt-2">
              {formatCurrency(client.total_paid || 0, { decimals: 0 })}
            </p>
            <span className="text-xs text-slate-400 mt-1">Settled payments</span>
          </div>

          <div className={`rounded-2xl p-6 shadow-soft flex flex-col justify-between border ${
            Number(client.total_outstanding || 0) > 0
              ? 'bg-amber-50/50 border-amber-200 text-amber-900'
              : 'bg-white border-slate-200/80 text-slate-900'
          }`}>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Outstanding Due</span>
            <p className="text-2xl font-black text-amber-600 mt-2">
              {formatCurrency(client.total_outstanding || 0, { decimals: 0 })}
            </p>
            <span className="text-xs text-slate-500 mt-1">Pending or overdue</span>
          </div>
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Invoice History</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {invoices.length} {invoices.length === 1 ? 'Invoice' : 'Invoices'}
          </span>
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices for this client yet"
            description="Create an invoice to bill for completed work and track payment."
            actionLabel="Create Invoice"
            onAction={() => onNewInvoice(client.id)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Invoice #</th>
                  <th className="py-3 px-6">Issued Date</th>
                  <th className="py-3 px-6">Due Date</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <button
                        onClick={() => onViewInvoice(inv.id)}
                        className="hover:text-brand-600 transition-colors text-left"
                      >
                        {inv.invoice_number}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">{inv.date_issued}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">{inv.due_date}</td>
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
                            onClick={() => setSelectedInvoiceForPay({ ...inv, client_name: client.name })}
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
        )}
      </div>

      {/* Payment History for this client */}
      {payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Completed Payments</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              {payments.length} Payments Received
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Invoice #</th>
                  <th className="py-3 px-6">Method</th>
                  <th className="py-3 px-6">Notes</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-6 text-xs text-slate-600">{p.payment_date}</td>
                    <td className="py-3 px-6 font-semibold text-slate-900">{p.invoice_number}</td>
                    <td className="py-3 px-6 text-xs text-slate-600">{p.payment_method}</td>
                    <td className="py-3 px-6 text-xs text-slate-400">{p.notes || '—'}</td>
                    <td className="py-3 px-6 text-right font-bold text-emerald-600">
                      {formatCurrency(p.amount, { decimals: 2, signPrefix: '+' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      <MarkPaidModal
        invoice={selectedInvoiceForPay}
        isOpen={!!selectedInvoiceForPay}
        onClose={() => setSelectedInvoiceForPay(null)}
        onSuccess={() => fetchClientDetails()}
      />
    </div>
  );
}
