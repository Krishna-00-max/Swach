/**
 * BehaviorScore — Animated circular SVG ring showing driver compliance score.
 * Score range: 0-100
 * Green: >80 | Yellow: >60 | Red: <=60
 */
import { useEffect, useRef } from 'react';

const getColor = (score) => {
  if (score >= 80) return { stroke: '#4ADE80', text: '#4ADE80', label: 'Excellent', glow: 'rgba(74,222,128,0.4)' };
  if (score >= 60) return { stroke: '#FBBF24', text: '#FBBF24', label: 'Fair', glow: 'rgba(251,191,36,0.4)' };
  return { stroke: '#F87171', text: '#F87171', label: 'Poor', glow: 'rgba(248,113,113,0.4)' };
};

export default function BehaviorScore({ score = 85, size = 100, strokeWidth = 8, showLabel = true }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colors = getColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Filled arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease',
              filter: `drop-shadow(0 0 6px ${colors.glow})`,
            }}
          />
        </svg>
        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ color: colors.text }}
        >
          <span className="font-extrabold leading-none" style={{ fontSize: size * 0.22 }}>
            {Math.round(score)}
          </span>
          <span className="text-gray-500 leading-none" style={{ fontSize: size * 0.12 }}>
            /100
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          <div className="text-[0.62rem] uppercase tracking-widest text-gray-500">Score</div>
          <div className="text-xs font-bold" style={{ color: colors.text }}>{colors.label}</div>
        </div>
      )}
    </div>
  );
}
