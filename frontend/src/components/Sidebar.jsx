import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Receipt, 
  PlusCircle, 
  RotateCcw, 
  LogOut, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CurrencyToggle from './CurrencyToggle';

export default function Sidebar({ currentTab, setCurrentTab, onNewInvoice }) {
  const { user, isDemo, logout, resetDemo } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'payments', label: 'Payment History', icon: Receipt },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20 font-black text-xl tracking-wider">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">PayTrack</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded border border-brand-200/50">PRO</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Invoice & Payments</p>
            </div>
          </div>
        </div>

        {/* Quick New Invoice Action Button */}
        <div className="p-4">
          <button
            onClick={onNewInvoice}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] group"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>Create Invoice</span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-4 bg-brand-600 rounded-full"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Demo Controls */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
        {/* Currency Switcher */}
        <div className="bg-slate-100/80 rounded-xl p-2.5 border border-slate-200/60 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Currency</span>
            <span className="text-xs font-semibold text-slate-700">1 USD = ₹83.5</span>
          </div>
          <CurrencyToggle compact={false} />
        </div>

        {isDemo && (
          <div className="bg-brand-50/80 rounded-xl p-3 border border-brand-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-semibold text-brand-900">Demo Mode Active</span>
            </div>
            <button
              onClick={resetDemo}
              title="Reset Demo Data"
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name ? user.name.slice(0, 2) : 'ME'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate leading-none">{user?.name || 'Freelancer'}</p>
              <p className="text-[11px] text-slate-400 truncate mt-1">{user?.business_name || user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
