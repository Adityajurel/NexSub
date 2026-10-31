const SystemSetting = require('../models/SystemSetting');

let memorySimulatedDate = null;

const initDemoClock = async () => {
  try {
    const setting = await SystemSetting.findOne({ key: 'demoClockDate' });
    if (setting && setting.value) {
      memorySimulatedDate = new Date(setting.value);
    }
  } catch (err) {
    console.warn('[DemoClock] Could not load demo clock date:', err.message);
  }
};

const getEffectiveDate = () => {
  if (memorySimulatedDate) {
    return new Date(memorySimulatedDate);
  }
  return new Date();
};

const setDemoDate = async (newDate) => {
  const parsedDate = new Date(newDate);
  if (isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date provided for Demo Clock');
  }
  memorySimulatedDate = parsedDate;
  await SystemSetting.findOneAndUpdate(
    { key: 'demoClockDate' },
    { value: parsedDate.toISOString(), description: 'Simulated date for Demo Clock' },
    { upsert: true }
  );
  return memorySimulatedDate;
};

const clearDemoDate = async () => {
  memorySimulatedDate = null;
  await SystemSetting.findOneAndUpdate(
    { key: 'demoClockDate' },
    { value: null, description: 'Simulated date for Demo Clock' },
    { upsert: true }
  );
  return null;
};

const advanceDateBy = async ({ days = 0, weeks = 0, months = 0, years = 0 }) => {
  const current = getEffectiveDate();
  if (days) current.setDate(current.getDate() + days);
  if (weeks) current.setDate(current.getDate() + (weeks * 7));
  if (months) current.setMonth(current.getMonth() + months);
  if (years) current.setFullYear(current.getFullYear() + years);
  return await setDemoDate(current);
};

module.exports = {
  initDemoClock,
  getEffectiveDate,
  setDemoDate,
  clearDemoDate,
  advanceDateBy,
  isDemoClockActive: () => memorySimulatedDate !== null
};
