'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronDown,
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  Activity,
  FileText,
  Settings,
  Sun,
  Moon,
  LogOut,
  Shield,
  Mail,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, TokenManager, type User } from '@/lib/api';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, slug: '' },
  { name: 'Contact', icon: Mail, slug: 'contact' },
  { name: 'Institutions', icon: Building2, slug: 'institutions' },
  { name: 'Users', icon: Users, slug: 'users' },
  { name: 'Activity Logs', icon: Activity, slug: 'logs' },
  { name: 'Settings', icon: Settings, slug: 'settings' },
];

export default function SidebarSuperAdmin() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { isDark, mounted: themeMounted, themeClasses } = useThemeColors();

  useEffect(() => {
    setMounted(true);
    const currentUser = TokenManager.getUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      // Try to fetch current user
      api.getCurrentUser().then(setUser).catch(() => {});
    }
  }, []);

  if (!mounted || !themeMounted) {
    return (
      <div className={`w-20 h-screen ${themeClasses.card} border-r ${
        isDark ? 'border-white/10' : 'border-gray-200'
      } sticky top-0 z-50`}></div>
    );
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    setIsUserMenuOpen(false);
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      TokenManager.clearTokens();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      TokenManager.clearTokens();
      router.push('/login');
    }
  };

  const sidebarWidth = isSidebarOpen ? 'w-64' : 'w-20';
  const navPadding = isSidebarOpen ? 'px-4' : 'px-2';
  const inactiveBg = isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200';
  const activeBg = 'bg-red-600 text-white shadow-lg shadow-red-600/40';
  const textColor = isDark ? 'text-gray-300' : 'text-gray-700';

  const isActive = (slug: string) => {
    if (!slug) {
      return pathname === '/super-admin' || pathname === '/super-admin/';
    }
    return pathname.startsWith(`/super-admin/${slug}`);
  };

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`h-screen sticky top-0 ${sidebarWidth} ${themeClasses.card
        .replace('backdrop-blur-xl', '')
        .replace('shadow-2xl', 'shadow-xl')} transition-all duration-300 flex flex-col border-r ${
        isDark ? 'border-white/10' : 'border-gray-200'
      } z-50`}
    >
      <div className={`flex items-center justify-between h-20 ${navPadding} pt-6 pb-2 mb-4`}>
        {isSidebarOpen ? (
          <h2 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Super Admin
          </h2>
        ) : (
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-2xl"
          >
            🛡️
          </motion.span>
        )}

        <motion.button
          onClick={toggleSidebar}
          whileHover={{ scale: 1.1 }}
          className={`p-2 rounded-full ${isSidebarOpen ? 'text-gray-500' : 'text-red-500'} ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'
          }`}
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`}
          />
        </motion.button>
      </div>

      <nav className={`flex-1 overflow-y-auto ${navPadding} space-y-1`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.slug);
          const href = `/super-admin${item.slug ? `/${item.slug}` : ''}`;

          return (
            <Link key={item.slug} href={href}>
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 ${navPadding} py-3 rounded-xl cursor-pointer transition-all ${
                  active ? activeBg : `${inactiveBg} ${textColor}`
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : ''}`} />
                {isSidebarOpen && (
                  <span className={`font-medium ${active ? 'text-white' : textColor}`}>
                    {item.name}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className={`${navPadding} pb-6 space-y-2`}>
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-full flex items-center gap-3 ${navPadding} py-3 rounded-xl ${inactiveBg} ${textColor} transition-all`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {isSidebarOpen && <span className="font-medium">Toggle Theme</span>}
        </motion.button>

        <div className="relative">
          <motion.button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            whileHover={{ scale: 1.02 }}
            className={`w-full flex items-center gap-3 ${navPadding} py-3 rounded-xl ${inactiveBg} ${textColor} transition-all`}
          >
            <Shield className="w-5 h-5" />
            {isSidebarOpen && (
              <>
                <span className="font-medium flex-1 text-left">
                  {user?.username || 'Admin'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </motion.button>

          <AnimatePresence>
            {isUserMenuOpen && isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute bottom-full left-0 right-0 mb-2 ${themeClasses.card} rounded-xl shadow-xl border ${
                  isDark ? 'border-white/10' : 'border-gray-200'
                } overflow-hidden`}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/10 text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

