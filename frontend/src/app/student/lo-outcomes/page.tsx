'use client';

import { ListOrdered, Target, CheckCircle2, XCircle, TrendingUp, BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { api, TokenManager, type StudentLOAchievement, type LearningOutcome, type Enrollment } from '@/lib/api';

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

export default function LOOutcomesPage() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [learningOutcomesData, setLearningOutcomesData] = useState<LOData[]>([]);
    const { isDark, themeClasses, text, mutedText } = useThemeColors();

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

            const [loAchievementsResult, learningOutcomesResult, enrollmentsResult] = 
                await Promise.allSettled([
                    api.getLOAchievements(),
                    api.getLearningOutcomes(),
                    api.getEnrollments()
                ]);

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

            const loAchievementMap = new Map<number, StudentLOAchievement>();
            loAchievements.forEach(a => {
                const loId = typeof a.learning_outcome === 'string' ? parseInt(a.learning_outcome) : a.learning_outcome;
                if (loId) loAchievementMap.set(loId, a);
            });

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

                const courseId = typeof lo.course === 'string' ? parseInt(lo.course) : lo.course;
                const enrollment = courseId ? enrollmentMap.get(courseId) : null;

                return {
                    code: lo.code,
                    title: lo.title,
                    description: lo.description,
                    target: target,
                    current: Math.round(current * 10) / 10,
                    status: status,
                    course: enrollment?.course_name || lo.course_name || 'Unknown Course',
                    courseCode: enrollment?.course_code || lo.course_code || '',
                    loId: lo.id
                };
            });

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
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                            <ListOrdered className="w-8 h-8 text-purple-500" />
                        </div>
                        <div>
                            <h1 className={`text-3xl sm:text-4xl font-bold ${text} mb-1`}>Learning Outcomes</h1>
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
            </div>

            {/* KPI Summary Cards */}
            {learningOutcomesData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className={`${themeClasses.card} p-4 rounded-xl shadow-lg`}>
                        <p className={`text-sm ${mutedText} mb-1`}>Total LOs</p>
                        <p className={`text-2xl font-bold ${text}`}>{learningOutcomesData.length}</p>
                    </div>
                    <div className={`${themeClasses.card} p-4 rounded-xl shadow-lg`}>
                        <p className={`text-sm ${mutedText} mb-1`}>Achieved</p>
                        <p className={`text-2xl font-bold text-green-500`}>
                            {learningOutcomesData.filter(lo => lo.status === 'Achieved' || lo.status === 'Excellent').length}
                        </p>
                    </div>
                    <div className={`${themeClasses.card} p-4 rounded-xl shadow-lg`}>
                        <p className={`text-sm ${mutedText} mb-1`}>Needs Attention</p>
                        <p className={`text-2xl font-bold text-red-500`}>
                            {learningOutcomesData.filter(lo => lo.status === 'Needs Attention').length}
                        </p>
                    </div>
                    <div className={`${themeClasses.card} p-4 rounded-xl shadow-lg`}>
                        <p className={`text-sm ${mutedText} mb-1`}>Excellent</p>
                        <p className={`text-2xl font-bold text-green-600`}>
                            {learningOutcomesData.filter(lo => lo.status === 'Excellent').length}
                        </p>
                    </div>
                </div>
            )}

            {/* LO Table */}
            {learningOutcomesData.length === 0 ? (
                <div className={`p-12 rounded-2xl ${themeClasses.card} border ${isDark ? 'border-white/10' : 'border-gray-200'} text-center`}>
                    <Target className={`w-16 h-16 mx-auto mb-4 ${mutedText} opacity-50`} />
                    <h2 className={`text-2xl font-bold ${text} mb-2`}>No Learning Outcomes Available</h2>
                    <p className={mutedText}>Learning outcomes data is not available at this time.</p>
                </div>
            ) : (
                <div className={`${themeClasses.card} rounded-xl shadow-xl p-6`}>
                    <h2 className={`text-xl font-bold ${text} mb-4`}>Learning Outcomes List</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                    <th className={`text-left py-3 px-4 font-semibold ${text}`}>Code</th>
                                    <th className={`text-left py-3 px-4 font-semibold ${text}`}>Title</th>
                                    <th className={`text-center py-3 px-4 font-semibold ${text}`}>Current</th>
                                    <th className={`text-center py-3 px-4 font-semibold ${text}`}>Target</th>
                                    <th className={`text-center py-3 px-4 font-semibold ${text}`}>Status</th>
                                    <th className={`text-center py-3 px-4 font-semibold ${text}`}>Progress</th>
                                    <th className={`text-left py-3 px-4 font-semibold ${text}`}>Course</th>
                                </tr>
                            </thead>
                            <tbody>
                                {learningOutcomesData.map((lo) => {
                                    const isTargetAchieved = lo.current >= lo.target;
                                    const statusColor = 
                                        lo.status === 'Excellent' ? 'text-green-500' :
                                        lo.status === 'Achieved' ? 'text-purple-500' :
                                        'text-red-500';
                                    
                                    return (
                                        <tr key={`${lo.loId}-${lo.code}`} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'} hover:${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <td className={`py-3 px-4 font-medium ${text}`}>{lo.code}</td>
                                            <td className={`py-3 px-4 ${text}`}>
                                                <div>
                                                    <div className="font-medium">{lo.title}</div>
                                                    {lo.description && (
                                                        <div className={`text-xs ${mutedText} mt-1 line-clamp-1`}>
                                                            {lo.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={`py-3 px-4 text-center font-bold ${statusColor}`}>
                                                {lo.current}%
                                            </td>
                                            <td className={`py-3 px-4 text-center ${text}`}>{lo.target}%</td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {lo.status === 'Achieved' && <CheckCircle2 className="w-4 h-4 text-purple-500" />}
                                                    {lo.status === 'Needs Attention' && <XCircle className="w-4 h-4 text-red-500" />}
                                                    {lo.status === 'Excellent' && <TrendingUp className="w-4 h-4 text-green-500" />}
                                                    <span className={`text-xs font-medium ${statusColor}`}>
                                                        {lo.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            lo.status === 'Excellent' || lo.status === 'Achieved' ? 'bg-green-500' : 'bg-red-500'
                                                        }`}
                                                        style={{ width: `${Math.min(lo.current, 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                                                    {lo.courseCode || lo.course}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
