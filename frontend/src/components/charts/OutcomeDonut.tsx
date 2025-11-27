'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function OutcomeDonut() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';

  // Mock data for PO distribution
  const poData = [
    { po: 'PO1', percentage: 85.2, target: 75 },
    { po: 'PO2', percentage: 78.4, target: 75 },
    { po: 'PO3', percentage: 92.1, target: 80 },
    { po: 'PO4', percentage: 71.8, target: 75 },
    { po: 'PO5', percentage: 80.5, target: 75 },
  ];

  const avgAchievement = (
    poData.reduce((sum, po) => sum + po.percentage, 0) / poData.length
  ).toFixed(1);

  const targetsMet = poData.filter(po => po.percentage >= po.target).length;
  const belowTarget = poData.length - targetsMet;

  const data = {
    labels: poData.map(po => po.po),
    datasets: [
      {
        data: poData.map(po => po.percentage),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // blue
          'rgba(236, 72, 153, 0.8)',   // pink
          'rgba(251, 191, 36, 0.8)',   // yellow
          'rgba(139, 92, 246, 0.8)',   // purple
          'rgba(16, 185, 129, 0.8)',   // green
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(236, 72, 153)',
          'rgb(251, 191, 36)',
          'rgb(139, 92, 246)',
          'rgb(16, 185, 129)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    rotation: -90, // Start from top
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#e5e7eb' : '#374151',
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        enabled: true,
        mode: 'point' as const,
        intersect: true,
        caretPadding: 15,
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: isDark ? '#e5e7eb' : '#374151',
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context: any) {
            const index = context.dataIndex;
            const po = poData[index];
            return [
              `Achievement: ${po.percentage}%`,
              `Target: ${po.target}%`,
              po.percentage >= po.target ? '✓ Target Met' : '✗ Below Target',
            ];
          },
        },
      },
    },
    interaction: {
      mode: 'point' as const,
      intersect: true,
    },
  };

  if (!mounted) {
    return <div className="h-80"></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-[320px] relative">
        <Doughnut data={data} options={options} />
      </div>
      
      {/* Average Achievement - Below the chart */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {avgAchievement}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Average Achievement
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {poData.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total POs</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {targetsMet}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Targets Met</div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            {belowTarget}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Below Target</div>
        </div>
      </div>
    </div>
  );
}

