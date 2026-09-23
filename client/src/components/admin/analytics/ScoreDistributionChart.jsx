import React from 'react';

const ScoreDistributionChart = ({
  data = [],
  color = '#8b5cf6', // purple
}) => {
  const maxVal = Math.max(...data.map((d) => Number(d.count) || 0), 1);
  const total = data.reduce((sum, d) => sum + (Number(d.count) || 0), 0);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-3 h-36 pt-6 pb-2 px-2 border-b border-gray-100">
        {data.map((item, idx) => {
          const count = Number(item.count) || 0;
          const heightPercent = total > 0 ? Math.max(8, Math.round((count / maxVal) * 100)) : 8;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
              <span className="text-[10px] font-mono font-semibold text-gray-500 mb-1 group-hover:text-purple-600 transition">
                {count}
              </span>
              <div
                className="w-full max-w-[42px] rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: color,
                  opacity: count === 0 ? 0.2 : 0.85,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X Labels */}
      <div className="flex items-center justify-between gap-3 px-2 pt-2 text-[11px] text-gray-400 font-medium">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 text-center truncate">
            {item.range}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreDistributionChart;
