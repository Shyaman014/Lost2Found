import React, { useState } from 'react';

const presets = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: '1y', label: 'Last 12 Months' },
];

const DateRangeSelector = ({ currentPreset, onRangeChange, loading }) => {
  const [isCustom, setIsCustom] = useState(currentPreset === 'custom');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [customError, setCustomError] = useState('');

  const handlePresetClick = (id) => {
    setIsCustom(false);
    setCustomError('');
    onRangeChange({ range: id });
  };

  const handleCustomApply = (e) => {
    e.preventDefault();
    setCustomError('');

    if (!from || !to) {
      setCustomError('Please select both start and end dates.');
      return;
    }

    if (new Date(from) > new Date(to)) {
      setCustomError('Start date cannot be after end date.');
      return;
    }

    onRangeChange({ from, to });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Preset pills */}
      <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200/60 shadow-inner">
        {presets.map((p) => {
          const active = !isCustom && currentPreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={loading}
              onClick={() => handlePresetClick(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? 'bg-white text-indigo-700 shadow-sm border border-gray-200/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          disabled={loading}
          onClick={() => setIsCustom(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isCustom
              ? 'bg-white text-indigo-700 shadow-sm border border-gray-200/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom date range modal / popover inline form */}
      {isCustom && (
        <form onSubmit={handleCustomApply} className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:ring-2 focus:ring-indigo-500 shadow-sm"
            required
          />
          <span className="text-gray-400 text-xs font-medium">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:ring-2 focus:ring-indigo-500 shadow-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            Apply
          </button>
          {customError && (
            <span className="text-red-600 text-xs w-full block">{customError}</span>
          )}
        </form>
      )}
    </div>
  );
};

export default DateRangeSelector;
