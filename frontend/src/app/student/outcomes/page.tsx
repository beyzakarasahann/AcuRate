// app/student/outcomes/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Award, Target, CheckCircle2, XCircle, TrendingUp, BookOpen, ListOrdered, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { api, TokenManager, type ProgramOutcome, type StudentPOAchievement, type Enrollment, type Assessment } from '@/lib/api';

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
  const [programOutcomesData, setProgramOutcomesData] = useState<POData[]>([]);

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

      // Fetch each API call individually to better handle errors
      try {
        console.log('📡 Starting API call to getProgramOutcomes...');
        programOutcomes = await api.getProgramOutcomes();
        console.log('✅ ProgramOutcomes fetched:', programOutcomes?.length || 0);
        console.log('✅ ProgramOutcomes data:', programOutcomes);
      } catch (err: any) {
        console.error('❌ Error fetching ProgramOutcomes:', err);
        console.error('❌ Error type:', typeof err);
        console.error('❌ Error message:', err?.message);
        console.error('❌ Error stack:', err?.stack);
        
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

      try {
        poAchievements = await api.getPOAchievements();
        console.log('✅ POAchievements fetched:', poAchievements?.length || 0);
      } catch (err: any) {
        console.error('❌ Error fetching POAchievements:', err);
        poAchievements = [];
      }

      try {
        enrollments = await api.getEnrollments();
        console.log('✅ Enrollments fetched:', enrollments?.length || 0);
      } catch (err: any) {
        console.error('❌ Error fetching Enrollments:', err);
        enrollments = [];
      }

      try {
        assessments = await api.getAssessments();
        console.log('✅ Assessments fetched:', assessments?.length || 0);
      } catch (err: any) {
        console.error('❌ Error fetching Assessments:', err);
        assessments = [];
      }

      // Ensure all responses are arrays (defensive programming)
      programOutcomes = Array.isArray(programOutcomes) ? programOutcomes : [];
      poAchievements = Array.isArray(poAchievements) ? poAchievements : [];
      enrollments = Array.isArray(enrollments) ? enrollments : [];
      assessments = Array.isArray(assessments) ? assessments : [];

      console.log('📊 Summary:', {
        programOutcomes: programOutcomes.length,
        poAchievements: poAchievements.length,
        enrollments: enrollments.length,
        assessments: assessments.length
      });

      console.log('🔍 First PO:', programOutcomes[0]);
      console.log('🔍 First Achievement:', poAchievements[0]);

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
      
      console.log('📈 Stats:', {
        totalPOs: programOutcomes.length,
        activePOs: activePOs.length,
        achievements: poAchievements.length
      });

      // If no active POs, show all POs (fallback)
      const POsToShow = activePOs.length > 0 ? activePOs : programOutcomes;
      console.log('✅ POs to show:', POsToShow.length);

      // Transform to POData format
      const poDataList: POData[] = POsToShow.map(po => {
        // Find student's achievement for this PO
        const achievement = poAchievements.find(a => {
          // Try both number and string comparison
          const poId = typeof po.id === 'string' ? parseInt(po.id) : po.id;
          const achievementPoId = typeof a.program_outcome === 'string' ? parseInt(a.program_outcome) : a.program_outcome;
          return achievementPoId === poId;
        });
        console.log(`PO ${po.code} (id: ${po.id}, type: ${typeof po.id}):`, 
          achievement ? `Found (achievement PO id: ${achievement.program_outcome}, type: ${typeof achievement.program_outcome})` : 'Not found');
        
        // Convert Decimal strings to numbers
        const current = achievement ? Number(achievement.achievement_percentage) : 0;
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

        // Find courses that contribute to this PO
        // Get all assessments related to this PO
        const relatedAssessments = assessments.filter(a => {
          if (!a.related_pos) return false;
          // Handle both array and single value
          const relatedPosArray = Array.isArray(a.related_pos) ? a.related_pos : [a.related_pos];
          return relatedPosArray.some((posId: any) => {
            const posIdNum = typeof posId === 'string' ? parseInt(posId) : posId;
            const poIdNum = typeof po.id === 'string' ? parseInt(po.id) : po.id;
            return posIdNum === poIdNum;
          });
        });

        console.log(`PO ${po.code}: Found ${relatedAssessments.length} related assessments`);

        // Get unique course IDs from assessments
        // Assessment.course is a number (course ID)
        const assessmentCourseIds = new Set(
          relatedAssessments
            .map(a => {
              // Handle both number and object (for safety)
              if (typeof a.course === 'object' && a.course !== null) {
                return (a.course as any).id;
              }
              return typeof a.course === 'string' ? parseInt(a.course) : a.course;
            })
            .filter((id): id is number => typeof id === 'number' && !isNaN(id))
        );
        
        console.log(`PO ${po.code}: Assessment course IDs:`, Array.from(assessmentCourseIds));

        // Get contributing courses from enrollments
        // Enrollment.course is a number (course ID)
        const contributingCourses = enrollments
          .filter(e => {
            // Handle both number and object (for safety)
            let enrollmentCourseId: number | null = null;
            if (typeof e.course === 'object' && e.course !== null) {
              enrollmentCourseId = (e.course as any).id;
            } else if (typeof e.course === 'string') {
              enrollmentCourseId = parseInt(e.course);
            } else if (typeof e.course === 'number') {
              enrollmentCourseId = e.course;
            }
            
            if (enrollmentCourseId === null || isNaN(enrollmentCourseId)) {
              return false;
            }
            
            const matches = assessmentCourseIds.has(enrollmentCourseId);
            if (matches) {
              console.log(`PO ${po.code}: Found matching course for enrollment`, e.course_code, `(ID: ${enrollmentCourseId})`);
            }
            return matches;
          })
          .map(e => e.course_code || '')
          .filter((code): code is string => !!code && code !== '')
          .filter((code, index, self) => self.indexOf(code) === index); // Remove duplicates
        
        console.log(`PO ${po.code}: Contributing courses:`, contributingCourses);

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

      console.log('✅ Final PO Data List:', poDataList.length, 'items');
      
      // Always show POs if they exist, even without achievements
      if (poDataList.length === 0 && POsToShow.length > 0) {
        console.warn('⚠️ POs exist but no data was created. Creating fallback data...');
        const fallbackData: POData[] = POsToShow.map(po => {
          // Try to find achievement even if matching failed
          const achievement = poAchievements.find(a => {
            const aPoId = typeof a.program_outcome === 'string' ? parseInt(a.program_outcome) : a.program_outcome;
            const poId = typeof po.id === 'string' ? parseInt(po.id) : po.id;
            return aPoId === poId;
          });
          
          return {
            code: po.code || 'PO',
            title: po.title || 'Program Outcome',
            description: po.description || '',
            target: Number(po.target_percentage) || 70,
            current: achievement ? Number(achievement.achievement_percentage) : 0,
            status: (achievement && Number(achievement.achievement_percentage) >= (Number(po.target_percentage) || 70)) 
              ? 'Achieved' as const 
              : 'Needs Attention' as const,
            courses: [],
            poId: po.id
          };
        });
        console.log('✅ Fallback data created:', fallbackData.length, 'items');
        setProgramOutcomesData(fallbackData);
      } else if (poDataList.length > 0) {
        console.log('✅ Setting PO data:', poDataList.length, 'items');
        setProgramOutcomesData(poDataList);
      } else if (programOutcomes.length === 0) {
        console.error('❌ No Program Outcomes available from API!');
        setError('Unable to load program outcomes. Please check your connection and try again.');
        setProgramOutcomesData([]);
      } else {
        console.error('❌ No PO data to display despite having POs!');
        // Last resort: create minimal data from programOutcomes
        const minimalData: POData[] = programOutcomes.map(po => ({
          code: po.code || 'PO',
          title: po.title || 'Program Outcome',
          description: po.description || '',
          target: Number(po.target_percentage) || 70,
          current: 0,
          status: 'Needs Attention' as const,
          courses: [],
          poId: po.id
        }));
        console.log('✅ Created minimal data:', minimalData.length, 'items');
        setProgramOutcomesData(minimalData);
      }
    } catch (err: any) {
      console.error('Failed to fetch outcomes data:', err);
      if (err.message?.includes('404') || err.message?.includes('No')) {
        setProgramOutcomesData([]);
      } else {
        setError(err.message || 'Failed to load outcomes data');
        setProgramOutcomesData([]);
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

  const overallAchievement = programOutcomesData.length > 0
    ? Math.round(programOutcomesData.reduce((sum, po) => sum + po.current, 0) / programOutcomesData.length)
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
  if (error && programOutcomesData.length === 0) {
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
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-6 border-b pb-4 border-gray-500/20"
      >
        <h1 className={`text-3xl font-bold ${whiteText} flex items-center gap-3`}>
          <Award className="w-7 h-7 text-yellow-500" />
          Program Outcomes Overview
        </h1>
        {programOutcomesData.length > 0 && (
          <div className="flex items-center gap-4">
              <span className={mutedText}>Overall PO Achievement:</span>
              <span className={`text-2xl font-extrabold ${overallAchievement >= 75 ? 'text-green-500' : 'text-orange-500'}`}>
                  {overallAchievement}%
              </span>
          </div>
        )}
      </motion.div>

      {/* PO Listesi - Always show grid structure */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {programOutcomesData.length > 0 ? (
          programOutcomesData.map((po, index) => {
          const achievementRatio = po.current / po.target;
          const isTargetAchieved = po.current >= po.target;
          
          // Doughnut Chart Verisi
          const data = {
            labels: ['Achieved', 'Remaining'],
            datasets: [{
              data: [po.current, Math.max(0, 100 - po.current)], // Max 100 olmalı
              backgroundColor: [
                isTargetAchieved ? '#10B981' : '#3B82F6', // Yeşil veya Mavi
                isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', // Arka Plan
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

              {/* Chart ve Hedef Metrikleri */}
              <div className="flex items-center gap-4 py-4 border-y border-gray-500/20 my-4">
                <div className="w-28 h-28 relative">
                  <Doughnut data={data} options={doughnutOptions(isDark, mutedText)} />
                  <div className={`absolute inset-0 flex items-center justify-center`}>
                    <span className={`text-xl font-extrabold ${whiteText}`}>{po.current}%</span>
                  </div>
                </div>
                
                {/* Metrikler */}
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
                            {isTargetAchieved ? `+${po.current - po.target}%` : `-${po.target - po.current}%`}
                        </span>
                    </div>
                </div>
              </div>
              
              {/* İlgili Dersler */}
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
          })
        ) : (
          /* Empty State - Show empty card structure */
          !loading && !error && (
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

              {/* Chart placeholder */}
              <div className="flex items-center gap-4 py-4 border-y border-gray-500/20 my-4">
                <div className="w-28 h-28 relative flex items-center justify-center">
                  <div className={`w-full h-full rounded-full border-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`}></div>
                  <div className={`absolute inset-0 flex items-center justify-center`}>
                    <span className={`text-xl font-extrabold ${mutedText}`}>-</span>
                  </div>
                </div>
                
                {/* Empty metrics */}
                <div className="flex-1 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className={mutedText}>Target:</span>
                        <span className={`font-semibold ${mutedText}`}>-</span>
                    </div>
                    <div className="flex justify-between">
                        <span className={mutedText}>Status:</span>
                        <span className={`font-semibold ${mutedText}`}>-</span>
                    </div>
                    <div className="flex justify-between">
                        <span className={mutedText}>Performance Gap:</span>
                        <span className={`font-semibold ${mutedText}`}>-</span>
                    </div>
                </div>
              </div>
              
              {/* Empty courses */}
              <div className="mt-auto pt-4">
                  <h3 className={`text-sm font-semibold ${mutedText} flex items-center gap-1 mb-2`}>
                      <BookOpen className="w-4 h-4" /> Contributing Courses:
                  </h3>
                  <p className={`text-xs ${mutedText}`}>No courses available</p>
              </div>
            </motion.div>
          )
        )}
      </motion.div>
    </div>
  );
}