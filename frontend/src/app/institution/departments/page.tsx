'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Building2, PlusCircle, RefreshCw, Search, Users, BookOpen, Award, Edit2, Trash2, X, Loader2, Calendar, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Inter } from 'next/font/google';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

interface Department {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  students?: number;
  courses?: number;
  faculty?: number;
  avg_grade?: number | null;
  po_achievement?: number | null;
  status?: 'excellent' | 'good' | 'needs-attention';
}

interface CreateDepartmentForm {
  name: string;
  code: string;
  description: string;
  contact_email: string;
  contact_phone: string;
}

export default function DepartmentsPage() {
  const [mounted, setMounted] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<CreateDepartmentForm>({ 
    name: '',
    code: '',
    description: '',
    contact_email: '',
    contact_phone: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [coursesToAdd, setCoursesToAdd] = useState<any[]>([]);
  const [curriculumModalOpen, setCurriculumModalOpen] = useState(false);
  const [selectedDepartmentForCurriculum, setSelectedDepartmentForCurriculum] = useState<string | null>(null);
  const [curriculumData, setCurriculumData] = useState<any>(null);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [courseEditModalOpen, setCourseEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState<any>({
    code: '',
    name: '',
    description: '',
    credits: 3,
    semester: 1, // 1=Fall, 2=Spring, 3=Summer
    year: null, // Year of study (1-6, optional)
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    teacher: null,
  });
  const [savingCourse, setSavingCourse] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [currentEnrollments, setCurrentEnrollments] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editForm, setEditForm] = useState<CreateDepartmentForm>({ 
    name: '',
    code: '',
    description: '',
    contact_email: '',
    contact_phone: '',
  });
  const [updating, setUpdating] = useState(false);

  const {
    mounted: themeMounted,
    themeClasses,
    text,
    mutedText,
    isDark,
  } = useThemeColors();

  useEffect(() => {
    setMounted(true);
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      // Fetch analytics data for display (with stats)
      const analyticsData = await api.getDepartments();
      
      // Fetch full department list from backend for CRUD operations
      const departmentsList = await api.getDepartmentsList();
      
      // Merge analytics data with full department data
      const merged = analyticsData.map((dept: any) => {
        const fullDept = departmentsList.find((d: any) => d.name === dept.name);
        return {
          ...dept,
          id: fullDept?.id,
          code: fullDept?.code || dept.code,
          description: fullDept?.description || dept.description,
          contact_email: fullDept?.contact_email || dept.contact_email,
          contact_phone: fullDept?.contact_phone || dept.contact_phone,
        };
      });
      
      // Add departments from backend that might not be in analytics yet
      departmentsList.forEach((dept: any) => {
        if (!merged.find((d: any) => d.name === dept.name)) {
          merged.push({
            ...dept,
            students: 0,
            courses: 0,
            faculty: 0,
            avg_grade: null,
            po_achievement: null,
            status: 'needs-attention' as const,
          });
        }
      });
      
      setDepartments(merged);
    } catch (error: any) {
      console.error('Failed to load departments', error);
      toast.error('Failed to load departments. Please refresh the page.');
      // Fallback: try to load just the list if analytics fails
      try {
        const departmentsList = await api.getDepartmentsList();
        setDepartments(departmentsList.map((d: any) => ({
          ...d,
          students: 0,
          courses: 0,
          faculty: 0,
          avg_grade: null,
          po_achievement: null,
          status: 'needs-attention' as const,
        })));
      } catch (fallbackError: any) {
        console.error('Failed to load departments list', fallbackError);
        toast.error('Failed to load departments list.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearch(query);
  };

  const filteredDepartments = departments
    .filter(dept => dept.name.toLowerCase().includes(search.toLowerCase()))
    // Remove duplicates by name (keep first occurrence)
    .filter((dept, index, self) => 
      index === self.findIndex(d => d.name.toLowerCase() === dept.name.toLowerCase())
    );

  const handleInputChange = (field: keyof CreateDepartmentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormError(null);
    setFormSuccess(null);
    setForm({ 
      name: '',
      code: '',
      description: '',
      contact_email: '',
      contact_phone: '',
    });
    setCoursesToAdd([]);
  };

  useEffect(() => {
    // Load teachers when form opens
    if (isFormOpen && teachers.length === 0) {
      const loadTeachers = async () => {
        try {
          const teachersData = await api.getUsers({ role: 'TEACHER' });
          setTeachers(teachersData || []);
        } catch (error) {
          console.error('Failed to load teachers', error);
        }
      };
      loadTeachers();
    }
  }, [isFormOpen]);

  const handleCreateDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!form.name.trim()) {
      const errorMsg = 'Department name is required.';
      setFormError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (form.code && form.code.length > 10) {
      const errorMsg = 'Department code must be 10 characters or less.';
      setFormError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) {
      const errorMsg = 'Please enter a valid email address.';
      setFormError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Check if department already exists
    if (departments.some(dept => dept.name.toLowerCase() === form.name.trim().toLowerCase())) {
      const errorMsg = 'Department already exists.';
      setFormError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const toastId = toast.loading('Creating department...');
    try {
      setCreating(true);
      
      // Create department via API
      const departmentData = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        contact_email: form.contact_email.trim() || undefined,
        contact_phone: form.contact_phone.trim() || undefined,
      };
      
      const createdDept = await api.createDepartment(departmentData);
      const departmentName = createdDept.name;
      
      // Create courses if any were added
      if (coursesToAdd.length > 0) {
        try {
          await Promise.all(
            coursesToAdd.map(course =>
              api.createCourse({
                code: course.code,
                name: course.name,
                description: course.description || '',
                credits: course.credits,
                semester: course.semester,
                academic_year: course.academic_year,
                department: departmentName,
                teacher: course.teacher || null,
              })
            )
          );
        } catch (courseError: any) {
          console.error('Failed to create some courses', courseError);
          const msg = `Department created, but some courses failed: ${courseError.message}`;
          toast.error(msg, { id: toastId });
          setFormSuccess(msg);
          await fetchDepartments();
          setTimeout(() => {
            handleCloseForm();
            setFormSuccess(null);
          }, 2000);
          return;
        }
      }
      
      // Reload departments list
      await fetchDepartments();
      
      if (coursesToAdd.length > 0) {
        toast.success(`Department and ${coursesToAdd.length} course(s) created successfully!`, { id: toastId });
        setFormSuccess(`Department and ${coursesToAdd.length} course(s) created successfully.`);
      } else {
        toast.success('Department created successfully!', { id: toastId });
        setFormSuccess('Department created successfully.');
      }
      
      setTimeout(() => {
        handleCloseForm();
        setFormSuccess(null);
      }, 1000);
    } catch (error: any) {
      console.error('Failed to create department', error);
      const errorMsg = error.message || 'Failed to create department. Please try again.';
      toast.error(errorMsg, { id: toastId });
      setFormError(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDepartment = async (departmentName: string) => {
    if (!confirm(`Are you sure you want to delete "${departmentName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const department = departments.find(dept => dept.name === departmentName);
      if (department && department.id) {
        await api.deleteDepartment(department.id);
        await fetchDepartments();
      } else {
        // Fallback: if no ID, try to find by name from backend
        const allDepts = await api.getDepartmentsList();
        const deptToDelete = allDepts.find(d => d.name === departmentName);
        if (deptToDelete) {
          await api.deleteDepartment(deptToDelete.id);
          await fetchDepartments();
        } else {
          throw new Error('Department not found');
        }
      }
    } catch (error: any) {
      console.error('Failed to delete department', error);
      alert(`Failed to delete department: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setEditForm({
      name: department.name || '',
      code: department.code || '',
      description: department.description || '',
      contact_email: department.contact_email || '',
      contact_phone: department.contact_phone || '',
    });
    setEditModalOpen(true);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCloseEditForm = () => {
    setEditModalOpen(false);
    setEditingDepartment(null);
    setEditForm({ 
      name: '',
      code: '',
      description: '',
      contact_email: '',
      contact_phone: '',
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleUpdateDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!editForm.name.trim()) {
      setFormError('Department name is required.');
      return;
    }

    if (editForm.code && editForm.code.length > 10) {
      setFormError('Department code must be 10 characters or less.');
      return;
    }

    if (editForm.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.contact_email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    // Check if department name already exists (excluding the current department)
    if (editingDepartment && editForm.name.trim().toLowerCase() !== editingDepartment.name.toLowerCase()) {
      if (departments.some(dept => dept.name.toLowerCase() === editForm.name.trim().toLowerCase())) {
        setFormError('Department name already exists.');
        return;
      }
    }

    if (!editingDepartment || !editingDepartment.id) {
      setFormError('Department ID not found.');
      return;
    }

    try {
      setUpdating(true);
      
      // Update department via API
      const updateData = {
        name: editForm.name.trim(),
        code: editForm.code.trim() || undefined,
        description: editForm.description.trim() || undefined,
        contact_email: editForm.contact_email.trim() || undefined,
        contact_phone: editForm.contact_phone.trim() || undefined,
      };
      
      await api.updateDepartment(editingDepartment.id, updateData);
      
      // Reload departments list
      await fetchDepartments();
      
      setFormSuccess('Department updated successfully!');
      setTimeout(() => {
        handleCloseEditForm();
      }, 1500);
    } catch (error: any) {
      console.error('Failed to update department', error);
      setFormError(error.message || 'Failed to update department. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewCurriculum = async (departmentName: string) => {
    setSelectedDepartmentForCurriculum(departmentName);
    setCurriculumModalOpen(true);
    setLoadingCurriculum(true);
    setCurriculumData(null);

    try {
      const [curriculumResponse, teachersResponse] = await Promise.all([
        api.getDepartmentCurriculum(departmentName),
        api.getUsers({ role: 'TEACHER' })
      ]);
      setCurriculumData(curriculumResponse);
      setTeachers(teachersResponse || []);
    } catch (error: any) {
      console.error('Failed to load curriculum', error);
      setCurriculumData({ error: error.message || 'Failed to load curriculum' });
    } finally {
      setLoadingCurriculum(false);
    }
  };

  const handleEditCourse = async (course: any) => {
    setEditingCourse(course);
    setCourseForm({
      code: course.course_code || '',
      name: course.course_name || '',
      description: course.description || '',
      credits: course.credits || 3,
      semester: course.semester === 'Fall' ? 1 : course.semester === 'Spring' ? 2 : 3,
      academic_year: course.academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      teacher: null, // Will need to find teacher by name or ID
    });
    
    // Fetch current enrollments for this course
    try {
      const enrollments = await api.getEnrollments({ course: course.course_id });
      setCurrentEnrollments(enrollments);
      setSelectedStudents(enrollments.map((e: any) => e.student));
    } catch (error) {
      console.error('Failed to load enrollments', error);
      setCurrentEnrollments([]);
      setSelectedStudents([]);
    }
    
    setCourseEditModalOpen(true);
  };

  const handleAddCourse = (year: number, semester: number) => {
    setEditingCourse(null);
    setCourseForm({
      code: '',
      name: '',
      description: '',
      credits: 3,
      semester: semester,
      academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      teacher: null,
    });
    setCurrentEnrollments([]);
    setSelectedStudents([]);
    setCourseEditModalOpen(true);
  };
  
  // Fetch students when course modal opens
  useEffect(() => {
    if (courseEditModalOpen && selectedDepartmentForCurriculum) {
      const fetchStudents = async () => {
        try {
          setLoadingStudents(true);
          const studentsData = await api.getStudents({ department: selectedDepartmentForCurriculum });
          setStudents(studentsData || []);
        } catch (error) {
          console.error('Failed to load students', error);
          setStudents([]);
        } finally {
          setLoadingStudents(false);
        }
      };
      fetchStudents();
    } else {
      // Clear students when modal closes
      setStudents([]);
      setLoadingStudents(false);
    }
  }, [courseEditModalOpen, selectedDepartmentForCurriculum]);

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If this is a temporary course for create form
    if (courseForm.isTemp) {
      // Add to coursesToAdd list
      setCoursesToAdd([...coursesToAdd, {
        ...courseForm,
        tempId: Date.now(),
      }]);
      setCourseEditModalOpen(false);
      setCourseForm({
        code: '',
        name: '',
        description: '',
        credits: 3,
        semester: 1,
        academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        teacher: null,
      });
      return;
    }

    if (!selectedDepartmentForCurriculum) return;

    setSavingCourse(true);
    try {
      const courseData = {
        ...courseForm,
        department: selectedDepartmentForCurriculum,
      };

      let courseId: number;
      if (editingCourse) {
        await api.updateCourse(editingCourse.course_id, courseData);
        courseId = editingCourse.course_id;
      } else {
        const newCourse = await api.createCourse(courseData);
        courseId = newCourse.id;
      }

      // Handle student enrollments
      if (courseId) {
        // Get currently enrolled student IDs
        const currentEnrolledStudentIds = currentEnrollments.map((e: any) => e.student);
        
        // Find students to add (in selectedStudents but not in currentEnrolledStudentIds)
        const studentsToAdd = selectedStudents.filter(
          studentId => !currentEnrolledStudentIds.includes(studentId)
        );
        
        // Find students to remove (in currentEnrolledStudentIds but not in selectedStudents)
        const studentsToRemove = currentEnrolledStudentIds.filter(
          studentId => !selectedStudents.includes(studentId)
        );
        
        // Create new enrollments
        for (const studentId of studentsToAdd) {
          try {
            await api.createEnrollment({
              student: studentId,
              course: courseId,
              is_active: true,
            });
          } catch (error: any) {
            console.error(`Failed to enroll student ${studentId}`, error);
            // Continue with other enrollments even if one fails
          }
        }
        
        // Delete removed enrollments
        for (const enrollment of currentEnrollments) {
          if (studentsToRemove.includes(enrollment.student)) {
            try {
              await api.deleteEnrollment(enrollment.id);
            } catch (error: any) {
              console.error(`Failed to remove enrollment ${enrollment.id}`, error);
              // Continue with other removals even if one fails
            }
          }
        }
      }

      // Reload curriculum
      const data = await api.getDepartmentCurriculum(selectedDepartmentForCurriculum);
      setCurriculumData(data);
      setCourseEditModalOpen(false);
      setEditingCourse(null);
      setSelectedStudents([]);
      setCurrentEnrollments([]);
      toast.success(editingCourse ? 'Course updated successfully' : 'Course created successfully');
    } catch (error: any) {
      console.error('Failed to save course', error);
      toast.error(error.message || 'Failed to save course');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    if (!selectedDepartmentForCurriculum) return;

    try {
      await api.deleteCourse(courseId);
      // Reload curriculum
      const data = await api.getDepartmentCurriculum(selectedDepartmentForCurriculum);
      setCurriculumData(data);
    } catch (error: any) {
      console.error('Failed to delete course', error);
      alert(error.message || 'Failed to delete course');
    }
  };

  const handleCloseCourseModal = () => {
    setCourseEditModalOpen(false);
    setEditingCourse(null);
    setCourseForm({
      code: '',
      name: '',
      description: '',
      credits: 3,
      semester: 1,
      year: null,
      academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      teacher: null,
      isTemp: false,
    });
    setSelectedStudents([]);
    setCurrentEnrollments([]);
  };
  
  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };


  if (!mounted || !themeMounted) {
    return null;
  }

  return (
    <div className={`${inter.variable} font-sans`} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      <div className="space-y-8">
        {/* Unified Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-xl ${themeClasses.card} rounded-3xl p-8 shadow-lg ${isDark ? 'shadow-purple-500/5 border border-white/5' : 'shadow-gray-200/50 border border-gray-100'}`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <p className={`text-sm font-medium ${mutedText} tracking-wide uppercase`}>Organization Management</p>
              <h1 className={`text-4xl font-bold ${text} tracking-tight`}>Departments</h1>
              <p className={`text-base ${mutedText} mt-2`}>Manage academic departments and their configurations.</p>
            </div>
            
            {/* Unified Search, Refresh, and Add Department Bar */}
            <div className="flex items-center gap-3 flex-1 lg:flex-initial lg:max-w-2xl">
              <div className="flex-1 relative">
                <Search className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-purple-400/60' : 'text-purple-500/60'}`} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search departments..."
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchDepartments}
                disabled={loading}
                className={`px-5 py-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-2.5 font-medium text-sm ${isDark ? 'bg-white/[0.05] border-white/10 text-white hover:bg-white/[0.08]' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsFormOpen(true)}
                className={`px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center gap-2.5 ${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'}`}
              >
                <PlusCircle className="w-4 h-4" />
                Add Department
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Departments Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                <p className={mutedText}>Loading departments...</p>
              </div>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className={`backdrop-blur-xl ${themeClasses.card} rounded-3xl p-16 shadow-lg ${isDark ? 'shadow-purple-500/5 border border-white/5' : 'shadow-gray-200/50 border border-gray-100'} text-center`}>
              <Building2 className={`w-16 h-16 mx-auto mb-4 ${mutedText} opacity-50`} />
              <p className={`${text} font-semibold text-lg mb-2`}>No departments found</p>
              <p className={`text-sm ${mutedText}`}>
                {search ? 'Try adjusting your search criteria' : 'Get started by creating your first department'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepartments.map((department, index) => (
                <motion.div
                  key={`${department.name}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className={`group backdrop-blur-xl ${themeClasses.card} rounded-2xl p-6 shadow-lg ${isDark ? 'shadow-purple-500/5 border border-white/5 hover:border-white/10' : 'shadow-gray-200/50 border border-gray-100 hover:border-gray-200'} transition-all duration-200 cursor-pointer`}
                  onClick={() => handleViewCurriculum(department.name)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                          <Building2 className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                        <h3 className={`font-bold ${text} text-lg`}>{department.name}</h3>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                        department.status === 'excellent' 
                          ? (isDark ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200')
                          : department.status === 'good'
                          ? (isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200')
                          : (isDark ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200')
                      }`}>
                        {department.status === 'excellent' ? '🏆 Excellent' : 
                         department.status === 'good' ? '✓ Good' : '⚠ Needs Attention'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCurriculum(department.name);
                        }}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-indigo-500/20 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'}`}
                        title="View Curriculum"
                      >
                        <BookOpen className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditDepartment(department);
                        }}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                        title="Edit Department"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDepartment(department.name);
                        }}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className={`w-4 h-4 ${mutedText}`} />
                          <span className={`text-xs font-medium uppercase tracking-wider ${mutedText}`}>Students</span>
                        </div>
                        <p className={`text-2xl font-bold ${text}`}>{department.students}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className={`w-4 h-4 ${mutedText}`} />
                          <span className={`text-xs font-medium uppercase tracking-wider ${mutedText}`}>Faculty</span>
                        </div>
                        <p className={`text-2xl font-bold ${text}`}>{department.faculty}</p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className={`w-4 h-4 ${mutedText}`} />
                        <span className={`text-xs font-medium uppercase tracking-wider ${mutedText}`}>Courses</span>
                      </div>
                      <p className={`text-2xl font-bold ${text}`}>{department.courses}</p>
                    </div>
                    {department.avg_grade !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={mutedText}>Avg Grade</span>
                          <span className={`font-semibold ${text}`}>{department.avg_grade}%</span>
                        </div>
                        <div className={`h-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${department.avg_grade}%` }}
                            transition={{ duration: 1 }}
                            style={{
                              backgroundImage: `linear-gradient(to right, 
                                ${(department.avg_grade ?? 0) >= 85 ? '#10B981' : (department.avg_grade ?? 0) >= 75 ? '#3B82F6' : '#F97316'}, 
                                ${(department.avg_grade ?? 0) >= 85 ? '#059669' : (department.avg_grade ?? 0) >= 75 ? '#06B6D4' : '#EF4444'}
                              )` 
                            }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>
                    )}
                    {department.po_achievement !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={mutedText}>PO Achievement</span>
                          <span className={`font-semibold ${text}`}>{department.po_achievement}%</span>
                        </div>
                        <div className={`h-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${department.po_achievement}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            style={{
                              backgroundImage: `linear-gradient(to right, 
                                ${(department.po_achievement ?? 0) >= 80 ? '#10B981' : (department.po_achievement ?? 0) >= 70 ? '#3B82F6' : '#F97316'}, 
                                ${(department.po_achievement ?? 0) >= 80 ? '#059669' : (department.po_achievement ?? 0) >= 70 ? '#06B6D4' : '#EF4444'}
                              )` 
                            }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Create Department Modal */}
        <AnimatePresence>
          {isFormOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleCloseForm}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}
              >
                {/* Header */}
                <div className={`flex items-center justify-between p-8 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                      <PlusCircle className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${text}`}>Create Department</h2>
                      <p className={`text-sm ${mutedText} mt-1`}>Add a new academic department</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCloseForm}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-8">
                  <form className="space-y-8" onSubmit={handleCreateDepartment}>
                    {/* Basic Information Section */}
                    <div>
                      <h3 className={`text-lg font-bold ${text} mb-6 pb-3 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                        Basic Information
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                        Department Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g. Computer Engineering"
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                        required
                      />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                              Department Code
                            </label>
                            <input
                              type="text"
                              value={form.code}
                              onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                              placeholder="e.g. CS, EE, ME"
                              maxLength={10}
                              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                            />
                            <p className={`text-xs ${mutedText} mt-1`}>Short code or abbreviation (optional, max 10 characters)</p>
                          </div>
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Description
                          </label>
                          <textarea
                            value={form.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Brief description of the department's focus, goals, and academic programs..."
                            rows={4}
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium resize-y`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div>
                      <h3 className={`text-lg font-bold ${text} mb-6 pb-3 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Contact Email
                          </label>
                          <input
                            type="email"
                            value={form.contact_email}
                            onChange={(e) => handleInputChange('contact_email', e.target.value)}
                            placeholder="department@university.edu"
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                          />
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Contact Phone
                          </label>
                          <input
                            type="tel"
                            value={form.contact_phone}
                            onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Initial Curriculum Section */}
                    <div className={`pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className={`text-lg font-bold ${text}`}>Initial Curriculum</h3>
                          <p className={`text-sm ${mutedText} mt-1`}>Add courses to the department curriculum (optional)</p>
                        </div>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const tempCourse = {
                              code: '',
                              name: '',
                              description: '',
                              credits: 3,
                              semester: 1,
                              year: null,
                              academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
                              teacher: null,
                              tempId: Date.now(),
                            };
                            setCourseForm({
                              ...tempCourse,
                              isTemp: true,
                            });
                            setCourseEditModalOpen(true);
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            isDark 
                              ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30' 
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          <PlusCircle className="w-4 h-4" />
                          Add Course
                        </motion.button>
                      </div>

                      {coursesToAdd.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Course Code</th>
                                <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Course Name</th>
                                <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Year</th>
                                <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Semester</th>
                                <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Credits</th>
                                <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Instructor</th>
                                <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {coursesToAdd.map((course, idx) => (
                                <tr
                                  key={course.tempId || idx}
                                  className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                                >
                                  <td className={`py-3 px-4 font-semibold text-sm ${text}`}>{course.code}</td>
                                  <td className={`py-3 px-4 text-sm ${text}`}>{course.name}</td>
                                  <td className={`py-3 px-4 text-center text-sm ${text}`}>{course.year ? `Year ${course.year}` : '-'}</td>
                                  <td className={`py-3 px-4 text-center`}>
                                    <span className={`text-xs px-2 py-1 rounded font-semibold ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                                      {course.semester === 1 ? 'Fall' : course.semester === 2 ? 'Spring' : 'Summer'}
                                    </span>
                                  </td>
                                  <td className={`py-3 px-4 text-center font-semibold text-sm ${text}`}>{course.credits}</td>
                                  <td className={`py-3 px-4 text-center text-sm ${mutedText}`}>
                                    {course.teacher && teachers.find(t => t.id === parseInt(course.teacher)) 
                                      ? `${teachers.find(t => t.id === parseInt(course.teacher))?.first_name} ${teachers.find(t => t.id === parseInt(course.teacher))?.last_name}`
                                      : 'TBA'}
                                  </td>
                                  <td className={`py-3 px-4 text-center`}>
                                    <motion.button
                                      type="button"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => setCoursesToAdd(coursesToAdd.filter((c, i) => (c.tempId || i) !== (course.tempId || idx)))}
                                      className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className={`p-8 rounded-xl border-2 border-dashed text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                          <BookOpen className={`w-12 h-12 mx-auto mb-3 ${mutedText} opacity-50`} />
                          <p className={`text-sm ${mutedText} mb-4`}>No courses added yet. Add courses to create the initial curriculum.</p>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const tempCourse = {
                                code: '',
                                name: '',
                                description: '',
                                credits: 3,
                                semester: 1,
                                year: 1,
                                academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
                                teacher: null,
                                tempId: Date.now(),
                              };
                              setCourseForm({
                                ...tempCourse,
                                isTemp: true,
                              });
                              setCourseEditModalOpen(true);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 mx-auto ${
                              isDark 
                                ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30' 
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            <PlusCircle className="w-4 h-4" />
                            Add First Course
                          </motion.button>
                        </div>
                      )}
                    </div>

                    {formError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3.5 rounded-xl text-sm font-medium ${isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200'}`}
                      >
                        {formError}
                      </motion.div>
                    )}
                    {formSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3.5 rounded-xl text-sm font-medium ${isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200'}`}
                      >
                        {formSuccess}
                      </motion.div>
                    )}

                    {/* Footer with Submit Button */}
                    <div className={`pt-6 mt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-end gap-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCloseForm}
                          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${isDark ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: creating ? 1 : 1.02 }}
                          whileTap={{ scale: creating ? 1 : 0.98 }}
                          disabled={creating}
                          className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2.5 ${creating ? 'opacity-70 cursor-not-allowed' : ''} ${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'}`}
                        >
                          {creating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-4 h-4" />
                              Create Department
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </form>
                </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Edit Department Modal */}
        <AnimatePresence>
          {editModalOpen && editingDepartment && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseEditForm}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}
                >
                  {/* Header */}
                  <div className={`flex items-center justify-between p-8 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                        <Edit2 className="w-5 h-5 text-purple-500" />
      </div>
                      <div>
                        <h2 className={`text-2xl font-bold ${text}`}>
                          Edit Department
                        </h2>
                        <p className={`text-sm ${mutedText} mt-1`}>
                          Update department information
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCloseEditForm}
                      className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleUpdateDepartment} className="flex-1 overflow-y-auto p-8">
                    <div className="space-y-6">
                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Department Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => {
                            const field = 'name' as keyof CreateDepartmentForm;
                            setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
                          }}
                          placeholder="e.g. Computer Science"
                          required
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Department Code
                        </label>
                        <input
                          type="text"
                          value={editForm.code}
                          onChange={(e) => {
                            const field = 'code' as keyof CreateDepartmentForm;
                            setEditForm((prev) => ({ ...prev, [field]: e.target.value.toUpperCase() }));
                          }}
                          placeholder="e.g. CS, EE, ME"
                          maxLength={10}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                        />
                        <p className={`${mutedText} text-xs mt-1`}>Max 10 characters. Used for short identification.</p>
                      </div>

                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Description
                        </label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => {
                            const field = 'description' as keyof CreateDepartmentForm;
                            setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
                          }}
                          placeholder="A brief description of the department's focus and goals."
                          rows={3}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium resize-y`}
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={editForm.contact_email}
                          onChange={(e) => {
                            const field = 'contact_email' as keyof CreateDepartmentForm;
                            setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
                          }}
                          placeholder="department@university.edu"
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Contact Phone
                        </label>
                        <input
                          type="text"
                          value={editForm.contact_phone}
                          onChange={(e) => {
                            const field = 'contact_phone' as keyof CreateDepartmentForm;
                            setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
                          }}
                          placeholder="+1 (555) 123-4567"
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none text-sm font-medium`}
                        />
                      </div>

                      {formError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3.5 rounded-xl text-sm font-medium ${isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200'}`}
                        >
                          {formError}
                        </motion.div>
                      )}

                      {formSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3.5 rounded-xl text-sm font-medium ${isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200'}`}
                        >
                          {formSuccess}
                        </motion.div>
                      )}

                      <div className="flex items-center gap-4 pt-4">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCloseEditForm}
                          className={`flex-1 px-5 py-3.5 rounded-xl border transition-all duration-200 font-semibold text-sm ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={updating}
                          className={`flex-1 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'} ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {updating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Edit2 className="w-4 h-4" />
                              Update Department
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Curriculum Modal */}
        <AnimatePresence>
          {curriculumModalOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setCurriculumModalOpen(false);
                  setSelectedDepartmentForCurriculum(null);
                  setCurriculumData(null);
                }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}
                >
                  {/* Header */}
                  <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                        <GraduationCap className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h2 className={`text-2xl font-bold ${text}`}>
                          {selectedDepartmentForCurriculum} - Curriculum
                        </h2>
                        <p className={`text-sm ${mutedText} mt-1`}>
                          View all courses organized by year and semester
                        </p>
                        <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                          <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                            💡 <strong>Note:</strong> To add, edit, or delete courses, please go to the <strong>Lessons</strong> page.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.a
                        href="/institution/lessons"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          isDark 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        Manage Courses
                      </motion.a>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setCurriculumModalOpen(false);
                          setSelectedDepartmentForCurriculum(null);
                          setCurriculumData(null);
                        }}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {loadingCurriculum ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center space-y-4">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                          <p className={mutedText}>Loading curriculum...</p>
                        </div>
                      </div>
                    ) : curriculumData?.error ? (
                      <div className={`p-6 rounded-xl border ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'} text-center`}>
                        <p className="font-medium">{curriculumData.error}</p>
                      </div>
                    ) : !curriculumData?.curriculum || curriculumData.curriculum.length === 0 ? (
                      <div className="text-center py-16">
                        <BookOpen className={`w-16 h-16 mx-auto mb-4 ${mutedText} opacity-50`} />
                        <p className={`${text} font-semibold text-lg mb-2`}>No curriculum found</p>
                        <p className={`text-sm ${mutedText}`}>
                          No courses found for this department
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Summary Stats */}
                        <div className={`grid grid-cols-3 gap-4 p-4 rounded-xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-200'}`}>
                          <div className="text-center">
                            <p className={`text-xs ${mutedText} mb-1`}>Total Years</p>
                            <p className={`text-2xl font-bold ${text}`}>{curriculumData.total_years}</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-xs ${mutedText} mb-1`}>Total Credits</p>
                            <p className={`text-2xl font-bold ${text}`}>{curriculumData.total_credits}</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-xs ${mutedText} mb-1`}>Total Courses</p>
                            <p className={`text-2xl font-bold ${text}`}>
                              {curriculumData.curriculum.reduce((sum: number, year: any) => 
                                sum + year.fall_semester.length + year.spring_semester.length + year.summer_semester.length, 0
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Curriculum by Year - All Years Displayed */}
                        {curriculumData.curriculum.map((yearData: any, yearIndex: number) => {
                          const totalCreditsYear = yearData.total_credits_fall + yearData.total_credits_spring + yearData.total_credits_summer;
                          const totalCoursesYear = yearData.fall_semester.length + yearData.spring_semester.length + yearData.summer_semester.length;
                          
                          // Calculate semester numbers for each year
                          const fallSemesterNum = (yearData.year - 1) * 2 + 1;
                          const springSemesterNum = (yearData.year - 1) * 2 + 2;

                          return (
                            <motion.div
                              key={yearData.year}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: yearIndex * 0.05 }}
                              className={`rounded-xl border ${isDark ? 'bg-gray-900/50 border-white/10' : 'bg-white border-gray-200'} overflow-hidden mb-6`}
                            >
                              {/* Year Header */}
                              <div className={`p-5 ${isDark ? 'bg-indigo-500/10 border-b border-white/10' : 'bg-indigo-50 border-b border-gray-200'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${isDark ? 'bg-indigo-500/20' : 'bg-white'}`}>
                                      <Calendar className={`w-6 h-6 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`} />
                                    </div>
                                    <div>
                                      <h3 className={`text-2xl font-bold ${text}`}>
                                        Year {yearData.year}
                                      </h3>
                                      <p className={`text-sm ${mutedText} mt-1`}>
                                        {totalCoursesYear} courses • {totalCreditsYear} total credits
                                      </p>
                                    </div>
                                  </div>
                                  <div className={`px-4 py-2 rounded-lg ${isDark ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white border border-indigo-200'}`}>
                                    <p className={`text-sm ${mutedText}`}>Total Credits</p>
                                    <p className={`text-2xl font-bold ${text}`}>{totalCreditsYear}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Year Content - Table Format */}
                              <div className="p-6 space-y-8">
                                {/* Fall Semester Table */}
                                <div>
                                          <div className={`flex items-center justify-between mb-4 pb-3 border-b-2 ${isDark ? 'border-indigo-500/30' : 'border-indigo-200'}`}>
                                            <h4 className={`text-lg font-bold ${text}`}>{fallSemesterNum}. Semester (Fall)</h4>
                                            <span className={`text-sm font-semibold ${mutedText}`}>
                                              Total: {yearData.total_credits_fall} credits
                                            </span>
                                          </div>
                                  {yearData.fall_semester.length === 0 ? (
                                    <div className={`p-8 rounded-xl border-2 border-dashed text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                                      <BookOpen className={`w-12 h-12 mx-auto mb-3 ${mutedText} opacity-50`} />
                                      <p className={`text-sm ${mutedText}`}>No courses for Fall semester</p>
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full">
                                        <thead>
                                          <tr className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                            <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>No</th>
                                            <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Course Code</th>
                                            <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Course Name</th>
                                            <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Type</th>
                                            <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Credits</th>
                                            <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Instructor</th>
                                            <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Students</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {yearData.fall_semester.map((course: any, idx: number) => (
                                            <motion.tr
                                              key={course.course_id}
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{ delay: idx * 0.03 }}
                                              className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                                            >
                                              <td className={`py-3 px-4 text-sm ${mutedText}`}>{idx + 1}</td>
                                              <td className={`py-3 px-4 font-semibold text-sm ${text}`}>{course.course_code}</td>
                                              <td className={`py-3 px-4 text-sm ${text}`}>{course.course_name}</td>
                                              <td className={`py-3 px-4 text-center`}>
                                                <span className={`text-xs px-2 py-1 rounded font-semibold ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                                                  Required
                                                </span>
                                              </td>
                                              <td className={`py-3 px-4 text-center font-semibold text-sm ${text}`}>{course.credits}</td>
                                              <td className={`py-3 px-4 text-sm ${mutedText}`}>{course.teacher || 'TBA'}</td>
                                              <td className={`py-3 px-4 text-center text-sm ${mutedText}`}>{course.enrollment_count || 0}</td>
                                            </motion.tr>
                                          ))}
                                        </tbody>
                                        <tfoot>
                                          <tr className={`${isDark ? 'bg-white/5 font-bold' : 'bg-gray-50 font-bold'}`}>
                                            <td colSpan={4} className={`py-3 px-4 text-sm ${text}`}>Total</td>
                                            <td className={`py-3 px-4 text-center text-sm ${text}`}>{yearData.total_credits_fall}</td>
                                            <td colSpan={2} className="py-3 px-4"></td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                {/* Spring Semester Table */}
                                <div>
                                  <div className={`flex items-center justify-between mb-4 pb-3 border-b-2 ${isDark ? 'border-indigo-500/30' : 'border-indigo-200'}`}>
                                    <h4 className={`text-lg font-bold ${text}`}>{springSemesterNum}. Semester (Spring)</h4>
                                    <span className={`text-sm font-semibold ${mutedText}`}>
                                      Total: {yearData.total_credits_spring} credits
                                    </span>
                                  </div>
                                  {yearData.spring_semester.length === 0 ? (
                                    <div className={`p-8 rounded-xl border-2 border-dashed text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                                      <BookOpen className={`w-12 h-12 mx-auto mb-3 ${mutedText} opacity-50`} />
                                      <p className={`text-sm ${mutedText}`}>No courses for Spring semester</p>
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full">
                                        <thead>
                                          <tr className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                            <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>No</th>
                                            <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Course Code</th>
                                            <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Course Name</th>
                                            <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Type</th>
                                            <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Credits</th>
                                            <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Instructor</th>
                                            <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Students</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {yearData.spring_semester.map((course: any, idx: number) => (
                                            <motion.tr
                                              key={course.course_id}
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{ delay: idx * 0.03 }}
                                              className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                                            >
                                              <td className={`py-3 px-4 text-sm ${mutedText}`}>{idx + 1}</td>
                                              <td className={`py-3 px-4 font-semibold text-sm ${text}`}>{course.course_code}</td>
                                              <td className={`py-3 px-4 text-sm ${text}`}>{course.course_name}</td>
                                              <td className={`py-3 px-4 text-center`}>
                                                <span className={`text-xs px-2 py-1 rounded font-semibold ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                                                  Required
                                                </span>
                                              </td>
                                              <td className={`py-3 px-4 text-center font-semibold text-sm ${text}`}>{course.credits}</td>
                                              <td className={`py-3 px-4 text-sm ${mutedText}`}>{course.teacher || 'TBA'}</td>
                                              <td className={`py-3 px-4 text-center text-sm ${mutedText}`}>{course.enrollment_count || 0}</td>
                                            </motion.tr>
                                          ))}
                                        </tbody>
                                        <tfoot>
                                          <tr className={`${isDark ? 'bg-white/5 font-bold' : 'bg-gray-50 font-bold'}`}>
                                            <td colSpan={4} className={`py-3 px-4 text-sm ${text}`}>Total</td>
                                            <td className={`py-3 px-4 text-center text-sm ${text}`}>{yearData.total_credits_spring}</td>
                                            <td colSpan={2} className="py-3 px-4"></td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                {/* Summer Semester (Optional) */}
                                <div>
                                  <div className={`flex items-center justify-between mb-4 pb-3 border-b-2 ${isDark ? 'border-indigo-500/30' : 'border-indigo-200'}`}>
                                    <h4 className={`text-lg font-bold ${text}`}>Summer Semester</h4>
                                    <span className={`text-sm font-semibold ${mutedText}`}>
                                      Total: {yearData.total_credits_summer} credits
                                    </span>
                                  </div>
                                  {yearData.summer_semester.length === 0 ? (
                                    <div className={`p-8 rounded-xl border-2 border-dashed text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                                      <BookOpen className={`w-12 h-12 mx-auto mb-3 ${mutedText} opacity-50`} />
                                      <p className={`text-sm ${mutedText}`}>No courses for Summer semester</p>
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full">
                                        <thead>
                                          <tr className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                            <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>No</th>
                                            <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Course Code</th>
                                            <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Course Name</th>
                                            <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Type</th>
                                            <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Credits</th>
                                            <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Instructor</th>
                                            <th className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Students</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {yearData.summer_semester.map((course: any, idx: number) => (
                                            <motion.tr
                                              key={course.course_id}
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{ delay: idx * 0.03 }}
                                              className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                                            >
                                              <td className={`py-3 px-4 text-sm ${mutedText}`}>{idx + 1}</td>
                                              <td className={`py-3 px-4 font-semibold text-sm ${text}`}>{course.course_code}</td>
                                              <td className={`py-3 px-4 text-sm ${text}`}>{course.course_name}</td>
                                              <td className={`py-3 px-4 text-center`}>
                                                <span className={`text-xs px-2 py-1 rounded font-semibold ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                                                  Required
                                                </span>
                                              </td>
                                              <td className={`py-3 px-4 text-center font-semibold text-sm ${text}`}>{course.credits}</td>
                                              <td className={`py-3 px-4 text-sm ${mutedText}`}>{course.teacher || 'TBA'}</td>
                                              <td className={`py-3 px-4 text-center text-sm ${mutedText}`}>{course.enrollment_count || 0}</td>
                                            </motion.tr>
                                          ))}
                                        </tbody>
                                        <tfoot>
                                          <tr className={`${isDark ? 'bg-white/5 font-bold' : 'bg-gray-50 font-bold'}`}>
                                            <td colSpan={4} className={`py-3 px-4 text-sm ${text}`}>Total</td>
                                            <td className={`py-3 px-4 text-center text-sm ${text}`}>{yearData.total_credits_summer}</td>
                                            <td colSpan={2} className="py-3 px-4"></td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Course Edit/Add Modal */}
        <AnimatePresence>
          {courseEditModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseCourseModal}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col`}
                >
                  <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                        <BookOpen className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      </div>
                      <div>
                        <h2 className={`text-2xl font-bold ${text}`}>
                          {editingCourse ? 'Edit Course' : 'Add Course'}
                        </h2>
                        <p className={`text-sm ${mutedText} mt-1`}>
                          {editingCourse ? 'Update course information' : 'Add a new course to the curriculum'}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCloseCourseModal}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>

                  <form onSubmit={handleSaveCourse} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Course Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={courseForm.code}
                            onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                            placeholder="e.g. CS101"
                            required
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Credits <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={courseForm.credits}
                            onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) || 3 })}
                            required
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Course Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={courseForm.name}
                          onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                          placeholder="e.g. Introduction to Computer Science"
                          required
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Description
                        </label>
                        <textarea
                          value={courseForm.description}
                          onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                          placeholder="Course description..."
                          rows={3}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium resize-y`}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Year of Study
                          </label>
                          <select
                            value={courseForm.year || ''}
                            onChange={(e) => setCourseForm({ ...courseForm, year: e.target.value ? parseInt(e.target.value) : null })}
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                          >
                            <option value="">Select Year (Optional)</option>
                            <option value={1}>Year 1</option>
                            <option value={2}>Year 2</option>
                            <option value={3}>Year 3</option>
                            <option value={4}>Year 4</option>
                            <option value={5}>Year 5</option>
                            <option value={6}>Year 6</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Semester <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={courseForm.semester}
                            onChange={(e) => setCourseForm({ ...courseForm, semester: parseInt(e.target.value) })}
                            required
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                          >
                            <option value={1}>Fall</option>
                            <option value={2}>Spring</option>
                            <option value={3}>Summer</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                            Academic Year <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={courseForm.academic_year}
                            onChange={(e) => setCourseForm({ ...courseForm, academic_year: e.target.value })}
                            placeholder="e.g. 2024-2025"
                            required
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Instructor (Optional)
                        </label>
                        <select
                          value={courseForm.teacher || ''}
                          onChange={(e) => setCourseForm({ ...courseForm, teacher: e.target.value || null })}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-white/[0.03] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-sm font-medium`}
                        >
                          <option value="">Select Teacher (Optional)</option>
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.first_name} {teacher.last_name} ({teacher.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>
                          Enroll Students (Optional)
                        </label>
                        {loadingStudents ? (
                          <div className={`p-8 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200'} flex items-center justify-center`}>
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            <span className={`ml-3 text-sm ${mutedText}`}>Loading students...</span>
                          </div>
                        ) : students.length === 0 ? (
                          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/10 text-white/60' : 'bg-gray-50 border-gray-200 text-gray-500'} text-center text-sm`}>
                            No students found in this department
                          </div>
                        ) : (
                          <div className={`max-h-60 overflow-y-auto rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200'} p-4 space-y-2`}>
                            {students.map((student) => (
                              <label
                                key={student.id}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                  selectedStudents.includes(student.id)
                                    ? isDark 
                                      ? 'bg-indigo-500/20 border border-indigo-500/30' 
                                      : 'bg-indigo-50 border border-indigo-200'
                                    : isDark
                                      ? 'hover:bg-white/5 border border-transparent'
                                      : 'hover:bg-gray-50 border border-transparent'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.includes(student.id)}
                                  onChange={() => handleStudentToggle(student.id)}
                                  className={`w-4 h-4 rounded border-2 focus:ring-2 focus:ring-indigo-500/30 ${
                                    isDark
                                      ? 'border-white/20 bg-white/5 text-indigo-400'
                                      : 'border-gray-300 text-indigo-600'
                                  }`}
                                />
                                <div className="flex-1">
                                  <div className={`text-sm font-medium ${text}`}>
                                    {student.first_name} {student.last_name}
                                  </div>
                                  <div className={`text-xs ${mutedText}`}>
                                    {student.student_id && `ID: ${student.student_id} • `}
                                    {student.email}
                                  </div>
                                </div>
                              </label>
                            ))}
                            {selectedStudents.length > 0 && (
                              <div className={`pt-2 mt-2 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                <p className={`text-xs font-medium ${mutedText}`}>
                                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 pt-4">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCloseCourseModal}
                          className={`flex-1 px-5 py-3.5 rounded-xl border transition-all duration-200 font-semibold text-sm ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={savingCourse}
                          className={`flex-1 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'} ${savingCourse ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {savingCourse ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              {editingCourse ? <Edit2 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                              {editingCourse ? 'Update Course' : 'Add Course'}
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

