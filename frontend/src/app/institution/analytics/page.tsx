'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, BookOpen, Filter, Loader2, AlertTriangle, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { api, TokenManager } from '../../../lib/api';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

export default function InstitutionAnalytics() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  
  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  // Data states
  const [departmentsData, setDepartmentsData] = useState<any[]>([]);
  const [poTrendsData, setPOTrendsData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [courseSuccessData, setCourseSuccessData] = useState<any[]>([]);
  
  // Available departments for filter
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  const { isDark, mounted: themeMounted, accentStart, accentEnd, themeClasses, mutedText, whiteTextClass, secondaryTextClass } = useThemeColors();
  const { setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    // Check authentication first
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAuthenticated = TokenManager.isAuthenticated();
    const token = TokenManager.getAccessToken();
    
    if (!isAuthenticated || !token) {
      setAuthError(true);
      setError('Please log in to view analytics.');
      setLoading(false);
      return;
    }

    // Check user role
    try {
      const user = await api.getCurrentUser();
      if (user.role !== 'INSTITUTION' && !user.is_staff) {
        setAuthError(true);
        setError('This page is only accessible to institution administrators.');
        setLoading(false);
        return;
      }
      // If authenticated and authorized, fetch data
      fetchAllData();
    } catch (err: any) {
      console.error('Error checking authentication:', err);
      setAuthError(true);
      setError('Authentication failed. Please log in again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Refetch data when filters change
    fetchAllData();
  }, [selectedDepartment, selectedSemester, selectedYear]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data in parallel, including departments list
      const [departments, poTrends, performance, courseSuccess, departmentsList] = await Promise.all([
        api.getAnalyticsDepartments(),
        api.getAnalyticsPOTrends({
          semester: selectedSemester || undefined,
          academic_year: selectedYear || undefined,
        }),
        api.getAnalyticsPerformanceDistribution({
          department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        }),
        api.getAnalyticsCourseSuccess({
          department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
          semester: selectedSemester || undefined,
          academic_year: selectedYear || undefined,
        }),
        api.getDepartmentsList(), // Get all departments (from Department table and User department fields)
      ]);

      setDepartmentsData(departments.departments || []);
      setPOTrendsData(poTrends.program_outcomes || []);
      setPerformanceData(performance);
      setCourseSuccessData(courseSuccess.courses || []);

      // Use departments list from getDepartmentsList (includes all departments)
      const deptNames = departmentsList.map((d: any) => d.name.trim()).filter((name: string) => name);
      // Remove duplicates by normalizing (case-insensitive)
      const seen = new Set<string>();
      const uniqueDeptNames = deptNames.filter((name: string) => {
        const normalized = name.toLowerCase();
        if (seen.has(normalized)) {
          return false;
        }
        seen.add(normalized);
        return true;
      }).sort();
      setAvailableDepartments(uniqueDeptNames);

    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !themeMounted) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeClasses.background} flex items-center justify-center`}>
        <div className={`${whiteTextClass} text-xl`}>Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeClasses.background} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={`w-8 h-8 ${accentStart} animate-spin`} />
          <p className={`${secondaryTextClass} text-lg`}>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeClasses.background} flex items-center justify-center`}>
        <div className={`${themeClasses.card} p-8 max-w-md text-center`}>
          <AlertTriangle className={`w-12 h-12 text-red-500 mx-auto mb-4`} />
          <h2 className={`text-xl font-bold ${whiteTextClass} mb-2`}>
            {authError ? 'Access Denied' : 'Error Loading Analytics'}
          </h2>
          <p className={`${secondaryTextClass} mb-4`}>{error}</p>
          <div className="flex gap-3 justify-center">
            {authError ? (
              <motion.button
                onClick={() => router.push('/login')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ backgroundImage: `linear-gradient(to right, ${accentStart}, ${accentEnd})` }}
                className="px-6 py-2 rounded-xl text-white font-medium flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Go to Login
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={fetchAllData}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ backgroundImage: `linear-gradient(to right, ${accentStart}, ${accentEnd})` }}
                  className="px-6 py-2 rounded-xl text-white font-medium"
                >
                  Retry
                </motion.button>
                <motion.button
                  onClick={() => router.push('/institution')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2 rounded-xl ${themeClasses.card.replace('shadow-2xl', '').replace('rounded-2xl', 'rounded-xl')} ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  Back to Dashboard
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const departmentChartData = departmentsData.map(dept => ({
    name: dept.name,
    students: dept.students,
    courses: dept.courses,
    faculty: dept.faculty,
    avgGrade: dept.avg_grade || 0,
    poAchievement: dept.po_achievement || 0,
  }));

  const poTrendChartData = poTrendsData.map(po => ({
    code: po.code,
    current: po.current_percentage || 0,
    target: po.target_percentage,
    achievement: po.achievement_rate || 0,
  }));

  const performanceChartData = performanceData?.distribution ? [
    { name: '0-20', value: performanceData.distribution['0-20'] },
    { name: '21-40', value: performanceData.distribution['21-40'] },
    { name: '41-60', value: performanceData.distribution['41-60'] },
    { name: '61-80', value: performanceData.distribution['61-80'] },
    { name: '81-100', value: performanceData.distribution['81-100'] },
  ] : [];

  const courseSuccessChartData = courseSuccessData.slice(0, 10).map(course => ({
    name: course.course_code,
    successRate: course.success_rate,
    avgGrade: course.average_grade || 0,
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeClasses.background} relative overflow-hidden`}>
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl`}
          style={{ backgroundColor: `${accentStart}20` }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl`}
          style={{ backgroundColor: `${accentEnd}30` }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 backdrop-blur-xl ${themeClasses.card} rounded-2xl p-6 shadow-2xl`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                style={{ backgroundImage: `linear-gradient(to bottom right, ${accentStart}, ${accentEnd})` }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <BarChart3 className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
                <p className={`${secondaryTextClass} text-sm`}>Comprehensive performance analytics and insights</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-6 backdrop-blur-xl ${themeClasses.card} rounded-2xl p-4 shadow-2xl`}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className={`w-5 h-5 ${secondaryTextClass}`} />
            <div className="flex-1 flex gap-4 flex-wrap">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className={`px-4 py-2 rounded-xl ${themeClasses.card.replace('shadow-2xl', '').replace('rounded-2xl', 'rounded-xl')} ${isDark ? 'bg-white/5 text-white border border-white/10' : 'bg-white text-gray-700 border border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="all">All Departments</option>
                {availableDepartments.map((dept, index) => (
                  <option key={`${dept}-${index}`} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className={`px-4 py-2 rounded-xl ${themeClasses.card.replace('shadow-2xl', '').replace('rounded-2xl', 'rounded-xl')} ${isDark ? 'bg-white/5 text-white border border-white/10' : 'bg-white text-gray-700 border border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="">All Semesters</option>
                <option value="1">Fall</option>
                <option value="2">Spring</option>
                <option value="3">Summer</option>
              </select>
              <input
                type="text"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                placeholder="Academic Year (e.g., 2024-2025)"
                className={`px-4 py-2 rounded-xl ${themeClasses.card.replace('shadow-2xl', '').replace('rounded-2xl', 'rounded-xl')} ${isDark ? 'bg-white/5 text-white border border-white/10 placeholder-gray-400' : 'bg-white text-gray-700 border border-gray-200 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
          </div>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Comparison Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-2xl`}
          >
            <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
              <Users className="w-5 h-5" style={{ color: accentStart }} />
              Department Comparison
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff20' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={secondaryTextClass} fontSize={12} />
                <YAxis stroke={secondaryTextClass} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="students" fill={accentStart} name="Students" />
                <Bar dataKey="courses" fill={accentEnd} name="Courses" />
                <Bar dataKey="faculty" fill="#F59E0B" name="Faculty" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* PO Trends Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-2xl`}
          >
            <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
              <TrendingUp className="w-5 h-5" style={{ color: accentStart }} />
              Program Outcomes Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={poTrendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff20' : '#e5e7eb'} />
                <XAxis dataKey="code" stroke={secondaryTextClass} fontSize={12} />
                <YAxis stroke={secondaryTextClass} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="current" stroke={accentStart} strokeWidth={2} name="Current %" />
                <Line type="monotone" dataKey="target" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" name="Target %" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Performance Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-2xl`}
          >
            <h2 className={`text-xl font-bold ${whiteTextClass} mb-6 flex items-center gap-2`}>
              <BarChart3 className="w-5 h-5" style={{ color: accentStart }} />
              Performance Distribution
            </h2>
            {performanceData && performanceChartData.length > 0 ? (
              <div>
                {/* Simple Pie Chart - No Labels */}
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={performanceChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {performanceChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => {
                        const total = performanceChartData.reduce((sum: number, item: any) => sum + item.value, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${value} students (${percentage}%)`;
                      }}
                      contentStyle={{
                        backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.98)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}`,
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: isDark ? '#fff' : '#000',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Clean Legend */}
                <div className="mt-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {performanceChartData.map((entry: any, index: number) => {
                      const total = performanceChartData.reduce((sum: number, item: any) => sum + item.value, 0);
                      const percentage = ((entry.value / total) * 100).toFixed(1);
                      return (
                        <div key={`legend-${index}`} className="flex items-center gap-3">
                          <div 
                            className="w-5 h-5 rounded" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${whiteTextClass}`}>{entry.name}%</div>
                            <div className={`text-xs ${secondaryTextClass}`}>{entry.value} students ({percentage}%)</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Statistics */}
                  <div className={`mt-6 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className={`text-xs ${secondaryTextClass} mb-1`}>Total Students</div>
                        <div className={`text-lg font-bold ${whiteTextClass}`}>{performanceData.statistics?.total_students || 0}</div>
                      </div>
                      <div>
                        <div className={`text-xs ${secondaryTextClass} mb-1`}>Average</div>
                        <div className={`text-lg font-bold text-green-400`}>{performanceData.statistics?.average?.toFixed(1) || 0}%</div>
                      </div>
                      <div>
                        <div className={`text-xs ${secondaryTextClass} mb-1`}>Median</div>
                        <div className={`text-lg font-bold text-blue-400`}>{performanceData.statistics?.median?.toFixed(1) || 0}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`h-[280px] flex items-center justify-center ${secondaryTextClass}`}>
                <p>No performance data available</p>
              </div>
            )}
          </motion.div>

          {/* Course Success Rates Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-2xl`}
          >
            <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
              <BookOpen className="w-5 h-5" style={{ color: accentStart }} />
              Course Success Rates (Top 10)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseSuccessChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff20' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={secondaryTextClass} fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke={secondaryTextClass} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="successRate" fill={accentStart} name="Success Rate %" />
                <Bar dataKey="avgGrade" fill={accentEnd} name="Avg Grade" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

