'use client';

import { Award, Target, CheckCircle2, XCircle, TrendingUp, BookOpen, ListOrdered, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { api, TokenManager, type ProgramOutcome, type StudentPOAchievement, type StudentLOAchievement, type LearningOutcome, type Enrollment, type Assessment } from '@/lib/api';

interface POData {
    code: string;
    title: string;
    description: string;
    target: number;
    current: number;
    status: 'Achieved' | 'Needs Attention' | 'Excellent';
    courses: string[];
    poId: number;
}

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

export default function OutcomesPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'po' | 'lo'>('po');
  const [programOutcomesData, setProgramOutcomesData] = useState<POData[]>([]);
  const [learningOutcomesData, setLearningOutcomesData] = useState<LOData[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchOutcomesData();
  }, []);

  const fetchOutcomesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let programOutcomes: ProgramOutcome[] = [];
      let poAchievements: StudentPOAchievement[] = [];
      let learningOutcomes: LearningOutcome[] = [];
      let loAchievements: StudentLOAchievement[] = [];
      let enrollments: Enrollment[] = [];
      let assessments: Assessment[] = [];

      const isAuthenticated = TokenManager.isAuthenticated();
      const token = TokenManager.getAccessToken();
      
      if (!isAuthenticated || !token) {
        setError('Please log in to view program outcomes.');
        setLoading(false);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }

      const [
        programOutcomesResult,
        poAchievementsResult,
        enrollmentsResult,
        assessmentsResult,
        loAchievementsResult,
        learningOutcomesResult
      ] = await Promise.allSettled([
        api.getProgramOutcomes(),
        api.getPOAchievements(),
        api.getEnrollments(),
        api.getAssessments(),
        api.getLOAchievements(),
        api.getLearningOutcomes()
      ]);
      
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
        programOutcomes = [];
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

      if (loAchievementsResult.status === 'fulfilled') {
        loAchievements = Array.isArray(loAchievementsResult.value) ? loAchievementsResult.value : [];
      }

      if (learningOutcomesResult.status === 'fulfilled') {
        learningOutcomes = Array.isArray(learningOutcomesResult.value) ? learningOutcomesResult.value : [];
      }

      programOutcomes = Array.isArray(programOutcomes) ? programOutcomes : [];
      poAchievements = Array.isArray(poAchievements) ? poAchievements : [];
      learningOutcomes = Array.isArray(learningOutcomes) ? learningOutcomes : [];
      loAchievements = Array.isArray(loAchievements) ? loAchievements : [];
      enrollments = Array.isArray(enrollments) ? enrollments : [];
      assessments = Array.isArray(assessments) ? assessments : [];

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

      const assessmentCourseMap = new Map<number, Set<number>>();
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
        
        const achievementValue = achievement?.achievement_percentage ?? achievement?.current_percentage ?? 0;
        const current = achievement ? Number(achievementValue) : 0;
        const target = Number(po.target_percentage);

        let status: 'Achieved' | 'Needs Attention' | 'Excellent';
        if (current >= target * 1.1) {
          status = 'Excellent';
        } else if (current >= target) {
          status = 'Achieved';
        } else {
          status = 'Needs Attention';
        }

        const courseIds = assessmentCourseMap.get(poId) || new Set<number>();
        const contributingCourses = Array.from(courseIds)
          .map(courseId => enrollmentCourseCodeMap.get(courseId))
          .filter((code): code is string => !!code);

        return {
          code: po.code,
          title: po.title,
          description: po.description,
          target: target,
          current: Math.round(current * 10) / 10,
          status: status,
          courses: contributingCourses,
          poId: po.id
        };
      });

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

      setProgramOutcomesData(poDataList);
      setLearningOutcomesData(loDataList);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch outcomes data:', err);
      setLoading(false);
      if (err.message?.includes('404') || err.message?.includes('No')) {
        setProgramOutcomesData([]);
        setLearningOutcomesData([]);
      } else {
        setError(err.message || 'Failed to load outcomes data');
        setProgramOutcomesData([]);
        setLearningOutcomesData([]);
      }
    }
  };

  const { isDark, themeClasses, text, mutedText } = useThemeColors();

  if (!mounted) {
    return null;
  }
  
  const overallPOAchievement = programOutcomesData.length > 0
    ? Math.round(programOutcomesData.reduce((sum, po) => sum + po.current, 0) / programOutcomesData.length)
    : 0;

  const overallLOAchievement = learningOutcomesData.length > 0
    ? Math.round(learningOutcomesData.reduce((sum, lo) => sum + lo.current, 0) / learningOutcomesData.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={mutedText}>Loading outcomes...</p>
        </div>
      </div>
    );
  }

  if (error && programOutcomesData.length === 0 && learningOutcomesData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`text-center p-6 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error}</p>
          <button
            onClick={fetchOutcomesData}
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
      {/* Header and Tab Selection */}
      <div className="mb-6 border-b pb-4 border-gray-500/20">
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-3xl font-bold ${text} flex items-center gap-3`}>
            <Award className="w-7 h-7 text-yellow-500" />
            Outcomes Overview
          </h1>
          {activeTab === 'po' && programOutcomesData.length > 0 && (
            <div className="flex items-center gap-4">
                <span className={mutedText}>Overall PO Achievement:</span>
                <span className={`text-2xl font-extrabold ${overallPOAchievement >= 75 ? 'text-green-500' : 'text-orange-500'}`}>
                    {overallPOAchievement}%
                </span>
            </div>
          )}
          {activeTab === 'lo' && learningOutcomesData.length > 0 && (
            <div className="flex items-center gap-4">
                <span className={mutedText}>Overall LO Achievement:</span>
                <span className={`text-2xl font-extrabold ${overallLOAchievement >= 75 ? 'text-green-500' : 'text-orange-500'}`}>
                    {overallLOAchievement}%
                </span>
            </div>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('po')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'po'
                ? 'bg-indigo-500 text-white'
                : isDark
                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              PO Outcomes
            </div>
          </button>
          <button
            onClick={() => setActiveTab('lo')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'lo'
                ? 'bg-purple-500 text-white'
                : isDark
                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5" />
              LO Outcomes
            </div>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      {activeTab === 'po' && programOutcomesData.length > 0 && (
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
            <p className={`text-sm ${mutedText} mb-1`}>Avg Score</p>
            <p className={`text-2xl font-bold ${text}`}>{overallPOAchievement}%</p>
          </div>
        </div>
      )}

      {activeTab === 'lo' && learningOutcomesData.length > 0 && (
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
            <p className={`text-sm ${mutedText} mb-1`}>Avg Score</p>
            <p className={`text-2xl font-bold ${text}`}>{overallLOAchievement}%</p>
          </div>
        </div>
      )}

      {/* Outcomes Table */}
      <div className={`${themeClasses.card} rounded-xl shadow-xl p-6`}>
        {activeTab === 'po' ? (
          <>
            <h2 className={`text-xl font-bold ${text} mb-4`}>Program Outcomes</h2>
            {programOutcomesData.length === 0 ? (
              <div className="text-center py-12">
                <Target className={`w-12 h-12 mx-auto mb-4 opacity-50 ${mutedText}`} />
                <p className={mutedText}>No program outcomes available</p>
              </div>
            ) : (
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
                    </tr>
                  </thead>
                  <tbody>
                    {programOutcomesData.map((po) => {
                      const statusColor = 
                        po.status === 'Excellent' ? 'text-green-500' :
                        po.status === 'Achieved' ? 'text-blue-500' :
                        'text-red-500';
                      
                      return (
                        <tr key={po.code} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'} hover:${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <td className={`py-3 px-4 font-medium ${text}`}>{po.code}</td>
                          <td className={`py-3 px-4 ${text}`}>{po.title}</td>
                          <td className={`py-3 px-4 text-center font-bold ${statusColor}`}>{po.current}%</td>
                          <td className={`py-3 px-4 text-center ${text}`}>{po.target}%</td>
                          <td className="py-3 px-4 text-center">
                            {po.status === 'Achieved' && <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />}
                            {po.status === 'Needs Attention' && <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                            {po.status === 'Excellent' && <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />}
                          </td>
                          <td className="py-3 px-4">
                            <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                              <div
                                className={`h-2 rounded-full ${
                                  po.status === 'Excellent' || po.status === 'Achieved' ? 'bg-green-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(po.current, 100)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className={`text-xl font-bold ${text} mb-4`}>Learning Outcomes</h2>
            {learningOutcomesData.length === 0 ? (
              <div className="text-center py-12">
                <ListOrdered className={`w-12 h-12 mx-auto mb-4 opacity-50 ${mutedText}`} />
                <p className={mutedText}>No learning outcomes available</p>
              </div>
            ) : (
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
                      const statusColor = 
                        lo.status === 'Excellent' ? 'text-green-500' :
                        lo.status === 'Achieved' ? 'text-purple-500' :
                        'text-red-500';
                      
                      return (
                        <tr key={`${lo.loId}-${lo.code}`} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'} hover:${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <td className={`py-3 px-4 font-medium ${text}`}>{lo.code}</td>
                          <td className={`py-3 px-4 ${text}`}>{lo.title}</td>
                          <td className={`py-3 px-4 text-center font-bold ${statusColor}`}>{lo.current}%</td>
                          <td className={`py-3 px-4 text-center ${text}`}>{lo.target}%</td>
                          <td className="py-3 px-4 text-center">
                            {lo.status === 'Achieved' && <CheckCircle2 className="w-4 h-4 text-purple-500 mx-auto" />}
                            {lo.status === 'Needs Attention' && <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                            {lo.status === 'Excellent' && <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />}
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
