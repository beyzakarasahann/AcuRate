// app/student/settings/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Settings, User, Lock, Bell, Moon, Sun, Globe, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useThemeColors } from '@/hooks/useThemeColors'; 

// --- MOCK VERİLER ---
const studentInfo = {
  name: 'Elara Vesper',
  studentId: '202201042',
  email: 'elara.vesper@university.edu',
  major: 'Computer Science',
  phone: '+90 555 123 4567',
};

// Sekme verileri
const settingTabs = [
    { id: 'profile', name: 'Profile Information', icon: User },
    { id: 'security', name: 'Security & Login', icon: Lock },
    { id: 'preferences', name: 'App Preferences', icon: Bell },
];

// --- YARDIMCI BİLEŞENLER ---

// 1. Profil Bilgileri Sekmesi
// whiteText yerine 'text' kullanıldı
const ProfileTab = ({ isDark, themeClasses, text, mutedText }: any) => ( 
    <div className="space-y-6">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <h3 className={`text-xl font-semibold ${text} mb-4`}>Personal Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* İsim */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Full Name</label>
                    <input 
                        type="text" 
                        defaultValue={studentInfo.name}
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                </div>
                {/* Öğrenci ID */}
                 <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Student ID (Read-Only)</label>
                    <input 
                        type="text" 
                        defaultValue={studentInfo.studentId}
                        readOnly
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-200 border-gray-300 text-gray-600'} border cursor-not-allowed`}
                    />
                </div>
                {/* Email */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Email Address</label>
                    <input 
                        type="email" 
                        defaultValue={studentInfo.email}
                        className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                </div>
                {/* Bölüm */}
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Major</label>
                    <select
                        defaultValue={studentInfo.major}
                        className={`w-full p-3 rounded-lg appearance-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Electrical Engineering">Electrical Engineering</option>
                    </select>
                </div>
            </div>
            
            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
                <Save className="w-4 h-4" /> Save Profile
            </motion.button>

        </motion.div>
    </div>
);

// 2. Güvenlik Sekmesi
// whiteText yerine 'text' kullanıldı
const SecurityTab = ({ isDark, themeClasses, text, mutedText }: any) => ( 
    <div className="space-y-6">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} `}>
            <h3 className={`text-xl font-semibold ${text} mb-4`}>Change Password</h3>
            <div className="space-y-4 max-w-lg">
                 <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Current Password</label>
                    <input type="password" placeholder="********" className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`} />
                </div>
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>New Password</label>
                    <input type="password" placeholder="********" className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`} />
                </div>
                <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>Confirm New Password</label>
                    <input type="password" placeholder="********" className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`} />
                </div>
            </div>
            
            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
                <Lock className="w-4 h-4" /> Update Password
            </motion.button>
        </motion.div>
    </div>
);

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
  const [activeTab, setActiveTab] = useState(settingTabs[0].id); // Varsayılan: Profile
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // HATA ÇÖZÜMÜ: whiteText yerine 'text' çekildi
  const { isDark, themeClasses, text, mutedText } = useThemeColors(); 

  if (!mounted) {
    return null;
  }
  
  // whiteText değişkeni yerine çekilen 'text' kullanılıyor.
  const renderTabContent = () => {
    const props = { isDark, themeClasses, text, mutedText }; // <-- Prop adı 'text' olarak güncellendi
    switch (activeTab) {
        case 'profile': return <ProfileTab {...props} />;
        case 'security': return <SecurityTab {...props} />;
        case 'preferences': return <PreferencesTab {...props} />;
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