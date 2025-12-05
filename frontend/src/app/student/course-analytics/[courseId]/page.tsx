// app/student/course-analytics/[courseId]/page.tsx
'use client';

import { motion } from 'framer-motion';
import { 
    BarChart3, ArrowLeft, Users, TrendingUp, Award, Target, 
    Filter, Loader2, AlertTriangle, BookOpen, User, Calendar, 
    Repeat, GraduationCap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { api, type Course, type Assessment, type StudentGrade } from '@/lib/api';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
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

interface CourseAnalyticsData {
    classAverage: number;
    classMedian: number;
    classSize: number;
    highestScore: number;
    lowestScore: number;
    userScore: number | null;
    scoreDistribution: number[];
    boxplotData: {
        min: number;
        q1: number;
        median: number;
        q3: number;
        max: number;
    };
}

interface FilterOptions {
    instructor: string;
    section: string;
    attempt: 'first' | 'retake' | 'all';
    semester: string;
}

// --- ANA BİLEŞEN: COURSE DETAIL ANALYTICS PAGE ---

export default function CourseDetailAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params?.courseId ? parseInt(params.courseId as string) : null;
    
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [analytics, setAnalytics] = useState<CourseAnalyticsData | null>(null);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [grades, setGrades] = useState<StudentGrade[]>([]);
    const [filters, setFilters] = useState<FilterOptions>({
        instructor: 'all',
        section: 'all',
        attempt: 'all',
        semester: 'all'
    });

    const { isDark, themeClasses, text, mutedText } = useThemeColors();

    useEffect(() => {
        setMounted(true);
        if (courseId) {
            fetchCourseDetail();
        }
    }, [courseId, filters]);

    const fetchCourseDetail = async () => {
        if (!courseId) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch all data in parallel
            const [analyticsResponse, assessmentsData, gradesData] = await Promise.allSettled([
                api.getCourseAnalyticsDetail(courseId),
                api.getAssessments({ course: courseId }),
                api.getGrades()
            ]);

            // Handle analytics response
            if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value.success) {
                const response = analyticsResponse.value;
                setCourse({
                    id: response.course.id,
                    code: response.course.code,
                    name: response.course.name,
                    description: '',
                    credits: 0,
                    semester: 0,
                    semester_display: response.course.semester,
                    academic_year: '',
                    department: '',
                    teacher: 0,
                    teacher_name: response.course.instructor
                });

                const analyticsData: CourseAnalyticsData = {
                    classAverage: response.analytics.class_average,
                    classMedian: response.analytics.class_median,
                    classSize: response.analytics.class_size,
                    highestScore: response.analytics.highest_score,
                    lowestScore: response.analytics.lowest_score,
                    userScore: response.analytics.user_score,
                    scoreDistribution: response.analytics.score_distribution,
                    boxplotData: response.analytics.boxplot_data
                };

                setAnalytics(analyticsData);
            } else {
                setError('Failed to load course analytics');
            }

            // Handle assessments
            let assessmentsArray: Assessment[] = [];
            if (assessmentsData.status === 'fulfilled') {
                assessmentsArray = Array.isArray(assessmentsData.value) ? assessmentsData.value : [];
                setAssessments(assessmentsArray);
            }

            // Handle grades
            if (gradesData.status === 'fulfilled') {
                const gradesArray = Array.isArray(gradesData.value) ? gradesData.value : [];
                // Filter grades for this course - match by assessment IDs from this course
                const courseAssessmentIds = new Set(assessmentsArray.map(a => a.id));
                const courseGrades = gradesArray.filter(grade => 
                    courseAssessmentIds.has(grade.assessment)
                );
                setGrades(courseGrades);
            }
        } catch (err: any) {
            console.error('Failed to fetch course analytics:', err);
            setError(err.message || 'Failed to load course analytics');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) {
        return null;
    }

    const whiteText = text;

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
                    <p className={mutedText}>Loading course analytics...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !course) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className={`text-center p-6 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                    <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
                    <p className={isDark ? 'text-red-300' : 'text-red-700'}>
                        {error || 'Course not found'}
                    </p>
                    <Link
                        href="/student/course-analytics"
                        className="mt-4 inline-block px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                        Back to Course Analytics
                    </Link>
                </div>
            </div>
        );
    }

    // Chart options matching existing theme
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                labels: { 
                    color: mutedText, 
                    boxWidth: 10, 
                    boxHeight: 10 
                } 
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
                grid: { 
                    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' 
                },
                ticks: { color: mutedText }
            },
            x: {
                grid: { 
                    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' 
                },
                ticks: { color: mutedText }
            }
        }
    };

    // Prepare chart data
    const scoreDistributionData = analytics ? {
        labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
        datasets: [{
            label: 'Number of Students',
            data: analytics.scoreDistribution,
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.4)',
            borderColor: isDark ? 'rgb(99, 102, 241)' : 'rgb(79, 70, 229)',
            borderWidth: 1
        }]
    } : null;


    return (
        <div className={`container mx-auto py-0 space-y-10`}>
            {/* (A) Header Section - Glass Panel Style */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${isDark ? 'bg-white/5 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} p-6 mb-8`}
            >
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/student/course-analytics"
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-indigo-500" />
                        </Link>
                        <div>
                            <h1 className={`text-3xl font-bold tracking-tight ${whiteText} flex items-center gap-3 mb-2`}>
                                <BarChart3 className="w-7 h-7 text-indigo-500" />
                                {course.code}: {course.name}
                            </h1>
                            <p className={`text-sm ${mutedText}`}>
                                {course.semester_display} {course.academic_year}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters - Clean Dropdowns */}
                <div className="flex items-center gap-4 flex-wrap pt-4 border-t border-gray-500/20">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-indigo-500 opacity-60" />
                        <span className={`text-sm font-medium ${mutedText}`}>Filters:</span>
                    </div>
                    
                    <select
                        value={filters.instructor}
                        onChange={(e) => setFilters({ ...filters, instructor: e.target.value })}
                        className={`px-4 py-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                    >
                        <option value="all">All Instructors</option>
                        <option value={course.teacher_name}>{course.teacher_name}</option>
                    </select>

                    <select
                        value={filters.section}
                        onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                        className={`px-4 py-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                    >
                        <option value="all">All Sections</option>
                    </select>

                    <select
                        value={filters.attempt}
                        onChange={(e) => setFilters({ ...filters, attempt: e.target.value as 'first' | 'retake' | 'all' })}
                        className={`px-4 py-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                    >
                        <option value="all">All Attempts</option>
                        <option value="first">First Attempt</option>
                        <option value="retake">Retake</option>
                    </select>

                    <select
                        value={filters.semester}
                        onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                        className={`px-4 py-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                    >
                        <option value="all">All Semesters</option>
                        <option value={`${course.semester_display} ${course.academic_year}`}>
                            {course.semester_display} {course.academic_year}
                        </option>
                    </select>
                </div>
            </motion.div>

            {/* (B) Metric Cards Section - Two Rows */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                {/* Row 1: Primary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div variants={item} className={`${themeClasses.card} p-6 shadow-xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} relative`}>
                        <div className="absolute top-4 left-4 opacity-40">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="text-center mt-2">
                            <p className={`text-sm ${mutedText} mb-2`}>Class Average</p>
                            <p className={`text-3xl font-semibold ${whiteText}`}>
                                {analytics?.classAverage ? analytics.classAverage.toFixed(1) : '-'}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div variants={item} className={`${themeClasses.card} p-6 shadow-xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} relative`}>
                        <div className="absolute top-4 left-4 opacity-40">
                            <Users className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="text-center mt-2">
                            <p className={`text-sm ${mutedText} mb-2`}>Class Size</p>
                            <p className={`text-3xl font-semibold ${whiteText}`}>
                                {analytics?.classSize || '-'}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div variants={item} className={`${themeClasses.card} p-6 shadow-xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} relative`}>
                        <div className="absolute top-4 left-4 opacity-40">
                            <Award className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="text-center mt-2">
                            <p className={`text-sm ${mutedText} mb-2`}>Your Score</p>
                            <p className={`text-3xl font-semibold ${whiteText}`}>
                                {analytics?.userScore ? analytics.userScore.toFixed(1) : '-'}
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Row 2: Secondary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div variants={item} className={`${themeClasses.card} p-6 shadow-xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} relative`}>
                        <div className="absolute top-4 left-4 opacity-40">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-center mt-2">
                            <p className={`text-sm ${mutedText} mb-2`}>Highest Score</p>
                            <p className={`text-2xl font-semibold ${whiteText}`}>
                                {analytics?.highestScore ? analytics.highestScore.toFixed(1) : '-'}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div variants={item} className={`${themeClasses.card} p-6 shadow-xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} relative`}>
                        <div className="absolute top-4 left-4 opacity-40">
                            <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />
                        </div>
                        <div className="text-center mt-2">
                            <p className={`text-sm ${mutedText} mb-2`}>Lowest Score</p>
                            <p className={`text-2xl font-semibold ${whiteText}`}>
                                {analytics?.lowestScore ? analytics.lowestScore.toFixed(1) : '-'}
                            </p>
                        </div>
                    </motion.div>

                </div>
            </motion.div>

            {/* (C) Insights / Charts Section - Full-width Sections */}
            <div className="space-y-10">
                {/* Section 1: All Grades Table */}
                <motion.div
                    variants={item}
                    initial="hidden"
                    animate="show"
                    className={`${isDark ? 'bg-white/5' : 'bg-white/80'} backdrop-blur-lg rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} p-6`}
                >
                    <div className="mb-6">
                        <h3 className={`text-lg font-semibold ${whiteText} mb-2`}>All Your Grades</h3>
                        <p className={`text-sm ${mutedText}`}>
                            Detailed breakdown of all your assessments and grades for this course
                        </p>
                    </div>
                    {assessments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700/20">
                                <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                                    <tr>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${mutedText} uppercase tracking-wider`}>
                                            Assessment
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${mutedText} uppercase tracking-wider`}>
                                            Type
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${mutedText} uppercase tracking-wider`}>
                                            Your Score
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${mutedText} uppercase tracking-wider`}>
                                            Max Score
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${mutedText} uppercase tracking-wider`}>
                                            Weight
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${mutedText} uppercase tracking-wider`}>
                                            Feedback
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-200'}`}>
                                    {assessments.map((assessment) => {
                                        const grade = grades.find(g => g.assessment === assessment.id);
                                        
                                        return (
                                            <tr key={assessment.id} className="hover:bg-white/5 transition-colors">
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${whiteText}`}>
                                                    {assessment.title}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${mutedText}`}>
                                                    {assessment.type_display || assessment.assessment_type || '-'}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${whiteText}`}>
                                                    {grade ? grade.score : '-'}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${mutedText}`}>
                                                    {assessment.max_score}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${mutedText}`}>
                                                    {assessment.weight}%
                                                </td>
                                                <td className={`px-6 py-4 text-sm ${mutedText} max-w-xs truncate`}>
                                                    {grade?.feedback || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <p className={mutedText}>No assessments available for this course</p>
                        </div>
                    )}
                </motion.div>

                {/* Section 2: Score Distribution */}
                <motion.div
                    variants={item}
                    initial="hidden"
                    animate="show"
                    className={`${isDark ? 'bg-white/5' : 'bg-white/80'} backdrop-blur-lg rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} p-6`}
                >
                    <div className="mb-6">
                        <h3 className={`text-lg font-semibold ${whiteText} mb-2`}>Score Distribution</h3>
                        <p className={`text-sm ${mutedText}`}>
                            Distribution of final scores across all students in the class
                        </p>
                    </div>
                    {scoreDistributionData ? (
                        <div className="h-80">
                            <Bar data={scoreDistributionData} options={chartOptions} />
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center">
                            <p className={mutedText}>No distribution data available</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

