'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, X, Save, Edit2, Trash2, Building2, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, type ProgramOutcome } from '@/lib/api';

export default function POManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcome[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<ProgramOutcome | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    department: '',
    target_percentage: 70,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const {
    isDark,
    mounted: themeMounted,
    themeClasses,
    text,
    mutedText,
  } = useThemeColors();

  useEffect(() => {
    setMounted(true);
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchProgramOutcomes();
    } else {
      setProgramOutcomes([]);
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const deptData = await api.getDepartments();
      // Remove duplicates by normalizing (trim + case-insensitive), then deduplicate
      const seen = new Set<string>();
      const deptNames = deptData
        .map(dept => dept.name.trim())
        .filter(name => {
          const normalized = name.toLowerCase();
          if (seen.has(normalized)) {
            return false;
          }
          seen.add(normalized);
          return true;
        })
        .sort();
      setDepartments(deptNames);
    } catch (error) {
      console.error('Failed to load departments', error);
    }
  };

  const fetchProgramOutcomes = async () => {
    if (!selectedDepartment) return;
    
    try {
      setLoading(true);
      const pos = await api.getProgramOutcomes({ department: selectedDepartment });
      setProgramOutcomes(pos);
    } catch (error) {
      console.error('Failed to load program outcomes', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.code.trim()) {
      errors.code = 'PO Code is required';
    } else if (formData.code.length > 10) {
      errors.code = 'PO Code must be 10 characters or less';
    }
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.department) {
      errors.department = 'Department is required';
    }
    
    if (formData.target_percentage < 0 || formData.target_percentage > 100) {
      errors.target_percentage = 'Target percentage must be between 0 and 100';
    }

    // Check for duplicate code in the same department
    if (formData.code.trim()) {
      const existingPO = programOutcomes.find(
        po => po.code.toLowerCase() === formData.code.trim().toLowerCase() && 
               po.id !== editingPO?.id
      );
      if (existingPO) {
        errors.code = 'A Program Outcome with this code already exists in this department';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenForm = (po?: ProgramOutcome) => {
    if (po) {
      setEditingPO(po);
      setFormData({
        code: po.code,
        title: po.title,
        description: po.description,
        department: po.department,
        target_percentage: po.target_percentage,
        is_active: typeof po.is_active === 'string' ? po.is_active === 'true' : po.is_active,
      });
    } else {
      setEditingPO(null);
      setFormData({
        code: '',
        title: '',
        description: '',
        department: selectedDepartment,
        target_percentage: 70,
        is_active: true,
      });
    }
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPO(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      department: '',
      target_percentage: 70,
      is_active: true,
    });
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const poData = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        department: formData.department,
        target_percentage: formData.target_percentage,
        is_active: formData.is_active,
      };

      if (editingPO) {
        await api.updateProgramOutcome(editingPO.id, poData);
      } else {
        await api.createProgramOutcome(poData);
      }

      setSaveStatus('success');
      handleCloseForm();
      await fetchProgramOutcomes();
      
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error: any) {
      console.error('Failed to save program outcome', error);
      setSaveStatus('error');
      
      // Handle validation errors from backend
      if (error.errors) {
        setFormErrors(error.errors);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (po: ProgramOutcome) => {
    if (!confirm(`Are you sure you want to delete "${po.code}: ${po.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteProgramOutcome(po.id);
      await fetchProgramOutcomes();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Failed to delete program outcome', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  if (!mounted || !themeMounted) {
    return null;
  }

  const whiteText = text;
  const accentIconClass = isDark ? 'text-indigo-400' : 'text-indigo-600';

  return (
    <div className="container mx-auto py-0">
      {/* Header */}
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

      {/* Department Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl mb-6`}
      >
        <label className={`${mutedText} text-sm font-medium mb-2 block`}>
          <Building2 className="w-4 h-4 inline mr-1" />
          Select Department
        </label>
        <div className="flex items-center gap-3">
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setProgramOutcomes([]);
              setSaveStatus(null);
            }}
            className={`flex-1 px-4 py-3 rounded-xl ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          >
            <option value="">-- Select a department --</option>
            {departments.map((dept, index) => (
              <option key={`${dept}-${index}`} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          {selectedDepartment && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenForm()}
              className={`px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 transition-all font-semibold`}
            >
              <Plus className="w-5 h-5" />
              Add PO
            </motion.button>
          )}
        </div>

        {selectedDepartment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'} border`}
          >
            <div className="flex items-center gap-2">
              <Info className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <p className={`${whiteText} text-sm`}>
                Managing Program Outcomes for <span className="font-semibold">{selectedDepartment}</span>
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Status Messages */}
      {saveStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
            saveStatus === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-500 border'
              : 'bg-red-500/10 border-red-500/30 text-red-500 border'
          }`}
        >
          {saveStatus === 'success' ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Program Outcome saved successfully!</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5" />
              <span>Error saving. Please try again.</span>
            </>
          )}
        </motion.div>
      )}

      {/* PO List */}
      {selectedDepartment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`backdrop-blur-xl ${themeClasses.card} p-6 shadow-2xl rounded-xl mb-6`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${whiteText} flex items-center gap-2`}>
              <Target className={`w-5 h-5 ${accentIconClass}`} />
              Program Outcomes ({programOutcomes.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : programOutcomes.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl`}>
              <Target className={`w-12 h-12 ${mutedText} mx-auto mb-3`} />
              <p className={mutedText}>No Program Outcomes found for this department.</p>
              <p className={`${mutedText} text-sm mt-1`}>Click "Add PO" to create the first one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {programOutcomes.map((po, index) => (
                <motion.div
                  key={po.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={`p-4 rounded-xl border ${
                    !po.is_active
                      ? isDark ? 'bg-gray-500/10 border-gray-500/30 opacity-60' : 'bg-gray-100 border-gray-300 opacity-60'
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
                        {!po.is_active && (
                          <span className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className={`${mutedText} text-sm mb-3`}>{po.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={mutedText}>
                          Target: <span className={`${whiteText} font-semibold`}>{po.target_percentage}%</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleOpenForm(po)}
                        className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'} transition-all`}
                      >
                        <Edit2 className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(po)}
                        className={`p-2 rounded-lg ${isDark ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'} transition-all`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!selectedDepartment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`backdrop-blur-xl ${themeClasses.card} p-12 shadow-2xl rounded-xl text-center`}
        >
          <Target className={`w-16 h-16 ${mutedText} mx-auto mb-4`} />
          <h3 className={`${whiteText} text-xl font-semibold mb-2`}>Select a Department</h3>
          <p className={mutedText}>
            Please select a department from the dropdown above to manage its Program Outcomes.
          </p>
        </motion.div>
      )}

      {/* Create/Edit PO Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseForm}
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
                    {editingPO ? 'Edit Program Outcome' : 'Create New Program Outcome'}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCloseForm}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all`}
                  >
                    <X className={`w-5 h-5 ${mutedText}`} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {/* Department */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none`}
                      disabled={!!editingPO}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((dept, index) => (
                        <option key={`${dept}-${index}`} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {formErrors.department && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.department}</p>
                    )}
                  </div>

                  {/* PO Code */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      PO Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., PO1, PO2"
                      maxLength={10}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.code ? 'border-red-500' : ''}`}
                    />
                    {formErrors.code && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.code}</p>
                    )}
                    <p className={`${mutedText} text-xs mt-1`}>Unique identifier (max 10 characters)</p>
                  </div>

                  {/* PO Title */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Engineering Knowledge"
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.title ? 'border-red-500' : ''}`}
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                    )}
                  </div>

                  {/* PO Description */}
                  <div>
                    <label className={`block text-sm font-medium ${mutedText} mb-1`}>
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what students should achieve through this Program Outcome..."
                      rows={4}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none resize-none ${formErrors.description ? 'border-red-500' : ''}`}
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                    )}
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
                      step="0.1"
                      value={formData.target_percentage}
                      onChange={(e) => setFormData({ ...formData, target_percentage: Number(e.target.value) || 70 })}
                      className={`w-full p-3 rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'} border transition-colors focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.target_percentage ? 'border-red-500' : ''}`}
                    />
                    {formErrors.target_percentage && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.target_percentage}</p>
                    )}
                    <p className={`${mutedText} text-xs mt-1`}>Default target percentage (0-100%)</p>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="is_active" className={`${whiteText} text-sm font-medium`}>
                      Active (PO is currently in use)
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-500/10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCloseForm}
                    className={`px-6 py-2 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-all`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: isSaving ? 1 : 1.05 }}
                    whileTap={{ scale: isSaving ? 1 : 0.95 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingPO ? 'Update' : 'Create'} Program Outcome
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

