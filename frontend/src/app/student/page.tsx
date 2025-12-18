// app/student/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Award, BookOpen, Trophy, ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, type DashboardData, type Enrollment, type StudentPOAchievement, type StudentLOAchievement } from '@/lib/api';
import Link from 'next/link'; 
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Tooltip, 
    Legend, 
    PointElement, 
    LineElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Chart.js'i gerekli elemanlarla kaydetme
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  PointElement, 
  LineElement
);


// --- YARDIMCI FONKSİYONLAR VE SABİTLER ---

const getGradientColors = (colorClass: string) => {
    switch (colorClass) {
        case 'from-green-500 to-emerald-500': return { start: '#10B981', end: '#059669' };
        case 'from-blue-500 to-cyan-500': return { start: '#3B82F6', end: '#06B6D4' };
        case 'from-orange-500 to-red-500': return { start: '#F97316', end: '#EF4444' };
        case 'from-purple-500 to-pink-500': return { start: '#A855F7', end: '#EC4899' };
        default: return { start: '#6366F1', end: '#9333EA' };
    }
};

const lineOptions = (isDark: boolean, mutedText: string, min?: number, max?: number, yAxisLabel?: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: mutedText, boxWidth: 10, boxHeight: 10 } },
        tooltip: {
            bodyColor: isDark ? '#FFF' : '#000',
            titleColor: isDark ? '#FFF' : '#000',
            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        }
    },
    scales: {
        y: {
            beginAtZero: min === undefined,
            ...(min !== undefined && { min }),
            ...(max !== undefined && { max }),
            title: { display: true, text: yAxisLabel || 'Value', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText }
        },
        x: {
            title: { display: true, text: 'Period', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText }
        }
    }
});

const barOptions = (isDark: boolean, mutedText: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
        ticks: { color: mutedText, stepSize: 20 }
      },
      x: {
        grid: { display: false },
        ticks: { color: mutedText }
      }
    }
});


// Chart data functions will be generated dynamically


// --- ANA DASHBOARD BİLEŞENİ ---
export default function StudentHomePage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [allAssessments, setAllAssessments] = useState<any[]>([]);
  const [programOutcomes, setProgramOutcomes] = useState<any[]>([]);
  const [loAchievements, setLOAchievements] = useState<StudentLOAchievement[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<any[]>([]);
  
  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData?.recent_grades && dashboardData.recent_grades.length > 0) {
      fetchAssessmentsForGrades();
    }
  }, [dashboardData]);

  useEffect(() => {
    // Fetch all data needed for PO calculation (same as PO outcomes page)
    if (dashboardData?.po_achievements && dashboardData.po_achievements.length > 0) {
      fetchPOData();
    }
  }, [dashboardData]);

  useEffect(() => {
    // Fetch LO achievements data
    fetchLOData();
  }, []);

  const fetchAssessmentsForGrades = async () => {
    try {
      if (!dashboardData?.recent_grades) return;
      
      // Get unique assessment IDs from recent grades
      const assessmentIds = [...new Set(dashboardData.recent_grades.map(g => g.assessment))];
      
      // Fetch all assessments (we'll filter by IDs on frontend)
      const fetchedAssessments = await api.getAssessments();
      
      // Filter to only assessments we need
      const neededAssessments = fetchedAssessments.filter(a => assessmentIds.includes(a.id));
      setAssessments(neededAssessments);
    } catch (err) {
      console.error('Failed to fetch assessments:', err);
    }
  };

  const fetchPOData = async () => {
    try {
      // Fetch all data needed for PO calculation (same as PO outcomes page)
      const [programOutcomesData, assessmentsData] = await Promise.allSettled([
        api.getProgramOutcomes(),
        api.getAssessments()
      ]);

      if (programOutcomesData.status === 'fulfilled') {
        setProgramOutcomes(Array.isArray(programOutcomesData.value) ? programOutcomesData.value : []);
      }

      if (assessmentsData.status === 'fulfilled') {
        const fetchedAssessments = Array.isArray(assessmentsData.value) ? assessmentsData.value : [];
        setAllAssessments(fetchedAssessments);
      }
    } catch (err) {
      console.error('Failed to fetch PO data:', err);
    }
  };

  const fetchLOData = async () => {
    try {
      // Fetch LO achievements and learning outcomes
      const [loAchievementsData, learningOutcomesData] = await Promise.allSettled([
        api.getLOAchievements(),
        api.getLearningOutcomes()
      ]);

      if (loAchievementsData.status === 'fulfilled') {
        setLOAchievements(Array.isArray(loAchievementsData.value) ? loAchievementsData.value : []);
      }

      if (learningOutcomesData.status === 'fulfilled') {
        setLearningOutcomes(Array.isArray(learningOutcomesData.value) ? learningOutcomesData.value : []);
      }
    } catch (err) {
      console.error('Failed to fetch LO data:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStudentDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const { 
    isDark, 
    mounted: themeMounted, 
    accentStart, 
    accentEnd, 
    themeClasses, 
    mutedText, 
    text
  } = useThemeColors();

  if (!mounted || !themeMounted) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={mutedText}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`text-center p-6 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error || 'Failed to load dashboard data'}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extract data from backend
  const student = dashboardData.student;
  const enrollments = dashboardData.enrollments || [];
  const poAchievements = dashboardData.po_achievements || [];
  const recentGrades = dashboardData.recent_grades || [];
  const completedCourses = dashboardData.completed_courses || 0;

  // Calculate active courses - remove duplicates by course ID AND course name
  const activeCourses = enrollments
    .filter(e => e.is_active)
    .filter((enrollment, index, self) => {
      // Get course ID and name from enrollment
      const courseId = typeof enrollment.course === 'object' && enrollment.course !== null
        ? (enrollment.course as any).id
        : typeof enrollment.course === 'string'
        ? parseInt(enrollment.course)
        : enrollment.course;
      
      const courseName = enrollment.course_name || '';
      
      // Keep only first occurrence of each course (by ID OR by name if names match)
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

  // Calculate total PO achievement (same logic as PO outcomes page)
  // Build achievement map (same as PO outcomes page)
  const achievementMap = new Map<number, any>();
  poAchievements.forEach(a => {
    const poId = typeof a.program_outcome === 'string' ? parseInt(a.program_outcome) : 
                 (typeof a.program_outcome === 'object' && a.program_outcome?.id) ? 
                 (typeof a.program_outcome.id === 'string' ? parseInt(a.program_outcome.id) : a.program_outcome.id) :
                 a.program_outcome;
    if (poId) achievementMap.set(poId, a);
  });

  // Filter active POs (same as PO outcomes page)
  // Only process if programOutcomes is loaded
  const activePOs = programOutcomes && programOutcomes.length > 0 ? programOutcomes.filter(po => {
    if (po.is_active === undefined || po.is_active === null) return true;
    if (typeof po.is_active === 'string') {
      return po.is_active.toLowerCase() === 'true';
    }
    return po.is_active === true;
  }) : [];

  const POsToShow = activePOs.length > 0 ? activePOs : (programOutcomes || []);

  // Calculate hasData for each PO (same as PO outcomes page)
  // hasData = achievement exists OR has assessments
  // For dashboard, we'll check if achievement exists (simplified version)
  const posWithData = POsToShow.filter(po => {
    const poId = typeof po.id === 'string' ? parseInt(po.id) : po.id;
    const achievement = achievementMap.get(poId);
    
    // Check if PO has data: achievement exists
    // In PO outcomes page: hasData = !!achievement || courseIds.size > 0
    // For dashboard, we'll use a simplified version
    const hasAchievement = !!achievement && achievement.achievement_percentage !== null && achievement.achievement_percentage !== undefined;
    return hasAchievement;
  });
  
  // Calculate average using current_percentage (same as PO outcomes page uses 'current')
  const totalPOAchievement = posWithData.length > 0
    ? Math.round(posWithData.reduce((sum, po) => {
        const poId = typeof po.id === 'string' ? parseInt(po.id) : po.id;
        const achievement = achievementMap.get(poId);
        
        // Same as PO outcomes page: current = achievement ? Number(achievementValue) : 0
        const achievementValue = achievement?.achievement_percentage ?? achievement?.current_percentage ?? 0;
        const current = achievement ? Number(achievementValue) : 0;
        
        return sum + current;
      }, 0) / posWithData.length)
    : 0;


  // Calculate total LO achievement (similar to PO achievement)
  const loAchievementMap = new Map<number, StudentLOAchievement>();
  loAchievements.forEach(a => {
    const loId = typeof a.learning_outcome === 'string' ? parseInt(a.learning_outcome) : 
                 (typeof a.learning_outcome === 'object' && a.learning_outcome?.id) ? 
                 (typeof a.learning_outcome.id === 'string' ? parseInt(a.learning_outcome.id) : a.learning_outcome.id) :
                 a.learning_outcome;
    if (loId) loAchievementMap.set(loId, a);
  });

  // Filter active LOs
  const activeLOs = learningOutcomes && learningOutcomes.length > 0 ? learningOutcomes.filter(lo => {
    if (lo.is_active === undefined || lo.is_active === null) return true;
    if (typeof lo.is_active === 'string') {
      return lo.is_active.toLowerCase() === 'true';
    }
    return lo.is_active === true;
  }) : [];

  const LOsToShow = activeLOs.length > 0 ? activeLOs : (learningOutcomes || []);

  // Calculate hasData for each LO
  const losWithData = LOsToShow.filter(lo => {
    const loId = typeof lo.id === 'string' ? parseInt(lo.id) : lo.id;
    const achievement = loAchievementMap.get(loId);
    const hasAchievement = !!achievement && achievement.current_percentage !== null && achievement.current_percentage !== undefined;
    return hasAchievement;
  });

  // Calculate average LO achievement
  const totalLOAchievement = losWithData.length > 0
    ? Math.round(losWithData.reduce((sum, lo) => {
        const loId = typeof lo.id === 'string' ? parseInt(lo.id) : lo.id;
        const achievement = loAchievementMap.get(loId);
        const achievementValue = achievement?.current_percentage ?? achievement?.achievement_percentage ?? 0;
        const current = achievement ? Number(achievementValue) : 0;
        return sum + current;
      }, 0) / losWithData.length)
    : 0;

  // Find top PO (highest achievement)
  const topPO = poAchievements.length > 0
    ? poAchievements.reduce((top, current) => {
        const topAchievement = top.achievement_percentage || top.current_percentage || 0;
        const currentAchievement = current.achievement_percentage || current.current_percentage || 0;
        return currentAchievement > topAchievement ? current : top;
      })
    : null;

  // Get PO code and title from top PO achievement
  let topPODisplay = '-';
  if (topPO) {
    let poCode = topPO.po_code || topPO.program_outcome?.code || '';
    let poTitle = topPO.po_title || topPO.program_outcome?.title || '';
    
    // If not found, try to find it from programOutcomes list
    if ((!poCode || !poTitle) && programOutcomes.length > 0) {
      const poId = typeof topPO.program_outcome === 'string' 
        ? parseInt(topPO.program_outcome) 
        : (typeof topPO.program_outcome === 'object' && topPO.program_outcome?.id)
        ? (typeof topPO.program_outcome.id === 'string' ? parseInt(topPO.program_outcome.id) : topPO.program_outcome.id)
        : topPO.program_outcome;
      
      if (poId) {
        const po = programOutcomes.find(p => {
          const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
          return pId === poId;
        });
        if (po) {
          poCode = poCode || po.code || '';
          poTitle = poTitle || po.title || '';
        }
      }
    }
    
    // Format: Just show title (remove code)
    if (poTitle) {
      topPODisplay = poTitle;
    } else if (poCode) {
      topPODisplay = poCode;
    } else {
      topPODisplay = '-';
    }
  }

  // Student info
  const studentInfo = {
    name: student ? `${student.first_name} ${student.last_name}` : '-',
    studentId: student?.student_id || '-',
    major: student?.department || '-'
  };
  
  const performanceStats: Array<{
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'stable';
    icon: any;
    color: string;
  }> = [
    { title: 'Courses in Progress', value: activeCourses.length > 0 ? activeCourses.length.toString() : '0', change: '', trend: 'stable', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { title: 'Total PO Achievement', value: totalPOAchievement > 0 ? `${totalPOAchievement}%` : '-', change: '', trend: 'up', icon: Award, color: 'from-purple-500 to-pink-500' },
    { title: 'Total LO Achievement', value: totalLOAchievement > 0 ? `${totalLOAchievement}%` : '-', change: '', trend: 'up', icon: Award, color: 'from-green-500 to-emerald-500' },
    { title: 'Top Area', value: topPODisplay, change: '', trend: 'up', icon: Trophy, color: 'from-orange-500 to-red-500' }
  ];

  // Get course information for each grade using assessments and enrollments
  const getCourseForGrade = (grade: any) => {
    // Find assessment
    const assessment = assessments.find(a => a.id === grade.assessment);
    
    if (assessment) {
      // Assessment.course is a number (course ID)
      const courseId = typeof assessment.course === 'number' 
        ? assessment.course 
        : typeof assessment.course === 'string' 
        ? parseInt(assessment.course) 
        : null;
      
      if (courseId) {
        // Try to find course in enrollments (both active and completed)
        const enrollment = enrollments.find(e => {
          let eCourseId: number | null = null;
          if (typeof e.course === 'object' && e.course !== null) {
            eCourseId = (e.course as any).id;
          } else if (typeof e.course === 'number') {
            eCourseId = e.course;
          } else if (typeof e.course === 'string') {
            eCourseId = parseInt(e.course);
          }
          return eCourseId === courseId;
        });
        
        if (enrollment) {
          return {
            id: courseId,
            code: enrollment.course_code || assessment.course_code || 'Unknown',
            name: enrollment.course_name || assessment.course_name || 'Unknown Course'
          };
        }
        
        // If not found in enrollments, use assessment's course info if available
        if (assessment.course_code || assessment.course_name) {
          return {
            id: courseId,
            code: assessment.course_code || 'Unknown',
            name: assessment.course_name || 'Unknown Course'
          };
        }
      }
    }
    return null;
  };

  // Get unique courses from recent grades
  const coursesFromGrades = recentGrades
    .map(g => getCourseForGrade(g))
    .filter((course): course is { id: number; code: string; name: string } => course !== null);
  
  const uniqueCourses = Array.from(
    new Map(coursesFromGrades.map(c => [c.id, c])).values()
  );

  // Filter grades by selected course
  const filteredGrades = selectedCourse === 'all' 
    ? recentGrades.slice(0, 30) // Show more when all courses
    : recentGrades.filter(g => {
        const course = getCourseForGrade(g);
        return course && course.id.toString() === selectedCourse;
      });

  // Recent Grades Data - grouped by course
  const hasRecentGrades = filteredGrades.length > 0;
  
  // If filtering by specific course, show single line with course name
  // If showing all courses, group by course with different colors
  const courseColors = [
    { border: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.5)' },
    { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.5)' },
    { border: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.5)' },
    { border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.5)' },
    { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.5)' },
    { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.5)' },
  ];

  let recentGradesData: any = {
    labels: [],
    datasets: []
  };

  if (hasRecentGrades) {
    if (selectedCourse === 'all') {
      // Calculate weighted average for each course based on assessment weights
      // Use Map to ensure unique courses by course ID
      const courseWeightedScores = new Map<number, { 
        courseCode: string; 
        courseName: string; 
        totalWeightedScore: number;
        totalWeight: number;
        count: number;
      }>();
      
      // Track processed courses by ID and name to avoid duplicates
      const processedCoursesById = new Set<number>();
      const processedCoursesByName = new Set<string>();
      
      filteredGrades.forEach((g) => {
        const course = getCourseForGrade(g);
        if (!course) return;
        
        // Check if already processed by ID or by name
        const courseNameKey = (course.name || '').toLowerCase().trim();
        if (processedCoursesById.has(course.id) || processedCoursesByName.has(courseNameKey)) {
          return;
        }
        
        // Find assessment to get weight - check both assessments and allAssessments
        let assessment = assessments.find(a => a.id === g.assessment);
        if (!assessment) {
          assessment = allAssessments.find(a => a.id === g.assessment);
        }
        if (!assessment) return;
        
        if (!courseWeightedScores.has(course.id)) {
          courseWeightedScores.set(course.id, {
            courseCode: course.code,
            courseName: course.name,
            totalWeightedScore: 0,
            totalWeight: 0,
            count: 0
          });
          processedCoursesById.add(course.id);
          if (courseNameKey) {
            processedCoursesByName.add(courseNameKey);
          }
        }
        
        const courseData = courseWeightedScores.get(course.id)!;
        const weight = Number(assessment.weight || 0);
        const score = Number(g.score) || 0;
        const maxScore = Number(g.max_score) || Number(assessment.max_score) || 100;
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
        
        courseData.totalWeightedScore += percentage * weight;
        courseData.totalWeight += weight;
        courseData.count += 1;
      });

      // Calculate weighted average for each course
      // Remove duplicates by course name (keep first occurrence)
      const allCourseStats = Array.from(courseWeightedScores.entries()).map(([courseId, courseData]) => {
        const weightedAverage = courseData.totalWeight > 0
          ? courseData.totalWeightedScore / courseData.totalWeight
          : 0;
        
        return {
          courseId,
          courseCode: courseData.courseCode,
          courseName: courseData.courseName,
          average: Math.round(weightedAverage * 10) / 10,
          count: courseData.count
        };
      });
      
      // Filter duplicates by course name
      const courseStats = allCourseStats.filter((stat, index, self) => {
        const courseNameKey = (stat.courseName || '').toLowerCase().trim();
        return index === self.findIndex(s => 
          (s.courseName || '').toLowerCase().trim() === courseNameKey
        );
      }).sort((a, b) => b.average - a.average); // Sort by weighted average descending

      recentGradesData = {
        labels: courseStats.map(stat => {
          const name = stat.courseName.length > 20 ? stat.courseName.substring(0, 20) + '...' : stat.courseName;
          return `${stat.courseCode}\n${name}\n(${stat.count})`;
        }),
        datasets: [{
          label: 'Weighted Course Score',
          data: courseStats.map(stat => stat.average),
          backgroundColor: courseStats.map((_, index) => {
            const colors = [
              'rgba(99, 102, 241, 0.7)',
              'rgba(16, 185, 129, 0.7)',
              'rgba(168, 85, 247, 0.7)',
              'rgba(236, 72, 153, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(239, 68, 68, 0.7)',
            ];
            return colors[index % colors.length];
          }),
          borderColor: courseStats.map((_, index) => {
            const colors = [
              'rgb(99, 102, 241)',
              'rgb(16, 185, 129)',
              'rgb(168, 85, 247)',
              'rgb(236, 72, 153)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)',
            ];
            return colors[index % colors.length];
          }),
          borderWidth: 2,
          borderRadius: 6
        }]
      };
    } else {
      // Single course selected - show only that course's grades chronologically
      const selectedCourseInfo = uniqueCourses.find(c => c.id.toString() === selectedCourse);
      const courseGrades = filteredGrades
        .map(g => ({
          ...g,
          course: getCourseForGrade(g)
        }))
        .filter(g => g.course && g.course.id.toString() === selectedCourse)
        .sort((a, b) => {
          if (a.graded_at && b.graded_at) {
            return new Date(a.graded_at).getTime() - new Date(b.graded_at).getTime();
          }
          return 0;
        });

      recentGradesData = {
        labels: courseGrades.map((g) => {
          const assessmentTitle = g.assessment_title || 'Assessment';
          return assessmentTitle.length > 30 ? assessmentTitle.substring(0, 30) + '...' : assessmentTitle;
        }),
        datasets: [{
          label: selectedCourseInfo ? `${selectedCourseInfo.code} - ${selectedCourseInfo.name}` : 'Selected Course',
          data: courseGrades.map(g => Number(g.score) || 0),
            fill: false,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      };
    }
  }

  // PO Achievement Line Chart Data
  const hasPOData = poAchievements.length > 0;
  const poLineData = {
    labels: hasPOData ? poAchievements.map(po => po.po_code || 'PO') : [],
    datasets: [
      {
        label: 'Achievement (%)',
        data: hasPOData ? poAchievements.map(po => po.achievement_percentage || 0) : [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(99, 102, 241)',
        tension: 0.4,
        fill: true
      },
      ...(hasPOData ? [{
        label: 'Target (%)',
        data: poAchievements.map(po => po.target_percentage || 0),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(239, 68, 68)',
        tension: 0.4,
        fill: false
      }] : [])
    ]
  };

  // Course Grades Data (only if courses exist)
  const hasCourseData = activeCourses.length > 0;
  const courseGradesData = {
    labels: hasCourseData ? activeCourses.map(e => e.course_code || '-') : [],
    datasets: [{
        label: 'PO Achievement (%)',
        data: hasCourseData ? activeCourses.map(() => 0) : [], // TODO: Calculate from actual PO data
        backgroundColor: hasCourseData ? activeCourses.map(() => '#3B82F6') : [],
        borderColor: hasCourseData ? activeCourses.map(() => '#06B6D4') : [],
        borderWidth: 1
    }]
  };
  
  const whiteTextClass = text;
  const accentIconClass = isDark ? 'text-indigo-400' : 'text-indigo-600';
  const secondaryTextClass = mutedText;

  const dynamicBarOptions = barOptions(isDark, secondaryTextClass);
  const dynamicLineOptions = lineOptions(isDark, secondaryTextClass, 0, 100, 'Achievement (%)');
  const dynamicRecentGradesOptions = lineOptions(isDark, secondaryTextClass, 0, 100, 'Score');


  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Header (Minimal, Layout'taki büyük başlık yerine) */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-4 mb-8"
        >
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Welcome back, {studentInfo.name !== '-' ? studentInfo.name.split(' ')[0] : 'Student'}
            </h1>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
        >
            {performanceStats.map((stat, index) => {
                const { start, end } = getGradientColors(stat.color); 
                const isPOCard = stat.title === 'Total PO Achievement';
                const isLOCard = stat.title === 'Total LO Achievement';
                const isTopAreaCard = stat.title === 'Top Area';
                const isCoursesCard = stat.title === 'Courses in Progress';
                const isClickable = isPOCard || isLOCard || isTopAreaCard || isCoursesCard;
                
                const cardContent = (
                    <>
                        <div className="flex items-start justify-between mb-4">
                            <div
                                style={{ backgroundImage: `linear-gradient(to bottom right, ${start}, ${end})` }}
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg`}
                            >
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-500' : stat.trend === 'down' ? 'text-red-500' : 'text-yellow-500'}`}>
                                {stat.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                                {stat.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                                {stat.trend === 'stable' && <span className="text-gray-500">-</span>}
                                {stat.change !== '0' && stat.change}
                            </div>
                        </div>
                        <h3 className={`${secondaryTextClass} text-sm mb-1`}>{stat.title}</h3>
                        <p className={`text-3xl font-bold ${whiteTextClass}`}>{stat.value || '-'}</p>
                    </>
                );
                
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl hover:shadow-indigo-500/20 transition-all ${isClickable ? 'cursor-pointer' : ''}`}
                    >
                        {isPOCard ? (
                            <Link href="/student/po-outcomes" className="block">
                                {cardContent}
                            </Link>
                        ) : isLOCard ? (
                            <Link href="/student/lo-outcomes" className="block">
                                {cardContent}
                            </Link>
                        ) : isTopAreaCard ? (
                            <Link href="/student/strengths" className="block">
                                {cardContent}
                            </Link>
                        ) : isCoursesCard ? (
                            <Link href="/student/courses" className="block">
                                {cardContent}
                            </Link>
                        ) : (
                            cardContent
                        )}
                    </motion.div>
                );
            })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sol Sütun (Trend ve Radar) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Recent Grades Trend Line Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-96`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-xl font-bold ${whiteTextClass} flex items-center gap-2`}>
                        <TrendingUp className={`w-5 h-5 text-green-500`} />
                            Recent Grades Trend
                    </h2>
                        {uniqueCourses.length > 0 ? (
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className={`px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                                    isDark 
                                        ? 'bg-white/5 border-white/10 text-white' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            >
                                <option value="all">All Courses</option>
                                {uniqueCourses.map(course => (
                                    <option key={course.id} value={course.id.toString()}>
                                        {course.code} - {course.name.length > 40 ? course.name.substring(0, 40) + '...' : course.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className={`text-sm ${secondaryTextClass}`}>No courses available</p>
                        )}
                    </div>
                    <div className="h-72">
                        {hasRecentGrades ? (
                            selectedCourse === 'all' ? (
                                <Bar data={recentGradesData} options={dynamicBarOptions} />
                            ) : (
                                <Line data={recentGradesData} options={dynamicRecentGradesOptions} />
                            )
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className={secondaryTextClass}>
                                    {selectedCourse === 'all' 
                                        ? 'No recent grades available' 
                                        : 'No grades available for selected course'}
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Program Outcomes Achievement Line Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-96`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <Award className={`w-5 h-5 ${accentIconClass}`} />
                        Program Outcomes Achievement
                    </h2>
                    <div className="h-72">
                        {hasPOData ? (
                            <Line data={poLineData} options={dynamicLineOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className={secondaryTextClass}>No PO achievement data available</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Sağ Sütun (My Courses & Grades ve Alerts) */}
            <div className="space-y-6">

                {/* Notifications/Alerts */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Notifications
                    </h2>
                    <div className="space-y-2">
                        {poAchievements.length > 0 ? (
                            poAchievements
                                .filter(po => (po.achievement_percentage || 0) < (po.target_percentage || 0))
                                .slice(0, 2)
                                .map((po, index) => {
                                    const achievement = Number(po.achievement_percentage) || 0;
                                    const target = Number(po.target_percentage) || 0;
                                    return (
                                        <p key={index} className={`${secondaryTextClass} text-sm p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300`}>
                                            <strong>{po.po_code}</strong> PO Achievement is below target. Current: {achievement.toFixed(1)}%, Target: {target.toFixed(1)}%
                                        </p>
                                    );
                                })
                        ) : (
                            <p className={`${secondaryTextClass} text-sm p-3 rounded-xl ${isDark ? 'bg-gray-500/10 border-gray-500/30' : 'bg-gray-100 border-gray-200'}`}>
                                No notifications
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    </motion.div>
  );
}