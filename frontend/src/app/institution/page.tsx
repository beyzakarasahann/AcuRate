'use client';

import { motion } from 'framer-motion';
import { Building2, Users, BookOpen, TrendingUp, Filter, FileText, AlertTriangle, CheckCircle2, Trophy, ArrowUpRight, ArrowDownRight, Moon, Sun, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes'; 
import { api, DashboardData } from '../../lib/api';

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


interface InstitutionDashboardData extends DashboardData {
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
  }>;
}

export default function InstitutionDashboard() {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('fall-2024');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<InstitutionDashboardData | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getInstitutionDashboard();
      setDashboardData(data as InstitutionDashboardData);
    } catch (err: any) {
      console.error('Error fetching institution dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from API data
  const stats = dashboardData ? [
    {
      title: 'Total Students',
      value: dashboardData.total_students?.toLocaleString() || '0',
      change: '+0%', // TODO: Calculate from historical data
      trend: 'up' as const,
      icon: Users,
      color: 'from-blue-500 to-cyan-500' 
    },
    {
      title: 'Faculty Members',
      value: dashboardData.total_teachers?.toLocaleString() || '0',
      change: '+0%', // TODO: Calculate from historical data
      trend: 'up' as const,
      icon: Users,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Active Courses',
      value: dashboardData.total_courses?.toLocaleString() || '0',
      change: '+0%', // TODO: Calculate from historical data
      trend: 'up' as const,
      icon: BookOpen,
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Avg Performance',
      value: dashboardData.po_achievements && dashboardData.po_achievements.length > 0
        ? `${(dashboardData.po_achievements.reduce((sum, po) => sum + (po.average_achievement ?? 0), 0) / dashboardData.po_achievements.length).toFixed(1)}%`
        : '0%',
      change: '+0%', // TODO: Calculate from historical data
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500'
    }
  ] : [];

  // Transform department stats from API
  const departments = dashboardData?.department_stats?.map(dept => {
    // Calculate avg grade and PO achievement from enrollments (simplified)
    // TODO: Get actual data from backend
    const avgGrade = 75; // Placeholder
    const poAchievement = 75; // Placeholder
    return {
      name: dept.department,
      students: dept.student_count,
      avgGrade,
      poAchievement,
      status: poAchievement >= 80 ? 'excellent' : poAchievement >= 70 ? 'good' : 'needs-attention' as const,
      courses: 0, // TODO: Get from backend
      faculty: 0 // TODO: Get from backend
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
      status: (current >= target * 1.1 ? 'excellent' : current >= target ? 'achieved' : 'not-achieved') as const
    };
  }) || [];

  // Mock alerts (TODO: Get from backend)
  const recentAlerts = [
    {
      type: 'warning' as const,
      title: 'Some PO Below Target',
      description: 'Check PO achievements for details',
      time: 'Recently'
    },
    {
      type: 'info' as const,
      title: 'Dashboard Updated',
      description: 'Latest data loaded successfully',
      time: 'Just now'
    }
  ];

  // 1. Kancadan Dinamik Tema Değerlerini Alma
  const { 
    isDark, 
    mounted: themeMounted, 
    accentStart, 
    accentEnd, 
    themeClasses, 
    mutedText, 
  } = useThemeColors();

  // Temayı değiştirmek için next-themes hook'unu kullanma
  const { setTheme } = useTheme();

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

  // Tema değiştirme fonksiyonu
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Institution Dashboard
                </h1>
                {/* Metin Rengi: Dinamik mutedText kullanıldı */}
                <p className={`${secondaryTextClass} text-sm`}>Academic Performance Overview</p>
              </div>
            </div>
            <div className="flex gap-3">
              {/* 🌙 TEMA DEĞİŞTİRME DÜĞMESİ (Sadece Emoji) */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                // Temel kart stiline uyumlu, border rengini temaya göre değiştir
                className={`px-4 py-2 rounded-xl ${themeClasses.card.replace('shadow-2xl', '').replace('border-white/10', isDark ? 'border-white/10' : 'border-gray-300')} ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-700 bg-white/70 hover:bg-gray-100'} flex items-center justify-center gap-2 transition-all backdrop-blur-xl`}
                // Emojinin erişilebilirlik adını ekleyelim
                aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                // Filtre Butonu: Dinamik Sınıf Kullanımı (Temel kart stiline uyumlu)
                className={`px-4 py-2 rounded-xl ${themeClasses.card.replace('shadow-2xl', '').replace('rounded-2xl', 'rounded-xl')} ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'} flex items-center gap-2 transition-all backdrop-blur-xl`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </motion.button>
              
              {/* Rapor Butonu (Dinamik Gradient) */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ backgroundImage: `linear-gradient(to right, ${accentStart}, ${accentEnd})` }}
                className="px-4 py-2 rounded-xl text-white flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
              >
                <FileText className="w-4 h-4" />
                Export Report
              </motion.button>
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
            return (
              <motion.div
                key={index}
                variants={item}
                whileHover={{ scale: 1.05, y: -5 }}
                // 4. STAT KARTLARI: Dinamik Sınıf Kullanımı
                className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl hover:shadow-indigo-500/20 transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  {/* İkon Arka Planı (Dinamik Gradient) */}
                  <div
                    style={{ backgroundImage: `linear-gradient(to bottom right, ${start}, ${end})` }}
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {stat.change}
                  </div>
                </div>
                {/* Metin Rengi: Dinamik mutedText kullanıldı */}
                <h3 className={`${secondaryTextClass} text-sm mb-1`}>{stat.title}</h3>
                {/* Metin Rengi: Statik text-white yerine dinamik whiteTextClass kullanıldı */}
                <p className={`text-3xl font-bold ${whiteTextClass}`}>{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Performance */}
          <div className="lg:col-span-2">
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
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            dept.status === 'excellent' ? 'bg-green-500/20 text-green-700 border border-green-500/30 dark:text-green-300' :
                            dept.status === 'good' ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30 dark:text-blue-300' :
                            'bg-orange-500/20 text-orange-700 border border-orange-500/30 dark:text-orange-300'
                          }`}>
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
                              backgroundImage: `linear-gradient(to right, 
                                ${dept.poAchievement >= 80 ? '#10B981' : dept.poAchievement >= 70 ? '#3B82F6' : '#F97316'}, 
                                ${dept.poAchievement >= 80 ? '#059669' : dept.poAchievement >= 70 ? '#06B6D4' : '#EF4444'}
                              )` 
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
                        <span className={`text-sm font-semibold ${
                          po.status === 'excellent' ? 'text-green-500' : 'text-blue-500'
                        }`}>
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              // 9. ALERTS KARTI: Dinamik Sınıf Kullanımı
              className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl`}
            >
              <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Recent Alerts
              </h2>
              <div className="space-y-3">
                {recentAlerts.map((alert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    // Alert Kartları: Statik renk sınıfları korundu, karanlık moda uyumlu
                    className={`p-4 rounded-xl border ${
                      alert.type === 'warning' ? 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300' :
                      alert.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300' :
                      'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
                    } ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all cursor-pointer`}
                  >
                    <h3 className={`font-medium text-sm mb-1 ${whiteTextClass}`}>{alert.title}</h3>
                    {/* Metin Rengi: Dinamik mutedText kullanıldı */}
                    <p className={`${secondaryTextClass} text-xs mb-2`}>{alert.description}</p>
                    {/* Metin Rengi: text-gray-500 korundu, her iki modda da uygun */}
                    <span className="text-gray-500 text-xs">{alert.time}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              // 10. QUICK ACTIONS KARTI: Dinamik Sınıf Kullanımı
              className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl`}
            >
              <h2 className={`text-xl font-bold ${whiteTextClass} mb-4`}>Quick Actions</h2>
              <div className="space-y-2">
                {['Generate Report', 'Schedule Meeting', 'View Analytics'].map((action, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    // Quick Actions Butonları: Dinamik Sınıf Kullanımı
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.card.replace('shadow-2xl', '').replace('rounded-2xl', 'rounded-xl')} ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'} text-left transition-all`}
                  >
                    {action}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Accreditation Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              // 11. AKREDİTASYON KARTI: Inline Style ile Dinamiklik
              style={{
                  // Yeşil gradientin opaklığını temaya göre ayarla
                  backgroundImage: isDark ? 'linear-gradient(to bottom right, rgba(16, 185, 107, 0.2), rgba(5, 150, 105, 0.2))' : 'linear-gradient(to bottom right, rgba(16, 185, 107, 0.05), rgba(5, 150, 105, 0.05))',
                  borderColor: isDark ? 'rgba(16, 185, 107, 0.3)' : 'rgba(5, 150, 105, 0.2)',
              }}
              className="rounded-2xl border p-6 shadow-2xl"
            >
              <h2 className={`text-xl font-bold ${whiteTextClass} mb-2 flex items-center gap-2`}>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Accreditation Status
              </h2>
              <p className="text-green-500 text-sm mb-3">All criteria met for ABET 2024</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={`${secondaryTextClass}`}>PO Achievement</span>
                  <span className="text-green-500 font-semibold">✓ 95%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`${secondaryTextClass}`}>Documentation</span>
                  <span className="text-green-500 font-semibold">✓ Complete</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`${secondaryTextClass}`}>Student Feedback</span>
                  <span className="text-green-500 font-semibold">✓ 4.2/5.0</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}