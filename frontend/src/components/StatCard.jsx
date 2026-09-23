import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtitle, trend, variant = 'default' }) {
  const iconBgMap = {
    default: 'bg-brand-50 text-brand-600 border-brand-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl border ${iconBgMap[variant] || iconBgMap.default}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
          {trend && (
            <span className={`font-semibold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.value}
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
