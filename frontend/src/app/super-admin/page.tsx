'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Building2, Users, GraduationCap, LogIn, Activity, TrendingUp, Clock, FileText, Loader2, RefreshCw } from 'lucide-react';
import { api, SuperAdminDashboardData } from '@/lib/api';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function SuperAdminDashboard() {
  const { isDark, mounted, themeClasses, accentGradientClass } = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await api.getSuperAdminDashboard();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
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
          <p className={textColorClass}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen ${backgroundClass} flex items-center justify-center p-4`}>
        <div className={`${cardBgClass} rounded-2xl p-8 max-w-md w-full text-center`}>
          <p className={`text-red-500 mb-4 ${textColorClass}`}>{error || 'Failed to load dashboard'}</p>
          <button
            onClick={fetchDashboard}
            className={`px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r ${accentGradientClass} text-white hover:opacity-90`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Toplam Kurum',
      value: data.total_institutions,
      icon: Building2,
      color: 'from-blue-500 to-cyan-500',
      description: 'Aktif kurum sayısı'
    },
    {
      title: 'Toplam Teacher',
      value: data.total_teachers,
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      description: 'Aktif öğretmen sayısı'
    },
    {
      title: 'Toplam Student',
      value: data.total_students,
      icon: GraduationCap,
      color: 'from-green-500 to-emerald-500',
      description: 'Aktif öğrenci sayısı'
    },
    {
      title: 'Bugünkü İşlemler',
      value: data.today_activities,
      icon: Activity,
      color: 'from-orange-500 to-red-500',
      description: 'Bugün yapılan toplam işlem'
    }
  ];

  const loginStats = [
    { period: 'Son 24 Saat', value: data.institution_logins.last_24h },
    { period: 'Son 7 Gün', value: data.institution_logins.last_7d },
    { period: 'Son 30 Gün', value: data.institution_logins.last_30d }
  ];

  return (
    <div className={`min-h-screen ${backgroundClass} transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${textColorClass}`}>Super Admin Dashboard</h1>
            <p className={mutedTextColorClass}>Sistem genel bakış ve istatistikler</p>
          </div>
          <button
            onClick={fetchDashboard}
            className={`p-3 rounded-xl transition-all ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} ${textColorClass}`}
            title="Yenile"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${cardBgClass} rounded-2xl p-6 backdrop-blur-xl shadow-xl`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className={`text-sm font-medium ${mutedTextColorClass} mb-1`}>{stat.title}</h3>
              <p className={`text-3xl font-bold ${textColorClass} mb-1`}>{stat.value.toLocaleString()}</p>
              <p className={`text-xs ${mutedTextColorClass}`}>{stat.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Institution Logins */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={`${cardBgClass} rounded-2xl p-6 backdrop-blur-xl shadow-xl`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <LogIn className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${textColorClass}`}>Kurum Girişleri</h2>
                <p className={`text-sm ${mutedTextColorClass}`}>Kurum adminlerinin giriş istatistikleri</p>
              </div>
            </div>
            <div className="space-y-4">
              {loginStats.map((stat, index) => (
                <div key={stat.period} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${mutedTextColorClass}`} />
                    <span className={textColorClass}>{stat.period}</span>
                  </div>
                  <span className={`text-2xl font-bold ${textColorClass}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Most Active */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className={`${cardBgClass} rounded-2xl p-6 backdrop-blur-xl shadow-xl`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${textColorClass}`}>En Aktif</h2>
                <p className={`text-sm ${mutedTextColorClass}`}>Bugün en çok işlem yapan</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className={`text-sm ${mutedTextColorClass} mb-2`}>Kurum</p>
                <p className={`text-lg font-semibold ${textColorClass}`}>
                  {data.most_active_institution || 'Veri yok'}
                </p>
              </div>
              <div>
                <p className={`text-sm ${mutedTextColorClass} mb-2`}>Kullanıcı</p>
                <p className={`text-lg font-semibold ${textColorClass}`}>
                  {data.most_active_user || 'Veri yok'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`${cardBgClass} rounded-2xl p-6 backdrop-blur-xl shadow-xl`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${textColorClass}`}>Son 10 İşlem</h2>
              <p className={`text-sm ${mutedTextColorClass}`}>Sistem aktivite logları</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.recent_logs.length > 0 ? (
              data.recent_logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          log.type === 'grade' ? 'bg-green-500/20 text-green-400' :
                          log.type === 'assessment' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {log.action}
                        </span>
                        <span className={`text-sm ${textColorClass} font-medium`}>{log.user}</span>
                      </div>
                      <p className={`text-sm ${mutedTextColorClass}`}>{log.description}</p>
                    </div>
                    <span className={`text-xs ${mutedTextColorClass} ml-4`}>
                      {new Date(log.timestamp).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={`text-center py-8 ${mutedTextColorClass}`}>Henüz işlem kaydı yok</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

