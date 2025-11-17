// app/student/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Award, BookOpen, CheckSquare, Trophy, ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, type DashboardData, type Enrollment, type StudentPOAchievement } from '@/lib/api';
import Link from 'next/link'; 
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Tooltip, 
    Legend, 
    PointElement, 
    LineElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Chart.js'i gerekli elemanlarla kaydetme
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  PointElement, 
  LineElement
);


// --- YARDIMCI FONKSİYONLAR VE SABİTLER ---

const getGradientColors = (colorClass: string) => {
    switch (colorClass) {
        case 'from-green-500 to-emerald-500': return { start: '#10B981', end: '#059669' };
        case 'from-blue-500 to-cyan-500': return { start: '#3B82F6', end: '#06B6D4' };
        case 'from-orange-500 to-red-500': return { start: '#F97316', end: '#EF4444' };
        case 'from-purple-500 to-pink-500': return { start: '#A855F7', end: '#EC4899' };
        default: return { start: '#6366F1', end: '#9333EA' };
    }
};

const lineOptions = (isDark: boolean, mutedText: string, min?: number, max?: number, yAxisLabel?: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: mutedText, boxWidth: 10, boxHeight: 10 } },
        tooltip: {
            bodyColor: isDark ? '#FFF' : '#000',
            titleColor: isDark ? '#FFF' : '#000',
            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        }
    },
    scales: {
        y: {
            beginAtZero: min === undefined,
            ...(min !== undefined && { min }),
            ...(max !== undefined && { max }),
            title: { display: true, text: yAxisLabel || 'Value', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText }
        },
        x: {
            title: { display: true, text: 'Period', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText }
        }
    }
});

const barOptions = (isDark: boolean, mutedText: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
        ticks: { color: mutedText, stepSize: 20 }
      },
      x: {
        grid: { display: false },
        ticks: { color: mutedText }
      }
    }
});


// Chart data functions will be generated dynamically


// --- ANA DASHBOARD BİLEŞENİ ---
export default function StudentHomePage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  
  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStudentDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const { 
    isDark, 
    mounted: themeMounted, 
    accentStart, 
    accentEnd, 
    themeClasses, 
    mutedText, 
    text
  } = useThemeColors();

  if (!mounted || !themeMounted) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={mutedText}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`text-center p-6 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error || 'Failed to load dashboard data'}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extract data
  const student = dashboardData.student;
  const enrollments = dashboardData.enrollments || [];
  const poAchievements = dashboardData.po_achievements || [];
  const overallGpa = dashboardData.overall_gpa || 0;
  const totalCredits = dashboardData.total_credits || 0;
  const completedCourses = dashboardData.completed_courses || 0;

  // Calculate active courses
  const activeCourses = enrollments.filter(e => e.is_active);

  // Calculate total PO achievement
  const totalPOAchievement = poAchievements.length > 0
    ? Math.round(poAchievements.reduce((sum, po) => sum + (po.achievement_percentage || 0), 0) / poAchievements.length)
    : 0;

  // Student info
  const studentInfo = {
    name: student ? `${student.first_name} ${student.last_name}` : '-',
    studentId: student?.student_id || '-',
    major: student?.department || '-',
    gpa: overallGpa,
    credits: totalCredits,
    status: overallGpa >= 3.5 ? 'High Performer' : overallGpa >= 3.0 ? 'Good' : 'Average'
  };
  
  const performanceStats: Array<{
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'stable';
    icon: any;
    color: string;
  }> = [
    { title: 'Current GPA', value: overallGpa > 0 ? overallGpa.toFixed(2) : '-', change: '', trend: 'up', icon: Trophy, color: 'from-green-500 to-emerald-500' },
    { title: 'Credits Earned', value: totalCredits > 0 ? totalCredits.toString() : '-', change: '', trend: 'up', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { title: 'Courses in Progress', value: activeCourses.length > 0 ? activeCourses.length.toString() : '-', change: '', trend: 'stable', icon: CheckSquare, color: 'from-orange-500 to-red-500' },
    { title: 'Total PO Achievement', value: totalPOAchievement > 0 ? `${totalPOAchievement}%` : '-', change: '', trend: 'up', icon: Award, color: 'from-purple-500 to-pink-500' }
  ];

  // GPA Trend Data (mock for now - can be calculated from semester data if available)
  const hasGPAData = overallGpa > 0;
  const gpaTrendData = {
    labels: hasGPAData ? ['Previous', 'Current'] : [],
    datasets: [
        {
            label: 'GPA',
            data: hasGPAData ? [overallGpa - 0.1, overallGpa] : [],
            fill: false,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            tension: 0.4
        }
    ]
  };

  // PO Achievement Line Chart Data
  const hasPOData = poAchievements.length > 0;
  const poLineData = {
    labels: hasPOData ? poAchievements.map(po => po.po_code || 'PO') : [],
    datasets: [
      {
        label: 'Achievement (%)',
        data: hasPOData ? poAchievements.map(po => po.achievement_percentage || 0) : [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(99, 102, 241)',
        tension: 0.4,
        fill: true
      },
      ...(hasPOData ? [{
        label: 'Target (%)',
        data: poAchievements.map(po => po.target_percentage || 0),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(239, 68, 68)',
        tension: 0.4,
        fill: false
      }] : [])
    ]
  };

  // Course Grades Data (only if courses exist)
  const hasCourseData = activeCourses.length > 0;
  const courseGradesData = {
    labels: hasCourseData ? activeCourses.map(e => e.course_code || '-') : [],
    datasets: [{
        label: 'PO Achievement (%)',
        data: hasCourseData ? activeCourses.map(() => 0) : [], // TODO: Calculate from actual PO data
        backgroundColor: hasCourseData ? activeCourses.map(() => '#3B82F6') : [],
        borderColor: hasCourseData ? activeCourses.map(() => '#06B6D4') : [],
        borderWidth: 1
    }]
  };
  
  const whiteTextClass = text;
  const accentIconClass = isDark ? 'text-indigo-400' : 'text-indigo-600';
  const secondaryTextClass = mutedText;

  const dynamicBarOptions = barOptions(isDark, secondaryTextClass);
  const dynamicLineOptions = lineOptions(isDark, secondaryTextClass, 0, 100, 'Achievement (%)');
  const dynamicGPALineOptions = lineOptions(isDark, secondaryTextClass, 0, 4.0, 'GPA');


  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Header (Minimal, Layout'taki büyük başlık yerine) */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-4 mb-8"
        >
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Welcome back, {studentInfo.name !== '-' ? studentInfo.name.split(' ')[0] : 'Student'}
            </h1>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
        >
            {performanceStats.map((stat, index) => {
                const { start, end } = getGradientColors(stat.color); 
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl hover:shadow-indigo-500/20 transition-all`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div
                                style={{ backgroundImage: `linear-gradient(to bottom right, ${start}, ${end})` }}
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg`}
                            >
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-500' : stat.trend === 'down' ? 'text-red-500' : 'text-yellow-500'}`}>
                                {stat.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                                {stat.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                                {stat.trend === 'stable' && <span className="text-gray-500">-</span>}
                                {stat.change !== '0' && stat.change}
                            </div>
                        </div>
                        <h3 className={`${secondaryTextClass} text-sm mb-1`}>{stat.title}</h3>
                        <p className={`text-3xl font-bold ${whiteTextClass}`}>{stat.value || '-'}</p>
                    </motion.div>
                );
            })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sol Sütun (Trend ve Radar) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* GPA Trend Line Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-96`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <TrendingUp className={`w-5 h-5 text-green-500`} />
                        Academic Performance Trend (GPA)
                    </h2>
                    <div className="h-72">
                        {hasGPAData ? (
                            <Line data={gpaTrendData} options={dynamicGPALineOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className={secondaryTextClass}>No GPA data available</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Program Outcomes Achievement Line Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-96`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <Award className={`w-5 h-5 ${accentIconClass}`} />
                        Program Outcomes Achievement
                    </h2>
                    <div className="h-72">
                        {hasPOData ? (
                            <Line data={poLineData} options={dynamicLineOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className={secondaryTextClass}>No PO achievement data available</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Sağ Sütun (My Courses & Grades ve Alerts) */}
            <div className="space-y-6">

                 {/* My Courses & Grades */}
                 <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-xl font-bold ${whiteTextClass} flex items-center gap-2`}>
                            <BookOpen className={`w-5 h-5 ${accentIconClass}`} />
                            My Courses & Grades
                        </h2>
                        <Link 
                            href="/student/courses"
                            className={`text-sm ${accentIconClass} hover:underline flex items-center gap-1`}
                        >
                            View All
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {activeCourses.length > 0 ? (
                            activeCourses.slice(0, 5).map((enrollment, index) => {
                                // Find grades for this course
                                const courseGrades = dashboardData.recent_grades?.filter(g => {
                                    // We need to check if grade's assessment belongs to this course
                                    // For now, we'll show enrollment info
                                    return true; // Simplified for now
                                }) || [];
                                
                                const finalGrade = enrollment.final_grade !== null && enrollment.final_grade !== undefined
                                    ? enrollment.final_grade
                                    : '-';
                                
                                return (
                                    <motion.div
                                        key={enrollment.id || index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 + index * 0.1 }}
                                        className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} transition-all`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className={`font-semibold ${whiteTextClass} mb-1`}>
                                                    {enrollment.course_code || 'N/A'}
                                                </h3>
                                                <p className={`text-sm ${secondaryTextClass} mb-2`}>
                                                    {enrollment.course_name || 'Unknown Course'}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className={secondaryTextClass}>
                                                        Status: <span className={enrollment.is_active ? 'text-green-500' : 'text-gray-500'}>
                                                            {enrollment.is_active ? 'In Progress' : 'Completed'}
                                                        </span>
                                                    </span>
                                                    <span className={secondaryTextClass}>
                                                        Grade: <span className={`font-semibold ${whiteTextClass}`}>
                                                            {typeof finalGrade === 'number' ? finalGrade.toFixed(1) : finalGrade}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="flex items-center justify-center py-8">
                                <p className={secondaryTextClass}>No courses enrolled</p>
                            </div>
                        )}
                    </div>
                </motion.div>
                
                {/* Notifications/Alerts */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Notifications
                    </h2>
                    <div className="space-y-2">
                        {poAchievements.length > 0 ? (
                            poAchievements
                                .filter(po => (po.achievement_percentage || 0) < (po.target_percentage || 0))
                                .slice(0, 2)
                                .map((po, index) => {
                                    const achievement = Number(po.achievement_percentage) || 0;
                                    const target = Number(po.target_percentage) || 0;
                                    return (
                                        <p key={index} className={`${secondaryTextClass} text-sm p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300`}>
                                            <strong>{po.po_code}</strong> PO Achievement is below target. Current: {achievement.toFixed(1)}%, Target: {target.toFixed(1)}%
                                        </p>
                                    );
                                })
                        ) : (
                            <p className={`${secondaryTextClass} text-sm p-3 rounded-xl ${isDark ? 'bg-gray-500/10 border-gray-500/30' : 'bg-gray-100 border-gray-200'}`}>
                                No notifications
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    </motion.div>
  );
}