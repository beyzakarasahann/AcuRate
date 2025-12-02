'use client';

import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate label width based on text length
  const labelText = String(label || '');
  const labelWidth = Math.max(40, labelText.length * 7 + 16);
  const labelHeight = 22;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: style.stroke || 'rgba(99, 102, 241, 0.4)', // indigo-500 with opacity
          strokeWidth: style.strokeWidth || 2,
        }}
      />
      {label && (
        <g>
          {/* Label background with better styling */}
          <rect
            x={labelX - labelWidth / 2}
            y={labelY - labelHeight / 2}
            width={labelWidth}
            height={labelHeight}
            rx={6}
            fill="rgba(0, 0, 0, 0.75)"
            className="backdrop-blur-sm"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={1}
          />
          {/* Label text */}
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white pointer-events-none select-none"
            style={{ 
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
}

