import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext(null);

// Exchange rate: 1 USD = 83.5 INR
export const USD_TO_INR_RATE = 83.5;

export function CurrencyProvider({ children }) {
  // 'USD' | 'INR'
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('paytrack_currency') || 'USD';
  });

  const toggleCurrency = () => {
    setCurrency((prev) => {
      const next = prev === 'USD' ? 'INR' : 'USD';
      localStorage.setItem('paytrack_currency', next);
      return next;
    });
  };

  const setCurrencyChoice = (newCurr) => {
    if (newCurr === 'USD' || newCurr === 'INR') {
      setCurrency(newCurr);
      localStorage.setItem('paytrack_currency', newCurr);
    }
  };

  // Convert raw USD base value to current currency value
  const convertAmount = (amountInUSD) => {
    const num = Number(amountInUSD) || 0;
    if (currency === 'INR') {
      return num * USD_TO_INR_RATE;
    }
    return num;
  };

  // Convert an entered amount in current currency back to base USD for saving
  const toBaseUSD = (amountInCurrent) => {
    const num = Number(amountInCurrent) || 0;
    if (currency === 'INR') {
      return num / USD_TO_INR_RATE;
    }
    return num;
  };

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Format currency with proper symbol and locale formatting
  const formatCurrency = (amountInUSD, options = {}) => {
    const converted = convertAmount(amountInUSD);
    const {
      decimals = 0,
      showSign = false,
      compact = false,
      signPrefix = '' // e.g. '+'
    } = options;

    const formattedNum = Number(converted).toLocaleString(
      currency === 'INR' ? 'en-IN' : 'en-US',
      {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }
    );

    return `${signPrefix}${currencySymbol}${formattedNum}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol,
        toggleCurrency,
        setCurrency: setCurrencyChoice,
        convertAmount,
        toBaseUSD,
        formatCurrency,
        rate: USD_TO_INR_RATE
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
