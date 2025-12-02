'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api, type ActivityLog, type Institution } from '@/lib/api';
import { 
  Activity, 
  Search, 
  Filter, 
  Building2, 
  User, 
  Clock,
  ChevronDown,
  X
} from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function SuperAdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedInstitution, setSelectedInstitution] = useState<number | null>(null);
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const { isDark, themeClasses } = useThemeColors();
  
  // Action types
  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'user_created', label: 'User Created' },
    { value: 'user_updated', label: 'User Updated' },
    { value: 'user_deleted', label: 'User Deleted' },
    { value: 'course_created', label: 'Course Created' },
    { value: 'course_updated', label: 'Course Updated' },
    { value: 'course_deleted', label: 'Course Deleted' },
    { value: 'enrollment_created', label: 'Enrollment Created' },
    { value: 'enrollment_updated', label: 'Enrollment Updated' },
    { value: 'assessment_created', label: 'Assessment Created' },
    { value: 'assessment_updated', label: 'Assessment Updated' },
    { value: 'grade_assigned', label: 'Grade Assigned' },
    { value: 'grade_updated', label: 'Grade Updated' },
    { value: 'login', label: 'Login' },
  ];
  
  // Get unique departments from logs
  const departments = Array.from(new Set(logs.map(log => log.department).filter(Boolean))) as string[];
  
  useEffect(() => {
    fetchInstitutions();
  }, []);
  
  useEffect(() => {
    fetchLogs();
  }, [selectedInstitution, selectedActionType, selectedDepartment, searchQuery]);
  
  const fetchInstitutions = async () => {
    try {
      const data = await api.getSuperAdminInstitutions();
      setInstitutions(data);
    } catch (err: any) {
      console.error('Error fetching institutions:', err);
    }
  };
  
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { limit: 500 };
      if (selectedInstitution) params.institution_id = selectedInstitution;
      if (selectedActionType !== 'all') params.action_type = selectedActionType;
      if (selectedDepartment !== 'all') params.department = selectedDepartment;
      if (searchQuery) params.search = searchQuery;
      
      const response = await api.getSuperAdminActivityLogs(params);
      setLogs(response.logs || []);
    } catch (err: any) {
      console.error('Error fetching activity logs:', err);
      setError(err.message || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };
  
  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      'user_created': 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
      'user_updated': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
      'user_deleted': 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
      'course_created': 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
      'course_updated': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
      'course_deleted': 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
      'enrollment_created': 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
      'enrollment_updated': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
      'assessment_created': 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
      'assessment_updated': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
      'grade_assigned': 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
      'grade_updated': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
      'login': 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    };
    return colors[actionType] || 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30';
  };
  
  const clearFilters = () => {
    setSelectedInstitution(null);
    setSelectedActionType('all');
    setSelectedDepartment('all');
    setSearchQuery('');
  };
  
  const activeFiltersCount = [
    selectedInstitution,
    selectedActionType !== 'all',
    selectedDepartment !== 'all',
    searchQuery,
  ].filter(Boolean).length;
  
  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className={themeClasses.text}>Loading activity logs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/10 rounded-xl">
                <Activity className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${themeClasses.text}`}>
                  Activity Logs
                </h1>
                <p className={`${themeClasses.textMuted} mt-1`}>
                  Monitor all system activities across institutions
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${themeClasses.card} border ${
                isDark ? 'border-white/10' : 'border-gray-200'
              } ${themeClasses.hover}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs by description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg ${themeClasses.card} border ${
                isDark ? 'border-white/10' : 'border-gray-200'
              } ${themeClasses.text} ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-red-600/50`}
            />
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-4 p-4 rounded-lg ${themeClasses.card} border ${
                isDark ? 'border-white/10' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${themeClasses.text}`}>Filters</h3>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Institution Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
                    Institution
                  </label>
                  <select
                    value={selectedInstitution || ''}
                    onChange={(e) => setSelectedInstitution(e.target.value ? parseInt(e.target.value) : null)}
                    className={`w-full px-3 py-2 rounded-lg ${themeClasses.card} border ${
                      isDark ? 'border-white/10' : 'border-gray-200'
                    } ${themeClasses.text} ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-red-600/50`}
                  >
                    <option value="">All Institutions</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Action Type Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
                    Action Type
                  </label>
                  <select
                    value={selectedActionType}
                    onChange={(e) => setSelectedActionType(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg ${themeClasses.card} border ${
                      isDark ? 'border-white/10' : 'border-gray-200'
                    } ${themeClasses.text} ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-red-600/50`}
                  >
                    {actionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Department Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg ${themeClasses.card} border ${
                      isDark ? 'border-white/10' : 'border-gray-200'
                    } ${themeClasses.text} ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-red-600/50`}
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-4 rounded-lg ${themeClasses.card} border ${
              isDark ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${themeClasses.textMuted}`}>Total Logs</p>
                <p className={`text-2xl font-bold ${themeClasses.text} mt-1`}>
                  {logs.length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-red-600 opacity-50" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-lg ${themeClasses.card} border ${
              isDark ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${themeClasses.textMuted}`}>Institutions</p>
                <p className={`text-2xl font-bold ${themeClasses.text} mt-1`}>
                  {institutions.length}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-4 rounded-lg ${themeClasses.card} border ${
              isDark ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${themeClasses.textMuted}`}>Today</p>
                <p className={`text-2xl font-bold ${themeClasses.text} mt-1`}>
                  {logs.filter(log => {
                    const logDate = new Date(log.created_at);
                    const today = new Date();
                    return logDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`p-4 rounded-lg ${themeClasses.card} border ${
              isDark ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${themeClasses.textMuted}`}>This Week</p>
                <p className={`text-2xl font-bold ${themeClasses.text} mt-1`}>
                  {logs.filter(log => {
                    const logDate = new Date(log.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return logDate >= weekAgo;
                  }).length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </motion.div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400`}>
            {error}
          </div>
        )}
        
        {/* Logs List */}
        <div className={`rounded-lg ${themeClasses.card} border ${
          isDark ? 'border-white/10' : 'border-gray-200'
        } overflow-hidden`}>
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className={themeClasses.textMuted}>No activity logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-white/10">
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Action Badge */}
                    <div className={`px-3 py-1 rounded-lg border text-xs font-medium whitespace-nowrap ${getActionColor(log.action_type)}`}>
                      {log.action_type_display}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`${themeClasses.text} font-medium mb-2`}>
                        {log.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {/* User */}
                        {log.user && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className={themeClasses.textMuted}>
                              {log.user.full_name} ({log.user.role})
                            </span>
                          </div>
                        )}
                        
                        {/* Institution */}
                        {log.institution && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className={themeClasses.textMuted}>
                              {log.institution.full_name}
                            </span>
                          </div>
                        )}
                        
                        {/* Department */}
                        {log.department && (
                          <span className={themeClasses.textMuted}>
                            {log.department}
                          </span>
                        )}
                        
                        {/* Time */}
                        <div className="flex items-center gap-2 ml-auto">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className={themeClasses.textMuted}>
                            {new Date(log.created_at).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className={`text-xs ${themeClasses.textMuted}`}>
                            ({log.time_ago})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


