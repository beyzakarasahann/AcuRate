'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BookOpen, Search, Building2, Loader2, Users, TrendingUp, Award, RefreshCw, Calendar, User as UserIcon, PlusCircle, Edit2, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

interface CourseWithStats {
  course_id: number;
  course_code: string;
  course_name: string;
  department: string;
  semester: string;
  academic_year: string;
  instructor: string;
  total_students: number;
  successful_students: number;
  success_rate: number;
  average_grade: number | null;
}

export default function LessonsPage() {
  const [mounted, setMounted] = useState(false);
  const [allCourses, setAllCourses] = useState<CourseWithStats[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('all');
  const [courseEditModalOpen, setCourseEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseWithStats | null>(null);
  const [courseForm, setCourseForm] = useState<any>({
    code: '',
    name: '',
    description: '',
    credits: 3,
    semester: 1, // 1=Fall, 2=Spring, 3=Summer
    year: null, // Year of study (1-6, optional)
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    teacher: null,
  });
  const [savingCourse, setSavingCourse] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);

  const {
    mounted: themeMounted,
    themeClasses,
    text,
    mutedText,
    isDark,
  } = useThemeColors();

  useEffect(() => {
    setMounted(true);
    fetchCourses();
    fetchDepartments();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const teachersData = await api.getUsers({ role: 'TEACHER' });
      setTeachers(teachersData || []);
    } catch (error) {
      console.error('Failed to load teachers', error);
    }
  };

  useEffect(() => {
    if (departments.length > 0 && !selectedDepartment) {
      setSelectedDepartment(departments[0]);
    }
  }, [departments]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchCourses();
    }
  }, [selectedDepartment, semesterFilter, academicYearFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: {
        department?: string;
        semester?: string;
        academic_year?: string;
      } = {};
      
      if (selectedDepartment) {
        params.department = selectedDepartment;
      }
      if (semesterFilter !== 'all') {
        params.semester = semesterFilter;
      }
      if (academicYearFilter !== 'all') {
        params.academic_year = academicYearFilter;
      }
      
      const data = await api.getAnalyticsCourseSuccess(params);
      setAllCourses(data.courses || []);
    } catch (error: any) {
      console.error('Failed to load courses', error);
      setError(error.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const deptData = await api.getDepartments();
      const deptNames = Array.from(new Set(deptData.map(dept => dept.name.trim()))).sort();
      setDepartments(deptNames);
    } catch (error: any) {
      console.error('Failed to load departments', error);
    }
  };

  // Filter courses based on search
  const filteredCourses = allCourses.filter(course => {
    const matchesSearch = !search || 
      course.course_code?.toLowerCase().includes(search.toLowerCase()) ||
      course.course_name?.toLowerCase().includes(search.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  });

  const selectedDepartmentData = departments.find(d => d === selectedDepartment);
  const selectedDepartmentCount = allCourses.length;

  // Get unique semesters and academic years
  const availableSemesters = Array.from(
    new Set(allCourses.map(c => c.semester))
  ).sort();

  const availableAcademicYears = Array.from(
    new Set(allCourses.map(c => c.academic_year))
  ).sort().reverse();

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return isDark ? 'text-green-400' : 'text-green-600';
    if (rate >= 60) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  const getSuccessRateBg = (rate: number) => {
    if (rate >= 80) return isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200';
    if (rate >= 60) return isDark ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200';
    return isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200';
  };

  const handleAddCourse = () => {
    if (!selectedDepartment) {
      alert('Please select a department first');
      return;
    }
    setEditingCourse(null);
    setCourseForm({
      code: '',
      name: '',
      description: '',
      credits: 3,
      semester: 1,
      year: null,
      academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      teacher: null,
    });
    setCourseEditModalOpen(true);
  };

  const handleEditCourse = (course: CourseWithStats) => {
    setEditingCourse(course);
    // Parse semester string to number
    let semesterNum = 1;
    if (course.semester === 'Spring') semesterNum = 2;
    else if (course.semester === 'Summer') semesterNum = 3;
    
    setCourseForm({
      code: course.course_code || '',
      name: course.course_name || '',
      description: '',
      credits: 3,
      semester: semesterNum,
      year: null,
      academic_year: course.academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      teacher: null,
    });
    setCourseEditModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDepartment) {
      alert('Please select a department first');
      return;
    }

    setSavingCourse(true);
    try {
      const courseData = {
        code: courseForm.code,
        name: courseForm.name,
        description: courseForm.description || '',
        credits: courseForm.credits,
        semester: courseForm.semester,
        academic_year: courseForm.academic_year,
        department: selectedDepartment,
        teacher: courseForm.teacher || null,
      };

      if (editingCourse) {
        await api.updateCourse(editingCourse.course_id, courseData);
      } else {
        await api.createCourse(courseData);
      }

      // Reload courses
      await fetchCourses();
      setCourseEditModalOpen(false);
      setEditingCourse(null);
    } catch (error: any) {
      console.error('Failed to save course', error);
      alert(error.message || 'Failed to save course');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      await api.deleteCourse(courseId);
      // Reload courses
      await fetchCourses();
    } catch (error: any) {
      console.error('Failed to delete course', error);
      alert(error.message || 'Failed to delete course');
    }
  };

  const handleCloseCourseModal = () => {
    setCourseEditModalOpen(false);
    setEditingCourse(null);
    setCourseForm({
      code: '',
      name: '',
      description: '',
      credits: 3,
      semester: 1,
      year: null,
      academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      teacher: null,
    });
  };

  if (!mounted || !themeMounted) {
    return null;
  }

  return (
    <div className={`${inter.variable} font-sans`} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      <div className="flex gap-6">
        {/* Left Sidebar - Department Selector */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`w-80 flex-shrink-0 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} rounded-xl p-6 border ${isDark ? 'border-white/5' : 'border-gray-200'} sticky top-8 self-start h-fit`}
        >
          <div className="space-y-4">
            <div>
              <h2 className={`text-sm font-semibold ${mutedText} uppercase tracking-wider mb-4`}>
                Departments
              </h2>
              
              <div className="space-y-1">
                {departments.map((dept, index) => {
                  const isSelected = selectedDepartment === dept;
                  const deptCourses = allCourses.filter(c => c.department === dept);
                  const deptCount = deptCourses.length;
                  
                  return (
                    <motion.button
                      key={`${dept}-${index}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDepartment(dept)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                          : isDark
                          ? 'hover:bg-white/5 text-gray-300 border border-transparent'
                          : 'hover:bg-white text-gray-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Building2 className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-400' : mutedText}`} />
                          <span className="font-medium text-sm truncate">{dept}</span>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? isDark ? 'bg-indigo-500/30 text-indigo-200' : 'bg-indigo-200 text-indigo-700'
                            : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {deptCount}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Total Courses Summary */}
            <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className={`px-4 py-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                <p className={`text-xs ${mutedText} mb-1`}>Total Courses</p>
                <p className={`text-2xl font-bold ${text}`}>{allCourses.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Courses View */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isDark ? 'bg-gray-900/50' : 'bg-white'} rounded-xl p-6 border ${isDark ? 'border-white/5' : 'border-gray-200'}`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className={`text-3xl font-bold ${text} mb-2`}>
                  {selectedDepartment || 'Select a Department'}
                </h1>
                {selectedDepartment && (
                  <p className={`text-sm ${mutedText}`}>
                    {selectedDepartmentCount} {selectedDepartmentCount === 1 ? 'course' : 'courses'}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddCourse}
                  disabled={!selectedDepartment || loading}
                  className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium ${
                    isDark 
                      ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30' 
                      : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  } ${!selectedDepartment || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Course
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={fetchCourses}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}
            >
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {/* Filters and Search Bar */}
          {selectedDepartment && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${isDark ? 'bg-gray-900/50' : 'bg-white'} rounded-xl p-5 border ${isDark ? 'border-white/5' : 'border-gray-200'} sticky top-8 z-10 shadow-sm`}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${mutedText}`} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by course code, name, or instructor..."
                    className={`w-full pl-12 pr-4 py-3 rounded-lg border transition-all ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                    } focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm`}
                  />
                </div>
                
                {/* Semester Filter */}
                {availableSemesters.length > 0 && (
                  <div className="sm:w-48">
                    <select
                      value={semesterFilter}
                      onChange={(e) => setSemesterFilter(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-all ${
                        isDark 
                          ? 'bg-white/5 border-white/10 text-white' 
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      } focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm`}
                    >
                      <option value="all">All Semesters</option>
                      {availableSemesters.map(semester => (
                        <option key={semester} value={semester}>{semester}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Academic Year Filter */}
                {availableAcademicYears.length > 0 && (
                  <div className="sm:w-48">
                    <select
                      value={academicYearFilter}
                      onChange={(e) => setAcademicYearFilter(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-all ${
                        isDark 
                          ? 'bg-white/5 border-white/10 text-white' 
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      } focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm`}
                    >
                      <option value="all">All Years</option>
                      {availableAcademicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <p className={mutedText}>Loading courses...</p>
              </div>
            </div>
          ) : !selectedDepartment ? (
            <div className={`${isDark ? 'bg-gray-900/50' : 'bg-white'} rounded-xl p-16 border ${isDark ? 'border-white/5' : 'border-gray-200'} text-center`}>
              <BookOpen className={`w-16 h-16 mx-auto mb-4 ${mutedText} opacity-50`} />
              <p className={`${text} font-semibold text-lg mb-2`}>Select a Department</p>
              <p className={`text-sm ${mutedText}`}>
                Choose a department from the sidebar to view its courses
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className={`${isDark ? 'bg-gray-900/50' : 'bg-white'} rounded-xl p-16 border ${isDark ? 'border-white/5' : 'border-gray-200'} text-center`}>
              <BookOpen className={`w-16 h-16 mx-auto mb-4 ${mutedText} opacity-50`} />
              <p className={`${text} font-semibold text-lg mb-2`}>No courses found</p>
              <p className={`text-sm ${mutedText}`}>
                {search || semesterFilter !== 'all' || academicYearFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No courses found in this department'}
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.course_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`p-5 rounded-lg border transition-all hover:shadow-sm ${
                    isDark 
                      ? 'bg-gray-900/50 border-white/10 hover:border-white/20' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Course Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'
                        }`}>
                          <BookOpen className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold ${text} text-lg truncate`}>
                            {course.course_code}
                          </h3>
                          <p className={`text-sm ${mutedText} truncate`}>
                            {course.course_name}
                          </p>
                        </div>
                      </div>
                      
                      {/* Course Info */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`w-3.5 h-3.5 ${mutedText}`} />
                          <span className={mutedText}>{course.semester} {course.academic_year}</span>
                        </div>
                        {course.instructor && (
                          <div className="flex items-center gap-1.5">
                            <UserIcon className={`w-3.5 h-3.5 ${mutedText}`} />
                            <span className={mutedText}>{course.instructor}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Success Rate Badge and Actions */}
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-lg border ${getSuccessRateBg(course.success_rate)}`}>
                        <p className={`text-sm font-bold ${getSuccessRateColor(course.success_rate)}`}>
                          {course.success_rate}%
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEditCourse(course)}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                          title="Edit Course"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteCourse(course.course_id)}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/50">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className={`w-3.5 h-3.5 ${mutedText}`} />
                        <p className={`text-xs ${mutedText}`}>Students</p>
                      </div>
                      <p className={`text-lg font-bold ${text}`}>{course.total_students}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Award className={`w-3.5 h-3.5 ${mutedText}`} />
                        <p className={`text-xs ${mutedText}`}>Success</p>
                      </div>
                      <p className={`text-lg font-bold ${text}`}>
                        {course.successful_students}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className={`w-3.5 h-3.5 ${mutedText}`} />
                        <p className={`text-xs ${mutedText}`}>Avg Grade</p>
                      </div>
                      <p className={`text-lg font-bold ${text}`}>
                        {course.average_grade !== null ? `${course.average_grade}%` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Success Rate Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs ${mutedText}`}>Success Rate</span>
                      <span className={`text-xs font-semibold ${getSuccessRateColor(course.success_rate)}`}>
                        {course.successful_students}/{course.total_students} students
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.success_rate}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                        className={`h-full rounded-full ${
                          course.success_rate >= 80 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : course.success_rate >= 60
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            : 'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Course Edit/Add Modal */}
      <AnimatePresence>
        {courseEditModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCourseModal}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}
              >
                <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                      <BookOpen className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${text}`}>
                        {editingCourse ? 'Edit Course' : 'Add Course'}
                      </h2>
                      <p className={`text-sm ${mutedText} mt-1`}>
                        {editingCourse ? 'Update course information' : `Add a new course to ${selectedDepartment || 'department'}`}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCloseCourseModal}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <form onSubmit={handleSaveCourse} className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Course Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={courseForm.code}
                          onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                          placeholder="e.g. CS101"
                          required
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Credits <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={courseForm.credits}
                          onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) || 3 })}
                          required
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                        Course Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={courseForm.name}
                        onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                        placeholder="e.g. Introduction to Computer Science"
                        required
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                        Description
                      </label>
                      <textarea
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                        placeholder="Course description..."
                        rows={3}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium resize-y`}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Year of Study
                        </label>
                        <select
                          value={courseForm.year || ''}
                          onChange={(e) => setCourseForm({ ...courseForm, year: e.target.value ? parseInt(e.target.value) : null })}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                        >
                          <option value="">Select Year (Optional)</option>
                          <option value={1}>Year 1</option>
                          <option value={2}>Year 2</option>
                          <option value={3}>Year 3</option>
                          <option value={4}>Year 4</option>
                          <option value={5}>Year 5</option>
                          <option value={6}>Year 6</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Semester <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={courseForm.semester}
                          onChange={(e) => setCourseForm({ ...courseForm, semester: parseInt(e.target.value) })}
                          required
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                        >
                          <option value={1}>Fall</option>
                          <option value={2}>Spring</option>
                          <option value={3}>Summer</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Academic Year <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={courseForm.academic_year}
                          onChange={(e) => setCourseForm({ ...courseForm, academic_year: e.target.value })}
                          placeholder="e.g. 2024-2025"
                          required
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                        Instructor (Optional)
                      </label>
                      <select
                        value={courseForm.teacher || ''}
                        onChange={(e) => setCourseForm({ ...courseForm, teacher: e.target.value || null })}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                      >
                        <option value="">Select Teacher (Optional)</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.first_name} {teacher.last_name} ({teacher.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCloseCourseModal}
                        className={`flex-1 px-5 py-3.5 rounded-xl border transition-all duration-200 font-semibold text-sm ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={savingCourse}
                        className={`flex-1 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'} ${savingCourse ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {savingCourse ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            {editingCourse ? <Edit2 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                            {editingCourse ? 'Update Course' : 'Add Course'}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

