// app/student/analytics/page.tsx
'use client';

import { motion } from 'framer-motion';
import { BarChart, TrendingUp, DollarSign, Clock, UserCheck, Loader2, AlertTriangle, Award, BookOpen, Trophy, Users } from 'lucide-react';
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
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { api, type Enrollment, type StudentGrade, type Assessment, type Course, type DashboardData } from '@/lib/api';

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
  Filler
);

// --- YARDIMCI FONKSİYONLAR ve Sabitler ---

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

// ------------------------------------
// Grafik Verisi Hazırlama
// ------------------------------------

// 1. GPA Trend Grafiği (Line Chart)
const getGpaTrendData = (gpaHistory: Array<{ semester: string; gpa: number }>, isDark: boolean, projectedGpa?: number) => {
    const hasData = gpaHistory.length > 0;
    const labels = hasData 
      ? (projectedGpa !== undefined ? [...gpaHistory.map(h => h.semester), 'Projected'] : gpaHistory.map(h => h.semester))
      : [];
    const data = hasData
      ? (projectedGpa !== undefined ? [...gpaHistory.map(h => h.gpa), projectedGpa] : gpaHistory.map(h => h.gpa))
      : [];

    return {
        labels: labels,
        datasets: [
            {
                label: 'Semester GPA & Projection',
                data: data,
                fill: 'start',
                backgroundColor: (context: any) => { // Düzeltme burada
                    const isProjected = context.dataIndex === data.length - 1;
                    const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
                    if (isProjected) {
                         gradient.addColorStop(0, 'rgba(255, 165, 0, 0.5)'); 
                         gradient.addColorStop(1, 'rgba(255, 165, 0, 0.1)');
                    } else {
                         gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)'); 
                         gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
                    }
                    return gradient;
                },
                borderColor: isDark ? 'rgb(16, 185, 129)' : 'rgb(16, 185, 129)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: (context: any) => context.dataIndex === data.length - 1 ? 'rgb(255, 165, 0)' : 'rgb(16, 185, 129)', // Düzeltme burada
                pointRadius: 6,
                pointHoverRadius: 8,
            }
        ]
    };
};

// 2. Kategori Başarı Grafiği (Bar Chart)
const getCategorySuccessData = (categorySuccess: Array<{ category: string; averageGrade: number }>, isDark: boolean) => {
    const hasData = categorySuccess.length > 0;
    return {
        labels: hasData ? categorySuccess.map(c => c.category) : [],
        datasets: [{
            label: 'Average GPA',
            data: hasData ? categorySuccess.map(c => c.averageGrade) : [],
            backgroundColor: isDark ? '#6366F1' : '#4F46E5', 
            borderColor: isDark ? '#4F46E5' : '#4338CA',
            borderWidth: 1
        }]
    };
};


// ------------------------------------
// Chart Opsiyonları (Aynı kalır)
// ------------------------------------

const commonChartOptions = (isDark: boolean, mutedText: string) => ({
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
            min: 3.0,
            max: 4.0,
            title: { display: true, text: 'GPA', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText, stepSize: 0.25 }
        },
        x: {
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText }
        }
    }
});

const barChartOptions = (isDark: boolean, mutedText: string) => ({
    ...commonChartOptions(isDark, mutedText),
    scales: {
        y: { ...commonChartOptions(isDark, mutedText).scales.y, max: 4.0 },
        x: { ...commonChartOptions(isDark, mutedText).scales.x },
    }
});


// --- ANA BİLEŞEN: ANALYTICS PAGE ---

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all required data
      let dashboard: DashboardData | null = null;
      let enrollmentsData: Enrollment[] = [];
      let gradesData: StudentGrade[] = [];
      let assessmentsData: Assessment[] = [];
      let coursesData: Course[] = [];

      try {
        [dashboard, enrollmentsData, gradesData, assessmentsData, coursesData] = await Promise.all([
          api.getStudentDashboard(),
          api.getEnrollments(),
          api.getGrades(),
          api.getAssessments(),
          api.getCourses()
        ]);
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        // If API fails, show empty state
        if (apiError.message?.includes('500')) {
          setLoading(false);
          return;
        }
        // For other errors, continue with empty arrays
      }

      // Ensure all responses are arrays (defensive programming)
      enrollmentsData = Array.isArray(enrollmentsData) ? enrollmentsData : [];
      gradesData = Array.isArray(gradesData) ? gradesData : [];
      assessmentsData = Array.isArray(assessmentsData) ? assessmentsData : [];
      coursesData = Array.isArray(coursesData) ? coursesData : [];

      setDashboardData(dashboard);
      setEnrollments(enrollmentsData);
      setGrades(gradesData);
      setAssessments(assessmentsData);
      setCourses(coursesData);
    } catch (err: any) {
      console.error('Failed to fetch analytics data:', err);
      if (err.message?.includes('404') || err.message?.includes('No')) {
        // No data, show empty state
      } else {
        setError(err.message || 'Failed to load analytics data');
      }
    } finally {
      setLoading(false);
    }
  };

  const { isDark, themeClasses, text, mutedText } = useThemeColors(); 

  if (!mounted) {
    return null;
  }
  
  const whiteText = text;

  // Calculate GPA history from completed enrollments
  const completedEnrollments = enrollments.filter(e => !e.is_active && e.final_grade !== null && e.final_grade !== undefined);
  const gpaHistory = completedEnrollments.length > 0
    ? completedEnrollments.map((e, index) => {
        const course = courses.find(c => c.id === e.course);
        // Use course semester/year or enrollment date
        const semester = course 
          ? `${course.semester_display || course.semester || ''} ${course.academic_year || ''}`.trim() || `Semester ${index + 1}`
          : `Semester ${index + 1}`;
        return {
          semester: semester,
          gpa: e.final_grade ? e.final_grade / 100 * 4 : 0 // Convert to 4.0 scale
        };
      }).slice(-5) // Last 5 semesters
    : [];

  // Calculate average GPA by course category (based on course code prefix)
  const categoryGrades: Record<string, number[]> = {};
  enrollments.forEach(enrollment => {
    const course = courses.find(c => c.id === enrollment.course);
    if (course && enrollment.final_grade !== null && enrollment.final_grade !== undefined) {
      // Extract category from course code (e.g., CS301 -> CS, SE405 -> SE)
      const category = course.code ? course.code.match(/^[A-Z]+/)?.[0] || 'Other' : 'Other';
      if (!categoryGrades[category]) {
        categoryGrades[category] = [];
      }
      categoryGrades[category].push(enrollment.final_grade / 100 * 4);
    }
  });

  const categorySuccess = Object.entries(categoryGrades).map(([category, grades]) => ({
    category: category,
    averageGrade: grades.length > 0 ? grades.reduce((sum, g) => sum + g, 0) / grades.length : 0
  }));

  // Calculate projections
  // Backend now returns GPA on 4.0 scale
  const currentCGPA = dashboardData?.overall_gpa || 0;
  const totalCredits = dashboardData?.total_credits || 0;
  const completedCourses = dashboardData?.completed_courses || 0;
  
  // Project future GPA (simple linear projection)
  const projectedFinalCGPA = gpaHistory.length >= 2
    ? (() => {
        const recentGPA = gpaHistory[gpaHistory.length - 1].gpa;
        const previousGPA = gpaHistory[gpaHistory.length - 2].gpa;
        const trend = recentGPA - previousGPA;
        return Math.min(4.0, Math.max(0, currentCGPA + trend * 2)); // Project 2 semesters ahead
      })()
    : currentCGPA;

  const isProjectedExcellent = projectedFinalCGPA >= 3.75;

  // Get student ranking from dashboard data
  const studentRanking = dashboardData?.gpa_ranking || null;

  // Prepare chart data
  const dynamicLineOptions = commonChartOptions(isDark, mutedText);
  const dynamicBarOptions = barChartOptions(isDark, mutedText);
  const gpaTrendChartData = getGpaTrendData(gpaHistory, isDark, projectedFinalCGPA);
  const categorySuccessChartData = getCategorySuccessData(categorySuccess, isDark);


  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={mutedText}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`text-center p-6 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto py-0`}>
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center mb-6 border-b pb-4 border-gray-500/20"
      >
        <h1 className={`text-3xl font-bold ${whiteText} flex items-center gap-3`}>
          <BarChart className="w-7 h-7 text-indigo-500" />
          Detailed Performance Analytics
        </h1>
      </motion.div>

      {/* Genel Projeksiyon Kartları */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {/* Mevcut CGPA */}
        <motion.div variants={item} className={`${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} text-center`}>
            <p className={mutedText}>Current CGPA</p>
            <p className={`text-4xl font-extrabold ${whiteText} mt-2`}>
              {currentCGPA > 0 ? currentCGPA.toFixed(2) : '-'}
            </p>
        </motion.div>
        
        {/* Tahmini Final CGPA */}
        <motion.div variants={item} className={`p-6 shadow-2xl rounded-xl border ${themeClasses.card} ${isProjectedExcellent ? 'border-green-500/30' : 'border-orange-500/30'} text-center`}>
            <p className={`${isProjectedExcellent ? 'text-green-500' : 'text-orange-500'} font-medium`}>Projected Final CGPA</p>
            <p className={`text-4xl font-extrabold ${whiteText} mt-2 flex justify-center items-center gap-2`}>
                <UserCheck className="w-6 h-6" /> {projectedFinalCGPA > 0 ? projectedFinalCGPA.toFixed(2) : '-'}
            </p>
        </motion.div>

        {/* Completed Courses */}
        <motion.div variants={item} className={`${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} text-center`}>
            <p className={mutedText}>Completed Courses</p>
            <p className={`text-4xl font-extrabold ${whiteText} mt-2 flex justify-center items-center gap-2`}>
                <Award className="w-6 h-6 text-blue-500" /> {completedCourses > 0 ? completedCourses : '-'}
            </p>
        </motion.div>

        {/* Student Ranking (Anonymous) */}
        <motion.div 
          variants={item} 
          className={`${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-yellow-500/30' : 'border-yellow-300'} text-center`}
        >
            <p className={`${mutedText} flex items-center justify-center gap-2`}>
              <Trophy className="w-4 h-4 text-yellow-500" />
              GPA Ranking
            </p>
            {studentRanking ? (
              <>
                <p className={`text-4xl font-extrabold ${whiteText} mt-2 flex justify-center items-center gap-2`}>
                  <span className="text-yellow-500">#{studentRanking.rank}</span>
                </p>
                <p className={`text-sm ${mutedText} mt-1`}>
                  Top {studentRanking.percentile}% • {studentRanking.totalStudents} students
                </p>
              </>
            ) : (
              <p className={`text-4xl font-extrabold ${whiteText} mt-2`}>-</p>
            )}
        </motion.div>
      </motion.div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sol Sütun: GPA Trend ve Projeksiyon */}
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`lg:col-span-2 backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-[450px] rounded-xl`}
        >
            <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                <TrendingUp className={`w-5 h-5 text-green-500`} />
                Historical GPA Trend & Future Projection
            </h2>
            <div className="h-[350px]">
                {gpaHistory.length > 0 ? (
                  <Line data={gpaTrendChartData} options={dynamicLineOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className={mutedText}>No GPA history available</p>
                  </div>
                )}
            </div>
        </motion.div>

        {/* Sağ Sütun: Kategori Başarısı */}
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-[450px] rounded-xl`}
        >
            <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                <BookOpen className={`w-5 h-5 text-yellow-500`} />
                Average Performance by Department
            </h2>
            <div className="h-[350px]">
                {categorySuccess.length > 0 ? (
                  <Bar data={categorySuccessChartData} options={dynamicBarOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className={mutedText}>No department data available</p>
                  </div>
                )}
            </div>
        </motion.div>
      </div>

    </div>
  );
}