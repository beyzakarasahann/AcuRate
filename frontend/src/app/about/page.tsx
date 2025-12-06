// app/about/page.tsx
'use client';

import { motion } from 'framer-motion';
import { 
  GraduationCap, Users, Building2, BarChart3, Target, 
  Award, TrendingUp, FileText, Shield, Zap, 
  CheckCircle2, ArrowRight, Star, Globe, Lock,
  PieChart, LineChart, BookOpen, Settings, Rocket
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import Link from 'next/link';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

export default function AboutPage() {
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

  const features = [
    {
      icon: BarChart3,
      title: 'Comprehensive Analytics',
      description: 'Track student performance, course outcomes, and institutional metrics with powerful data visualization tools.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Target,
      title: 'Program Outcomes Tracking',
      description: 'Monitor and measure student achievement against Program Outcomes (POs) for accreditation compliance.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Award,
      title: 'Performance Insights',
      description: 'Get detailed insights into student progress, class performance, and learning outcome achievements.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Monitoring',
      description: 'Track academic performance in real-time with automated calculations and instant updates.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Enterprise-grade security with role-based access control and data privacy protection.',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: Zap,
      title: 'Automated Workflows',
      description: 'Streamline grading, assessment tracking, and report generation with intelligent automation.',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  const roles = [
    {
      icon: GraduationCap,
      title: 'For Students',
      description: 'Track your academic progress, view detailed analytics, and monitor your achievement of Program Outcomes.',
      features: [
        'Personal dashboard with performance metrics',
        'Course analytics and grade tracking',
        'PO achievement monitoring',
        'Anonymous class ranking',
        'Grade trends and insights'
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'For Teachers',
      description: 'Manage courses, grade students, and track learning outcomes with powerful teaching tools.',
      features: [
        'Course and assessment management',
        'Student grade entry and tracking',
        'Learning outcome definition',
        'Class performance analytics',
        'Automated feedback system'
      ],
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Building2,
      title: 'For Institutions',
      description: 'Gain comprehensive insights into institutional performance and accreditation compliance.',
      features: [
        'Department-wide analytics',
        'PO achievement tracking',
        'Institutional performance reports',
        'Student and teacher management',
        'Accreditation support tools'
      ],
      color: 'from-indigo-500 to-purple-600'
    }
  ];

  const stats = [
    { label: 'Institutions', value: '50+', icon: Building2 },
    { label: 'Students', value: '10K+', icon: GraduationCap },
    { label: 'Courses', value: '500+', icon: BookOpen },
    { label: 'Data Points', value: '1M+', icon: BarChart3 }
  ];

  const benefits = [
    {
      title: 'Accreditation Ready',
      description: 'Built-in tools for tracking Program Outcomes and generating accreditation reports.',
      icon: CheckCircle2
    },
    {
      title: 'Data-Driven Decisions',
      description: 'Make informed decisions with comprehensive analytics and performance insights.',
      icon: PieChart
    },
    {
      title: 'Time Saving',
      description: 'Automate grading, calculations, and report generation to save hours every week.',
      icon: Zap
    },
    {
      title: 'Scalable Solution',
      description: 'Grows with your institution from small departments to large universities.',
      icon: Rocket
    }
  ];

  return (
    <div className={`min-h-screen ${backgroundClass} transition-colors duration-500`}>
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent"
            >
              About AcuRate
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-xl md:text-2xl ${secondaryText} max-w-3xl mx-auto leading-relaxed`}
            >
              Empowering educational institutions with data-driven insights to improve academic performance and achieve accreditation excellence.
            </motion.p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
          >
            {stats.map((stat, index) => {
              const gradients = [
                'from-blue-500 to-cyan-500',
                'from-purple-500 to-pink-500',
                'from-orange-500 to-red-500',
                'from-green-500 to-emerald-500'
              ];
              const gradient = gradients[index % gradients.length];
              
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`relative overflow-hidden ${cardBg} p-8 rounded-2xl text-center backdrop-blur-xl border border-white/10 dark:border-white/5 group cursor-pointer`}
                >
                  {/* Gradient background effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  {/* Icon with gradient background */}
                  <div className={`relative w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Value */}
                  <div className={`relative text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  
                  {/* Label */}
                  <div className={`relative text-sm font-semibold ${secondaryText} uppercase tracking-wider`}>
                    {stat.label}
                  </div>
                  
                  {/* Decorative corner accent */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${gradient} opacity-5 rounded-bl-full`} />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`${cardBg} p-12 rounded-3xl backdrop-blur-xl border border-white/10 dark:border-white/5`}
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className={`text-4xl font-bold ${whiteText} mb-6`}>
                  Our Mission
                </h2>
                <p className={`${secondaryText} text-lg leading-relaxed mb-6`}>
                  AcuRate was born from a simple yet powerful idea: academic performance should be transparent, measurable, and actionable. We believe that every educational institution deserves access to sophisticated analytics tools that were once only available to large universities.
                </p>
                <p className={`${secondaryText} text-lg leading-relaxed`}>
                  Our platform transforms complex academic data into clear insights, helping institutions improve student outcomes, meet accreditation requirements, and make data-driven decisions that matter.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 rounded-xl bg-gradient-to-br ${accentGradientClass} bg-opacity-10 border border-white/10`}
                  >
                    <benefit.icon className="w-6 h-6 mb-3 text-indigo-400" />
                    <h3 className={`font-semibold ${whiteText} mb-2`}>{benefit.title}</h3>
                    <p className={`text-sm ${secondaryText}`}>{benefit.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-4xl md:text-5xl font-bold ${whiteText} mb-4`}>
              Powerful Features
            </h2>
            <p className={`text-xl ${secondaryText} max-w-2xl mx-auto`}>
              Everything you need to track, analyze, and improve academic performance
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`${cardBg} p-8 rounded-2xl backdrop-blur-xl border border-white/10 dark:border-white/5 hover:border-indigo-500/50 transition-all group`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-xl font-bold ${whiteText} mb-3`}>{feature.title}</h3>
                <p className={`${secondaryText} leading-relaxed`}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-4xl md:text-5xl font-bold ${whiteText} mb-4`}>
              Built for Everyone
            </h2>
            <p className={`text-xl ${secondaryText} max-w-2xl mx-auto`}>
              Tailored experiences for students, teachers, and institutions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {roles.map((role, index) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`${cardBg} p-8 rounded-2xl backdrop-blur-xl border border-white/10 dark:border-white/5 hover:border-indigo-500/50 transition-all`}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-6`}>
                  <role.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${whiteText} mb-3`}>{role.title}</h3>
                <p className={`${secondaryText} mb-6 leading-relaxed`}>{role.description}</p>
                <ul className="space-y-3">
                  {role.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span className={`${secondaryText} text-sm`}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`${cardBg} p-12 rounded-3xl backdrop-blur-xl border border-white/10 dark:border-white/5`}
          >
            <div className="text-center mb-12">
              <h2 className={`text-4xl font-bold ${whiteText} mb-4`}>
                Built with Modern Technology
              </h2>
              <p className={`text-lg ${secondaryText} max-w-2xl mx-auto`}>
                Leveraging cutting-edge tools to deliver a fast, secure, and scalable platform
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Next.js', desc: 'React Framework' },
                { name: 'Django', desc: 'Python Backend' },
                { name: 'PostgreSQL', desc: 'Database' },
                { name: 'TypeScript', desc: 'Type Safety' }
              ].map((tech, index) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-center"
                >
                  <div className={`text-2xl font-bold ${whiteText} mb-2`}>{tech.name}</div>
                  <div className={`text-sm ${secondaryText}`}>{tech.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Academic Analytics?
              </h2>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                Join institutions worldwide that trust AcuRate for their academic performance tracking and accreditation needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
