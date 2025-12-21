// app/student/outcomes/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Award, Target, CheckCircle2, XCircle, TrendingUp, BookOpen, ListOrdered, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { api, TokenManager, type ProgramOutcome, type StudentPOAchievement, type StudentLOAchievement, type LearningOutcome, type Enrollment, type Assessment } from '@/lib/api';

// Doughnut Chart'ı kaydetme
ChartJS.register(ArcElement, Tooltip, Legend);

// PO Data Interface
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

// LO Data Interface
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

// --- YARDIMCI FONKSİYONLAR ve Sabitler ---

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

// Doughnut Chart (PO Başarısı) Opsiyonları
const doughnutOptions = (isDark: boolean, mutedText: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%', // Doughnut (Simit) görünümü
    plugins: {
        legend: { display: false },
        tooltip: {
            bodyColor: isDark ? '#FFF' : '#000',
            titleColor: isDark ? '#FFF' : '#000',
            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        }
    }
});


// --- ANA BİLEŞEN: OUTCOMES PAGE ---

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
      
      // Fetch all required data with individual error handling
      let programOutcomes: ProgramOutcome[] = [];
      let poAchievements: StudentPOAchievement[] = [];
      let learningOutcomes: LearningOutcome[] = [];
      let loAchievements: StudentLOAchievement[] = [];
      let enrollments: Enrollment[] = [];
      let assessments: Assessment[] = [];

      // Check authentication first
      const isAuthenticated = TokenManager.isAuthenticated();
      const token = TokenManager.getAccessToken();
      console.log('🔐 Authentication check:', isAuthenticated);
      console.log('🔐 Token exists:', !!token);
      console.log('🔐 Token preview:', token ? `${token.substring(0, 20)}...` : 'none');
      
      if (!isAuthenticated || !token) {
        console.error('❌ User is not authenticated! Redirecting to login...');
        setError('Please log in to view program outcomes.');
        setLoading(false);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }

      // Fetch all API calls in parallel for faster loading
      const startTime = performance.now();
      
      // Fetch all data in parallel - including LO without course filter (backend filters by student)
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
        api.getLearningOutcomes() // Fetch all LOs (backend filters by student role)
      ]);
      
      const fetchTime = performance.now() - startTime;
      console.log(`⏱️ API calls completed in ${fetchTime.toFixed(2)}ms`);

      // Handle Program Outcomes
      if (programOutcomesResult.status === 'fulfilled') {
        programOutcomes = Array.isArray(programOutcomesResult.value) ? programOutcomesResult.value : [];
        console.log('✅ ProgramOutcomes fetched:', programOutcomes.length);
      } else {
        const err = programOutcomesResult.reason;
        console.error('❌ Error fetching ProgramOutcomes:', err);
        
        // If 401, redirect to login
        if (err?.message?.includes('401') || 
            err?.message?.includes('Authentication') || 
            err?.message?.includes('credentials') ||
            err?.message?.includes('not provided')) {
          console.error('❌ Authentication failed! Redirecting to login...');
          TokenManager.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return;
        }
        
        // If network error, show helpful message
        if (err?.message?.includes('fetch') || err?.message?.includes('Network')) {
          console.error('❌ Network error - Backend may be down');
          setError('Cannot connect to server. Please check if the backend is running.');
        }
        
        programOutcomes = [];
      }

      // Handle PO Achievements
      if (poAchievementsResult.status === 'fulfilled') {
        poAchievements = Array.isArray(poAchievementsResult.value) ? poAchievementsResult.value : [];
      } else {
        console.error('❌ Error fetching POAchievements:', poAchievementsResult.reason);
        poAchievements = [];
      }

      // Handle Enrollments
      if (enrollmentsResult.status === 'fulfilled') {
        enrollments = Array.isArray(enrollmentsResult.value) ? enrollmentsResult.value : [];
      } else {
        console.error('❌ Error fetching Enrollments:', enrollmentsResult.reason);
        enrollments = [];
      }

      // Handle Assessments
      if (assessmentsResult.status === 'fulfilled') {
        assessments = Array.isArray(assessmentsResult.value) ? assessmentsResult.value : [];
      } else {
        console.error('❌ Error fetching Assessments:', assessmentsResult.reason);
        assessments = [];
      }

      // Handle LO Achievements
      if (loAchievementsResult.status === 'fulfilled') {
        loAchievements = Array.isArray(loAchievementsResult.value) ? loAchievementsResult.value : [];
      } else {
        console.error('❌ Error fetching LO Achievements:', loAchievementsResult.reason);
        loAchievements = [];
      }

      // Handle Learning Outcomes (already fetched in parallel)
      if (learningOutcomesResult.status === 'fulfilled') {
        learningOutcomes = Array.isArray(learningOutcomesResult.value) ? learningOutcomesResult.value : [];
      } else {
        console.error('❌ Error fetching Learning Outcomes:', learningOutcomesResult.reason);
        learningOutcomes = [];
      }

      // Ensure all responses are arrays (defensive programming)
      programOutcomes = Array.isArray(programOutcomes) ? programOutcomes : [];
      poAchievements = Array.isArray(poAchievements) ? poAchievements : [];
      learningOutcomes = Array.isArray(learningOutcomes) ? learningOutcomes : [];
      loAchievements = Array.isArray(loAchievements) ? loAchievements : [];
      enrollments = Array.isArray(enrollments) ? enrollments : [];
      assessments = Array.isArray(assessments) ? assessments : [];

      const processStartTime = performance.now();

      // If no program outcomes, try to show a helpful error
      if (programOutcomes.length === 0) {
        console.error('⚠️ No Program Outcomes found!');
        console.error('This could mean:');
        console.error('1. API endpoint is not accessible');
        console.error('2. Authentication token is missing or invalid');
        console.error('3. Backend server is not running');
        console.error('4. User does not have permission to view POs');
        
        // Don't set error immediately - try to show fallback
        // setError('No program outcomes available. Please contact your administrator.');
        // setProgramOutcomesData([]);
        // setLoading(false);
        // return;
      }

      // Filter only active POs (if is_active is undefined, include it)
      // Also handle case where is_active might be a string "true"/"false"
      const activePOs = programOutcomes.filter(po => {
        if (po.is_active === undefined || po.is_active === null) return true;
        if (typeof po.is_active === 'string') {
          const isActiveStr = po.is_active as string;
          return isActiveStr.toLowerCase() === 'true';
        }
        return po.is_active === true;
      });
      

      // If no active POs, show all POs (fallback)
      const POsToShow = activePOs.length > 0 ? activePOs : programOutcomes;

      // OPTIMIZATION: Pre-build maps for O(1) lookups instead of O(n) searches
      // Map PO ID to achievement
      const achievementMap = new Map<number, StudentPOAchievement>();
      poAchievements.forEach(a => {
        let poId: number | undefined;
        if (typeof a.program_outcome === 'number') {
          poId = a.program_outcome;
        } else if (typeof a.program_outcome === 'object' && a.program_outcome !== null && 'id' in a.program_outcome) {
          poId = (a.program_outcome as { id: number }).id;
        } else if (typeof a.program_outcome === 'string') {
          poId = parseInt(a.program_outcome);
        }
        if (poId !== undefined) achievementMap.set(poId, a);
        // Also map by code if available
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

      // OPTIMIZATION: Pre-build assessment-course mapping
      const assessmentCourseMap = new Map<number, Set<number>>(); // PO ID -> Set of course IDs
      const enrollmentCourseCodeMap = new Map<number, string>(); // Course ID -> Course Code
      
      // Build enrollment map
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

      // Build assessment-PO mapping
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

      // Process PO data with optimized lookups
      const poDataList: POData[] = POsToShow.map(po => {
          const poId = typeof po.id === 'string' ? parseInt(po.id) : po.id;
        const achievement = achievementMap.get(poId);
        
        // Get achievement percentage
        const achievementValue = achievement?.achievement_percentage ?? achievement?.current_percentage ?? 0;
        const current = achievement ? Number(achievementValue) : 0;
        const target = Number(po.target_percentage);

        // Determine status
        let status: 'Achieved' | 'Needs Attention' | 'Excellent';
        if (current >= target * 1.1) {
          status = 'Excellent';
        } else if (current >= target) {
          status = 'Achieved';
        } else {
          status = 'Needs Attention';
        }

        // Get contributing courses using pre-built map
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

      // OPTIMIZATION: Pre-build LO achievement map
      const loAchievementMap = new Map<number, StudentLOAchievement>();
      loAchievements.forEach(a => {
        let loId: number | undefined;
        if (typeof a.learning_outcome === 'number') {
          loId = a.learning_outcome;
        } else if (typeof a.learning_outcome === 'object' && a.learning_outcome !== null && 'id' in a.learning_outcome) {
          loId = (a.learning_outcome as { id: number }).id;
        } else if (typeof a.learning_outcome === 'string') {
          loId = parseInt(a.learning_outcome);
        }
        if (loId !== undefined) loAchievementMap.set(loId, a);
      });

      // OPTIMIZATION: Pre-build enrollment map for course info
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

        // Determine status
        let status: 'Achieved' | 'Needs Attention' | 'Excellent';
        if (current >= target * 1.1) {
          status = 'Excellent';
        } else if (current >= target) {
          status = 'Achieved';
        } else {
          status = 'Needs Attention';
        }

        // Get course info using pre-built map
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

      // Process PO data with fallbacks
      let finalPOData: POData[] = poDataList;
      if (poDataList.length === 0 && POsToShow.length > 0) {
        // Use pre-built achievementMap for fallback
        finalPOData = POsToShow.map(po => {
          const poId = typeof po.id === 'string' ? parseInt(po.id) : po.id;
          const achievement = achievementMap.get(poId);
          const achievementValue = achievement?.achievement_percentage ?? achievement?.current_percentage ?? 0;
          const current = achievement ? Number(achievementValue) : 0;
          const target = Number(po.target_percentage) || 70;
          
          return {
            code: po.code || 'PO',
            title: po.title || 'Program Outcome',
            description: po.description || '',
            target: target,
            current: current,
            status: (current >= target) ? 'Achieved' as const : 'Needs Attention' as const,
            courses: [],
            poId: po.id
          };
        });
      } else if (poDataList.length === 0 && programOutcomes.length === 0) {
        console.error('❌ No Program Outcomes available from API!');
        setError('Unable to load program outcomes. Please check your connection and try again.');
        finalPOData = [];
      } else if (poDataList.length === 0 && programOutcomes.length > 0) {
        console.error('❌ No PO data to display despite having POs!');
        finalPOData = programOutcomes.map(po => ({
          code: po.code || 'PO',
          title: po.title || 'Program Outcome',
          description: po.description || '',
          target: Number(po.target_percentage) || 70,
          current: 0,
          status: 'Needs Attention' as const,
          courses: [],
          poId: po.id
        }));
      }

      const processTime = performance.now() - processStartTime;
      const totalTime = performance.now() - startTime;
      console.log(`⏱️ Performance: API=${fetchTime.toFixed(0)}ms, Processing=${processTime.toFixed(0)}ms, Total=${totalTime.toFixed(0)}ms`);

      // Update all states at once using React's automatic batching
      setProgramOutcomesData(finalPOData);
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
  
  const whiteText = text;

  const overallPOAchievement = programOutcomesData.length > 0
    ? Math.round(programOutcomesData.reduce((sum, po) => sum + po.current, 0) / programOutcomesData.length)
    : 0;

  const overallLOAchievement = learningOutcomesData.length > 0
    ? Math.round(learningOutcomesData.reduce((sum, lo) => sum + lo.current, 0) / learningOutcomesData.length)
    : 0;

  // Loading state
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

  // Error state
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

  // Render function for PO cards
  const renderPOCards = () => {
    if (programOutcomesData.length === 0) {
  return (
      <motion.div
          variants={item}
          className={`p-6 rounded-xl ${themeClasses.card} shadow-lg transition-all border ${isDark ? 'border-white/10' : 'border-gray-200'} flex flex-col opacity-50`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <Target className={`w-6 h-6 ${mutedText}`} />
              <div>
                <h2 className={`text-xl font-bold ${whiteText}`}>No PO Available</h2>
                <p className={`text-sm ${mutedText}`}>Program outcomes data is not available.</p>
              </div>
            </div>
          </div>
      </motion.div>
      );
    }

    return programOutcomesData.map((po) => {
          const isTargetAchieved = po.current >= po.target;
          
          const data = {
            labels: ['Achieved', 'Remaining'],
            datasets: [{
          data: [po.current, Math.max(0, 100 - po.current)],
              backgroundColor: [
            isTargetAchieved ? '#10B981' : '#3B82F6',
            isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              ],
              borderColor: 'transparent',
            }]
          };

          return (
            <motion.div
              key={po.code}
              variants={item}
              whileHover={{ y: -5, boxShadow: isDark ? '0 10px 20px rgba(0,0,0,0.4)' : '0 10px 20px rgba(0,0,0,0.1)' }}
              className={`p-6 rounded-xl ${themeClasses.card} shadow-lg transition-all border ${isDark ? 'border-white/10' : 'border-gray-200'} flex flex-col`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Target className={`w-6 h-6 ${isTargetAchieved ? 'text-green-500' : 'text-orange-500'}`} />
                  <div>
                    <h2 className={`text-xl font-bold ${whiteText}`}>{po.code}: {po.title}</h2>
                    <p className={`text-sm ${mutedText}`}>{po.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4 border-y border-gray-500/20 my-4">
                <div className="w-28 h-28 relative">
                  <Doughnut data={data} options={doughnutOptions(isDark, mutedText)} />
                  <div className={`absolute inset-0 flex items-center justify-center`}>
                    <span className={`text-xl font-extrabold ${whiteText}`}>{po.current}%</span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className={mutedText}>Target:</span>
                        <span className={`font-semibold ${whiteText}`}>{po.target}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className={mutedText}>Status:</span>
                        <span className={`font-semibold ${
                            po.status === 'Excellent' ? 'text-green-500' :
                            po.status === 'Achieved' ? 'text-blue-500' :
                            'text-red-500'
                        }`}>
                            {po.status === 'Achieved' && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                            {po.status === 'Needs Attention' && <XCircle className="w-4 h-4 inline mr-1" />}
                            {po.status === 'Excellent' && <TrendingUp className="w-4 h-4 inline mr-1" />}
                            {po.status}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className={mutedText}>Performance Gap:</span>
                        <span className={`font-semibold ${isTargetAchieved ? 'text-green-500' : 'text-red-500'}`}>
                        {isTargetAchieved 
                          ? `+${Math.round((po.current - po.target) * 10) / 10}%` 
                          : `-${Math.round((po.target - po.current) * 10) / 10}%`}
                        </span>
                    </div>
                </div>
              </div>
              
              <div className="mt-auto pt-4">
                  <h3 className={`text-sm font-semibold ${mutedText} flex items-center gap-1 mb-2`}>
                      <BookOpen className="w-4 h-4" /> Contributing Courses:
                  </h3>
                  {po.courses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {po.courses.map(course => (
                            <span key={course} className={`px-3 py-1 text-xs font-medium rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                {course}
                            </span>
                        ))}
                    </div>
                  ) : (
                    <p className={`text-xs ${mutedText}`}>No courses available</p>
                  )}
              </div>
            </motion.div>
          );
    });
  };

  // Render function for LO cards
  const renderLOCards = () => {
    if (learningOutcomesData.length === 0) {
      return (
            <motion.div
              variants={item}
              className={`p-6 rounded-xl ${themeClasses.card} shadow-lg transition-all border ${isDark ? 'border-white/10' : 'border-gray-200'} flex flex-col opacity-50`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
              <ListOrdered className={`w-6 h-6 ${mutedText}`} />
                  <div>
                <h2 className={`text-xl font-bold ${whiteText}`}>No LO Available</h2>
                <p className={`text-sm ${mutedText}`}>Learning outcomes data is not available.</p>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return learningOutcomesData.map((lo) => {
      const isTargetAchieved = lo.current >= lo.target;
      
      const data = {
        labels: ['Achieved', 'Remaining'],
        datasets: [{
          data: [lo.current, Math.max(0, 100 - lo.current)],
          backgroundColor: [
            isTargetAchieved ? '#10B981' : '#8B5CF6',
            isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          ],
          borderColor: 'transparent',
        }]
      };

      return (
        <motion.div
          key={`${lo.loId}-${lo.code}`}
          variants={item}
          whileHover={{ y: -5, boxShadow: isDark ? '0 10px 20px rgba(0,0,0,0.4)' : '0 10px 20px rgba(0,0,0,0.1)' }}
          className={`p-6 rounded-xl ${themeClasses.card} shadow-lg transition-all border ${isDark ? 'border-white/10' : 'border-gray-200'} flex flex-col`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <ListOrdered className={`w-6 h-6 ${isTargetAchieved ? 'text-green-500' : 'text-purple-500'}`} />
              <div>
                <h2 className={`text-xl font-bold ${whiteText}`}>{lo.code}: {lo.title}</h2>
                <p className={`text-sm ${mutedText}`}>{lo.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4 border-y border-gray-500/20 my-4">
            <div className="w-28 h-28 relative">
              <Doughnut data={data} options={doughnutOptions(isDark, mutedText)} />
                  <div className={`absolute inset-0 flex items-center justify-center`}>
                <span className={`text-xl font-extrabold ${whiteText}`}>{lo.current}%</span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className={mutedText}>Target:</span>
                    <span className={`font-semibold ${whiteText}`}>{lo.target}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className={mutedText}>Status:</span>
                    <span className={`font-semibold ${
                        lo.status === 'Excellent' ? 'text-green-500' :
                        lo.status === 'Achieved' ? 'text-purple-500' :
                        'text-red-500'
                    }`}>
                        {lo.status === 'Achieved' && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                        {lo.status === 'Needs Attention' && <XCircle className="w-4 h-4 inline mr-1" />}
                        {lo.status === 'Excellent' && <TrendingUp className="w-4 h-4 inline mr-1" />}
                        {lo.status}
                    </span>
                    </div>
                    <div className="flex justify-between">
                        <span className={mutedText}>Performance Gap:</span>
                    <span className={`font-semibold ${isTargetAchieved ? 'text-green-500' : 'text-red-500'}`}>
                        {isTargetAchieved 
                          ? `+${Math.round((lo.current - lo.target) * 10) / 10}%` 
                          : `-${Math.round((lo.target - lo.current) * 10) / 10}%`}
                    </span>
                </div>
                </div>
              </div>
              
              <div className="mt-auto pt-4">
                  <h3 className={`text-sm font-semibold ${mutedText} flex items-center gap-1 mb-2`}>
                  <BookOpen className="w-4 h-4" /> Course:
                  </h3>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                  {lo.courseCode || lo.course}
              </span>
              </div>
            </motion.div>
      );
    });
  };

  return (
    <div className={`container mx-auto py-0`}>
      {/* Başlık ve Tab Seçimi */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 border-b pb-4 border-gray-500/20"
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-3xl font-bold ${whiteText} flex items-center gap-3`}>
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
                ? isDark
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-500 text-white'
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
                ? isDark
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-500 text-white'
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
      </motion.div>

      {/* Outcomes Listesi - Tab'a göre göster */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {activeTab === 'po' ? renderPOCards() : renderLOCards()}
      </motion.div>
    </div>
  );
}