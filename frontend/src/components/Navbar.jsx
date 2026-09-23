import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Receipt, 
  PlusCircle, 
  RotateCcw, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CurrencyToggle from './CurrencyToggle';

export default function Navbar({ currentTab, setCurrentTab, onNewInvoice }) {
  const { user, isDemo, logout, resetDemo } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'payments', label: 'Payment History', icon: Receipt },
  ];

  const handleSelectTab = (id) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="md:hidden bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-black text-base shadow-sm">
            P
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-base">PayTrack</span>
        </div>

        <div className="flex items-center gap-2">
          <CurrencyToggle compact={true} />
          <button
            onClick={onNewInvoice}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl p-6 shadow-soft-lg space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user?.name ? user.name.slice(0, 2) : 'ME'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{user?.name}</h4>
                  <p className="text-xs text-slate-400">{user?.business_name || user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Currency selector for mobile drawer */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Currency</span>
                <span className="text-xs font-semibold text-slate-700">1 USD = ₹83.5</span>
              </div>
              <CurrencyToggle compact={false} />
            </div>

            {isDemo && (
              <div className="bg-brand-50 rounded-xl p-3 border border-brand-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-semibold text-brand-900">Demo Mode Active</span>
                </div>
                <button
                  onClick={() => { resetDemo(); setMobileMenuOpen(false); }}
                  className="text-xs font-semibold text-brand-600 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Data
                </button>
              </div>
            )}

            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
