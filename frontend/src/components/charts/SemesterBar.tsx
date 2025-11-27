'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function SemesterBar() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';

  const semesters = ['Fall 2023', 'Spring 2024', 'Summer 2024', 'Fall 2024', 'Spring 2025'];
  
  const data = {
    labels: semesters,
    datasets: [
      {
        label: 'Average Grade',
        data: [72, 75, 78, 80, 83],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'PO Achievement',
        data: [70, 73, 76, 79, 81],
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
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

  return (
    <div className="h-full">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Semester Performance Comparison
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Average grades vs. PO achievement over time
        </p>
      </div>
      
      <div className="h-80 mb-6">
        <Bar data={data} options={options} />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            +11%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Grade Improvement
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            From Fall 2023
          </div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            +11%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            PO Achievement Growth
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Consistent upward trend
          </div>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            1,247
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Total Student Enrollment
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Spring 2025
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">🎯 Key Finding:</span> Both metrics show consistent growth, indicating effective curriculum improvements.
        </p>
      </div>
    </div>
  );
}

