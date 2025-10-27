'use client';

import React from 'react';

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
};

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-col justify-center">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default StatCard;

