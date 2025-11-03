// app/student/courses/page.tsx
'use client';

import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, CheckCircle2, XCircle, ChevronDown, FileText, ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
// YOL DÜZELTİLDİ: Next.js Alias (@) kullanımı önerilir
import { useThemeColors } from '@/hooks/useThemeColors'; 
import Link from 'next/link'; // Dinamik rota için eklendi

// --- MOCK VERİLER (Aynı kalır) ---
const coursesData = [
  {
    id: 'CS301',
    name: 'Advanced Data Structures',
    semester: 'Fall 2025',
    instructor: 'Dr. A. Schmidt',
    finalGrade: 'A-',
    currentGrade: 92.5,
    poAchievement: 88,
    status: 'Completed',
    credits: 4,
    feedback: 'Excellent grasp of complex algorithms.'
  },
  {
    id: 'SE405',
    name: 'Software Engineering Principles',
    semester: 'Spring 2025',
    instructor: 'Prof. L. Chen',
    finalGrade: 'B+',
    currentGrade: 84.0,
    poAchievement: 79,
    status: 'Completed',
    credits: 3,
    feedback: 'Strong on design patterns, needs improvement on testing.'
  },
  {
    id: 'DM201',
    name: 'Discrete Mathematics',
    semester: 'Fall 2024',
    instructor: 'Dr. M. Patel',
    finalGrade: 'A',
    currentGrade: 95.0,
    poAchievement: 95,
    status: 'Completed',
    credits: 3,
    feedback: 'Exceptional performance in all exams.'
  },
  {
    id: 'SWE501',
    name: 'Advanced Web Technologies',
    semester: 'Spring 2026', 
    instructor: 'Dr. S. Kılıç',
    finalGrade: '-',
    currentGrade: 88.0,
    poAchievement: 82,
    status: 'In Progress',
    credits: 4,
    feedback: 'Midterm grade: 90%'
  },
  {
    id: 'MGT401',
    name: 'Project Management',
    semester: 'Fall 2025',
    instructor: 'Dr. E. Yılmaz',
    finalGrade: '-',
    currentGrade: 71.0,
    poAchievement: 65,
    status: 'In Progress',
    credits: 3,
    feedback: 'Needs urgent attention to assignments.'
  },
];

// --- YARDIMCI FONKSİYONLAR ve Sabitler (Aynı kalır) ---

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const getGradeStatus = (grade: string | number) => {
    const gradeString = String(grade).toUpperCase();
    
    if (gradeString === '-') return { color: 'text-gray-500', icon: Clock };
    if (gradeString.startsWith('A') || parseFloat(gradeString) >= 90) return { color: 'text-green-500', icon: CheckCircle2 };
    if (gradeString.startsWith('B') || parseFloat(gradeString) >= 80) return { color: 'text-blue-500', icon: TrendingUp };
    if (gradeString.startsWith('C') || parseFloat(gradeString) >= 70) return { color: 'text-orange-500', icon: AlertTriangle };
    return { color: 'text-red-500', icon: XCircle };
};


// --- ANA BİLEŞEN: COURSES PAGE ---

export default function CoursesPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState('semester');
  const [sortOrder, setSortOrder] = useState('desc'); 

  useEffect(() => {
    setMounted(true);
  }, []);

  // HATA ÇÖZÜMÜ: whiteText yerine 'text' çekildi
  const { isDark, themeClasses, text, mutedText } = useThemeColors();

  if (!mounted) {
    return null; 
  }
  
  // 'whiteText' değişkeni yerine çekilen 'text' kullanılıyor.
  const whiteText = text;


  // Filtreleme, Sıralama Mantığı (Aynı kalır)
  const filteredCourses = coursesData.filter(course => {
    if (filter === 'all') return true;
    return course.status.toLowerCase().includes(filter);
  });

  const sortedCourses = filteredCourses.sort((a, b) => {
    let aValue: string | number, bValue: string | number;
    let comparison = 0;

    const standardizedKey = sortKey.toLowerCase().replace(/[\s\.]/g, '').replace('poach', 'poAchievement');

    switch (standardizedKey) {
        case 'currentgrade':
            aValue = a.currentGrade;
            bValue = b.currentGrade;
            comparison = (aValue as number) - (bValue as number);
            break;
        case 'poachievement':
            aValue = a.poAchievement;
            bValue = b.poAchievement;
            comparison = (aValue as number) - (bValue as number);
            break;
        case 'semester': 
        default:
            aValue = a.semester;
            bValue = b.semester;
            if (aValue < bValue) comparison = -1;
            else if (aValue > bValue) comparison = 1;
            break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (header: string) => {
    const key = header.toLowerCase().replace(/[\s\.]/g, '').replace('poach', 'poAchievement');
    
    if (sortKey === key) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortOrder('desc'); 
    }
  };

  const getSortIndicator = (header: string) => {
    const key = header.toLowerCase().replace(/[\s\.]/g, '').replace('poach', 'poAchievement');
    if (sortKey !== key) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };


  return (
    <div className={`container mx-auto py-0`}> 
      {/* Başlık ve Kontroller */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-6"
      >
        <h1 className={`text-3xl font-bold ${whiteText} flex items-center gap-3`}>
          <BookOpen className="w-7 h-7 text-indigo-500" />
          My Courses & Grades
        </h1>
        <div className="flex gap-4 items-center">
            {/* Filtreleme Dropdown */}
            <div className="relative">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className={`appearance-none ${themeClasses.card.replace('shadow-2xl', '').replace('rounded-2xl', 'rounded-xl')} ${whiteText} border ${isDark ? 'border-white/10' : 'border-gray-300'} py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none`}
                >
                    <option value="all">All Statuses</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedText} pointer-events-none`} />
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-xl text-white flex items-center gap-2 transition-all bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/30`}
            >
                <FileText className="w-4 h-4" />
                View Transcript
            </motion.button>
        </div>
      </motion.div>

      {/* Dersler Tablosu */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className={`overflow-hidden ${themeClasses.card} rounded-xl shadow-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <table className="min-w-full divide-y divide-gray-700/20">
          <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
            <tr>
              {/* Dinamik sıralama başlıkları */}
              {['Course', 'Semester', 'Instructor', 'Final Grade', 'Current Grade', 'PO Ach.', 'Status'].map(header => (
                <th
                  key={header}
                  onClick={() => handleSort(header)}
                  className={`px-6 py-3 text-left text-xs font-medium ${mutedText} uppercase tracking-wider cursor-pointer transition-colors hover:text-indigo-400`}
                >
                  {header} {getSortIndicator(header)}
                </th>
              ))}
              <th className={`px-6 py-3 text-right text-xs font-medium ${mutedText} uppercase tracking-wider`}>Feedback</th>
            </tr>
          </thead>
          <motion.tbody
            className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-200'}`}
          >
            {sortedCourses.map((course, index) => {
              const { color: gradeColor, icon: GradeIcon } = getGradeStatus(course.finalGrade !== '-' ? course.finalGrade : course.currentGrade);
              const poBarColor = course.poAchievement >= 85 ? 'bg-green-500' : course.poAchievement >= 75 ? 'bg-blue-500' : 'bg-orange-500';

              return (
                <motion.tr
                  key={course.id}
                  variants={item}
                  whileHover={{ scale: 1.01, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
                  className="transition-all duration-150"
                >
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${whiteText}`}>
                    {course.name} <span className={mutedText}>({course.id})</span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${mutedText}`}>{course.semester}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${mutedText}`}>{course.instructor}</td>
                  
                  {/* Final Grade */}
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${whiteText}`}>
                    <span className="flex items-center gap-2">
                        <GradeIcon className={`w-4 h-4 ${gradeColor}`} />
                        {course.finalGrade !== '-' ? course.finalGrade : `${Math.round(course.currentGrade)}%`}
                    </span>
                  </td>
                  
                  {/* Current Grade */}
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${whiteText}`}>
                    {course.currentGrade}%
                  </td>
                  
                  {/* PO Achievement Barı */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                        <span className={`w-12 text-xs font-semibold ${whiteText}`}>{course.poAchievement}%</span>
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'} ml-3`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${course.poAchievement}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className={`h-full rounded-full ${poBarColor}`}
                            />
                        </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        course.status === 'Completed' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                        course.status === 'In Progress' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                        'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' 
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  
                  {/* Details Button/Feedback */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                        // Yönlendirme: /student/courses/[courseId]
                        href={`/student/courses/${course.id}`} 
                        passHref
                        className="inline-flex items-center"
                    >
                        <motion.button 
                            whileHover={{ x: 3 }}
                            className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 justify-end"
                            title={course.feedback} 
                        >
                            View Feedback <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </Link>
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
        
        {/* Sayfa Alt Bilgisi */}
        {filteredCourses.length === 0 && (
            <div className={`p-6 text-center ${mutedText}`}>
                No courses found matching the filter criteria.
            </div>
        )}
      </motion.div>
    </div>
  );
}