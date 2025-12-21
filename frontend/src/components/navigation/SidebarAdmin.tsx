'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Building2,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Users,
  Network,
  Target,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, TokenManager, type User } from '@/lib/api';

const navItems = [
  { name: 'Dashboard', icon: Building2, slug: '' },
  { name: 'Teachers', icon: Users, slug: 'teachers' },
  { name: 'Students', icon: GraduationCap, slug: 'students' },
  { name: 'Departments', icon: Network, slug: 'departments' },
  { name: 'Lessons', icon: BookOpen, slug: 'lessons' },
  { name: 'PO Management', icon: Target, slug: 'po-management' },
  { name: 'Analytics', icon: BarChart3, slug: 'analytics' },
  { name: 'Settings', icon: Settings, slug: 'settings' },
];

export default function SidebarAdmin() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const pathname = usePathname();
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoadingUser(true);
      const cached = TokenManager.getUser();
      if (cached) {
        setUser(cached);
        return;
      }
      const current = await api.getCurrentUser();
      setUser(current);
    } catch (error) {
      console.error('Failed to load user', error);
    } finally {
      setLoadingUser(false);
    }
  };

  const {
    isDark,
    mounted: themeMounted,
    accentStart,
    accentEnd,
    themeClasses,
    mutedText,
  } = useThemeColors();

  if (!mounted || !themeMounted) {
    return <div className="w-20 h-screen bg-gray-900 border-r border-gray-800 sticky top-0 z-50" />;
  }

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
    setIsUserMenuOpen(false);
  };

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenManager.clearTokens();
      router.push('/login');
    }
  };

  const sidebarWidth = isSidebarOpen ? 'w-64' : 'w-20';
  const navPadding = isSidebarOpen ? 'px-4' : 'px-2';
  const inactiveBg = isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200';
  const activeBg = 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40';
  const textColor = isDark ? 'text-gray-300' : 'text-gray-700';

  const isActive = (slug: string) => {
    if (!slug) {
      return pathname === '/institution' || pathname === '/institution/';
    }
    return pathname.startsWith(`/institution/${slug}`);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, scaleY: 0, y: -5, transformOrigin: 'bottom' },
    visible: {
      opacity: 1,
      scaleY: 1,
      y: 0,
      transformOrigin: 'bottom',
      transition: { duration: 0.2 },
    },
    exit: { opacity: 0, scaleY: 0, y: -5, transition: { duration: 0.15 } },
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
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            AcuRate Admin
          </h2>
        ) : (
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-2xl"
          >
            🏛️
          </motion.span>
        )}

        <motion.button
          onClick={toggleSidebar}
          whileHover={{ scale: 1.1 }}
          className={`p-2 rounded-full ${isSidebarOpen ? 'text-gray-500' : 'text-indigo-500'} ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'
          }`}
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
        </motion.button>
      </div>

      <nav className={`flex-1 space-y-2 ${navPadding}`}>
        {navItems.map((item) => {
          const active = isActive(item.slug);
          const href = `/institution/${item.slug}`;
          const targetHref = item.slug ? href : '/institution';
          const disabled = (item as any).disabled || false;

          return (
            <Link
              key={item.slug || 'dashboard'}
              href={disabled ? '#' : targetHref}
              aria-disabled={disabled}
              className={disabled ? 'pointer-events-none opacity-60 block' : 'block'}
            >
              <motion.button
                whileHover={{ scale: disabled ? 1 : 1.02 }}
                className={`w-full text-left flex items-center ${
                  active ? activeBg : `${inactiveBg} ${textColor}`
                } ${navPadding} py-3 rounded-lg transition-all duration-200`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="ml-3 font-medium whitespace-nowrap"
                  >
                    {item.name}
                    {disabled && <span className="ml-2 text-xs uppercase tracking-wide">(soon)</span>}
                  </motion.span>
                )}
              </motion.button>
            </Link>
          );
        })}
      </nav>

      <div className={`mt-auto mb-4 ${navPadding}`}>
        {isSidebarOpen ? (
          <motion.button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            style={{ backgroundImage: `linear-gradient(to right, ${accentStart}, ${accentEnd})` }}
            className="w-full p-3 rounded-xl text-white font-medium shadow-md shadow-indigo-500/30 flex justify-between items-center transition-all hover:opacity-90"
            whileHover={{ scale: 1.01 }}
          >
            {loadingUser ? 'Loading...' : `Welcome, ${user?.first_name || user?.username || 'Admin'}`}
            <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : 'rotate-0'}`} />
          </motion.button>
        ) : (
          <motion.button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            style={{ backgroundImage: `linear-gradient(to right, ${accentStart}, ${accentEnd})` }}
            className="w-full h-10 rounded-xl text-white font-bold flex items-center justify-center transition-all"
            whileHover={{ scale: 1.05 }}
          >
            🏛️
          </motion.button>
        )}

        <AnimatePresence>
          {isUserMenuOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ overflow: 'hidden' }}
              className={`mt-2 p-1 rounded-xl space-y-1 ${themeClasses.card
                .replace('shadow-2xl', '')
                .replace('border-white/10', 'border-white/20')}`}
            >
              <motion.button
                onClick={toggleTheme}
                className={`w-full p-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                  isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
                {isSidebarOpen && <span className="flex-1 text-left">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
              </motion.button>

              <motion.button
                onClick={handleLogout}
                className="w-full p-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                {isSidebarOpen && <span className="flex-1 text-left">Sign Out</span>}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

