// app/teacher/analytics/page.tsx
'use client';

import { motion } from 'framer-motion';
import { BarChart3, Users, Target, BookOpen, AlertTriangle, Loader2, TrendingUp, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { api, type Course, type StudentLOAchievement, type StudentPOAchievement, type User, type LearningOutcome } from '@/lib/api';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend, 
    PointElement, 
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Chart.js'i gerekli elemanlarla kaydetme
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement, 
  LineElement,
  Filler
);

// --- TYPES ---

interface StudentAnalytics {
  student: User;
  loAchievements: StudentLOAchievement[];
  poAchievements: StudentPOAchievement[];
  avgLO: number;
  avgPO: number;
}

interface CourseAnalytics {
  course: Course;
  students: StudentAnalytics[];
  avgLOAchievement: number;
  avgPOAchievement: number;
}

// --- ANA BİLEŞEN ---

export default function TeacherAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [loAchievements, setLOAchievements] = useState<StudentLOAchievement[]>([]);
  const [poAchievements, setPOAchievements] = useState<StudentPOAchievement[]>([]);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseAnalytics(selectedCourse);
    }
  }, [selectedCourse]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load teacher dashboard to get courses
      const dashboardData = await api.getTeacherDashboard();
      const teacherCourses = dashboardData.courses || [];
      setCourses(teacherCourses);
      
      if (teacherCourses.length > 0) {
        setSelectedCourse(teacherCourses[0].id);
      }

      // Load all LO achievements for teacher's courses (will be loaded per course)
      setLOAchievements([]);

      // Load all PO achievements
      const allPOAchievements = await api.getPOAchievements();
      setPOAchievements(allPOAchievements);

      // Load students from enrollments for all courses
      const allStudents = new Map<number, User>();
      for (const course of teacherCourses) {
        try {
          const enrollments = await api.getEnrollments({ course: course.id });
          enrollments.forEach((enrollment: any) => {
            if (enrollment.is_active !== false && enrollment.student) {
              const student = typeof enrollment.student === 'object' 
                ? enrollment.student 
                : { id: enrollment.student } as User;
              const studentId = typeof student === 'object' ? student.id : student;
              if (studentId && !allStudents.has(studentId)) {
                allStudents.set(studentId, student);
              }
            }
          });
        } catch (err) {
          console.error(`Error loading enrollments for course ${course.id}:`, err);
        }
      }
      setStudents(Array.from(allStudents.values()));

    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      let errorMessage = 'Failed to load analytics data';
      if (err && typeof err === 'object') {
        if (err.message && typeof err.message === 'string') {
          errorMessage = err.message;
        } else if (err.error && typeof err.error === 'string') {
          errorMessage = err.error;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseAnalytics = async (courseId: number) => {
    try {
      // Get enrollments for this course to get students
      const enrollments = await api.getEnrollments({ course: courseId });
      
      // Extract student IDs from enrollments - ONLY actual STUDENT role users
      const studentIds = new Set<number>();
      
      enrollments.forEach((e: any) => {
        if (e.is_active !== false && e.student) {
          const studentId = typeof e.student === 'object' ? e.student.id : e.student;
          
          // Skip super admin or non-student users - SUPER ADMIN IS NOT A STUDENT!
          if (e.student_name && (
            e.student_name.toLowerCase().includes('super admin') || 
            e.student_name.toLowerCase().includes('superadmin') ||
            e.student_name.toLowerCase().includes('admin')
          )) {
            return; // Skip super admin - they are NOT students!
          }
          
          // If student object exists, check role and superuser flags
          if (typeof e.student === 'object' && e.student !== null) {
            if (e.student.role !== 'STUDENT' || e.student.is_superuser || e.student.is_staff) {
              return; // Skip non-student users - super admin is NOT a student!
            }
          }
          
          if (studentId) {
            studentIds.add(studentId);
          }
        }
      });

      // Fetch all students and filter by IDs and role - EXCLUDE super admin and non-students
      let courseStudents: User[] = [];
      try {
        const allStudents = await api.getUsers({ role: 'STUDENT' });
        courseStudents = allStudents.filter((s: User) => {
          // Must be actual student role and active
          if (s.role !== 'STUDENT' || s.is_active === false) {
            return false;
          }
          // Exclude super admin accounts (they might have is_superuser flag)
          if (s.is_superuser || s.is_staff) {
            return false;
          }
          // Check username doesn't contain admin keywords
          const usernameLower = (s.username || '').toLowerCase();
          if (usernameLower.includes('superadmin') || usernameLower.includes('super_admin') || usernameLower.includes('admin')) {
            return false;
          }
          // Must be in our student IDs set
          return studentIds.has(s.id);
        });
        
        // Add any missing students with minimal info
        studentIds.forEach(studentId => {
          if (!courseStudents.find(s => s.id === studentId)) {
            const enrollment = enrollments.find((e: any) => {
              const eStudentId = typeof e.student === 'object' ? e.student.id : e.student;
              return eStudentId === studentId;
            });
            courseStudents.push({
              id: studentId,
              username: enrollment?.student_name || `student_${studentId}`,
              email: '',
              first_name: '',
              last_name: '',
              role: 'STUDENT',
              role_display: 'Student',
              is_active: true,
              created_at: '',
              updated_at: '',
              student_id: enrollment?.student_id || undefined
            } as User);
          }
        });
      } catch (err) {
        console.error('Error fetching students:', err);
        // Fallback: create minimal student objects from enrollments (only if student is actually a student)
        enrollments.forEach((e: any) => {
          if (e.is_active !== false && e.student) {
            const studentId = typeof e.student === 'object' ? e.student.id : e.student;
            // Skip if student is super admin or not a student
            if (e.student_name && (e.student_name.toLowerCase().includes('super admin') || e.student_name.toLowerCase().includes('superadmin'))) {
              return;
            }
            if (studentId && !courseStudents.find(s => s.id === studentId)) {
              courseStudents.push({
                id: studentId,
                username: e.student_name || `student_${studentId}`,
                email: '',
                first_name: '',
                last_name: '',
                role: 'STUDENT',
                role_display: 'Student',
                is_active: true,
                created_at: '',
                updated_at: '',
                student_id: e.student_id || undefined
              } as User);
            }
          }
        });
      }

      // Get LO achievements for this course
      const courseLOAchievements = await api.getLOAchievements({ course: courseId });
      console.log(`LO Achievements loaded for course ${courseId}:`, courseLOAchievements.length, courseLOAchievements);
      
      // Get Learning Outcomes for this course from backend
      const courseLOs = await api.getLearningOutcomes({ course: courseId });
      console.log(`Learning Outcomes loaded for course ${courseId}:`, courseLOs.length, courseLOs);
      setLearningOutcomes(courseLOs);
      
      // Get all PO achievements for students in this course
      // PO achievements are not course-specific, so we get all and filter by student IDs
      const studentIdsArray = Array.from(studentIds);
      let allPOAchievements: StudentPOAchievement[] = [];
      
      // Try to get PO achievements for each student
      for (const studentId of studentIdsArray) {
        try {
          const studentPOs = await api.getPOAchievements({ student: studentId });
          allPOAchievements.push(...studentPOs);
        } catch (err) {
          console.error(`Error loading PO achievements for student ${studentId}:`, err);
        }
      }
      
      // If no PO achievements found for specific students, try getting all but filter by student IDs
      if (allPOAchievements.length === 0) {
        try {
          const allPOs = await api.getPOAchievements();
          // Filter to only include PO achievements for students in this course
          allPOAchievements = allPOs.filter(po => {
            let poStudentId: number | undefined;
            if (typeof po.student === 'object' && po.student !== null) {
              poStudentId = po.student.id;
            } else if (typeof po.student === 'number') {
              poStudentId = po.student;
            }
            return poStudentId !== undefined && studentIds.has(poStudentId);
          });
        } catch (err) {
          console.error('Error loading all PO achievements:', err);
        }
      } else {
        // Also filter the loaded PO achievements to ensure only course students are included
        allPOAchievements = allPOAchievements.filter(po => {
          let poStudentId: number | undefined;
          if (typeof po.student === 'object' && po.student !== null) {
            poStudentId = po.student.id;
          } else if (typeof po.student === 'number') {
            poStudentId = po.student;
          }
          return poStudentId !== undefined && studentIds.has(poStudentId);
        });
      }
      
      console.log('PO Achievements loaded (filtered):', allPOAchievements.length, allPOAchievements);

      // Build student analytics
      const studentAnalytics: StudentAnalytics[] = courseStudents.map((student: User) => {
        const studentId = typeof student === 'object' ? student.id : student;
        
        // Filter LO achievements for this student
        const studentLOs = courseLOAchievements.filter(lo => {
          const loStudentId = typeof lo.student === 'object' ? lo.student?.id : lo.student;
          const match = Number(loStudentId) === Number(studentId);
          if (match) {
            console.log(`LO Achievement matched for student ${studentId}:`, lo);
          }
          return match;
        });
        
        console.log(`Student ${studentId} has ${studentLOs.length} LO achievements:`, studentLOs);

        // Filter PO achievements for this student - check both student field formats
        // EXCLUDE super admin achievements
        const studentPOs = allPOAchievements.filter(po => {
          // Skip if PO achievement belongs to super admin
          if (po.student_name && (
            po.student_name.toLowerCase().includes('super admin') || 
            po.student_name.toLowerCase().includes('superadmin') ||
            po.student_name.toLowerCase().includes('admin')
          )) {
            return false;
          }
          
          // PO student can be object or number
          let poStudentId: number | undefined;
          if (typeof po.student === 'object' && po.student !== null) {
            poStudentId = po.student.id;
            // Also check if student object has superuser flag
            if (po.student.is_superuser || po.student.is_staff) {
              return false;
            }
          } else if (typeof po.student === 'number') {
            poStudentId = po.student;
          }
          
          // Must match current student ID
          const match = poStudentId !== undefined && Number(poStudentId) === Number(studentId);
          
          // Also check student_name field as backup (but skip if it's admin)
          if (!match && po.student_name) {
            const studentName = typeof student === 'object' 
              ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username
              : '';
            if (po.student_name === studentName || po.student_name?.includes(studentName) || studentName?.includes(po.student_name || '')) {
              return true;
            }
          }
          
          if (match) {
            console.log(`PO Achievement matched for student ${studentId}:`, po);
          }
          return match;
        });
        
        console.log(`Student ${studentId} has ${studentPOs.length} PO achievements:`, studentPOs);

        // Calculate avgLO - only include LOs with actual data (percentage > 0)
        let avgLO = 0;
        const validLOs = studentLOs.filter(lo => {
          const percentage = Number(lo.current_percentage || 0);
          return percentage > 0;
        });
        
        if (validLOs.length > 0) {
          avgLO = validLOs.reduce((sum, lo) => {
            const percentage = Number(lo.current_percentage || 0);
            console.log(`LO Achievement percentage:`, { lo_code: lo.lo_code, current_percentage: lo.current_percentage, percentage });
            return sum + percentage;
          }, 0) / validLOs.length;
        }
        
        console.log(`Calculated avgLO for student ${studentId}:`, avgLO, `from ${validLOs.length} valid LOs (out of ${studentLOs.length} total)`);

        // PO achievement calculation - only include POs with actual data (percentage > 0)
        let avgPO = 0;
        const validPOs = studentPOs.filter(po => {
          let value = 0;
          if (po.achievement_percentage !== undefined && po.achievement_percentage !== null) {
            value = Number(po.achievement_percentage);
          } else if (po.current_percentage !== undefined && po.current_percentage !== null) {
            value = Number(po.current_percentage);
          }
          return value > 0;
        });
        
        if (validPOs.length > 0) {
          const total = validPOs.reduce((sum, po) => {
            // Try achievement_percentage first (from serializer), then current_percentage
            let value = 0;
            if (po.achievement_percentage !== undefined && po.achievement_percentage !== null) {
              value = Number(po.achievement_percentage);
            } else if (po.current_percentage !== undefined && po.current_percentage !== null) {
              value = Number(po.current_percentage);
            }
            console.log(`PO value for calculation:`, { achievement_percentage: po.achievement_percentage, current_percentage: po.current_percentage, calculated: value });
            return sum + value;
          }, 0);
          avgPO = total / validPOs.length;
          console.log(`Calculated avgPO for student ${studentId}:`, avgPO, `from ${validPOs.length} valid POs (out of ${studentPOs.length} total)`);
        } else {
          console.log(`No valid PO achievements found for student ${studentId}`);
        }

        return {
          student: typeof student === 'object' ? student : { id: student } as User,
          loAchievements: studentLOs,
          poAchievements: studentPOs,
          avgLO,
          avgPO
        };
      });

      // Calculate avgLOAchievement - only include students with valid LO data (avgLO > 0)
      const studentsWithValidLO = studentAnalytics.filter(s => s.avgLO > 0);
      const avgLOAchievement = studentsWithValidLO.length > 0
        ? studentsWithValidLO.reduce((sum, s) => sum + s.avgLO, 0) / studentsWithValidLO.length
        : 0;

      // Calculate avgPOAchievement - only include students with valid PO data (avgPO > 0)
      const studentsWithValidPO = studentAnalytics.filter(s => s.avgPO > 0);
      const avgPOAchievement = studentsWithValidPO.length > 0
        ? studentsWithValidPO.reduce((sum, s) => sum + s.avgPO, 0) / studentsWithValidPO.length
        : 0;

      // Find the course object
      const course = courses.find(c => c.id === courseId);
      if (!course) {
        console.error(`Course ${courseId} not found`);
        return;
      }

      const analytics: CourseAnalytics = {
        course: course,
        students: studentAnalytics,
        avgLOAchievement,
        avgPOAchievement
      };

      setCourseAnalytics([analytics]);
    } catch (err) {
      console.error('Error loading course analytics:', err);
    }
  };

  const { 
    isDark, 
    mounted: themeMounted, 
    themeClasses, 
    text, 
    mutedText 
  } = useThemeColors(); 

  if (!mounted || !themeMounted) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
            <p className={mutedText}>Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className={`${themeClasses.card} p-6 rounded-xl`}>
          <div className="flex items-center gap-3 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentAnalytics = courseAnalytics.find(ca => ca.course.id === selectedCourse);
  const whiteText = text;

  // Prepare chart data for LO achievements
  const getLOChartData = () => {
    if (!currentAnalytics || currentAnalytics.students.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Use LO data from backend (learningOutcomes state)
    // If no backend LO data, fallback to extracting from achievements
    let allLOs: LearningOutcome[] = [];
    if (learningOutcomes.length > 0) {
      // Use backend LO data
      allLOs = learningOutcomes.filter(lo => lo.is_active !== false);
    } else {
      // Fallback: Extract LO codes from achievements (shouldn't happen if backend works correctly)
      const allLOsMap = new Map<number, { id: number; code: string; title?: string }>();
      currentAnalytics.students.forEach(s => {
        s.loAchievements.forEach(loAchievement => {
          if (typeof loAchievement.learning_outcome === 'object' && loAchievement.learning_outcome) {
            const lo = loAchievement.learning_outcome;
            const loId = lo.id || 0;
            if (!allLOsMap.has(loId)) {
              allLOsMap.set(loId, {
                id: loId,
                code: lo.code || `LO-${loId}`,
                title: lo.title
              });
            }
          } else if (typeof loAchievement.learning_outcome === 'number') {
            const loId = loAchievement.learning_outcome;
            if (!allLOsMap.has(loId)) {
              allLOsMap.set(loId, {
                id: loId,
                code: loAchievement.lo_code || `LO-${loId}`,
                title: loAchievement.lo_title
              });
            }
          }
        });
      });
      // Convert map to array format compatible with LearningOutcome
      allLOs = Array.from(allLOsMap.values()).map(lo => ({
        id: lo.id,
        code: lo.code,
        title: lo.title || '',
        description: '',
        course: selectedCourse || 0,
        target_percentage: 70,
        is_active: true,
        created_at: '',
        updated_at: ''
      })) as LearningOutcome[];
    }

    // Sort LOs by code for consistent display
    const sortedLOs = [...allLOs].sort((a, b) => a.code.localeCompare(b.code));
    const loCodes = sortedLOs.map(lo => lo.code);

    const labels = currentAnalytics.students.map(s => {
      const student = s.student;
      return typeof student === 'object' 
        ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username
        : `Student ${s.student}`;
    });

    // Create a dataset for each LO
    const datasets = loCodes.map((loCode, index) => {
      const colors = [
        'rgba(99, 102, 241, 0.8)',   // purple
        'rgba(59, 130, 246, 0.8)',   // blue
        'rgba(16, 185, 129, 0.8)',   // green
        'rgba(251, 191, 36, 0.8)',   // yellow
        'rgba(249, 115, 22, 0.8)',   // orange
        'rgba(239, 68, 68, 0.8)',    // red
        'rgba(168, 85, 247, 0.8)',   // violet
        'rgba(236, 72, 153, 0.8)',   // pink
      ];
      const borderColors = [
        'rgb(99, 102, 241)',
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(251, 191, 36)',
        'rgb(249, 115, 22)',
        'rgb(239, 68, 68)',
        'rgb(168, 85, 247)',
        'rgb(236, 72, 153)',
      ];
      
      const colorIndex = index % colors.length;
      
      // Find LO object for this code
      const loObject = sortedLOs.find(lo => lo.code === loCode);
      const loId = loObject?.id;

      const data = currentAnalytics.students.map(s => {
        // Try to find LO achievement by LO ID first, then by code
        const studentLO = s.loAchievements.find(loAchievement => {
          if (loId) {
            // Match by ID if available
            const achievementLOId = typeof loAchievement.learning_outcome === 'object' 
              ? loAchievement.learning_outcome?.id
              : loAchievement.learning_outcome;
            if (achievementLOId && Number(achievementLOId) === Number(loId)) {
              return true;
            }
          }
          // Fallback: match by code
          const loCodeFromAchievement = typeof loAchievement.learning_outcome === 'object' 
            ? loAchievement.learning_outcome?.code || loAchievement.lo_code
            : loAchievement.lo_code || `LO-${loAchievement.learning_outcome || 'unknown'}`;
          return loCodeFromAchievement === loCode;
        });
        return studentLO ? Number(studentLO.current_percentage || 0) : 0;
      });

      return {
        label: loCode,
        data: data,
        backgroundColor: colors[colorIndex],
        borderColor: borderColors[colorIndex],
        borderWidth: 2
      };
    });

    // If no LOs found, show average
    if (datasets.length === 0) {
      const loData = currentAnalytics.students.map(s => s.avgLO);
      return {
        labels,
        datasets: [{
          label: 'Average LO Achievement (%)',
          data: loData,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 2
        }]
      };
    }

    return {
      labels,
      datasets
    };
};

  // Prepare chart data for PO achievements
  const getPOChartData = () => {
    if (!currentAnalytics || currentAnalytics.students.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = currentAnalytics.students.map(s => {
      const student = s.student;
      return typeof student === 'object' 
        ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username
        : `Student ${s.student}`;
    });

    const poData = currentAnalytics.students.map(s => s.avgPO);

    return {
      labels,
        datasets: [
            {
          label: 'Average PO Achievement (%)',
          data: poData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
                borderWidth: 2
            }
        ]
    };
};

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { 
            labels: { color: mutedText, boxWidth: 12, boxHeight: 12 },
            position: 'top' as const
        },
        tooltip: {
            bodyColor: isDark ? '#FFF' : '#000',
            titleColor: isDark ? '#FFF' : '#000',
            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            max: 100,
        title: { display: true, text: 'Achievement (%)', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText, stepSize: 20 }
        },
        x: {
            grid: { display: false },
            ticks: { color: mutedText }
        }
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className={`text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-4 flex items-center gap-3`}>
          <BarChart3 className="w-8 h-8" />
          Student Analytics
        </h1>
        <p className={mutedText}>
          Analyze student Learning Outcome (LO) and Program Outcome (PO) achievements
        </p>
      </motion.div>

      {/* Course Selection */}
      {courses.length > 0 && (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${themeClasses.card} rounded-xl shadow-xl p-6 mb-6`}
        >
          <label className={`${mutedText} text-sm font-medium mb-2 block flex items-center gap-2`}>
            <BookOpen className="w-4 h-4" />
            Select Course
          </label>
          <select
            value={selectedCourse || ''}
            onChange={(e) => setSelectedCourse(Number(e.target.value) || null)}
            className={`w-full md:w-1/2 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">-- Select a course --</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name} ({course.semester_display} {course.academic_year})
              </option>
            ))}
          </select>
        </motion.div>
      )}

      {/* Analytics Content */}
      {selectedCourse && currentAnalytics ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${themeClasses.card} rounded-xl shadow-xl p-6`}>
          <div className="flex items-center justify-between mb-2">
            <p className={mutedText}>Total Students</p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
              <p className={`text-3xl font-extrabold ${whiteText}`}>
                {currentAnalytics.students.length}
          </p>
          </div>

            <div className={`${themeClasses.card} rounded-xl shadow-xl p-6`}>
          <div className="flex items-center justify-between mb-2">
                <p className={mutedText}>Avg LO Achievement</p>
                <Target className="w-5 h-5 text-purple-500" />
          </div>
              <p className={`text-3xl font-extrabold ${whiteText}`}>
                {currentAnalytics.avgLOAchievement > 0 
                  ? `${currentAnalytics.avgLOAchievement.toFixed(1)}%` 
                  : 'N/A'}
              </p>
            </div>

            <div className={`${themeClasses.card} rounded-xl shadow-xl p-6`}>
              <div className="flex items-center justify-between mb-2">
                <p className={mutedText}>Avg PO Achievement</p>
                <Award className="w-5 h-5 text-green-500" />
              </div>
              <p className={`text-3xl font-extrabold ${whiteText}`}>
                {currentAnalytics.avgPOAchievement > 0 
                  ? `${currentAnalytics.avgPOAchievement.toFixed(1)}%` 
                  : 'N/A'}
              </p>
            </div>
      </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LO Achievement Chart */}
            <div className={`${themeClasses.card} rounded-xl shadow-xl p-6 h-[400px]`}>
            <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                <Target className="w-5 h-5 text-purple-500" />
                Learning Outcome Achievements
            </h2>
            <div className="h-[300px]">
                {currentAnalytics.students.length > 0 ? (
                  <Bar data={getLOChartData()} options={barChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className={mutedText}>No LO achievement data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* PO Achievement Chart */}
            <div className={`${themeClasses.card} rounded-xl shadow-xl p-6 h-[400px]`}>
            <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                <Award className="w-5 h-5 text-green-500" />
                Program Outcome Achievements
            </h2>
            <div className="h-[300px]">
                {currentAnalytics.students.length > 0 ? (
                  <Bar data={getPOChartData()} options={barChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className={mutedText}>No PO achievement data available</p>
                  </div>
                )}
              </div>
            </div>
      </div>

          {/* Student Details Table */}
          <div className={`${themeClasses.card} rounded-xl shadow-xl overflow-hidden`}>
            <div className="p-6 border-b border-gray-500/20">
              <h2 className={`text-xl font-bold ${whiteText} flex items-center gap-2`}>
                <Users className="w-5 h-5 text-blue-500" />
                Student Details
          </h2>
              </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${text}`}>Student</th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${text}`}>LO Achievement</th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${text}`}>PO Achievement</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAnalytics.students.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={`px-6 py-12 text-center ${mutedText}`}>
                        No student data available for this course
                      </td>
                    </tr>
                  ) : (
                    currentAnalytics.students.map((studentAnalytics, index) => {
                      const student = studentAnalytics.student;
                      const studentName = typeof student === 'object'
                        ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username
                        : `Student ${student}`;
                      const studentId = typeof student === 'object' ? student.student_id : '';

                      return (
                        <tr key={index} className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                          <td className={`px-6 py-4 ${text}`}>
                            <div>
                              <div className="font-medium">{studentName}</div>
                              {studentId && (
                                <div className={`text-xs ${mutedText}`}>ID: {studentId}</div>
                              )}
              </div>
                          </td>
                          <td className={`px-6 py-4 ${text}`}>
                            <div className="flex flex-col gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold w-fit ${
                                studentAnalytics.avgLO >= 80 
                                  ? isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
                                  : studentAnalytics.avgLO >= 70
                                  ? isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                                  : isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                              }`}>
                                Avg: {studentAnalytics.avgLO > 0 ? `${studentAnalytics.avgLO.toFixed(1)}%` : 'N/A'}
                              </span>
                              {(() => {
                                // Use backend LO data to show all LOs for this course, even if student has no achievement yet
                                const displayLOs = learningOutcomes.length > 0 
                                  ? learningOutcomes.filter(lo => lo.is_active !== false).sort((a, b) => a.code.localeCompare(b.code))
                                  : studentAnalytics.loAchievements.map(lo => {
                                      // Fallback: create LO-like object from achievement
                                      const loCode = typeof lo.learning_outcome === 'object' 
                                        ? lo.learning_outcome?.code || lo.lo_code || `LO-${lo.learning_outcome?.id || 'unknown'}`
                                        : lo.lo_code || `LO-${lo.learning_outcome || 'unknown'}`;
                                      return {
                                        id: typeof lo.learning_outcome === 'object' ? lo.learning_outcome?.id : lo.learning_outcome || 0,
                                        code: loCode,
                                        title: typeof lo.learning_outcome === 'object' ? lo.learning_outcome?.title : lo.lo_title || ''
                                      };
                                    });

                                if (displayLOs.length > 0) {
                                  return (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {displayLOs.map((lo, loIdx) => {
                                        // Find achievement for this LO
                                        const loAchievement = studentAnalytics.loAchievements.find(loAch => {
                                          const achLOId = typeof loAch.learning_outcome === 'object' 
                                            ? loAch.learning_outcome?.id
                                            : loAch.learning_outcome;
                                          const achLOCode = typeof loAch.learning_outcome === 'object' 
                                            ? loAch.learning_outcome?.code || loAch.lo_code
                                            : loAch.lo_code || `LO-${loAch.learning_outcome || 'unknown'}`;
                                          return (lo.id && achLOId && Number(achLOId) === Number(lo.id)) || achLOCode === lo.code;
                                        });
                                        const percentage = loAchievement ? Number(loAchievement.current_percentage || 0) : 0;
                                        return (
                                          <span
                                            key={loIdx}
                                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                                              percentage >= 80
                                                ? isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
                                                : percentage >= 70
                                                ? isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                                                : percentage > 0
                                                ? isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                                                : isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-500'
                                            }`}
                                            title={`${lo.code}${lo.title ? ` - ${lo.title}` : ''}: ${percentage.toFixed(1)}%`}
                                          >
                                            {lo.code}: {percentage > 0 ? `${percentage.toFixed(0)}%` : 'N/A'}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  );
                                } else {
                                  return <span className={`text-xs ${mutedText}`}>No LO data</span>;
                                }
                              })()}
              </div>
                          </td>
                          <td className={`px-6 py-4 ${text}`}>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              studentAnalytics.avgPO >= 80 
                                ? isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
                                : studentAnalytics.avgPO >= 70
                                ? isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                                : isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                            }`}>
                              {studentAnalytics.avgPO > 0 ? `${studentAnalytics.avgPO.toFixed(1)}%` : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              </div>
          </div>
      </motion.div>
      ) : (
        <div className={`${themeClasses.card} rounded-xl shadow-xl p-12 text-center`}>
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className={`text-xl ${text} mb-2`}>
            {courses.length === 0 ? 'No Courses Available' : 'Select a Course'}
          </p>
          <p className={mutedText}>
            {courses.length === 0 
              ? 'You don\'t have any courses assigned. Please contact your administrator.'
              : 'Please select a course from the dropdown above to view student analytics.'}
          </p>
        </div>
      )}
    </div>
  );
}
