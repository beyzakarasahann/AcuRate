'use client';

import React from 'react';
import OutcomeLine from '@/components/charts/OutcomeLine';
import OutcomeDonut from '@/components/charts/OutcomeDonut';
import SemesterBar from '@/components/charts/SemesterBar';
import StatCard from '@/components/charts/StatCard';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

export default function AnalyticsPage(): JSX.Element {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 space-y-6">
        {/* Üst metrikler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Overall Performance" value="82%" sub="vs last term +2%" />
          <StatCard label="Semester Improvement" value="+6%" sub="YoY delta" />
          <StatCard label="Top Outcome Area" value="Research" sub="PO3" />
          <StatCard label="Data Coverage" value="5 Semesters" />
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <OutcomeLine />
          </div>
          <OutcomeDonut />
        </div>

        <SemesterBar />
      </main>
      <Footer />
    </>
  );
}

