import React from 'react';

const colorThemes = {
  indigo: {
    bg: 'bg-indigo-50/70 text-indigo-600',
    border: 'border-indigo-100',
    badge: 'bg-indigo-50 text-indigo-700',
  },
  emerald: {
    bg: 'bg-emerald-50/70 text-emerald-600',
    border: 'border-emerald-100',
    badge: 'bg-emerald-50 text-emerald-700',
  },
  amber: {
    bg: 'bg-amber-50/70 text-amber-600',
    border: 'border-amber-100',
    badge: 'bg-amber-50 text-amber-700',
  },
  purple: {
    bg: 'bg-purple-50/70 text-purple-600',
    border: 'border-purple-100',
    badge: 'bg-purple-50 text-purple-700',
  },
  rose: {
    bg: 'bg-rose-50/70 text-rose-600',
    border: 'border-rose-100',
    badge: 'bg-rose-50 text-rose-700',
  },
  sky: {
    bg: 'bg-sky-50/70 text-sky-600',
    border: 'border-sky-100',
    badge: 'bg-sky-50 text-sky-700',
  },
};

const AnalyticsKPICard = ({
  title,
  value,
  subtitle,
  changePercent,
  color = 'indigo',
  icon,
}) => {
  const theme = colorThemes[color] || colorThemes.indigo;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme.bg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {value !== undefined && value !== null ? value : 0}
        </div>

        {changePercent !== undefined && changePercent !== null && (
          <div
            className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
              changePercent > 0
                ? 'bg-emerald-100 text-emerald-800'
                : changePercent < 0
                ? 'bg-rose-100 text-rose-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {changePercent > 0 ? '↑ +' : changePercent < 0 ? '↓ ' : ''}
            {Math.abs(changePercent)}%
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-gray-400 mt-2 truncate font-medium">{subtitle}</p>
      )}
    </div>
  );
};

export default AnalyticsKPICard;
