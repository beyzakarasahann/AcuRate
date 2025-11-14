// app/contact/page.tsx
'use client';

import { motion } from 'framer-motion';
import { 
  Send, Loader2, CheckCircle2, AlertTriangle, 
  Clock, Award, BarChart3, FileText, Calendar, 
  Handshake, ArrowDown, Building2, Mail, Phone,
  Settings, Rocket
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import Link from 'next/link';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { api } from '@/lib/api';

export default function ContactPage() {
  const [mounted, setMounted] = useState(false);
  const { isDark, mounted: themeMounted, themeClasses, text, mutedText, accentStart, accentEnd } = useThemeColors();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [formData, setFormData] = useState({
    institutionName: '',
    institutionType: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    requestType: '',
    message: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.institutionName.trim()) {
      newErrors.institutionName = 'Institution name is required';
    }
    if (!formData.institutionType) {
      newErrors.institutionType = 'Please select institution type';
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Full name is required';
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    if (!formData.requestType) {
      newErrors.requestType = 'Please select request type';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    setSuccess(false);
    
    try {
      await api.createContactRequest({
        institution_name: formData.institutionName,
        institution_type: formData.institutionType,
        contact_name: formData.contactName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone || undefined,
        request_type: formData.requestType,
        message: formData.message || undefined,
      });
      
      setSuccess(true);
      setFormData({
        institutionName: '',
        institutionType: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        requestType: '',
        message: '',
      });
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to submit contact request:', err);
      // Parse validation errors
      try {
        const errorData = JSON.parse(err.message);
        const newErrors: Record<string, string> = {};
        Object.keys(errorData).forEach(key => {
          // Map backend field names (snake_case) to frontend field names (camelCase)
          const fieldMap: Record<string, string> = {
            'institution_name': 'institutionName',
            'institution_type': 'institutionType',
            'contact_name': 'contactName',
            'contact_email': 'contactEmail',
            'contact_phone': 'contactPhone',
            'request_type': 'requestType',
            'message': 'message'
          };
          const frontendKey = fieldMap[key] || key;
          if (Array.isArray(errorData[key])) {
            newErrors[frontendKey] = errorData[key][0];
            newErrors[key] = errorData[key][0]; // Also keep snake_case for display
          } else {
            newErrors[frontendKey] = errorData[key];
            newErrors[key] = errorData[key]; // Also keep snake_case for display
          }
        });
        setErrors(newErrors);
      } catch {
        setErrors({ submit: err.message || 'Failed to submit request. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Mounted kontrolü
  if (!mounted || !themeMounted) {
    const initialBackground = themeClasses.background || 'from-slate-950 via-blue-950 to-slate-950';
    return (
      <div className={`min-h-screen bg-gradient-to-br ${initialBackground} flex items-center justify-center`}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className={`min-h-screen bg-gradient-to-br ${themeClasses.background} relative overflow-hidden transition-colors duration-500`}>
        {/* Animated Background Orbs (Diğer sayfalarla aynı) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl`}
          style={{ backgroundColor: `${accentStart}20` }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl`}
          style={{ backgroundColor: `${accentEnd}30` }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl`}
          style={{ backgroundColor: `${accentStart}20` }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-20">
      {/* Hero Section */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Icon Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </motion.div>

            <h1 className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 leading-tight`}>
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Strengthen your institution's
              </span>
              <br />
              <span className={`${text}`}>
                academic performance
              </span>
            </h1>
            <p className={`text-lg md:text-xl lg:text-2xl ${mutedText} mb-10 max-w-3xl mx-auto leading-relaxed`}>
              Our platform helps universities, schools, and organizations track student performance, 
              program outcomes, and learning objectives with automated analytics and clear dashboards. 
              <span className={`${isDark ? 'text-indigo-300' : 'text-indigo-600'} font-semibold`}> Contact us to discuss a tailored solution for your institution.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                onClick={scrollToForm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl flex items-center gap-3 transition-all shadow-xl shadow-indigo-500/30`}
              >
                Request institutional offer
                <ArrowDown className="w-5 h-5" />
              </motion.button>
              <Link
                href="#benefits"
                className={`px-10 py-5 ${isDark ? 'bg-white/10 hover:bg-white/20 border border-white/20' : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'} ${text} font-semibold text-lg rounded-xl transition-all backdrop-blur-sm`}
              >
                Learn more about our platform
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-transparent to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Award className="w-8 h-8 text-indigo-400" />
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent`}>
                Why institutions choose us
              </h2>
              <Award className="w-8 h-8 text-pink-400" />
            </div>
            <p className={`text-lg md:text-xl ${mutedText} max-w-3xl mx-auto leading-relaxed`}>
              Discover how our platform transforms academic performance tracking and reporting, 
              empowering institutions to make data-driven decisions and achieve excellence in education
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Benefit 1 */}
            <motion.div
              variants={item}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${text}`}>
                Time-saving analytics
              </h3>
              <p className={mutedText}>
                Automate student performance tracking and eliminate manual Excel reports for instructors and coordinators.
              </p>
            </motion.div>

            {/* Benefit 2 */}
            <motion.div
              variants={item}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${text}`}>
                Accreditation & quality support
              </h3>
              <p className={mutedText}>
                Easily generate outcome-based reports and insights to support accreditation and internal quality processes.
              </p>
            </motion.div>

            {/* Benefit 3 */}
            <motion.div
              variants={item}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`${themeClasses.card} p-6 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${text}`}>
                Institution-wide visibility
              </h3>
              <p className={mutedText}>
                Get a clear, centralized view of courses, programs, and student progress across your institution.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent`}>
              How it works
            </h2>
            <p className={`text-lg md:text-xl ${mutedText} max-w-2xl mx-auto leading-relaxed`}>
              A simple, streamlined process to get started with our platform and transform your institution's academic performance tracking
            </p>
          </motion.div>

          {/* Minimal Timeline Layout */}
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 relative">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="relative text-center lg:text-left"
              >
                <div className="flex flex-col items-center lg:items-start">
                  {/* Step Number & Icon */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/30 relative z-10">
                      1
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-400" />
                    </div>
                  </div>
                  
                  <h3 className={`text-2xl font-bold mb-3 ${text}`}>
                    Submit your request
                  </h3>
                  <p className={`${mutedText} leading-relaxed max-w-sm`}>
                    Fill out the form with your institution's details and needs. We'll review your information and get back to you promptly.
                  </p>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="relative text-center lg:text-left"
              >
                <div className="flex flex-col items-center lg:items-start">
                  {/* Step Number & Icon */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-500/30 relative z-10">
                      2
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                  
                  <h3 className={`text-2xl font-bold mb-3 ${text}`}>
                    Schedule a demo
                  </h3>
                  <p className={`${mutedText} leading-relaxed max-w-sm`}>
                    Our team contacts you to schedule a 30-minute demo tailored to your institution. See the platform in action and ask questions.
                  </p>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="relative text-center lg:text-left"
              >
                <div className="flex flex-col items-center lg:items-start">
                  {/* Step Number & Icon */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-pink-500/30 relative z-10">
                      3
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-orange-600/20 flex items-center justify-center">
                      <Handshake className="w-5 h-5 text-pink-400" />
                    </div>
                  </div>
                  
                  <h3 className={`text-2xl font-bold mb-3 ${text}`}>
                    Get your custom offer
                  </h3>
                  <p className={`${mutedText} leading-relaxed max-w-sm`}>
                    Based on your size and requirements, we prepare a customized proposal for your institution. Start your journey with us.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Contact Form */}
      <section ref={formRef} className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-transparent to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${text}`}>
              Request a custom offer for your institution
            </h2>
            <p className={`text-lg ${mutedText} max-w-2xl mx-auto`}>
              Fill out the form below and our team will contact you within 24 hours to schedule a demo and discuss your needs.
            </p>
          </motion.div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                isDark ? 'bg-green-500/10 border border-green-500/30 text-green-300' : 'bg-green-50 border border-green-200 text-green-700'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">
                Thank you! Your request has been received. Our team will contact you as soon as possible.
              </span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`${themeClasses.card} p-8 rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Institution Details */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${text} flex items-center gap-2`}>
                  <Building2 className="w-5 h-5" />
                  Institution Details
                </h3>
                <div className="space-y-4">
                  {/* Institution Name */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-2`}>
                      Institution Name *
                    </label>
                    <input
                      type="text"
                      value={formData.institutionName}
                      onChange={(e) => {
                        setFormData({ ...formData, institutionName: e.target.value });
                        const newErrors = { ...errors };
                        delete newErrors.institutionName;
                        delete newErrors.institution_name;
                        setErrors(newErrors);
                      }}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
                        (errors.institutionName || errors.institution_name) ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter your institution name"
                    />
                    {errors.institution_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.institution_name}</p>
                    )}
                    {errors.institutionName && (
                      <p className="text-red-500 text-sm mt-1">{errors.institutionName}</p>
                    )}
                  </div>

                  {/* Institution Type */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-2`}>
                      Institution Type *
                    </label>
                    <select
                      value={formData.institutionType}
                      onChange={(e) => {
                        setFormData({ ...formData, institutionType: e.target.value });
                        const newErrors = { ...errors };
                        delete newErrors.institutionType;
                        delete newErrors.institution_type;
                        setErrors(newErrors);
                      }}
                      className={`w-full p-3 rounded-lg appearance-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
                        (errors.institutionType || errors.institution_type) ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select institution type</option>
                      <option value="university">University</option>
                      <option value="faculty">Faculty / Department</option>
                      <option value="school">School / College</option>
                      <option value="training">Training Center</option>
                      <option value="company">Company</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.institution_type && (
                      <p className="text-red-500 text-sm mt-1">{errors.institution_type}</p>
                    )}
                    {errors.institutionType && (
                      <p className="text-red-500 text-sm mt-1">{errors.institutionType}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Person Details */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${text} flex items-center gap-2`}>
                  <Mail className="w-5 h-5" />
                  Contact Person Details
                </h3>
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-2`}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => {
                        setFormData({ ...formData, contactName: e.target.value });
                        const newErrors = { ...errors };
                        delete newErrors.contactName;
                        delete newErrors.contact_name;
                        setErrors(newErrors);
                      }}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
                        (errors.contactName || errors.contact_name) ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.contact_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.contact_name}</p>
                    )}
                    {errors.contactName && (
                      <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>
                    )}
                  </div>

                  {/* Work Email */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-2`}>
                      Work Email *
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => {
                        setFormData({ ...formData, contactEmail: e.target.value });
                        const newErrors = { ...errors };
                        delete newErrors.contactEmail;
                        delete newErrors.contact_email;
                        setErrors(newErrors);
                      }}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
                        (errors.contactEmail || errors.contact_email) ? 'border-red-500' : ''
                      }`}
                      placeholder="your.email@institution.edu"
                    />
                    {errors.contact_email && (
                      <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
                    )}
                    {errors.contactEmail && (
                      <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-2`}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                      placeholder="+90 555 123 4567"
                    />
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${text} flex items-center gap-2`}>
                  <FileText className="w-5 h-5" />
                  Request Details
                </h3>
                <div className="space-y-4">
                  {/* Type of Request */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-2`}>
                      Type of Request *
                    </label>
                    <select
                      value={formData.requestType}
                      onChange={(e) => {
                        setFormData({ ...formData, requestType: e.target.value });
                        const newErrors = { ...errors };
                        delete newErrors.requestType;
                        delete newErrors.request_type;
                        setErrors(newErrors);
                      }}
                      className={`w-full p-3 rounded-lg appearance-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${
                        (errors.requestType || errors.request_type) ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select request type</option>
                      <option value="demo">Request a demo</option>
                      <option value="pricing">Request pricing</option>
                      <option value="partnership">Partnership / Collaboration</option>
                      <option value="technical">Technical integration question</option>
                      <option value="general">General institutional inquiry</option>
                    </select>
                    {errors.request_type && (
                      <p className="text-red-500 text-sm mt-1">{errors.request_type}</p>
                    )}
                    {errors.requestType && (
                      <p className="text-red-500 text-sm mt-1">{errors.requestType}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-2`}>
                      Message / Description
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={6}
                      className={`w-full p-3 rounded-lg resize-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                      placeholder="Tell us briefly about your institution, the number of students, and what you are looking for."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`w-full px-6 py-4 ${loading ? 'bg-gray-500' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" /> Submit request
                  </>
                )}
              </motion.button>
            </form>

            {/* Trust / Privacy Note */}
            <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <p className={`text-sm text-center ${mutedText}`}>
                Your information is secure and will only be used to contact you about our services. 
                We respect your privacy and will never share your data with third parties.
              </p>
            </div>
          </motion.div>

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <Link 
              href="/login" 
              className={`text-sm ${mutedText} hover:text-indigo-500 transition-colors`}
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </section>
      </div>
      <Footer />
    </div>
    </>
  );
}
