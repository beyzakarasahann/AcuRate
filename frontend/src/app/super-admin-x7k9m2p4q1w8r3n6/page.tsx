'use client';

import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { isDark, mounted, themeClasses, accentGradientClass } = useThemeColors();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.login(username, password);

      if (response.success && response.user) {
        // Check if user is superuser
        if (response.user.is_superuser) {
          // Token'lar api.login() içinde zaten kaydediliyor, ama emin olmak için kontrol edelim
          // Store user info in cookies for middleware
          document.cookie = `user_role=superadmin; path=/; max-age=86400`;
          document.cookie = `username=${response.user.username}; path=/; max-age=86400`;
          document.cookie = `auth_token=authenticated; path=/; max-age=86400`;
          
          // Small delay to ensure cookies are set before redirect
          setTimeout(() => {
            router.push('/super-admin');
          }, 100);
        } else {
          // Not a superuser - redirect to 404
          setLoading(false);
          router.push('/404');
        }
      } else {
        // Wrong credentials - redirect to 404
        setLoading(false);
        router.push('/404');
      }
    } catch (err: any) {
      // Any error - redirect to 404
      setLoading(false);
      router.push('/404');
    }
  };

  const backgroundClass = themeClasses.background;
  const textColorClass = isDark ? 'text-white' : 'text-gray-900';
  const mutedTextColorClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const cardBgClass = themeClasses.card;
  const inputBgClass = isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900';
  const inputPlaceholderClass = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const inputFocusClass = themeClasses.inputFocus;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundClass} relative overflow-hidden flex items-center justify-center p-4 transition-colors duration-500`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-red-500/10' : 'bg-red-300/20'}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-orange-500/10' : 'bg-orange-300/20'}`}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative z-10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl transition-colors duration-500 ${cardBgClass} w-full max-w-md`}
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg"
          >
            <Lock className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className={`text-2xl font-bold mb-2 ${textColorClass}`}>Access</h1>
          <p className={`text-sm ${mutedTextColorClass}`}>Enter credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Username */}
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-all ${inputBgClass} ${inputPlaceholderClass} ${inputFocusClass}`}
              placeholder="Username"
              required
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-all ${inputBgClass} ${inputPlaceholderClass} ${inputFocusClass}`}
              placeholder="Password"
              required
            />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all ${
              loading
                ? 'bg-gray-500 cursor-not-allowed'
                : `bg-gradient-to-r ${accentGradientClass} hover:from-red-500 hover:to-orange-500 shadow-red-500/30`
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </div>
            ) : (
              'Continue'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

