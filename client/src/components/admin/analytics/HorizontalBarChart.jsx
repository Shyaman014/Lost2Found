import React from 'react';

const HorizontalBarChart = ({
  data = [],
  color = '#6366f1',
  emptyMessage = 'No data available.',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 text-xs italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        {emptyMessage}
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Number(d.count) || 0), 1);
  const total = data.reduce((sum, d) => sum + (Number(d.count) || 0), 0);

  return (
    <div className="space-y-3 w-full">
      {data.map((item, idx) => {
        const count = Number(item.count) || 0;
        const widthPercent = Math.max(3, Math.round((count / maxVal) * 100));
        const sharePercent = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;

        return (
          <div key={idx} className="group">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-gray-700 capitalize truncate max-w-[65%]">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 font-mono">{count}</span>
                <span className="text-gray-400 text-[10px] font-mono">({sharePercent}%)</span>
              </div>
            </div>

            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out group-hover:brightness-110"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HorizontalBarChart;
