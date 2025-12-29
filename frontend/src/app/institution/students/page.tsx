'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GraduationCap, Search, Mail, Building2, Loader2, User as UserIcon, BookOpen, Filter, RefreshCw, PlusCircle, X, Trash2, Calendar, Hash, Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { api, type User } from '@/lib/api';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Inter } from 'next/font/google';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

interface StudentWithDepartment extends User {
  department: string;
}

export default function StudentsPage() {
  const [mounted, setMounted] = useState(false);
  const [allStudents, setAllStudents] = useState<StudentWithDepartment[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    student_id: '',
    year_of_study: 1,
  });
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDepartment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);

  const {
    mounted: themeMounted,
    themeClasses,
    text,
    mutedText,
    isDark,
  } = useThemeColors();

  useEffect(() => {
    setMounted(true);
    fetchStudents();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (departments.length > 0 && !selectedDepartment) {
      setSelectedDepartment(departments[0]);
    }
  }, [departments]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStudents();
      const studentsWithDept = data.filter(s => s.department) as StudentWithDepartment[];
      setAllStudents(studentsWithDept);
    } catch (error: any) {
      console.error('Failed to load students', error);
      const errorMsg = error.message || 'Failed to load students';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      // Get departments from multiple sources and merge them
      const allDeptNames = new Set<string>();
      
      // 1. Get departments from database (CRUD list)
      try {
        const deptListData = await api.getDepartmentsList();
        deptListData.forEach(dept => {
          if (dept.name?.trim()) {
            allDeptNames.add(dept.name.trim());
          }
        });
      } catch (error) {
        console.warn('Failed to load departments list', error);
      }
      
      // 2. Get departments from analytics (includes departments from students)
      try {
        const analyticsDeptData = await api.getDepartments();
        analyticsDeptData.forEach(dept => {
          if (dept.name?.trim()) {
            allDeptNames.add(dept.name.trim());
          }
        });
      } catch (error) {
        console.warn('Failed to load analytics departments', error);
      }
      
      // 3. Get departments from existing students (to catch any missing ones)
      try {
        const studentsData = await api.getStudents();
        studentsData.forEach(student => {
          if (student.department?.trim()) {
            allDeptNames.add(student.department.trim());
          }
        });
      } catch (error) {
        console.warn('Failed to load students for department list', error);
      }
      
      // Convert to sorted array
      const deptNames = Array.from(allDeptNames).sort();
      setDepartments(deptNames);
    } catch (error: any) {
      console.error('Failed to load departments', error);
      // Final fallback: try analytics only
      try {
        const deptData = await api.getDepartments();
        const deptNames = Array.from(new Set(deptData.map(dept => dept.name.trim()))).sort();
        setDepartments(deptNames);
      } catch (fallbackError: any) {
        console.error('Failed to load departments (fallback)', fallbackError);
      }
    }
  };

  const handleInputChange = (field: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormError(null);
    setFormSuccess(null);
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      department: selectedDepartment || '',
      student_id: '',
      year_of_study: 1,
    });
  };

  const validateForm = () => {
    if (!form.first_name || !form.last_name || !form.email) {
      setFormError('Please fill in the required fields.');
      return false;
    }
    return true;
  };

  const handleCreateStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!validateForm()) {
      return;
    }

    const toastId = toast.loading('Creating student account...');
    try {
      setCreating(true);
      const response = await api.createStudent({
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        department: form.department || undefined,
        student_id: form.student_id || undefined,
        year_of_study: form.year_of_study || undefined,
      });
      
      if (response.success) {
        toast.success('Student account created successfully! A one-time password has been emailed.', { id: toastId });
        setForm({
          first_name: '',
          last_name: '',
          email: '',
          department: selectedDepartment || '',
          student_id: '',
          year_of_study: 1,
        });
        await fetchStudents();
        setTimeout(() => {
          setIsFormOpen(false);
        }, 500);
      } else {
        toast.error(response.email_error || 'Failed to create student account.', { id: toastId });
        setFormError(response.email_error || 'Failed to create student.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create student account.', { id: toastId });
      setFormError(error.message || 'Failed to create student.');
    } finally {
      setCreating(false);
    }
  };

  const handleStudentClick = async (student: StudentWithDepartment) => {
    try {
      // Fetch full student details
      const fullStudent = await api.getUserById(student.id);
      setSelectedStudent(fullStudent as StudentWithDepartment);
      setIsDetailModalOpen(true);
    } catch (error: any) {
      console.error('Failed to fetch student details:', error);
      toast.error('Failed to load student details');
      // Fallback to the student data we already have
      setSelectedStudent(student);
      setIsDetailModalOpen(true);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, student: StudentWithDepartment) => {
    e.stopPropagation(); // Prevent opening detail modal
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;

    const toastId = toast.loading('Deleting student...');
    try {
      setDeletingStudentId(selectedStudent.id);
      await api.deleteUser(selectedStudent.id);
      toast.success('Student deleted successfully', { id: toastId });
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
      await fetchStudents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete student', { id: toastId });
    } finally {
      setDeletingStudentId(null);
    }
  };

  // Filter students based on selected department, search, and year
  const filteredStudents = allStudents.filter(student => {
    const matchesDepartment = !selectedDepartment || student.department === selectedDepartment;
    
    const matchesSearch = !search || 
      student.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      student.email?.toLowerCase().includes(search.toLowerCase()) ||
      student.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(search.toLowerCase());
    
    const matchesYear = yearFilter === 'all' || 
      (student.year_of_study && student.year_of_study.toString() === yearFilter);
    
    return matchesDepartment && matchesSearch && matchesYear;
  });

  const selectedDepartmentData = departments.find(d => d === selectedDepartment);
  const selectedDepartmentCount = allStudents.filter(s => s.department === selectedDepartment).length;

  // Get unique years for filter
  const availableYears = Array.from(
    new Set(allStudents
      .filter(s => s.year_of_study)
      .map(s => s.year_of_study?.toString())
      .filter((y): y is string => !!y)
    )
  ).sort((a, b) => parseInt(a) - parseInt(b));

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
                  const deptCount = allStudents.filter(s => s.department === dept).length;
                  
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

            {/* Total Students Summary */}
            <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className={`px-4 py-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                <p className={`text-xs ${mutedText} mb-1`}>Total Students</p>
                <p className={`text-2xl font-bold ${text}`}>{allStudents.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Students View */}
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
                    {selectedDepartmentCount} {selectedDepartmentCount === 1 ? 'student' : 'students'}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsFormOpen(true)}
                  className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium ${
                    isDark 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Student
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsBulkImportOpen(true)}
                  className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium ${
                    isDark 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Bulk Add Students (CSV)
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={fetchStudents}
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
                    placeholder="Search by name, email, or student ID..."
                    className={`w-full pl-12 pr-4 py-3 rounded-lg border transition-all ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                    } focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm`}
                  />
                </div>
                
                {/* Year Filter */}
                <div className="sm:w-48">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    } focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm`}
                  >
                    <option value="all">All Years</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>Year {year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <p className={mutedText}>Loading students...</p>
              </div>
            </div>
          ) : !selectedDepartment ? (
            <div className={`${isDark ? 'bg-gray-900/50' : 'bg-white'} rounded-xl p-16 border ${isDark ? 'border-white/5' : 'border-gray-200'} text-center`}>
              <GraduationCap className={`w-16 h-16 mx-auto mb-4 ${mutedText} opacity-50`} />
              <p className={`${text} font-semibold text-lg mb-2`}>Select a Department</p>
              <p className={`text-sm ${mutedText}`}>
                Choose a department from the sidebar to view its students
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className={`${isDark ? 'bg-gray-900/50' : 'bg-white'} rounded-xl p-16 border ${isDark ? 'border-white/5' : 'border-gray-200'} text-center`}>
              <GraduationCap className={`w-16 h-16 mx-auto mb-4 ${mutedText} opacity-50`} />
              <p className={`${text} font-semibold text-lg mb-2`}>No students found</p>
              <p className={`text-sm ${mutedText}`}>
                {search || yearFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No students found in this department'}
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredStudents.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => handleStudentClick(student)}
                  className={`p-4 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${
                    isDark 
                      ? 'bg-gray-900/50 border-white/10 hover:border-white/20' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                      isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'
                    }`}>
                      <UserIcon className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-semibold ${text} text-base mb-1 truncate`}>
                          {student.first_name} {student.last_name}
                        </h4>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleDeleteClick(e, student)}
                          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                            isDark
                              ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                              : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                          }`}
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                      
                      {student.student_id && (
                        <p className={`text-xs ${mutedText} mb-2`}>
                          ID: <span className="font-mono">{student.student_id}</span>
                        </p>
                      )}
                      
                      <div className="space-y-1.5 mt-3">
                        {student.email && (
                          <div className="flex items-center gap-2">
                            <Mail className={`w-3.5 h-3.5 ${mutedText} flex-shrink-0`} />
                            <p className={`text-xs ${mutedText} truncate`}>{student.email}</p>
                          </div>
                        )}
                        {student.year_of_study && (
                          <div className="flex items-center gap-2">
                            <BookOpen className={`w-3.5 h-3.5 ${mutedText} flex-shrink-0`} />
                            <p className={`text-xs ${mutedText}`}>Year {student.year_of_study}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Slide-Over Panel for Create Student Form */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleCloseForm}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Slide-Over Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed right-0 top-0 h-full w-full max-w-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl z-50 flex flex-col`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-8 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                    <PlusCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${text}`}>Create Student</h2>
                    <p className={`text-sm ${mutedText} mt-1`}>Add a new student to the system</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCloseForm}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Form Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-8">
                <form className="space-y-6" onSubmit={handleCreateStudent}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                        First Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 outline-none text-sm font-medium`}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                        Last Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 outline-none text-sm font-medium`}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 outline-none text-sm font-medium`}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                        Department <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={form.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 outline-none text-sm font-medium`}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                        Year of Study
                      </label>
                      <select
                        value={form.year_of_study}
                        onChange={(e) => handleInputChange('year_of_study', parseInt(e.target.value))}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 outline-none text-sm font-medium`}
                      >
                        {[1, 2, 3, 4, 5, 6].map(year => (
                          <option key={year} value={year}>Year {year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                      Student ID (Optional - Auto-generated if not provided)
                    </label>
                    <input
                      type="text"
                      value={form.student_id}
                      onChange={(e) => handleInputChange('student_id', e.target.value)}
                      placeholder="e.g. 2024001"
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 outline-none text-sm font-medium`}
                    />
                  </div>
                  
                  {/* Info box: password will be emailed */}
                  <div className={`p-3.5 rounded-xl text-xs sm:text-sm ${isDark ? 'bg-green-500/10 text-green-200 border border-green-500/30' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                    When you create this student, a one-time temporary password will be generated and sent directly to their email address. They must change it on first login.
                  </div>

                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-xl text-sm font-medium ${isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200'}`}
                    >
                      {formError}
                    </motion.div>
                  )}
                  {formSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-xl text-sm font-medium ${isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200'}`}
                    >
                      {formSuccess}
                    </motion.div>
                  )}

                  {/* Footer with Submit Button */}
                  <div className={`pt-6 mt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-end gap-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCloseForm}
                        className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${isDark ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: creating ? 1 : 1.02 }}
                        whileTap={{ scale: creating ? 1 : 0.98 }}
                        disabled={creating}
                        className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2.5 ${creating ? 'opacity-70 cursor-not-allowed' : ''} ${isDark ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20' : 'bg-green-600 hover:bg-green-700 text-white shadow-md'}`}
                      >
                        {creating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-4 h-4" />
                            Create Student
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

      {/* Student Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedStudent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Detail Modal */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed right-0 top-0 h-full w-full max-w-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl z-50 flex flex-col`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-8 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                    <UserIcon className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${text}`}>
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h2>
                    <p className={`text-sm ${mutedText} mt-1`}>Student Details</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsDetailModalOpen(false)}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className={`text-lg font-semibold ${text} mb-4`}>Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          First Name
                        </label>
                        <p className={`text-sm ${text} font-medium`}>{selectedStudent.first_name || '-'}</p>
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Last Name
                        </label>
                        <p className={`text-sm ${text} font-medium`}>{selectedStudent.last_name || '-'}</p>
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Email
                        </label>
                        <div className="flex items-center gap-2">
                          <Mail className={`w-4 h-4 ${mutedText}`} />
                          <p className={`text-sm ${text} font-medium`}>{selectedStudent.email || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Username
                        </label>
                        <p className={`text-sm ${text} font-medium font-mono`}>{selectedStudent.username || '-'}</p>
                      </div>
                      {selectedStudent.phone && (
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Phone
                          </label>
                          <p className={`text-sm ${text} font-medium`}>{selectedStudent.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div>
                    <h3 className={`text-lg font-semibold ${text} mb-4`}>Academic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedStudent.student_id && (
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Student ID
                          </label>
                          <div className="flex items-center gap-2">
                            <Hash className={`w-4 h-4 ${mutedText}`} />
                            <p className={`text-sm ${text} font-medium font-mono`}>{selectedStudent.student_id}</p>
                          </div>
                        </div>
                      )}
                      {selectedStudent.department && (
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Department
                          </label>
                          <div className="flex items-center gap-2">
                            <Building2 className={`w-4 h-4 ${mutedText}`} />
                            <p className={`text-sm ${text} font-medium`}>{selectedStudent.department}</p>
                          </div>
                        </div>
                      )}
                      {selectedStudent.year_of_study && (
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Year of Study
                          </label>
                          <div className="flex items-center gap-2">
                            <BookOpen className={`w-4 h-4 ${mutedText}`} />
                            <p className={`text-sm ${text} font-medium`}>Year {selectedStudent.year_of_study}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Information */}
                  <div>
                    <h3 className={`text-lg font-semibold ${text} mb-4`}>Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Account Status
                        </label>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedStudent.is_active
                            ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                            : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedStudent.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {selectedStudent.is_temporary_password && (
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Password Status
                          </label>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                          }`}>
                            Temporary Password
                          </span>
                        </div>
                      )}
                      {selectedStudent.created_at && (
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Created At
                          </label>
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-4 h-4 ${mutedText}`} />
                            <p className={`text-sm ${text} font-medium`}>
                              {new Date(selectedStudent.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`p-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-center justify-end gap-3`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsDetailModalOpen(false)}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isDark ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Close
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    setIsDetailModalOpen(false);
                    handleDeleteClick(e, selectedStudent);
                  }}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isDark
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                  }`}
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Delete Student
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        message={selectedStudent 
          ? `Are you sure you want to delete ${selectedStudent.first_name} ${selectedStudent.last_name}? This action cannot be undone and all associated data will be permanently removed.`
          : 'Are you sure you want to delete this student?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deletingStudentId !== null}
      />

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {isBulkImportOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                if (!importing) {
                  setIsBulkImportOpen(false);
                  setCsvFile(null);
                  setImportError(null);
                  setImportSuccess(null);
                  setImportResults(null);
                }
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg ${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl z-50 border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                    <FileSpreadsheet className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${text}`}>Bulk Add Students</h2>
                    <p className={`text-sm ${mutedText}`}>Import students from CSV file</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (!importing) {
                      setIsBulkImportOpen(false);
                      setCsvFile(null);
                      setImportError(null);
                      setImportSuccess(null);
                      setImportResults(null);
                    }
                  }}
                  disabled={importing}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'} ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* File Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('ring-2', 'ring-emerald-500');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('ring-2', 'ring-emerald-500');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('ring-2', 'ring-emerald-500');
                    const file = e.dataTransfer.files[0];
                    // Validate by file extension (Windows may send different MIME types)
                    if (file && file.name.toLowerCase().endsWith('.csv')) {
                      setCsvFile(file);
                      setImportError(null);
                      setImportSuccess(null);
                      setImportResults(null);
                    } else {
                      setImportError('Please select a valid CSV file (.csv extension).');
                    }
                  }}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    isDark
                      ? 'border-white/20 hover:border-white/40 bg-white/[0.02]'
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  } ${csvFile ? (isDark ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-emerald-500 bg-emerald-50') : ''}`}
                >
                  <input
                    type="file"
                    accept=".csv, text/csv, application/vnd.ms-excel, application/csv, text/x-csv, text/plain"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validate by file extension (Windows may send different MIME types)
                        if (file.name.toLowerCase().endsWith('.csv')) {
                          setCsvFile(file);
                          setImportError(null);
                          setImportSuccess(null);
                          setImportResults(null);
                        } else {
                          setImportError('Please select a valid CSV file (.csv extension).');
                          e.target.value = ''; // Reset input
                        }
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={importing}
                  />
                  
                  {csvFile ? (
                    <div className="space-y-2">
                      <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                        <CheckCircle className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      </div>
                      <p className={`font-medium ${text}`}>{csvFile.name}</p>
                      <p className={`text-sm ${mutedText}`}>
                        {(csvFile.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCsvFile(null);
                        }}
                        className={`text-sm ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} underline`}
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                        <Upload className={`w-6 h-6 ${mutedText}`} />
                      </div>
                      <div>
                        <p className={`font-medium ${text}`}>
                          Drag and drop CSV file
                        </p>
                        <p className={`text-sm ${mutedText} mt-1`}>
                          or click to select file
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Download Template Link */}
                <div className={`flex items-center justify-center gap-2 text-sm ${mutedText}`}>
                  <Download className="w-4 h-4" />
                  <a
                    href="/templates/students_template.csv"
                    download
                    className={`underline hover:no-underline ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
                  >
                    Download sample CSV template
                  </a>
                </div>

                {/* Error Message */}
                {importError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-start gap-3 ${
                      isDark 
                        ? 'bg-red-500/10 border border-red-500/30' 
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                        Error
                      </p>
                      <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'} mt-0.5`}>
                        {importError}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Success Message */}
                {importSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-start gap-3 ${
                      isDark 
                        ? 'bg-emerald-500/10 border border-emerald-500/30' 
                        : 'bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    <CheckCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        {importSuccess}
                      </p>
                      {importResults && (
                        <div className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-600'} mt-1 space-y-0.5`}>
                          {importResults.created > 0 && <p>✓ {importResults.created} new students added</p>}
                          {importResults.updated > 0 && <p>✓ {importResults.updated} students updated</p>}
                          {importResults.errors && importResults.errors.length > 0 && (
                            <div className={`mt-2 text-xs ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                              <p className="font-medium">Errors occurred in some rows:</p>
                              <ul className="list-disc list-inside mt-1 max-h-24 overflow-y-auto">
                                {importResults.errors.slice(0, 5).map((err, i) => (
                                  <li key={i}>{err}</li>
                                ))}
                                {importResults.errors.length > 5 && (
                                  <li>... and {importResults.errors.length - 5} more errors</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className={`p-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-center justify-end gap-3`}>
                <motion.button
                  whileHover={{ scale: importing ? 1 : 1.02 }}
                  whileTap={{ scale: importing ? 1 : 0.98 }}
                  onClick={() => {
                    if (!importing) {
                      setIsBulkImportOpen(false);
                      setCsvFile(null);
                      setImportError(null);
                      setImportSuccess(null);
                      setImportResults(null);
                    }
                  }}
                  disabled={importing}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isDark ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  } ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: importing || !csvFile ? 1 : 1.02 }}
                  whileTap={{ scale: importing || !csvFile ? 1 : 0.98 }}
                  onClick={async () => {
                    if (!csvFile) return;
                    
                    setImporting(true);
                    setImportError(null);
                    setImportSuccess(null);
                    setImportResults(null);
                    
                    const formData = new FormData();
                    formData.append('file', csvFile);
                    
                    try {
                      const result = await api.bulkImportStudents(formData);
                      
                      if (result.success) {
                        const totalImported = (result.created || 0) + (result.updated || 0);
                        setImportSuccess(`${totalImported} students processed successfully!`);
                        setImportResults({
                          created: result.created || 0,
                          updated: result.updated || 0,
                          errors: result.errors || [],
                        });
                        toast.success(`${totalImported} students imported successfully`);
                        setCsvFile(null);
                        await fetchStudents();
                      } else {
                        setImportError(result.error?.message || 'An error occurred during import.');
                      }
                    } catch (error: any) {
                      console.error('Bulk import error:', error);
                      setImportError(error.message || 'An error occurred during import.');
                      toast.error('Import failed');
                    } finally {
                      setImporting(false);
                    }
                  }}
                  disabled={importing || !csvFile}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                    importing || !csvFile ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isDark 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
