// app/student/po-outcomes/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Award, Target, CheckCircle2, XCircle, TrendingUp, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { api, TokenManager, type ProgramOutcome, type StudentPOAchievement, type Enrollment, type Assessment } from '@/lib/api';

ChartJS.register(ArcElement, Tooltip, Legend);

interface POData {
    code: string;
    title: string;
    description: string;
    target: number;
    current: number;
    status: 'Achieved' | 'Needs Attention' | 'Excellent' | 'No Data';
    courses: string[];
    poId: number;
    hasData: boolean;
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

export default function POOutcomesPage() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [programOutcomesData, setProgramOutcomesData] = useState<POData[]>([]);
    const { isDark, themeClasses, text, mutedText } = useThemeColors();
    const whiteText = text;

    useEffect(() => {
        setMounted(true);
        fetchPOData();
    }, []);

    const fetchPOData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!TokenManager.isAuthenticated() || !TokenManager.getAccessToken()) {
                setError('Please log in to view program outcomes.');
                setLoading(false);
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return;
            }

            const startTime = performance.now();

            // Fetch only PO-related data in parallel
            const [programOutcomesResult, poAchievementsResult, enrollmentsResult, assessmentsResult] = 
                await Promise.allSettled([
                    api.getProgramOutcomes(),
                    api.getPOAchievements(),
                    api.getEnrollments(),
                    api.getAssessments()
                ]);

            const fetchTime = performance.now() - startTime;

            let programOutcomes: ProgramOutcome[] = [];
            let poAchievements: StudentPOAchievement[] = [];
            let enrollments: Enrollment[] = [];
            let assessments: Assessment[] = [];

            if (programOutcomesResult.status === 'fulfilled') {
                programOutcomes = Array.isArray(programOutcomesResult.value) ? programOutcomesResult.value : [];
            } else {
                const err = programOutcomesResult.reason;
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

            if (poAchievementsResult.status === 'fulfilled') {
                poAchievements = Array.isArray(poAchievementsResult.value) ? poAchievementsResult.value : [];
            }

            if (enrollmentsResult.status === 'fulfilled') {
                enrollments = Array.isArray(enrollmentsResult.value) ? enrollmentsResult.value : [];
            }

            if (assessmentsResult.status === 'fulfilled') {
                assessments = Array.isArray(assessmentsResult.value) ? assessmentsResult.value : [];
            }

            const processStartTime = performance.now();

            // Filter active POs
            const activePOs = programOutcomes.filter(po => {
                if (po.is_active === undefined || po.is_active === null) return true;
                if (typeof po.is_active === 'string') {
                    return po.is_active.toLowerCase() === 'true';
                }
                if (typeof po.is_active === 'boolean') {
                    return po.is_active === true;
                }
                return false;
            });

            const POsToShow = activePOs.length > 0 ? activePOs : programOutcomes;

            // Build maps for O(1) lookups
            const achievementMap = new Map<number, StudentPOAchievement>();
            poAchievements.forEach(a => {
                const poId = typeof a.program_outcome === 'string' ? parseInt(a.program_outcome) : a.program_outcome;
                if (poId) achievementMap.set(poId, a);
                if (a.po_code) {
                    const poByCode = programOutcomes.find(p => p.code === a.po_code);
                    if (poByCode) {
                        const poIdByCode = typeof poByCode.id === 'string' ? parseInt(poByCode.id) : poByCode.id;
                        if (poIdByCode && !achievementMap.has(poIdByCode)) {
                            achievementMap.set(poIdByCode, a);
                        }
                    }
                }
            });

            const enrollmentCourseCodeMap = new Map<number, string>();
            enrollments.forEach(e => {
                let courseId: number | null = null;
                if (typeof e.course === 'object' && e.course !== null) {
                    courseId = (e.course as any).id;
                } else if (typeof e.course === 'string') {
                    courseId = parseInt(e.course);
                } else if (typeof e.course === 'number') {
                    courseId = e.course;
                }
                if (courseId && e.course_code) {
                    enrollmentCourseCodeMap.set(courseId, e.course_code);
                }
            });

            const assessmentCourseMap = new Map<number, Set<number>>();
            assessments.forEach(a => {
                if (!a.related_pos) return;
                const relatedPosArray = Array.isArray(a.related_pos) ? a.related_pos : [a.related_pos];
                
                let courseId: number | null = null;
                if (typeof a.course === 'object' && a.course !== null) {
                    courseId = (a.course as any).id;
                } else if (typeof a.course === 'string') {
                    courseId = parseInt(a.course);
                } else if (typeof a.course === 'number') {
                    courseId = a.course;
                }
                
                if (!courseId) return;
                
                relatedPosArray.forEach((posId: any) => {
                    const posIdNum = typeof posId === 'string' ? parseInt(posId) : posId;
                    if (!posIdNum || isNaN(posIdNum)) return;
                    
                    if (!assessmentCourseMap.has(posIdNum)) {
                        assessmentCourseMap.set(posIdNum, new Set());
                    }
                    assessmentCourseMap.get(posIdNum)!.add(courseId!);
                });
            });

            // Process PO data
            const poDataList: POData[] = POsToShow.map(po => {
                const poId = typeof po.id === 'string' ? parseInt(po.id) : po.id;
                const achievement = achievementMap.get(poId);
                
                const courseIds = assessmentCourseMap.get(poId) || new Set<number>();
                const contributingCourses = Array.from(courseIds)
                    .map(courseId => enrollmentCourseCodeMap.get(courseId))
                    .filter((code): code is string => !!code);
                
                // Check if PO has data: achievement exists OR has assessments
                const hasData = !!achievement || courseIds.size > 0;
                
                const achievementValue = achievement?.achievement_percentage ?? achievement?.current_percentage ?? 0;
                const current = achievement ? Number(achievementValue) : 0;
                const target = Number(po.target_percentage);

                let status: 'Achieved' | 'Needs Attention' | 'Excellent' | 'No Data';
                if (!hasData) {
                    status = 'No Data';
                } else if (current >= target * 1.1) {
                    status = 'Excellent';
                } else if (current >= target) {
                    status = 'Achieved';
                } else {
                    status = 'Needs Attention';
                }

                return {
                    code: po.code,
                    title: po.title,
                    description: po.description,
                    target: target,
                    current: Math.round(current * 10) / 10,
                    status: status,
                    courses: contributingCourses,
                    poId: po.id,
                    hasData: hasData
                };
            });

            const processTime = performance.now() - processStartTime;
            const totalTime = performance.now() - startTime;

            setProgramOutcomesData(poDataList);
            setLoading(false);
        } catch (err: any) {
            console.error('Failed to fetch PO data:', err);
            setLoading(false);
            setError(err.message || 'Failed to load program outcomes');
            setProgramOutcomesData([]);
        }
    };

    const overallPOAchievement = useMemo(() => {
        if (programOutcomesData.length === 0) return 0;
        // Only include PO's with data in the average calculation
        const posWithData = programOutcomesData.filter(po => po.hasData);
        if (posWithData.length === 0) return 0;
        return Math.round(posWithData.reduce((sum, po) => sum + po.current, 0) / posWithData.length);
    }, [programOutcomesData]);

    if (!mounted) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-500" />
                    <p className={`${mutedText} text-lg`}>Loading Program Outcomes...</p>
                </div>
            </div>
        );
    }

    if (error && programOutcomesData.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className={`text-center p-8 rounded-2xl ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                    <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-red-500" />
                    <p className={`${isDark ? 'text-red-300' : 'text-red-700'} text-lg mb-4`}>{error}</p>
                    <button
                        onClick={fetchPOData}
                        className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-semibold"
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
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                            <Award className="w-8 h-8 text-indigo-500" />
                        </div>
                        <div>
                            <h1 className={`text-3xl sm:text-4xl font-bold ${whiteText} mb-1`}>Program Outcomes</h1>
                            <p className={`${mutedText} text-sm sm:text-base`}>Track your progress across all program outcomes</p>
                        </div>
                    </div>
                    {programOutcomesData.length > 0 && (
                        <div className={`px-5 py-3 sm:px-6 sm:py-4 rounded-xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200'} w-full sm:w-auto`}>
                            <p className={`text-xs sm:text-sm ${mutedText} mb-1`}>Overall Achievement</p>
                            <p className={`text-2xl sm:text-3xl font-extrabold ${overallPOAchievement >= 75 ? 'text-green-500' : overallPOAchievement >= 60 ? 'text-orange-500' : 'text-red-500'}`}>
                                {overallPOAchievement}%
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* PO Cards */}
            {programOutcomesData.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-12 rounded-2xl ${themeClasses.card} border ${isDark ? 'border-white/10' : 'border-gray-200'} text-center`}
                >
                    <Target className={`w-16 h-16 mx-auto mb-4 ${mutedText} opacity-50`} />
                    <h2 className={`text-2xl font-bold ${whiteText} mb-2`}>No Program Outcomes Available</h2>
                    <p className={mutedText}>Program outcomes data is not available at this time.</p>
                </motion.div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
                >
                    {programOutcomesData.map((po) => {
                        const isTargetAchieved = po.current >= po.target;
                        
                        const data = {
                            labels: ['Achieved', 'Remaining'],
                            datasets: [{
                                data: [po.current, Math.max(0, 100 - po.current)],
                                backgroundColor: [
                                    isTargetAchieved ? '#10B981' : '#6366F1',
                                    isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                ],
                                borderColor: 'transparent',
                            }]
                        };

                        return (
                            <motion.div
                                key={po.code}
                                variants={item}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className={`h-full p-6 rounded-2xl ${themeClasses.card} shadow-lg transition-all border ${isDark ? 'border-white/10' : 'border-gray-200'} flex flex-col group hover:shadow-2xl overflow-hidden relative`}
                            >
                                {/* Hover Tooltip for Description */}
                                <div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className={`absolute top-0 left-0 right-0 p-4 rounded-t-2xl ${isDark ? 'bg-gray-900/95 backdrop-blur-sm border-b border-white/10' : 'bg-white/95 backdrop-blur-sm border-b border-gray-200'} shadow-2xl max-h-[60%] overflow-y-auto`}>
                                        <h3 className={`text-sm font-bold ${whiteText} mb-2 flex items-center gap-2`}>
                                            <Target className="w-4 h-4 text-indigo-500" />
                                            {po.code} - {po.title}
                                        </h3>
                                        <p className={`text-xs sm:text-sm ${mutedText} leading-relaxed whitespace-pre-wrap`}>
                                            {po.description || 'No description available'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-start mb-4 flex-shrink-0 min-w-0">
                                    <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                                        <div className={`p-2 rounded-lg flex-shrink-0 ${isTargetAchieved ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                                            <Target className={`w-5 h-5 ${isTargetAchieved ? 'text-green-500' : 'text-orange-500'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <h2 className={`text-lg font-bold ${whiteText} mb-1 truncate`}>{po.code}</h2>
                                            <p className={`text-sm ${mutedText} line-clamp-2 overflow-hidden`}>{po.title}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 sm:gap-6 py-6 border-y border-gray-500/20 my-4 flex-shrink-0 min-w-0">
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 relative flex-shrink-0">
                                        <Doughnut data={data} options={doughnutOptions(isDark)} />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <span className={`text-xl sm:text-2xl font-extrabold ${whiteText} block`}>{po.current}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 space-y-2.5 sm:space-y-3 text-xs sm:text-sm min-w-0 overflow-hidden">
                                        <div className="flex justify-between items-center gap-2 min-w-0">
                                            <span className={`${mutedText} truncate`}>Target:</span>
                                            <span className={`font-bold ${whiteText} whitespace-nowrap flex-shrink-0`}>{po.target}%</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-2 min-w-0">
                                            <span className={`${mutedText} truncate`}>Status:</span>
                                            <span className={`font-semibold flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                                                po.status === 'Excellent' ? 'text-green-500' :
                                                po.status === 'Achieved' ? 'text-blue-500' :
                                                po.status === 'No Data' ? 'text-gray-500' :
                                                'text-red-500'
                                            }`}>
                                                {po.status === 'Achieved' && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                                                {po.status === 'Needs Attention' && <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                                                {po.status === 'Excellent' && <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                                                {po.status === 'No Data' && <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                                                <span className="truncate">{po.status === 'No Data' ? 'VERİ YOK' : po.status}</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center gap-2 min-w-0">
                                            <span className={`${mutedText} truncate`}>Gap:</span>
                                            <span className={`font-bold whitespace-nowrap flex-shrink-0 ${isTargetAchieved ? 'text-green-500' : 'text-red-500'}`}>
                                                {isTargetAchieved 
                                                    ? `+${(po.current - po.target).toFixed(1)}%` 
                                                    : `-${(po.target - po.current).toFixed(1)}%`}
                                            </span>
                                        </div>
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

