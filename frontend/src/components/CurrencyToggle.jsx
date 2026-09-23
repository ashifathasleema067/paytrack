import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

export default function CurrencyToggle({ className = '', compact = false }) {
  const { currency, setCurrency, rate } = useCurrency();

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div 
        className="inline-flex items-center p-1 bg-slate-100 border border-slate-200/80 rounded-xl"
        title={`Switch display currency (1 USD = ₹${rate})`}
      >
        <button
          type="button"
          onClick={() => setCurrency('USD')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
            currency === 'USD'
              ? 'bg-white text-brand-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>$</span>
          {!compact && <span>USD</span>}
        </button>
        <button
          type="button"
          onClick={() => setCurrency('INR')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
            currency === 'INR'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>₹</span>
          {!compact && <span>INR</span>}
        </button>
      </div>
    </div>
  );
}
