import React, { useState } from 'react';

const DonutChart = ({
  data = [],
  size = 180,
  strokeWidth = 24,
  centerTitle,
  centerValue,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400 text-xs">
        <div
          className="rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center mb-2"
          style={{ width: size * 0.7, height: size * 0.7 }}
        >
          0
        </div>
        <span>No distribution data available</span>
      </div>
    );
  }

  let cumulativeAngle = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
      {/* Donut SVG */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {data.map((item, index) => {
            const val = Number(item.value) || 0;
            const strokeDasharray = `${(val / total) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativeAngle;
            cumulativeAngle += (val / total) * circumference;

            const isHovered = hoveredIndex === index;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-gray-900 leading-tight">
            {hoveredIndex !== null ? data[hoveredIndex].value : centerValue || total}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {hoveredIndex !== null ? data[hoveredIndex].label : centerTitle || 'Total'}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="space-y-2 flex-1 w-full max-w-xs">
        {data.map((item, index) => {
          const val = Number(item.value) || 0;
          const percent = total > 0 ? Math.round((val / total) * 1000) / 10 : 0;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between text-xs p-1.5 rounded-lg cursor-pointer transition ${
                isHovered ? 'bg-gray-50 font-bold' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-semibold text-gray-900">{val}</span>
                <span className="text-gray-400">({percent}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonutChart;
