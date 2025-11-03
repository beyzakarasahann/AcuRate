// app/student/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Award, BookOpen, CheckSquare, Trophy, ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
// useThemeColors kancanızın doğru yolu burada olmalıdır:
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    ArcElement, 
    Tooltip, 
    Legend, 
    RadialLinearScale, 
    PointElement, 
    LineElement,
} from 'chart.js';
import { Bar, Radar, Line } from 'react-chartjs-2';

// Chart.js'i gerekli elemanlarla kaydetme
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale, 
  PointElement, 
  LineElement
);


// --- MOCK VERİLER ---

const studentInfo = {
  name: 'Elara Vesper',
  studentId: '202201042',
  major: 'Computer Science',
  gpa: 3.74,
  credits: 95,
  status: 'High Performer'
};

const performanceStats = [
  { title: 'Current GPA', value: '3.74', change: '+0.1', trend: 'up', icon: Trophy, color: 'from-green-500 to-emerald-500' },
  { title: 'Credits Earned', value: '95', change: '+15', trend: 'up', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
  { title: 'Courses in Progress', value: '5', change: '0', trend: 'stable', icon: CheckSquare, color: 'from-orange-500 to-red-500' },
  { title: 'Total PO Achievement', value: '88%', change: '+3%', trend: 'up', icon: Award, color: 'from-purple-500 to-pink-500' }
];

const currentCourses = [
    { code: 'CS301', name: 'Data Structures', grade: 'A-', credits: 4, po_achieved: 92 },
    { code: 'SE405', name: 'Software Engineering', grade: 'B+', credits: 3, po_achieved: 85 },
    { code: 'DM201', name: 'Discrete Mathematics', grade: 'A', credits: 3, po_achieved: 95 },
    { code: 'PHY101', name: 'Physics I', grade: 'B', credits: 4, po_achieved: 78 },
];

const poRadarData = {
    labels: ['PO1: Critical Thinking', 'PO2: Research Skills', 'PO3: Team Collaboration', 'PO4: Investigation', 'PO5: Tool Usage'],
    datasets: [
      {
        label: 'My Achievement (%)',
        data: [90, 88, 85, 92, 80],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgb(99, 102, 241)',
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(99, 102, 241)'
      },
    ]
};

const gpaTrendData = {
    labels: ['F23', 'S24', 'F24', 'S25', 'F25 (Current)'],
    datasets: [
        {
            label: 'Semester GPA',
            data: [3.20, 3.45, 3.60, 3.70, 3.74],
            fill: false,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            tension: 0.4
        }
    ]
};


// --- YARDIMCI FONKSİYONLAR VE SABİTLER ---

const getGradientColors = (colorClass: string) => {
    switch (colorClass) {
        case 'from-green-500 to-emerald-500': return { start: '#10B981', end: '#059669' };
        case 'from-blue-500 to-cyan-500': return { start: '#3B82F6', end: '#06B6D4' };
        case 'from-orange-500 to-red-500': return { start: '#F97316', end: '#EF4444' };
        case 'from-purple-500 to-pink-500': return { start: '#A855F7', end: '#EC4899' };
        default: return { start: '#6366F1', end: '#9333EA' };
    }
};

const lineOptions = (isDark: boolean, mutedText: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: mutedText, boxWidth: 10, boxHeight: 10 } },
        tooltip: {
            bodyColor: isDark ? '#FFF' : '#000',
            titleColor: isDark ? '#FFF' : '#000',
            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        }
    },
    scales: {
        y: {
            beginAtZero: false,
            min: 3.0,
            max: 4.0,
            title: { display: true, text: 'GPA', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText, stepSize: 0.25 }
        },
        x: {
            title: { display: true, text: 'Semester', color: mutedText },
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText }
        }
    }
});

const radarOptions = (isDark: boolean, accentStart: string, mutedText: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' },
        pointLabels: { color: mutedText, font: { size: 12 } },
        suggestedMin: 50,
        suggestedMax: 100,
        ticks: { backdropColor: 'transparent', color: mutedText, showLabelBackdrop: false }
      }
    },
    plugins: {
      legend: { labels: { color: mutedText, boxWidth: 10, boxHeight: 10 } },
      tooltip: { bodyColor: isDark ? '#FFF' : '#000', titleColor: isDark ? '#FFF' : '#000', backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)', }
    }
});

const barOptions = (isDark: boolean, mutedText: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
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
});


const courseGradesData = {
    labels: currentCourses.map(c => c.code),
    datasets: [{
        label: 'PO Achievement (%)',
        data: currentCourses.map(c => c.po_achieved),
        backgroundColor: currentCourses.map(c => c.po_achieved >= 90 ? '#10B981' : c.po_achieved >= 80 ? '#3B82F6' : '#F97316'),
        borderColor: currentCourses.map(c => c.po_achieved >= 90 ? '#059669' : c.po_achieved >= 80 ? '#06B6D4' : '#EF4444'),
        borderWidth: 1
    }]
};


// --- ANA DASHBOARD BİLEŞENİ ---
export default function StudentHomePage() {
  const [mounted, setMounted] = useState(false); 
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const { 
    isDark, 
    mounted: themeMounted, 
    accentStart, 
    accentEnd, 
    themeClasses, 
    mutedText, 
    text // 👈 DÜZELTME 1: whiteText yerine 'text' kullanıldı
  } = useThemeColors();

  if (!mounted || !themeMounted) {
    return null;
  }
  
  const whiteTextClass = text; // 👈 DÜZELTME 2: 'text' değişkeni 'whiteTextClass' olarak tanımlandı
  const accentIconClass = isDark ? 'text-indigo-400' : 'text-indigo-600';
  const secondaryTextClass = mutedText;

  const dynamicRadarOptions = radarOptions(isDark, accentStart, secondaryTextClass);
  const dynamicBarOptions = barOptions(isDark, secondaryTextClass);
  const dynamicLineOptions = lineOptions(isDark, secondaryTextClass);


  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Header (Minimal, Layout'taki büyük başlık yerine) */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-4 mb-8"
        >
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Welcome back, {studentInfo.name.split(' ')[0]}
            </h1>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
        >
            {performanceStats.map((stat, index) => {
                const { start, end } = getGradientColors(stat.color); 
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl hover:shadow-indigo-500/20 transition-all`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div
                                style={{ backgroundImage: `linear-gradient(to bottom right, ${start}, ${end})` }}
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg`}
                            >
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-500' : stat.trend === 'down' ? 'text-red-500' : 'text-yellow-500'}`}>
                                {stat.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                                {stat.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                                {stat.trend === 'stable' && <span className="text-gray-500">-</span>}
                                {stat.change !== '0' && stat.change}
                            </div>
                        </div>
                        <h3 className={`${secondaryTextClass} text-sm mb-1`}>{stat.title}</h3>
                        <p className={`text-3xl font-bold ${whiteTextClass}`}>{stat.value}</p>
                    </motion.div>
                );
            })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sol Sütun (Trend ve Radar) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* GPA Trend Line Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-96`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <TrendingUp className={`w-5 h-5 text-green-500`} />
                        Academic Performance Trend (GPA)
                    </h2>
                    <div className="h-72">
                        <Line data={gpaTrendData} options={dynamicLineOptions} />
                    </div>
                </motion.div>

                {/* Program Outcomes Radar Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-96`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <Award className={`w-5 h-5 ${accentIconClass}`} />
                        Program Outcomes Achievement
                    </h2>
                    <div className="h-72">
                        <Radar data={poRadarData} options={dynamicRadarOptions} />
                    </div>
                </motion.div>
            </div>

            {/* Sağ Sütun (Course Bar Chart ve Alerts) */}
            <div className="space-y-6">

                 {/* Current Course Grades Bar Chart */}
                 <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-96`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <BookOpen className={`w-5 h-5 ${accentIconClass}`} />
                        Current Courses PO Performance
                    </h2>
                    <div className="h-72">
                        <Bar data={courseGradesData} options={dynamicBarOptions} />
                    </div>
                </motion.div>
                
                {/* Notifications/Alerts */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl`}
                >
                    <h2 className={`text-xl font-bold ${whiteTextClass} mb-4 flex items-center gap-2`}>
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Notifications
                    </h2>
                    <div className="space-y-2">
                        <p className={`${secondaryTextClass} text-sm p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300`}>
                            **SE405** PO Achievement is slightly below target. Check instructor feedback.
                        </p>
                        <p className={`${secondaryTextClass} text-sm p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300`}>
                            New course material added for **CS301**.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    </motion.div>
  );
}