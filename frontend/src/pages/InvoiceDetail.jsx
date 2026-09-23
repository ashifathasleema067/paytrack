import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Calendar, 
  Mail, 
  Phone, 
  Building,
  DollarSign,
  Download,
  Share2
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import StatusBadge from '../components/StatusBadge';
import MarkPaidModal from '../components/MarkPaidModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import CurrencyToggle from '../components/CurrencyToggle';

export default function InvoiceDetail({ invoiceId, onBack, onEdit, onDeleteSuccess }) {
  const { addToast } = useAuth();
  const { formatCurrency, currency, currencySymbol } = useCurrency();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchInvoice = async () => {
    try {
      const data = await api.getInvoice(invoiceId);
      setInvoice(data);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      addToast('Failed to load invoice: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) fetchInvoice();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.deleteInvoice(invoiceId);
      addToast(`Invoice ${invoice?.invoice_number} deleted.`, 'success');
      setIsDeleteModalOpen(false);
      onDeleteSuccess?.();
    } catch (err) {
      addToast(err.message || 'Failed to delete invoice', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading invoice document...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-semibold">Invoice not found or deleted.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold"
        >
          Return to Invoices
        </button>
      </div>
    );
  }

  const isPaid = invoice.status === 'Paid';
  const isOverdue = invoice.status === 'Overdue';

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Control Action Bar (Hidden when printing) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-xs"
            title="Back to Invoices"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg">{invoice.invoice_number}</span>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500">Issued to {invoice.client_name}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CurrencyToggle />
          {!isPaid && (
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark as Paid</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={() => onEdit(invoice.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Delete Invoice"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Formal Printable Invoice Sheet */}
      <div className="printable-invoice-container bg-white rounded-3xl border border-slate-200 shadow-soft-lg p-8 sm:p-12 relative overflow-hidden">
        {/* Paid Stamp watermark */}
        {isPaid && (
          <div className="absolute top-10 right-10 transform rotate-12 border-4 border-emerald-500/40 text-emerald-600/40 px-6 py-2 rounded-2xl font-black text-3xl uppercase tracking-widest pointer-events-none select-none">
            PAID
          </div>
        )}

        {/* Overdue Stamp watermark */}
        {isOverdue && (
          <div className="absolute top-10 right-10 transform rotate-12 border-4 border-rose-500/30 text-rose-600/30 px-6 py-2 rounded-2xl font-black text-2xl uppercase tracking-widest pointer-events-none select-none">
            OVERDUE
          </div>
        )}

        {/* Business & Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-lg">
                P
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {invoice.business_name || invoice.freelancer_name}
              </h2>
            </div>
            <div className="text-xs text-slate-500 space-y-0.5">
              <p className="font-semibold text-slate-700">{invoice.freelancer_name}</p>
              <p>{invoice.business_email || 'freelancer@example.com'}</p>
              {invoice.business_phone && <p>{invoice.business_phone}</p>}
              {invoice.business_address && <p className="max-w-xs">{invoice.business_address}</p>}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">INVOICE</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight mt-1">
              {invoice.invoice_number}
            </h1>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <p>Invoice Date: <span className="font-semibold text-slate-800">{invoice.date_issued}</span></p>
              <p>Payment Due: <span className="font-semibold text-slate-800">{invoice.due_date}</span></p>
              <div className="pt-1">
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Bill To & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100 text-xs">
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Billed To:</span>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-900">{invoice.client_name}</p>
              {invoice.client_company && <p className="font-semibold text-slate-700">{invoice.client_company}</p>}
              <p className="text-slate-500">{invoice.client_email}</p>
              {invoice.client_phone && <p className="text-slate-500">{invoice.client_phone}</p>}
              {invoice.client_address && <p className="text-slate-400 max-w-xs mt-1">{invoice.client_address}</p>}
            </div>
          </div>

          {isPaid && (
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-emerald-900">
              <span className="font-bold uppercase tracking-wider text-emerald-700 block mb-1">Payment Received</span>
              <p className="text-sm font-bold">Paid on {invoice.payment_date}</p>
              <p className="text-xs text-emerald-700 mt-0.5">Payment Method: {invoice.payment_method}</p>
            </div>
          )}
        </div>

        {/* Itemized Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 font-semibold">Description</th>
                <th className="py-3 text-center font-semibold">Qty / Hrs</th>
                <th className="py-3 text-right font-semibold">Rate</th>
                <th className="py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(invoice.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 font-medium text-slate-900">{item.description}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">{formatCurrency(item.rate, { decimals: 2 })}</td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    {formatCurrency(item.amount, { decimals: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary / Total Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t border-slate-200 gap-6">
          <div className="max-w-sm text-xs text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">Terms & Payment Instructions:</span>
            <p className="leading-relaxed">{invoice.notes || 'Payment due as specified above. Please include the invoice number in the payment memo.'}</p>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(invoice.total_amount, { decimals: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (0%):</span>
              <span className="font-medium">{currencySymbol}0.00</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
              <span>Total Amount:</span>
              <span>{formatCurrency(invoice.total_amount, { decimals: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Printable Footer */}
        <div className="mt-12 pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Generated with PayTrack • Thank you for your business!
        </div>
      </div>

      {/* Mark as Paid Modal */}
      <MarkPaidModal
        invoice={invoice}
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onSuccess={() => fetchInvoice()}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title={`Delete ${invoice.invoice_number}?`}
        message="Are you sure you want to permanently delete this invoice?"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
