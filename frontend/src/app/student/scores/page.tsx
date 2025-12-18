'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  FileText,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, type Enrollment, type Assessment, type LearningOutcome, type ProgramOutcome, type StudentGrade, type AssessmentLO, type LOPO } from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

interface CourseScoreData {
  course: {
    id: number;
    code: string;
    name: string;
  };
  assessments: Array<{
    id: string;
    label: string;
    score: number;
    maxScore: number;
    percentage: number;
    weights: Record<string, number>; // LO ID -> weight
  }>;
  los: Array<{
    id: string;
    label: string;
    score: number;
    poWeights: Record<string, number>; // PO ID -> weight
    title?: string;
    description?: string;
    target?: number;
  }>;
  pos: Array<{
    id: string;
    label: string;
    score: number;
    title?: string;
    description?: string;
    target?: number;
  }>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScoresPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseData, setCourseData] = useState<CourseScoreData | null>(null);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [studentDepartment, setStudentDepartment] = useState<string | null>(null);

  const { isDark, themeClasses, mutedText, text } = useThemeColors();

  useEffect(() => {
    setMounted(true);
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchEnrollments();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (selectedCourseId && currentUserId) {
      fetchCourseScoreData(selectedCourseId);
    }
  }, [selectedCourseId, currentUserId]);

  const fetchCurrentUser = async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUserId(user.id);
      if (user.department) {
        setStudentDepartment(user.department);
      }
    } catch (err: any) {
      console.error('Failed to fetch current user:', err);
      setError('Failed to load user information');
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEnrollments();
      setEnrollments(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedCourseId(data[0].course);
      }
    } catch (err: any) {
      console.error('Failed to fetch enrollments:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseScoreData = async (courseId: number) => {
    try {
      setLoading(true);
      setError(null);

      let course, assessments, los, pos, grades, allAssessmentLOs, allLOPOs;
      
      if (!currentUserId) {
        const user = await api.getCurrentUser();
        setCurrentUserId(user.id);
      }
      const studentId = currentUserId;
      
      try {
        let userDepartment = studentDepartment;
        if (!userDepartment) {
          const user = await api.getCurrentUser();
          userDepartment = user.department || null;
          setStudentDepartment(userDepartment);
        }

        const results = await Promise.allSettled([
          api.getCourse(courseId),
          api.getAssessments({ course: courseId }),
          api.getLearningOutcomes({ course: courseId }),
          userDepartment 
            ? api.getProgramOutcomes({ department: userDepartment })
            : api.getProgramOutcomes(),
          studentId ? api.getGrades({ student: studentId }) : api.getGrades(),
          api.getAssessmentLOs(),
          api.getLOPOs(),
        ]);

        course = results[0].status === 'fulfilled' ? results[0].value : null;
        assessments = results[1].status === 'fulfilled' ? (Array.isArray(results[1].value) ? results[1].value : []) : [];
        los = results[2].status === 'fulfilled' ? (Array.isArray(results[2].value) ? results[2].value : []) : [];
        pos = results[3].status === 'fulfilled' ? (Array.isArray(results[3].value) ? results[3].value : []) : [];
        grades = results[4].status === 'fulfilled' ? (Array.isArray(results[4].value) ? results[4].value : []) : [];
        allAssessmentLOs = results[5].status === 'fulfilled' ? (Array.isArray(results[5].value) ? results[5].value : []) : [];
        allLOPOs = results[6].status === 'fulfilled' ? (Array.isArray(results[6].value) ? results[6].value : []) : [];
      } catch (err) {
        console.error('Error fetching course data:', err);
        assessments = [];
        los = [];
        pos = [];
        grades = [];
        allAssessmentLOs = [];
        allLOPOs = [];
      }

      assessments = Array.isArray(assessments) ? assessments : [];
      los = Array.isArray(los) ? los : [];
      pos = Array.isArray(pos) ? pos : [];
      grades = Array.isArray(grades) ? grades : [];
      allAssessmentLOs = Array.isArray(allAssessmentLOs) ? allAssessmentLOs : [];
      allLOPOs = Array.isArray(allLOPOs) ? allLOPOs : [];

      const assessmentIds = assessments.map(a => Number(a.id));
      const assessmentLOs = allAssessmentLOs.filter(al => {
        const alAssessmentId = typeof al.assessment === 'object' && al.assessment !== null
          ? Number(al.assessment.id || al.assessment)
          : Number(al.assessment);
        return assessmentIds.includes(alAssessmentId);
      });

      const loIds = los.map(lo => Number(lo.id));
      const loPOs = allLOPOs.filter(lp => {
        const lpLoId = typeof lp.learning_outcome === 'object' && lp.learning_outcome !== null
          ? Number(lp.learning_outcome.id || lp.learning_outcome)
          : Number(lp.learning_outcome);
        return loIds.includes(lpLoId);
      });

      const connectedPOIds = new Set(loPOs.map(lp => lp.program_outcome));
      const filteredPOs = pos.filter(po => connectedPOIds.has(po.id));

      const processedData = processCourseData(
        course,
        assessments,
        los,
        filteredPOs.length > 0 ? filteredPOs : pos,
        grades,
        assessmentLOs,
        loPOs
      );

      setCourseData(processedData);
      
      if (assessments.length === 0 && los.length === 0 && pos.length === 0) {
        setError('No data available for this course. Please ensure assessments, learning outcomes, and program outcomes are configured.');
      } else if (assessmentLOs.length === 0 && loPOs.length === 0) {
        setError('No relationships configured. Please contact your instructor to configure mappings.');
      } else {
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch course data:', err);
      setError(err.message || 'Failed to load course data');
      setCourseData(null);
    } finally {
      setLoading(false);
    }
  };

  const processCourseData = (
    course: any,
    assessments: Assessment[],
    los: LearningOutcome[],
    pos: ProgramOutcome[],
    grades: StudentGrade[],
    assessmentLOs: AssessmentLO[],
    loPOs: LOPO[]
  ): CourseScoreData => {
    const assessmentData = assessments.map(assessment => {
      const assessmentId = Number(assessment.id);
      const grade = grades.find(g => Number(g.assessment) === assessmentId);
      const score = Number(grade?.score || 0);
      const maxScore = Number(assessment.max_score || 100);
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

      const weights: Record<string, number> = {};
      
      const relevantAssessmentLOs = assessmentLOs.filter(al => {
        const alAssessmentId = typeof al.assessment === 'object' && al.assessment !== null
          ? Number(al.assessment.id || al.assessment)
          : Number(al.assessment);
        return alAssessmentId === assessmentId;
      });
      
      relevantAssessmentLOs.forEach(al => {
        const loId = typeof al.learning_outcome === 'object' && al.learning_outcome !== null
          ? Number(al.learning_outcome.id || al.learning_outcome)
          : Number(al.learning_outcome);
        const weightStr = String(al.weight || '0');
        const rawWeight = parseFloat(weightStr);
        if (!isNaN(rawWeight) && rawWeight > 0) {
          const normalizedWeight = rawWeight / 10.0;
          weights[`lo-${loId}`] = normalizedWeight;
        }
      });

      return {
        id: `assessment-${assessment.id}`,
        label: assessment.title,
        score: Number(score),
        maxScore: Number(maxScore),
        percentage: Number(percentage),
        weights,
      };
    });

    const loData = los.map(lo => {
      const loId = Number(lo.id);
      
      let totalWeight = 0;
      let weightedSum = 0;

      assessmentLOs
        .filter(al => {
          const alLoId = typeof al.learning_outcome === 'object' && al.learning_outcome !== null
            ? Number(al.learning_outcome.id || al.learning_outcome)
            : Number(al.learning_outcome);
          return alLoId === loId;
        })
        .forEach(al => {
          const assessmentId = typeof al.assessment === 'object' && al.assessment !== null
            ? Number(al.assessment.id || al.assessment)
            : Number(al.assessment);
          const assessment = assessments.find(a => Number(a.id) === assessmentId);
          const grade = grades.find(g => {
            const gradeAssessmentId = typeof g.assessment === 'object' && g.assessment !== null
              ? Number(g.assessment.id || g.assessment)
              : Number(g.assessment);
            return gradeAssessmentId === assessmentId;
          });
          if (assessment && grade) {
            const rawWeight = typeof al.weight === 'string' ? parseFloat(al.weight) : Number(al.weight || 0);
            const normalizedWeight = rawWeight / 10.0;
            
            const assessmentMaxScore = Number(assessment.max_score || 100);
            const gradeScore = Number(grade.score || 0);
            const percentage = assessmentMaxScore > 0 
              ? (gradeScore / assessmentMaxScore) * 100 
              : 0;
            
            weightedSum += percentage * normalizedWeight;
            totalWeight += normalizedWeight;
          }
        });

      const loScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      const poWeights: Record<string, number> = {};
      const relevantLOPOs = loPOs.filter(lp => {
        const lpLoId = typeof lp.learning_outcome === 'object' ? lp.learning_outcome.id : Number(lp.learning_outcome);
        return lpLoId === loId;
      });
      
      relevantLOPOs.forEach(lp => {
        const poId = typeof lp.program_outcome === 'object' ? lp.program_outcome.id : Number(lp.program_outcome);
        const weightStr = String(lp.weight || '0');
        const weight = parseFloat(weightStr);
        if (!isNaN(weight) && weight > 0) {
          const normalizedWeight = weight / 10.0;
          poWeights[`po-${poId}`] = normalizedWeight;
        }
      });

      return {
        id: `lo-${lo.id}`,
        label: lo.code || `LO${lo.id}`,
        score: Number(loScore || 0),
        poWeights,
        title: lo.title || '',
        description: lo.description || '',
        target: Number(lo.target_percentage) || 70,
      };
    });

    const poData = pos.map(po => {
      let totalWeight = 0;
      let weightedSum = 0;

      loPOs
        .filter(lp => {
          const lpPoId = typeof lp.program_outcome === 'object' && lp.program_outcome !== null
            ? Number(lp.program_outcome.id || lp.program_outcome)
            : Number(lp.program_outcome);
          return lpPoId === Number(po.id);
        })
        .forEach(lp => {
          const lpLoId = typeof lp.learning_outcome === 'object' && lp.learning_outcome !== null
            ? Number(lp.learning_outcome.id || lp.learning_outcome)
            : Number(lp.learning_outcome);
          const lo = los.find(l => Number(l.id) === lpLoId);
          if (lo) {
            const loItem = loData.find(l => l.id === `lo-${lo.id}`);
            if (loItem) {
              const weightStr = String(lp.weight || '0');
              const weight = parseFloat(weightStr);
              if (!isNaN(weight) && weight > 0) {
                const normalizedWeight = weight / 10.0;
                weightedSum += loItem.score * normalizedWeight;
                totalWeight += normalizedWeight;
              }
            }
          }
        });

      const poScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      return {
        id: `po-${po.id}`,
        label: po.code || `PO${po.id}`,
        score: Number(poScore || 0),
        title: po.title || '',
        description: po.description || '',
        target: Number(po.target_percentage) || 70,
      };
    });

    return {
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
      },
      assessments: assessmentData,
      los: loData,
      pos: poData,
    };
  };

  const selectedCourse = enrollments.find(e => e.course === selectedCourseId);

  if (!mounted) {
    return null;
  }

  // Calculate KPI summaries
  const avgLO = courseData?.los.length ? courseData.los.reduce((sum, lo) => sum + lo.score, 0) / courseData.los.length : 0;
  const avgPO = courseData?.pos.length ? courseData.pos.reduce((sum, po) => sum + po.score, 0) / courseData.pos.length : 0;
  const avgAssessment = courseData?.assessments.length ? courseData.assessments.reduce((sum, a) => sum + a.percentage, 0) / courseData.assessments.length : 0;
  const targetMetLO = courseData?.los.filter(lo => lo.score >= (lo.target || 70)).length || 0;
  const totalLO = courseData?.los.length || 0;

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-4">
          Course Outcomes Summary
        </h1>
        <p className={mutedText}>
          View your assessment scores, learning outcomes, and program outcomes for the selected course
        </p>
      </div>

      {/* Course Selection */}
      <div className="mb-6">
        <div className="relative">
          <button
            onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
            className={`w-full md:w-96 ${themeClasses.card} p-4 rounded-xl shadow-lg flex items-center justify-between hover:shadow-xl transition-all`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <div className="text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">Selected Course</p>
                <p className={text}>
                  {selectedCourse 
                    ? `${selectedCourse.course_code || 'N/A'} - ${selectedCourse.course_name || 'Unknown'}`
                    : 'Select a course'
                  }
                </p>
              </div>
            </div>
            {isCourseDropdownOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {isCourseDropdownOpen && (
            <div className={`absolute top-full mt-2 w-full md:w-96 ${themeClasses.card} rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto`}>
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <button
                    key={enrollment.id}
                    onClick={() => {
                      setSelectedCourseId(enrollment.course);
                      setIsCourseDropdownOpen(false);
                    }}
                    className={`w-full text-left p-4 hover:bg-indigo-500/10 transition-colors ${
                      selectedCourseId === enrollment.course ? 'bg-indigo-500/20' : ''
                    }`}
                  >
                    <p className={text}>
                      {enrollment.course_code || 'N/A'} - {enrollment.course_name || 'Unknown'}
                    </p>
                    <p className={`text-sm ${mutedText}`}>
                      {enrollment.is_active ? 'Active' : 'Completed'}
                    </p>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className={mutedText}>No courses found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
            <p className={mutedText}>Loading course data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className={`${themeClasses.card} p-6 rounded-xl shadow-lg mb-6`}>
          <div className="flex items-center gap-3 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      {!loading && courseData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`${themeClasses.card} p-4 rounded-xl shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>Avg Assessment</p>
                <p className={`text-2xl font-bold ${text}`}>{avgAssessment.toFixed(1)}%</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className={`${themeClasses.card} p-4 rounded-xl shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>Avg Learning Outcome</p>
                <p className={`text-2xl font-bold ${text}`}>{avgLO.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className={`${themeClasses.card} p-4 rounded-xl shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>Avg Program Outcome</p>
                <p className={`text-2xl font-bold ${text}`}>{avgPO.toFixed(1)}%</p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className={`${themeClasses.card} p-4 rounded-xl shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>LOs Target Met</p>
                <p className={`text-2xl font-bold ${text}`}>{targetMetLO}/{totalLO}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
        </div>
      )}

      {/* Combined LO + PO Outcomes Table */}
      {!loading && courseData && (
        <div className={`${themeClasses.card} rounded-xl shadow-xl p-6`}>
          <h2 className={`text-2xl font-bold ${text} mb-6 flex items-center gap-2`}>
            <Target className="w-6 h-6 text-purple-500" />
            Learning Outcomes & Program Outcomes
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 font-semibold ${text}`}>Type</th>
                  <th className={`text-left py-3 px-4 font-semibold ${text}`}>Code</th>
                  <th className={`text-left py-3 px-4 font-semibold ${text}`}>Title</th>
                  <th className={`text-center py-3 px-4 font-semibold ${text}`}>Score</th>
                  <th className={`text-center py-3 px-4 font-semibold ${text}`}>Target</th>
                  <th className={`text-center py-3 px-4 font-semibold ${text}`}>Status</th>
                  <th className={`text-center py-3 px-4 font-semibold ${text}`}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {/* Learning Outcomes */}
                {courseData.los.map((lo) => {
                  const score = Number(lo.score || 0);
                  const target = lo.target || 70;
                  const targetMet = score >= target;
                  const statusColor = score >= 90 ? 'text-green-500' : score >= target ? 'text-blue-500' : 'text-red-500';
                  
                  return (
                    <tr key={lo.id} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'} hover:${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                          LO
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-medium ${text}`}>{lo.label}</td>
                      <td className={`py-3 px-4 ${text}`}>{lo.title || '-'}</td>
                      <td className={`py-3 px-4 text-center font-bold ${statusColor}`}>
                        {score.toFixed(1)}%
                      </td>
                      <td className={`py-3 px-4 text-center ${text}`}>{target}%</td>
                      <td className="py-3 px-4 text-center">
                        {targetMet ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                          <div
                            className={`h-2 rounded-full ${
                              score >= 90 ? 'bg-green-500' : score >= target ? 'bg-blue-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(score, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Program Outcomes */}
                {courseData.pos.map((po) => {
                  const score = Number(po.score || 0);
                  const target = po.target || 70;
                  const targetMet = score >= target;
                  const statusColor = score >= 90 ? 'text-green-500' : score >= target ? 'text-blue-500' : 'text-red-500';
                  
                  return (
                    <tr key={po.id} className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'} hover:${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                          PO
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-medium ${text}`}>{po.label}</td>
                      <td className={`py-3 px-4 ${text}`}>{po.title || '-'}</td>
                      <td className={`py-3 px-4 text-center font-bold ${statusColor}`}>
                        {score.toFixed(1)}%
                      </td>
                      <td className={`py-3 px-4 text-center ${text}`}>{target}%</td>
                      <td className="py-3 px-4 text-center">
                        {targetMet ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                          <div
                            className={`h-2 rounded-full ${
                              score >= 90 ? 'bg-green-500' : score >= target ? 'bg-blue-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(score, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {courseData.los.length === 0 && courseData.pos.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className={mutedText}>No outcomes available for this course</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
