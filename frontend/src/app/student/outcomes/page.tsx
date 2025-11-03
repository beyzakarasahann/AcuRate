// app/student/outcomes/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Award, Target, CheckCircle2, XCircle, TrendingUp, BookOpen, ListOrdered } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Doughnut Chart'ı kaydetme
ChartJS.register(ArcElement, Tooltip, Legend);

// --- MOCK VERİLER (Outcomes Sayfasına Özel) ---

const programOutcomesData = [
    {
        code: 'PO1',
        title: 'Engineering Knowledge',
        description: 'Ability to apply knowledge of mathematics, science, and engineering.',
        target: 80,
        current: 85,
        status: 'Achieved',
        courses: ['CS301', 'DM201', 'PHY101'],
    },
    {
        code: 'PO2',
        title: 'Problem Analysis',
        description: 'Ability to identify, formulate, research literature, and analyze complex engineering problems.',
        target: 75,
        current: 78,
        status: 'Achieved',
        courses: ['SE405', 'CS301'],
    },
    {
        code: 'PO3',
        title: 'Design/Development',
        description: 'Ability to design solutions for complex engineering problems.',
        target: 70,
        current: 68,
        status: 'Needs Attention', // Hedefin altında
        courses: ['SWE501', 'SE405'],
    },
    {
        code: 'PO4',
        title: 'Investigation',
        description: 'Ability to use research-based knowledge and methods.',
        target: 75,
        current: 82,
        status: 'Excellent',
        courses: ['CS301'],
    },
    {
        code: 'PO5',
        title: 'Modern Tool Usage',
        description: 'Ability to create, select, and apply appropriate techniques, resources, and modern engineering tools.',
        target: 70,
        current: 72,
        status: 'Achieved',
        courses: ['SWE501'],
    }
];

// --- YARDIMCI FONKSİYONLAR ve Sabitler ---

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

// Doughnut Chart (PO Başarısı) Opsiyonları
const doughnutOptions = (isDark: boolean, mutedText: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%', // Doughnut (Simit) görünümü
    plugins: {
        legend: { display: false },
        tooltip: {
            bodyColor: isDark ? '#FFF' : '#000',
            titleColor: isDark ? '#FFF' : '#000',
            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        }
    }
});


// --- ANA BİLEŞEN: OUTCOMES PAGE ---

export default function OutcomesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // HATA ÇÖZÜMÜ: whiteText yerine 'text' çekildi
  const { isDark, themeClasses, text, mutedText } = useThemeColors();

  if (!mounted) {
    return null;
  }
  
  // 'whiteText' kullanımları için 'text' değişkeni kullanılır.
  const whiteText = text;

  const overallAchievement = Math.round(programOutcomesData.reduce((sum, po) => sum + po.current, 0) / programOutcomesData.length);

  return (
    <div className={`container mx-auto py-0`}>
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-6 border-b pb-4 border-gray-500/20"
      >
        <h1 className={`text-3xl font-bold ${whiteText} flex items-center gap-3`}>
          <Award className="w-7 h-7 text-yellow-500" />
          Program Outcomes Overview
        </h1>
        <div className="flex items-center gap-4">
            <span className={mutedText}>Overall PO Achievement:</span>
            <span className={`text-2xl font-extrabold ${overallAchievement >= 75 ? 'text-green-500' : 'text-orange-500'}`}>
                {overallAchievement}%
            </span>
        </div>
      </motion.div>

      {/* PO Listesi */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {programOutcomesData.map((po, index) => {
          const achievementRatio = po.current / po.target;
          const isTargetAchieved = po.current >= po.target;
          
          // Doughnut Chart Verisi
          const data = {
            labels: ['Achieved', 'Remaining'],
            datasets: [{
              data: [po.current, Math.max(0, 100 - po.current)], // Max 100 olmalı
              backgroundColor: [
                isTargetAchieved ? '#10B981' : '#3B82F6', // Yeşil veya Mavi
                isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', // Arka Plan
              ],
              borderColor: 'transparent',
            }]
          };

          return (
            <motion.div
              key={po.code}
              variants={item}
              whileHover={{ y: -5, boxShadow: isDark ? '0 10px 20px rgba(0,0,0,0.4)' : '0 10px 20px rgba(0,0,0,0.1)' }}
              className={`p-6 rounded-xl ${themeClasses.card} shadow-lg transition-all border ${isDark ? 'border-white/10' : 'border-gray-200'} flex flex-col`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Target className={`w-6 h-6 ${isTargetAchieved ? 'text-green-500' : 'text-orange-500'}`} />
                  <div>
                    <h2 className={`text-xl font-bold ${whiteText}`}>{po.code}: {po.title}</h2>
                    <p className={`text-sm ${mutedText}`}>{po.description}</p>
                  </div>
                </div>
              </div>

              {/* Chart ve Hedef Metrikleri */}
              <div className="flex items-center gap-4 py-4 border-y border-gray-500/20 my-4">
                <div className="w-28 h-28 relative">
                  <Doughnut data={data} options={doughnutOptions(isDark, mutedText)} />
                  <div className={`absolute inset-0 flex items-center justify-center`}>
                    <span className={`text-xl font-extrabold ${whiteText}`}>{po.current}%</span>
                  </div>
                </div>
                
                {/* Metrikler */}
                <div className="flex-1 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className={mutedText}>Target:</span>
                        <span className={`font-semibold ${whiteText}`}>{po.target}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className={mutedText}>Status:</span>
                        <span className={`font-semibold ${
                            po.status === 'Excellent' ? 'text-green-500' :
                            po.status === 'Achieved' ? 'text-blue-500' :
                            'text-red-500'
                        }`}>
                            {po.status === 'Achieved' && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                            {po.status === 'Needs Attention' && <XCircle className="w-4 h-4 inline mr-1" />}
                            {po.status === 'Excellent' && <TrendingUp className="w-4 h-4 inline mr-1" />}
                            {po.status}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className={mutedText}>Performance Gap:</span>
                        <span className={`font-semibold ${isTargetAchieved ? 'text-green-500' : 'text-red-500'}`}>
                            {isTargetAchieved ? `+${po.current - po.target}%` : `-${po.target - po.current}%`}
                        </span>
                    </div>
                </div>
              </div>
              
              {/* İlgili Dersler */}
              <div className="mt-auto pt-4">
                  <h3 className={`text-sm font-semibold ${mutedText} flex items-center gap-1 mb-2`}>
                      <BookOpen className="w-4 h-4" /> Contributing Courses:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                      {po.courses.map(course => (
                          <span key={course} className={`px-3 py-1 text-xs font-medium rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                              {course}
                          </span>
                      ))}
                  </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}