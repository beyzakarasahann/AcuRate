'use client';

import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, GraduationCap, Users as UsersIcon, Building2, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ✨ TEMA ENTEGRASYONU: next-themes ve kendi renk hook'umuzu import ediyoruz
import { useTheme } from 'next-themes'; 
import { useThemeColors } from '@/hooks/useThemeColors';

// ✨ API ENTEGRASYONU
import { api } from '@/lib/api';

type Role = 'student' | 'teacher' | 'institution';


export default function LoginPage() {
  const router = useRouter();

  // 1. ✨ GÜNCELLEME: Tema hook'larından durumu ve fonksiyonları alıyoruz
  const { setTheme } = useTheme();
  const { isDark, mounted, themeClasses, accentGradientClass } = useThemeColors();
  
  // Eski isDarkTheme state'i kaldırıldı.
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Not: useEffect(() => { setMounted(true); }, []); kaldırıldı.

  const roles = [
    {
      id: 'student' as Role,
      name: 'Student',
      icon: GraduationCap,
      description: 'View your courses and performance',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'teacher' as Role,
      name: 'Teacher',
      icon: UsersIcon,
      description: 'Manage courses and grade students',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'institution' as Role,
      name: 'Institution',
      icon: Building2,
      description: 'View analytics and reports',
      color: 'from-indigo-500 to-purple-600'
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Real API call
      const response = await api.login(username, password);

      if (response.success && response.user) {
        // Store user info in cookie for middleware (lowercase for middleware compatibility)
        document.cookie = `user_role=${response.user.role.toLowerCase()}; path=/; max-age=86400`;
        document.cookie = `username=${response.user.username}; path=/; max-age=86400`;
        document.cookie = `auth_token=authenticated; path=/; max-age=86400`;

        // Redirect based on role
        const roleRedirect: Record<string, string> = {
          'STUDENT': '/student',
          'TEACHER': '/teacher',
          'INSTITUTION': '/institution'
        };

        router.push(roleRedirect[response.user.role] || '/');
      } else {
        setError(response.errors?.non_field_errors?.[0] || 'Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      // Show user-friendly error message
      const errorMessage = err.message || 'An error occurred. Please try again.';
      // If it's a network error or generic error, show a friendly message
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (errorMessage.includes('status 400') || errorMessage.includes('status 401')) {
        setError('Incorrect username or password');
      } else {
        setError(errorMessage);
      }
      setLoading(false);
    }
  };

  // 2. ✨ YENİ: Temayı değiştirme fonksiyonu
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };
  
  // 3. ✨ GÜNCELLEME: Mounted kontrolü (Hidrasyon Çözümü)
  if (!mounted) {
    // Background sınıfını hook'tan alıyoruz (Mounted olana kadar default koyu tema)
    const initialBackground = themeClasses.background || 'from-slate-950 via-blue-950 to-slate-950';
    return (
      <div className={`min-h-screen bg-gradient-to-br ${initialBackground} flex items-center justify-center`}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // 4. ✨ GÜNCELLEME: Tüm Tema sınıflarını hook'tan alınan değerlerle güncelliyoruz
  const backgroundClass = themeClasses.background;
  const textColorClass = isDark ? 'text-white' : 'text-gray-900';
  const mutedTextColorClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const cardBgClass = themeClasses.card; 
  const inputBgClass = isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900';
  const inputPlaceholderClass = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const roleCardBgClass = isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-100';
  const roleCardSelectedClass = isDark 
    ? 'bg-white/10 border-white/30 shadow-2xl shadow-indigo-500/20' 
    : 'bg-indigo-50/70 border-indigo-300 shadow-lg shadow-indigo-100/50';
  const inputFocusClass = themeClasses.inputFocus; // Hook'tan gelen focus sınıfı

  const containerClass = `min-h-screen bg-gradient-to-br ${backgroundClass} relative overflow-hidden flex items-center justify-center p-4 transition-colors duration-500`;
  
  return (
    <div className={containerClass}>
      {/* Animated Background - Tema rengine göre hafif değişsin */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-300/30'}`}
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
          className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-300/30'}`}
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
      </div>

      {/* Tema Değiştirme Düğmesi */}
      <motion.button
        onClick={toggleTheme} // ✨ GÜNCELLEME: toggleTheme fonksiyonu
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`absolute top-6 right-6 p-3 rounded-full transition-colors duration-300 shadow-xl ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        title={isDark ? "Açık Tema" : "Koyu Tema"}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </motion.button>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Left Side - Role Selection */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                // Başlık rengi temadan bağımsız olarak gradient kalabilir
                className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2"
              >
                Welcome to AcuRate
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={mutedTextColorClass}
              >
                Select your role to continue
              </motion.p>
            </div>

            <div className="space-y-4">
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedRole(role.id)}
                  className={`backdrop-blur-xl rounded-2xl border p-5 cursor-pointer transition-all ${
                    selectedRole === role.id
                      ? roleCardSelectedClass // Seçili kartın temaya göre rengi
                      : `${roleCardBgClass}` // Seçili olmayan kartın temaya göre rengi
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg shrink-0`}>
                      <role.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`${textColorClass} font-semibold mb-1`}>{role.name}</h3>
                      <p className={`${mutedTextColorClass} text-sm`}>{role.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedRole === role.id
                        ? 'border-indigo-400 bg-indigo-500'
                        : isDark ? 'border-white/30' : 'border-gray-400'
                    }`}>
                      {selectedRole === role.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`backdrop-blur-xl rounded-2xl p-8 shadow-2xl transition-colors duration-500 ${cardBgClass}`}
          >
            <div className="mb-8">
              <h2 className={`text-2xl font-bold mb-2 ${textColorClass}`}>Sign In</h2>
              <p className={`text-sm ${mutedTextColorClass}`}>
                Enter your credentials to access your dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username */}
              <div>
                <label className={`text-sm font-medium mb-2 block ${textColorClass}`}>
                  Username
                </label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all ${inputBgClass} ${inputPlaceholderClass} ${inputFocusClass}`}
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className={`text-sm font-medium mb-2 block ${textColorClass}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all ${inputBgClass} ${inputPlaceholderClass} ${inputFocusClass}`}
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={`w-4 h-4 rounded border-indigo-500 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 ${isDark ? 'border-white/30 bg-white/5' : 'border-gray-400 bg-white'}`}
                  />
                  <span className={`text-sm ${mutedTextColorClass}`}>Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-xl p-4 text-sm ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-100 border-red-400 text-red-700'}`}
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all ${
                  loading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : `bg-gradient-to-r ${accentGradientClass} hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/30`
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div className={`mt-8 pt-6 border-t text-center ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <p className={`text-sm ${mutedTextColorClass}`}>
                Don't you have an account?{' '}
                <Link href="/contact" className="text-indigo-500 hover:text-indigo-600 font-semibold underline">
                  Contact us
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}