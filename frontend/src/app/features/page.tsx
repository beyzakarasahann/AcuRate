// app/features/page.tsx
'use client';

import { motion } from 'framer-motion';
import { 
  GraduationCap, Users, Building2, BarChart3, Target, 
  Award, TrendingUp, FileText, Shield, Zap, 
  CheckCircle2, ArrowRight,
  PieChart, LineChart, BookOpen, Settings,
  Eye, Database, Search,
  Download, Upload, RefreshCw, Sparkles, Mail
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import Link from 'next/link';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

export default function FeaturesPage() {
  const [mounted, setMounted] = useState(false);
  const { isDark, mounted: themeMounted, themeClasses, text, mutedText, accentGradientClass } = useThemeColors();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !themeMounted) {
    return null;
  }

  const whiteText = text;
  const secondaryText = mutedText;
  const cardBg = themeClasses.card;
  const backgroundClass = themeClasses.background;

  const mainFeatures = [
    {
      icon: BarChart3,
      title: 'Comprehensive Analytics',
      description: 'Track student performance, course outcomes, and institutional metrics with powerful data visualization tools. Get insights that matter.',
      color: 'from-blue-500 to-cyan-500',
      features: ['Interactive dashboards', 'Performance reports', 'Trend analysis', 'Class comparisons']
    },
    {
      icon: Target,
      title: 'Program Outcomes Tracking',
      description: 'Monitor and measure student achievement against Program Outcomes (POs) for accreditation compliance and continuous improvement.',
      color: 'from-purple-500 to-pink-500',
      features: ['PO achievement metrics', 'Target tracking', 'Progress visualization', 'Achievement status']
    },
    {
      icon: Award,
      title: 'Performance Insights',
      description: 'Get detailed insights into student progress, class performance, and learning outcome achievements with comprehensive analytics.',
      color: 'from-orange-500 to-red-500',
      features: ['Student analytics', 'Class comparisons', 'Grade distributions', 'Achievement tracking']
    },
    {
      icon: TrendingUp,
      title: 'Automated Calculations',
      description: 'Automatic calculation of final grades, PO achievements, and performance metrics with instant updates.',
      color: 'from-green-500 to-emerald-500',
      features: ['Auto grade calculation', 'PO achievement calculation', 'GPA computation', 'Performance metrics']
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Enterprise-grade security with role-based access control and data privacy protection for sensitive academic information.',
      color: 'from-indigo-500 to-blue-500',
      features: ['Role-based access', 'JWT authentication', 'Privacy controls', 'Activity logging']
    },
    {
      icon: Zap,
      title: 'Efficient Management',
      description: 'Streamline grading, assessment tracking, and data management with powerful tools that save time.',
      color: 'from-yellow-500 to-orange-500',
      features: ['Grade management', 'Assessment tracking', 'Bulk operations', 'Data export']
    }
  ];

  const roleFeatures = [
    {
      role: 'Students',
      icon: GraduationCap,
      color: 'from-blue-500 to-cyan-500',
      features: [
        { icon: PieChart, title: 'Personal Dashboard', desc: 'Track your performance, courses, and PO achievements' },
        { icon: LineChart, title: 'Course Analytics', desc: 'Detailed insights into each course performance' },
        { icon: Target, title: 'PO Achievement', desc: 'Monitor your Program Outcome achievements' },
        { icon: Award, title: 'Grade Tracking', desc: 'View all your grades and assessment scores' },
        { icon: TrendingUp, title: 'Performance Trends', desc: 'See your GPA trends and academic progress' },
        { icon: Eye, title: 'Anonymous Ranking', desc: 'Compare your performance with percentile ranking' }
      ]
    },
    {
      role: 'Teachers',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      features: [
        { icon: BookOpen, title: 'Course Management', desc: 'Manage courses, assessments, and learning outcomes' },
        { icon: FileText, title: 'Grade Entry', desc: 'Efficient grade entry and management system' },
        { icon: BarChart3, title: 'Class Analytics', desc: 'Analyze class performance and identify trends' },
        { icon: Target, title: 'LO Tracking', desc: 'Define and track Learning Outcomes for courses' },
        { icon: Settings, title: 'Assessment Management', desc: 'Create and manage assessments with feedback ranges' },
        { icon: Download, title: 'Export Reports', desc: 'Export grades and data in CSV format' }
      ]
    },
    {
      role: 'Institutions',
      icon: Building2,
      color: 'from-indigo-500 to-purple-600',
      features: [
        { icon: Database, title: 'Institutional Analytics', desc: 'Comprehensive analytics across all departments' },
        { icon: Target, title: 'PO Management', desc: 'Manage and track Program Outcomes institution-wide' },
        { icon: BarChart3, title: 'Performance Reports', desc: 'View detailed performance reports and statistics' },
        { icon: Users, title: 'User Management', desc: 'Manage students, teachers, and departments' },
        { icon: Shield, title: 'Accreditation Support', desc: 'Track PO achievements for accreditation compliance' },
        { icon: TrendingUp, title: 'Department Analytics', desc: 'Analyze performance by department and curriculum' }
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: Search,
      title: 'Search & Filter',
      description: 'Search and filter capabilities to find courses, students, and data quickly',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: Download,
      title: 'Data Export',
      description: 'Export grades and data in CSV format for external analysis',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Upload,
      title: 'Bulk Import',
      description: 'Import students and grades in bulk using CSV files',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: RefreshCw,
      title: 'Auto Calculation',
      description: 'Automatic calculation of final grades and PO achievements',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      icon: FileText,
      title: 'Activity Logging',
      description: 'Track all system activities and changes with detailed logs',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Mail,
      title: 'Email Integration',
      description: 'SendGrid integration for automated email notifications and password resets',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  return (
    <div className={`min-h-screen ${backgroundClass} transition-colors duration-500`}>
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block mb-6"
            >
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${cardBg} border border-white/10 backdrop-blur-xl`}>
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className={`text-sm font-semibold ${whiteText}`}>Powerful Features</span>
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent"
            >
              Everything You Need
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-xl md:text-2xl ${secondaryText} max-w-3xl mx-auto leading-relaxed`}
            >
              Discover the comprehensive suite of features designed to transform how you track, analyze, and improve academic performance.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-4xl md:text-5xl font-bold ${whiteText} mb-4`}>
              Core Features
            </h2>
            <p className={`text-xl ${secondaryText} max-w-2xl mx-auto`}>
              Powerful tools designed to meet all your academic analytics needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`group relative ${cardBg} p-8 rounded-3xl backdrop-blur-xl border border-white/10 dark:border-white/5 hover:border-indigo-500/50 transition-all overflow-hidden`}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className={`text-2xl font-bold ${whiteText} mb-3`}>{feature.title}</h3>
                  <p className={`${secondaryText} mb-6 leading-relaxed`}>{feature.description}</p>
                  
                  {/* Feature list */}
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent flex-shrink-0`} />
                        <span className={`text-sm ${secondaryText}`}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Decorative corner */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-5 rounded-bl-full`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Specific Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-4xl md:text-5xl font-bold ${whiteText} mb-4`}>
              Tailored for Every Role
            </h2>
            <p className={`text-xl ${secondaryText} max-w-2xl mx-auto`}>
              Features designed specifically for students, teachers, and institutions
            </p>
          </motion.div>

          <div className="space-y-16">
            {roleFeatures.map((role, roleIndex) => (
              <motion.div
                key={role.role}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: roleIndex * 0.2 }}
                className={`${cardBg} p-12 rounded-3xl backdrop-blur-xl border border-white/10 dark:border-white/5`}
              >
                <div className="flex items-center gap-6 mb-10">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-xl`}>
                    <role.icon className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-3xl font-bold ${whiteText} mb-2`}>For {role.role}</h3>
                    <p className={secondaryText}>Comprehensive tools designed specifically for {role.role.toLowerCase()}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {role.features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: roleIndex * 0.1 + index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -4 }}
                      className={`p-6 rounded-2xl bg-gradient-to-br ${role.color} bg-opacity-10 border border-white/10 hover:border-indigo-500/50 transition-all group`}
                    >
                      <feature.icon className={`w-8 h-8 mb-4 bg-gradient-to-r ${role.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform`} />
                      <h4 className={`font-bold ${whiteText} mb-2`}>{feature.title}</h4>
                      <p className={`text-sm ${secondaryText}`}>{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-4xl md:text-5xl font-bold ${whiteText} mb-4`}>
              And So Much More
            </h2>
            <p className={`text-xl ${secondaryText} max-w-2xl mx-auto`}>
              Additional features that enhance your experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className={`${cardBg} p-6 rounded-2xl backdrop-blur-xl border border-white/10 dark:border-white/5 hover:border-indigo-500/50 transition-all group`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-lg font-bold ${whiteText} mb-2`}>{feature.title}</h3>
                <p className={`text-sm ${secondaryText}`}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${accentGradientClass} p-12 md:p-16 text-center`}
          >
            <div className="relative z-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"
              />
              
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 relative z-10">
                Ready to Experience These Features?
              </h2>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto relative z-10">
                Join institutions worldwide that trust AcuRate for their academic performance tracking.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <Link href="/contact">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white text-indigo-700 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white/10 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-colors border border-white/30"
                  >
                    Sign In
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

