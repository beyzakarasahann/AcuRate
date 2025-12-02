// app/student/settings/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Settings, User, Lock, Bell, Moon, Sun, Globe, Save, Loader2, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { api, TokenManager, type User as UserType } from '@/lib/api';

// Sekme verileri
const settingTabs = [
    { id: 'profile', name: 'Profile Information', icon: User },
    { id: 'security', name: 'Security & Login', icon: Lock },
    { id: 'preferences', name: 'App Preferences', icon: Bell },
];

// --- YARDIMCI BİLEŞENLER ---

// 1. Profil Bilgileri Sekmesi
const ProfileTab = ({ 
  isDark, 
  themeClasses, 
  text, 
  mutedText, 
  user
}: {
  isDark: boolean;
  themeClasses: any;
  text: string;
  mutedText: string;
  user: UserType | null;
}) => {
  // Display department as "Computer Engineering" for Beyza account
  const displayDepartment = user?.department || 'Computer Engineering';
  const displayEmail = user?.email || '-';

  return (
    <div className="space-y-6">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <h3 className={`text-xl font-semibold ${text} mb-4`}>Personal Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>First Name</label>
                    <input 
                        type="text" 
                        value={user?.first_name || '-'}
                        readOnly
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-200 border-gray-300 text-gray-600'} border cursor-not-allowed`}
                    />
                </div>
                {/* Last Name */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Last Name</label>
                    <input 
                        type="text" 
                        value={user?.last_name || '-'}
                        readOnly
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-200 border-gray-300 text-gray-600'} border cursor-not-allowed`}
                    />
                </div>
                {/* Öğrenci ID */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Student ID</label>
                    <input 
                        type="text" 
                        value={user?.student_id || '-'}
                        readOnly
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-200 border-gray-300 text-gray-600'} border cursor-not-allowed`}
                    />
                </div>
                {/* Email */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Email Address</label>
                    <input 
                        type="email" 
                        value={displayEmail}
                        readOnly
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-200 border-gray-300 text-gray-600'} border cursor-not-allowed`}
                    />
                </div>
                {/* Department */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Department</label>
                    <input
                        type="text"
                        value={displayDepartment}
                        readOnly
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-200 border-gray-300 text-gray-600'} border cursor-not-allowed`}
                    />
                </div>
            </div>
        </motion.div>
    </div>
  );
};

// 2. Güvenlik Sekmesi
const SecurityTab = ({ 
  isDark, 
  themeClasses, 
  text, 
  mutedText, 
  onChangePassword,
  isTemporaryPassword = false
}: {
  isDark: boolean;
  themeClasses: any;
  text: string;
  mutedText: string;
  onChangePassword: (oldPassword: string, newPassword: string, newPasswordConfirm: string) => Promise<void>;
  isTemporaryPassword?: boolean;
}) => {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    // For temporary password, old password is optional
    if (!isTemporaryPassword && !passwords.oldPassword) {
      setMessage({ type: 'error', text: 'Current password is required' });
      setLoading(false);
      return;
    }
    if (!passwords.newPassword || !passwords.newPasswordConfirm) {
      setMessage({ type: 'error', text: 'New password fields are required' });
      setLoading(false);
      return;
    }

    if (passwords.newPassword !== passwords.newPasswordConfirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwords.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters long' });
      setLoading(false);
      return;
    }

    try {
      await onChangePassword(
        isTemporaryPassword ? '' : passwords.oldPassword, 
        passwords.newPassword, 
        passwords.newPasswordConfirm
      );
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswords({ oldPassword: '', newPassword: '', newPasswordConfirm: '' });
      // Clear temporary password cookie
      if (isTemporaryPassword) {
        document.cookie = 'is_temporary_password=false; path=/; max-age=0';
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} `}>
            <h3 className={`text-xl font-semibold ${text} mb-4`}>Change Password</h3>
            
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                  message.type === 'success'
                    ? isDark ? 'bg-green-500/10 border border-green-500/30 text-green-300' : 'bg-green-50 border border-green-200 text-green-700'
                    : isDark ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span className="text-sm">{message.text}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 max-w-lg">
                   <div>
                      <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                        {isTemporaryPassword ? 'Temporary Password (Optional)' : 'Current Password'}
                      </label>
                      {isTemporaryPassword && (
                        <p className={`text-xs mb-2 ${mutedText}`}>
                          You can leave this empty if you're using the temporary password from your email.
                        </p>
                      )}
                      <div className="relative">
                        <input 
                          type={showPasswords.old ? 'text' : 'password'} 
                          value={passwords.oldPassword}
                          onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                          placeholder={isTemporaryPassword ? "Leave empty if using temporary password" : "Enter current password"}
                          required={!isTemporaryPassword}
                          className={`w-full p-3 pr-10 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${mutedText} hover:opacity-70 transition-opacity`}
                        >
                          {showPasswords.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                  </div>
                  <div>
                      <label className={`block text-sm font-medium ${mutedText} mb-1`}>New Password</label>
                      <div className="relative">
                        <input 
                          type={showPasswords.new ? 'text' : 'password'} 
                          value={passwords.newPassword}
                          onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                          placeholder="Enter new password (min 8 characters)"
                          className={`w-full p-3 pr-10 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${mutedText} hover:opacity-70 transition-opacity`}
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                  </div>
                  <div>
                      <label className={`block text-sm font-medium ${mutedText} mb-1`}>Confirm New Password</label>
                      <div className="relative">
                        <input 
                          type={showPasswords.confirm ? 'text' : 'password'} 
                          value={passwords.newPasswordConfirm}
                          onChange={(e) => setPasswords({ ...passwords, newPasswordConfirm: e.target.value })}
                          placeholder="Confirm new password"
                          className={`w-full p-3 pr-10 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${mutedText} hover:opacity-70 transition-opacity`}
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                  </div>
              </div>
              
              <motion.button 
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className={`mt-6 px-6 py-3 ${loading ? 'bg-gray-500' : 'bg-red-600 hover:bg-red-700'} text-white font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:cursor-not-allowed`}
              >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Update Password
                    </>
                  )}
              </motion.button>
            </form>
        </motion.div>
    </div>
  );
};

// 3. Tercihler Sekmesi
// whiteText yerine 'text' kullanıldı
const PreferencesTab = ({ isDark, themeClasses, text, mutedText }: any) => {
    const { setTheme } = useTheme();

    return (
        <div className="space-y-6">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} `}>
                <h3 className={`text-xl font-semibold ${text} mb-4`}>Display and Notifications</h3>
                
                {/* Tema Seçimi */}
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
                
                {/* Dil Seçimi */}
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
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-800'} appearance-none`}
                    >
                        <option value="en">English</option>
                        <option value="tr">Türkçe</option>
                    </select>
                </div>

                 {/* Bildirimler */}
                 <div className="flex justify-between items-center pt-3">
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-orange-500" />
                        <div>
                            <p className={text}>Email Notifications</p>
                            <p className={mutedText}>Receive alerts on grade changes and deadlines.</p>
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


// --- ANA BİLEŞEN: SETTINGS PAGE ---

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState(settingTabs[0].id);
  
  useEffect(() => {
    setMounted(true);
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Try to get from cache first
      const cachedUser = TokenManager.getUser();
      if (cachedUser) {
        setUser(cachedUser);
        setLoading(false);
        // Also fetch fresh data
        try {
          const freshUser = await api.getCurrentUser();
          setUser(freshUser);
        } catch {
          // Use cached data if API fails
        }
        return;
      }
      
      // Fetch from API
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      console.error('Failed to fetch user data:', err);
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (oldPassword: string, newPassword: string, newPasswordConfirm: string) => {
    await api.changePassword(oldPassword, newPassword, newPasswordConfirm);
    // Refresh user data after password change
    await fetchUserData();
  };

  // Check if user has temporary password and redirect if needed
  useEffect(() => {
    if (user && user.is_temporary_password && activeTab !== 'security') {
      // Force user to security tab if they have temporary password
      setActiveTab('security');
    }
  }, [user, activeTab]);

  const { isDark, themeClasses, text, mutedText } = useThemeColors(); 

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={mutedText}>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`text-center p-6 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error}</p>
          <button
            onClick={fetchUserData}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const renderTabContent = () => {
    const props = { isDark, themeClasses, text, mutedText };
    switch (activeTab) {
        case 'profile': 
          return <ProfileTab {...props} user={user} />;
        case 'security': 
          return <SecurityTab {...props} onChangePassword={handleChangePassword} isTemporaryPassword={user?.is_temporary_password || false} />;
        case 'preferences': 
          return <PreferencesTab {...props} />;
        default: return null;
    }
  };

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`container mx-auto py-0`}
    >
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center mb-6 border-b pb-4 border-gray-500/20"
      >
        <h1 className={`text-3xl font-bold ${text} flex items-center gap-3`}>
          <Settings className="w-7 h-7 text-indigo-500" />
          User Settings
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
            <nav className={`${themeClasses.card} p-3 rounded-xl shadow-lg border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                {settingTabs.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            whileHover={{ x: 5 }}
                            className={`w-full text-left flex items-center gap-3 p-3 rounded-lg font-medium transition-all duration-200 ${
                                isActive 
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
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