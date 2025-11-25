'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Users, PlusCircle, RefreshCw, Search, Mail, Phone, Building2, Loader2, X } from 'lucide-react';
import { api, type User } from '@/lib/api';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

interface CreateTeacherForm {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  department: string;
  phone: string;
  password: string;
  password_confirm: string;
}

export default function TeachersPage() {
  const [mounted, setMounted] = useState(false);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CreateTeacherForm>({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    department: '',
    phone: '',
    password: '',
    password_confirm: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    mounted: themeMounted,
    themeClasses,
    text,
    mutedText,
    isDark,
    accentStart,
    accentEnd,
  } = useThemeColors();

  useEffect(() => {
    setMounted(true);
    fetchTeachers();
  }, []);

  const fetchTeachers = async (query?: string) => {
    try {
      setLoading(true);
      const data = await api.getTeachers(query ? { search: query } : undefined);
      setTeachers(data);
    } catch (error: any) {
      console.error('Failed to load teachers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetchTeachers(search.trim() || undefined);
  };

  const handleInputChange = (field: keyof CreateTeacherForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormError(null);
    setFormSuccess(null);
    setForm({
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      department: '',
      phone: '',
      password: '',
      password_confirm: '',
    });
  };

  const validateForm = () => {
    if (!form.first_name || !form.last_name || !form.username || !form.email) {
      setFormError('Please fill in the required fields.');
      return false;
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return false;
    }
    if (form.password !== form.password_confirm) {
      setFormError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleCreateTeacher = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);
      await api.createTeacher({
        username: form.username,
        email: form.email,
        password: form.password,
        password_confirm: form.password_confirm,
        first_name: form.first_name,
        last_name: form.last_name,
        department: form.department || undefined,
        phone: form.phone || undefined,
      });
      setFormSuccess('Teacher account created successfully.');
      setForm({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        department: '',
        phone: '',
        password: '',
        password_confirm: '',
      });
      await fetchTeachers(search.trim() || undefined);
      // Close panel after a short delay to show success message
      setTimeout(() => {
        setIsFormOpen(false);
        setFormSuccess(null);
      }, 1500);
    } catch (error: any) {
      setFormError(error.message || 'Failed to create teacher.');
    } finally {
      setCreating(false);
    }
  };

  if (!mounted || !themeMounted) {
    return null;
  }

  // Muted purple accent colors (reduced saturation)
  const mutedPurple = isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)';
  const mutedPurpleBorder = isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.2)';
  const mutedPurpleAccent = isDark ? '#a78bfa' : '#8b5cf6';

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
              <p className={`text-sm font-medium ${mutedText} tracking-wide uppercase`}>Faculty Management</p>
              <h1 className={`text-4xl font-bold ${text} tracking-tight`}>Teacher Directory</h1>
              <p className={`text-base ${mutedText} mt-2`}>View, search, and onboard teachers from one place.</p>
            </div>
            
            {/* Unified Search, Refresh, and Add Teacher Bar */}
            <div className="flex items-center gap-3 flex-1 lg:flex-initial lg:max-w-2xl">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-purple-400/60' : 'text-purple-500/60'}`} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or department..."
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                />
              </form>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fetchTeachers(search.trim() || undefined)}
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
                Add Teacher
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8">
          {/* Teacher List - Full Width */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className={`backdrop-blur-xl ${themeClasses.card} rounded-3xl p-8 shadow-lg ${isDark ? 'shadow-purple-500/5 border border-white/5' : 'shadow-gray-200/50 border border-gray-100'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h2 className={`text-2xl font-bold ${text} flex items-center gap-3`}>
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                      <Users className={`w-5 h-5 ${mutedPurpleAccent}`} />
                    </div>
                    Active Teachers
                  </h2>
                  <p className={`text-sm ${mutedText} ml-14`}>{teachers.length} {teachers.length === 1 ? 'teacher' : 'teachers'} found</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                    <p className={mutedText}>Loading teachers...</p>
                  </div>
                </div>
              ) : teachers.length === 0 ? (
                <div className="text-center py-16">
                  <Users className={`w-12 h-12 mx-auto mb-4 ${mutedText} opacity-50`} />
                  <p className={`${text} font-medium mb-1`}>No teachers found</p>
                  <p className={`text-sm ${mutedText}`}>Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teachers.map((teacher) => (
                    <motion.div
                      key={teacher.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      className={`group rounded-2xl border p-5 transition-all duration-200 ${isDark ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/15' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'} cursor-pointer`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold ${text} text-base mb-1 truncate`}>
                            {teacher.first_name} {teacher.last_name}
                          </h3>
                          <p className={`text-xs font-medium uppercase tracking-wider ${mutedText} mb-3`}>
                            {teacher.department || 'No department'}
                          </p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0 ml-2 ${teacher.is_active 
                          ? (isDark ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200')
                          : (isDark ? 'bg-gray-500/15 text-gray-400 border border-gray-500/20' : 'bg-gray-50 text-gray-600 border border-gray-200')
                        }`}>
                          {teacher.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="space-y-2.5">
                        <div className={`flex items-center gap-2.5 text-sm ${mutedText}`}>
                          <Mail className="w-4 h-4 shrink-0" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                        {teacher.phone && (
                          <div className={`flex items-center gap-2.5 text-sm ${mutedText}`}>
                            <Phone className="w-4 h-4 shrink-0" />
                            <span>{teacher.phone}</span>
                          </div>
                        )}
                        <div className={`flex items-center gap-2.5 text-sm ${mutedText}`}>
                          <Building2 className="w-4 h-4 shrink-0" />
                          <span className="truncate">{teacher.department || 'Not set'}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Slide-Over Panel for Create Teacher Form */}
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
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                      <PlusCircle className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${text}`}>Create Teacher</h2>
                      <p className={`text-sm ${mutedText} mt-1`}>Add a new teacher to the system</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setIsFormOpen(false);
                      setFormError(null);
                      setFormSuccess(null);
                    }}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Form Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8">
                  <form className="space-y-6" onSubmit={handleCreateTeacher}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                          First Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
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
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                        Username <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                        Department
                      </label>
                      <input
                        type="text"
                        value={form.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        placeholder="e.g. Computer Engineering"
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                        Phone
                      </label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+90 555 123 4567"
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                          Password <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="password"
                          value={form.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          minLength={8}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                          Confirm <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="password"
                          value={form.password_confirm}
                          onChange={(e) => handleInputChange('password_confirm', e.target.value)}
                          minLength={8}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                          required
                        />
                      </div>
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
                              Create Teacher
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

