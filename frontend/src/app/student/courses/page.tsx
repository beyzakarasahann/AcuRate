// app/student/courses/page.tsx
'use client';

import { motion } from 'framer-motion';
import { BookOpen, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import Link from 'next/link';
import { api, type Enrollment, type StudentGrade, type StudentPOAchievement, type Assessment } from '@/lib/api';

// --- YARDIMCI FONKSİYONLAR ve Sabitler (Aynı kalır) ---

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};



// Course data interface
interface CourseData {
  id: string;
  name: string;
  semester: string;
  instructor: string;
  finalGrade: string | number;
  currentGrade: number;
  poAchievement: number;
  status: string;
  credits: number;
  feedback: string;
  courseId: number;
}

// --- ANA BİLEŞEN: COURSES PAGE ---

export default function CoursesPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coursesData, setCoursesData] = useState<CourseData[]>([]);
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState('semester');
  const [sortOrder, setSortOrder] = useState('desc'); 

  useEffect(() => {
    setMounted(true);
    fetchCoursesData();
  }, []);

  const fetchCoursesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch enrollments, grades, assessments, and PO achievements
      // Use empty arrays as fallback if API fails
      let enrollments: Enrollment[] = [];
      let allGrades: StudentGrade[] = [];
      let poAchievements: StudentPOAchievement[] = [];
      let allAssessments: Assessment[] = [];

      try {
        [enrollments, allGrades, poAchievements, allAssessments] = await Promise.all([
          api.getEnrollments(),
          api.getGrades(),
          api.getPOAchievements(),
          api.getAssessments()
        ]);
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        // If enrollments fail, show empty state
        if (apiError.message?.includes('enrollment') || apiError.message?.includes('500')) {
          setCoursesData([]);
          setLoading(false);
          return;
        }
        // For other errors, continue with empty arrays
      }

      // Ensure all responses are arrays (defensive programming)
      enrollments = Array.isArray(enrollments) ? enrollments : [];
      allGrades = Array.isArray(allGrades) ? allGrades : [];
      poAchievements = Array.isArray(poAchievements) ? poAchievements : [];
      allAssessments = Array.isArray(allAssessments) ? allAssessments : [];

      // Remove duplicate enrollments by course ID AND course name (keep first occurrence)
      const uniqueEnrollments = enrollments.filter((enrollment, index, self) => {
        const courseId = typeof enrollment.course === 'object' && enrollment.course !== null
          ? (enrollment.course as any).id
          : typeof enrollment.course === 'string'
          ? parseInt(enrollment.course)
          : enrollment.course;
        
        const courseName = enrollment.course_name || '';
        
        // Check both course ID and course name to avoid duplicates
        return index === self.findIndex(e => {
          const eCourseId = typeof e.course === 'object' && e.course !== null
            ? (e.course as any).id
            : typeof e.course === 'string'
            ? parseInt(e.course)
            : e.course;
          const eCourseName = e.course_name || '';
          
          // Match by course ID OR by course name (if names are the same, treat as duplicate)
          return eCourseId === courseId || (courseName && eCourseName && courseName.toLowerCase().trim() === eCourseName.toLowerCase().trim());
        });
      });

      // Transform enrollments to course data
      const courses: CourseData[] = uniqueEnrollments.map((enrollment) => {
        // Get grades for this course
        const courseGrades = allGrades.filter(grade => {
          const assessment = allAssessments.find(a => a.id === grade.assessment);
          return assessment && assessment.course === enrollment.course;
        });

        // Calculate current grade from assessments
        let currentGrade = 0;
        if (courseGrades.length > 0) {
          let totalWeightedScore = 0;
          let totalWeight = 0;
          
          courseGrades.forEach(grade => {
            const assessment = allAssessments.find(a => a.id === grade.assessment);
            if (assessment) {
              const weight = assessment.weight || 0;
              const score = (grade.score / grade.max_score) * 100;
              totalWeightedScore += score * weight;
              totalWeight += weight;
            }
          });
          
          if (totalWeight > 0) {
            currentGrade = totalWeightedScore / totalWeight;
          }
        }

        // Get PO achievement for this course (average of related POs)
        // Find assessments for this course
        const courseAssessments = allAssessments.filter(a => a.course === enrollment.course);
        
        // Get all PO IDs related to this course's assessments
        const coursePOIds = new Set<number>();
        courseAssessments.forEach(assessment => {
          if (assessment.related_pos) {
            assessment.related_pos.forEach((poId: number) => coursePOIds.add(poId));
          }
        });

        // Filter PO achievements that match this course's POs
        const coursePOs = poAchievements.filter(po => {
          let poId: number | undefined;
          if (typeof po.program_outcome === 'number') {
            poId = po.program_outcome;
          } else if (typeof po.program_outcome === 'object' && po.program_outcome !== null && 'id' in po.program_outcome) {
            poId = (po.program_outcome as { id: number }).id;
          }
          return poId !== undefined && coursePOIds.has(poId);
        });

        const poAchievement = coursePOs.length > 0
          ? coursePOs.reduce((sum, po) => sum + (po.achievement_percentage || 0), 0) / coursePOs.length
          : 0;

        // Determine status
        const status = enrollment.is_active ? 'In Progress' : 'Completed';

        // Get final grade or current grade
        const finalGrade = enrollment.final_grade !== null && enrollment.final_grade !== undefined
          ? enrollment.final_grade
          : '-';

        // Format semester (from academic_year if available)
        const semester = enrollment.course_name || 'N/A';

        // Get feedback from latest grade
        const latestGrade = courseGrades.length > 0 
          ? courseGrades[courseGrades.length - 1]
          : null;
        const feedback = latestGrade?.feedback || 'No feedback available yet.';

        return {
          id: enrollment.course_code || `COURSE-${enrollment.course}`,
          name: enrollment.course_name || 'Unknown Course',
          semester: semester,
          instructor: enrollment.course_name || '-', // Will be updated when course details are available
          finalGrade: finalGrade,
          currentGrade: Math.round(currentGrade * 10) / 10,
          poAchievement: Math.round(poAchievement * 10) / 10,
          status: status,
          credits: 0, // Will be updated when course details are available
          feedback: feedback,
          courseId: enrollment.course
        };
      });

      // Fetch course details to get instructor and credits
      const coursesWithDetails = await Promise.all(
        courses.map(async (course) => {
          try {
            const courseDetail = await api.getCourse(course.courseId);
            return {
              ...course,
              instructor: courseDetail.teacher_name || '-',
              credits: courseDetail.credits || 0,
              semester: `${courseDetail.semester || ''} ${courseDetail.academic_year || ''}`.trim() || course.semester
            };
          } catch {
            return course;
          }
        })
      );

      setCoursesData(coursesWithDetails);
    } catch (err: any) {
      console.error('Failed to fetch courses data:', err);
      // Don't show error if it's just no data
      if (err.message?.includes('404') || err.message?.includes('No')) {
        setCoursesData([]);
      } else {
        setError(err.message || 'Failed to load courses data');
        setCoursesData([]);
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


  // Filtreleme, Sıralama Mantığı (Aynı kalır)
  const filteredCourses = coursesData.filter(course => {
    if (filter === 'all') return true;
    return course.status.toLowerCase().includes(filter);
  });

  const sortedCourses = filteredCourses.sort((a, b) => {
    let aValue: string | number, bValue: string | number;
    let comparison = 0;

    const standardizedKey = sortKey.toLowerCase().replace(/[\s\.]/g, '').replace('poach', 'poAchievement');

    switch (standardizedKey) {
        case 'currentgrade':
            aValue = a.currentGrade;
            bValue = b.currentGrade;
            comparison = (aValue as number) - (bValue as number);
            break;
        case 'poachievement':
            aValue = a.poAchievement;
            bValue = b.poAchievement;
            comparison = (aValue as number) - (bValue as number);
            break;
        case 'semester': 
        default:
            aValue = a.semester;
            bValue = b.semester;
            if (aValue < bValue) comparison = -1;
            else if (aValue > bValue) comparison = 1;
            break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (header: string) => {
    const key = header.toLowerCase().replace(/[\s\.]/g, '').replace('poach', 'poAchievement');
    
    if (sortKey === key) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortOrder('desc'); 
    }
  };

  const getSortIndicator = (header: string) => {
    const key = header.toLowerCase().replace(/[\s\.]/g, '').replace('poach', 'poAchievement');
    if (sortKey !== key) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };


  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={mutedText}>Loading courses...</p>
        </div>
      </div>
    );
  }

  // Error state - only show if there's a real error, not just no data
  if (error && coursesData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`text-center p-6 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error}</p>
          <button
            onClick={fetchCoursesData}
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
      {/* Başlık ve Kontroller */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-6"
      >
        <h1 className={`text-3xl font-bold ${whiteText} flex items-center gap-3`}>
          <BookOpen className="w-7 h-7 text-indigo-500" />
          My Courses
        </h1>
      </motion.div>

      {/* Dersler Tablosu veya Empty State */}
      {coursesData.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className={`overflow-hidden ${themeClasses.card} rounded-xl shadow-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
        >
          <table className="min-w-full divide-y divide-gray-700/20">
          <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
            <tr>
              {/* Dinamik sıralama başlıkları */}
              {['Course', 'Instructor'].map(header => (
                <th
                  key={header}
                  onClick={() => handleSort(header)}
                  className={`px-6 py-3 text-left text-xs font-medium ${mutedText} uppercase tracking-wider cursor-pointer transition-colors hover:text-indigo-400`}
                >
                  {header} {getSortIndicator(header)}
                </th>
              ))}
            </tr>
          </thead>
          <motion.tbody
            className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-200'}`}
          >
            {sortedCourses.map((course, index) => {

              return (
                <motion.tr
                  key={course.id}
                  variants={item}
                  whileHover={{ scale: 1.01, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
                  className="transition-all duration-150"
                >
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${whiteText}`}>
                    {course.name} <span className={mutedText}>({course.id})</span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${mutedText}`}>{course.instructor}</td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
        
          {/* Sayfa Alt Bilgisi - Filtered Results Empty */}
          {filteredCourses.length === 0 && (
              <div className={`p-6 text-center ${mutedText}`}>
                  No courses found matching the filter criteria.
              </div>
          )}
        </motion.div>
      ) : (
        /* Empty State - No Courses */
        !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-12 text-center ${themeClasses.card.replace('shadow-2xl', 'shadow-lg')} rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
          >
            <BookOpen className={`w-16 h-16 mx-auto mb-4 ${mutedText} opacity-50`} />
            <h3 className={`text-xl font-semibold ${whiteText} mb-2`}>No Courses Available</h3>
            <p className={mutedText}>
              You are not currently enrolled in any courses.
            </p>
          </motion.div>
        )
      )}
    </div>
  );
}