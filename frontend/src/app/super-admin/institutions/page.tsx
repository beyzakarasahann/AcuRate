'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Building2, Users, GraduationCap, BookOpen, Calendar, Mail, Phone, Search, Loader2, RefreshCw, TrendingUp, TrendingDown, Minus, Plus, X, AlertCircle, CheckCircle2, Trash2, AlertTriangle, KeyRound } from 'lucide-react';
import { api, Institution } from '@/lib/api';
import { useThemeColors } from '@/hooks/useThemeColors';
import toast from 'react-hot-toast';

export default function SuperAdminInstitutionsPage() {
  const { isDark, mounted, themeClasses, accentGradientClass } = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState<{
    total_institutions: number;
    total_students: number;
    total_teachers: number;
    total_courses: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Institution | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState<number | null>(null);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Institution Admin Info
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    // Institution Details
    institution_name: '',
    institution_type: '',
    department: '',
    address: '',
    city: '',
    country: '',
    website: '',
    description: '',
  });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    filterInstitutions();
  }, [institutions, searchTerm]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSuperAdminInstitutions();
      if (response.institutions && Array.isArray(response.institutions)) {
        setInstitutions(response.institutions);
      } else {
        setInstitutions([]);
      }
      if (response.summary) {
        setSummaryStats(response.summary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load institutions');
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInstitutions = () => {
    if (!Array.isArray(institutions)) {
      setFilteredInstitutions([]);
      return;
    }
    let filtered = [...institutions];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(inst =>
        inst.full_name.toLowerCase().includes(searchLower) ||
        inst.email.toLowerCase().includes(searchLower) ||
        inst.username.toLowerCase().includes(searchLower) ||
        (inst.department && inst.department.toLowerCase().includes(searchLower))
      );
    }

    setFilteredInstitutions(filtered);
  };

  const getLoginStatusBadge = (status: string) => {
    const configs = {
      never: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', text: 'Never' },
      today: { color: 'bg-green-500/20 text-green-400 border-green-500/30', text: 'Today' },
      recent: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', text: 'Recent' },
      month: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', text: 'This Month' },
      old: { color: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'Old' },
    };
    const config = configs[status as keyof typeof configs] || configs.never;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const response = await api.createInstitution(formData);
      if (response.success) {
        const createdEmail = formData.email;
        setCreateSuccess(`Institution created successfully! Credentials have been sent to ${createdEmail}`);
        
        // Reset form
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          phone: '',
          institution_name: '',
          institution_type: '',
          department: '',
          address: '',
          city: '',
          country: '',
          website: '',
          description: '',
        });
        
        // Refresh institutions list
        await fetchInstitutions();
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowAddModal(false);
          setCreateSuccess(null);
        }, 2000);
      } else {
        // Handle validation errors
        const errorMessages = [];
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            const error = response.errors[key];
            if (Array.isArray(error)) {
              errorMessages.push(`${key}: ${error.join(', ')}`);
            } else if (typeof error === 'string') {
              errorMessages.push(`${key}: ${error}`);
            } else {
              errorMessages.push(`${key}: ${JSON.stringify(error)}`);
            }
          });
        }
        setCreateError(errorMessages.join(' | ') || 'Failed to create institution');
      }
    } catch (err: any) {
      console.error('Create institution error:', err);
      // Parse error message
      let errorMsg = err.message || 'Failed to create institution';
      if (err.message && err.message.includes('email')) {
        errorMsg = 'This email is already in use. Please use a different email address.';
      }
      setCreateError(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (institutionId: number) => {
    try {
      setResettingPassword(institutionId);
      setResetPasswordError(null);
      setResetPasswordSuccess(null);
      
      const result = await api.resetInstitutionPassword(institutionId);
      
      if (result.success) {
        if (result.email_sent) {
          setResetPasswordSuccess(`Password reset link sent to ${institutions.find(i => i.id === institutionId)?.email}`);
        } else {
          setResetPasswordSuccess(result.message || 'Password reset link generated');
          if (result.credentials) {
            // Show credentials if email failed
            toast.error(`Password reset link could not be sent. Credentials:\nUsername: ${result.credentials.username}\nPassword: ${result.credentials.password}`, {
              duration: 10000,
            });
          }
        }
        // Clear success message after 5 seconds
        setTimeout(() => setResetPasswordSuccess(null), 5000);
      } else {
        setResetPasswordError(result.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setResetPasswordError(err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(null);
    }
  };

  const handleDeleteInstitution = async () => {
    if (!deleteConfirm) return;
    
    setDeleting(true);
    setDeleteError(null);
    
    try {
      const response = await api.deleteInstitution(deleteConfirm.id);
      if (response.success) {
        setDeleteConfirm(null);
        await fetchInstitutions();
        if (selectedInstitution?.id === deleteConfirm.id) {
          setSelectedInstitution(null);
        }
      } else {
        setDeleteError(response.error || 'Failed to delete institution');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'An unexpected error occurred');
    } finally {
      setDeleting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const backgroundClass = themeClasses.background;
  const textColorClass = isDark ? 'text-white' : 'text-gray-900';
  const mutedTextColorClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const cardBgClass = themeClasses.card;

  if (loading) {
    return (
      <div className={`min-h-screen ${backgroundClass} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={textColorClass}>Loading institutions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${backgroundClass} flex items-center justify-center p-4`}>
        <div className={`${cardBgClass} rounded-2xl p-8 max-w-md w-full text-center`}>
          <p className={`text-red-500 mb-4 ${textColorClass}`}>{error}</p>
          <button
            onClick={fetchInstitutions}
            className={`px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r ${accentGradientClass} text-white hover:opacity-90`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalStats = summaryStats ? {
    institutions: summaryStats.total_institutions,
    students: summaryStats.total_students,
    teachers: summaryStats.total_teachers,
    courses: summaryStats.total_courses,
  } : {
    institutions: institutions.length,
    students: 0,
    teachers: 0,
    courses: 0,
  };

  return (
    <div className={`min-h-screen ${backgroundClass} transition-colors duration-500 p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${textColorClass}`}>Institutions</h1>
            <p className={mutedTextColorClass}>Manage and monitor all institutions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-red-600 to-orange-600 text-white hover:opacity-90 shadow-lg hover:shadow-xl`}
            >
              <Plus className="w-5 h-5" />
              Add Institution
            </button>
            <button
              onClick={fetchInstitutions}
              className={`p-3 rounded-xl transition-all ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} ${textColorClass}`}
              title="Yenile"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Institutions', value: totalStats.institutions, icon: Building2, color: 'from-blue-500 to-cyan-500' },
            { label: 'Total Students', value: totalStats.students, icon: GraduationCap, color: 'from-green-500 to-emerald-500' },
            { label: 'Total Teachers', value: totalStats.teachers, icon: Users, color: 'from-purple-500 to-pink-500' },
            { label: 'Total Courses', value: totalStats.courses, icon: BookOpen, color: 'from-orange-500 to-red-500' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${cardBgClass} rounded-2xl p-6 backdrop-blur-xl shadow-xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className={`text-sm font-medium ${mutedTextColorClass} mb-1`}>{stat.label}</h3>
              <p className={`text-3xl font-bold ${textColorClass}`}>{stat.value.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${cardBgClass} rounded-2xl p-6 mb-6 backdrop-blur-xl shadow-xl`}
        >
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${mutedTextColorClass}`} />
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all ${
                isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </motion.div>

        {/* Institutions List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredInstitutions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${cardBgClass} rounded-2xl p-12 text-center backdrop-blur-xl shadow-xl`}
              >
                <Building2 className={`w-16 h-16 mx-auto mb-4 ${mutedTextColorClass}`} />
                <p className={`text-xl font-semibold mb-2 ${textColorClass}`}>No institutions found</p>
                <p className={mutedTextColorClass}>
                  {searchTerm ? 'Try adjusting your search' : 'No institutions have been registered yet'}
                </p>
              </motion.div>
            ) : (
              filteredInstitutions.map((institution, index) => (
                <motion.div
                  key={institution.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedInstitution(institution)}
                  className={`${cardBgClass} rounded-2xl p-6 cursor-pointer backdrop-blur-xl shadow-xl border transition-all ${
                    selectedInstitution?.id === institution.id
                      ? isDark ? 'border-red-500/50 bg-red-500/10' : 'border-red-500 bg-red-50'
                      : isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-1 ${textColorClass}`}>{institution.full_name}</h3>
                      <p className={`text-sm ${mutedTextColorClass}`}>{institution.department || 'No department'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getLoginStatusBadge(institution.login_status)}
                      {/* Don't show action buttons for super admin accounts */}
                      {!institution.is_superuser && (
                        <>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(`Send password reset link to ${institution.email}?`)) {
                                await handleResetPassword(institution.id);
                              }
                            }}
                            disabled={resettingPassword === institution.id}
                            className={`p-2 rounded-lg transition-all ${
                              isDark 
                                ? 'hover:bg-blue-500/20 text-blue-400 hover:text-blue-300' 
                                : 'hover:bg-blue-50 text-blue-600 hover:text-blue-700'
                            } ${resettingPassword === institution.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Reset password"
                          >
                            {resettingPassword === institution.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <KeyRound className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(institution);
                            }}
                            className={`p-2 rounded-lg transition-all ${
                              isDark 
                                ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' 
                                : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                            }`}
                            title="Delete institution"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${textColorClass}`}>{institution.student_count}</div>
                      <div className={`text-xs ${mutedTextColorClass}`}>Students</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${textColorClass}`}>{institution.teacher_count}</div>
                      <div className={`text-xs ${mutedTextColorClass}`}>Teachers</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${textColorClass}`}>{institution.course_count}</div>
                      <div className={`text-xs ${mutedTextColorClass}`}>Courses</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className={`w-4 h-4 ${mutedTextColorClass}`} />
                      <span className={textColorClass}>{institution.email}</span>
                    </div>
                    {institution.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className={`w-4 h-4 ${mutedTextColorClass}`} />
                        <span className={textColorClass}>{institution.phone}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedInstitution ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${cardBgClass} rounded-2xl p-6 backdrop-blur-xl shadow-xl sticky top-6`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${textColorClass}`}>Institution Details</h2>
                  <button
                    onClick={() => setSelectedInstitution(null)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} ${textColorClass}`}
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                      Institution Name
                    </label>
                    <p className={textColorClass}>{selectedInstitution.full_name}</p>
                    <p className={`text-sm ${mutedTextColorClass}`}>@{selectedInstitution.username}</p>
                  </div>

                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                      Contact Information
                    </label>
                    <p className={textColorClass}>{selectedInstitution.email}</p>
                    {selectedInstitution.phone && (
                      <p className={textColorClass}>{selectedInstitution.phone}</p>
                    )}
                  </div>

                  {selectedInstitution.department && (
                    <div>
                      <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                        Department
                      </label>
                      <p className={textColorClass}>{selectedInstitution.department}</p>
                    </div>
                  )}

                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                      Statistics
                    </label>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={mutedTextColorClass}>Students</span>
                        <span className={`font-semibold ${textColorClass}`}>{selectedInstitution.student_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={mutedTextColorClass}>Teachers</span>
                        <span className={`font-semibold ${textColorClass}`}>{selectedInstitution.teacher_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={mutedTextColorClass}>Courses</span>
                        <span className={`font-semibold ${textColorClass}`}>{selectedInstitution.course_count}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                      Last Login
                    </label>
                    <div className="mb-2">{getLoginStatusBadge(selectedInstitution.login_status)}</div>
                    <p className={`text-sm ${mutedTextColorClass}`}>
                      {selectedInstitution.last_login ? formatDate(selectedInstitution.last_login) : 'Never logged in'}
                    </p>
                  </div>

                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                      Joined
                    </label>
                    <p className={`text-sm ${mutedTextColorClass}`}>
                      {formatDate(selectedInstitution.date_joined)}
                    </p>
                  </div>

                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                      Status
                    </label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedInstitution.is_active
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {selectedInstitution.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${cardBgClass} rounded-2xl p-6 backdrop-blur-xl shadow-xl text-center`}
              >
                <Building2 className={`w-12 h-12 mx-auto mb-4 ${mutedTextColorClass}`} />
                <p className={mutedTextColorClass}>Select an institution to view details</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Add Institution Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !creating && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${cardBgClass} rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl`}
            >
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-inherit pb-4 border-b border-white/10">
                <div>
                  <h2 className={`text-2xl font-bold ${textColorClass}`}>Add New Institution</h2>
                  <p className={`text-sm ${mutedTextColorClass} mt-1`}>Fill in all required information to create a new institution</p>
                </div>
                <button
                  onClick={() => !creating && setShowAddModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} ${textColorClass}`}
                  disabled={creating}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {resetPasswordSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`${cardBgClass} border border-green-500/50 rounded-xl p-4 mb-4`}
                >
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="text-sm">{resetPasswordSuccess}</p>
                  </div>
                </motion.div>
              )}
              {resetPasswordError && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`${cardBgClass} border border-red-500/50 rounded-xl p-4 mb-4`}
                >
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">{resetPasswordError}</p>
                  </div>
                </motion.div>
              )}
              {createError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Error creating institution</p>
                      <p className="break-words">{createError}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {createSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Success!</p>
                      <p>{createSuccess}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleCreateInstitution} className="space-y-6">
                {/* Institution Information Section */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${textColorClass} flex items-center gap-2`}>
                    <Building2 className="w-5 h-5" />
                    Institution Information
                  </h3>
                  <div className="space-y-4 pl-7">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
                        Institution Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.institution_name}
                        onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg focus:outline-none transition-all ${
                          isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-600/50`}
                        placeholder="AcuRate University"
                        disabled={creating}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
                          Institution Type
                        </label>
                        <select
                          value={formData.institution_type}
                          onChange={(e) => setFormData({ ...formData, institution_type: e.target.value })}
                          className={`w-full px-4 py-2 rounded-lg focus:outline-none transition-all ${
                            isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-red-600/50`}
                          disabled={creating}
                        >
                          <option value="">Select Type</option>
                          <option value="University">University</option>
                          <option value="College">College</option>
                          <option value="School">School</option>
                          <option value="Institute">Institute</option>
                          <option value="Academy">Academy</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
                          Department
                        </label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className={`w-full px-4 py-2 rounded-lg focus:outline-none transition-all ${
                            isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-red-600/50`}
                          placeholder="Computer Science"
                          disabled={creating}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg focus:outline-none transition-all ${
                          isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-600/50`}
                        placeholder="123 Main Street"
                        disabled={creating}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className={`w-full px-4 py-2 rounded-lg focus:outline-none transition-all ${
                            isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-red-600/50`}
                          placeholder="Istanbul"
                          disabled={creating}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className={`w-full px-4 py-2 rounded-lg focus:outline-none transition-all ${
                            isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-red-600/50`}
                          placeholder="Turkey"
                          disabled={creating}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg focus:outline-none transition-all ${
                          isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-600/50`}
                        placeholder="https://www.institution.com"
                        disabled={creating}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className={`w-full px-4 py-2 rounded-lg focus:outline-none transition-all ${
                          isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-600/50 resize-none`}
                        placeholder="Brief description about the institution..."
                        disabled={creating}
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Contact Information Section */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${textColorClass} flex items-center gap-2`}>
                    <Users className="w-5 h-5" />
                    Admin Contact Information
                  </h3>
                  <div className="space-y-4 pl-7">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
                        Admin Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg focus:outline-none transition-all ${
                          isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-600/50`}
                        placeholder="admin@institution.com"
                        disabled={creating}
                      />
                      <p className={`text-xs ${mutedTextColorClass} mt-1`}>This email will be used for login and notifications</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          className={`w-full px-4 py-2 rounded-lg focus:outline-none transition-all ${
                            isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-red-600/50`}
                          placeholder="John"
                          disabled={creating}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          className={`w-full px-4 py-2 rounded-lg focus:outline-none transition-all ${
                            isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-red-600/50`}
                          placeholder="Doe"
                          disabled={creating}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg focus:outline-none transition-all ${
                          isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-600/50`}
                        placeholder="+90 555 123 4567"
                        disabled={creating}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={creating}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                      isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    } disabled:opacity-50`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all bg-gradient-to-r ${accentGradientClass} text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Institution'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${cardBgClass} rounded-2xl p-6 max-w-md w-full backdrop-blur-xl shadow-2xl border ${
                isDark ? 'border-white/10' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center`}>
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${textColorClass}`}>Delete Institution</h3>
                  <p className={`text-sm ${mutedTextColorClass}`}>This action cannot be undone</p>
                </div>
              </div>

              <div className={`mb-6 p-4 rounded-lg ${
                isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                  Are you sure you want to delete <span className="font-semibold">{deleteConfirm.full_name}</span>?
                </p>
                <p className={`text-xs mt-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  This will permanently delete the institution account and all associated data.
                </p>
              </div>

              {deleteError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  {deleteError}
                </motion.div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteInstitution}
                  disabled={deleting}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

