// app/teacher/page.tsx
'use client';

import { motion } from 'framer-motion';
import { BookOpen, Users, Award, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, FileText, BarChart3, Clock, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
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

// --- MOCK VERİLER ---

const teacherInfo = {
  name: 'Dr. Sarah Mitchell',
  department: 'Computer Science',
  email: 's.mitchell@university.edu',
  totalCourses: 4,
  totalStudents: 125
};

const performanceStats = [
  { title: 'Active Courses', value: '4', change: '+1', trend: 'up', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
  { title: 'Total Students', value: '125', change: '+12', trend: 'up', icon: Users, color: 'from-purple-500 to-pink-500' },
  { title: 'Avg Grade', value: '82.5%', change: '+2.3%', trend: 'up', icon: Award, color: 'from-green-500 to-emerald-500' },
  { title: 'PO Achievement', value: '87%', change: '+4%', trend: 'up', icon: Target, color: 'from-orange-500 to-red-500' }
];

const currentCourses = [
  { code: 'CS301', name: 'Data Structures', students: 32, avgGrade: 85.2, poAchievement: 90, status: 'excellent' },
  { code: 'SE405', name: 'Software Engineering', students: 28, avgGrade: 80.5, poAchievement: 85, status: 'good' },
  { code: 'CS201', name: 'Programming Fundamentals', students: 45, avgGrade: 78.8, poAchievement: 82, status: 'good' },
  { code: 'CS401', name: 'Advanced Algorithms', students: 20, avgGrade: 88.5, poAchievement: 92, status: 'excellent' },
];

const recentActivities = [
  { type: 'grade', title: 'Graded CS301 Midterm', time: '2 hours ago', icon: FileText, color: 'blue' },
  { type: 'feedback', title: 'Provided feedback to 5 students', time: '5 hours ago', icon: CheckCircle2, color: 'green' },
  { type: 'alert', title: 'SE405 - 3 students below threshold', time: '1 day ago', icon: AlertTriangle, color: 'orange' },
];

const gradeDistributionData = {
  labels: ['A (90-100)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (<60)'],
  datasets: [
    {
      label: 'Students',
      data: [45, 52, 20, 6, 2],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: [
        'rgb(16, 185, 129)',
        'rgb(59, 130, 246)',
        'rgb(251, 191, 36)',
        'rgb(249, 115, 22)',
        'rgb(239, 68, 68)',
      ],
      borderWidth: 2
    }
  ]
};

const poAchievementData = {
  labels: ['PO1', 'PO2', 'PO3', 'PO4', 'PO5'],
  datasets: [
    {
      label: 'Achievement (%)',
      data: [90, 88, 85, 87, 82],
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

const coursePerformanceData = {
  labels: currentCourses.map(c => c.code),
  datasets: [
    {
      label: 'Average Grade (%)',
      data: currentCourses.map(c => c.avgGrade),
      backgroundColor: currentCourses.map(c => 
        c.avgGrade >= 85 ? 'rgba(16, 185, 129, 0.8)' : 
        c.avgGrade >= 80 ? 'rgba(59, 130, 246, 0.8)' : 
        'rgba(251, 191, 36, 0.8)'
      ),
      borderColor: currentCourses.map(c => 
        c.avgGrade >= 85 ? 'rgb(16, 185, 129)' : 
        c.avgGrade >= 80 ? 'rgb(59, 130, 246)' : 
        'rgb(251, 191, 36)'
      ),
      borderWidth: 2
    }
  ]
};

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
  
  useEffect(() => {
    setMounted(true);
  }, []);

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
  
  const whiteTextClass = text;
  const accentIconClass = isDark ? 'text-indigo-400' : 'text-indigo-600';
  const secondaryTextClass = mutedText;

  const dynamicBarOptions = barOptions(isDark, secondaryTextClass);
  const dynamicLineOptions = lineOptions(isDark, secondaryTextClass);
  const dynamicDoughnutOptions = doughnutOptions(isDark, secondaryTextClass);

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Header */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-4 mb-8"
        >
            <div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                    Welcome back, {teacherInfo.name.split(' ')[0]}
                </h1>
                <p className={`${secondaryTextClass} text-sm mt-1`}>
                    {teacherInfo.department} • {teacherInfo.totalCourses} Courses • {teacherInfo.totalStudents} Students
                </p>
            </div>
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
                                {stat.change}
                            </div>
                        </div>
                        <h3 className={`${secondaryTextClass} text-sm mb-1`}>{stat.title}</h3>
                        <p className={`text-3xl font-bold ${whiteTextClass}`}>{stat.value}</p>
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
                        <Bar data={coursePerformanceData} options={dynamicBarOptions} />
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
                        <Line data={poAchievementData} options={dynamicLineOptions} />
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
                        {currentCourses.map((course, index) => (
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
                                            <span>•</span>
                                            <span>Avg Grade: {course.avgGrade}%</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className={`${mutedText}`}>PO Achievement</span>
                                        <span className={`font-semibold ${whiteTextClass}`}>{course.poAchievement}%</span>
                                    </div>
                                    <div className={`h-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.poAchievement}%` }}
                                            transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                                            style={{
                                                backgroundImage: `linear-gradient(to right, 
                                                    ${course.poAchievement >= 90 ? '#10B981' : '#3B82F6'}, 
                                                    ${course.poAchievement >= 90 ? '#059669' : '#06B6D4'}
                                                )` 
                                            }}
                                            className="h-full rounded-full"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Sağ Sütun (Grade Distribution ve Recent Activities) */}
            <div className="space-y-6">

                {/* Grade Distribution Doughnut Chart */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-96`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <Award className={`w-5 h-5 ${accentIconClass}`} />
                        Grade Distribution
                    </h2>
                    <div className="h-72">
                        <Doughnut data={gradeDistributionData} options={dynamicDoughnutOptions} />
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
                        {recentActivities.map((activity, index) => {
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
                        })}
                    </div>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4`}>Quick Stats</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className={`${secondaryTextClass} text-sm`}>Pending Grading</span>
                            <span className={`font-semibold ${whiteTextClass}`}>12</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`${secondaryTextClass} text-sm`}>Upcoming Deadlines</span>
                            <span className={`font-semibold ${whiteTextClass}`}>3</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`${secondaryTextClass} text-sm`}>Student Inquiries</span>
                            <span className={`font-semibold ${whiteTextClass}`}>5</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`${secondaryTextClass} text-sm`}>Avg Response Time</span>
                            <span className={`font-semibold text-green-500`}>2.5h</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    </motion.div>
  );
}

