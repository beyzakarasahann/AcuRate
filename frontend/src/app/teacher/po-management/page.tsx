// app/teacher/po-management/page.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, X, Save, BookOpen, AlertCircle, CheckCircle2, Info, Trash2, Edit2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, type Course, type ProgramOutcome } from '@/lib/api';

// --- TİPLER ---

interface CoursePO {
  poId: number;
  weight: number;
  isNew?: boolean;
}

// --- ANA BİLEŞEN ---

export default function POManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcome[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [coursePOs, setCoursePOs] = useState<CoursePO[]>([]);
  const [availablePOs, setAvailablePOs] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [editingPO, setEditingPO] = useState<number | null>(null);
  const [showAddPO, setShowAddPO] = useState(false);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [newPO, setNewPO] = useState({
    code: '',
    title: '',
    description: '',
    target_percentage: 70
  });

  const { 
    isDark, 
    mounted: themeMounted, 
    themeClasses, 
    text, 
    mutedText 
  } = useThemeColors();

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch teacher's courses from dashboard
      const dashboardData = await api.getTeacherDashboard();
      const teacherCourses = dashboardData.courses || [];
      setCourses(Array.isArray(teacherCourses) ? teacherCourses : []);
      
      // Fetch program outcomes for teacher's department
      const teacherDept = dashboardData.teacher?.department;
      if (teacherDept) {
        const pos = await api.getProgramOutcomes({ department: teacherDept });
        setProgramOutcomes(Array.isArray(pos) ? pos : []);
      } else {
        // If no department, fetch all active POs
        const pos = await api.getProgramOutcomes();
        setProgramOutcomes(Array.isArray(pos) ? pos.filter((po: ProgramOutcome) => po.is_active) : []);
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Load CoursePOs when course is selected
  useEffect(() => {
    if (selectedCourse) {
      loadCoursePOs(selectedCourse);
    } else {
      setCoursePOs([]);
      setAvailablePOs([]);
    }
  }, [selectedCourse, programOutcomes]);

  const loadCoursePOs = async (courseId: number) => {
    try {
      // Get course details which should include course_pos
      const course = courses.find(c => c.id === courseId);
      if (course && (course as any).course_pos) {
        const coursePOsData = (course as any).course_pos || [];
        const mappedPOs: CoursePO[] = coursePOsData.map((cpo: any) => ({
          poId: typeof cpo.program_outcome === 'object' ? cpo.program_outcome.id : cpo.program_outcome,
          weight: parseFloat(cpo.weight) || 1.0,
          isNew: false
        }));
        setCoursePOs(mappedPOs);
      } else {
        // If course_pos not in course data, fetch course directly
        try {
          const courseData = await api.getCourse(courseId);
          if ((courseData as any).course_pos) {
            const coursePOsData = (courseData as any).course_pos || [];
            const mappedPOs: CoursePO[] = coursePOsData.map((cpo: any) => ({
              poId: typeof cpo.program_outcome === 'object' ? cpo.program_outcome.id : cpo.program_outcome,
              weight: parseFloat(cpo.weight) || 1.0,
              isNew: false
            }));
            setCoursePOs(mappedPOs);
          } else {
            setCoursePOs([]);
          }
        } catch (err) {
          console.warn('Failed to fetch course details:', err);
          setCoursePOs([]);
        }
      }
    } catch (err) {
      console.error('Failed to load course POs:', err);
      setCoursePOs([]);
    }
  };

  // Update available POs when coursePOs change
  useEffect(() => {
    if (selectedCourse && programOutcomes.length > 0) {
      const assignedPOIds = coursePOs.map(cpo => cpo.poId);
      setAvailablePOs(programOutcomes
        .filter(po => !assignedPOIds.includes(po.id))
        .map(po => po.id)
      );
    }
  }, [selectedCourse, coursePOs, programOutcomes]);

  if (!mounted || !themeMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={mutedText}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`text-center p-6 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const whiteText = text;
  const accentIconClass = isDark ? 'text-indigo-400' : 'text-indigo-600';

  // PO ekleme
  const handleAddPO = (poId: number) => {
    if (!coursePOs.find(cpo => cpo.poId === poId)) {
      setCoursePOs([...coursePOs, { poId, weight: 1.0, isNew: true }]);
      setShowAddPO(false);
    }
  };

  // PO kaldırma
  const handleRemovePO = (poId: number) => {
    setCoursePOs(coursePOs.filter(cpo => cpo.poId !== poId));
    setEditingPO(null);
  };

  // Weight güncelleme
  const handleWeightChange = (poId: number, weight: number) => {
    setCoursePOs(coursePOs.map(cpo => 
      cpo.poId === poId ? { ...cpo, weight: Math.max(0.1, Math.min(10.0, weight)) } : cpo
    ));
  };

  // Kaydetme
  const handleSave = async () => {
    if (!selectedCourse) {
      alert('Please select a course first.');
      return;
    }

    if (coursePOs.length === 0) {
      alert('Please add at least one Program Outcome to the course.');
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Update course with new PO mappings
      // Note: This requires backend support for CoursePO updates
      // For now, we'll use a workaround by updating the course
      const course = courses.find(c => c.id === selectedCourse);
      if (course) {
        // Map coursePOs to the format expected by backend
        const poMappings = coursePOs.map(cpo => ({
          program_outcome: cpo.poId,
          weight: cpo.weight
        }));
        
        // Update course with PO mappings
        // This assumes the backend Course serializer accepts course_pos data
        await api.updateCourse(selectedCourse, {
          ...course,
          course_pos: poMappings
        } as any);
      }

      setIsSaving(false);
      setSaveStatus('success');
      // Remove isNew flags
      setCoursePOs(coursePOs.map(cpo => ({ ...cpo, isNew: false })));
      setTimeout(() => setSaveStatus(null), 3000);
      
      // Reload course data
      await fetchData();
      if (selectedCourse) {
        await loadCoursePOs(selectedCourse);
      }
    } catch (err: any) {
      console.error('Failed to save course POs:', err);
      setIsSaving(false);
      setSaveStatus('error');
      alert(err.message || 'Failed to save Program Outcomes. Please try again.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Seçili ders bilgisi
  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  // PO detaylarını al
  const getPODetails = (poId: number) => {
    return programOutcomes.find(po => po.id === poId);
  };

  // Yeni PO oluşturma
  const handleCreatePO = async () => {
    if (!newPO.code || !newPO.title || !newPO.description) {
      alert('Please fill in all required fields (Code, Title, Description).');
      return;
    }

    setIsSaving(true);
    try {
      // Get teacher's department from dashboard
      const dashboardData = await api.getTeacherDashboard();
      const teacherDept = dashboardData.teacher?.department || '';

      const createdPO = await api.createProgramOutcome({
        code: newPO.code.toUpperCase().trim(),
        title: newPO.title.trim(),
        description: newPO.description.trim(),
        target_percentage: newPO.target_percentage,
        department: teacherDept,
        is_active: true
      });

      // Add to program outcomes list
      setProgramOutcomes([...programOutcomes, createdPO]);
      
      // Add to course immediately
      if (!coursePOs.find(cpo => cpo.poId === createdPO.id)) {
        setCoursePOs([...coursePOs, { poId: createdPO.id, weight: 1.0, isNew: true }]);
      }

      // Clear form and close modal
      setNewPO({ code: '', title: '', description: '', target_percentage: 70 });
      setShowCreatePO(false);
      setIsSaving(false);
    } catch (err: any) {
      console.error('Failed to create PO:', err);
      setIsSaving(false);
      alert(err.message || 'Failed to create Program Outcome. Please try again.');
    }
  };

  // Toplam weight hesapla
  const totalWeight = coursePOs.reduce((sum, cpo) => sum + cpo.weight, 0);

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
          Program Outcomes Management
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
            setCoursePOs([]);
            setAvailablePOs([]);
            setSaveStatus(null);
          }}
          className={`w-full md:w-1/2 px-4 py-3 rounded-xl ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        >
          <option value="">-- Select a course --</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name} {course.semester_display ? `(${course.semester_display})` : ''}
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
                <p className={whiteText}>{selectedCourseData.department || '-'}</p>
              </div>
              <div>
                <span className={mutedText}>Semester:</span>
                <p className={whiteText}>{selectedCourseData.semester_display || '-'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* PO Yönetimi */}
      {selectedCourse && (
        <>
          {/* PO Listesi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl mb-6`}
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className={`text-xl font-bold ${whiteText} flex items-center gap-2`}>
                <Target className={`w-5 h-5 ${accentIconClass}`} />
                Assigned Program Outcomes
              </h2>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreatePO(true)}
                  className={`px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white flex items-center gap-2 transition-all`}
                >
                  <Plus className="w-4 h-4" />
                  Create New PO
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddPO(!showAddPO)}
                  disabled={availablePOs.length === 0}
                  className={`px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Plus className="w-4 h-4" />
                  Add Existing PO
                </motion.button>
              </div>
            </div>

            {/* PO Ekleme Dropdown */}
            <AnimatePresence>
              {showAddPO && availablePOs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border`}
                >
                  <p className={`${mutedText} text-sm mb-2`}>Select a Program Outcome to add:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availablePOs.map(poId => {
                      const po = getPODetails(poId);
                      if (!po) return null;
                      return (
                        <motion.button
                          key={poId}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAddPO(poId)}
                          className={`p-3 rounded-lg text-left ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-white hover:bg-gray-50 border-gray-200'} border transition-all`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`${whiteText} font-medium`}>{po.code}: {po.title}</p>
                              <p className={`${mutedText} text-xs mt-1 line-clamp-1`}>{po.description}</p>
                            </div>
                            <Plus className={`w-5 h-5 ${accentIconClass}`} />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PO Listesi */}
            {coursePOs.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl`}>
                <Target className={`w-12 h-12 ${mutedText} mx-auto mb-3`} />
                <p className={mutedText}>No Program Outcomes assigned yet.</p>
                <p className={`${mutedText} text-sm mt-1`}>Click "Add PO" to assign Program Outcomes to this course.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {coursePOs.map((coursePO, index) => {
                  const po = getPODetails(coursePO.poId);
                  if (!po) return null;
                  const isEditing = editingPO === coursePO.poId;

                  return (
                    <motion.div
                      key={coursePO.poId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className={`p-4 rounded-xl border ${
                        coursePO.isNew 
                          ? isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
                          : isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`px-3 py-1 rounded-lg ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'} font-bold text-sm`}>
                              {po.code}
                            </div>
                            <h3 className={`${whiteText} font-semibold`}>{po.title}</h3>
                            {coursePO.isNew && (
                              <span className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                                New
                              </span>
                            )}
                          </div>
                          <p className={`${mutedText} text-sm mb-3`}>{po.description}</p>
                          
                          {/* Weight Input */}
                          <div className="flex items-center gap-3">
                            <label className={`${mutedText} text-sm font-medium`}>
                              Weight:
                            </label>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0.1"
                                  max="10.0"
                                  step="0.1"
                                  value={coursePO.weight}
                                  onChange={(e) => handleWeightChange(coursePO.poId, parseFloat(e.target.value) || 0.1)}
                                  className={`w-24 px-3 py-1 rounded-lg border ${
                                    isDark
                                      ? 'bg-white/5 border-white/10 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                />
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setEditingPO(null)}
                                  className={`px-3 py-1 rounded-lg ${isDark ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-all`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`${whiteText} font-medium`}>{coursePO.weight.toFixed(1)}</span>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setEditingPO(coursePO.poId)}
                                  className={`p-1 rounded ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all`}
                                >
                                  <Edit2 className={`w-4 h-4 ${mutedText}`} />
                                </motion.button>
                              </div>
                            )}
                            <span className={`${mutedText} text-xs`}>
                              (Target: {po.target_percentage}%)
                            </span>
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemovePO(coursePO.poId)}
                          className={`p-2 rounded-lg ${isDark ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'} transition-all`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Toplam Weight Bilgisi */}
            {coursePOs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-3 rounded-xl ${isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} border flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <Info className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`${mutedText} text-sm`}>Total Weight:</span>
                  <span className={`${whiteText} font-semibold`}>{totalWeight.toFixed(1)}</span>
                </div>
                <span className={`${mutedText} text-xs`}>
                  {totalWeight > 10 ? '⚠️ Exceeds recommended (10.0)' : '✓ Within range'}
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Kaydet Butonu ve Durum */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex-1">
              {saveStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl flex items-center gap-2 ${
                    saveStatus === 'success'
                      ? 'bg-green-500/10 border-green-500/30 text-green-500'
                      : 'bg-red-500/10 border-red-500/30 text-red-500'
                  } border`}
                >
                  {saveStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Program Outcomes saved successfully!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <span>Error saving. Please try again.</span>
                    </>
                  )}
                </motion.div>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving || coursePOs.length === 0}
              className={`px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold`}
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </motion.button>
          </motion.div>
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
            Please select a course from the dropdown above to manage its Program Outcomes.
          </p>
        </motion.div>
      )}

      {/* Yeni PO Oluşturma Modal */}
      <AnimatePresence>
        {showCreatePO && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreatePO(false)}
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
                    Create New Program Outcome
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowCreatePO(false);
                      setNewPO({ code: '', title: '', description: '', target_percentage: 70 });
                    }}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all`}
                  >
                    <X className={`w-5 h-5 ${mutedText}`} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {/* PO Code */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      PO Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPO.code}
                      onChange={(e) => setNewPO({ ...newPO, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., PO9, CUSTOM1"
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                    <p className={`${mutedText} text-xs mt-1`}>Unique identifier for this Program Outcome</p>
                  </div>

                  {/* PO Title */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPO.title}
                      onChange={(e) => setNewPO({ ...newPO, title: e.target.value })}
                      placeholder="e.g., Advanced Problem Solving"
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                  </div>

                  {/* PO Description */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newPO.description}
                      onChange={(e) => setNewPO({ ...newPO, description: e.target.value })}
                      placeholder="Describe what students should achieve through this Program Outcome..."
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
                      value={newPO.target_percentage}
                      onChange={(e) => setNewPO({ ...newPO, target_percentage: Number(e.target.value) || 70 })}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                    />
                    <p className={`${mutedText} text-xs mt-1`}>Default target percentage for this PO (0-100%)</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-500/10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowCreatePO(false);
                      setNewPO({ code: '', title: '', description: '', target_percentage: 70 });
                    }}
                    className={`px-6 py-2 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-all`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreatePO}
                    disabled={!newPO.code || !newPO.title || !newPO.description || isSaving}
                    className={`px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Save className="w-4 h-4" />
                    Create & Add to Course
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
