'use client';

import { Award, Target, CheckCircle2, XCircle, TrendingUp, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { api, TokenManager, type ProgramOutcome, type StudentPOAchievement, type Enrollment, type Assessment } from '@/lib/api';

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

export default function POOutcomesPage() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [programOutcomesData, setProgramOutcomesData] = useState<POData[]>([]);
    const { isDark, themeClasses, text, mutedText } = useThemeColors();

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

            const [programOutcomesResult, poAchievementsResult, enrollmentsResult, assessmentsResult] = 
                await Promise.allSettled([
                    api.getProgramOutcomes(),
                    api.getPOAchievements(),
                    api.getEnrollments(),
                    api.getAssessments()
                ]);

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

            const activePOs = programOutcomes.filter(po => {
                if (po.is_active === undefined || po.is_active === null) return true;
                if (typeof po.is_active === 'string') {
                    return po.is_active.toLowerCase() === 'true';
                }
                return po.is_active === true;
            });

            const POsToShow = activePOs.length > 0 ? activePOs : programOutcomes;

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

            const poDataList: POData[] = POsToShow.map(po => {
                const poId = typeof po.id === 'string' ? parseInt(po.id) : po.id;
                const achievement = achievementMap.get(poId);
                
                const courseIds = assessmentCourseMap.get(poId) || new Set<number>();
                const contributingCourses = Array.from(courseIds)
                    .map(courseId => enrollmentCourseCodeMap.get(courseId))
                    .filter((code): code is string => !!code);
                
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
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                            <Award className="w-8 h-8 text-indigo-500" />
                        </div>
                        <div>
                            <h1 className={`text-3xl sm:text-4xl font-bold ${text} mb-1`}>Program Outcomes</h1>
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
            </div>

            {/* KPI Summary Cards */}
            {programOutcomesData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className={`${themeClasses.card} p-4 rounded-xl shadow-lg`}>
                        <p className={`text-sm ${mutedText} mb-1`}>Total POs</p>
                        <p className={`text-2xl font-bold ${text}`}>{programOutcomesData.length}</p>
                    </div>
                    <div className={`${themeClasses.card} p-4 rounded-xl shadow-lg`}>
                        <p className={`text-sm ${mutedText} mb-1`}>Achieved</p>
                        <p className={`text-2xl font-bold text-green-500`}>
                            {programOutcomesData.filter(po => po.status === 'Achieved' || po.status === 'Excellent').length}
                        </p>
                    </div>
                    <div className={`${themeClasses.card} p-4 rounded-xl shadow-lg`}>
                        <p className={`text-sm ${mutedText} mb-1`}>Needs Attention</p>
                        <p className={`text-2xl font-bold text-red-500`}>
                            {programOutcomesData.filter(po => po.status === 'Needs Attention').length}
                        </p>
                    </div>
                    <div className={`${themeClasses.card} p-4 rounded-xl shadow-lg`}>
                        <p className={`text-sm ${mutedText} mb-1`}>No Data</p>
                        <p className={`text-2xl font-bold text-gray-500`}>
                            {programOutcomesData.filter(po => po.status === 'No Data').length}
                        </p>
                    </div>
                </div>
            )}

            {/* PO Table */}
            {programOutcomesData.length === 0 ? (
                <div className={`p-12 rounded-2xl ${themeClasses.card} border ${isDark ? 'border-white/10' : 'border-gray-200'} text-center`}>
                    <Target className={`w-16 h-16 mx-auto mb-4 ${mutedText} opacity-50`} />
                    <h2 className={`text-2xl font-bold ${text} mb-2`}>No Program Outcomes Available</h2>
                    <p className={mutedText}>Program outcomes data is not available at this time.</p>
                </div>
            ) : (
                <div className={`${themeClasses.card} rounded-xl shadow-xl p-6`}>
                    <h2 className={`text-xl font-bold ${text} mb-4`}>Program Outcomes List</h2>
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
                                    <th className={`text-left py-3 px-4 font-semibold ${text}`}>Courses</th>
                                </tr>
                            </thead>
                            <tbody>
                                {programOutcomesData.map((po) => {
                                    const isTargetAchieved = po.current >= po.target;
                                    const statusColor = 
                                        po.status === 'Excellent' ? 'text-green-500' :
                                        po.status === 'Achieved' ? 'text-blue-500' :
                                        po.status === 'No Data' ? 'text-gray-500' :
                                        'text-red-500';
                                    
                                    return (
                                        <tr key={po.code} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'} hover:${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <td className={`py-3 px-4 font-medium ${text}`}>{po.code}</td>
                                            <td className={`py-3 px-4 ${text}`}>
                                                <div>
                                                    <div className="font-medium">{po.title}</div>
                                                    {po.description && (
                                                        <div className={`text-xs ${mutedText} mt-1 line-clamp-1`}>
                                                            {po.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={`py-3 px-4 text-center font-bold ${statusColor}`}>
                                                {po.current}%
                                            </td>
                                            <td className={`py-3 px-4 text-center ${text}`}>{po.target}%</td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {po.status === 'Achieved' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                    {po.status === 'Needs Attention' && <XCircle className="w-4 h-4 text-red-500" />}
                                                    {po.status === 'Excellent' && <TrendingUp className="w-4 h-4 text-green-500" />}
                                                    {po.status === 'No Data' && <AlertTriangle className="w-4 h-4 text-gray-500" />}
                                                    <span className={`text-xs font-medium ${statusColor}`}>
                                                        {po.status === 'No Data' ? 'VERİ YOK' : po.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            po.status === 'Excellent' || po.status === 'Achieved' ? 'bg-green-500' :
                                                            po.status === 'No Data' ? 'bg-gray-500' :
                                                            'bg-red-500'
                                                        }`}
                                                        style={{ width: `${Math.min(po.current, 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {po.courses.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {po.courses.slice(0, 3).map(course => (
                                                            <span key={course} className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                {course}
                                                            </span>
                                                        ))}
                                                        {po.courses.length > 3 && (
                                                            <span className={`text-xs ${mutedText}`}>+{po.courses.length - 3}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className={mutedText}>-</span>
                                                )}
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
