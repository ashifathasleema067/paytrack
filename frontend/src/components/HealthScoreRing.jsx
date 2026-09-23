import React from 'react';
import { ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';

export default function HealthScoreRing({ health }) {
  const score = health ? health.score : 100;
  const onTimeRate = health ? health.onTimeRate : 100;
  const status = health ? health.status : 'Excellent';
  const message = health ? health.message : 'Cash flow is healthy.';

  // SVG circular calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = '#10b981'; // emerald
  let statusBadgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let Icon = ShieldCheck;

  if (score < 60) {
    strokeColor = '#ef4444'; // rose
    statusBadgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = AlertTriangle;
  } else if (score < 80) {
    strokeColor = '#f59e0b'; // amber
    statusBadgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = TrendingUp;
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
            Financial Health
          </span>
          <h4 className="text-lg font-bold text-slate-900 mt-1">Freelancer Health Score</h4>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadgeBg}`}>
          <Icon className="w-3.5 h-3.5" />
          {status}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
        {/* Circular Progress Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-28 h-28 transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="#f1f5f9"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke={strokeColor}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{score}</span>
            <span className="text-[10px] uppercase font-semibold text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Diagnostic breakdown & stats */}
        <div className="flex-1 w-full space-y-3">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
              <span>On-Time Payment Rate</span>
              <span className="font-semibold text-slate-900">{onTimeRate}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${onTimeRate}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-600">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Paid Invoices</span>
              <span className="font-bold text-slate-800 text-sm">{health?.paidTotal || 0}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[11px]">On-Time</span>
              <span className="font-bold text-emerald-600 text-sm">{health?.onTimeCount || 0}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic leading-relaxed pt-1">
            "{message}"
          </p>
        </div>
      </div>
    </div>
  );
}
