// app/teacher/grades/page.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Save, Download, Upload, Filter, CheckCircle2, AlertCircle, User, BookOpen, Plus, X, Edit, TrendingUp, Info, Loader2, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, type Course, type Assessment, type Enrollment, type StudentGrade } from '@/lib/api';

// Assessment type seçenekleri (backend'deki AssessmentType ile uyumlu)
const assessmentTypes = [
  { value: 'MIDTERM', label: 'Midterm Exam' },
  { value: 'FINAL', label: 'Final Exam' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'HOMEWORK', label: 'Homework' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'LAB', label: 'Lab Work' },
  { value: 'PRESENTATION', label: 'Presentation' },
  { value: 'OTHER', label: 'Other' },
];

// --- ANA BİLEŞEN ---

export default function TeacherGradesPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Backend data
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [existingGrades, setExistingGrades] = useState<StudentGrade[]>([]);
  
  // UI state
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [grades, setGrades] = useState<Record<number, { score: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [showEditGrades, setShowEditGrades] = useState(false);
  const [showFeedbackRanges, setShowFeedbackRanges] = useState(false);
  const [editingGrades, setEditingGrades] = useState<Record<number, { score: string }>>({});
  const [feedbackRanges, setFeedbackRanges] = useState<Array<{ min_score: number; max_score: number; feedback: string }>>([
    { min_score: 90, max_score: 100, feedback: 'Excellent work! Outstanding performance.' },
    { min_score: 80, max_score: 89, feedback: 'Good job! Well done.' },
    { min_score: 70, max_score: 79, feedback: 'Satisfactory. Keep improving.' },
    { min_score: 60, max_score: 69, feedback: 'Needs improvement. Study harder.' },
    { min_score: 0, max_score: 59, feedback: 'Failed. Please review the material and retake.' }
  ]);
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    type: 'MIDTERM',
    maxScore: 100,
    weight: 30,
    description: ''
  });

  // Load data from backend
  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  // Load assessments when course changes
  useEffect(() => {
    if (selectedCourse) {
      fetchAssessments(selectedCourse);
      fetchEnrollments(selectedCourse);
      fetchGrades(selectedCourse);
    } else {
      setAssessments([]);
      setEnrollments([]);
      setExistingGrades([]);
    }
  }, [selectedCourse]);

  // Load feedback ranges when assessment changes
  useEffect(() => {
    if (selectedAssessment && selectedCourse && assessments.length > 0) {
      // Filter assessments for the selected course
      const courseAssessments = assessments.filter(a => a.course === selectedCourse);
      const assessment = courseAssessments.find(a => a.id === selectedAssessment);
      if (assessment?.feedback_ranges && assessment.feedback_ranges.length > 0) {
        setFeedbackRanges(assessment.feedback_ranges);
      } else {
        // Default feedback ranges
        setFeedbackRanges([
          { min_score: 90, max_score: 100, feedback: 'Excellent work! Outstanding performance.' },
          { min_score: 80, max_score: 89, feedback: 'Good job! Well done.' },
          { min_score: 70, max_score: 79, feedback: 'Satisfactory. Keep improving.' },
          { min_score: 60, max_score: 69, feedback: 'Needs improvement. Study harder.' },
          { min_score: 0, max_score: 59, feedback: 'Failed. Please review the material and retake.' }
        ]);
      }
    }
  }, [selectedAssessment, selectedCourse, assessments]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const coursesData = await api.getCourses();
      // Ensure coursesData is an array
      if (Array.isArray(coursesData)) {
        setCourses(coursesData);
      } else {
        console.error('Expected array but got:', typeof coursesData, coursesData);
        setCourses([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load data');
      setCourses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async (courseId: number) => {
    try {
      const assessmentsData = await api.getAssessments({ course: courseId });
      // Ensure assessmentsData is an array
      if (Array.isArray(assessmentsData)) {
        setAssessments(assessmentsData);
      } else {
        console.error('Expected array but got:', typeof assessmentsData, assessmentsData);
        setAssessments([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch assessments:', err);
      setAssessments([]); // Set empty array on error
    }
  };

  const fetchEnrollments = async (courseId: number) => {
    try {
      const enrollmentsData = await api.getEnrollments({ course: courseId });
      // Ensure enrollmentsData is an array
      if (Array.isArray(enrollmentsData)) {
        setEnrollments(enrollmentsData);
      } else {
        console.error('Expected array but got:', typeof enrollmentsData, enrollmentsData);
        setEnrollments([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch enrollments:', err);
      setEnrollments([]); // Set empty array on error
    }
  };

  const fetchGrades = async (courseId: number) => {
    try {
      // Get all assessments for this course first
      const assessmentsData = await api.getAssessments({ course: courseId });
      if (Array.isArray(assessmentsData) && assessmentsData.length > 0 && selectedAssessment) {
        // Get grades only for selected assessment
        const assessmentGrades = await api.getGrades({ assessment: selectedAssessment });
        // Ensure assessmentGrades is an array
        const gradesArray = Array.isArray(assessmentGrades) ? assessmentGrades : [];
        setExistingGrades(gradesArray);
        
        // Pre-populate grades state with existing grades for selected assessment
        const gradesMap: Record<number, { score: string }> = {};
        gradesArray.forEach(grade => {
          if (grade.assessment === selectedAssessment) {
            gradesMap[grade.student] = {
              score: grade.score.toString()
            };
          }
        });
        setGrades(gradesMap);
        
        // Load feedback ranges from assessment
        const assessment = assessmentsData.find(a => a.id === selectedAssessment);
        if (assessment?.feedback_ranges && assessment.feedback_ranges.length > 0) {
          setFeedbackRanges(assessment.feedback_ranges);
        }
      } else {
        setExistingGrades([]);
        setGrades({});
      }
    } catch (err: any) {
      console.error('Failed to fetch grades:', err);
      setExistingGrades([]);
      setGrades({});
    }
  };

  // Load grades when assessment changes
  useEffect(() => {
    if (selectedCourse && selectedAssessment) {
      fetchGrades(selectedCourse);
    } else {
      setExistingGrades([]);
      setGrades({});
    }
  }, [selectedAssessment]);

  const { 
    isDark, 
    mounted: themeMounted, 
    themeClasses, 
    text, 
    mutedText 
  } = useThemeColors();

  // Seçili derse ait assessment'lar (moved before early returns)
  const availableAssessments = useMemo(() => {
    return selectedCourse && Array.isArray(assessments)
      ? assessments.filter(a => a.course === selectedCourse)
      : [];
  }, [selectedCourse, assessments]);

  // Seçili assessment bilgisi (moved before early returns)
  const currentAssessment = useMemo(() => {
    return availableAssessments.find(a => a.id === selectedAssessment);
  }, [availableAssessments, selectedAssessment]);
  
  const selectedCourseData = useMemo(() => {
    return Array.isArray(courses) ? courses.find(c => c.id === selectedCourse) : undefined;
  }, [courses, selectedCourse]);

  if (!mounted || !themeMounted) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={mutedText}>Loading grades...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`text-center p-6 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const whiteText = text;
  const accentIconClass = isDark ? 'text-indigo-400' : 'text-indigo-600';

  // Get students from enrollments
  const students = Array.isArray(enrollments) 
    ? enrollments
        .filter(e => e.is_active)
        .map(e => ({
          id: e.student,
          studentId: e.student_id || '-',
          name: e.student_name,
          email: `${e.student_id || e.student}@student.edu` // Fallback email
        }))
    : [];

  // Filtrelenmiş öğrenciler
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.includes(searchTerm) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Otomatik feedback hesaplama
  const getAutomaticFeedback = (score: number): string => {
    if (!selectedAssessment || assessments.length === 0) {
      return '';
    }
    
    const assessment = assessments.find(a => a.id === selectedAssessment);
    if (!assessment || !assessment.feedback_ranges || assessment.feedback_ranges.length === 0) {
      return '';
    }
    
    const scorePercentage = (score / assessment.max_score) * 100;
    
    for (const range of assessment.feedback_ranges) {
      if (scorePercentage >= range.min_score && scorePercentage <= range.max_score) {
        return range.feedback;
      }
    }
    
    return '';
  };

  // Not kaydetme
  const handleSaveGrades = async () => {
    if (!selectedCourse || !selectedAssessment) {
      alert('Please select a course and assessment first.');
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Save/update grades for each student
      const gradePromises = Object.entries(grades).map(async ([studentId, gradeData]) => {
        const studentIdNum = parseInt(studentId);
        const score = parseFloat(gradeData.score);
        
        if (isNaN(score) || score < 0) {
          return;
        }

        // Check if grade already exists
        const existingGrade = existingGrades.find(
          g => g.student === studentIdNum && g.assessment === selectedAssessment
        );

        // Otomatik feedback hesapla
        const automaticFeedback = getAutomaticFeedback(score);

        const gradePayload = {
          student: studentIdNum,
          assessment: selectedAssessment,
          score: score,
          feedback: automaticFeedback
        };

        if (existingGrade) {
          // Update existing grade
          await api.updateGrade(existingGrade.id, gradePayload);
        } else {
          // Create new grade
          await api.createGrade(gradePayload);
        }
      });

      await Promise.all(gradePromises);
      
      // Refresh grades
      await fetchGrades(selectedCourse!);
      
      setIsSaving(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Failed to save grades:', err);
      setIsSaving(false);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Notları temizle
  const handleClearGrades = () => {
    setGrades({});
    setSaveStatus(null);
  };

  // Edit Grades modal'dan kaydetme
  const handleSaveEditingGrades = async () => {
    if (!selectedCourse || !selectedAssessment) {
      alert('Please select a course and assessment first.');
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Save/update grades for each student
      const gradePromises = Object.entries(editingGrades).map(async ([studentId, gradeData]) => {
        const studentIdNum = parseInt(studentId);
        const score = parseFloat(gradeData.score);
        
        if (isNaN(score) || score < 0) {
          return;
        }

        // Check if grade already exists
        const existingGrade = existingGrades.find(
          g => g.student === studentIdNum && g.assessment === selectedAssessment
        );

        // Otomatik feedback hesapla
        const automaticFeedback = getAutomaticFeedback(score);

        const gradePayload = {
          student: studentIdNum,
          assessment: selectedAssessment,
          score: score,
          feedback: automaticFeedback
        };

        if (existingGrade) {
          // Update existing grade
          await api.updateGrade(existingGrade.id, gradePayload);
        } else {
          // Create new grade
          await api.createGrade(gradePayload);
        }
      });

      await Promise.all(gradePromises);
      
      // Update grades state
      setGrades({ ...editingGrades });
      
      // Refresh grades
      await fetchGrades(selectedCourse!);
      
      setIsSaving(false);
      setSaveStatus('success');
      setShowEditGrades(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Failed to save grades:', err);
      setIsSaving(false);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Edit Grades modal'da not değişikliği
  const handleEditingGradeChange = (studentId: number, value: string) => {
    setEditingGrades(prev => ({
      ...prev,
      [studentId]: {
        score: value
      }
    }));
  };

  // Feedback aralıklarını kaydetme
  const handleSaveFeedbackRanges = async () => {
    if (!selectedAssessment) {
      alert('Please select an assessment first.');
      return;
    }

    // Validate feedback ranges before sending
    const validRanges = feedbackRanges.filter(range => {
      return range.min_score >= 0 && 
             range.min_score <= 100 && 
             range.max_score >= 0 && 
             range.max_score <= 100 && 
             range.min_score <= range.max_score &&
             range.feedback.trim() !== '';
    });

    if (validRanges.length === 0) {
      alert('Please add at least one valid feedback range with a non-empty feedback message.');
      return;
    }

    // Check for empty feedback messages
    const emptyFeedback = feedbackRanges.find(range => !range.feedback || range.feedback.trim() === '');
    if (emptyFeedback) {
      alert('All feedback ranges must have a feedback message. Please fill in all feedback fields.');
      return;
    }

    try {
      await api.updateAssessment(selectedAssessment, {
        feedback_ranges: validRanges.map(range => ({
          min_score: Number(range.min_score),
          max_score: Number(range.max_score),
          feedback: range.feedback.trim()
        }))
      });
      
      // Refresh assessments
      await fetchAssessments(selectedCourse!);
      setShowFeedbackRanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Failed to save feedback ranges:', err);
      alert(`Failed to save feedback ranges: ${err.message || 'Please try again.'}`);
    }
  };

  // Feedback aralığı ekleme
  const handleAddFeedbackRange = () => {
    setFeedbackRanges([...feedbackRanges, { min_score: 0, max_score: 100, feedback: '' }]);
  };

  // Feedback aralığı silme
  const handleRemoveFeedbackRange = (index: number) => {
    setFeedbackRanges(feedbackRanges.filter((_, i) => i !== index));
  };

  // Feedback aralığı güncelleme
  const handleUpdateFeedbackRange = (index: number, field: 'min_score' | 'max_score' | 'feedback', value: string | number) => {
    const updated = [...feedbackRanges];
    updated[index] = { ...updated[index], [field]: value };
    setFeedbackRanges(updated);
  };

  // Yeni assessment oluşturma
  const handleCreateAssessment = async () => {
    if (!selectedCourse) {
      alert('Please select a course first.');
      return;
    }

    if (!newAssessment.title || !newAssessment.type) {
      alert('Please fill in all required fields (Title, Type).');
      return;
    }

    // Max score validation
    if (newAssessment.maxScore < 0 || newAssessment.maxScore > 100) {
      alert('Maximum score must be between 0 and 100.');
      return;
    }

    // Total weight kontrolü
    const currentTotalWeight = availableAssessments.reduce((sum, a) => sum + a.weight, 0);
    const newTotalWeight = currentTotalWeight + newAssessment.weight;

    if (newTotalWeight > 100) {
      alert(`Cannot create assessment: Total weight would be ${newTotalWeight.toFixed(1)}%, which exceeds 100%. Please reduce the weight to ${(100 - currentTotalWeight).toFixed(1)}% or less.`);
      return;
    }

    try {
      const createdAssessment = await api.createAssessment({
        course: selectedCourse,
        title: newAssessment.title,
        assessment_type: newAssessment.type,
        max_score: Number(newAssessment.maxScore), // Ensure it's a number
        weight: Number(newAssessment.weight), // Ensure it's a number
        description: newAssessment.description || undefined,
        feedback_ranges: feedbackRanges,
        is_active: true
      });

      // Refresh assessments
      await fetchAssessments(selectedCourse);
      
      // Yeni oluşturulan assessment'ı seç
      setSelectedAssessment(createdAssessment.id);

      // Form'u temizle ve modal'ı kapat
      setNewAssessment({ title: '', type: 'MIDTERM', maxScore: 100, weight: 30, description: '' });
      setShowCreateAssessment(false);
    } catch (err: any) {
      console.error('Failed to create assessment:', err);
      alert('Failed to create assessment. Please try again.');
    }
  };

  // Weight değişikliğinde toplam kontrolü
  const handleWeightChange = (newWeight: number) => {
    const currentTotalWeight = availableAssessments.reduce((sum, a) => sum + a.weight, 0);
    const newTotalWeight = currentTotalWeight + newWeight;
    
    if (newTotalWeight > 100) {
      const maxAllowed = 100 - currentTotalWeight;
      setNewAssessment({ ...newAssessment, weight: Math.max(0, maxAllowed) });
      alert(`Total weight cannot exceed 100%. Maximum allowed weight for this assessment: ${maxAllowed.toFixed(1)}%`);
      return;
    }
    
    setNewAssessment({ ...newAssessment, weight: Math.max(0, Math.min(100, newWeight)) });
  };

  // Assessment type label'ını al
  const getAssessmentTypeLabel = (type: string) => {
    return assessmentTypes.find(at => at.value === type)?.label || type;
  };

  // Assessment istatistiklerini hesapla
  const getAssessmentStats = (assessmentId: number) => {
    const assessmentGrades = existingGrades.filter(g => g.assessment === assessmentId);
    const total = students.length;
    const graded = assessmentGrades.length;
    const average = graded > 0
      ? assessmentGrades.reduce((sum, g) => sum + g.score, 0) / graded
      : 0;
    
    return { graded, total, average: Math.round(average * 10) / 10 };
  };

  // Helper function to safely convert weight to number
  const parseWeight = (weight: any): number => {
    if (typeof weight === 'string') {
      return parseFloat(weight) || 0;
    }
    if (typeof weight === 'number') {
      return weight;
    }
    return 0;
  };

  // Toplam weight hesapla
  // Ensure weight is converted to number (it might come as string from backend Decimal field)
  const totalWeight = availableAssessments.reduce((sum, a) => {
    return sum + parseWeight(a.weight);
  }, 0);

  // Calculate total weight including new assessment (for create assessment form)
  const calculateTotalWeightWithNew = (newWeight: any): number => {
    return totalWeight + parseWeight(newWeight);
  };

  return (
    <div className="container mx-auto py-0">
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 border-b pb-4 border-gray-500/20"
      >
        <h1 className={`text-3xl font-bold ${whiteText} flex items-center gap-3`}>
          <FileText className="w-7 h-7 text-indigo-500" />
          Grade Management
        </h1>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-xl ${themeClasses.card} ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'} flex items-center gap-2 transition-all`}
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-xl ${themeClasses.card} ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'} flex items-center gap-2 transition-all`}
          >
            <Upload className="w-4 h-4" />
            Import
          </motion.button>
        </div>
      </motion.div>

      {/* Ders ve Assessment Seçimi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl mb-6`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ders Seçimi */}
          <div>
            <label className={`${mutedText} text-sm font-medium mb-2 block`}>
              <BookOpen className="w-4 h-4 inline mr-1" />
              Select Course
            </label>
            <select
              value={selectedCourse || ''}
              onChange={(e) => {
                setSelectedCourse(Number(e.target.value));
                setSelectedAssessment(null);
                setGrades({});
              }}
              className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="">-- Select a course --</option>
              {Array.isArray(courses) && courses.length > 0 ? courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name} {course.semester_display ? `(${course.semester_display})` : ''}
                </option>
              )) : (
                <option value="">No courses available</option>
              )}
            </select>
          </div>

          {/* Assessment Seçimi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`${mutedText} text-sm font-medium block`}>
                <FileText className="w-4 h-4 inline mr-1" />
                Select Assessment
              </label>
              {selectedCourse && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateAssessment(true)}
                  className={`px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-medium flex items-center gap-1 transition-all`}
                >
                  <Plus className="w-3 h-3" />
                  Create New
                </motion.button>
              )}
            </div>
            <select
              value={selectedAssessment || ''}
              onChange={(e) => {
                setSelectedAssessment(Number(e.target.value));
                setGrades({});
              }}
              disabled={!selectedCourse}
              className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">-- Select an assessment --</option>
              {availableAssessments.map(assessment => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.title} ({getAssessmentTypeLabel(assessment.assessment_type)}) - Max: {assessment.max_score}, Weight: {assessment.weight}%
                </option>
              ))}
            </select>
            {selectedCourse && availableAssessments.length === 0 && (
              <p className={`${mutedText} text-xs mt-1`}>No assessments yet. Click "Create New" to add one.</p>
            )}
          </div>
        </div>

        {/* Assessment Detayları */}
        {currentAssessment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'} border`}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className={mutedText}>Type:</span>
                <p className={whiteText}>{getAssessmentTypeLabel(currentAssessment.assessment_type)}</p>
              </div>
              <div>
                <span className={mutedText}>Max Score:</span>
                <p className={whiteText}>{currentAssessment.max_score}</p>
              </div>
              <div>
                <span className={mutedText}>Weight:</span>
                <p className={whiteText}>{currentAssessment.weight}%</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Assessment Özet Tablosu - Seçili dersin tüm assessment'ları */}
      {selectedCourse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl mb-6`}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className={`text-xl font-bold ${whiteText} flex items-center gap-2`}>
              <FileText className={`w-5 h-5 ${accentIconClass}`} />
              Course Assessment Overview
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Toplam Weight Göstergesi */}
              <div className={`px-4 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'} border-2 ${
                totalWeight === 100 
                  ? isDark ? 'border-green-500/50 bg-green-500/10' : 'border-green-500 bg-green-50'
                  : totalWeight > 100
                  ? isDark ? 'border-red-500/50 bg-red-500/10' : 'border-red-500 bg-red-50'
                  : isDark ? 'border-orange-500/50 bg-orange-500/10' : 'border-orange-500 bg-orange-50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`${mutedText} text-xs`}>Total Weight:</span>
                  <span className={`${whiteText} font-bold text-lg ${totalWeight === 100 ? 'text-green-500' : totalWeight > 100 ? 'text-red-500' : 'text-orange-500'}`}>
                    {totalWeight.toFixed(1)}%
                  </span>
                  {totalWeight === 100 ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className={`w-4 h-4 ${totalWeight > 100 ? 'text-red-500' : 'text-orange-500'}`} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Uyarı Mesajı - %100 Zorunluluğu */}
          {totalWeight !== 100 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 p-4 rounded-xl border-l-4 ${
                totalWeight > 100
                  ? isDark ? 'bg-red-500/10 border-red-500/50' : 'bg-red-50 border-red-500'
                  : isDark ? 'bg-orange-500/10 border-orange-500/50' : 'bg-orange-50 border-orange-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 mt-0.5 ${totalWeight > 100 ? 'text-red-500' : 'text-orange-500'}`} />
                <div className="flex-1">
                  <h3 className={`${whiteText} font-semibold mb-1`}>
                    {totalWeight > 100 ? 'Weight Exceeds 100%' : 'Incomplete Weight Distribution'}
                  </h3>
                  <p className={`${mutedText} text-sm`}>
                    {totalWeight > 100 ? (
                      <>
                        The total weight of all assessments is <span className="font-semibold text-red-500">{totalWeight.toFixed(1)}%</span>, which exceeds 100%. 
                        Please reduce the weight of one or more assessments to reach exactly <span className="font-semibold text-green-500">100%</span>.
                      </>
                    ) : (
                      <>
                        The total weight of all assessments is <span className="font-semibold text-orange-500">{totalWeight.toFixed(1)}%</span>. 
                        <span className="font-semibold text-red-500"> You must complete the weight distribution to exactly 100%</span> before you can save grades. 
                        Missing: <span className="font-semibold">{(100 - totalWeight).toFixed(1)}%</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Başarı Mesajı - %100 Tamamlandığında */}
          {totalWeight === 100 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 p-4 rounded-xl border-l-4 ${isDark ? 'bg-green-500/10 border-green-500/50' : 'bg-green-50 border-green-500'}`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 text-green-500" />
                <div className="flex-1">
                  <h3 className={`${whiteText} font-semibold mb-1`}>Perfect Weight Distribution</h3>
                  <p className={`${mutedText} text-sm`}>
                    All assessment weights total exactly <span className="font-semibold text-green-500">100%</span>. 
                    You can now proceed to enter grades for your students.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {availableAssessments.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl`}>
              <FileText className={`w-12 h-12 ${mutedText} mx-auto mb-3`} />
              <p className={mutedText}>No assessments created yet.</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateAssessment(true)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create First Assessment
              </motion.button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Assessment</th>
                    <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Type</th>
                    <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Weight (%)</th>
                    <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Max Score</th>
                    <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Avg Score</th>
                    <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableAssessments.map((assessment, index) => {
                    const stats = getAssessmentStats(assessment.id);
                    const progress = stats.total > 0 ? (stats.graded / stats.total) * 100 : 0;
                    const isSelected = selectedAssessment === assessment.id;

                    return (
                      <motion.tr
                        key={assessment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        onClick={() => setSelectedAssessment(assessment.id)}
                        className={`border-b cursor-pointer transition-all ${
                          isSelected
                            ? isDark ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200'
                            : isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <FileText className={`w-4 h-4 ${isSelected ? 'text-indigo-500' : mutedText}`} />
                            <span className={`${whiteText} font-medium`}>{assessment.title}</span>
                            {isSelected && (
                              <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                Selected
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`py-4 px-4`}>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            assessment.assessment_type === 'MIDTERM' || assessment.assessment_type === 'FINAL'
                              ? isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                              : assessment.assessment_type === 'PROJECT'
                              ? isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                              : isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {getAssessmentTypeLabel(assessment.assessment_type)}
                          </span>
                        </td>
                        <td className={`py-4 px-4`}>
                          <div className="flex items-center gap-2">
                            <span className={`${whiteText} font-semibold`}>{assessment.weight}%</span>
                            <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} max-w-20`}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${assessment.weight}%` }}
                                transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                                className={`h-full rounded-full ${
                                  assessment.weight >= 30 ? 'bg-indigo-500' : 
                                  assessment.weight >= 20 ? 'bg-blue-500' : 
                                  'bg-green-500'
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className={`py-4 px-4 ${whiteText}`}>{assessment.max_score}</td>
                        <td className={`py-4 px-4`}>
                          {stats.graded > 0 ? (
                            <div className="flex items-center gap-1">
                              <TrendingUp className={`w-4 h-4 ${stats.average >= 80 ? 'text-green-500' : stats.average >= 70 ? 'text-blue-500' : 'text-orange-500'}`} />
                              <span className={`${whiteText} font-medium`}>{stats.average.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className={mutedText}>-</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAssessment(assessment.id);
                            }}
                            className={`p-2 rounded-lg ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            } transition-all`}
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} border-t-2 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <td colSpan={2} className={`py-3 px-4 ${whiteText} font-semibold`}>Total</td>
                    <td className={`py-3 px-4`}>
                      <span className={`${whiteText} font-bold text-lg ${totalWeight === 100 ? 'text-green-500' : totalWeight > 100 ? 'text-red-500' : 'text-orange-500'}`}>
                        {totalWeight.toFixed(1)}%
                      </span>
                    </td>
                    <td colSpan={3} className={`py-3 px-4`}>
                      {totalWeight === 100 ? (
                        <span className={`text-green-500 text-sm font-semibold flex items-center gap-1`}>
                          <CheckCircle2 className="w-4 h-4" />
                          ✓ Perfect distribution - Ready to grade
                        </span>
                      ) : totalWeight > 100 ? (
                        <span className={`text-red-500 text-sm font-semibold flex items-center gap-1`}>
                          <AlertCircle className="w-4 h-4" />
                          ⚠ Exceeds 100% - Must be exactly 100%
                        </span>
                      ) : (
                        <span className={`text-orange-500 text-sm font-semibold flex items-center gap-1`}>
                          <AlertCircle className="w-4 h-4" />
                          ⚠ Missing {(100 - totalWeight).toFixed(1)}% - Must total exactly 100%
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Arama ve Filtreler */}
      {selectedCourse && selectedAssessment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`backdrop-blur-xl ${themeClasses.card} p-4 shadow-2xl rounded-xl mb-6`}
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${mutedText}`} />
              <input
                type="text"
                placeholder="Search students by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
          </div>

          {/* Save Status */}
          {saveStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${
                saveStatus === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-500'
                  : 'bg-red-500/10 border-red-500/30 text-red-500'
              } border`}
            >
              {saveStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Grades saved successfully!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>Error saving grades. Please try again.</span>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Öğrenci Not Tablosu */}
      {selectedCourse && selectedAssessment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl overflow-x-auto`}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className={`text-xl font-bold ${whiteText} flex items-center gap-2`}>
              <User className={`w-5 h-5 ${accentIconClass}`} />
              Student Grades
            </h2>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (currentAssessment?.feedback_ranges) {
                    setFeedbackRanges(currentAssessment.feedback_ranges);
                  }
                  setShowFeedbackRanges(true);
                }}
                className={`px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center gap-2 transition-all`}
              >
                <Info className="w-4 h-4" />
                Manage Feedback Ranges
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditingGrades({ ...grades });
                  setShowEditGrades(true);
                }}
                className={`px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 transition-all`}
              >
                <Edit className="w-4 h-4" />
                Edit Grades
              </motion.button>
            </div>
          </div>
          <div className="min-w-full">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Student ID</th>
                  <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Name</th>
                  <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Email</th>
                  <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>
                    Score / {currentAssessment?.max_score || 100}
                  </th>
                  <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Auto Feedback</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => {
                  const studentGrade = grades[student.id] || { score: '' };
                  const scoreNum = parseFloat(studentGrade.score) || 0;
                  const automaticFeedback = scoreNum > 0 ? getAutomaticFeedback(scoreNum) : '';

                  return (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className={`w-4 h-4 ${mutedText}`} />
                          <span className={whiteText}>{student.studentId}</span>
                        </div>
                      </td>
                      <td className={`py-4 px-4 ${whiteText} font-medium`}>{student.name}</td>
                      <td className={`py-4 px-4 ${mutedText} text-sm`}>{student.email}</td>
                      <td className="py-4 px-4">
                        <span className={`${whiteText} font-medium`}>
                          {studentGrade.score ? studentGrade.score : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`${mutedText} text-sm`}>
                          {automaticFeedback || '-'}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <p className={mutedText}>No students found matching your search.</p>
              </div>
            )}
          </div>

          {/* Özet İstatistikler */}
          {Object.keys(grades).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'} border`}
            >
              <h3 className={`${whiteText} font-semibold mb-3`}>Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className={mutedText}>Graded:</span>
                  <p className={whiteText}>{Object.keys(grades).length} / {filteredStudents.length}</p>
                </div>
                <div>
                  <span className={mutedText}>Average:</span>
                  <p className={whiteText}>
                    {(() => {
                      const scores = Object.values(grades)
                        .map(g => parseFloat(g.score))
                        .filter(s => !isNaN(s) && s > 0);
                      const avg = scores.length > 0
                        ? scores.reduce((a, b) => a + b, 0) / scores.length
                        : 0;
                      return avg.toFixed(1);
                    })()}
                  </p>
                </div>
                <div>
                  <span className={mutedText}>Highest:</span>
                  <p className={whiteText}>
                    {(() => {
                      const scores = Object.values(grades)
                        .map(g => parseFloat(g.score))
                        .filter(s => !isNaN(s) && s > 0);
                      return scores.length > 0 ? Math.max(...scores).toFixed(1) : '-';
                    })()}
                  </p>
                </div>
                <div>
                  <span className={mutedText}>Lowest:</span>
                  <p className={whiteText}>
                    {(() => {
                      const scores = Object.values(grades)
                        .map(g => parseFloat(g.score))
                        .filter(s => !isNaN(s) && s > 0);
                      return scores.length > 0 ? Math.min(...scores).toFixed(1) : '-';
                    })()}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Boş Durum */}
      {(!selectedCourse || !selectedAssessment) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`backdrop-blur-xl ${themeClasses.card} p-12 shadow-2xl rounded-xl text-center`}
        >
          <FileText className={`w-16 h-16 ${mutedText} mx-auto mb-4`} />
          <h3 className={`${whiteText} text-xl font-semibold mb-2`}>Select Course and Assessment</h3>
          <p className={mutedText}>
            Please select a course and assessment from the dropdowns above to start entering grades.
          </p>
          {selectedCourse && availableAssessments.length === 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateAssessment(true)}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create Your First Assessment
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Yeni Assessment Oluşturma Modal */}
      <AnimatePresence>
        {showCreateAssessment && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCreateAssessment(false);
                setNewAssessment({ title: '', type: 'MIDTERM', maxScore: 100, weight: 30, description: '' });
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${whiteText} flex items-center gap-2`}>
                    <FileText className="w-6 h-6 text-indigo-500" />
                    Create New Assessment
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowCreateAssessment(false);
                      setNewAssessment({ title: '', type: 'MIDTERM', maxScore: 100, weight: 30, description: '' });
                    }}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all`}
                  >
                    <X className={`w-5 h-5 ${mutedText}`} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {/* Assessment Title */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      Assessment Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAssessment.title}
                      onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                      placeholder="e.g., Midterm Exam 1, Final Project"
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                  </div>

                  {/* Assessment Type */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      Assessment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newAssessment.type}
                      onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value })}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    >
                      {assessmentTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Max Score ve Weight */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                        Maximum Score <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={newAssessment.maxScore}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          // Allow empty input or values between 0-100
                          if (e.target.value === '' || (value >= 0 && value <= 100)) {
                            setNewAssessment({ ...newAssessment, maxScore: value || 0 });
                          }
                        }}
                        onBlur={(e) => {
                          // Ensure value is within bounds when user leaves the field
                          const value = Number(e.target.value);
                          if (isNaN(value) || value < 0) {
                            setNewAssessment({ ...newAssessment, maxScore: 0 });
                          } else if (value > 100) {
                            setNewAssessment({ ...newAssessment, maxScore: 100 });
                          }
                        }}
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                      />
                      <p className={`${mutedText} text-xs mt-1`}>Enter a value between 0 and 100</p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                        Weight (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={newAssessment.weight}
                        onChange={(e) => handleWeightChange(Number(e.target.value) || 0)}
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                      />
                      <div className={`mt-2 p-2 rounded-lg ${
                        calculateTotalWeightWithNew(newAssessment.weight) > 100
                          ? isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
                          : isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
                      } border`}>
                        <p className={`${mutedText} text-xs flex items-start gap-1`}>
                          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>
                            <span className="font-semibold text-red-500">Important:</span> All assessment weights must total exactly <span className="font-semibold">100%</span>. 
                            Current total: <span className={`font-semibold ${
                              calculateTotalWeightWithNew(newAssessment.weight) > 100 ? 'text-red-500' : 'text-blue-500'
                            }`}>
                              {calculateTotalWeightWithNew(newAssessment.weight).toFixed(1)}%
                            </span>
                            {calculateTotalWeightWithNew(newAssessment.weight) > 100 && (
                              <span className="block mt-1 text-red-500 font-semibold">
                                ⚠ Exceeds 100% - Cannot save!
                              </span>
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      Description (Optional)
                    </label>
                    <textarea
                      value={newAssessment.description}
                      onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                      placeholder="Add any additional details about this assessment..."
                      rows={3}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none resize-none`}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-500/10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowCreateAssessment(false);
                      setNewAssessment({ title: '', type: 'MIDTERM', maxScore: 100, weight: 30, description: '' });
                    }}
                    className={`px-6 py-2 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-all`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateAssessment}
                    disabled={
                      !newAssessment.title || 
                      !newAssessment.type || 
                      calculateTotalWeightWithNew(newAssessment.weight) > 100
                    }
                    className={`px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={
                      calculateTotalWeightWithNew(newAssessment.weight) > 100
                        ? 'Total weight exceeds 100% - Cannot create assessment'
                        : ''
                    }
                  >
                    <Save className="w-4 h-4" />
                    Create Assessment
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Grades Modal */}
      <AnimatePresence>
        {showEditGrades && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditGrades(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} w-full max-w-5xl max-h-[90vh] overflow-y-auto`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${whiteText} flex items-center gap-2`}>
                    <Edit className="w-6 h-6 text-indigo-500" />
                    Edit Student Grades
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEditGrades(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all`}
                  >
                    <X className={`w-5 h-5 ${mutedText}`} />
                  </motion.button>
                </div>

                <div className="mb-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                  <p className={`${whiteText} text-sm`}>
                    <strong>Assessment:</strong> {currentAssessment?.title} | 
                    <strong> Max Score:</strong> {currentAssessment?.max_score || 100}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                        <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Student ID</th>
                        <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Name</th>
                        <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>
                          Score / {currentAssessment?.max_score || 100}
                        </th>
                        <th className={`text-left py-3 px-4 ${mutedText} font-medium text-sm`}>Auto Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => {
                        const studentGrade = editingGrades[student.id] || { score: '' };
                        const scoreNum = parseFloat(studentGrade.score) || 0;
                        const isValidScore = scoreNum >= 0 && scoreNum <= (currentAssessment?.max_score || 100);
                        const automaticFeedback = scoreNum > 0 ? getAutomaticFeedback(scoreNum) : '';

                        return (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <User className={`w-4 h-4 ${mutedText}`} />
                                <span className={whiteText}>{student.studentId}</span>
                              </div>
                            </td>
                            <td className={`py-4 px-4 ${whiteText} font-medium`}>{student.name}</td>
                            <td className="py-4 px-4">
                              <input
                                type="number"
                                min="0"
                                max={currentAssessment?.max_score || 100}
                                step="0.01"
                                value={studentGrade.score}
                                onChange={(e) => handleEditingGradeChange(student.id, e.target.value)}
                                className={`w-24 px-3 py-2 rounded-lg border ${
                                  isValidScore
                                    ? isDark
                                      ? 'bg-white/5 border-white/10 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                    : 'border-red-500 bg-red-500/10'
                                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                placeholder="0.00"
                              />
                            </td>
                            <td className="py-4 px-4">
                              <span className={`${mutedText} text-sm`}>
                                {automaticFeedback || '-'}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-500/10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEditGrades(false)}
                    className={`px-6 py-2 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-all`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveEditingGrades}
                    disabled={isSaving || Object.keys(editingGrades).length === 0}
                    className={`px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Grades
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Feedback Ranges Management Modal */}
      <AnimatePresence>
        {showFeedbackRanges && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedbackRanges(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} w-full max-w-3xl max-h-[90vh] overflow-y-auto`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${whiteText} flex items-center gap-2`}>
                    <Info className="w-6 h-6 text-purple-500" />
                    Manage Feedback Ranges
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowFeedbackRanges(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all`}
                  >
                    <X className={`w-5 h-5 ${mutedText}`} />
                  </motion.button>
                </div>

                <div className="mb-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <p className={`${whiteText} text-sm mb-2`}>
                    <strong>Assessment:</strong> {currentAssessment?.title}
                  </p>
                  <p className={`${mutedText} text-xs`}>
                    Define score percentage ranges and their corresponding feedback messages. 
                    Feedback will be automatically assigned to students based on their score percentage.
                  </p>
                </div>

                <div className="space-y-4">
                  {feedbackRanges.map((range, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`${whiteText} font-semibold`}>Range {index + 1}</h3>
                        {feedbackRanges.length > 1 && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveFeedbackRange(index)}
                            className={`p-2 rounded-lg ${isDark ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'} transition-all`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                            Min Score (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={range.min_score}
                            onChange={(e) => handleUpdateFeedbackRange(index, 'min_score', Number(e.target.value) || 0)}
                            className={`w-full p-2 rounded-lg border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                            Max Score (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={range.max_score}
                            onChange={(e) => handleUpdateFeedbackRange(index, 'max_score', Number(e.target.value) || 100)}
                            className={`w-full p-2 rounded-lg border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                          Feedback Message
                        </label>
                        <input
                          type="text"
                          value={range.feedback}
                          onChange={(e) => handleUpdateFeedbackRange(index, 'feedback', e.target.value)}
                          placeholder="e.g., Excellent work!"
                          className={`w-full p-2 rounded-lg border ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddFeedbackRange}
                    className={`w-full px-4 py-2 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'} transition-all flex items-center justify-center gap-2`}
                  >
                    <Plus className="w-4 h-4" />
                    Add Feedback Range
                  </motion.button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-500/10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowFeedbackRanges(false);
                      if (currentAssessment?.feedback_ranges) {
                        setFeedbackRanges(currentAssessment.feedback_ranges);
                      }
                    }}
                    className={`px-6 py-2 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-all`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveFeedbackRanges}
                    className={`px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center gap-2 transition-all`}
                  >
                    <Save className="w-4 h-4" />
                    Save Feedback Ranges
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

