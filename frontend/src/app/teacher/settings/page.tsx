// app/teacher/settings/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Settings, User, Lock, Bell, Moon, Sun, Globe, Save, BookOpen, Mail, Phone, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { api } from '@/lib/api';
import type { User } from '@/lib/api';

// Sekme verileri
const settingTabs = [
    { id: 'profile', name: 'Profile Information', icon: User },
    { id: 'security', name: 'Security & Login', icon: Lock },
    { id: 'preferences', name: 'App Preferences', icon: Bell },
    { id: 'teaching', name: 'Teaching Preferences', icon: BookOpen },
];

// --- HELPER COMPONENTS ---

// 1. Profile Details Tab
const ProfileTab = ({ isDark, themeClasses, text, mutedText, user }: any) => ( 
    <div className="space-y-6">
        <motion.div 
            initial={{ x: -20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
        >
            <h3 className={`text-xl font-semibold ${text} mb-4 flex items-center gap-2`}>
                <User className="w-5 h-5 text-indigo-500" />
                Personal Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Full Name</label>
                    <input 
                        type="text" 
                        value={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()}
                        disabled
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                </div>
                {/* Email */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Email Address</label>
                    <input 
                        type="email" 
                        value={user?.email ?? ''}
                        disabled
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                </div>
                {/* Department */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Department</label>
                    <input
                        type="text"
                        value={user?.department ?? 'Department not set'}
                        disabled
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                </div>
                {/* Title */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Title</label>
                    <input
                        type="text"
                        value={user?.role_display ?? 'Faculty'}
                        disabled
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                </div>
                {/* Phone */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Phone Number</label>
                    <input 
                        type="tel" 
                        value={user?.phone ?? 'Not provided'}
                        disabled
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                </div>
                {/* Office */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Office Location</label>
                    <input 
                        type="text" 
                        value={user?.office_location ?? 'Not provided'}
                        disabled
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                </div>
            </div>
            
        </motion.div>
    </div>
);

// 2. Security Tab
const SecurityTab = ({ isDark, themeClasses, text, mutedText, onChangePassword, loading, error, success, form, setForm }: any) => (
    <div className="space-y-6">
        <motion.div 
            initial={{ x: -20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            transition={{ delay: 0.1 }} 
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
        >
            <h3 className={`text-xl font-semibold ${text} mb-4 flex items-center gap-2`}>
                <Lock className="w-5 h-5 text-red-500" />
                Change Password
            </h3>
            <div className="space-y-4 max-w-lg">
                 <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Current Password</label>
                    <input 
                        type="password" 
                        placeholder="********" 
                        value={form.old_password}
                        onChange={(e) => setForm((prev: any) => ({ ...prev, old_password: e.target.value }))}
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`} 
                    />
                </div>
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>New Password</label>
                    <input 
                        type="password" 
                        placeholder="********" 
                        value={form.new_password}
                        onChange={(e) => setForm((prev: any) => ({ ...prev, new_password: e.target.value }))}
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`} 
                    />
                </div>
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Confirm New Password</label>
                    <input 
                        type="password" 
                        placeholder="********" 
                        value={form.new_password_confirm}
                        onChange={(e) => setForm((prev: any) => ({ ...prev, new_password_confirm: e.target.value }))}
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`} 
                    />
                </div>
            </div>
            
            {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
            {success && <p className="text-sm text-green-500 mt-4">{success}</p>}

            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onChangePassword}
                disabled={loading}
                className={`mt-6 px-6 py-3 ${loading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white font-semibold rounded-lg flex items-center gap-2 transition-colors`}
            >
                <Lock className="w-4 h-4" /> {loading ? 'Updating...' : 'Update Password'}
            </motion.button>
        </motion.div>
    </div>
);

// 3. Preferences Tab
const PreferencesTab = ({ isDark, themeClasses, text, mutedText }: any) => {
    const { setTheme } = useTheme();

    return (
        <div className="space-y-6">
            <motion.div 
                initial={{ x: -20, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ delay: 0.2 }} 
                className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
            >
                <h3 className={`text-xl font-semibold ${text} mb-4 flex items-center gap-2`}>
                    <Bell className="w-5 h-5 text-orange-500" />
                    Display and Notifications
                </h3>
                
                {/* Theme selection */}
                <div className="flex justify-between items-center py-3 border-b border-gray-500/10">
                    <div className="flex items-center gap-3">
                        {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
                        <div>
                            <p className={text}>Application Theme</p>
                            <p className={mutedText}>Current: {isDark ? 'Dark Mode' : 'Light Mode'}</p>
                        </div>
                    </div>
                    <motion.button
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                    >
                        Switch to {isDark ? 'Light' : 'Dark'}
                    </motion.button>
                </div>
                
                {/* Language selection */}
                 <div className="flex justify-between items-center py-3 border-b border-gray-500/10">
                    <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <div>
                            <p className={text}>Language</p>
                            <p className={mutedText}>English (Default)</p>
                        </div>
                    </div>
                    <select
                        defaultValue="en"
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-white/10 text-white border-white/10' : 'bg-gray-200 text-gray-800 border-gray-300'} border appearance-none`}
                    >
                        <option value="en">English</option>
                        <option value="tr">Turkish</option>
                    </select>
                </div>

                 {/* Email notifications */}
                 <div className="flex justify-between items-center py-3 border-b border-gray-500/10">
                    <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-green-500" />
                        <div>
                            <p className={text}>Email Notifications</p>
                            <p className={mutedText}>Receive alerts on grade submissions and student inquiries.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className={`w-11 h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600`}></div>
                    </label>
                </div>

                 {/* Push notifications */}
                 <div className="flex justify-between items-center pt-3">
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-purple-500" />
                        <div>
                            <p className={text}>Push Notifications</p>
                            <p className={mutedText}>Get instant notifications for important updates.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className={`w-11 h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600`}></div>
                    </label>
                </div>
            </motion.div>
        </div>
    );
};

// 4. Teaching Preferences Tab (teacher specific)
const TeachingPreferencesTab = ({ isDark, themeClasses, text, mutedText }: any) => {
    const [defaultWeights, setDefaultWeights] = useState({
        exam: 35,
        project: 40,
        assignment: 15,
        quiz: 10,
    });

    const [autoGradeNotifications, setAutoGradeNotifications] = useState(true);
    const [studentInquiryNotifications, setStudentInquiryNotifications] = useState(true);
    const [deadlineReminders, setDeadlineReminders] = useState(true);

    return (
        <div className="space-y-6">
            <motion.div 
                initial={{ x: -20, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ delay: 0.3 }} 
                className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
            >
                <h3 className={`text-xl font-semibold ${text} mb-4 flex items-center gap-2`}>
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    Default Assessment Weights
                </h3>
                <p className={`${mutedText} text-sm mb-4`}>
                    Set default weight percentages for different assessment types. These will be used when creating new assessments.
                </p>
                
                <div className="space-y-4 max-w-lg">
                    <div>
                        <label className={`block text-sm font-medium ${mutedText} mb-1`}>Exams (%)</label>
                        <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={defaultWeights.exam}
                            onChange={(e) => setDefaultWeights({...defaultWeights, exam: Number(e.target.value)})}
                            className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium ${mutedText} mb-1`}>Projects (%)</label>
                        <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={defaultWeights.project}
                            onChange={(e) => setDefaultWeights({...defaultWeights, project: Number(e.target.value)})}
                            className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium ${mutedText} mb-1`}>Assignments (%)</label>
                        <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={defaultWeights.assignment}
                            onChange={(e) => setDefaultWeights({...defaultWeights, assignment: Number(e.target.value)})}
                            className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium ${mutedText} mb-1`}>Quizzes (%)</label>
                        <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={defaultWeights.quiz}
                            onChange={(e) => setDefaultWeights({...defaultWeights, quiz: Number(e.target.value)})}
                            className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                        />
                    </div>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} border`}>
                        <p className={`${mutedText} text-xs`}>
                            Total: {defaultWeights.exam + defaultWeights.project + defaultWeights.assignment + defaultWeights.quiz}%
                            {defaultWeights.exam + defaultWeights.project + defaultWeights.assignment + defaultWeights.quiz !== 100 && (
                                <span className="text-orange-500 ml-2">⚠️ Should equal 100%</span>
                            )}
                        </p>
                    </div>
                </div>
            </motion.div>

            <motion.div 
                initial={{ x: -20, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ delay: 0.4 }} 
                className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
            >
                <h3 className={`text-xl font-semibold ${text} mb-4 flex items-center gap-2`}>
                    <Bell className="w-5 h-5 text-orange-500" />
                    Teaching Notifications
                </h3>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-500/10">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-blue-500" />
                            <div>
                                <p className={text}>Auto-Grade Notifications</p>
                                <p className={mutedText}>Notify when grades are automatically calculated.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={autoGradeNotifications}
                                onChange={(e) => setAutoGradeNotifications(e.target.checked)}
                                className="sr-only peer" 
                            />
                            <div className={`w-11 h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600`}></div>
                        </label>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-gray-500/10">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-purple-500" />
                            <div>
                                <p className={text}>Student Inquiry Alerts</p>
                                <p className={mutedText}>Get notified when students send inquiries.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={studentInquiryNotifications}
                                onChange={(e) => setStudentInquiryNotifications(e.target.checked)}
                                className="sr-only peer" 
                            />
                            <div className={`w-11 h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600`}></div>
                        </label>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-red-500" />
                            <div>
                                <p className={text}>Deadline Reminders</p>
                                <p className={mutedText}>Remind me before assessment deadlines.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={deadlineReminders}
                                onChange={(e) => setDeadlineReminders(e.target.checked)}
                                className="sr-only peer" 
                            />
                            <div className={`w-11 h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600`}></div>
                        </label>
                    </div>
                </div>

                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-all"
                >
                    <Save className="w-4 h-4" /> Save Teaching Preferences
                </motion.button>
            </motion.div>
        </div>
    );
};

// --- ANA BİLEŞEN: SETTINGS PAGE ---

export default function TeacherSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(settingTabs[0].id);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  
  const { 
    isDark, 
    mounted: themeMounted, 
    themeClasses, 
    text, 
    mutedText 
  } = useThemeColors();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
        setUserError(null);
      } catch (error: any) {
        setUserError(error.message || 'Unable to load user details.');
      } finally {
        setUserLoading(false);
      }
    };

    loadUser();
  }, []);

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.new_password_confirm) {
      setPasswordError('Please fill in all fields.');
      return;
    }

    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword(
        passwordForm.old_password,
        passwordForm.new_password,
        passwordForm.new_password_confirm
      );
      setPasswordSuccess('Password updated successfully.');
      setPasswordForm({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error: any) {
      setPasswordError(error.message || 'An error occurred while updating the password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!mounted || !themeMounted) {
    return null;
  }

  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading your profile...</p>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">{userError}</p>
      </div>
    );
  }
  
  const renderTabContent = () => {
    const props = { isDark, themeClasses, text, mutedText };
    switch (activeTab) {
        case 'profile': return <ProfileTab {...props} user={user} />;
        case 'security': 
            return (
                <SecurityTab 
                    {...props} 
                    form={passwordForm}
                    setForm={setPasswordForm}
                    loading={passwordLoading}
                    error={passwordError}
                    success={passwordSuccess}
                    onChangePassword={handlePasswordChange}
                />
            );
        case 'preferences': return <PreferencesTab {...props} />;
        case 'teaching': return <TeachingPreferencesTab {...props} />;
        default: return null;
    }
  };

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-0"
    >
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center mb-6 border-b pb-4 border-gray-500/20"
      >
        <h1 className={`text-3xl font-bold ${text} flex items-center gap-3`}>
          <Settings className="w-7 h-7 text-indigo-500" />
          Teacher Settings
        </h1>
      </motion.div>

      {/* Ana İçerik: Sekmeler ve İçerik */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sol Sütun: Sekme Navigasyonu */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-3"
          >
            <nav className={`backdrop-blur-xl ${themeClasses.card} p-3 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                {settingTabs.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            whileHover={{ x: 5 }}
                            className={`w-full text-left flex items-center gap-3 p-3 rounded-lg font-medium transition-all duration-200 mb-2 last:mb-0 ${
                                isActive 
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30' 
                                    : `${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} ${mutedText}`
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.name}
                        </motion.button>
                    );
                })}
            </nav>
          </motion.div>

          {/* Sağ Sütun: Sekme İçeriği */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
      </div>
    </motion.div>
  );
}

