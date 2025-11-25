'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Building2, PlusCircle, RefreshCw, Search, Users, BookOpen, Award, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

interface Department {
  name: string;
  students: number;
  courses: number;
  faculty: number;
  avg_grade: number | null;
  po_achievement: number | null;
  status: 'excellent' | 'good' | 'needs-attention';
}

interface CreateDepartmentForm {
  name: string;
}

export default function DepartmentsPage() {
  const [mounted, setMounted] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<CreateDepartmentForm>({ name: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const {
    mounted: themeMounted,
    themeClasses,
    text,
    mutedText,
    isDark,
  } = useThemeColors();

  useEffect(() => {
    setMounted(true);
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (error: any) {
      console.error('Failed to load departments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearch(query);
  };

  const filteredDepartments = departments
    .filter(dept => dept.name.toLowerCase().includes(search.toLowerCase()))
    // Remove duplicates by name (keep first occurrence)
    .filter((dept, index, self) => 
      index === self.findIndex(d => d.name.toLowerCase() === dept.name.toLowerCase())
    );

  const handleInputChange = (field: keyof CreateDepartmentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormError(null);
    setFormSuccess(null);
    setForm({ name: '' });
  };

  const handleCreateDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!form.name.trim()) {
      setFormError('Department name is required.');
      return;
    }

    // Check if department already exists
    if (departments.some(dept => dept.name.toLowerCase() === form.name.trim().toLowerCase())) {
      setFormError('Department already exists.');
      return;
    }

    try {
      setCreating(true);
      // For now, we'll just add it to the list locally
      // In a real implementation, you'd call an API endpoint
      const newDept: Department = {
        name: form.name.trim(),
        students: 0,
        courses: 0,
        faculty: 0,
        avg_grade: null,
        po_achievement: null,
        status: 'needs-attention',
      };
      setDepartments([...departments, newDept].sort((a, b) => a.name.localeCompare(b.name)));
      setFormSuccess('Department created successfully.');
      setTimeout(() => {
        handleCloseForm();
        setFormSuccess(null);
      }, 1500);
    } catch (error: any) {
      setFormError(error.message || 'Failed to create department.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDepartment = async (departmentName: string) => {
    if (!confirm(`Are you sure you want to delete "${departmentName}"? This action cannot be undone.`)) {
      return;
    }
    // In a real implementation, you'd call an API endpoint
    setDepartments(departments.filter(dept => dept.name !== departmentName));
  };

  if (!mounted || !themeMounted) {
    return null;
  }

  return (
    <div className={`${inter.variable} font-sans`} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      <div className="space-y-8">
        {/* Unified Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-xl ${themeClasses.card} rounded-3xl p-8 shadow-lg ${isDark ? 'shadow-purple-500/5 border border-white/5' : 'shadow-gray-200/50 border border-gray-100'}`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <p className={`text-sm font-medium ${mutedText} tracking-wide uppercase`}>Organization Management</p>
              <h1 className={`text-4xl font-bold ${text} tracking-tight`}>Departments</h1>
              <p className={`text-base ${mutedText} mt-2`}>Manage academic departments and their configurations.</p>
            </div>
            
            {/* Unified Search, Refresh, and Add Department Bar */}
            <div className="flex items-center gap-3 flex-1 lg:flex-initial lg:max-w-2xl">
              <div className="flex-1 relative">
                <Search className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-purple-400/60' : 'text-purple-500/60'}`} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search departments..."
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchDepartments}
                disabled={loading}
                className={`px-5 py-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-2.5 font-medium text-sm ${isDark ? 'bg-white/[0.05] border-white/10 text-white hover:bg-white/[0.08]' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsFormOpen(true)}
                className={`px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center gap-2.5 ${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'}`}
              >
                <PlusCircle className="w-4 h-4" />
                Add Department
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Departments Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                <p className={mutedText}>Loading departments...</p>
              </div>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className={`backdrop-blur-xl ${themeClasses.card} rounded-3xl p-16 shadow-lg ${isDark ? 'shadow-purple-500/5 border border-white/5' : 'shadow-gray-200/50 border border-gray-100'} text-center`}>
              <Building2 className={`w-16 h-16 mx-auto mb-4 ${mutedText} opacity-50`} />
              <p className={`${text} font-semibold text-lg mb-2`}>No departments found</p>
              <p className={`text-sm ${mutedText}`}>
                {search ? 'Try adjusting your search criteria' : 'Get started by creating your first department'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepartments.map((department, index) => (
                <motion.div
                  key={`${department.name}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className={`group backdrop-blur-xl ${themeClasses.card} rounded-2xl p-6 shadow-lg ${isDark ? 'shadow-purple-500/5 border border-white/5 hover:border-white/10' : 'shadow-gray-200/50 border border-gray-100 hover:border-gray-200'} transition-all duration-200 cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                          <Building2 className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                        <h3 className={`font-bold ${text} text-lg`}>{department.name}</h3>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                        department.status === 'excellent' 
                          ? (isDark ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200')
                          : department.status === 'good'
                          ? (isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200')
                          : (isDark ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200')
                      }`}>
                        {department.status === 'excellent' ? '🏆 Excellent' : 
                         department.status === 'good' ? '✓ Good' : '⚠ Needs Attention'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Edit functionality would go here
                        }}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDepartment(department.name);
                        }}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className={`w-4 h-4 ${mutedText}`} />
                          <span className={`text-xs font-medium uppercase tracking-wider ${mutedText}`}>Students</span>
                        </div>
                        <p className={`text-2xl font-bold ${text}`}>{department.students}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className={`w-4 h-4 ${mutedText}`} />
                          <span className={`text-xs font-medium uppercase tracking-wider ${mutedText}`}>Faculty</span>
                        </div>
                        <p className={`text-2xl font-bold ${text}`}>{department.faculty}</p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className={`w-4 h-4 ${mutedText}`} />
                        <span className={`text-xs font-medium uppercase tracking-wider ${mutedText}`}>Courses</span>
                      </div>
                      <p className={`text-2xl font-bold ${text}`}>{department.courses}</p>
                    </div>
                    {department.avg_grade !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={mutedText}>Avg Grade</span>
                          <span className={`font-semibold ${text}`}>{department.avg_grade}%</span>
                        </div>
                        <div className={`h-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${department.avg_grade}%` }}
                            transition={{ duration: 1 }}
                            style={{
                              backgroundImage: `linear-gradient(to right, 
                                ${department.avg_grade >= 85 ? '#10B981' : department.avg_grade >= 75 ? '#3B82F6' : '#F97316'}, 
                                ${department.avg_grade >= 85 ? '#059669' : department.avg_grade >= 75 ? '#06B6D4' : '#EF4444'}
                              )` 
                            }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>
                    )}
                    {department.po_achievement !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={mutedText}>PO Achievement</span>
                          <span className={`font-semibold ${text}`}>{department.po_achievement}%</span>
                        </div>
                        <div className={`h-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${department.po_achievement}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            style={{
                              backgroundImage: `linear-gradient(to right, 
                                ${department.po_achievement >= 80 ? '#10B981' : department.po_achievement >= 70 ? '#3B82F6' : '#F97316'}, 
                                ${department.po_achievement >= 80 ? '#059669' : department.po_achievement >= 70 ? '#06B6D4' : '#EF4444'}
                              )` 
                            }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Slide-Over Panel for Create Department Form */}
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
                className={`fixed right-0 top-0 h-full w-full max-w-lg ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl z-50 flex flex-col`}
              >
                {/* Header */}
                <div className={`flex items-center justify-between p-8 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                      <PlusCircle className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${text}`}>Create Department</h2>
                      <p className={`text-sm ${mutedText} mt-1`}>Add a new academic department</p>
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

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-8">
                  <form className="space-y-6" onSubmit={handleCreateDepartment}>
                    <div className="space-y-2">
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                        Department Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g. Computer Engineering"
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                        required
                      />
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
                          className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2.5 ${creating ? 'opacity-70 cursor-not-allowed' : ''} ${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'}`}
                        >
                          {creating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-4 h-4" />
                              Create Department
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
    </div>
  );
}

