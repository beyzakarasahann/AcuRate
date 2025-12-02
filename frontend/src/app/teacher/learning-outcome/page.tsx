// app/teacher/learning-outcome/page.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, X, Save, BookOpen, AlertCircle, CheckCircle2, Trash2, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, LearningOutcome, Course, ProgramOutcome, LOPO } from '@/lib/api';

// --- TİPLER ---

interface LearningOutcomeWithCourse extends LearningOutcome {
  course_code?: string;
  course_name?: string;
}

// --- ANA BİLEŞEN ---

export default function LearningOutcomePage() {
  const [mounted, setMounted] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [editingLO, setEditingLO] = useState<number | null>(null);
  const [showCreateLO, setShowCreateLO] = useState(false);
  const [newLO, setNewLO] = useState({
    code: '',
    title: '',
    description: '',
    target_percentage: 70
  });
  const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcome[]>([]);
  const [loPOs, setLoPOs] = useState<LOPO[]>([]);
  const [newLOPOs, setNewLOPOs] = useState<Array<{ program_outcome: number; weight: number }>>([]);
  const [editingLOPOs, setEditingLOPOs] = useState<Record<number, Array<{ program_outcome: number; weight: number }>>>({});

  const { 
    isDark, 
    mounted: themeMounted, 
    themeClasses, 
    text, 
    mutedText 
  } = useThemeColors();

  useEffect(() => {
    setMounted(true);
    loadCourses();
  }, []);

  // Dersler yüklendiğinde
  const loadCourses = async () => {
    try {
      const coursesData = await api.getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  // Ders seçildiğinde Learning Outcomes'ları yükle
  useEffect(() => {
    if (selectedCourse) {
      loadLearningOutcomes();
      loadProgramOutcomes();
    } else {
      setLearningOutcomes([]);
      setProgramOutcomes([]);
      setLoPOs([]);
    }
  }, [selectedCourse]);

  const loadLearningOutcomes = async () => {
    if (!selectedCourse) return;
    
    try {
      const los = await api.getLearningOutcomes({ course: selectedCourse });
      setLearningOutcomes(los);
      
      // Load LO-PO mappings for all LOs
      for (const lo of los) {
        try {
          const lopos = await api.getLOPOs({ learning_outcome: lo.id });
          setLoPOs(prev => [...prev.filter(lopo => lopo.learning_outcome !== lo.id), ...lopos]);
        } catch (err) {
          console.error(`Error loading LO-PO mappings for LO ${lo.id}:`, err);
        }
      }
    } catch (error) {
      console.error('Error loading learning outcomes:', error);
      setSaveStatus('error');
    }
  };

  const loadProgramOutcomes = async () => {
    if (!selectedCourse) return;
    
    try {
      const course = courses.find(c => c.id === selectedCourse);
      if (course?.department) {
        const pos = await api.getProgramOutcomes({ department: course.department });
        setProgramOutcomes(Array.isArray(pos) ? pos : []);
      }
    } catch (error) {
      console.error('Error loading program outcomes:', error);
    }
  };

  if (!mounted || !themeMounted) {
    return null;
  }

  const whiteText = text;
  const accentIconClass = isDark ? 'text-indigo-400' : 'text-indigo-600';

  // Learning Outcome silme
  const handleDeleteLO = async (loId: number) => {
    if (!confirm('Are you sure you want to delete this Learning Outcome?')) {
      return;
    }

    try {
      await api.deleteLearningOutcome(loId);
      setLearningOutcomes(learningOutcomes.filter(lo => lo.id !== loId));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error deleting learning outcome:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Yeni Learning Outcome oluşturma
  const handleCreateLO = async () => {
    if (!newLO.code || !newLO.title || !newLO.description) {
      alert('Please fill in all required fields (Code, Title, Description).');
      return;
    }

    if (!selectedCourse) {
      alert('Please select a course first.');
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const createdLO = await api.createLearningOutcome({
        code: newLO.code.toUpperCase(),
        title: newLO.title,
        description: newLO.description,
        course: selectedCourse,
        target_percentage: newLO.target_percentage,
        is_active: true
      });

      setLearningOutcomes([...learningOutcomes, createdLO]);
      setNewLO({ code: '', title: '', description: '', target_percentage: 70 });
      setShowCreateLO(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error: any) {
      console.error('Error creating learning outcome:', error);
      setSaveStatus('error');
      alert(error?.error || 'Error creating Learning Outcome. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Learning Outcome güncelleme
  const handleUpdateLO = async (loId: number, updates: Partial<LearningOutcome>) => {
    try {
      const updatedLO = await api.updateLearningOutcome(loId, updates);
      setLearningOutcomes(learningOutcomes.map(lo => lo.id === loId ? updatedLO : lo));
      setEditingLO(null);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error: any) {
      console.error('Error updating learning outcome:', error);
      setSaveStatus('error');
      alert(error?.error || 'Error updating Learning Outcome. Please try again.');
    }
  };

  // Seçili ders bilgisi
  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <div className="container mx-auto py-0">
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 border-b pb-4 border-gray-500/20"
      >
        <h1 className={`text-3xl font-bold ${whiteText} flex items-center gap-3`}>
          <Target className="w-7 h-7 text-indigo-500" />
          Learning Outcomes Management
        </h1>
      </motion.div>

      {/* Ders Seçimi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl mb-6`}
      >
        <label className={`${mutedText} text-sm font-medium mb-2 block`}>
          <BookOpen className="w-4 h-4 inline mr-1" />
          Select Course
        </label>
        <select
          value={selectedCourse || ''}
          onChange={(e) => {
            setSelectedCourse(Number(e.target.value) || null);
            setSaveStatus(null);
          }}
          className={`w-full md:w-1/2 px-4 py-3 rounded-xl ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        >
          <option value="">-- Select a course --</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name} ({course.semester_display} {course.academic_year})
            </option>
          ))}
        </select>

        {/* Ders Bilgileri */}
        {selectedCourseData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'} border`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className={mutedText}>Course Code:</span>
                <p className={whiteText}>{selectedCourseData.code}</p>
              </div>
              <div>
                <span className={mutedText}>Department:</span>
                <p className={whiteText}>{selectedCourseData.department}</p>
              </div>
              <div>
                <span className={mutedText}>Semester:</span>
                <p className={whiteText}>{selectedCourseData.semester_display} {selectedCourseData.academic_year}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Learning Outcomes Yönetimi */}
      {selectedCourse && (
        <>
          {/* LO Listesi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl mb-6`}
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className={`text-xl font-bold ${whiteText} flex items-center gap-2`}>
                <Target className={`w-5 h-5 ${accentIconClass}`} />
                Learning Outcomes ({learningOutcomes.length})
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateLO(true)}
                className={`px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white flex items-center gap-2 transition-all`}
              >
                <Plus className="w-4 h-4" />
                Create New Learning Outcome
              </motion.button>
            </div>

            {/* LO Listesi */}
            {learningOutcomes.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl`}>
                <Target className={`w-12 h-12 ${mutedText} mx-auto mb-3`} />
                <p className={mutedText}>No Learning Outcomes defined yet.</p>
                <p className={`${mutedText} text-sm mt-1`}>Click "Create New Learning Outcome" to add one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {learningOutcomes.map((lo, index) => {
                  const isEditing = editingLO === lo.id;

                  return (
                    <motion.div
                      key={lo.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className={`p-4 rounded-xl border ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                                  Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={lo.code}
                                  onChange={(e) => handleUpdateLO(lo.id, { code: e.target.value.toUpperCase() })}
                                  className={`w-full p-2 rounded-lg border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                />
                              </div>
                              <div>
                                <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                                  Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={lo.title}
                                  onChange={(e) => handleUpdateLO(lo.id, { title: e.target.value })}
                                  className={`w-full p-2 rounded-lg border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                />
                              </div>
                              <div>
                                <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                                  Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  value={lo.description}
                                  onChange={(e) => handleUpdateLO(lo.id, { description: e.target.value })}
                                  rows={3}
                                  className={`w-full p-2 rounded-lg border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none`}
                                />
                              </div>
                              <div>
                                <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                                  Target Percentage
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={lo.target_percentage}
                                  onChange={(e) => handleUpdateLO(lo.id, { target_percentage: Number(e.target.value) || 70 })}
                                  className={`w-full p-2 rounded-lg border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                />
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setEditingLO(null)}
                                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-all`}
                              >
                                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                                Done Editing
                              </motion.button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`px-3 py-1 rounded-lg ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'} font-bold text-sm`}>
                                  {lo.code}
                                </div>
                                <h3 className={`${whiteText} font-semibold`}>{lo.title}</h3>
                              </div>
                              <p className={`${mutedText} text-sm mb-3`}>{lo.description}</p>
                              <div className="flex items-center gap-4">
                                <span className={`${mutedText} text-xs`}>
                                  Target: {lo.target_percentage}%
                                </span>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setEditingLO(lo.id)}
                                  className={`p-1 rounded ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all`}
                                >
                                  <Edit2 className={`w-4 h-4 ${mutedText}`} />
                                </motion.button>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {!isEditing && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteLO(lo.id)}
                            className={`p-2 rounded-lg ${isDark ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'} transition-all`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Durum Mesajı */}
          {saveStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl flex items-center gap-2 mb-4 ${
                saveStatus === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-500'
                  : 'bg-red-500/10 border-red-500/30 text-red-500'
              } border`}
            >
              {saveStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Learning Outcome saved successfully!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>Error saving. Please try again.</span>
                </>
              )}
            </motion.div>
          )}
        </>
      )}

      {/* Boş Durum */}
      {!selectedCourse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`backdrop-blur-xl ${themeClasses.card} p-12 shadow-2xl rounded-xl text-center`}
        >
          <Target className={`w-16 h-16 ${mutedText} mx-auto mb-4`} />
          <h3 className={`${whiteText} text-xl font-semibold mb-2`}>Select a Course</h3>
          <p className={mutedText}>
            Please select a course from the dropdown above to manage its Learning Outcomes.
          </p>
        </motion.div>
      )}

      {/* Yeni LO Oluşturma Modal */}
      <AnimatePresence>
        {showCreateLO && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateLO(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`fixed inset-0 z-50 flex items-center justify-center p-4`}
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'} w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${whiteText} flex items-center gap-2`}>
                    <Target className="w-6 h-6 text-indigo-500" />
                    Create New Learning Outcome
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowCreateLO(false);
                      setNewLO({ code: '', title: '', description: '', target_percentage: 70 });
                    }}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all`}
                  >
                    <X className={`w-5 h-5 ${mutedText}`} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {/* LO Code */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      LO Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLO.code}
                      onChange={(e) => setNewLO({ ...newLO, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., LO1, CS301-LO1"
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                    <p className={`${mutedText} text-xs mt-1`}>Unique identifier for this Learning Outcome</p>
                  </div>

                  {/* LO Title */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLO.title}
                      onChange={(e) => setNewLO({ ...newLO, title: e.target.value })}
                      placeholder="e.g., Understand Data Structures"
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                  </div>

                  {/* LO Description */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newLO.description}
                      onChange={(e) => setNewLO({ ...newLO, description: e.target.value })}
                      placeholder="Describe what students should achieve through this Learning Outcome..."
                      rows={4}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none resize-none`}
                    />
                  </div>

                  {/* Target Percentage */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      Target Achievement Percentage
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newLO.target_percentage}
                      onChange={(e) => setNewLO({ ...newLO, target_percentage: Number(e.target.value) || 70 })}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                    <p className={`${mutedText} text-xs mt-1`}>Default target percentage for this LO (0-100%)</p>
                  </div>

                  {/* Program Outcomes Mapping */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`block text-sm font-medium ${mutedText}`}>
                        Program Outcomes Contribution (Optional)
                      </label>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (programOutcomes.length === 0) {
                            alert('No program outcomes found for this department. Please create program outcomes first.');
                            return;
                          }
                          setNewLOPOs([...newLOPOs, { program_outcome: programOutcomes[0].id, weight: 1.0 }]);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'} transition-all flex items-center gap-1`}
                      >
                        <Plus className="w-3 h-3" />
                        Add PO
                      </motion.button>
                    </div>
                    <p className={`${mutedText} text-xs mb-3`}>
                      Define how much this Learning Outcome contributes to each Program Outcome (weight: 0.1 - 10.0, default: 1.0 = 100%)
                    </p>
                    {newLOPOs.length === 0 ? (
                      <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'} text-center`}>
                        <p className={mutedText}>No Program Outcomes mapped yet. Click "Add PO" to add one.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {newLOPOs.map((mapping, index) => {
                          const po = programOutcomes.find(p => p.id === mapping.program_outcome);
                          return (
                            <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} flex items-center gap-3`}>
                              <select
                                value={mapping.program_outcome}
                                onChange={(e) => {
                                  const updated = [...newLOPOs];
                                  updated[index].program_outcome = Number(e.target.value);
                                  setNewLOPOs(updated);
                                }}
                                className={`flex-1 p-2 rounded-lg text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:ring-2 focus:ring-indigo-500 outline-none`}
                              >
                                {programOutcomes.map(po => (
                                  <option key={po.id} value={po.id}>{po.code} - {po.title}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min="0.1"
                                max="10.0"
                                step="0.1"
                                value={mapping.weight}
                                onChange={(e) => {
                                  const updated = [...newLOPOs];
                                  updated[index].weight = Number(e.target.value) || 1.0;
                                  setNewLOPOs(updated);
                                }}
                                className="w-24 p-2 rounded-lg text-sm border focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Weight"
                              />
                              <span className={`text-xs ${mutedText}`}>×</span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setNewLOPOs(newLOPOs.filter((_, i) => i !== index));
                                }}
                                className={`p-1.5 rounded ${isDark ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'} transition-all`}
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-500/10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowCreateLO(false);
                      setNewLO({ code: '', title: '', description: '', target_percentage: 70 });
                    }}
                    className={`px-6 py-2 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-all`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateLO}
                    disabled={isSaving || !newLO.code || !newLO.title || !newLO.description}
                    className={`px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Create Learning Outcome
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

