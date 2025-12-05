// app/student/course-analytics/page.tsx
'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BookOpen, User, Calendar, BarChart3, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import Link from 'next/link';
import { api, type Enrollment, type Course } from '@/lib/api';

// --- YARDIMCI FONKSİYONLAR ve Sabitler ---

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

interface CourseAnalyticsCard {
    courseId: number;
    courseCode: string;
    courseName: string;
    instructor: string;
    semester: string;
    classAverage: number;
    userScore: number | null;
    trend: 'up' | 'down' | 'neutral';
}

// --- ANA BİLEŞEN: COURSE ANALYTICS OVERVIEW PAGE ---

export default function CourseAnalyticsPage() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [courses, setCourses] = useState<CourseAnalyticsCard[]>([]);

    const { isDark, themeClasses, text, mutedText } = useThemeColors();

    useEffect(() => {
        setMounted(true);
        fetchCourseAnalytics();
    }, []);

    const fetchCourseAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch course analytics from backend
            const response = await api.getCourseAnalytics();

            if (response.success && response.courses) {
                const courseAnalytics: CourseAnalyticsCard[] = response.courses.map(course => ({
                    courseId: course.course_id,
                    courseCode: course.course_code,
                    courseName: course.course_name,
                    instructor: course.instructor,
                    semester: course.semester,
                    classAverage: course.class_average,
                    userScore: course.user_score,
                    trend: course.trend
                }));

                setCourses(courseAnalytics);
            } else {
                setCourses([]);
            }
        } catch (err: any) {
            console.error('Failed to fetch course analytics:', err);
            setError(err.message || 'Failed to load course analytics');
            setCourses([]);
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
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className={`text-center p-6 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                    <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
                    <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error}</p>
                    <button
                        onClick={fetchCourseAnalytics}
                        className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'down':
                return <TrendingDown className="w-4 h-4 text-red-500" />;
            default:
                return <Minus className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className={`container mx-auto py-0`}>
            {/* Başlık */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center mb-6 border-b pb-4 border-gray-500/20"
            >
                <h1 className={`text-3xl font-bold ${whiteText} flex items-center gap-3`}>
                    <BarChart3 className="w-7 h-7 text-indigo-500" />
                    Course Analytics
                </h1>
            </motion.div>

            {/* Course Cards Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {courses.map((course) => (
                    <Link key={course.courseId} href={`/student/course-analytics/${course.courseId}`}>
                        <motion.div
                            variants={item}
                            className={`${themeClasses.card} p-6 shadow-xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} hover:shadow-2xl transition-all duration-300 cursor-pointer group`}
                        >
                            {/* Course Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className={`text-xl font-bold ${whiteText} mb-1`}>
                                        {course.courseCode}
                                    </h3>
                                    <p className={`text-sm ${mutedText} line-clamp-2`}>
                                        {course.courseName}
                                    </p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* Course Info */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-indigo-500" />
                                    <span className={mutedText}>{course.instructor}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-indigo-500" />
                                    <span className={mutedText}>{course.semester}</span>
                                </div>
                            </div>

                            {/* Analytics Stats */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-500/20">
                                <div>
                                    <p className={`text-xs ${mutedText} mb-1`}>Class Average</p>
                                    <p className={`text-lg font-semibold ${whiteText}`}>
                                        {course.classAverage > 0 ? course.classAverage.toFixed(1) : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-xs ${mutedText} mb-1`}>Your Score</p>
                                    <p className={`text-lg font-semibold ${whiteText}`}>
                                        {course.userScore !== null ? course.userScore.toFixed(1) : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-xs ${mutedText} mb-1`}>Trend</p>
                                    <div className="flex items-center">
                                        {getTrendIcon(course.trend)}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </motion.div>

            {/* Empty State */}
            {courses.length === 0 && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                >
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className={mutedText}>No course analytics available</p>
                </motion.div>
            )}
        </div>
    );
}

