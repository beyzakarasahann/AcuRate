'use client';

import { motion } from 'framer-motion';
import { Settings, User, Lock, Bell, Mail, Phone, Building2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, type User as UserType } from '@/lib/api';
import toast from 'react-hot-toast';

// Sekme verileri
const settingTabs = [
  { id: 'profile', name: 'Profile Information', icon: User },
  { id: 'security', name: 'Security & Login', icon: Lock },
  { id: 'preferences', name: 'Preferences', icon: Bell },
];

// --- HELPER COMPONENTS ---

// 1. Profile Details Tab
const ProfileTab = ({ 
  isDark, 
  themeClasses, 
  text, 
  mutedText, 
  user, 
  profileForm, 
  setProfileForm, 
  onSave, 
  saving, 
  error, 
  success 
}: any) => (
  <div className="space-y-6">
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
    >
      <h3 className={`text-xl font-semibold ${text} mb-4 flex items-center gap-2`}>
        <User className="w-5 h-5 text-indigo-500" />
        Personal Information
      </h3>
      <p className={`text-sm ${mutedText} mb-6`}>Update your account details and contact information.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label className={`block text-sm font-medium ${mutedText} mb-1`}>First Name</label>
          <input
            type="text"
            value={profileForm.first_name}
            onChange={(e) => setProfileForm((prev: any) => ({ ...prev, first_name: e.target.value }))}
            className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="Enter first name"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className={`block text-sm font-medium ${mutedText} mb-1`}>Last Name</label>
          <input
            type="text"
            value={profileForm.last_name}
            onChange={(e) => setProfileForm((prev: any) => ({ ...prev, last_name: e.target.value }))}
            className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="Enter last name"
          />
        </div>

        {/* Email */}
        <div>
          <label className={`block text-sm font-medium ${mutedText} mb-1`}>Email Address</label>
          <div className="relative">
            <Mail className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm((prev: any) => ({ ...prev, email: e.target.value }))}
              className={`w-full pl-10 p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              placeholder="your.email@institution.edu"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className={`block text-sm font-medium ${mutedText} mb-1`}>Phone Number</label>
          <div className="relative">
            <Phone className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm((prev: any) => ({ ...prev, phone: e.target.value }))}
              className={`w-full pl-10 p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              placeholder="+90 555 123 4567"
            />
          </div>
        </div>

        {/* Department */}
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium ${mutedText} mb-1`}>Department / Office</label>
          <div className="relative">
            <Building2 className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <input
              type="text"
              value={profileForm.department}
              onChange={(e) => setProfileForm((prev: any) => ({ ...prev, department: e.target.value }))}
              className={`w-full pl-10 p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              placeholder="Institutional unit or office"
            />
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <p className="text-sm text-green-500">{success}</p>
        </motion.div>
      )}

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: saving ? 1 : 1.02 }}
        whileTap={{ scale: saving ? 1 : 0.98 }}
        disabled={saving}
        onClick={onSave}
        className={`mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all ${
          saving
            ? 'opacity-70 cursor-not-allowed'
            : 'hover:shadow-lg hover:shadow-indigo-500/30'
        }`}
        style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Changes'}
      </motion.button>
    </motion.div>
  </div>
);

// 2. Security Tab
const SecurityTab = ({
  isDark,
  themeClasses,
  text,
  mutedText,
  passwordForm,
  setPasswordForm,
  onChangePassword,
  saving,
  error,
  success,
}: any) => (
  <div className="space-y-6">
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
    >
      <h3 className={`text-xl font-semibold ${text} mb-4 flex items-center gap-2`}>
        <Lock className="w-5 h-5 text-red-500" />
        Change Password
      </h3>
      <p className={`text-sm ${mutedText} mb-6`}>Update your password regularly to keep your account secure.</p>

      <div className="max-w-xl space-y-4">
        <div>
          <label className={`block text-sm font-medium ${mutedText} mb-1`}>Current Password</label>
          <input
            type="password"
            value={passwordForm.old_password}
            onChange={(e) => setPasswordForm((prev: any) => ({ ...prev, old_password: e.target.value }))}
            className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${mutedText} mb-1`}>New Password</label>
          <input
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm((prev: any) => ({ ...prev, new_password: e.target.value }))}
            className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="Enter new password (min. 8 characters)"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${mutedText} mb-1`}>Confirm New Password</label>
          <input
            type="password"
            value={passwordForm.new_password_confirm}
            onChange={(e) => setPasswordForm((prev: any) => ({ ...prev, new_password_confirm: e.target.value }))}
            className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="Confirm new password"
          />
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <p className="text-sm text-green-500">{success}</p>
        </motion.div>
      )}

      {/* Update Button */}
      <motion.button
        whileHover={{ scale: saving ? 1 : 1.02 }}
        whileTap={{ scale: saving ? 1 : 0.98 }}
        disabled={saving}
        onClick={onChangePassword}
        className={`mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold bg-red-600 hover:bg-red-700 transition-colors ${
          saving ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        <Lock className="w-4 h-4" />
        {saving ? 'Updating...' : 'Update Password'}
      </motion.button>
    </motion.div>
  </div>
);

// 3. Preferences Tab
const PreferencesTab = ({ isDark, themeClasses, text, mutedText }: any) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <h3 className={`text-xl font-semibold ${text} mb-4 flex items-center gap-2`}>
          <Bell className="w-5 h-5 text-yellow-500" />
          App Preferences
        </h3>
        <p className={`text-sm ${mutedText} mb-6`}>Customize your application experience.</p>

        <div className="space-y-4">
          {/* Theme Selection */}
          <div>
            <label className={`block text-sm font-medium ${mutedText} mb-2`}>Theme</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  theme === 'system'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                System
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function InstitutionSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const {
    mounted: themeMounted,
    themeClasses,
    isDark,
    text,
    mutedText,
  } = useThemeColors();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadUser = async () => {
      try {
        setLoading(true);
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
        setProfileForm({
          first_name: currentUser.first_name || '',
          last_name: currentUser.last_name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          department: currentUser.department || '',
        });
      } catch (error: any) {
        toast.error(error.message || 'Failed to load your profile.');
        setProfileError(error.message || 'Failed to load your profile.');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [mounted]);

  const handleSaveProfile = async () => {
    setProfileError(null);
    setProfileSuccess(null);
    setSavingProfile(true);

    try {
      const updated = await api.updateProfile({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        email: profileForm.email,
        phone: profileForm.phone,
        department: profileForm.department,
      });
      setUser(updated);
      setProfileSuccess('Profile updated successfully!');
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to update profile.';
      setProfileError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation
    if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.new_password_confirm) {
      const errorMsg = 'Please fill in all password fields.';
      setPasswordError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (passwordForm.new_password.length < 8) {
      const errorMsg = 'New password must be at least 8 characters.';
      setPasswordError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      const errorMsg = 'New passwords do not match.';
      setPasswordError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword(
        passwordForm.old_password,
        passwordForm.new_password,
        passwordForm.new_password_confirm
      );
      setPasswordSuccess('Password changed successfully!');
      toast.success('Password changed successfully!');
      setPasswordForm({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to change password.';
      setPasswordError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSavingPassword(false);
    }
  };

  if (!mounted || !themeMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className={mutedText}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className={`backdrop-blur-xl ${themeClasses.card} rounded-2xl p-6 shadow-2xl flex items-center justify-between flex-wrap gap-4`}>
        <div>
          <h1 className={`text-3xl font-bold ${text} flex items-center gap-3`}>
            <Settings className="w-7 h-7 text-indigo-500" />
            Institution Settings
          </h1>
          <p className={`text-sm ${mutedText} mt-1`}>Manage your administrator account and preferences.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className={`backdrop-blur-xl ${themeClasses.card} rounded-2xl p-3 shadow-xl lg:col-span-1`}>
          <nav className="space-y-2">
            {settingTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                      : `${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} ${mutedText}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <ProfileTab
              isDark={isDark}
              themeClasses={themeClasses}
              text={text}
              mutedText={mutedText}
              user={user}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              onSave={handleSaveProfile}
              saving={savingProfile}
              error={profileError}
              success={profileSuccess}
            />
          )}

          {activeTab === 'security' && (
            <SecurityTab
              isDark={isDark}
              themeClasses={themeClasses}
              text={text}
              mutedText={mutedText}
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              onChangePassword={handlePasswordChange}
              saving={savingPassword}
              error={passwordError}
              success={passwordSuccess}
            />
          )}

          {activeTab === 'preferences' && (
            <PreferencesTab
              isDark={isDark}
              themeClasses={themeClasses}
              text={text}
              mutedText={mutedText}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
