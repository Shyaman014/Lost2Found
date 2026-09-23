import React from 'react';

/**
 * StatCard — KPI metric card for the admin dashboard.
 */
const StatCard = ({ title, value, subtitle, icon, color = 'indigo', trend }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    sky: 'bg-sky-50 text-sky-600',
    gray: 'bg-gray-100 text-gray-600',
  };
  const iconBg = colorMap[color] || colorMap['indigo'];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {value ?? <span className="text-xl text-gray-400">—</span>}
          </p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`mt-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-lg ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
