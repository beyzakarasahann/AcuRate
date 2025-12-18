// app/student/lo-outcomes/page.tsx
'use client';

import { motion } from 'framer-motion';
import { ListOrdered, Target, CheckCircle2, XCircle, TrendingUp, BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { api, TokenManager, type StudentLOAchievement, type LearningOutcome, type Enrollment } from '@/lib/api';

ChartJS.register(ArcElement, Tooltip, Legend);

interface LOData {
    code: string;
    title: string;
    description: string;
    target: number;
    current: number;
    status: 'Achieved' | 'Needs Attention' | 'Excellent';
    course: string;
    courseCode: string;
    loId: number;
}

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const doughnutOptions = (isDark: boolean) => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
        legend: { display: false },
        tooltip: {
            bodyColor: isDark ? '#FFF' : '#000',
            titleColor: isDark ? '#FFF' : '#000',
            backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
            padding: 12,
            cornerRadius: 8,
        }
    }
});

export default function LOOutcomesPage() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [learningOutcomesData, setLearningOutcomesData] = useState<LOData[]>([]);
    const { isDark, themeClasses, text, mutedText } = useThemeColors();
    const whiteText = text;

    useEffect(() => {
        setMounted(true);
        fetchLOData();
    }, []);

    const fetchLOData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!TokenManager.isAuthenticated() || !TokenManager.getAccessToken()) {
                setError('Please log in to view learning outcomes.');
                setLoading(false);
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return;
            }

            const startTime = performance.now();

            // Fetch only LO-related data in parallel
            const [loAchievementsResult, learningOutcomesResult, enrollmentsResult] = 
                await Promise.allSettled([
                    api.getLOAchievements(),
                    api.getLearningOutcomes(),
                    api.getEnrollments()
                ]);

            const fetchTime = performance.now() - startTime;

            let learningOutcomes: LearningOutcome[] = [];
            let loAchievements: StudentLOAchievement[] = [];
            let enrollments: Enrollment[] = [];

            if (learningOutcomesResult.status === 'fulfilled') {
                learningOutcomes = Array.isArray(learningOutcomesResult.value) ? learningOutcomesResult.value : [];
            } else {
                const err = learningOutcomesResult.reason;
                if (err?.message?.includes('401') || err?.message?.includes('Authentication')) {
                    TokenManager.clearTokens();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                    return;
                }
                if (err?.message?.includes('fetch') || err?.message?.includes('Network')) {
                    setError('Cannot connect to server. Please check if the backend is running.');
                }
            }

            if (loAchievementsResult.status === 'fulfilled') {
                loAchievements = Array.isArray(loAchievementsResult.value) ? loAchievementsResult.value : [];
            }

            if (enrollmentsResult.status === 'fulfilled') {
                enrollments = Array.isArray(enrollmentsResult.value) ? enrollmentsResult.value : [];
            }

            const processStartTime = performance.now();

            // Build maps for O(1) lookups
            const loAchievementMap = new Map<number, StudentLOAchievement>();
            loAchievements.forEach(a => {
                const loId = typeof a.learning_outcome === 'string' ? parseInt(a.learning_outcome) : a.learning_outcome;
                if (loId) loAchievementMap.set(loId, a);
            });

            // Build enrollment map - also handle course object format
            const enrollmentMap = new Map<number, Enrollment>();
            enrollments.forEach(e => {
                let courseId: number | null = null;
                if (typeof e.course === 'object' && e.course !== null) {
                    courseId = (e.course as any).id;
                } else if (typeof e.course === 'string') {
                    courseId = parseInt(e.course);
                } else if (typeof e.course === 'number') {
                    courseId = e.course;
                }
                if (courseId) enrollmentMap.set(courseId, e);
            });
            
            // Also build a course map from LO's course objects if available
            const courseMap = new Map<number, { code: string; name: string }>();
            learningOutcomes.forEach(lo => {
                if (typeof lo.course === 'object' && lo.course !== null) {
                    const courseObj = lo.course as any;
                    const courseId = courseObj.id;
                    if (courseId && !courseMap.has(courseId)) {
                        courseMap.set(courseId, {
                            code: courseObj.code || '',
                            name: courseObj.name || ''
                        });
                    }
                }
            });

            // Process LO data
            const loDataList: LOData[] = learningOutcomes.map(lo => {
                const loId = typeof lo.id === 'string' ? parseInt(lo.id) : lo.id;
                const achievement = loAchievementMap.get(loId);

                const achievementValue = achievement?.current_percentage ?? achievement?.achievement_percentage ?? 0;
                const current = achievement ? Number(achievementValue) : 0;
                const target = Number(lo.target_percentage);

                let status: 'Achieved' | 'Needs Attention' | 'Excellent';
                if (current >= target * 1.1) {
                    status = 'Excellent';
                } else if (current >= target) {
                    status = 'Achieved';
                } else {
                    status = 'Needs Attention';
                }

                const courseId = typeof lo.course === 'string' ? parseInt(lo.course) : 
                                 (typeof lo.course === 'object' && lo.course !== null) ? (lo.course as any).id : 
                                 lo.course;
                const enrollment = courseId ? enrollmentMap.get(courseId) : null;
                const courseFromMap = courseId ? courseMap.get(courseId) : null;

                // Get course info - prioritize enrollment, then course map, then LO's course info, then fallback
                const courseName = enrollment?.course_name || 
                                  courseFromMap?.name ||
                                  lo.course_name || 
                                  (typeof lo.course === 'object' && lo.course !== null ? (lo.course as any).name : null) ||
                                  'Unknown Course';
                const courseCode = enrollment?.course_code || 
                                   courseFromMap?.code ||
                                   lo.course_code || 
                                   (typeof lo.course === 'object' && lo.course !== null ? (lo.course as any).code : null) ||
                                   '';

                return {
                    code: lo.code,
                    title: lo.title,
                    description: lo.description,
                    target: target,
                    current: Math.round(current * 10) / 10,
                    status: status,
                    course: courseName,
                    courseCode: courseCode,
                    loId: lo.id
                };
            });

            const processTime = performance.now() - processStartTime;
            const totalTime = performance.now() - startTime;

            setLearningOutcomesData(loDataList);
            setLoading(false);
        } catch (err: any) {
            console.error('Failed to fetch LO data:', err);
            setLoading(false);
            setError(err.message || 'Failed to load learning outcomes');
            setLearningOutcomesData([]);
        }
    };

    const overallLOAchievement = useMemo(() => {
        if (learningOutcomesData.length === 0) return 0;
        return Math.round(learningOutcomesData.reduce((sum, lo) => sum + lo.current, 0) / learningOutcomesData.length);
    }, [learningOutcomesData]);

    if (!mounted) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-purple-500" />
                    <p className={`${mutedText} text-lg`}>Loading Learning Outcomes...</p>
                </div>
            </div>
        );
    }

    if (error && learningOutcomesData.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className={`text-center p-8 rounded-2xl ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                    <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-red-500" />
                    <p className={`${isDark ? 'text-red-300' : 'text-red-700'} text-lg mb-4`}>{error}</p>
                    <button
                        onClick={fetchLOData}
                        className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                            <ListOrdered className="w-8 h-8 text-purple-500" />
                        </div>
                        <div>
                            <h1 className={`text-3xl sm:text-4xl font-bold ${whiteText} mb-1`}>Learning Outcomes</h1>
                            <p className={`${mutedText} text-sm sm:text-base`}>Track your progress across all learning outcomes</p>
                        </div>
                    </div>
                    {learningOutcomesData.length > 0 && (
                        <div className={`px-5 py-3 sm:px-6 sm:py-4 rounded-xl ${isDark ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'} w-full sm:w-auto`}>
                            <p className={`text-xs sm:text-sm ${mutedText} mb-1`}>Overall Achievement</p>
                            <p className={`text-2xl sm:text-3xl font-extrabold ${overallLOAchievement >= 75 ? 'text-green-500' : overallLOAchievement >= 60 ? 'text-orange-500' : 'text-red-500'}`}>
                                {overallLOAchievement}%
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* LO Cards */}
            {learningOutcomesData.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-12 rounded-2xl ${themeClasses.card} border ${isDark ? 'border-white/10' : 'border-gray-200'} text-center`}
                >
                    <Target className={`w-16 h-16 mx-auto mb-4 ${mutedText} opacity-50`} />
                    <h2 className={`text-2xl font-bold ${whiteText} mb-2`}>No Learning Outcomes Available</h2>
                    <p className={mutedText}>Learning outcomes data is not available at this time.</p>
                </motion.div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
                >
                    {learningOutcomesData.map((lo) => {
                        const isTargetAchieved = lo.current >= lo.target;
                        
                        const data = {
                            labels: ['Achieved', 'Remaining'],
                            datasets: [{
                                data: [lo.current, Math.max(0, 100 - lo.current)],
                                backgroundColor: [
                                    isTargetAchieved ? '#10B981' : '#A855F7',
                                    isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                ],
                                borderColor: 'transparent',
                            }]
                        };

                        return (
                            <motion.div
                                key={`${lo.loId}-${lo.code}`}
                                variants={item}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className={`h-full p-6 rounded-2xl ${themeClasses.card} shadow-lg transition-all border ${isDark ? 'border-white/10' : 'border-gray-200'} flex flex-col group hover:shadow-2xl overflow-hidden relative`}
                            >
                                {/* Hover Tooltip for Description */}
                                <div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className={`absolute top-0 left-0 right-0 p-4 rounded-t-2xl ${isDark ? 'bg-gray-900/95 backdrop-blur-sm border-b border-white/10' : 'bg-white/95 backdrop-blur-sm border-b border-gray-200'} shadow-2xl max-h-[60%] overflow-y-auto`}>
                                        <h3 className={`text-sm font-bold ${whiteText} mb-2 flex items-center gap-2`}>
                                            <Target className="w-4 h-4 text-purple-500" />
                                            {lo.code} - {lo.title}
                                        </h3>
                                        <p className={`text-xs sm:text-sm ${mutedText} leading-relaxed whitespace-pre-wrap`}>
                                            {lo.description || 'No description available'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-start mb-4 flex-shrink-0 min-w-0">
                                    <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                                        <div className={`p-2 rounded-lg flex-shrink-0 ${isTargetAchieved ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
                                            <Target className={`w-5 h-5 ${isTargetAchieved ? 'text-green-500' : 'text-purple-500'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <h2 className={`text-lg font-bold ${whiteText} mb-1 truncate`}>{lo.code}</h2>
                                            <p className={`text-sm ${mutedText} line-clamp-2 overflow-hidden`}>{lo.title}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 sm:gap-6 py-6 border-y border-gray-500/20 my-4 flex-shrink-0 min-w-0">
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 relative flex-shrink-0">
                                        <Doughnut data={data} options={doughnutOptions(isDark)} />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <span className={`text-xl sm:text-2xl font-extrabold ${whiteText} block`}>{lo.current}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 space-y-2.5 sm:space-y-3 text-xs sm:text-sm min-w-0 overflow-hidden">
                                        <div className="flex justify-between items-center gap-2 min-w-0">
                                            <span className={`${mutedText} truncate`}>Target:</span>
                                            <span className={`font-bold ${whiteText} whitespace-nowrap flex-shrink-0`}>{lo.target}%</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-2 min-w-0">
                                            <span className={`${mutedText} truncate`}>Status:</span>
                                            <span className={`font-semibold flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                                                lo.status === 'Excellent' ? 'text-green-500' :
                                                lo.status === 'Achieved' ? 'text-purple-500' :
                                                'text-red-500'
                                            }`}>
                                                {lo.status === 'Achieved' && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                                                {lo.status === 'Needs Attention' && <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                                                {lo.status === 'Excellent' && <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                                                <span className="truncate">{lo.status}</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center gap-2 min-w-0">
                                            <span className={`${mutedText} truncate`}>Gap:</span>
                                            <span className={`font-bold whitespace-nowrap flex-shrink-0 ${isTargetAchieved ? 'text-green-500' : 'text-red-500'}`}>
                                                {isTargetAchieved 
                                                    ? `+${(lo.current - lo.target).toFixed(1)}%` 
                                                    : `-${(lo.target - lo.current).toFixed(1)}%`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-auto pt-4 flex-shrink-0 min-w-0 overflow-hidden">
                                    <h3 className={`text-xs font-semibold ${mutedText} flex items-center gap-2 mb-3 uppercase tracking-wide`}>
                                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" /> Course
                                    </h3>
                                    <div className="space-y-1.5">
                                        {lo.courseCode && (
                                            <span className={`inline-block px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg truncate max-w-full ${isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-200'}`}>
                                                {lo.courseCode}
                                            </span>
                                        )}
                                        {lo.course && lo.course !== 'Unknown Course' && (
                                            <p className={`text-xs ${mutedText} truncate`}>
                                                {lo.course}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}

