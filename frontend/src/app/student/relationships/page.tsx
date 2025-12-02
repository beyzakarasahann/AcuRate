// app/student/relationships/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Network, Award, BookOpen, Target, TrendingUp, Loader2, AlertTriangle, BarChart3 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { 
  api, 
  TokenManager, 
  type ProgramOutcome, 
  type StudentPOAchievement, 
  type Course, 
  type Enrollment,
  type Assessment,
  type StudentGrade
} from '@/lib/api';

// Interfaces
interface CoursePOData {
  courseId: number;
  courseCode: string;
  courseName: string;
  poCode: string;
  poTitle: string;
  weight: number;
}

interface POWithScore {
  po: ProgramOutcome;
  score: number;
  achievement?: StudentPOAchievement;
}

interface CourseWithPOs {
  course: Course;
  pos: Array<{
    poCode: string;
    poTitle: string;
    weight: number;
  }>;
}

interface CourseAssessmentSummary {
  course: Course;
  midtermScore: number | null;
  midtermWeight: number;
  pretermScore: number | null;
  pretermWeight: number;
  finalScore: number | null; // CATO / overall
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

// --- ANA BİLEŞEN: RELATIONSHIPS PAGE ---

export default function RelationshipsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcome[]>([]);
  const [poAchievements, setPOAchievements] = useState<StudentPOAchievement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseDetails, setCourseDetails] = useState<CourseWithPOs[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchRelationshipsData();
  }, []);

  const fetchRelationshipsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check authentication
      const isAuthenticated = TokenManager.isAuthenticated();
      if (!isAuthenticated) {
        setError('Please log in to view relationships.');
        setLoading(false);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }

      // Fetch all required data
      let programOutcomesData: ProgramOutcome[] = [];
      let poAchievementsData: StudentPOAchievement[] = [];
      let coursesData: Course[] = [];
      let enrollmentsData: Enrollment[] = [];
      let assessmentsData: Assessment[] = [];
      let gradesData: StudentGrade[] = [];

      try {
        [
          programOutcomesData, 
          poAchievementsData, 
          coursesData, 
          enrollmentsData,
          assessmentsData,
          gradesData
        ] = await Promise.all([
          api.getProgramOutcomes(),
          api.getPOAchievements(),
          api.getCourses(),
          api.getEnrollments(),
          api.getAssessments(),
          api.getGrades()
        ]);
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        setError(apiError.message || 'Failed to load relationships data');
        setLoading(false);
        return;
      }

      // Ensure arrays
      programOutcomesData = Array.isArray(programOutcomesData) ? programOutcomesData : [];
      poAchievementsData = Array.isArray(poAchievementsData) ? poAchievementsData : [];
      coursesData = Array.isArray(coursesData) ? coursesData : [];
      enrollmentsData = Array.isArray(enrollmentsData) ? enrollmentsData : [];
      assessmentsData = Array.isArray(assessmentsData) ? assessmentsData : [];
      gradesData = Array.isArray(gradesData) ? gradesData : [];

      setProgramOutcomes(programOutcomesData);
      setPOAchievements(poAchievementsData);
      setCourses(coursesData);
      setEnrollments(enrollmentsData);
      setAssessments(assessmentsData);
      setGrades(gradesData);

      // Fetch detailed course information with PO relationships
      const enrolledCourseIds = enrollmentsData
        .map(e => e.course);

      const courseDetailsPromises = enrolledCourseIds.map(async (courseId) => {
        try {
          const courseDetail = await api.getCourse(courseId);
          return courseDetail;
        } catch (err) {
          console.error(`Failed to fetch course ${courseId}:`, err);
          return null;
        }
      });

      const courseDetailsResults = await Promise.all(courseDetailsPromises);
      const validCourseDetails = courseDetailsResults.filter(c => c !== null) as any[];

      // Transform course details to include PO relationships
      const coursesWithPOs: CourseWithPOs[] = validCourseDetails.map(course => {
        const pos = (course.program_outcomes || []).map((po: any) => {
          // Handle both string and number weights
          const weightValue = typeof po.weight === 'string' ? parseFloat(po.weight) : (po.weight || 1.0);
          return {
            poCode: po.po_code || po.program_outcome?.code || '',
            poTitle: po.po_title || po.program_outcome?.title || '',
            weight: weightValue
          };
        });

        return {
          course: course,
          pos: pos
        };
      });

      setCourseDetails(coursesWithPOs);

      // Varsayılan seçili dersi belirle (önce CSE311, yoksa ilk ders)
      const preferred = coursesWithPOs.find(c => c.course.code === 'CSE311');
      const firstCourse = preferred || coursesWithPOs[0];
      if (firstCourse) {
        setSelectedCourseCode(firstCourse.course.code);
      }
    } catch (err: any) {
      console.error('Failed to fetch relationships data:', err);
      setError(err.message || 'Failed to load relationships data');
    } finally {
      setLoading(false);
    }
  };

  const { isDark, themeClasses, text, mutedText } = useThemeColors();

  // Seçili ders
  const selectedCourse = useMemo(
    () => {
      if (!courseDetails || courseDetails.length === 0) return null;
      return courseDetails.find(c => c.course.code === selectedCourseCode) || courseDetails[0] || null;
    },
    [courseDetails, selectedCourseCode]
  );

  // Belirli bir ders için midterm / preterm / final özetini hesapla
  const selectedCourseSummary: CourseAssessmentSummary | null = useMemo(() => {
    if (!selectedCourse || !assessments || !grades || !enrollments) return null;

    const course = selectedCourse.course;
    const courseAssessments = assessments.filter(a => a.course === course.id);
    const courseEnrollment = enrollments.find(e => e.course === course.id) || null;

    const getAssessmentScore = (assessment: Assessment): number | null => {
      const grade = grades.find(g => g.assessment === assessment.id);
      if (!grade || !assessment.max_score) return null;
      return Number(grade.score) / Number(assessment.max_score) * 100;
    };

    const calcWeighted = (items: Assessment[]): { score: number | null; weight: number } => {
      if (items.length === 0) return { score: null, weight: 0 };
      let totalWeighted = 0;
      let totalWeight = 0;
      items.forEach(a => {
        const score = getAssessmentScore(a);
        const weight = Number(a.weight || 0);
        if (score != null && !Number.isNaN(weight)) {
          totalWeighted += score * weight;
          totalWeight += weight;
        }
      });
      if (totalWeight === 0) return { score: null, weight: 0 };
      return { score: totalWeighted / totalWeight, weight: totalWeight };
    };

    // Slayta yakın bir yapı: MIDTERM'ler = Midterm I & II, PRETERM = Attendance + Project
    const midtermItems = courseAssessments.filter(a => a.assessment_type === 'MIDTERM');
    const pretermItems = courseAssessments.filter(a => a.assessment_type !== 'MIDTERM');

    const midterm = calcWeighted(midtermItems);
    const preterm = calcWeighted(pretermItems);

    const finalScore = courseEnrollment?.final_grade != null
      ? Number(courseEnrollment.final_grade)
      : null;

    return {
      course,
      midtermScore: midterm.score,
      midtermWeight: midterm.weight,
      pretermScore: preterm.score,
      pretermWeight: preterm.weight,
      finalScore,
    };
  }, [selectedCourse, assessments, grades, enrollments]);

  if (!mounted) {
    return null;
  }

  // Combine PO data with achievements
  const poWithScores: POWithScore[] = programOutcomes.map(po => {
    const achievement = poAchievements.find(a => a.program_outcome === po.id);
    const score = achievement ? Math.round(achievement.current_percentage) : 0;
    return { po, score, achievement };
  });

  // Create course-PO matrix
  const coursePOMatrix: CoursePOData[] = [];
  courseDetails.forEach(courseWithPOs => {
    courseWithPOs.pos.forEach(po => {
      coursePOMatrix.push({
        courseId: courseWithPOs.course.id,
        courseCode: courseWithPOs.course.code,
        courseName: courseWithPOs.course.name,
        poCode: po.poCode,
        poTitle: po.poTitle,
        weight: po.weight
      });
    });
  });

  // Get unique courses and POs for matrix
  const uniqueCourses = Array.from(new Set(coursePOMatrix.map(c => c.courseCode))).sort();
  const uniquePOs = Array.from(new Set(coursePOMatrix.map(c => c.poCode))).sort();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={mutedText}>Loading relationships...</p>
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
            onClick={fetchRelationshipsData}
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
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b pb-4 border-gray-500/20"
      >
        <div className="flex items-center gap-3">
          <h1 className={`text-3xl font-bold ${text} flex items-center gap-3`}>
            <Network className="w-7 h-7 text-indigo-500" />
            Program Outcomes & Course Relationships
          </h1>
        </div>

        {/* Ders seçimi (özellikle CSE311 odağı için) */}
        {courseDetails.length > 0 && (
          <div className="flex items-center gap-3">
            <span className={`text-sm ${mutedText}`}>Course:</span>
            <select
              className="px-3 py-2 rounded-md bg-transparent border border-gray-500/40 text-sm"
              value={selectedCourse?.course.code || selectedCourseCode || ''}
              onChange={(e) => setSelectedCourseCode(e.target.value)}
            >
              {courseDetails.map(cd => (
                <option key={cd.course.id} value={cd.course.code}>
                  {cd.course.code} - {cd.course.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </motion.div>

      {/* Seçili ders için slayta benzer CSE311 yapısı */}
      {selectedCourse && selectedCourseSummary && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Course & CATO */}
          <motion.div
            variants={item}
            className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-lg lg:col-span-1`}
          >
            <p className={`text-xs uppercase tracking-wide ${mutedText} mb-1`}>Selected Course</p>
            <h2 className={`text-xl font-bold ${text}`}>
              {selectedCourseSummary.course.code} - {selectedCourseSummary.course.name}
            </h2>
            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <p className={`text-sm ${mutedText}`}>Final Score (CATO)</p>
                <p className="text-4xl font-extrabold text-indigo-500">
                  {selectedCourseSummary.finalScore != null ? selectedCourseSummary.finalScore.toFixed(1) : '-'}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xs ${mutedText}`}>[0-100]</p>
                <p className={`text-sm ${mutedText} mt-1`}>
                  Based on weighted Midterm & Preterm
                </p>
              </div>
            </div>
          </motion.div>

          {/* Midterm / Preterm kartları (slayttaki %60 / %40 yapısına benzer) */}
          <motion.div
            variants={item}
            className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-lg`}
          >
            <h3 className={`text-lg font-semibold ${text} flex items-center gap-2 mb-3`}>
              <Target className="w-5 h-5 text-indigo-400" />
              Midterm Model
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className={mutedText}>Weight</span>
                <span className={`${text} font-semibold`}>
                  {selectedCourseSummary.midtermWeight.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={mutedText}>Score</span>
                <span className={`${text} font-semibold`}>
                  {selectedCourseSummary.midtermScore != null ? selectedCourseSummary.midtermScore.toFixed(1) : '-'}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={item}
            className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-lg`}
          >
            <h3 className={`text-lg font-semibold ${text} flex items-center gap-2 mb-3`}>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Preterm / Project Model
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className={mutedText}>Weight</span>
                <span className={`${text} font-semibold`}>
                  {selectedCourseSummary.pretermWeight.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={mutedText}>Score</span>
                <span className={`${text} font-semibold`}>
                  {selectedCourseSummary.pretermScore != null ? selectedCourseSummary.pretermScore.toFixed(1) : '-'}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Program Outcomes Scores (Program Outcome #1, #2 vb. slayttaki yapı) */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mb-8"
      >
        <h2 className={`text-2xl font-bold ${text} mb-4 flex items-center gap-2`}>
          <Award className="w-6 h-6 text-indigo-500" />
          Program Outcomes Achievement
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {poWithScores.map((poData, index) => (
            <motion.div
              key={poData.po.id}
              variants={item}
              className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-lg`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-bold ${text} text-lg`}>
                  {poData.po.code}
                </h3>
                <div className={`text-3xl font-extrabold ${
                  poData.score >= 90 ? 'text-green-500' :
                  poData.score >= 70 ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {poData.score}
                </div>
              </div>
              <p className={`text-sm ${mutedText} mb-2`}>
                {poData.po.title}
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                <div
                  className={`h-2 rounded-full ${
                    poData.score >= 90 ? 'bg-green-500' :
                    poData.score >= 70 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(poData.score, 100)}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Course-PO Relationship Matrix */}
      {coursePOMatrix.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className={`text-2xl font-bold ${text} mb-4 flex items-center gap-2`}>
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            Course-Program Outcome Relationship Matrix
          </h2>
          <div className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-lg overflow-x-auto`}>
            <div className="min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`p-3 text-left border-b ${isDark ? 'border-white/10' : 'border-gray-200'} ${text} font-semibold`}>
                      Course
                    </th>
                    {uniquePOs.map(poCode => {
                      const po = programOutcomes.find(p => p.code === poCode);
                      return (
                        <th
                          key={poCode}
                          className={`p-3 text-center border-b ${isDark ? 'border-white/10' : 'border-gray-200'} ${text} font-semibold min-w-[100px]`}
                          title={po?.title || ''}
                        >
                          {poCode}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {uniqueCourses.map(courseCode => {
                    const course = courses.find(c => c.code === courseCode);
                    return (
                      <tr key={courseCode} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                        <td className={`p-3 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} ${text} font-medium`}>
                          <div>
                            <div className="font-semibold">{courseCode}</div>
                            {course && (
                              <div className={`text-xs ${mutedText}`}>
                                {course.name}
                              </div>
                            )}
                          </div>
                        </td>
                        {uniquePOs.map(poCode => {
                          const relationship = coursePOMatrix.find(
                            c => c.courseCode === courseCode && c.poCode === poCode
                          );
                          const weight = relationship ? relationship.weight : 0;
                          return (
                            <td
                              key={`${courseCode}-${poCode}`}
                              className={`p-3 text-center border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}
                            >
                              {weight > 0 ? (
                                <div className="flex flex-col items-center">
                                  <span className={`text-lg font-bold ${
                                    weight >= 1.5 ? 'text-green-500' :
                                    weight >= 1.0 ? 'text-yellow-500' :
                                    'text-blue-500'
                                  }`}>
                                    {weight.toFixed(1)}
                                  </span>
                                  <span className={`text-xs ${mutedText}`}>
                                    {weight >= 1.5 ? 'High' : weight >= 1.0 ? 'Medium' : 'Low'}
                                  </span>
                                </div>
                              ) : (
                                <span className={mutedText}>-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Course Details with PO Contributions */}
      {courseDetails.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className={`text-2xl font-bold ${text} mb-4 flex items-center gap-2`}>
            <BookOpen className="w-6 h-6 text-indigo-500" />
            Course Contributions to Program Outcomes
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courseDetails.map((courseWithPOs) => (
              <motion.div
                key={courseWithPOs.course.id}
                variants={item}
                className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-lg`}
              >
                <div className="mb-4">
                  <h3 className={`text-xl font-bold ${text} mb-1`}>
                    {courseWithPOs.course.code}
                  </h3>
                  <p className={`text-sm ${mutedText}`}>
                    {courseWithPOs.course.name}
                  </p>
                </div>
                {courseWithPOs.pos.length > 0 ? (
                  <div className="space-y-2">
                    {courseWithPOs.pos.map((po, index) => {
                      const poAchievement = poAchievements.find(
                        a => a.program_outcome === programOutcomes.find(p => p.code === po.poCode)?.id
                      );
                      const poScore = poAchievement ? Math.round(poAchievement.current_percentage) : 0;
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'} border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-semibold ${text}`}>
                              {po.poCode}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm ${mutedText}`}>
                                Weight: {po.weight.toFixed(1)}
                              </span>
                              {poAchievement && (
                                <span className={`text-sm font-bold ${
                                  poScore >= 90 ? 'text-green-500' :
                                  poScore >= 70 ? 'text-yellow-500' :
                                  'text-red-500'
                                }`}>
                                  {poScore}%
                                </span>
                              )}
                            </div>
                          </div>
                          <p className={`text-xs ${mutedText}`}>
                            {po.poTitle}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={mutedText}>No program outcomes mapped to this course.</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {courseDetails.length === 0 && poWithScores.length === 0 && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <Network className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className={mutedText}>No relationship data available.</p>
            <p className={`text-sm ${mutedText} mt-2`}>
              Enroll in courses to see their relationships with program outcomes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

