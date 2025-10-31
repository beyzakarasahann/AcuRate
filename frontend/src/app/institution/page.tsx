'use client';

import { motion } from 'framer-motion';
import { Building2, Users, BookOpen, TrendingUp, Filter, FileText, AlertTriangle, CheckCircle2, Trophy, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function InstitutionDashboard() {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('fall-2024');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data - will be replaced with API calls
  const stats = [
    {
      title: 'Total Students',
      value: '1,250',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Faculty Members',
      value: '85',
      change: '+5%',
      trend: 'up',
      icon: Users,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Active Courses',
      value: '156',
      change: '+8%',
      trend: 'up',
      icon: BookOpen,
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Avg Performance',
      value: '76.5%',
      change: '+2.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const departments = [
    {
      name: 'Computer Science',
      students: 450,
      avgGrade: 78.5,
      poAchievement: 82,
      status: 'excellent',
      courses: 45,
      faculty: 28
    },
    {
      name: 'Electrical Engineering',
      students: 380,
      avgGrade: 75.2,
      poAchievement: 76,
      status: 'good',
      courses: 38,
      faculty: 24
    },
    {
      name: 'Mechanical Engineering',
      students: 320,
      avgGrade: 73.8,
      poAchievement: 74,
      status: 'good',
      courses: 35,
      faculty: 20
    },
    {
      name: 'Civil Engineering',
      students: 280,
      avgGrade: 71.5,
      poAchievement: 68,
      status: 'needs-attention',
      courses: 32,
      faculty: 18
    }
  ];

  const programOutcomes = [
    { code: 'PO1', title: 'Engineering Knowledge', current: 78.5, target: 70, status: 'achieved' },
    { code: 'PO2', title: 'Problem Analysis', current: 82.3, target: 75, status: 'excellent' },
    { code: 'PO3', title: 'Design/Development', current: 75.8, target: 70, status: 'achieved' },
    { code: 'PO4', title: 'Investigation', current: 73.2, target: 70, status: 'achieved' },
    { code: 'PO5', title: 'Modern Tool Usage', current: 68.5, target: 65, status: 'achieved' }
  ];

  const recentAlerts = [
    {
      type: 'warning',
      title: 'Civil Engineering - PO2 Below Target',
      description: 'Average achievement: 62% (Target: 75%)',
      time: '2 hours ago'
    },
    {
      type: 'info',
      title: 'Accreditation Review Scheduled',
      description: 'ABET review scheduled for December 2024',
      time: '1 day ago'
    },
    {
      type: 'success',
      title: 'CS Department Exceeds All Targets',
      description: 'All POs above target for Fall 2024',
      time: '2 days ago'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50"
              >
                <Building2 className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Institution Dashboard
                </h1>
                <p className="text-gray-400 text-sm">Academic Performance Overview</p>
              </div>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center gap-2 transition-all backdrop-blur-xl"
              >
                <Filter className="w-4 h-4" />
                Filters
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
              >
                <FileText className="w-4 h-4" />
                Export Report
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ scale: 1.05, y: -5 }}
              className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl hover:shadow-indigo-500/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Performance */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Department Performance
              </h2>
              <div className="space-y-4">
                {departments.map((dept, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold">{dept.name}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            dept.status === 'excellent' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                            dept.status === 'good' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          }`}>
                            {dept.status === 'excellent' ? '🏆 Excellent' : 
                             dept.status === 'good' ? '✓ Good' : '⚠ Needs Attention'}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span>{dept.students} students</span>
                          <span>•</span>
                          <span>{dept.courses} courses</span>
                          <span>•</span>
                          <span>{dept.faculty} faculty</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-400">Avg Grade</span>
                          <span className="text-white font-semibold">{dept.avgGrade}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${dept.avgGrade}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-400">PO Achievement</span>
                          <span className="text-white font-semibold">{dept.poAchievement}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${dept.poAchievement}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            className={`h-full rounded-full ${
                              dept.poAchievement >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              dept.poAchievement >= 70 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              'bg-gradient-to-r from-orange-500 to-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Program Outcomes Overview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl mt-6"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Program Outcomes Overview
              </h2>
              <div className="space-y-4">
                {programOutcomes.map((po, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-indigo-400 font-bold text-sm">{po.code}</span>
                        <span className="text-white font-medium">{po.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          po.status === 'excellent' ? 'text-green-400' : 'text-blue-400'
                        }`}>
                          {po.current}%
                        </span>
                        {po.status === 'excellent' ? (
                          <Trophy className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(po.current / 100) * 100}%` }}
                          transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                          className={`h-full rounded-full ${
                            po.status === 'excellent' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            'bg-gradient-to-r from-blue-500 to-cyan-500'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-16">Target: {po.target}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Recent Alerts
              </h2>
              <div className="space-y-3">
                {recentAlerts.map((alert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-xl border ${
                      alert.type === 'warning' ? 'bg-orange-500/10 border-orange-500/30' :
                      alert.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
                      'bg-blue-500/10 border-blue-500/30'
                    } hover:bg-white/10 transition-all cursor-pointer`}
                  >
                    <h3 className="text-white font-medium text-sm mb-1">{alert.title}</h3>
                    <p className="text-gray-400 text-xs mb-2">{alert.description}</p>
                    <span className="text-gray-500 text-xs">{alert.time}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {['Generate Report', 'Schedule Meeting', 'View Analytics'].map((action, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-left transition-all"
                  >
                    {action}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Accreditation Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30 p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Accreditation Status
              </h2>
              <p className="text-green-300 text-sm mb-3">All criteria met for ABET 2024</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">PO Achievement</span>
                  <span className="text-green-400 font-semibold">✓ 95%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Documentation</span>
                  <span className="text-green-400 font-semibold">✓ Complete</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Student Feedback</span>
                  <span className="text-green-400 font-semibold">✓ 4.2/5.0</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

