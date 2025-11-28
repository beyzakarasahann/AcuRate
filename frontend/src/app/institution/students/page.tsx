'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GraduationCap, Search, Mail, Building2, Loader2, User as UserIcon, BookOpen, Filter, RefreshCw } from 'lucide-react';
import { api, type User } from '@/lib/api';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Inter } from 'next/font/google';

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
      setError(error.message || 'Failed to load students');
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
                  className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
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
                      <h4 className={`font-semibold ${text} text-base mb-1 truncate`}>
                        {student.first_name} {student.last_name}
                      </h4>
                      
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
    </div>
  );
}
