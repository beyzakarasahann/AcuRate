'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function OutcomeLine() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';

  const semesters = ['Fall 2023', 'Spring 2024', 'Summer 2024', 'Fall 2024', 'Spring 2025'];
  
  const poTrends = {
    PO1: [72, 75, 78, 82, 85],
    PO2: [68, 71, 74, 76, 78],
    PO3: [85, 87, 89, 91, 92],
    PO4: [65, 67, 69, 71, 72],
    PO5: [75, 77, 78, 80, 81],
  };

  const data = {
    labels: semesters,
    datasets: [
      {
        label: 'PO1',
        data: poTrends.PO1,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'PO2',
        data: poTrends.PO2,
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'PO3',
        data: poTrends.PO3,
        borderColor: 'rgb(251, 191, 36)',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'PO4',
        data: poTrends.PO4,
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'PO5',
        data: poTrends.PO5,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#e5e7eb' : '#374151',
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: isDark ? '#e5e7eb' : '#374151',
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 60,
        max: 100,
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)',
        },
      },
      x: {
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)',
        },
      },
    },
  };

  if (!mounted) {
    return <div className="h-80"></div>;
  }

  const avgChange = 2.2; // Average improvement across all POs

  return (
    <div className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Trend Overview
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Program outcomes performance over semesters
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            ↗ +{avgChange}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Growth</div>
        </div>
      </div>
      
      <div className="h-80">
        <Line data={data} options={options} />
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">💡 Insight:</span> PO3 consistently outperforms others, while PO4 shows the most room for improvement.
        </p>
      </div>
    </div>
  );
}

