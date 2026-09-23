import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  const normStatus = (status || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotStyle = 'bg-slate-400';

  if (normStatus === 'paid') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    dotStyle = 'bg-emerald-500 animate-pulse';
  } else if (normStatus === 'pending') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200/80';
    dotStyle = 'bg-amber-500';
  } else if (normStatus === 'overdue') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200/80';
    dotStyle = 'bg-rose-500 animate-pulse';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase ${styles} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`}></span>
      {status}
    </span>
  );
}
