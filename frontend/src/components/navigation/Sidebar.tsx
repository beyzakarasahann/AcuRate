// src/components/navigation/Sidebar.tsx
'use client'; 

import { motion, AnimatePresence } from 'framer-motion'; 
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; 
import { ChevronLeft, Home, BookOpen, Award, BarChart, Settings, Sun, Moon, LogOut, ChevronDown } from 'lucide-react'; 
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes'; 
import { useThemeColors } from '../../hooks/useThemeColors'; 

// --- MOCK VE SABİTLER ---

const studentInfoLocal = { name: 'Elara Vesper' };

const baseNavItems = [
    { name: 'Home', icon: Home, slug: 'home' },
    { name: 'Courses', icon: BookOpen, slug: 'courses' },
    { name: 'Outcomes', icon: Award, slug: 'outcomes' },
    { name: 'Analytics', icon: BarChart, slug: 'analytics' },
    { name: 'Settings', icon: Settings, slug: 'settings' },
];

// --- BİLEŞEN ---

export default function Sidebar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    const pathname = usePathname();
    const router = useRouter(); 
    const { setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    const { 
        isDark, 
        mounted: themeMounted, 
        accentStart, 
        accentEnd, 
        themeClasses,
        mutedText
    } = useThemeColors();

    if (!mounted || !themeMounted) {
        return <div className="w-20 h-screen bg-gray-900 border-r border-gray-800 sticky top-0 z-50"></div>;
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
        setIsUserMenuOpen(false); 
    };
    const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

    const handleLogout = () => {
        // Mock token temizleme ve yönlendirme
        alert("Çıkış yapılıyor... (Simülasyon)");
        router.push('/login'); 
        setIsUserMenuOpen(false);
    };
    
    // Stil Sabitleri
    const activeBg = 'bg-indigo-600 shadow-lg shadow-indigo-600/50';
    const inactiveBg = isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200';
    const textColor = isDark ? 'text-gray-300' : 'text-gray-700';
    const activeText = 'text-white';
    const sidebarWidth = isSidebarOpen ? 'w-64' : 'w-20';
    const sidebarPadding = isSidebarOpen ? 'px-4' : 'px-2';
    
    const getIsActive = (slug: string) => {
        const href = `/student/${slug === 'home' ? '' : slug}`;
        
        if (slug === 'home') {
            return pathname === '/student' || pathname === '/student/';
        }
        
        return pathname.startsWith(href);
    }

    // HATA GİDERİLDİ: Framer Motion tip hatası çözüldü (ScaleY ve Tween kullanıldı)
    const dropdownVariants = {
        hidden: { 
            opacity: 0, 
            y: -10, 
            scaleY: 0.9, 
            height: 0, // Yüksekliği sıfırlıyoruz
            transformOrigin: 'bottom'
        },
        visible: { 
            opacity: 1, 
            y: 0, 
            scaleY: 1,
            height: 'auto', // Yükseklik 'auto' olabilir, ancak tip hatasını önlemek için scaleY kullanılır
            transition: { 
                type: "tween", 
                duration: 0.2,
            } 
        },
        exit: { 
            opacity: 0, 
            y: -10, 
            scaleY: 0.9,
            height: 0,
            transition: { duration: 0.15 } 
        }
    };

    return (
        <motion.div
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className={`h-screen sticky top-0 ${sidebarWidth} ${themeClasses.card.replace('backdrop-blur-xl', '').replace('shadow-2xl', 'shadow-xl')} transition-all duration-300 flex flex-col border-r ${isDark ? 'border-white/10' : 'border-gray-200'} z-50`}
        >
            {/* Logo/Başlık ve Kapatma Düğmesi */}
            <div className={`flex items-center justify-between h-20 ${sidebarPadding} pt-6 pb-2 mb-4`}>
                {isSidebarOpen ? (
                    <h2 className={`text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent`}>
                        AcuRate
                    </h2>
                ) : (
                    <motion.span 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="text-2xl"
                    >
                        🎓
                    </motion.span>
                )}
                
                <motion.button
                    onClick={toggleSidebar}
                    whileHover={{ scale: 1.1, rotate: isSidebarOpen ? 0 : 360 }}
                    className={`p-2 rounded-full ${isSidebarOpen ? 'text-gray-500' : 'text-indigo-500'} ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'} transition-all`}
                    aria-label={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                >
                    <ChevronLeft className={`w-5 h-5 transition-transform ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
                </motion.button>
            </div>

            {/* Navigasyon Öğeleri */}
            <nav className={`flex-1 space-y-2 ${sidebarPadding}`}>
                {baseNavItems.map((item) => {
                    const isActive = getIsActive(item.slug);
                    const href = `/student/${item.slug === 'home' ? '' : item.slug}`;
                    
                    return (
                        <Link
                            key={item.slug}
                            href={href}
                            passHref
                            className='block'
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                className={`w-full text-left flex items-center ${isActive ? activeBg : inactiveBg} ${isActive ? activeText : textColor} ${sidebarPadding} py-3 rounded-lg transition-all duration-200`}
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
                                    </motion.span>
                                )}
                            </motion.button>
                        </Link>
                    );
                })}
            </nav>
            
            {/* KULLANICI / DROPDOWN ALANI (En altta, sabit) */}
            <div className={`mt-auto mb-4 ${sidebarPadding}`}>
                
                {/* 1. DROPUP TETİKLEYİCİ KARTI */}
                {isSidebarOpen ? (
                    // Geniş Menü Modu
                    <motion.button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        style={{ backgroundImage: `linear-gradient(to right, ${accentStart}, ${accentEnd})` }}
                        className="w-full p-3 rounded-xl text-white font-medium shadow-md shadow-indigo-500/30 flex justify-between items-center transition-all hover:opacity-90"
                        whileHover={{ scale: 1.01 }}
                    >
                        Welcome, {studentInfoLocal.name.split(' ')[0]}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : 'rotate-0'}`} />
                    </motion.button>
                ) : (
                    // Dar Menü Modu (Sadece Avatar/İkon)
                    <motion.button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        style={{ backgroundImage: `linear-gradient(to right, ${accentStart}, ${accentEnd})` }}
                        className="w-full h-10 rounded-xl text-white font-bold flex items-center justify-center transition-all"
                        whileHover={{ scale: 1.05 }}
                    >
                        🎓
                    </motion.button>
                )}

                {/* 2. DROPDOWN İÇERİĞİ */}
                <AnimatePresence>
                    {isUserMenuOpen && (
                        <motion.div
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            // Yüksekliği manuel olarak ayarlar (scaleY ile daha iyi çalışır)
                            style={{ overflow: 'hidden' }} 
                            className={`mt-2 p-1 rounded-xl space-y-1 ${themeClasses.card.replace('shadow-2xl', '').replace('border-white/10', 'border-white/20')}`}
                        >
                            {/* Tema Değiştirme Düğmesi */}
                            <motion.button
                                onClick={toggleTheme}
                                className={`w-full p-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                            >
                                {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
                                {isSidebarOpen && <span className='flex-1 text-left'>{isDark ? "Light Mode" : "Dark Mode"}</span>}
                            </motion.button>

                            {/* ÇIKIŞ YAP DÜĞMESİ */}
                            <motion.button
                                onClick={handleLogout}
                                className={`w-full p-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20`}
                            >
                                <LogOut className="w-4 h-4" />
                                {isSidebarOpen && <span className='flex-1 text-left'>Sign Out</span>}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </motion.div>
    );
}