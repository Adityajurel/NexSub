import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const DemoClockContext = createContext(null);

export const DemoClockProvider = ({ children }) => {
  const [effectiveDate, setEffectiveDate] = useState(new Date());
  const [isSimulated, setIsSimulated] = useState(false);
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);
  const [lastBillingRunResult, setLastBillingRunResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/demo-clock');
      if (res.data.success) {
        setEffectiveDate(new Date(res.data.effectiveDate));
        setIsSimulated(res.data.isSimulated);
      }
    } catch {
      // Ignore initial unauthenticated failures
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const setCustomDate = async (date) => {
    setLoading(true);
    try {
      const res = await api.post('/demo-clock/set', { date });
      if (res.data.success) {
        setEffectiveDate(new Date(res.data.effectiveDate));
        setIsSimulated(true);
        return res.data;
      }
    } finally {
      setLoading(false);
    }
  };

  const advanceDate = async ({ days = 0, weeks = 0, months = 0, years = 0 }) => {
    setLoading(true);
    try {
      const res = await api.post('/demo-clock/advance', { days, weeks, months, years });
      if (res.data.success) {
        setEffectiveDate(new Date(res.data.effectiveDate));
        setIsSimulated(true);
        return res.data;
      }
    } finally {
      setLoading(false);
    }
  };

  const resetDate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/demo-clock/reset');
      if (res.data.success) {
        setEffectiveDate(new Date(res.data.effectiveDate));
        setIsSimulated(false);
        return res.data;
      }
    } finally {
      setLoading(false);
    }
  };

  const runSimulatedBilling = async (mode = 'LIVE') => {
    setLoading(true);
    try {
      const res = await api.post('/demo-clock/run-billing', { mode });
      if (res.data.success) {
        setLastBillingRunResult(res.data);
        return res.data;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DemoClockContext.Provider
      value={{
        effectiveDate,
        isSimulated,
        isClockModalOpen,
        setIsClockModalOpen,
        lastBillingRunResult,
        setLastBillingRunResult,
        loading,
        setCustomDate,
        advanceDate,
        resetDate,
        runSimulatedBilling,
        refreshDemoClock: fetchStatus
      }}
    >
      {children}
    </DemoClockContext.Provider>
  );
};

export const useDemoClock = () => {
  const context = useContext(DemoClockContext);
  if (!context) {
    throw new Error('useDemoClock must be used within a DemoClockProvider');
  }
  return context;
};
