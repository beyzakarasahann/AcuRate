'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';

import { useTheme } from 'next-themes';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';

export default function TeacherChangePasswordPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { isDark, mounted, themeClasses, accentGradientClass } = useThemeColors();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isTemporaryPassword, setIsTemporaryPassword] = useState(false);

  useEffect(() => {
    // Check if user has temporary password
    const checkTemporaryPassword = async () => {
      try {
        const user = await api.getCurrentUser();
        setIsTemporaryPassword(user.is_temporary_password || false);
        if (!user.is_temporary_password) {
          // Not a temporary password, redirect to dashboard
          router.push('/teacher');
        }
      } catch (err) {
        console.error('Error checking user:', err);
      }
    };
    checkTemporaryPassword();
  }, [router]);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
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
  const inputBgClass = isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900';
  const inputPlaceholderClass = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const inputFocusClass = themeClasses.inputFocus;

  const containerClass = `min-h-screen bg-gradient-to-br ${backgroundClass} relative overflow-hidden flex items-center justify-center p-4 transition-colors duration-500`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (newPassword !== newPasswordConfirm) {
        setError('New passwords do not match.');
        setLoading(false);
        return;
      }
      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters long.');
        setLoading(false);
        return;
      }

      // For temporary password, old password is optional
      await api.changePassword(
        isTemporaryPassword ? '' : oldPassword, 
        newPassword, 
        newPasswordConfirm
      );

      // Clear the temporary password cookie
      document.cookie = 'is_temporary_password=false; path=/; max-age=0';

      setSuccess('Password updated successfully. Redirecting to your dashboard...');
      setLoading(false);

      // Refresh user data to get updated is_temporary_password status
      try {
        const updatedUser = await api.getCurrentUser();
        if (!updatedUser.is_temporary_password) {
          setTimeout(() => {
            router.push('/teacher');
          }, 1500);
        }
      } catch {
        // If API call fails, still redirect after 1.5 seconds
        setTimeout(() => {
          router.push('/teacher');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={containerClass}>
      {/* Simple gradient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-300/30'}`}
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-300/30'}`}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Back button */}
      <motion.button
        onClick={() => router.push('/login')}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`absolute top-6 left-6 p-3 rounded-full transition-colors duration-300 shadow-xl backdrop-blur-sm z-20 ${isDark ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20' : 'bg-white/80 text-gray-700 hover:bg-white border border-gray-200'}`}
        title="Back to Login"
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>

      {/* Theme toggle */}
      <motion.button
        onClick={toggleTheme}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`absolute top-6 right-6 p-3 rounded-full transition-colors duration-300 shadow-xl backdrop-blur-sm z-20 ${isDark ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20' : 'bg-white/80 text-gray-700 hover:bg-white border border-gray-200'}`}
      >
        <Lock className="w-5 h-5" />
      </motion.button>

      <div className="relative z-10 w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-xl rounded-2xl p-8 shadow-2xl transition-colors duration-500 ${cardBgClass}`}
        >
          <div className="mb-6 text-center">
            <h1 className={`text-2xl font-bold mb-2 ${textColorClass}`}>
              Change Your Temporary Password
            </h1>
            <p className={`text-sm ${mutedTextColorClass}`}>
              For security reasons, you must set a new password before accessing your teacher dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`text-sm font-medium mb-2 block ${textColorClass}`}>
                {isTemporaryPassword ? 'Temporary Password (Optional)' : 'Current Password'}
              </label>
              {isTemporaryPassword && (
                <p className={`text-xs mb-2 ${mutedTextColorClass}`}>
                  You can leave this empty if you're using the temporary password from your email.
                </p>
              )}
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all ${inputBgClass} ${inputPlaceholderClass} ${inputFocusClass}`}
                placeholder={isTemporaryPassword ? "Leave empty if using temporary password" : "Enter your current password"}
                required={!isTemporaryPassword}
              />
            </div>

            <div>
              <label className={`text-sm font-medium mb-2 block ${textColorClass}`}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all ${inputBgClass} ${inputPlaceholderClass} ${inputFocusClass}`}
                placeholder="At least 8 characters"
                required
              />
            </div>

            <div>
              <label className={`text-sm font-medium mb-2 block ${textColorClass}`}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all ${inputBgClass} ${inputPlaceholderClass} ${inputFocusClass}`}
                placeholder="Re-enter new password"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-xl p-3 text-sm ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-100 border-red-400 text-red-700'}`}
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-xl p-3 text-sm ${isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-100 border-emerald-400 text-emerald-700'}`}
              >
                {success}
              </motion.div>
            )}

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
              {loading ? 'Updating password...' : 'Update Password'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}




