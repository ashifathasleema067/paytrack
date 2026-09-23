import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceDetail from './pages/InvoiceDetail';
import PaymentHistory from './pages/PaymentHistory';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';

export default function App() {
  const { user, loading } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [newInvoiceClientId, setNewInvoiceClientId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-black text-2xl shadow-lg mb-4 animate-pulse">
          P
        </div>
        <p className="text-sm font-medium text-slate-400">Initializing PayTrack...</p>
      </div>
    );
  }

  // Not logged in -> Render Auth (Login / Signup / 1-Click Demo)
  if (!user) {
    return (
      <>
        <Auth />
        <Toast />
      </>
    );
  }

  // Handlers
  const handleNavigate = (tab) => {
    setCurrentTab(tab);
  };

  const handleNewInvoice = (clientId = null) => {
    setEditingInvoiceId(null);
    setNewInvoiceClientId(clientId);
    setCurrentTab('create-invoice');
  };

  const handleEditInvoice = (id) => {
    setEditingInvoiceId(id);
    setCurrentTab('create-invoice');
  };

  const handleViewInvoice = (id) => {
    setSelectedInvoiceId(id);
    setCurrentTab('invoice-detail');
  };

  const handleViewClient = (id) => {
    setSelectedClientId(id);
    setCurrentTab('client-detail');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Toast Notifications */}
      <Toast />

      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={handleNavigate}
          onNewInvoice={() => handleNewInvoice()}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header / Navbar */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={handleNavigate}
          onNewInvoice={() => handleNewInvoice()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigate}
              onNewInvoice={() => handleNewInvoice()}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {currentTab === 'clients' && (
            <Clients
              onViewClient={handleViewClient}
              onNewInvoiceForClient={(cId) => handleNewInvoice(cId)}
            />
          )}

          {currentTab === 'client-detail' && (
            <ClientDetail
              clientId={selectedClientId}
              onBack={() => setCurrentTab('clients')}
              onNewInvoice={(cId) => handleNewInvoice(cId)}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {currentTab === 'invoices' && (
            <Invoices
              onNewInvoice={() => handleNewInvoice()}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {currentTab === 'create-invoice' && (
            <CreateInvoice
              editInvoiceId={editingInvoiceId}
              initialClientId={newInvoiceClientId}
              onBack={() => setCurrentTab('invoices')}
              onSuccess={(invId) => {
                setSelectedInvoiceId(invId);
                setCurrentTab('invoice-detail');
              }}
            />
          )}

          {currentTab === 'invoice-detail' && (
            <InvoiceDetail
              invoiceId={selectedInvoiceId}
              onBack={() => setCurrentTab('invoices')}
              onEdit={(id) => handleEditInvoice(id)}
              onDeleteSuccess={() => setCurrentTab('invoices')}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentHistory
              onViewInvoice={handleViewInvoice}
            />
          )}
        </main>
      </div>
    </div>
  );
}
