import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  PlusCircle, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Trash2, 
  Eye, 
  ArrowUpDown,
  Building,
  DollarSign
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import StatusBadge from '../components/StatusBadge';
import MarkPaidModal from '../components/MarkPaidModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import EmptyState from '../components/EmptyState';
import CurrencyToggle from '../components/CurrencyToggle';

export default function Invoices({ onNewInvoice, onViewInvoice }) {
  const { addToast } = useAuth();
  const { formatCurrency, currency, currencySymbol } = useCurrency();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Paid' | 'Pending' | 'Overdue'
  const [clientFilter, setClientFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('date_issued'); // 'date_issued' | 'due_date' | 'total_amount'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Modals
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [invData, clientData] = await Promise.all([
        api.getInvoices({ status: statusFilter, clientId: clientFilter, search }),
        api.getClients()
      ]);
      setInvoices(invData);
      setClients(clientData);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      addToast('Failed to load invoices: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, clientFilter, search]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'total_amount') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const confirmDelete = async () => {
    if (!deletingInvoice) return;
    setDeleteLoading(true);
    try {
      await api.deleteInvoice(deletingInvoice.id);
      addToast(`Invoice ${deletingInvoice.invoice_number} deleted.`, 'success');
      setDeletingInvoice(null);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to delete invoice', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Status counts
  const allCount = invoices.length;
  const paidCount = invoices.filter(i => i.status === 'Paid').length;
  const pendingCount = invoices.filter(i => i.status === 'Pending').length;
  const overdueCount = invoices.filter(i => i.status === 'Overdue').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, track, filter, and mark invoices as paid with auto-overdue tracking.
          </p>
        </div>

        <button
          onClick={onNewInvoice}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Invoice</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: 'All Invoices' },
          { id: 'Paid', label: 'Paid' },
          { id: 'Pending', label: 'Pending' },
          { id: 'Overdue', label: 'Overdue' }
        ].map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Client:</span>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors w-full sm:w-auto"
            >
              <option value="">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
              ))}
            </select>
          </div>
          <CurrencyToggle />
        </div>
      </div>

      {/* Invoices List Table */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading invoices...</p>
        </div>
      ) : sortedInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search || statusFilter !== 'all' ? 'No matching invoices' : 'No invoices yet'}
          description={
            search || statusFilter !== 'all'
              ? 'Try adjusting your filters or search keywords.'
              : 'Create your first professional invoice with line items, due dates, and instant preview.'
          }
          actionLabel={search || statusFilter !== 'all' ? 'Reset Filters' : 'Create Your First Invoice'}
          onAction={() => {
            if (search || statusFilter !== 'all' || clientFilter) {
              setSearch('');
              setStatusFilter('all');
              setClientFilter('');
            } else {
              onNewInvoice();
            }
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th 
                    className="py-3 px-6 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('invoice_number')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Invoice #</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-6">Client</th>
                  <th 
                    className="py-3 px-6 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('date_issued')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Issued</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    className="py-3 px-6 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('due_date')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Due Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    className="py-3 px-6 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('total_amount')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Amount</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <button
                        onClick={() => onViewInvoice(inv.id)}
                        className="hover:text-brand-600 font-bold transition-colors text-left"
                      >
                        {inv.invoice_number}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-slate-900">{inv.client_name}</p>
                        {inv.client_company && (
                          <p className="text-xs text-slate-400">{inv.client_company}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {inv.date_issued}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inv.due_date}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-black text-slate-900 text-sm">
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200/80 rounded-xl transition-all duration-150 shadow-2xs"
                            title="Mark as Paid"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Paid</span>
                          </button>
                        )}
                        <button
                          onClick={() => onViewInvoice(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="View Invoice Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingInvoice(inv)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
        onSuccess={() => fetchData()}
      />

      {/* Delete Invoice Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingInvoice}
        title={`Delete ${deletingInvoice?.invoice_number}?`}
        message="Are you sure you want to permanently delete this invoice? Related line items and records will be deleted."
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onClose={() => setDeletingInvoice(null)}
      />
    </div>
  );
}
