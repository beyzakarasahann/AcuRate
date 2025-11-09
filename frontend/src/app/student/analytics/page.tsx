// app/student/analytics/page.tsx
'use client';

import { motion } from 'framer-motion';
import { BarChart, TrendingUp, DollarSign, Clock, CheckCircle2, UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors'; 
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend, 
    PointElement, 
    LineElement,
    Filler // Alan doldurma için
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Chart.js'i gerekli elemanlarla kaydetme
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement, 
  LineElement,
  Filler
);


// --- MOCK VERİLER (Analitik Sayfasına Özel) ---

const studentAnalyticsData = {
    gpaHistory: [
        { semester: 'F23', gpa: 3.20 },
        { semester: 'S24', gpa: 3.45 },
        { semester: 'F24', gpa: 3.60 },
        { semester: 'S25', gpa: 3.70 },
        { semester: 'F25', gpa: 3.74 },
    ],
    categorySuccess: [
        { category: 'Core CS', averageGrade: 3.85 },
        { category: 'Math/Science', averageGrade: 3.60 },
        { category: 'Electives', averageGrade: 3.95 },
        { category: 'Humanities', averageGrade: 3.50 },
    ],
    projections: {
        currentCGPA: 3.74,
        projectedFinalCGPA: 3.82, // Mevcut trend devam ederse
        graduationDate: 'May 2027',
        requiredCredits: 128,
        remainingCredits: 33,
    }
};

// --- YARDIMCI FONKSİYONLAR ve Sabitler ---

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

// ------------------------------------
// Grafik Verisi Hazırlama
// ------------------------------------

// 1. GPA Trend Grafiği (Line Chart)
// HATA GİDERİLDİ: context parametresine 'any' türü atandı
const getGpaTrendData = (gpaHistory: typeof studentAnalyticsData.gpaHistory, isDark: boolean) => {
    const projectedGpa = studentAnalyticsData.projections.projectedFinalCGPA;
    const labels = [...gpaHistory.map(h => h.semester), 'Projected'];
    const data = [...gpaHistory.map(h => h.gpa), projectedGpa];

    return {
        labels: labels,
        datasets: [
            {
                label: 'Semester GPA & Projection',
                data: data,
                fill: 'start',
                backgroundColor: (context: any) => { // Düzeltme burada
                    const isProjected = context.dataIndex === data.length - 1;
                    const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
                    if (isProjected) {
                         gradient.addColorStop(0, 'rgba(255, 165, 0, 0.5)'); 
                         gradient.addColorStop(1, 'rgba(255, 165, 0, 0.1)');
                    } else {
                         gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)'); 
                         gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
                    }
                    return gradient;
                },
                borderColor: isDark ? 'rgb(16, 185, 129)' : 'rgb(16, 185, 129)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: (context: any) => context.dataIndex === data.length - 1 ? 'rgb(255, 165, 0)' : 'rgb(16, 185, 129)', // Düzeltme burada
                pointRadius: 6,
                pointHoverRadius: 8,
            }
        ]
    };
};

// 2. Kategori Başarı Grafiği (Bar Chart)
const getCategorySuccessData = (categorySuccess: typeof studentAnalyticsData.categorySuccess, isDark: boolean) => {
    return {
        labels: categorySuccess.map(c => c.category),
        datasets: [{
            label: 'Average GPA',
            data: categorySuccess.map(c => c.averageGrade),
            backgroundColor: isDark ? '#6366F1' : '#4F46E5', 
            borderColor: isDark ? '#4F46E5' : '#4338CA',
            borderWidth: 1
        }]
    };
};


// ------------------------------------
// Chart Opsiyonları (Aynı kalır)
// ------------------------------------

const commonChartOptions = (isDark: boolean, mutedText: string) => ({
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
            grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: mutedText }
        }
    }
});

const barChartOptions = (isDark: boolean, mutedText: string) => ({
    ...commonChartOptions(isDark, mutedText),
    scales: {
        y: { ...commonChartOptions(isDark, mutedText).scales.y, max: 4.0 },
        x: { ...commonChartOptions(isDark, mutedText).scales.x },
    }
});


// --- ANA BİLEŞEN: ANALYTICS PAGE ---

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);

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

  const dynamicLineOptions = commonChartOptions(isDark, mutedText);
  const dynamicBarOptions = barChartOptions(isDark, mutedText);
  const gpaTrendChartData = getGpaTrendData(studentAnalyticsData.gpaHistory, isDark);
  const categorySuccessChartData = getCategorySuccessData(studentAnalyticsData.categorySuccess, isDark);
  const isProjectedExcellent = studentAnalyticsData.projections.projectedFinalCGPA >= 3.75;


  return (
    <div className={`container mx-auto py-0`}>
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center mb-6 border-b pb-4 border-gray-500/20"
      >
        <h1 className={`text-3xl font-bold ${whiteText} flex items-center gap-3`}>
          <BarChart className="w-7 h-7 text-indigo-500" />
          Detailed Performance Analytics
        </h1>
      </motion.div>

      {/* Genel Projeksiyon Kartları */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {/* Mevcut CGPA */}
        <motion.div variants={item} className={`${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} text-center`}>
            <p className={mutedText}>Current CGPA</p>
            <p className={`text-4xl font-extrabold ${whiteText} mt-2`}>{studentAnalyticsData.projections.currentCGPA}</p>
        </motion.div>
        
        {/* Tahmini Final CGPA */}
        <motion.div variants={item} className={`p-6 shadow-2xl rounded-xl border ${themeClasses.card} ${isProjectedExcellent ? 'border-green-500/30' : 'border-orange-500/30'} text-center`}>
            <p className={`${isProjectedExcellent ? 'text-green-500' : 'text-orange-500'} font-medium`}>Projected Final CGPA</p>
            <p className={`text-4xl font-extrabold ${whiteText} mt-2 flex justify-center items-center gap-2`}>
                <UserCheck className="w-6 h-6" /> {studentAnalyticsData.projections.projectedFinalCGPA}
            </p>
        </motion.div>

        {/* Mezuniyet Tarihi */}
        <motion.div variants={item} className={`${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} text-center`}>
            <p className={mutedText}>Estimated Graduation</p>
            <p className={`text-xl font-bold ${whiteText} mt-2 flex justify-center items-center gap-2`}>
                <Clock className="w-5 h-5 text-blue-500" /> {studentAnalyticsData.projections.graduationDate}
            </p>
        </motion.div>
        
        {/* Kalan Krediler */}
        <motion.div variants={item} className={`${themeClasses.card} p-6 shadow-2xl rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} text-center`}>
            <p className={mutedText}>Remaining Credits</p>
            <p className={`text-4xl font-extrabold ${whiteText} mt-2`}>
                {studentAnalyticsData.projections.remainingCredits} / {studentAnalyticsData.projections.requiredCredits}
            </p>
        </motion.div>
      </motion.div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sol Sütun: GPA Trend ve Projeksiyon */}
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`lg:col-span-2 backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-[450px] rounded-xl`}
        >
            <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                <TrendingUp className={`w-5 h-5 text-green-500`} />
                Historical GPA Trend & Future Projection
            </h2>
            <div className="h-[350px]">
                <Line data={gpaTrendChartData} options={dynamicLineOptions} />
            </div>
        </motion.div>

        {/* Sağ Sütun: Kategori Başarısı */}
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl h-[450px] rounded-xl`}
        >
            <h2 className={`text-xl font-bold ${whiteText} mb-4 flex items-center gap-2`}>
                <DollarSign className={`w-5 h-5 text-yellow-500`} />
                Average Performance by Course Category
            </h2>
            <div className="h-[350px]">
                <Bar data={categorySuccessChartData} options={dynamicBarOptions} />
            </div>
        </motion.div>
      </div>

       {/* Analiz Yorumları */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`mt-6 p-6 rounded-xl border-l-4 border-indigo-500 ${isDark ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-indigo-500/5'}`}
        >
            <h3 className={`font-semibold text-indigo-400 mb-2 flex items-center gap-2`}>
                <CheckCircle2 className='w-5 h-5' /> Key Analytical Insights
            </h3>
            <ul className={`${mutedText} list-disc ml-5 text-sm space-y-1`}>
                <li>**Trend:** GPA, son 5 dönemde sürekli artış gösteriyor. Bu ivme devam ederse, mezuniyet notunuz yüksek lisans başvuruları için kritik eşiği (3.80) aşabilir.</li>
                <li>**Kategori Dengesi:** Seçmeli dersler ve Temel Bilgisayar Bilimleri derslerinizde ortalamanız yüksek. Matematik/Fen bilimleri kategorisi, genel ortalamanızı düşüren tek alan.</li>
                <li>**Öneri:** Önümüzdeki dönemlerde, Matematik/Fen bilimleri alanındaki zorunlu derslere daha fazla odaklanmak, tahmini final ortalamanızı daha da yükseltecektir.</li>
            </ul>
        </motion.div>
    </div>
  );
}