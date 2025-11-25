'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Settings, User, Lock, Phone, Building2, Mail, Save } from 'lucide-react';
import { api, type User as UserType } from '@/lib/api';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ProfileForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
}

interface PasswordForm {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export default function InstitutionSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [user, setUser] = useState<UserType | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

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
        setProfileError(error.message || 'Failed to load your profile.');
      }
    };

    loadUser();
  }, [mounted]);

  const handleProfileChange = (field: keyof ProfileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setProfileError(null);
    setProfileMessage(null);
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
      setProfileMessage('Profile updated successfully.');
    } catch (error: any) {
      setProfileError(error.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordMessage(null);

    if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.new_password_confirm) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword(
        passwordForm.old_password,
        passwordForm.new_password,
        passwordForm.new_password_confirm
      );
      setPasswordMessage('Password changed successfully.');
      setPasswordForm({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!mounted || !themeMounted) {
    return null;
  }

  const ProfileTab = () => (
    <div className={`backdrop-blur-xl ${themeClasses.card} rounded-2xl p-6 shadow-2xl space-y-6`}>
      <div>
        <h2 className={`text-xl font-semibold ${text} flex items-center gap-2`}>
          <User className="w-5 h-5 text-indigo-500" />
          Personal Information
        </h2>
        <p className={`text-sm ${mutedText}`}>Update your account details and contact information.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${mutedText}`}>First Name</label>
          <input
            type="text"
            value={profileForm.first_name}
            onChange={(e) => handleProfileChange('first_name', e.target.value)}
            className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500 outline-none`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${mutedText}`}>Last Name</label>
          <input
            type="text"
            value={profileForm.last_name}
            onChange={(e) => handleProfileChange('last_name', e.target.value)}
            className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500 outline-none`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${mutedText}`}>Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              className={`w-full pl-10 p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500 outline-none`}
            />
          </div>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${mutedText}`}>Phone</label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input
              type="text"
              value={profileForm.phone}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              className={`w-full pl-10 p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500 outline-none`}
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-1 ${mutedText}`}>Department / Office</label>
          <div className="relative">
            <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input
              type="text"
              value={profileForm.department}
              onChange={(e) => handleProfileChange('department', e.target.value)}
              placeholder="Institutional unit or office"
              className={`w-full pl-10 p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500 outline-none`}
            />
          </div>
        </div>
      </div>
      {profileError && <p className="text-sm text-red-500">{profileError}</p>}
      {profileMessage && <p className="text-sm text-green-500">{profileMessage}</p>}
      <motion.button
        whileHover={{ scale: savingProfile ? 1 : 1.02 }}
        whileTap={{ scale: savingProfile ? 1 : 0.98 }}
        disabled={savingProfile}
        onClick={handleSaveProfile}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold ${savingProfile ? 'opacity-70 cursor-not-allowed' : ''}`}
        style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
      >
        <Save className="w-4 h-4" />
        {savingProfile ? 'Saving...' : 'Save Changes'}
      </motion.button>
    </div>
  );

  const SecurityTab = () => (
    <div className={`backdrop-blur-xl ${themeClasses.card} rounded-2xl p-6 shadow-2xl space-y-6`}>
      <div>
        <h2 className={`text-xl font-semibold ${text} flex items-center gap-2`}>
          <Lock className="w-5 h-5 text-red-500" />
          Security
        </h2>
        <p className={`text-sm ${mutedText}`}>Update your password regularly to keep your account secure.</p>
      </div>
      <div className="max-w-xl space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${mutedText}`}>Current Password</label>
          <input
            type="password"
            value={passwordForm.old_password}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, old_password: e.target.value }))}
            className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500 outline-none`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${mutedText}`}>New Password</label>
          <input
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
            className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500 outline-none`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${mutedText}`}>Confirm New Password</label>
          <input
            type="password"
            value={passwordForm.new_password_confirm}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password_confirm: e.target.value }))}
            className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500 outline-none`}
          />
        </div>
      </div>
      {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
      {passwordMessage && <p className="text-sm text-green-500">{passwordMessage}</p>}
      <motion.button
        whileHover={{ scale: savingPassword ? 1 : 1.02 }}
        whileTap={{ scale: savingPassword ? 1 : 0.98 }}
        disabled={savingPassword}
        onClick={handlePasswordChange}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold bg-red-600 hover:bg-red-700 transition-colors ${savingPassword ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {savingPassword ? 'Updating...' : 'Update Password'}
      </motion.button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className={`backdrop-blur-xl ${themeClasses.card} rounded-2xl p-6 shadow-2xl flex items-center justify-between flex-wrap gap-4`}>
        <div>
          <h1 className={`text-3xl font-bold ${text} flex items-center gap-3`}>
            <Settings className="w-7 h-7 text-indigo-500" />
            Institution Settings
          </h1>
          <p className={`text-sm ${mutedText}`}>Manage your administrator contact details and credentials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`backdrop-blur-xl ${themeClasses.card} rounded-2xl p-3 shadow-xl lg:col-span-1`}>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : `${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} ${mutedText}`
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                activeTab === 'security'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : `${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} ${mutedText}`
              }`}
            >
              <Lock className="w-4 h-4" />
              Security
            </button>
          </nav>
        </div>
        <div className="lg:col-span-3">
          {activeTab === 'profile' ? <ProfileTab /> : <SecurityTab />}
        </div>
      </div>
    </motion.div>
  );
}

