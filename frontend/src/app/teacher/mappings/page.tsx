'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link2, BookOpen, FileText, Target, Award, Plus, X, Edit2, Trash2, 
  Save, AlertCircle, CheckCircle2, Loader2, Search, Filter
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { 
  api, 
  type Course, 
  type Assessment, 
  type LearningOutcome, 
  type ProgramOutcome,
  type AssessmentLO,
  type LOPO
} from '@/lib/api';

type TabType = 'assessment-lo' | 'lo-po';

export default function MappingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('assessment-lo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Course selection
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  
  // Assessment-LO Mapping data
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [assessmentLOs, setAssessmentLOs] = useState<AssessmentLO[]>([]);
  const [showCreateAssessmentLO, setShowCreateAssessmentLO] = useState(false);
  const [editingAssessmentLO, setEditingAssessmentLO] = useState<AssessmentLO | null>(null);
  const [newAssessmentLO, setNewAssessmentLO] = useState({
    assessment: 0,
    learning_outcome: 0,
    percentage: 10 // Default percentage (10%)
  });
  
  // LO-PO Mapping data
  const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcome[]>([]);
  const [loPOs, setLoPOs] = useState<LOPO[]>([]);
  const [showCreateLOPO, setShowCreateLOPO] = useState(false);
  const [editingLOPO, setEditingLOPO] = useState<LOPO | null>(null);
  const [newLOPO, setNewLOPO] = useState({
    learning_outcome: 0,
    program_outcome: 0,
    percentage: 50 // Default percentage (50%)
  });
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { isDark, themeClasses, text, mutedText } = useThemeColors();
  
  useEffect(() => {
    setMounted(true);
    loadCourses();
  }, []);
  
  useEffect(() => {
    if (selectedCourse) {
      loadCourseData();
    } else {
      resetCourseData();
      setLoading(false);
    }
  }, [selectedCourse, activeTab]);
  
  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await api.getCourses();
      setCourses(coursesData);
      if (coursesData.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesData[0].id);
      }
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };
  
  const loadCourseData = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'assessment-lo') {
        // Load assessments and LOs first, then mappings (mappings depend on assessments/LOs)
        await loadAssessments();
        await loadLearningOutcomes();
        await loadAssessmentLOs();
      } else {
        // Load LOs and POs first, then mappings (mappings depend on LOs)
        await loadLearningOutcomes();
        await loadProgramOutcomes();
        await loadLOPOs();
      }
    } catch (err: any) {
      console.error('Error loading course data:', err);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };
  
  const resetCourseData = () => {
    setAssessments([]);
    setLearningOutcomes([]);
    setAssessmentLOs([]);
    setProgramOutcomes([]);
    setLoPOs([]);
  };
  
  const loadAssessments = async () => {
    if (!selectedCourse) return;
    try {
      const data = await api.getAssessments({ course: selectedCourse });
      setAssessments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading assessments:', err);
    }
  };
  
  const loadLearningOutcomes = async () => {
    if (!selectedCourse) return;
    try {
      const data = await api.getLearningOutcomes({ course: selectedCourse });
      setLearningOutcomes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading learning outcomes:', err);
    }
  };
  
  const loadProgramOutcomes = async () => {
    if (!selectedCourse) return;
    try {
      const course = courses.find(c => c.id === selectedCourse);
      if (course?.department) {
        const data = await api.getProgramOutcomes({ department: course.department });
        setProgramOutcomes(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('Error loading program outcomes:', err);
    }
  };
  
  const loadAssessmentLOs = async () => {
    if (!selectedCourse) {
      console.log('[Mappings] No course selected, skipping loadAssessmentLOs');
      setAssessmentLOs([]);
      return;
    }
    try {
      // Use courseId filter to get mappings for the selected course
      console.log(`[Mappings] 🔄 Loading Assessment-LO mappings for course ID: ${selectedCourse}`);
      const allAssessmentLOs = await api.getAssessmentLOs({ courseId: selectedCourse });
      console.log(`[Mappings] ✅ Loaded ${allAssessmentLOs?.length || 0} Assessment-LO mappings`);
      
      if (allAssessmentLOs && allAssessmentLOs.length > 0) {
        console.log('[Mappings] 📋 First mapping sample:', JSON.stringify(allAssessmentLOs[0], null, 2));
        console.log('[Mappings] 📋 All mapping IDs:', allAssessmentLOs.map(m => m.id));
      } else {
        console.warn('[Mappings] ⚠️ No mappings returned from API');
      }
      
      setAssessmentLOs(Array.isArray(allAssessmentLOs) ? allAssessmentLOs : []);
    } catch (err: any) {
      console.error('[Mappings] ❌ Error loading assessment-LO mappings:', err);
      console.error('[Mappings] Error details:', {
        message: err?.message,
        error: err?.error,
        response: err?.response
      });
      setAssessmentLOs([]);
      setError(`Failed to load mappings: ${err?.message || 'Unknown error'}`);
    }
  };
  
  const loadLOPOs = async () => {
    if (!selectedCourse) return;
    try {
      // Use courseId filter to get mappings for the selected course
      const allLOPOs = await api.getLOPOs({ courseId: selectedCourse });
      setLoPOs(allLOPOs);
    } catch (err: any) {
      console.error('Error loading LO-PO mappings:', err);
    }
  };
  
  // Assessment-LO Mapping handlers
  const handleCreateAssessmentLO = async () => {
    if (!newAssessmentLO.assessment || newAssessmentLO.assessment === 0) {
      alert('Please select an assessment.');
      return;
    }
    
    if (!newAssessmentLO.learning_outcome || newAssessmentLO.learning_outcome === 0) {
      alert('Please select a learning outcome.');
      return;
    }
    
    if (!newAssessmentLO.percentage || newAssessmentLO.percentage < 1 || newAssessmentLO.percentage > 100) {
      alert('Contribution must be between 1 and 100.');
      return;
    }
    
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      // Convert percentage to weight: weight = (percentage / 100) * 10.0
      const weight = (newAssessmentLO.percentage / 100) * 10.0;
      console.log('Creating Assessment-LO mapping:', { ...newAssessmentLO, weight });
      const result = await api.createAssessmentLO({
        assessment: newAssessmentLO.assessment,
        learning_outcome: newAssessmentLO.learning_outcome,
        weight: weight
      });
      console.log('Created successfully:', result);
      
      await loadAssessmentLOs();
      setNewAssessmentLO({ assessment: 0, learning_outcome: 0, percentage: 10 });
      setShowCreateAssessmentLO(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Error creating assessment-LO mapping:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Failed to create mapping';
      
      // Extract error message from various possible formats
      if (err?.message) {
        errorMessage = err.message;
        
        // Try to parse Django REST Framework validation errors
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.errors) {
            const errorList = Object.entries(parsed.errors)
              .map(([field, messages]) => {
                if (Array.isArray(messages)) {
                  return `${field}: ${messages.join(', ')}`;
                }
                return `${field}: ${messages}`;
              })
              .join('\n');
            errorMessage = errorList || errorMessage;
          }
        } catch {
          // Not a JSON error, use as is
          // Check if it's a plain string error
          if (typeof err.message === 'string') {
            errorMessage = err.message;
            
            // Common error patterns
            if (err.message.includes('already exists') || err.message.includes('unique')) {
              errorMessage = 'This mapping already exists. Each assessment can only be mapped to each learning outcome once.';
            } else if (err.message.includes('Permission denied') || err.message.includes('permission')) {
              errorMessage = 'Permission denied. You can only create mappings for assessments in your courses.';
            } else if (err.message.includes('weight')) {
              errorMessage = 'Invalid weight value. Weight must be between 0.1 and 10.0.';
            }
          }
        }
      } else if (err?.error) {
        errorMessage = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setSaveStatus('error');
      alert(`Failed to create mapping:\n\n${errorMessage}\n\nPlease check:\n- You selected an assessment and learning outcome\n- The assessment belongs to the selected course\n- Weight is between 0.1 and 10.0\n- This mapping doesn't already exist`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateAssessmentLO = async (id: number, weight: number) => {
    if (weight < 0.01 || weight > 10.0) {
      alert('Weight must be between 0.01 and 10.0');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await api.updateAssessmentLO(id, { weight });
      await loadAssessmentLOs();
      setEditingAssessmentLO(null);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Error updating assessment-LO mapping:', err);
      setSaveStatus('error');
      alert(err?.error || 'Failed to update mapping');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteAssessmentLO = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;
    
    setIsSaving(true);
    
    try {
      await api.deleteAssessmentLO(id);
      await loadAssessmentLOs();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Error deleting assessment-LO mapping:', err);
      setSaveStatus('error');
      alert(err?.error || 'Failed to delete mapping');
    } finally {
      setIsSaving(false);
    }
  };
  
  // LO-PO Mapping handlers
  const handleCreateLOPO = async () => {
    if (!newLOPO.learning_outcome || newLOPO.learning_outcome === 0) {
      alert('Please select a learning outcome.');
      return;
    }
    
    if (!newLOPO.program_outcome || newLOPO.program_outcome === 0) {
      alert('Please select a program outcome.');
      return;
    }
    
    if (!newLOPO.percentage || newLOPO.percentage < 1 || newLOPO.percentage > 100) {
      alert('Contribution must be between 1 and 100.');
      return;
    }
    
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      // Convert percentage to weight: weight = (percentage / 100) * 10.0
      const weight = (newLOPO.percentage / 100) * 10.0;
      console.log('Creating LO-PO mapping:', { ...newLOPO, weight });
      const result = await api.createLOPO({
        learning_outcome: newLOPO.learning_outcome,
        program_outcome: newLOPO.program_outcome,
        weight: weight
      });
      console.log('Created successfully:', result);
      
      await loadLOPOs();
      setNewLOPO({ learning_outcome: 0, program_outcome: 0, percentage: 50 });
      setShowCreateLOPO(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Error creating LO-PO mapping:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Failed to create mapping';
      
      // Extract error message from various possible formats
      if (err?.message) {
        errorMessage = err.message;
        
        // Try to parse Django REST Framework validation errors
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.errors) {
            const errorList = Object.entries(parsed.errors)
              .map(([field, messages]) => {
                if (Array.isArray(messages)) {
                  return `${field}: ${messages.join(', ')}`;
                }
                return `${field}: ${messages}`;
              })
              .join('\n');
            errorMessage = errorList || errorMessage;
          }
        } catch {
          // Not a JSON error, use as is
          // Check if it's a plain string error
          if (typeof err.message === 'string') {
            errorMessage = err.message;
            
            // Common error patterns
            if (err.message.includes('already exists') || err.message.includes('unique')) {
              errorMessage = 'This mapping already exists. Each learning outcome can only be mapped to each program outcome once.';
            } else if (err.message.includes('Permission denied') || err.message.includes('permission')) {
              errorMessage = 'Permission denied. You can only create mappings for learning outcomes in your courses.';
            } else if (err.message.includes('weight')) {
              errorMessage = 'Invalid weight value. Weight must be between 0.1 and 10.0.';
            }
          }
        }
      } else if (err?.error) {
        errorMessage = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setSaveStatus('error');
      alert(`Failed to create mapping:\n\n${errorMessage}\n\nPlease check:\n- You selected a learning outcome and program outcome\n- The learning outcome belongs to the selected course\n- Weight is between 0.1 and 10.0\n- This mapping doesn't already exist`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateLOPO = async (id: number, weight: number) => {
    if (weight < 0.01 || weight > 10.0) {
      alert('Weight must be between 0.01 and 10.0');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await api.updateLOPO(id, { weight });
      await loadLOPOs();
      setEditingLOPO(null);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Error updating LO-PO mapping:', err);
      setSaveStatus('error');
      alert(err?.error || 'Failed to update mapping');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteLOPO = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;
    
    setIsSaving(true);
    
    try {
      await api.deleteLOPO(id);
      await loadLOPOs();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Error deleting LO-PO mapping:', err);
      setSaveStatus('error');
      alert(err?.error || 'Failed to delete mapping');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Filtered data based on search
  const filteredAssessmentLOs = useMemo(() => {
    if (!searchTerm) return assessmentLOs;
    const term = searchTerm.toLowerCase();
    return assessmentLOs.filter(al => {
      const assessmentTitle = typeof al.assessment === 'object' ? al.assessment_title || '' : 
        assessments.find(a => a.id === al.assessment)?.title || '';
      const loCode = al.lo_code || '';
      return assessmentTitle.toLowerCase().includes(term) || loCode.toLowerCase().includes(term);
    });
  }, [assessmentLOs, searchTerm, assessments]);
  
  const filteredLOPOs = useMemo(() => {
    if (!searchTerm) return loPOs;
    const term = searchTerm.toLowerCase();
    return loPOs.filter(lopo => {
      const loCode = lopo.lo_code || '';
      const poCode = lopo.po_code || '';
      return loCode.toLowerCase().includes(term) || poCode.toLowerCase().includes(term);
    });
  }, [loPOs, searchTerm]);
  
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={mutedText}>Loading...</p>
        </div>
      </div>
    );
  }
  
  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-4">
          Outcome Mappings Management
        </h1>
        <p className={mutedText}>
          Manage how assessments connect to Learning Outcomes and how Learning Outcomes contribute to Program Outcomes
        </p>
      </motion.div>
      
      {/* Course Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${themeClasses.card} rounded-xl shadow-xl p-6 mb-6`}
      >
        <label className={`${mutedText} text-sm font-medium mb-2 block flex items-center gap-2`}>
          <BookOpen className="w-4 h-4" />
          Select Course
        </label>
        <select
          value={selectedCourse || ''}
          onChange={(e) => {
            setSelectedCourse(Number(e.target.value) || null);
            setSaveStatus(null);
          }}
          className={`w-full md:w-1/2 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="">-- Select a course --</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name} ({course.semester_display} {course.academic_year})
            </option>
          ))}
        </select>
        
        {selectedCourseData && (
          <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <p className={text}>
              <span className="font-semibold">Course:</span> {selectedCourseData.code} - {selectedCourseData.name}
            </p>
            <p className={`${mutedText} text-sm mt-1`}>
              {selectedCourseData.credits} credits • {selectedCourseData.semester_display} {selectedCourseData.academic_year}
            </p>
          </div>
        )}
      </motion.div>
      
      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex gap-4 border-b border-gray-500/20">
          <button
            onClick={() => {
              setActiveTab('assessment-lo');
              setSearchTerm('');
            }}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'assessment-lo'
                ? 'border-b-2 border-indigo-500 text-indigo-500'
                : `${mutedText} hover:text-white`
            }`}
          >
            <FileText className="w-4 h-4" />
            Assessment → LO Mappings
          </button>
          <button
            onClick={() => {
              setActiveTab('lo-po');
              setSearchTerm('');
            }}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'lo-po'
                ? 'border-b-2 border-indigo-500 text-indigo-500'
                : `${mutedText} hover:text-white`
            }`}
          >
            <Link2 className="w-4 h-4" />
            LO → PO Mappings
          </button>
        </div>
      </motion.div>
      
      {/* Status Messages */}
      {saveStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${themeClasses.card} p-4 rounded-xl mb-6 flex items-center gap-3 ${
            saveStatus === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
          }`}
        >
          {saveStatus === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <p className={saveStatus === 'success' ? 'text-green-500' : 'text-red-500'}>
            {saveStatus === 'success' ? 'Mapping saved successfully!' : 'Failed to save mapping'}
          </p>
        </motion.div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
            <p className={mutedText}>Loading mappings...</p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <div className={`${themeClasses.card} p-6 rounded-xl mb-6`}>
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Assessment → LO Mappings Tab */}
      {!loading && activeTab === 'assessment-lo' && selectedCourse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Search and Create Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${mutedText}`} />
              <input
                type="text"
                placeholder="Search mappings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <button
              onClick={() => {
                setShowCreateAssessmentLO(true);
                setNewAssessmentLO({ assessment: 0, learning_outcome: 0, percentage: 10 });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Mapping
            </button>
          </div>
          
          {/* Mappings Table */}
          <div className={`${themeClasses.card} rounded-xl shadow-xl overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${text}`}>Assessment</th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${text}`}>Learning Outcome</th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${text}`}>Contribution (%)</th>
                    <th className={`px-6 py-4 text-center text-sm font-semibold ${text}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessmentLOs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={`px-6 py-12 text-center ${mutedText}`}>
                        {assessmentLOs.length === 0 ? (
                          <div>
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No Assessment → LO mappings found for this course.</p>
                            <p className="text-sm mt-2">Click "Create Mapping" to add a new mapping.</p>
                            <p className="text-xs mt-4 opacity-50">
                              Debug: assessmentLOs.length = {assessmentLOs.length}, selectedCourse = {selectedCourse || 'null'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p>No mappings match your search: "{searchTerm}"</p>
                            <p className="text-xs mt-2 opacity-50">
                              Total mappings: {assessmentLOs.length}, Filtered: {filteredAssessmentLOs.length}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredAssessmentLOs.map((mapping) => {
                      // Try multiple ways to get assessment ID
                      const mappingAssessmentId = typeof mapping.assessment === 'object' && mapping.assessment !== null
                        ? mapping.assessment.id
                        : typeof mapping.assessment === 'number'
                        ? mapping.assessment
                        : Number(mapping.assessment) || mapping.assessmentId;
                      
                      const mappingLoId = typeof mapping.learning_outcome === 'object' && mapping.learning_outcome !== null
                        ? mapping.learning_outcome.id
                        : typeof mapping.learning_outcome === 'number'
                        ? mapping.learning_outcome
                        : Number(mapping.learning_outcome) || mapping.learningOutcomeId;
                      
                      const assessment = assessments.find(a => a.id === mappingAssessmentId);
                      const lo = learningOutcomes.find(lo => lo.id === mappingLoId);
                      
                      const weight = typeof mapping.weight === 'string' ? parseFloat(mapping.weight) : Number(mapping.weight) || 0;
                      const percentage = Math.round((weight / 10.0) * 100); // Convert weight (0.01-10.0) to percentage (1-100)
                      
                      return (
                        <tr key={mapping.id} className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                          <td className={`px-6 py-4 ${text}`}>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-500" />
                              {assessment?.title || mapping.assessment_title || 'N/A'}
                            </div>
                          </td>
                          <td className={`px-6 py-4 ${text}`}>
                            <div 
                              className="flex flex-col gap-1 group relative cursor-help"
                              title={lo?.description || mapping.lo_description || 'No description available'}
                            >
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-purple-500" />
                                <span className="font-medium">{lo?.code || mapping.lo_code || 'N/A'}</span>
                              </div>
                              {(lo?.title || mapping.lo_title) && (
                                <div className={`text-xs ${mutedText} ml-6`}>
                                  {lo?.title || mapping.lo_title}
                                </div>
                              )}
                              {(lo?.description || mapping.lo_description) && (
                                <div className={`absolute left-0 top-full mt-2 z-50 hidden group-hover:block w-64 p-3 rounded-lg shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                                  <div className="text-xs font-medium mb-1 text-purple-500">{lo?.code || mapping.lo_code} - {lo?.title || mapping.lo_title}</div>
                                  <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {lo?.description || mapping.lo_description}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={`px-6 py-4 ${text}`}>
                            {editingAssessmentLO?.id === mapping.id ? (
                              <input
                                type="number"
                                min="1"
                                max="100"
                                step="1"
                                defaultValue={percentage}
                                onBlur={(e) => {
                                  const newPercentage = parseFloat(e.target.value);
                                  if (!isNaN(newPercentage) && newPercentage >= 1 && newPercentage <= 100) {
                                    // Convert percentage to weight: weight = (percentage / 100) * 10.0
                                    const newWeight = (newPercentage / 100) * 10.0;
                                    handleUpdateAssessmentLO(mapping.id, newWeight);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const newPercentage = parseFloat((e.target as HTMLInputElement).value);
                                    if (!isNaN(newPercentage) && newPercentage >= 1 && newPercentage <= 100) {
                                      const newWeight = (newPercentage / 100) * 10.0;
                                      handleUpdateAssessmentLO(mapping.id, newWeight);
                                    }
                                  }
                                }}
                                className={`w-24 px-3 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                  isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                autoFocus
                              />
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                              }`}>
                                {percentage}%
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  if (editingAssessmentLO?.id === mapping.id) {
                                    setEditingAssessmentLO(null);
                                  } else {
                                    setEditingAssessmentLO(mapping);
                                  }
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDark ? 'hover:bg-white/10 text-blue-400' : 'hover:bg-gray-100 text-blue-600'
                                }`}
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAssessmentLO(mapping.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDark ? 'hover:bg-white/10 text-red-400' : 'hover:bg-gray-100 text-red-600'
                                }`}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Create Assessment-LO Mapping Modal */}
          <AnimatePresence>
            {showCreateAssessmentLO && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowCreateAssessmentLO(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className={`${themeClasses.card} rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-2xl font-bold ${text}`}>Create Assessment → LO Mapping</h2>
                    <button
                      onClick={() => setShowCreateAssessmentLO(false)}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`${mutedText} text-sm font-medium mb-2 block`}>
                        Assessment
                      </label>
                      <select
                        value={newAssessmentLO.assessment}
                        onChange={(e) => setNewAssessmentLO({ ...newAssessmentLO, assessment: Number(e.target.value) })}
                        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="0">-- Select Assessment --</option>
                        {assessments.map(assessment => (
                          <option key={assessment.id} value={assessment.id}>
                            {assessment.title} ({assessment.type_display || assessment.assessment_type})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className={`${mutedText} text-sm font-medium mb-2 block`}>
                        Learning Outcome
                      </label>
                      <select
                        value={newAssessmentLO.learning_outcome}
                        onChange={(e) => setNewAssessmentLO({ ...newAssessmentLO, learning_outcome: Number(e.target.value) })}
                        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="0">-- Select Learning Outcome --</option>
                        {learningOutcomes.map(lo => (
                          <option key={lo.id} value={lo.id}>
                            {lo.code} - {lo.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className={`${mutedText} text-sm font-medium mb-2 block`}>
                        Contribution (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={newAssessmentLO.percentage}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value >= 1 && value <= 100) {
                            setNewAssessmentLO({ ...newAssessmentLO, percentage: value });
                          } else if (e.target.value === '' || value === 0) {
                            setNewAssessmentLO({ ...newAssessmentLO, percentage: 10 });
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        required
                      />
                      <p className={`${mutedText} text-xs mt-1`}>
                        Enter a value between 1 and 100
                      </p>
                      {newAssessmentLO.percentage < 1 && (
                        <p className="text-red-500 text-xs mt-1">Contribution must be at least 1%</p>
                      )}
                      {newAssessmentLO.percentage > 100 && (
                        <p className="text-red-500 text-xs mt-1">Contribution must be at most 100%</p>
                      )}
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowCreateAssessmentLO(false)}
                        className={`flex-1 px-4 py-3 rounded-xl border transition-colors ${
                          isDark ? 'border-white/20 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateAssessmentLO}
                        disabled={isSaving}
                        className="flex-1 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Create Mapping
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* LO → PO Mappings Tab */}
      {!loading && activeTab === 'lo-po' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Search and Create Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${mutedText}`} />
              <input
                type="text"
                placeholder="Search mappings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <button
              onClick={() => {
                setShowCreateLOPO(true);
                setNewLOPO({ learning_outcome: 0, program_outcome: 0, percentage: 50 });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Mapping
            </button>
          </div>
          
          {/* Mappings Table */}
          <div className={`${themeClasses.card} rounded-xl shadow-xl overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${text}`}>Learning Outcome</th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${text}`}>Program Outcome</th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${text}`}>Contribution (%)</th>
                    <th className={`px-6 py-4 text-center text-sm font-semibold ${text}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLOPOs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={`px-6 py-12 text-center ${mutedText}`}>
                        {loPOs.length === 0 ? (
                          <div>
                            <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No LO → PO mappings found for this course.</p>
                            <p className="text-sm mt-2">Click "Create Mapping" to add a new mapping.</p>
                          </div>
                        ) : (
                          <p>No mappings match your search.</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredLOPOs.map((mapping) => {
                      const lo = learningOutcomes.find(lo => {
                        const mappingLoId = typeof mapping.learning_outcome === 'object' ? mapping.learning_outcome.id : Number(mapping.learning_outcome);
                        return lo.id === mappingLoId;
                      });
                      const po = programOutcomes.find(po => {
                        const mappingPoId = typeof mapping.program_outcome === 'object' ? mapping.program_outcome.id : Number(mapping.program_outcome);
                        return po.id === mappingPoId;
                      });
                      const weight = typeof mapping.weight === 'string' ? parseFloat(mapping.weight) : Number(mapping.weight);
                      const percentage = Math.round((weight / 10.0) * 100); // Convert weight (0.01-10.0) to percentage (1-100)
                      
                      return (
                        <tr key={mapping.id} className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                          <td className={`px-6 py-4 ${text}`}>
                            <div 
                              className="flex flex-col gap-1 group relative cursor-help"
                              title={lo?.description || mapping.lo_description || 'No description available'}
                            >
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-purple-500" />
                                <span className="font-medium">{lo?.code || mapping.lo_code || 'N/A'}</span>
                              </div>
                              {(lo?.title || mapping.lo_title) && (
                                <div className={`text-xs ${mutedText} ml-6`}>
                                  {lo?.title || mapping.lo_title}
                                </div>
                              )}
                              {(lo?.description || mapping.lo_description) && (
                                <div className={`absolute left-0 top-full mt-2 z-50 hidden group-hover:block w-64 p-3 rounded-lg shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                                  <div className="text-xs font-medium mb-1 text-purple-500">{lo?.code || mapping.lo_code} - {lo?.title || mapping.lo_title}</div>
                                  <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {lo?.description || mapping.lo_description}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={`px-6 py-4 ${text}`}>
                            <div 
                              className="flex flex-col gap-1 group relative cursor-help"
                              title={po?.description || 'No description available'}
                            >
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-green-500" />
                                <span className="font-medium">{po?.code || mapping.po_code || 'N/A'}</span>
                              </div>
                              {(po?.title || mapping.po_title) && (
                                <div className={`text-xs ${mutedText} ml-6`}>
                                  {po?.title || mapping.po_title}
                                </div>
                              )}
                              {(po?.description) && (
                                <div className={`absolute left-0 top-full mt-2 z-50 hidden group-hover:block w-64 p-3 rounded-lg shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                                  <div className="text-xs font-medium mb-1 text-indigo-500">{po.code} - {po.title}</div>
                                  <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {po.description}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={`px-6 py-4 ${text}`}>
                            {editingLOPO?.id === mapping.id ? (
                              <input
                                type="number"
                                min="1"
                                max="100"
                                step="1"
                                defaultValue={percentage}
                                onBlur={(e) => {
                                  const newPercentage = parseFloat(e.target.value);
                                  if (!isNaN(newPercentage) && newPercentage >= 1 && newPercentage <= 100) {
                                    // Convert percentage to weight: weight = (percentage / 100) * 10.0
                                    const newWeight = (newPercentage / 100) * 10.0;
                                    handleUpdateLOPO(mapping.id, newWeight);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const newPercentage = parseFloat((e.target as HTMLInputElement).value);
                                    if (!isNaN(newPercentage) && newPercentage >= 1 && newPercentage <= 100) {
                                      const newWeight = (newPercentage / 100) * 10.0;
                                      handleUpdateLOPO(mapping.id, newWeight);
                                    }
                                  }
                                }}
                                className={`w-24 px-3 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                  isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                autoFocus
                              />
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {percentage}%
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  if (editingLOPO?.id === mapping.id) {
                                    setEditingLOPO(null);
                                  } else {
                                    setEditingLOPO(mapping);
                                  }
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDark ? 'hover:bg-white/10 text-blue-400' : 'hover:bg-gray-100 text-blue-600'
                                }`}
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteLOPO(mapping.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDark ? 'hover:bg-white/10 text-red-400' : 'hover:bg-gray-100 text-red-600'
                                }`}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Create LO-PO Mapping Modal */}
          <AnimatePresence>
            {showCreateLOPO && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowCreateLOPO(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className={`${themeClasses.card} rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-2xl font-bold ${text}`}>Create LO → PO Mapping</h2>
                    <button
                      onClick={() => setShowCreateLOPO(false)}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`${mutedText} text-sm font-medium mb-2 block`}>
                        Learning Outcome
                      </label>
                      <select
                        value={newLOPO.learning_outcome}
                        onChange={(e) => setNewLOPO({ ...newLOPO, learning_outcome: Number(e.target.value) })}
                        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="0">-- Select Learning Outcome --</option>
                        {learningOutcomes.map(lo => (
                          <option key={lo.id} value={lo.id}>
                            {lo.code} - {lo.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className={`${mutedText} text-sm font-medium mb-2 block`}>
                        Program Outcome
                      </label>
                      <select
                        value={newLOPO.program_outcome}
                        onChange={(e) => setNewLOPO({ ...newLOPO, program_outcome: Number(e.target.value) })}
                        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="0">-- Select Program Outcome --</option>
                        {programOutcomes.map(po => (
                          <option key={po.id} value={po.id}>
                            {po.code} - {po.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className={`${mutedText} text-sm font-medium mb-2 block`}>
                        Contribution (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={newLOPO.percentage}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value >= 1 && value <= 100) {
                            setNewLOPO({ ...newLOPO, percentage: value });
                          } else if (e.target.value === '' || value === 0) {
                            setNewLOPO({ ...newLOPO, percentage: 50 });
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        required
                      />
                      <p className={`${mutedText} text-xs mt-1`}>
                        Enter a value between 1 and 100
                      </p>
                      {newLOPO.percentage < 1 && (
                        <p className="text-red-500 text-xs mt-1">Contribution must be at least 1%</p>
                      )}
                      {newLOPO.percentage > 100 && (
                        <p className="text-red-500 text-xs mt-1">Contribution must be at most 100%</p>
                      )}
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowCreateLOPO(false)}
                        className={`flex-1 px-4 py-3 rounded-xl border transition-colors ${
                          isDark ? 'border-white/20 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateLOPO}
                        disabled={isSaving}
                        className="flex-1 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Create Mapping
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* No Course Selected - Show only if courses exist but none selected */}
      {!loading && !selectedCourse && courses.length > 0 && (
        <div className={`${themeClasses.card} rounded-xl shadow-xl p-12 text-center`}>
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className={`text-xl ${text} mb-2`}>Select a Course</p>
          <p className={mutedText}>Please select a course from the dropdown above to view and manage mappings</p>
        </div>
      )}
      
      {/* No Courses Available */}
      {!loading && courses.length === 0 && !error && (
        <div className={`${themeClasses.card} rounded-xl shadow-xl p-12 text-center`}>
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className={`text-xl ${text} mb-2`}>No Courses Available</p>
          <p className={mutedText}>You don't have any courses assigned. Please contact your administrator.</p>
        </div>
      )}
    </div>
  );
}

