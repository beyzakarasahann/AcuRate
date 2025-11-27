'use client';

import React from 'react';

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
};

function StatCard({ label, value, sub }: StatCardProps) {
  // Determine trend direction from sub text
  const isPositive = sub?.startsWith('+');
  const isNegative = sub?.startsWith('-');
  const trendIcon = isPositive ? '↗' : isNegative ? '↘' : '';
  const trendColor = isPositive 
    ? 'text-green-600 dark:text-green-400' 
    : isNegative 
    ? 'text-red-600 dark:text-red-400' 
    : 'text-gray-600 dark:text-gray-400';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col justify-center border border-gray-200 dark:border-gray-700">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}
      </div>
      <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
        {value}
      </div>
      {sub && (
        <div className={`text-sm mt-2 font-medium flex items-center gap-1 ${trendColor}`}>
          {trendIcon && <span className="text-lg">{trendIcon}</span>}
          <span>{sub}</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;

