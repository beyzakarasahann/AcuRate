'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function InstitutionChangePasswordPage() {
  const router = useRouter();
  const { isDark, mounted, themeClasses } = useThemeColors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    new_password: '',
    new_password_confirm: '',
  });

  useEffect(() => {
    // Check if user has temporary password
    const checkTemporaryPassword = async () => {
      try {
        const user = await api.getCurrentUser();
        if (!user.is_temporary_password) {
          // Not a temporary password, redirect to dashboard
          router.push('/institution');
        }
      } catch (err) {
        console.error('Error checking user:', err);
      }
    };
    checkTemporaryPassword();
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Validation
    if (formData.new_password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (formData.new_password !== formData.new_password_confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // For temporary password, we don't need old password
      // We'll use a special endpoint or modify the change password to handle temporary passwords
      await api.changePassword(
        '', // Empty old password for temporary password users
        formData.new_password,
        formData.new_password_confirm
      );

      setSuccess(true);
      // Clear the temporary password cookie
      document.cookie = 'is_temporary_password=false; path=/; max-age=0';
      
      // Refresh user data to get updated is_temporary_password status
      try {
        const updatedUser = await api.getCurrentUser();
        if (!updatedUser.is_temporary_password) {
          // Redirect after 2 seconds
          setTimeout(() => {
            router.push('/institution');
          }, 2000);
        }
      } catch {
        // If API call fails, still redirect after 2 seconds
        setTimeout(() => {
          router.push('/institution');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const backgroundClass = themeClasses.background;
  const textColorClass = isDark ? 'text-white' : 'text-gray-900';
  const mutedTextColorClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const cardBgClass = themeClasses.card;
  const inputBgClass = isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900';
  const inputPlaceholderClass = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';

  return (
    <div className={`min-h-screen ${backgroundClass} flex items-center justify-center p-4 transition-colors duration-500`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardBgClass} rounded-2xl p-8 w-full max-w-md shadow-2xl`}
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
          >
            <Lock className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className={`text-2xl font-bold mb-2 ${textColorClass}`}>Change Password</h1>
          <p className={`text-sm ${mutedTextColorClass}`}>
            You must change your temporary password to continue
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Password changed successfully! Redirecting...
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                className={`w-full px-4 py-3 pr-10 rounded-xl focus:outline-none transition-all ${inputBgClass} ${inputPlaceholderClass} focus:ring-2 focus:ring-purple-500/50`}
                placeholder="Enter new password (min 8 characters)"
                required
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${textColorClass}`}>
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.new_password_confirm}
                onChange={(e) => setFormData({ ...formData, new_password_confirm: e.target.value })}
                className={`w-full px-4 py-3 pr-10 rounded-xl focus:outline-none transition-all ${inputBgClass} ${inputPlaceholderClass} focus:ring-2 focus:ring-purple-500/50`}
                placeholder="Confirm new password"
                required
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading || success}
            whileHover={{ scale: loading || success ? 1 : 1.02 }}
            whileTap={{ scale: loading || success ? 1 : 0.98 }}
            className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all ${
              loading || success
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/30'
            }`}
          >
            {loading ? 'Changing Password...' : success ? 'Password Changed!' : 'Change Password'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}


