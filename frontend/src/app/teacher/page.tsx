// app/teacher/page.tsx
'use client';

import { motion } from 'framer-motion';
import { BookOpen, Users, Award, TrendingUp, ArrowUpRight, ArrowDownRight, AlertTriangle, FileText, BarChart3, Clock, Target, Loader2, PenSquare, MessageCircle, CalendarDays, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, type DashboardData, type Course } from '@/lib/api'; 
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    ArcElement, 
    Tooltip, 
    Legend, 
    PointElement, 
    LineElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Chart.js'i gerekli elemanlarla kaydetme
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  PointElement, 
  LineElement
);

// --- TYPES ---
interface CourseWithStats extends Course {
  students?: number;
  avgGrade?: number;
  poAchievement?: number;
  status?: 'excellent' | 'good' | 'average';
}


// Chart data will be generated dynamically in the component

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

const barOptions = (isDark: boolean, mutedText: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
        legend: { 
            labels: { color: mutedText, boxWidth: 10, boxHeight: 10 },
            display: false
        } 
    },
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

const lineOptions = (isDark: boolean, mutedText: string) => ({
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
            beginAtZero: false,
            min: 70,
            max: 100,
            title: { display: true, text: 'Achievement (%)', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText, stepSize: 10 }
        },
        x: {
            title: { display: true, text: 'Program Outcomes', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText }
        }
    }
});

const doughnutOptions = (isDark: boolean, mutedText: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { 
            position: 'bottom' as const,
            labels: { color: mutedText, boxWidth: 12, boxHeight: 12, padding: 15 }
        },
        tooltip: {
            bodyColor: isDark ? '#FFF' : '#000',
            titleColor: isDark ? '#FFF' : '#000',
            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        }
    }
});

// --- ANA DASHBOARD BİLEŞENİ ---
export default function TeacherHomePage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loAchievements, setLoAchievements] = useState<any[]>([]);
  
  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTeacherDashboard();
      setDashboardData(data);
      
      // Fetch LO achievements for all courses
      const allCourses = data.courses || [];
      const courseIds = allCourses.map((c: any) => c.id);
      
      console.log('📊 Fetching LO achievements for courses:', courseIds);
      
      // Fetch LO achievements for each course
      // If no courses, try fetching all LO achievements
      let allLoAchievements: any[] = [];
      
      if (courseIds.length > 0) {
        const loAchievementPromises = courseIds.map((courseId: number) => 
          api.getLOAchievements({ course: courseId }).catch(err => {
            console.warn(`⚠️ Failed to fetch LO achievements for course ${courseId}:`, err);
            return []; // Return empty array on error
          })
        );
        
        const loAchievementResults = await Promise.all(loAchievementPromises);
        allLoAchievements = loAchievementResults.flat();
      } else {
        // If no courses, try fetching all LO achievements
        try {
          allLoAchievements = await api.getLOAchievements();
        } catch (err) {
          console.warn('⚠️ Failed to fetch LO achievements:', err);
          allLoAchievements = [];
        }
      }
      
      console.log('✅ LO Achievements fetched:', allLoAchievements.length, allLoAchievements);
      setLoAchievements(allLoAchievements);
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
  const teacher = dashboardData.teacher;
  const allCourses = dashboardData.courses || [];
  const totalStudents = dashboardData.total_students || 0;

  // Remove duplicate courses by course ID AND course name (keep first occurrence)
  const courses = allCourses.filter((course: any, index: number, self: any[]) => {
    const courseId = typeof course.id === 'string' ? parseInt(course.id) : course.id;
    const courseName = (course.name || '').toLowerCase().trim();
    
    // Keep only first occurrence of each course (by ID OR by name if names match)
    return index === self.findIndex((c: any) => {
      const cCourseId = typeof c.id === 'string' ? parseInt(c.id) : c.id;
      const cCourseName = (c.name || '').toLowerCase().trim();
      
      // Match by course ID OR by course name (if names are the same, treat as duplicate)
      return cCourseId === courseId || (courseName && cCourseName && courseName === cCourseName);
    });
  });

  // Calculate stats
  const totalCourses = courses.length;
  
  // Calculate average grade from enrollments
  let totalGradeSum = 0;
  let totalGradeCount = 0;
  courses.forEach((course: any) => {
    const enrollments = course.enrollments || [];
    enrollments.forEach((enrollment: any) => {
      if (enrollment.final_grade) {
        totalGradeSum += enrollment.final_grade;
        totalGradeCount++;
      }
    });
  });
  const avgGrade = totalGradeCount > 0 ? totalGradeSum / totalGradeCount : 0;

  // Prepare course data with stats
  const currentCourses: CourseWithStats[] = courses.map(course => {
    const enrollments = (course as any).enrollments || [];
    const students = enrollments.length;
    const avgGrade = enrollments.length > 0
      ? enrollments.reduce((sum: number, e: any) => sum + (e.final_grade || 0), 0) / enrollments.length
      : 0;
    
    // Get PO achievement from backend (course.avg_po_achievement) or calculate from aggregated PO achievements
    let poAchievement = 0;
    if ((course as any).avg_po_achievement !== undefined && (course as any).avg_po_achievement !== null) {
      // Use backend calculated PO achievement for this course
      poAchievement = (course as any).avg_po_achievement;
    } else if (poAchievements.length > 0) {
      // Fallback: Calculate average from aggregated PO achievements
      const totalPO = poAchievements.reduce((sum: number, po: any) => {
        return sum + (po.achievement_percentage || 0);
      }, 0);
      poAchievement = totalPO / poAchievements.length;
    }
    
    let status: 'excellent' | 'good' | 'average' = 'average';
    if (avgGrade >= 85) status = 'excellent';
    else if (avgGrade >= 75) status = 'good';

    return {
      ...course,
      students,
      avgGrade: Math.round(avgGrade * 10) / 10,
      poAchievement: Math.round(poAchievement * 10) / 10,
      status
    };
  });

  // Performance stats
  const performanceStats: Array<{
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'stable';
    icon: any;
    color: string;
  }> = [
    { title: 'Active Courses', value: totalCourses > 0 ? totalCourses.toString() : '-', change: '', trend: 'up', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { title: 'Total Students', value: totalStudents > 0 ? totalStudents.toString() : '-', change: '', trend: 'up', icon: Users, color: 'from-purple-500 to-pink-500' }
  ];

  // Recent activities from recent submissions (if available)
  const recentSubmissions = (dashboardData as any).recent_submissions || [];
  const recentActivities = recentSubmissions.slice(0, 3).map((submission: any) => ({
    type: 'grade' as const,
    title: `Graded ${submission.assessment_title || 'Assessment'}`,
    time: submission.graded_at ? new Date(submission.graded_at).toLocaleString() : '-',
    icon: FileText,
    color: 'blue' as const
  }));


  // Calculate Average LO Outcomes
  // Group LO achievements by LO code and calculate average
  const loAchievementMap = new Map<string, { total: number; count: number; title: string }>();
  
  if (loAchievements && loAchievements.length > 0) {
    loAchievements.forEach((achievement: any) => {
      // Handle both number and object types for learning_outcome
      const loCode = achievement.lo_code || (achievement.learning_outcome?.code) || `LO-${achievement.learning_outcome}`;
      const loTitle = achievement.lo_title || (achievement.learning_outcome?.title) || loCode;
      // current_percentage might be a Decimal or number
      const currentPercentage = typeof achievement.current_percentage === 'number' 
        ? achievement.current_percentage 
        : (achievement.current_percentage ? parseFloat(achievement.current_percentage) : 0);
      
      if (loCode && !isNaN(currentPercentage)) {
        if (loAchievementMap.has(loCode)) {
          const existing = loAchievementMap.get(loCode)!;
          existing.total += currentPercentage;
          existing.count += 1;
        } else {
          loAchievementMap.set(loCode, {
            total: currentPercentage,
            count: 1,
            title: loTitle
          });
        }
      }
    });
  }
  
  // Calculate average for each LO
  const averageLOOutcomes: Array<{ code: string; title: string; average: number }> = [];
  loAchievementMap.forEach((value, code) => {
    if (value.count > 0) {
      averageLOOutcomes.push({
        code,
        title: value.title,
        average: value.total / value.count
      });
    }
  });
  
  // Sort by code for consistent display
  averageLOOutcomes.sort((a, b) => a.code.localeCompare(b.code));
  
  const hasLOData = averageLOOutcomes.length > 0 && averageLOOutcomes.some(lo => lo.average > 0);
  
  // Generate colors dynamically based on number of LOs
  const generateColors = (count: number) => {
    const colors = [
      'rgba(99, 102, 241, 0.8)',   // indigo
      'rgba(16, 185, 129, 0.8)',   // green
      'rgba(59, 130, 246, 0.8)',   // blue
      'rgba(251, 191, 36, 0.8)',   // yellow
      'rgba(249, 115, 22, 0.8)',   // orange
      'rgba(236, 72, 153, 0.8)',   // pink
      'rgba(168, 85, 247, 0.8)',   // purple
      'rgba(14, 165, 233, 0.8)',   // cyan
      'rgba(239, 68, 68, 0.8)',    // red
      'rgba(34, 197, 94, 0.8)',    // emerald
    ];
    const borderColors = [
      'rgb(99, 102, 241)',
      'rgb(16, 185, 129)',
      'rgb(59, 130, 246)',
      'rgb(251, 191, 36)',
      'rgb(249, 115, 22)',
      'rgb(236, 72, 153)',
      'rgb(168, 85, 247)',
      'rgb(14, 165, 233)',
      'rgb(239, 68, 68)',
      'rgb(34, 197, 94)',
    ];
    
    // Repeat colors if needed
    const result = [];
    const borderResult = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
      borderResult.push(borderColors[i % borderColors.length]);
    }
    return { backgroundColor: result, borderColor: borderResult };
  };
  
  const colors = hasLOData ? generateColors(averageLOOutcomes.length) : { backgroundColor: [], borderColor: [] };
  
  const averageLOOutcomesData = {
    labels: hasLOData ? averageLOOutcomes.map(lo => lo.code) : [],
    datasets: [
      {
        label: 'Average Achievement (%)',
        data: hasLOData ? averageLOOutcomes.map(lo => Math.round(lo.average * 10) / 10) : [],
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        borderWidth: 2
      }
    ]
  };

  // PO Achievement data from actual PO achievements
  const poAchievements = dashboardData.po_achievements || [];
  const poLabels: string[] = [];
  const poData: number[] = [];

  if (poAchievements.length > 0) {
    poAchievements.forEach((po: any) => {
      poLabels.push(po.po_code || 'PO');
      poData.push(po.achievement_percentage || 0);
    });
  }

  const hasPOData = poData.length > 0;

  const poAchievementData = {
    labels: hasPOData ? poLabels : [],
    datasets: [
      {
        label: 'Achievement (%)',
        data: hasPOData ? poData : [],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgb(99, 102, 241)',
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(99, 102, 241)',
        tension: 0.4
      }
    ]
  };

  // Course performance data
  const hasCourseData = currentCourses.length > 0;
  const coursePerformanceData = {
    labels: hasCourseData ? currentCourses.map(c => c.code) : [],
    datasets: [
      {
        label: 'Average Grade (%)',
        data: hasCourseData ? currentCourses.map(c => c.avgGrade || 0) : [],
        backgroundColor: hasCourseData ? currentCourses.map(c => 
          (c.avgGrade || 0) >= 85 ? 'rgba(16, 185, 129, 0.8)' : 
          (c.avgGrade || 0) >= 80 ? 'rgba(59, 130, 246, 0.8)' : 
          'rgba(251, 191, 36, 0.8)'
        ) : [],
        borderColor: hasCourseData ? currentCourses.map(c => 
          (c.avgGrade || 0) >= 85 ? 'rgb(16, 185, 129)' : 
          (c.avgGrade || 0) >= 80 ? 'rgb(59, 130, 246)' : 
          'rgb(251, 191, 36)'
        ) : [],
        borderWidth: 2
      }
    ]
  };
  
  const whiteTextClass = text;
  const accentIconClass = isDark ? 'text-indigo-400' : 'text-indigo-600';
  const secondaryTextClass = mutedText;

  const dynamicBarOptions = barOptions(isDark, secondaryTextClass);
  const dynamicLineOptions = lineOptions(isDark, secondaryTextClass);
  const dynamicDoughnutOptions = doughnutOptions(isDark, secondaryTextClass);

  const heroChips = [
    { label: 'Courses', value: totalCourses.toString() },
    { label: 'Students', value: totalStudents.toString() },
  ];

  const quickActions = [
    { label: 'Record Grades', description: 'Update latest assessments', href: '/teacher/grades', icon: PenSquare },
    { label: 'View Analytics', description: 'Monitor course KPIs', href: '/teacher/analytics', icon: TrendingUp },
    { label: 'Manage Outcomes', description: 'Align PO mappings', href: '/teacher/learning-outcome', icon: Target },
  ];

  const sortedByGrade = [...currentCourses].sort((a, b) => (b.avgGrade || 0) - (a.avgGrade || 0));
  const bestCourse = sortedByGrade[0];
  const attentionCourse = [...currentCourses]
    .sort((a, b) => (a.avgGrade || 0) - (b.avgGrade || 0))
    .find(course => (course.avgGrade || 0) < 80);


  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8"
        >
          <div
            className="xl:col-span-2 rounded-2xl p-6 relative overflow-hidden shadow-2xl border border-white/10"
            style={{ backgroundImage: `linear-gradient(135deg, ${accentStart}, ${accentEnd})` }}
          >
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-white/70 text-sm">Instructor Dashboard</p>
                  <h1 className="text-4xl font-bold text-white leading-tight">
                    Welcome back, {teacher?.first_name || '-'}
                  </h1>
                  <p className="text-white/80 text-sm mt-1">
                    {teacher?.department || 'Department not set'} • {totalCourses} Courses • {totalStudents} Students
                  </p>
                </div>
                <div className="px-4 py-2 rounded-full bg-white/15 text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Performance mode
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {heroChips.map((chip) => (
                  <div key={chip.label} className="rounded-xl bg-white/15 p-3 text-white">
                    <p className="text-xs uppercase tracking-wider text-white/70">{chip.label}</p>
                    <p className="text-2xl font-semibold mt-1">{chip.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/teacher/grades" className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-indigo-600 font-medium shadow-lg">
                  <PenSquare className="w-4 h-4" />
                  Record Grades
                </Link>
                <Link href="/teacher/analytics" className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-white/40 text-white font-medium backdrop-blur">
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </Link>
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 w-48 pointer-events-none opacity-30">
              <div className="h-full w-full bg-gradient-to-b from-white/60 to-transparent blur-3xl" />
            </div>
          </div>

          <div className={`backdrop-blur-xl ${themeClasses.card} rounded-2xl p-6 shadow-xl flex flex-col gap-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${secondaryTextClass} text-sm`}>Focus Course</p>
                <h3 className={`text-2xl font-semibold ${whiteTextClass}`}>{bestCourse ? bestCourse.code : '—'}</h3>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                Top Performing
              </div>
            </div>
            {bestCourse ? (
              <>
                <p className={`${secondaryTextClass} text-sm`}>
                  {bestCourse.name}
                </p>
                <div className="text-sm">
                  <div>
                    <p className={`${secondaryTextClass}`}>Students</p>
                    <p className={`text-xl font-semibold ${whiteTextClass}`}>{bestCourse.students}</p>
                  </div>
                </div>
                {attentionCourse && (
                  <div className={`mt-3 p-3 rounded-xl border ${isDark ? 'border-orange-500/30 bg-orange-500/10' : 'border-orange-200 bg-orange-50'}`}>
                    <p className="text-xs uppercase tracking-wide text-orange-500">Needs Attention</p>
                    <p className={`font-medium ${whiteTextClass}`}>{attentionCourse.code} - {attentionCourse.name}</p>
                    <p className="text-xs text-orange-500">{attentionCourse.students} students</p>
                  </div>
                )}
              </>
            ) : (
              <p className={secondaryTextClass}>No course data available yet.</p>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
        >
          {quickActions.map((action, idx) => (
            <Link key={action.label} href={action.href}>
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ delay: idx * 0.05 }}
                className={`backdrop-blur-xl ${themeClasses.card} rounded-2xl p-4 shadow-xl border border-transparent hover:border-indigo-400/40`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <action.icon className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className={`font-semibold ${whiteTextClass}`}>{action.label}</p>
                    <p className={`text-xs ${secondaryTextClass}`}>{action.description}</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Stats Overview */}
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
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
                            {stat.change && (
                              <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-500' : stat.trend === 'down' ? 'text-red-500' : 'text-yellow-500'}`}>
                                  {stat.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                                  {stat.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                                  {stat.change}
                              </div>
                            )}
                        </div>
                        <h3 className={`${secondaryTextClass} text-sm mb-1`}>{stat.title}</h3>
                        <p className={`text-3xl font-bold ${whiteTextClass}`}>{stat.value || '-'}</p>
                    </motion.div>
                );
            })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sol Sütun (Course Performance ve PO Achievement) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Course Performance Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-96`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <BarChart3 className={`w-5 h-5 ${accentIconClass}`} />
                        Course Performance Overview
                    </h2>
                    <div className="h-72">
                        {hasCourseData ? (
                            <Bar data={coursePerformanceData} options={dynamicBarOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className={secondaryTextClass}>No course data available</p>
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
                        <Target className={`w-5 h-5 ${accentIconClass}`} />
                        Program Outcomes Achievement
                    </h2>
                    <div className="h-72">
                        {hasPOData ? (
                            <Line data={poAchievementData} options={dynamicLineOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className={secondaryTextClass}>No PO achievement data available</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Current Courses List */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <BookOpen className={`w-5 h-5 ${accentIconClass}`} />
                        Current Courses
                    </h2>
                    <div className="space-y-4">
                        {currentCourses.length > 0 ? currentCourses.map((course, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className={`backdrop-blur-xl ${themeClasses.card.replace('shadow-2xl', '').replace('rounded-2xl', 'rounded-xl')} p-4 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className={`font-semibold ${whiteTextClass}`}>{course.code} - {course.name}</h3>
                                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                                course.status === 'excellent' ? 'bg-green-500/20 text-green-700 border border-green-500/30 dark:text-green-300' :
                                                'bg-blue-500/20 text-blue-700 border border-blue-500/30 dark:text-blue-300'
                                            }`}>
                                                {course.status === 'excellent' ? '🏆 Excellent' : '✓ Good'}
                                            </span>
                                        </div>
                                        <div className={`flex gap-4 text-sm ${mutedText}`}>
                                            <span>{course.students} students</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className={`${mutedText}`}>PO Achievement</span>
                                        <span className={`font-semibold ${whiteTextClass}`}>{course.poAchievement !== undefined ? `${course.poAchievement}%` : '-'}</span>
                                    </div>
                                    <div className={`h-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.poAchievement || 0}%` }}
                                            transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                                            style={{
                                                backgroundImage: `linear-gradient(to right, 
                                                    ${(course.poAchievement || 0) >= 90 ? '#10B981' : '#3B82F6'}, 
                                                    ${(course.poAchievement || 0) >= 90 ? '#059669' : '#06B6D4'}
                                                )` 
                                            }}
                                            className="h-full rounded-full"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="text-center py-8">
                                <p className={secondaryTextClass}>No courses available</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Sağ Sütun (Average LO Outcomes ve Recent Activities) */}
            <div className="space-y-6">

                {/* Average LO Outcomes Doughnut Chart */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-96`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <Target className={`w-5 h-5 ${accentIconClass}`} />
                        Average LO Outcomes
                    </h2>
                    <div className="h-72 relative">
                        {hasLOData && averageLOOutcomesData.labels.length > 0 && averageLOOutcomesData.datasets[0].data.length > 0 ? (
                            <Doughnut 
                                data={averageLOOutcomesData} 
                                options={{
                                    ...dynamicDoughnutOptions,
                                    maintainAspectRatio: false,
                                    responsive: true,
                                }} 
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className={secondaryTextClass}>
                                    {loAchievements.length === 0 
                                        ? 'No LO achievement data available' 
                                        : 'Calculating LO averages...'}
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
                
                {/* Recent Activities */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <Clock className="w-5 h-5 text-blue-500" />
                        Recent Activities
                    </h2>
                    <div className="space-y-3">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity: { type: string; title: string; time: string; icon: any; color: string }, index: number) => {
                                const colorClasses = {
                                    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
                                    green: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300',
                                    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300',
                                };
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + index * 0.1 }}
                                        whileHover={{ scale: 1.02 }}
                                        className={`p-3 rounded-xl border ${colorClasses[activity.color as keyof typeof colorClasses]} ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all cursor-pointer`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <activity.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <h3 className={`font-medium text-sm mb-1 ${whiteTextClass}`}>{activity.title}</h3>
                                                <span className="text-xs text-gray-500">{activity.time}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="text-center py-4">
                                <p className={secondaryTextClass}>-</p>
                            </div>
                        )}
                    </div>
                </motion.div>

            </div>
        </div>
    </motion.div>
  );
}

