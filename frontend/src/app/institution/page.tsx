'use client';

import { motion } from 'framer-motion';
import { Building2, Users, BookOpen, TrendingUp, AlertTriangle, CheckCircle2, Trophy, Loader2, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, DashboardData } from '../../lib/api';
import toast from 'react-hot-toast';

// 🎨 DİNAMİK TEMA KANCASI BURAYA MİRAS ALINDI
import { useThemeColors } from '../../hooks/useThemeColors';

// Statik sınıf stringlerini renk kodlarına çeviren yardımcı fonksiyon
// 🚩 TypeScript Hatası Düzeltildi: colorClass parametresine 'string' türü eklendi.
const getGradientColors = (colorClass: string) => {
    switch (colorClass) {
        case 'from-blue-500 to-cyan-500': return { start: '#3B82F6', end: '#06B6D4' };
        case 'from-purple-500 to-pink-500': return { start: '#A855F7', end: '#EC4899' };
        case 'from-orange-500 to-red-500': return { start: '#F97316', end: '#EF4444' };
        case 'from-green-500 to-emerald-500': return { start: '#10B981', end: '#059669' };
        default: return { start: '#6366F1', end: '#9333EA' }; // Varsayılan İndigo/Mor
    }
};

const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};


interface InstitutionDashboardData extends Omit<DashboardData, 'po_achievements'> {
  po_achievements?: Array<{
    id: number;
    code: string;
    title: string;
    description?: string;
    average_achievement: number | null;
    target_percentage: number;
    total_students: number;
    students_achieved: number;
    achievement_rate?: number;
  }>;
  department_stats?: Array<{
    department: string;
    student_count: number;
    course_count?: number;
    faculty_count?: number;
    avg_grade?: number | null;
    po_achievement?: number | null;
  }>;
}

export default function InstitutionDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<InstitutionDashboardData | null>(null);
  const [previousData, setPreviousData] = useState<any>(null); // For trend calculation

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getInstitutionDashboard();
      
      // Store previous data for trend calculation
      if (dashboardData) {
        setPreviousData(dashboardData);
      }
      
      setDashboardData(data as InstitutionDashboardData);
    } catch (err: any) {
      console.error('Error fetching institution dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate trend percentage
  const calculateTrend = (current: number, previous: number | null): string => {
    if (!previous || previous === 0) return '+0%';
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  // Calculate stats from API data with trends
  const stats = dashboardData ? [
    {
      title: 'Total Students',
      value: dashboardData.total_students?.toLocaleString() || '0',
      change: previousData ? calculateTrend(
        dashboardData.total_students || 0,
        previousData.total_students || 0
      ) : '+0%',
      trend: (previousData && dashboardData.total_students && previousData.total_students) 
        ? (dashboardData.total_students >= (previousData.total_students || 0) ? 'up' : 'down')
        : 'up',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      href: '/institution/students'
    },
    {
      title: 'Teachers',
      value: dashboardData.total_teachers?.toLocaleString() || '0',
      change: previousData ? calculateTrend(
        dashboardData.total_teachers || 0,
        previousData.total_teachers || 0
      ) : '+0%',
      trend: (previousData && dashboardData.total_teachers && previousData.total_teachers)
        ? (dashboardData.total_teachers >= (previousData.total_teachers || 0) ? 'up' : 'down')
        : 'up',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      href: '/institution/teachers'
    },
    {
      title: 'Departments',
      value: (dashboardData.total_departments || dashboardData.department_stats?.length || 0).toLocaleString(),
      change: previousData ? calculateTrend(
        dashboardData.total_departments || dashboardData.department_stats?.length || 0,
        previousData.total_departments || previousData.department_stats?.length || 0
      ) : '+0%',
      trend: (previousData && (dashboardData.total_departments || dashboardData.department_stats))
        ? ((dashboardData.total_departments || dashboardData.department_stats?.length || 0) >= (previousData.total_departments || previousData.department_stats?.length || 0) ? 'up' : 'down')
        : 'up',
      icon: Building2,
      color: 'from-orange-500 to-red-500',
      href: '/institution/departments'
    },
    {
      title: 'Avg Performance',
      value: dashboardData.po_achievements && dashboardData.po_achievements.length > 0
        ? `${(dashboardData.po_achievements.reduce((sum, po) => sum + (po.average_achievement ?? 0), 0) / dashboardData.po_achievements.length).toFixed(1)}%`
        : '0%',
      change: (() => {
        if (!previousData || !dashboardData.po_achievements) return '+0%';
        const currentAvg = dashboardData.po_achievements.reduce((sum, po) => sum + (po.average_achievement ?? 0), 0) / dashboardData.po_achievements.length;
        const prevAvg = previousData.po_achievements 
          ? previousData.po_achievements.reduce((sum: number, po: any) => sum + (po.average_achievement ?? 0), 0) / previousData.po_achievements.length
          : 0;
        return calculateTrend(currentAvg, prevAvg);
      })(),
      trend: (() => {
        if (!previousData || !dashboardData.po_achievements) return 'up' as const;
        const currentAvg = dashboardData.po_achievements.reduce((sum, po) => sum + (po.average_achievement ?? 0), 0) / dashboardData.po_achievements.length;
        const prevAvg = previousData.po_achievements 
          ? previousData.po_achievements.reduce((sum: number, po: any) => sum + (po.average_achievement ?? 0), 0) / previousData.po_achievements.length
          : 0;
        return (currentAvg >= prevAvg ? 'up' : 'down');
      })(),
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500'
    }
  ] : [];

  // Transform department stats from API
  const departments = dashboardData?.department_stats?.map(dept => {
    // Get actual data from backend
    const avgGrade = dept.avg_grade ?? 0;
    const poAchievement = dept.po_achievement ?? 0;
    return {
      name: dept.department,
      students: dept.student_count,
      avgGrade,
      poAchievement,
      status: poAchievement >= 80 ? 'excellent' : poAchievement >= 70 ? 'good' : 'needs-attention' as const,
      courses: dept.course_count ?? 0,
      faculty: dept.faculty_count ?? 0
    };
  }) || [];

  // Transform PO achievements from API
  const programOutcomes = dashboardData?.po_achievements?.map(po => {
    const current = po.average_achievement ?? 0;
    const target = po.target_percentage || 0;
    return {
      code: po.code,
      title: po.title,
      current,
      target,
      status: (current >= target * 1.1 ? 'excellent' : current >= target ? 'achieved' : 'not-achieved')
    };
  }) || [];

  // 1. Kancadan Dinamik Tema Değerlerini Alma
  const { 
    isDark, 
    mounted: themeMounted, 
    accentStart, 
    accentEnd, 
    themeClasses, 
    mutedText, 
  } = useThemeColors();

  // Aydınlık/Karanlık moda göre metin ve ikon renkleri (hook'lardan sonra tanımlanmalı)
  const whiteTextClass = isDark ? 'text-white' : 'text-gray-900';
  const accentIconClass = isDark ? 'text-indigo-400' : 'text-indigo-600';
  const secondaryTextClass = isDark ? 'text-gray-400' : 'text-gray-600';

  // Yüklenme Kontrolü
  // Sunucu renderı ile istemci hidrasyonu arasındaki uyuşmazlığı engeller.
  if (!mounted || !themeMounted) {
    // Statik başlangıç değerlerini kullanın (Sunucu renderına en yakın değerler)
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeClasses.background} flex items-center justify-center`}>
        <div className={`${whiteTextClass} text-xl`}>Loading...</div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeClasses.background} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={`w-8 h-8 ${accentIconClass} animate-spin`} />
          <p className={`${secondaryTextClass} text-lg`}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeClasses.background} flex items-center justify-center`}>
        <div className={`${themeClasses.card} p-8 max-w-md text-center`}>
          <AlertTriangle className={`w-12 h-12 text-red-500 mx-auto mb-4`} />
          <h2 className={`text-xl font-bold ${whiteTextClass} mb-2`}>Error Loading Dashboard</h2>
          <p className={`${secondaryTextClass} mb-4`}>{error}</p>
          <motion.button
            onClick={fetchDashboardData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ backgroundImage: `linear-gradient(to right, ${accentStart}, ${accentEnd})` }}
            className="px-6 py-2 rounded-xl text-white font-medium"
          >
            Retry
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    // 2. ANA ARKA PLAN: Dinamik Sınıf Kullanımı
    <div className={`min-h-screen bg-gradient-to-br ${themeClasses.background} relative overflow-hidden`}>
      {/* Animated Background Orbs (Dinamik Renk Kullanımı) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl`}
          style={{ backgroundColor: `${accentStart}20` }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl`}
          style={{ backgroundColor: `${accentEnd}30` }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl`}
          style={{ backgroundColor: `${accentStart}20` }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          // 3. HEADER KARTI: Dinamik Sınıf Kullanımı
          className={`mb-8 backdrop-blur-xl ${themeClasses.card} rounded-2xl p-6 shadow-2xl`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Logo/İkon Arka Planı (Dinamik Gradient) */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                style={{ backgroundImage: `linear-gradient(to bottom right, ${accentStart}, ${accentEnd})` }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/50"
              >
                <Building2 className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Institution Dashboard
                  </h1>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                    Active
                  </span>
                </div>
                {/* Metin Rengi: Dinamik mutedText kullanıldı */}
                <p className={`${secondaryTextClass} text-sm`}>Academic Performance Overview</p>
              </div>
            </div>
            <div className="flex gap-3">
              {/* Analytics Butonu (Dinamik Gradient) */}
              <Link href="/institution/analytics">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ backgroundImage: `linear-gradient(to right, ${accentStart}, ${accentEnd})` }}
                  className="px-4 py-2 rounded-xl text-white flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Analytics
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => {
            const { start, end } = getGradientColors(stat.color); // Mock veriden renkleri al
            const cardContent = (
              <motion.div
                variants={item}
                whileHover={{ scale: 1.05, y: -5 }}
                // 4. STAT KARTLARI: Dinamik Sınıf Kullanımı
                className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl hover:shadow-indigo-500/20 transition-all ${stat.href ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  {/* İkon Arka Planı (Dinamik Gradient) */}
                  <div
                    style={{ backgroundImage: `linear-gradient(to bottom right, ${start}, ${end})` }}
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                {/* Metin Rengi: Dinamik mutedText kullanıldı */}
                <h3 className={`${secondaryTextClass} text-sm mb-1`}>{stat.title}</h3>
                {/* Metin Rengi: Statik text-white yerine dinamik whiteTextClass kullanıldı */}
                <p className={`text-3xl font-bold ${whiteTextClass}`}>{stat.value}</p>
              </motion.div>
            );

            return stat.href ? (
              <Link key={index} href={stat.href} className="block">
                {cardContent}
              </Link>
            ) : (
              <div key={index}>
                {cardContent}
              </div>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 gap-6">
          {/* Department Performance */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              // 5. DEPARTMENT KARTI: Dinamik Sınıf Kullanımı
              className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl`}
            >
              <h2 className={`text-xl font-bold ${whiteTextClass} mb-6 flex items-center gap-2`}>
                <Building2 className={`w-5 h-5 ${accentIconClass}`} />
                Department Performance
              </h2>
              <div className="space-y-4">
                {departments.map((dept, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    // 6. DEPT ALT KARTLARI: Dinamik Sınıf Kullanımı
                    className={`backdrop-blur-xl ${themeClasses.card.replace('shadow-2xl', '').replace('rounded-2xl', 'rounded-xl')} p-5 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Metin Rengi: Statik text-white yerine dinamik whiteTextClass kullanıldı */}
                          <h3 className={`font-semibold ${whiteTextClass}`}>{dept.name}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${dept.status === 'excellent' ? 'bg-green-500/20 text-green-700 border border-green-500/30 dark:text-green-300' : dept.status === 'good' ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30 dark:text-blue-300' : 'bg-orange-500/20 text-orange-700 border border-orange-500/30 dark:text-orange-300'}`}>
                            {dept.status === 'excellent' ? '🏆 Excellent' : 
                             dept.status === 'good' ? '✓ Good' : '⚠ Needs Attention'}
                          </span>
                        </div>
                        {/* Metin Rengi: Dinamik mutedText kullanıldı */}
                        <div className={`flex gap-4 text-sm ${mutedText}`}>
                          <span>{dept.students} students</span>
                          <span>•</span>
                          <span>{dept.courses} courses</span>
                          <span>•</span>
                          <span>{dept.faculty} faculty</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Avg Grade Barı */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className={`${mutedText}`}>Avg Grade</span>
                          <span className={`font-semibold ${whiteTextClass}`}>{dept.avgGrade}%</span>
                        </div>
                        {/* Bar Arka Planı: Aydınlık mod uyumu için dinamik bg */}
                        <div className={`h-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${dept.avgGrade}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            style={{ backgroundImage: `linear-gradient(to right, #3B82F6, #06B6D4)` }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>
                      {/* PO Achievement Barı */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className={`${mutedText}`}>PO Achievement</span>
                          <span className={`font-semibold ${whiteTextClass}`}>{dept.poAchievement}%</span>
                        </div>
                        {/* Bar Arka Planı: Aydınlık mod uyumu için dinamik bg */}
                        <div className={`h-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${dept.poAchievement}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            // Koşullu Renkler için Inline Style
                            style={{
                              backgroundImage: `linear-gradient(to right, ${dept.poAchievement >= 80 ? '#10B981' : dept.poAchievement >= 70 ? '#3B82F6' : '#F97316'}, ${dept.poAchievement >= 80 ? '#059669' : dept.poAchievement >= 70 ? '#06B6D4' : '#EF4444'})`
                            }}
                            className={`h-full rounded-full`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Program Outcomes Overview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              // 7. PO KARTI: Dinamik Sınıf Kullanımı
              className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl mt-6`}
            >
              <h2 className={`text-xl font-bold ${whiteTextClass} mb-6 flex items-center gap-2`}>
                <Trophy className="w-5 h-5 text-yellow-500" />
                Program Outcomes Overview
              </h2>
              <div className="space-y-4">
                {programOutcomes.map((po, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    // 8. PO ALT KARTLARI: Dinamik Sınıf Kullanımı
                    className={`backdrop-blur-xl ${themeClasses.card.replace('shadow-2xl', '').replace('rounded-2xl', 'rounded-xl')} p-4 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`${accentIconClass} font-bold text-sm`}>{po.code}</span>
                        <span className={`font-medium ${whiteTextClass}`}>{po.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${po.status === 'excellent' ? 'text-green-500' : 'text-blue-500'}`}>
                          {po.current}%
                        </span>
                        {po.status === 'excellent' ? (
                          <Trophy className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {/* Bar Arka Planı: Aydınlık mod uyumu için dinamik bg */}
                      <div className={`flex-1 h-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(po.current / 100) * 100}%` }}
                          transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                          style={{
                            backgroundImage: `linear-gradient(to right, 
                              ${po.status === 'excellent' ? '#10B981' : '#3B82F6'}, 
                              ${po.status === 'excellent' ? '#059669' : '#06B6D4'}
                            )` 
                          }}
                          className={`h-full rounded-full`}
                        />
                      </div>
                      {/* Metin Rengi: Dinamik mutedText kullanıldı */}
                      <span className={`${mutedText} text-xs w-16`}>Target: {po.target}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}