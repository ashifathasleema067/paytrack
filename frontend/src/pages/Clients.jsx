import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  Building, 
  FileText, 
  ArrowUpRight,
  LayoutGrid,
  List,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import ClientModal from '../components/ClientModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import EmptyState from '../components/EmptyState';
import CurrencyToggle from '../components/CurrencyToggle';

export default function Clients({ onViewClient, onNewInvoiceForClient }) {
  const { addToast } = useAuth();
  const { formatCurrency, currency, currencySymbol } = useCurrency();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deletingClient, setDeletingClient] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchClients = async () => {
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      addToast('Failed to load clients: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleEdit = (client, e) => {
    e?.stopPropagation();
    setEditingClient(client);
    setIsClientModalOpen(true);
  };

  const handleDeletePrompt = (client, e) => {
    e?.stopPropagation();
    setDeletingClient(client);
  };

  const confirmDelete = async () => {
    if (!deletingClient) return;
    setDeleteLoading(true);
    try {
      await api.deleteClient(deletingClient.id);
      addToast(`Client "${deletingClient.name}" deleted.`, 'success');
      setDeletingClient(null);
      fetchClients();
    } catch (err) {
      addToast(err.message || 'Failed to delete client', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Client Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your client contacts, billing records, and invoicing history.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setIsClientModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Filter and View Toggle Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <CurrencyToggle />
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
            {filteredClients.length} {filteredClients.length === 1 ? 'Client' : 'Clients'}
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading clients...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No matching clients found' : 'No clients added yet'}
          description={
            search
              ? `No results for "${search}". Try searching with a different name or email.`
              : 'Add your first client to start creating professional invoices and tracking payments.'
          }
          actionLabel={search ? 'Clear Search' : 'Add Your First Client'}
          onAction={() => {
            if (search) setSearch('');
            else {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }
          }}
        />
      ) : viewMode === 'grid' ? (
        /* Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const initials = client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div
                key={client.id}
                onClick={() => onViewClient(client.id)}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft hover:shadow-md hover:border-brand-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-100 to-indigo-50 text-brand-700 border border-brand-200/60 flex items-center justify-center font-bold text-sm tracking-wide shadow-xs">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {client.name}
                        </h3>
                        {client.company && (
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{client.company}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEdit(client, e)}
                        title="Edit Client"
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeletePrompt(client, e)}
                        title="Delete Client"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100/80">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Invoices</span>
                    <span className="font-extrabold text-slate-800 text-sm">{client.invoice_count || 0}</span>
                  </div>
                  <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/60">
                    <span className="block text-[10px] uppercase font-bold text-emerald-600">Paid</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      {formatCurrency(client.total_paid || 0, { decimals: 0 })}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    Number(client.total_outstanding || 0) > 0
                      ? 'bg-amber-50/50 border-amber-100 text-amber-700'
                      : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}>
                    <span className="block text-[10px] uppercase font-bold">Due</span>
                    <span className="font-extrabold text-sm">
                      {formatCurrency(client.total_outstanding || 0, { decimals: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Client</th>
                  <th className="py-3 px-6">Contact Info</th>
                  <th className="py-3 px-6 text-center">Invoices</th>
                  <th className="py-3 px-6">Total Billed</th>
                  <th className="py-3 px-6">Total Paid</th>
                  <th className="py-3 px-6">Outstanding</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => onViewClient(client.id)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div>
                        <p className="font-bold text-slate-900 hover:text-brand-600 transition-colors">{client.name}</p>
                        <p className="text-xs text-slate-400">{client.company || '—'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      <p>{client.email}</p>
                      <p className="text-slate-400">{client.phone || ''}</p>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-slate-700">
                      {client.invoice_count || 0}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {formatCurrency(client.total_billed || 0, { decimals: 0 })}
                    </td>
                    <td className="py-4 px-6 font-bold text-emerald-600">
                      {formatCurrency(client.total_paid || 0, { decimals: 0 })}
                    </td>
                    <td className="py-4 px-6 font-bold">
                      {Number(client.total_outstanding || 0) > 0 ? (
                        <span className="text-amber-600">{formatCurrency(client.total_outstanding, { decimals: 0 })}</span>
                      ) : (
                        <span className="text-slate-400">{currencySymbol}0</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleEdit(client, e)}
                          title="Edit"
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePrompt(client, e)}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

      {/* Add / Edit Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        client={editingClient}
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
        }}
        onSuccess={() => fetchClients()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingClient}
        title={`Delete "${deletingClient?.name}"?`}
        message="Deleting this client will also remove their associated invoices and payment logs. Are you sure you wish to continue?"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onClose={() => setDeletingClient(null)}
      />
    </div>
  );
}
