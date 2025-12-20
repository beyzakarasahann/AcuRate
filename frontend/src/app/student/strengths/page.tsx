// app/student/strengths/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Award, TrendingUp, Target, BookOpen, Star, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, TokenManager, type ProgramOutcome, type StudentPOAchievement, type Enrollment, type Assessment } from '@/lib/api';
import Link from 'next/link';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Tooltip, 
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
    ArcElement
);

interface StrengthData {
    code: string;
    title: string;
    achievement: number;
    target: number;
    type: 'PO';
    id: number;
}

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function StrengthsPage() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [poAchievements, setPOAchievements] = useState<StudentPOAchievement[]>([]);
    const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcome[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    
    const { isDark, themeClasses, text, mutedText } = useThemeColors();
    const whiteText = text;

    useEffect(() => {
        setMounted(true);
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!TokenManager.isAuthenticated() || !TokenManager.getAccessToken()) {
                setError('Please log in to view strengths analysis.');
                setLoading(false);
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return;
            }

            const [
                poAchievementsResult,
                programOutcomesResult,
                enrollmentsResult
            ] = await Promise.allSettled([
                api.getPOAchievements(),
                api.getProgramOutcomes(),
                api.getEnrollments()
            ]);

            if (poAchievementsResult.status === 'fulfilled') {
                setPOAchievements(Array.isArray(poAchievementsResult.value) ? poAchievementsResult.value : []);
            }

            if (programOutcomesResult.status === 'fulfilled') {
                setProgramOutcomes(Array.isArray(programOutcomesResult.value) ? programOutcomesResult.value : []);
            }

            if (enrollmentsResult.status === 'fulfilled') {
                setEnrollments(Array.isArray(enrollmentsResult.value) ? enrollmentsResult.value : []);
            }

            setLoading(false);
        } catch (err: any) {
            console.error('Failed to fetch strengths data:', err);
            setError(err.message || 'Failed to load strengths analysis');
            setLoading(false);
        }
    };

    // Build map for PO data
    const poMap = useMemo(() => {
        const map = new Map<number, ProgramOutcome>();
        programOutcomes.forEach(po => {
            const poId = typeof po.id === 'string' ? parseInt(po.id) : po.id;
            if (poId) map.set(poId, po);
        });
        return map;
    }, [programOutcomes]);

    // Calculate strengths (top PO achievements only)
    const strengths: StrengthData[] = useMemo(() => {
        const allStrengths: StrengthData[] = [];

        // Add PO strengths only
        poAchievements.forEach(poAch => {
            const achievement = poAch.achievement_percentage || poAch.current_percentage || 0;
            if (achievement > 0) {
                const poId = typeof poAch.program_outcome === 'string' 
                    ? parseInt(poAch.program_outcome) 
                    : (typeof poAch.program_outcome === 'object' && poAch.program_outcome?.id)
                    ? (typeof poAch.program_outcome.id === 'string' ? parseInt(poAch.program_outcome.id) : poAch.program_outcome.id)
                    : poAch.program_outcome;
                
                const po = poId ? poMap.get(poId) : null;
                const code = poAch.po_code || po?.code || '';
                const title = poAch.po_title || po?.title || '';
                const target = poAch.target_percentage || po?.target_percentage || 0;

                allStrengths.push({
                    code,
                    title: title || code,
                    achievement: Number(achievement),
                    target: Number(target),
                    type: 'PO',
                    id: poId || 0
                });
            }
        });

        // Sort by achievement descending
        return allStrengths.sort((a, b) => b.achievement - a.achievement);
    }, [poAchievements, poMap]);

    // Top 5 strengths for display
    const topStrengths = useMemo(() => strengths.slice(0, 5), [strengths]);

    // Calculate average achievement
    const avgAchievement = useMemo(() => {
        if (strengths.length === 0) return 0;
        const sum = strengths.reduce((acc, s) => acc + s.achievement, 0);
        return Math.round(sum / strengths.length);
    }, [strengths]);

    // Chart data for top strengths - 3D illustration colors (ChartIllustration3D.tsx)
    const chartData = useMemo(() => {
        const top5 = strengths.slice(0, 5).sort((a, b) => b.achievement - a.achievement);
        
        // Colors from ChartIllustration3D.tsx
        // primary = isDark ? "#A5B4FC" : "#2563EB"
        // Each bar uses: new THREE.Color(primary).offsetHSL(i * 0.05, 0, 0)
        const primary = isDark ? "#A5B4FC" : "#2563EB";
        
        // Convert hex to RGB
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 37, g: 99, b: 235 };
        };
        
        // RGB to HSL
        const rgbToHsl = (r: number, g: number, b: number) => {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h = 0, s = 0, l = (max + min) / 2;
            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                    case g: h = ((b - r) / d + 2) / 6; break;
                    case b: h = ((r - g) / d + 4) / 6; break;
                }
            }
            return [h * 360, s, l];
        };
        
        // HSL to RGB
        const hslToRgb = (h: number, s: number, l: number) => {
            h /= 360;
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p: number, q: number, t: number) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        };
        
        const rgb = hexToRgb(primary);
        const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
        
        // Generate colors with HSL offset (i * 0.05 like in 3D illustration)
        const colors = top5.map((_, index) => {
            const offset = index * 0.05; // Same as ChartIllustration3D
            const newH = (h + offset * 360) % 360;
            const [r, g, b] = hslToRgb(newH, s, l);
            return {
                bg: `rgba(${r}, ${g}, ${b}, 0.8)`,
                border: `rgb(${r}, ${g}, ${b})`
            };
        });
        
        return {
            labels: top5.map(s => s.code || s.title.substring(0, 15)),
            datasets: [{
                label: 'Achievement (%)',
                data: top5.map(s => s.achievement),
                backgroundColor: colors.map(c => c.bg),
                borderColor: colors.map(c => c.border),
                borderWidth: 2,
                borderRadius: 6
            }]
        };
    }, [strengths, isDark]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false },
            tooltip: {
                bodyColor: isDark ? '#FFF' : '#000',
                titleColor: isDark ? '#FFF' : '#000',
                backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                ticks: { color: mutedText, stepSize: 20 }
            },
            x: {
                grid: { display: false },
                ticks: { color: mutedText }
            }
        }
    };

    if (!mounted) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-500" />
                    <p className={`${mutedText} text-lg`}>Loading strengths analysis...</p>
                </div>
            </div>
        );
    }

    if (error && strengths.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className={`text-center p-6 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                    <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
                    <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link 
                        href="/student"
                        className={`inline-flex items-center gap-2 ${mutedText} hover:text-indigo-500 transition-colors mb-2`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                        Strengths Analysis
                    </h1>
                    <p className={`${mutedText} mt-2`}>Your top performing Program Outcome (PO) areas</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl`}
                >
                    <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Top 5 Program Outcomes
                    </h2>
                    <div className="h-80">
                        {strengths.length > 0 ? (
                            <Bar data={chartData} options={chartOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className={mutedText}>No strength data available</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Top Strengths List */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl`}
                >
                    <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                        <Target className="w-5 h-5 text-indigo-500" />
                        Performance Details
                    </h2>
                    <div className="space-y-3">
                        {topStrengths.length > 0 ? (
                            topStrengths.map((strength, index) => {
                                const percentage = strength.achievement;
                                const isExcellent = percentage >= strength.target * 1.1;
                                const isAchieved = percentage >= strength.target;
                                
                                // Match chart colors (blue to purple gradient)
                                const chartColors = [
                                    'rgba(59, 130, 246, 0.9)',   // Deep blue
                                    'rgba(99, 102, 241, 0.9)',   // Indigo
                                    'rgba(139, 92, 246, 0.9)',   // Purple
                                    'rgba(168, 85, 247, 0.85)',  // Lighter purple
                                    'rgba(192, 132, 252, 0.8)',  // Lightest purple
                                ];
                                const barColor = chartColors[index] || chartColors[4];
                                
                                return (
                                    <motion.div
                                        key={`${strength.type}-${strength.id}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 + index * 0.1 }}
                                        className={`p-4 rounded-xl border ${
                                            isDark 
                                                ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        } transition-all`}
                                    >
                                        <div className="flex items-start gap-4 mb-2">
                                            <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${
                                                isDark 
                                                    ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30' 
                                                    : 'bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 border border-indigo-200'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {strength.code && (
                                                    <span className={`text-xs font-medium px-2 py-1 rounded mb-1.5 inline-block ${
                                                        isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                                    }`}>
                                                        {strength.code}
                                                    </span>
                                                )}
                                                <h3 className={`font-semibold ${whiteText} text-base leading-tight`}>
                                                    {strength.title}
                                                </h3>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className={`text-2xl font-bold ${
                                                    isExcellent ? 'text-green-500' : 
                                                    'text-indigo-500'
                                                }`}>
                                                    {Math.round(percentage)}%
                                                </p>
                                                <p className={`text-xs ${mutedText} mt-1`}>
                                                    Target: {Math.round(strength.target)}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`w-full rounded-full h-2.5 mt-3 ${
                                            isDark ? 'bg-white/10' : 'bg-gray-200'
                                        }`}>
                                            <div
                                                className="h-2.5 rounded-full transition-all"
                                                style={{ 
                                                    width: `${Math.min(percentage, 100)}%`,
                                                    backgroundColor: barColor
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="flex items-center justify-center py-8">
                                <p className={mutedText}>No strength data available</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* All Strengths Grid */}
            {strengths.length > 5 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl mt-6`}
                >
                    <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                        <Target className="w-5 h-5 text-indigo-500" />
                        All Program Outcomes
                    </h2>
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {strengths.slice(5).map((strength, index) => (
                            <motion.div
                                key={`${strength.type}-${strength.id}-${index}`}
                                variants={item}
                                className={`p-4 rounded-xl border ${
                                    isDark 
                                        ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                } transition-all`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    {strength.code && (
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                                            isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                            {strength.code}
                                        </span>
                                    )}
                                    <p className={`text-lg font-bold text-indigo-500`}>
                                        {Math.round(strength.achievement)}%
                                    </p>
                                </div>
                                <h3 className={`font-medium ${whiteText} text-sm mb-2`}>
                                    {strength.title.length > 40 ? strength.title.substring(0, 40) + '...' : strength.title}
                                </h3>
                                <p className={`text-xs ${mutedText}`}>
                                    Target: {Math.round(strength.target)}%
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
}

