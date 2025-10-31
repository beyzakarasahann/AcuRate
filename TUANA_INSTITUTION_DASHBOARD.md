# 🎯 Tuana - Institution Dashboard Özellikleri

**Dosya**: `frontend/src/app/institution/page.tsx`
**Branch**: dev/tuana
**Status**: ✅ Temel yapı hazır (by Alperen)
**Next Steps**: Analytics ve Reports sayfaları

---

## 📋 Mevcut Özellikler

### 1. Header Section
**Konum**: En üst
**Özellikler**:
- Sticky navbar effect (backdrop-blur-xl)
- Animated Building2 icon
  - Gradient background (indigo to purple)
  - Hover animation (scale 1.1, rotate 5°)
- Başlık: "Institution Dashboard"
  - Gradient text (blue → indigo → purple)
- Alt başlık: "Academic Performance Overview"
- İki buton:
  - **Filter**: Filtreleme için (henüz işlevsel değil)
  - **Export Report**: Rapor export için (henüz işlevsel değil)

**Tasarım**:
```tsx
<div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl">
  // Header content
</div>
```

---

### 2. Stats Overview (4 Cards)
**Konum**: Header'ın altında, grid layout
**Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

#### Card 1: Total Students
- Value: 1,250
- Change: +12% (yeşil ↑)
- Icon: Users
- Gradient: blue to cyan

#### Card 2: Faculty Members
- Value: 85
- Change: +5% (yeşil ↑)
- Icon: Users
- Gradient: purple to pink

#### Card 3: Active Courses
- Value: 156
- Change: +8% (yeşil ↑)
- Icon: BookOpen
- Gradient: orange to red

#### Card 4: Avg Performance
- Value: 76.5%
- Change: +2.3% (yeşil ↑)
- Icon: TrendingUp
- Gradient: green to emerald

**Animasyonlar**:
- Staggered entrance (container variants)
- Hover: scale 1.05, y: -5px
- Smooth transitions

**Veri Yapısı**:
```typescript
const stats = [
  {
    title: 'Total Students',
    value: '1,250',
    change: '+12%',
    trend: 'up',
    icon: Users,
    color: 'from-blue-500 to-cyan-500'
  },
  // ...
];
```

---

### 3. Department Performance Section
**Konum**: Sol taraf (2/3 genişlik)
**Departments**: 4 department card

#### Computer Science
- Status: 🏆 Excellent (yeşil badge)
- Students: 450
- Courses: 45
- Faculty: 28
- Avg Grade: 78.5% (mavi progress bar)
- PO Achievement: 82% (yeşil progress bar)

#### Electrical Engineering
- Status: ✓ Good (mavi badge)
- Students: 380
- Courses: 38
- Faculty: 24
- Avg Grade: 75.2%
- PO Achievement: 76%

#### Mechanical Engineering
- Status: ✓ Good (mavi badge)
- Students: 320
- Courses: 35
- Faculty: 20
- Avg Grade: 73.8%
- PO Achievement: 74%

#### Civil Engineering
- Status: ⚠ Needs Attention (turuncu badge)
- Students: 280
- Courses: 32
- Faculty: 18
- Avg Grade: 71.5%
- PO Achievement: 68%

**Her Card Özellikleri**:
- Glassmorphism effect
- Hover animation (scale 1.02)
- 2 progress bar (Avg Grade, PO Achievement)
- Progress bar animasyonu (0 → actual value)
- Color coding (grade ve achievement'a göre)

---

### 4. Program Outcomes Overview
**Konum**: Department Performance'ın altında
**POs**: 5 Program Outcome

#### PO Listesi:
1. **PO1: Engineering Knowledge**
   - Current: 78.5%
   - Target: 70%
   - Status: ✓ Achieved (mavi)

2. **PO2: Problem Analysis**
   - Current: 82.3%
   - Target: 75%
   - Status: 🏆 Excellent (yeşil)

3. **PO3: Design/Development**
   - Current: 75.8%
   - Target: 70%
   - Status: ✓ Achieved (mavi)

4. **PO4: Investigation**
   - Current: 73.2%
   - Target: 70%
   - Status: ✓ Achieved (mavi)

5. **PO5: Modern Tool Usage**
   - Current: 68.5%
   - Target: 65%
   - Status: ✓ Achieved (mavi)

**Her PO Card**:
- PO code (indigo text)
- PO title
- Current percentage (renkli)
- Progress bar (animated)
- Target percentage
- Status icon (Trophy veya CheckCircle2)

---

### 5. Sidebar (Sağ Taraf)
**Konum**: Sağ taraf (1/3 genişlik)

#### 5.1. Recent Alerts
**Alerts**: 3 alert card

1. **Warning Alert** (turuncu)
   - Title: "Civil Engineering - PO2 Below Target"
   - Description: "Average achievement: 62% (Target: 75%)"
   - Time: "2 hours ago"

2. **Info Alert** (mavi)
   - Title: "Accreditation Review Scheduled"
   - Description: "ABET review scheduled for December 2024"
   - Time: "1 day ago"

3. **Success Alert** (yeşil)
   - Title: "CS Department Exceeds All Targets"
   - Description: "All POs above target for Fall 2024"
   - Time: "2 days ago"

#### 5.2. Quick Actions
**Buttons**: 3 action button
- Generate Report
- Schedule Meeting
- View Analytics

**Stil**: Glassmorphism, hover effects

#### 5.3. Accreditation Status Widget
**Background**: Yeşil gradient
**Items**:
- PO Achievement: ✓ 95%
- Documentation: ✓ Complete
- Student Feedback: ✓ 4.2/5.0

**Stil**: Green/emerald gradient

---

## 🎨 Tasarım Sistemi

### Renkler
**Primary**: Blue/Indigo
- `from-blue-400` to `to-indigo-400`
- `from-blue-500` to `to-cyan-500`

**Status Colors**:
- Excellent: Green (`#10b981`)
- Good: Blue (`#3b82f6`)
- Needs Attention: Orange (`#f59e0b`)
- Warning: Red (`#ef4444`)

### Glassmorphism
```css
backdrop-blur-xl
bg-white/5 (veya /10)
border border-white/10
```

### Shadows
```css
shadow-2xl
shadow-indigo-500/20 (renkli shadow)
```

### Border Radius
```css
rounded-xl (12px)
rounded-2xl (16px)
rounded-3xl (24px)
```

---

## 🎬 Animasyonlar

### Background Orbs (3 adet)
```typescript
<motion.div
  className="absolute ... bg-blue-500/20 blur-3xl"
  animate={{
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.5, 0.3],
  }}
  transition={{
    duration: 8,
    repeat: Infinity,
    ease: "easeInOut"
  }}
/>
```

### Entrance Animations
**Container (Staggered)**:
```typescript
variants={container}
// staggerChildren: 0.1
```

**Item**:
```typescript
variants={item}
// opacity: 0 → 1
// y: 20 → 0
```

### Hover Effects
```typescript
whileHover={{ scale: 1.05, y: -5 }}
```

### Progress Bars
```typescript
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 1, delay: 0.5 }}
/>
```

---

## 📊 Veri Yapıları

### Stats
```typescript
interface Stat {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  color: string; // Tailwind gradient classes
}
```

### Department
```typescript
interface Department {
  name: string;
  students: number;
  avgGrade: number;
  poAchievement: number;
  status: 'excellent' | 'good' | 'needs-attention';
  courses: number;
  faculty: number;
}
```

### Program Outcome
```typescript
interface ProgramOutcome {
  code: string; // PO1, PO2, ...
  title: string;
  current: number; // 0-100
  target: number; // 0-100
  status: 'achieved' | 'excellent';
}
```

### Alert
```typescript
interface Alert {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  time: string; // relative time
}
```

---

## 🔄 API Integration Planı

### Endpoint'ler (Bilgisu tarafından)

```typescript
// Stats
GET /api/analytics/stats/
// Response:
{
  total_students: 1250,
  faculty_members: 85,
  active_courses: 156,
  avg_performance: 76.5,
  changes: {
    students: 12,
    faculty: 5,
    courses: 8,
    performance: 2.3
  }
}

// Departments
GET /api/analytics/departments/
// Response:
{
  departments: [
    {
      name: "Computer Science",
      students: 450,
      avg_grade: 78.5,
      po_achievement: 82,
      status: "excellent",
      courses: 45,
      faculty: 28
    },
    // ...
  ]
}

// Program Outcomes
GET /api/program-outcomes/
// Response:
{
  program_outcomes: [
    {
      code: "PO1",
      title: "Engineering Knowledge",
      current_percentage: 78.5,
      target_percentage: 70,
      status: "achieved"
    },
    // ...
  ]
}

// Alerts
GET /api/alerts/recent/
// Response:
{
  alerts: [
    {
      type: "warning",
      title: "...",
      description: "...",
      created_at: "2024-10-31T10:00:00Z"
    },
    // ...
  ]
}
```

### Fetch Pattern
```typescript
const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  async function fetchData() {
    try {
      const response = await fetch('/api/analytics/stats/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);

// Loading state
if (loading) return <Loading />;

// Error state
if (error) return <Error message={error} />;

// Success
return <Dashboard data={stats} />;
```

---

## 🚀 Next Steps (Tuana için)

### 1. Analytics Sayfası
**Dosya**: `frontend/src/app/institution/analytics/page.tsx`

**Özellikler**:
- Department comparison charts
- PO trend over time (line chart)
- Student performance distribution (histogram)
- Course success rates (bar chart)
- Interactive filters (department, semester, year)
- Export chart as image

**Tools**:
- Recharts library
- Chart.js
- D3.js (optional)

### 2. Reports Sayfası
**Dosya**: `frontend/src/app/institution/reports/page.tsx`

**Özellikler**:
- Report templates (Accreditation, Performance, Department)
- Custom report builder
- Date range selection
- Department/PO filters
- Export options (PDF, Excel, CSV)
- Print view
- Email report

### 3. Settings Sayfası (Optional)
**Dosya**: `frontend/src/app/institution/settings/page.tsx`

**Özellikler**:
- PO target percentage settings
- Department management
- Semester configuration
- Notification preferences

### 4. Chart Components
**Dosya**: `frontend/src/components/charts/`

**Components**:
- `DepartmentComparisonChart.tsx`
- `POTrendChart.tsx`
- `PerformanceDistributionChart.tsx`
- `CourseSuccessChart.tsx`

### 5. API Integration
- Replace all mock data
- Implement loading states
- Error handling
- Retry logic
- Real-time updates (optional, with websockets)

---

## 📦 Gerekli Paketler

```json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "date-fns": "^2.30.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1"
  }
}
```

**Install**:
```bash
npm install recharts date-fns html2canvas jspdf
```

---

## 💡 İpuçları

1. **Mock Data**: API hazır olana kadar mock data kullanmaya devam et
2. **Loading States**: Her data fetch için loading spinner ekle
3. **Error Handling**: User-friendly error messages göster
4. **Responsive**: Mobile ve tablet için test et
5. **Performance**: Büyük veri setleri için pagination/virtual scrolling kullan
6. **Accessibility**: ARIA labels ekle, keyboard navigation sağla
7. **Dark Mode**: Tüm renkler dark mode'da da iyi görünmeli

---

## 🎯 Öncelikler

### Yüksek Öncelik
1. ✅ Institution Dashboard (tamamlandı)
2. ⏳ API Integration (mock → real data)
3. ⏳ Analytics sayfası

### Orta Öncelik
4. ⏳ Reports sayfası
5. ⏳ Chart components

### Düşük Öncelik
6. ⏳ Settings sayfası
7. ⏳ Real-time updates

---

## 📞 İletişim

**Sorular**:
- Backend/API: Bilgisu
- Design: Alperen
- Charts: Tuana (kendin araştır, deneyim kazan!)

**Resources**:
- Recharts Docs: https://recharts.org/
- Framer Motion: https://www.framer.com/motion/
- Tailwind CSS: https://tailwindcss.com/

---

**Prepared for**: Tuana
**By**: Alperen
**Date**: 31 Ekim 2024
**Status**: 📝 Ready to Start

