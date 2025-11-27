// app/teacher/analytics/page.tsx
'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Target, Award, BookOpen, AlertTriangle, CheckCircle2, ArrowUpRight, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend, 
    PointElement, 
    LineElement,
    Filler,
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Chart.js'i gerekli elemanlarla kaydetme
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement, 
  LineElement,
  Filler,
  ArcElement
);

// --- MOCK VERİLER (Teacher Analytics) ---

const teacherAnalyticsData = {
    coursePerformance: [
        { course: 'CS301', avgGrade: 85.2, students: 32, poAchievement: 90, trend: 'up' },
        { course: 'SE405', avgGrade: 80.5, students: 28, poAchievement: 85, trend: 'up' },
        { course: 'CS201', avgGrade: 78.8, students: 45, poAchievement: 82, trend: 'stable' },
        { course: 'CS401', avgGrade: 88.5, students: 20, poAchievement: 92, trend: 'up' },
    ],
    semesterTrend: [
        { semester: 'F23', avgGrade: 78.5, poAchievement: 82, students: 110 },
        { semester: 'S24', avgGrade: 80.2, poAchievement: 84, students: 115 },
        { semester: 'F24', avgGrade: 81.8, poAchievement: 85, students: 120 },
        { semester: 'S25', avgGrade: 82.5, poAchievement: 86, students: 122 },
        { semester: 'F25', avgGrade: 83.2, poAchievement: 87, students: 125 },
    ],
    poBreakdown: [
        { po: 'PO1', achievement: 90, target: 85, status: 'excellent' },
        { po: 'PO2', achievement: 88, target: 80, status: 'excellent' },
        { po: 'PO3', achievement: 85, target: 75, status: 'achieved' },
        { po: 'PO4', achievement: 87, target: 80, status: 'achieved' },
        { po: 'PO5', achievement: 82, target: 75, status: 'achieved' },
    ],
    gradeDistribution: {
        excellent: 45, // A (90-100)
        good: 52,       // B (80-89)
        average: 20,    // C (70-79)
        below: 6,       // D (60-69)
        fail: 2         // F (<60)
    },
    studentEngagement: {
        avgResponseTime: 2.5, // hours
        feedbackGiven: 95,   // percentage
        officeHours: 8,      // hours per week
        studentSatisfaction: 4.6 // out of 5
    }
};

// --- YARDIMCI FONKSİYONLAR ---

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

// 1. Semester Trend Grafiği (Line Chart)
const getSemesterTrendData = (semesterTrend: typeof teacherAnalyticsData.semesterTrend, isDark: boolean) => {
    return {
        labels: semesterTrend.map(s => s.semester),
        datasets: [
            {
                label: 'Average Grade (%)',
                data: semesterTrend.map(s => s.avgGrade),
                fill: 'start',
                backgroundColor: (context: any) => {
                    const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)'); 
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
                    return gradient;
                },
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: 'rgb(16, 185, 129)',
                pointRadius: 6,
                pointHoverRadius: 8,
            },
            {
                label: 'PO Achievement (%)',
                data: semesterTrend.map(s => s.poAchievement),
                fill: 'start',
                backgroundColor: (context: any) => {
                    const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)'); 
                    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');
                    return gradient;
                },
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: 'rgb(99, 102, 241)',
                pointRadius: 6,
                pointHoverRadius: 8,
            }
        ]
    };
};

// 2. Course Performance Bar Chart
const getCoursePerformanceData = (coursePerformance: typeof teacherAnalyticsData.coursePerformance, isDark: boolean) => {
    return {
        labels: coursePerformance.map(c => c.course),
        datasets: [
            {
                label: 'Average Grade (%)',
                data: coursePerformance.map(c => c.avgGrade),
                backgroundColor: coursePerformance.map(c => 
                    c.avgGrade >= 85 ? 'rgba(16, 185, 129, 0.8)' : 
                    c.avgGrade >= 80 ? 'rgba(59, 130, 246, 0.8)' : 
                    'rgba(251, 191, 36, 0.8)'
                ),
                borderColor: coursePerformance.map(c => 
                    c.avgGrade >= 85 ? 'rgb(16, 185, 129)' : 
                    c.avgGrade >= 80 ? 'rgb(59, 130, 246)' : 
                    'rgb(251, 191, 36)'
                ),
                borderWidth: 2
            }
        ]
    };
};

// 3. PO Breakdown Bar Chart
const getPOBreakdownData = (poBreakdown: typeof teacherAnalyticsData.poBreakdown, isDark: boolean) => {
    return {
        labels: poBreakdown.map(p => p.po),
        datasets: [
            {
                label: 'Achievement (%)',
                data: poBreakdown.map(p => p.achievement),
                backgroundColor: poBreakdown.map(p => 
                    p.status === 'excellent' ? 'rgba(16, 185, 129, 0.8)' : 
                    'rgba(59, 130, 246, 0.8)'
                ),
                borderColor: poBreakdown.map(p => 
                    p.status === 'excellent' ? 'rgb(16, 185, 129)' : 
                    'rgb(59, 130, 246)'
                ),
                borderWidth: 2
            },
            {
                label: 'Target (%)',
                data: poBreakdown.map(p => p.target),
                backgroundColor: 'rgba(156, 163, 175, 0.5)',
                borderColor: 'rgb(156, 163, 175)',
                borderWidth: 2,
                borderDash: [5, 5]
            }
        ]
    };
};

// 4. Grade Distribution Doughnut
const getGradeDistributionData = (gradeDistribution: typeof teacherAnalyticsData.gradeDistribution, isDark: boolean) => {
    return {
        labels: ['Excellent (A)', 'Good (B)', 'Average (C)', 'Below (D)', 'Fail (F)'],
        datasets: [
            {
                label: 'Students',
                data: [
                    gradeDistribution.excellent,
                    gradeDistribution.good,
                    gradeDistribution.average,
                    gradeDistribution.below,
                    gradeDistribution.fail
                ],
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
};

// --- CHART OPTIONS ---

const lineChartOptions = (isDark: boolean, mutedText: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { 
            labels: { color: mutedText, boxWidth: 12, boxHeight: 12 },
            position: 'top' as const
        },
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
            title: { display: true, text: 'Percentage (%)', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText, stepSize: 10 }
        },
        x: {
            title: { display: true, text: 'Semester', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText }
        }
    }
});

const barChartOptions = (isDark: boolean, mutedText: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { 
            labels: { color: mutedText, boxWidth: 12, boxHeight: 12 },
            position: 'top' as const
        },
        tooltip: {
            bodyColor: isDark ? '#FFF' : '#000',
            titleColor: isDark ? '#FFF' : '#000',
            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Percentage (%)', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText, stepSize: 20 }
        },
        x: {
            grid: { display: false },
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

// --- ANA BİLEŞEN ---

export default function TeacherAnalyticsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { 
    isDark, 
    mounted: themeMounted, 
    themeClasses, 
    text, 
    mutedText 
  } = useThemeColors(); 

  if (!mounted || !themeMounted) {
    return null;
  }
  
  const whiteText = text;
  const accentIconClass = isDark ? 'text-indigo-400' : 'text-indigo-600';

  const dynamicLineOptions = lineChartOptions(isDark, mutedText);
  const dynamicBarOptions = barChartOptions(isDark, mutedText);
  const dynamicDoughnutOptions = doughnutOptions(isDark, mutedText);
  
  const semesterTrendChartData = getSemesterTrendData(teacherAnalyticsData.semesterTrend, isDark);
  const coursePerformanceChartData = getCoursePerformanceData(teacherAnalyticsData.coursePerformance, isDark);
  const poBreakdownChartData = getPOBreakdownData(teacherAnalyticsData.poBreakdown, isDark);
  const gradeDistributionChartData = getGradeDistributionData(teacherAnalyticsData.gradeDistribution, isDark);

  const totalStudents = teacherAnalyticsData.gradeDistribution.excellent + 
                        teacherAnalyticsData.gradeDistribution.good + 
                        teacherAnalyticsData.gradeDistribution.average + 
                        teacherAnalyticsData.gradeDistribution.below + 
                        teacherAnalyticsData.gradeDistribution.fail;

  return (
    <div className="container mx-auto py-0">
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 border-b pb-4 border-gray-500/20"
      >
        <h1 className={`text-3xl font-bold ${whiteText} flex items-center gap-3`}>
          <BarChart3 className="w-7 h-7 text-indigo-500" />
          Teaching Performance Analytics
        </h1>
      </motion.div>

      {/* Genel İstatistikler */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {/* Overall Average Grade */}
        <motion.div 
          variants={item} 
          className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className={mutedText}>Overall Avg Grade</p>
            <Award className="w-5 h-5 text-green-500" />
          </div>
          <p className={`text-4xl font-extrabold ${whiteText}`}>
            {teacherAnalyticsData.semesterTrend[teacherAnalyticsData.semesterTrend.length - 1].avgGrade}%
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm text-green-500">
            <ArrowUpRight className="w-4 h-4" />
            <span>+4.7% vs last year</span>
          </div>
        </motion.div>
        
        {/* Overall PO Achievement */}
        <motion.div 
          variants={item} 
          className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className={mutedText}>Overall PO Achievement</p>
            <Target className="w-5 h-5 text-indigo-500" />
          </div>
          <p className={`text-4xl font-extrabold ${whiteText}`}>
            {teacherAnalyticsData.semesterTrend[teacherAnalyticsData.semesterTrend.length - 1].poAchievement}%
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm text-green-500">
            <ArrowUpRight className="w-4 h-4" />
            <span>+5% vs last year</span>
          </div>
        </motion.div>

        {/* Total Students */}
        <motion.div 
          variants={item} 
          className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className={mutedText}>Total Students</p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className={`text-4xl font-extrabold ${whiteText}`}>
            {totalStudents}
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm text-blue-500">
            <ArrowUpRight className="w-4 h-4" />
            <span>+15 this semester</span>
          </div>
        </motion.div>
        
        {/* Student Satisfaction */}
        <motion.div 
          variants={item} 
          className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className={mutedText}>Student Satisfaction</p>
            <CheckCircle2 className="w-5 h-5 text-yellow-500" />
          </div>
          <p className={`text-4xl font-extrabold ${whiteText}`}>
            {teacherAnalyticsData.studentEngagement.studentSatisfaction}/5.0
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm text-green-500">
            <span>Excellent rating</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Ana Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Sol Sütun: Semester Trend */}
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`lg:col-span-2 backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-[450px] rounded-xl`}
        >
            <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                <TrendingUp className={`w-5 h-5 text-green-500`} />
                Semester Performance Trend
            </h2>
            <div className="h-[350px]">
                <Line data={semesterTrendChartData} options={dynamicLineOptions} />
            </div>
        </motion.div>

        {/* Sağ Sütun: Grade Distribution */}
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-[450px] rounded-xl`}
        >
            <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                <Award className={`w-5 h-5 ${accentIconClass}`} />
                Grade Distribution
            </h2>
            <div className="h-[350px]">
                <Doughnut data={gradeDistributionChartData} options={dynamicDoughnutOptions} />
            </div>
        </motion.div>
      </div>

      {/* İkinci Satır Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Course Performance */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-[400px] rounded-xl`}
        >
            <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                <BookOpen className={`w-5 h-5 ${accentIconClass}`} />
                Course Performance Comparison
            </h2>
            <div className="h-[300px]">
                <Bar data={coursePerformanceChartData} options={dynamicBarOptions} />
            </div>
        </motion.div>

        {/* PO Breakdown */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-[400px] rounded-xl`}
        >
            <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                <Target className={`w-5 h-5 ${accentIconClass}`} />
                Learning Outcomes Breakdown
            </h2>
            <div className="h-[300px]">
                <Bar data={poBreakdownChartData} options={dynamicBarOptions} />
            </div>
        </motion.div>
      </div>

      {/* Engagement Metrics */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl mb-6`}
      >
          <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
              <Users className={`w-5 h-5 ${accentIconClass}`} />
              Student Engagement Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`${mutedText} text-sm mb-1`}>Avg Response Time</p>
                  <p className={`text-2xl font-bold ${whiteText}`}>
                      {teacherAnalyticsData.studentEngagement.avgResponseTime}h
                  </p>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`${mutedText} text-sm mb-1`}>Feedback Given</p>
                  <p className={`text-2xl font-bold ${whiteText}`}>
                      {teacherAnalyticsData.studentEngagement.feedbackGiven}%
                  </p>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`${mutedText} text-sm mb-1`}>Office Hours/Week</p>
                  <p className={`text-2xl font-bold ${whiteText}`}>
                      {teacherAnalyticsData.studentEngagement.officeHours}h
                  </p>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`${mutedText} text-sm mb-1`}>Satisfaction</p>
                  <p className={`text-2xl font-bold ${whiteText}`}>
                      {teacherAnalyticsData.studentEngagement.studentSatisfaction}/5.0
                  </p>
              </div>
          </div>
      </motion.div>

      {/* Analiz Yorumları */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`p-6 rounded-xl border-l-4 border-indigo-500 ${isDark ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-indigo-500/5'}`}
      >
          <h3 className={`font-semibold text-indigo-400 mb-2 flex items-center gap-2`}>
              <CheckCircle2 className='w-5 h-5' /> Key Insights & Recommendations
          </h3>
          <ul className={`${mutedText} list-disc ml-5 text-sm space-y-1`}>
              <li><strong>Performance Trend:</strong> Your teaching performance has shown consistent improvement over the past 5 semesters. Both average grades and PO achievement have increased steadily, indicating effective teaching methodologies.</li>
              <li><strong>Course Excellence:</strong> CS401 and CS301 are performing exceptionally well with PO achievements above 90%. Consider sharing best practices from these courses with other courses.</li>
              <li><strong>PO Achievement:</strong> PO1 and PO2 are exceeding targets significantly. PO3, PO4, and PO5 are meeting targets but could benefit from additional focus areas in course design.</li>
              <li><strong>Student Engagement:</strong> Your high student satisfaction rating (4.6/5.0) and quick response time (2.5h) demonstrate excellent student-teacher communication. Maintain this level of engagement.</li>
              <li><strong>Recommendation:</strong> Continue the current teaching approach while focusing on strengthening PO3-PO5 through additional practical assignments and real-world project integration.</li>
          </ul>
      </motion.div>
    </div>
  );
}

