import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Eye, 
  FileText, 
  Calendar, 
  Sparkles, 
  Building, 
  UserPlus, 
  Check, 
  DollarSign
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import ClientModal from '../components/ClientModal';
import StatusBadge from '../components/StatusBadge';
import CurrencyToggle from '../components/CurrencyToggle';

export default function CreateInvoice({ editInvoiceId, initialClientId, onBack, onSuccess }) {
  const { user, addToast } = useAuth();
  const { formatCurrency, currency, currencySymbol } = useCurrency();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [activeTabMobile, setActiveTabMobile] = useState('editor'); // 'editor' | 'preview'

  // Form State
  const [clientId, setClientId] = useState(initialClientId || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('Payment is requested within the due date. Thank you for your business!');
  const [items, setItems] = useState([
    { id: 1, description: 'Website UI/UX Design Sprint', quantity: 1, rate: 1200, amount: 1200 }
  ]);

  // Set default due date (+14 days)
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setDueDate(d.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      const [clientsList, nextNumData] = await Promise.all([
        api.getClients(),
        editInvoiceId ? Promise.resolve(null) : api.getNextInvoiceNumber()
      ]);

      setClients(clientsList);
      if (initialClientId) {
        setClientId(String(initialClientId));
      } else if (clientsList.length > 0 && !editInvoiceId) {
        setClientId(String(clientsList[0].id));
      }

      if (nextNumData?.nextInvoiceNumber && !editInvoiceId) {
        setInvoiceNumber(nextNumData.nextInvoiceNumber);
      }

      if (editInvoiceId) {
        const inv = await api.getInvoice(editInvoiceId);
        setClientId(String(inv.client_id));
        setInvoiceNumber(inv.invoice_number);
        setDateIssued(inv.date_issued);
        setDueDate(inv.due_date);
        setNotes(inv.notes || '');
        if (inv.items && inv.items.length) {
          setItems(inv.items.map((it, idx) => ({ ...it, id: it.id || idx + 1 })));
        }
      }
    } catch (err) {
      console.error('Error initializing invoice editor:', err);
      addToast('Failed to load invoice editor data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [editInvoiceId]);

  // Quick preset due dates
  const setPresetDays = (days) => {
    const base = dateIssued ? new Date(dateIssued) : new Date();
    base.setDate(base.getDate() + days);
    setDueDate(base.toISOString().split('T')[0]);
  };

  // Line item handlers
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'quantity' || field === 'rate') {
      const q = parseFloat(updated[index].quantity) || 0;
      const r = parseFloat(updated[index].rate) || 0;
      updated[index].amount = Math.round(q * r * 100) / 100;
    }
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now(), description: '', quantity: 1, rate: 100, amount: 100 }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      addToast('An invoice must have at least one line item', 'info');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0);

  const selectedClient = clients.find(c => String(c.id) === String(clientId));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientId) {
      addToast('Please select a client for this invoice', 'error');
      return;
    }

    if (!dueDate) {
      addToast('Please specify an invoice due date', 'error');
      return;
    }

    const validItems = items.filter(it => it.description.trim() !== '');
    if (validItems.length === 0) {
      addToast('Please specify a description for your line item', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        client_id: parseInt(clientId, 10),
        invoice_number: invoiceNumber,
        date_issued: dateIssued,
        due_date: dueDate,
        notes,
        items: validItems
      };

      if (editInvoiceId) {
        await api.updateInvoice(editInvoiceId, payload);
        addToast(`Invoice ${invoiceNumber} updated successfully!`, 'success');
        onSuccess?.(editInvoiceId);
      } else {
        const res = await api.createInvoice(payload);
        addToast(`Invoice ${invoiceNumber} created successfully!`, 'success');
        onSuccess?.(res.invoiceId);
      }
    } catch (err) {
      addToast(err.message || 'Failed to save invoice', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-sm text-slate-500 font-medium">Preparing invoice composer...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-xs"
            title="Back to Invoices"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {editInvoiceId ? `Edit Invoice (${invoiceNumber})` : 'Create New Invoice'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft your invoice with dynamic line items and watch the live preview update.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CurrencyToggle />
          {/* Mobile Tab Toggle */}
          <div className="flex lg:hidden bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTabMobile('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTabMobile === 'editor' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Form Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTabMobile('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTabMobile === 'preview' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Live Preview
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Form Column */}
        <div className={`lg:col-span-6 space-y-6 ${activeTabMobile === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client & Invoice Meta */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Client Details</span>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Quick Add Client</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Select Client *
                </label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                >
                  <option value="" disabled>-- Select a client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''} - {c.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Invoice #
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Date Issued
                  </label>
                  <input
                    type="date"
                    required
                    value={dateIssued}
                    onChange={(e) => setDateIssued(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Quick Due Date Presets */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-slate-400 font-medium">Quick terms:</span>
                <button
                  type="button"
                  onClick={() => setPresetDays(7)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-medium transition-colors"
                >
                  +7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDays(14)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-medium transition-colors"
                >
                  +14 Days (Net-15)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDays(30)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-medium transition-colors"
                >
                  +30 Days (Net-30)
                </button>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Services & Line Items</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id || index} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Item Description
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Design consulting, feature development..."
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="mt-6 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Qty / Hours
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Rate ($)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          required
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Amount
                        </label>
                        <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-800">
                          ${Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-base">
                <span className="font-bold text-slate-700">Total Invoice Amount</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  ${Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Notes & Terms</span>
              <textarea
                rows={3}
                placeholder="Payment instructions, bank info, or polite note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
              />
            </div>

            {/* Submit Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? 'Saving...' : editInvoiceId ? 'Update Invoice' : 'Create & Issue Invoice'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Formatted Invoice Preview Column */}
        <div className={`lg:col-span-6 sticky top-6 ${activeTabMobile === 'editor' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-lg p-6 sm:p-8 space-y-6">
            {/* Live Indicator */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Real-Time Live Preview
                </span>
              </div>
              <StatusBadge status={dueDate < new Date().toISOString().split('T')[0] ? 'Overdue' : 'Pending'} />
            </div>

            {/* Invoice Document Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-black text-sm">
                    P
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    {user?.business_name || user?.name || 'Freelance Studio'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.business_email || user?.email}</p>
                {user?.business_phone && <p className="text-xs text-slate-500">{user.business_phone}</p>}
                {user?.business_address && <p className="text-xs text-slate-400 mt-1 max-w-[200px]">{user.business_address}</p>}
              </div>

              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block">INVOICE</span>
                <h3 className="text-xl font-black text-slate-900 font-mono mt-0.5">{invoiceNumber || 'INV-XXXX'}</h3>
                <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                  <p>Issued: <span className="font-semibold text-slate-700">{dateIssued}</span></p>
                  <p>Due: <span className="font-semibold text-slate-700">{dueDate}</span></p>
                </div>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">Billed To:</span>
              {selectedClient ? (
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedClient.name}</p>
                  {selectedClient.company && <p className="text-slate-600 font-medium">{selectedClient.company}</p>}
                  <p className="text-slate-500 mt-0.5">{selectedClient.email}</p>
                  {selectedClient.address && <p className="text-slate-400 mt-0.5">{selectedClient.address}</p>}
                </div>
              ) : (
                <p className="text-slate-400 italic">Select a client from the dropdown...</p>
              )}
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-2">Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium text-slate-800">
                        {it.description || <span className="text-slate-300 italic">Line item description...</span>}
                      </td>
                      <td className="py-2.5 text-center text-slate-600">{it.quantity}</td>
                      <td className="py-2.5 text-right text-slate-600">${Number(it.rate || 0).toLocaleString()}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        ${Number(it.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal & Total */}
            <div className="border-t border-slate-200 pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Due</span>
                <span>${Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Notes in preview */}
            {notes && (
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-semibold text-slate-700 block mb-0.5">Payment Terms & Notes:</span>
                <p className="leading-relaxed">{notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={async () => {
          const list = await api.getClients();
          setClients(list);
          if (list.length > 0) setClientId(String(list[0].id));
        }}
      />
    </div>
  );
}
