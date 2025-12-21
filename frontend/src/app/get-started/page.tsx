// app/get-started/page.tsx
'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Rocket, Users, Building2, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import Link from 'next/link';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

export default function GetStartedPage() {
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

  const steps = [
    {
      number: '1',
      title: 'Contact Us',
      description: 'Reach out to us through our contact form or email to express your interest.',
      icon: Users
    },
    {
      number: '2',
      title: 'Get Your Account',
      description: 'We\'ll set up your institution account and provide you with access credentials.',
      icon: Building2
    },
    {
      number: '3',
      title: 'Start Using AcuRate',
      description: 'Begin tracking academic performance, managing courses, and analyzing outcomes.',
      icon: Rocket
    }
  ];

  const benefits = [
    'Comprehensive academic analytics',
    'Program Outcomes tracking',
    'Real-time performance monitoring',
    'Accreditation support tools',
    'Secure and private data management',
    'Dedicated support team'
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
              Get Started with AcuRate
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-xl md:text-2xl ${secondaryText} max-w-3xl mx-auto leading-relaxed`}
            >
              Transform your academic analytics and start tracking performance with ease.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-4xl md:text-5xl font-bold ${whiteText} mb-4`}>
              Getting Started is Easy
            </h2>
            <p className={`text-xl ${secondaryText} max-w-2xl mx-auto`}>
              Follow these simple steps to begin your journey with AcuRate
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`${cardBg} p-8 rounded-2xl backdrop-blur-xl border border-white/10 dark:border-white/5 text-center`}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-indigo-400 mb-4">{step.number}</div>
                <h3 className={`text-2xl font-bold ${whiteText} mb-3`}>{step.title}</h3>
                <p className={secondaryText}>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
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
                What You'll Get
              </h2>
              <p className={`text-lg ${secondaryText} max-w-2xl mx-auto`}>
                All the tools and features you need to succeed
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                  <span className={whiteText}>{benefit}</span>
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
                Ready to Get Started?
              </h2>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                Contact us today to begin your journey with AcuRate and transform your academic analytics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white text-indigo-700 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
                  >
                    Contact Us
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

