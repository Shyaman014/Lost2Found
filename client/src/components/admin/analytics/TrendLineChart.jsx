import React, { useState } from 'react';

const TrendLineChart = ({ data = [], series = [], height = 240, emptyMessage = 'No trend data for this period.' }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-gray-400 text-sm italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200"
      >
        {emptyMessage}
      </div>
    );
  }

  // Calculate scales
  let maxValue = 0;
  data.forEach((row) => {
    series.forEach((s) => {
      const val = Number(row[s.key] || 0);
      if (val > maxValue) maxValue = val;
    });
  });

  const chartMax = maxValue === 0 ? 5 : Math.ceil(maxValue * 1.15);
  const paddingX = 40;
  const paddingY = 25;
  const width = 600; // SVG viewBox coordinate system width
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const getX = (index) => {
    if (data.length <= 1) return paddingX + innerWidth / 2;
    return paddingX + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    return height - paddingY - (val / chartMax) * innerHeight;
  };

  // Generate SVG path points
  const generatePath = (key) => {
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(Number(d[key] || 0)).toFixed(1)}`)
      .join(' ');
  };

  const generateAreaPath = (key) => {
    const linePath = generatePath(key);
    const lastX = getX(data.length - 1).toFixed(1);
    const firstX = getX(0).toFixed(1);
    const bottomY = (height - paddingY).toFixed(1);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const activePoint = hoveredIdx !== null && data[hoveredIdx] ? data[hoveredIdx] : null;

  return (
    <div className="w-full relative">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-end gap-4 mb-2 text-xs">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 font-medium text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* SVG Canvas */}
      <div className="w-full relative overflow-visible">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - paddingY - ratio * innerHeight;
            const val = Math.round(ratio * chartMax);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  className="font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area & Lines for each series */}
          {series.map((s) => (
            <g key={s.key}>
              <path
                d={generateAreaPath(s.key)}
                fill={s.color}
                fillOpacity="0.08"
                className="transition-all duration-300"
              />
              <path
                d={generatePath(s.key)}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {data.map((d, i) => (
                <circle
                  key={i}
                  cx={getX(i)}
                  cy={getY(Number(d[s.key] || 0))}
                  r={hoveredIdx === i ? 5 : 3}
                  fill="#ffffff"
                  stroke={s.color}
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
              ))}
            </g>
          ))}

          {/* Hover hit areas */}
          {data.map((_, i) => (
            <rect
              key={i}
              x={getX(i) - innerWidth / (data.length * 2)}
              y={paddingY}
              width={innerWidth / data.length || innerWidth}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
              className="cursor-pointer"
            />
          ))}

          {/* Vertical guideline on hover */}
          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              y1={paddingY}
              x2={getX(hoveredIdx)}
              y2={height - paddingY}
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          )}

          {/* X Axis Date Labels (Sample 4-5 labels max) */}
          {data.map((d, i) => {
            const step = Math.max(1, Math.floor(data.length / 5));
            if (i % step === 0 || i === data.length - 1) {
              const label = d.date.length > 5 ? d.date.slice(5) : d.date;
              return (
                <text
                  key={i}
                  x={getX(i)}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                  className="font-medium"
                >
                  {label}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Floating Tooltip */}
        {activePoint && hoveredIdx !== null && (
          <div
            className="absolute z-10 pointer-events-none bg-gray-900/90 text-white rounded-lg px-3 py-2 text-xs shadow-xl backdrop-blur-sm -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(getX(hoveredIdx) / width) * 100}%`,
              top: '20px',
            }}
          >
            <p className="font-semibold text-gray-200 border-b border-gray-700 pb-1 mb-1">
              {activePoint.date}
            </p>
            {series.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}:
                </span>
                <span className="font-mono font-bold text-white">{activePoint[s.key] || 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendLineChart;
