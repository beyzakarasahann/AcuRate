'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  X, 
  TrendingUp, 
  Award, 
  FileText,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target
} from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api, type Enrollment, type Assessment, type LearningOutcome, type ProgramOutcome, type StudentGrade, type AssessmentLO, type LOPO } from '@/lib/api';
import CustomEdge from '@/components/graphs/CustomEdge';

// ============================================================================
// TYPES
// ============================================================================

interface CourseScoreData {
  course: {
    id: number;
    code: string;
    name: string;
  };
  assessments: Array<{
    id: string;
    label: string;
    score: number;
    maxScore: number;
    percentage: number;
    weights: Record<string, number>; // LO ID -> weight
    feedback?: string; // Feedback from grade or auto-generated from feedback_ranges
  }>;
  los: Array<{
    id: string;
    label: string;
    score: number;
    poWeights: Record<string, number>; // PO ID -> weight
    title?: string;
    description?: string;
    target?: number;
  }>;
  pos: Array<{
    id: string;
    label: string;
    score: number;
    title?: string;
    description?: string;
    target?: number;
  }>;
}


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScoresPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseData, setCourseData] = useState<CourseScoreData | null>(null);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [studentDepartment, setStudentDepartment] = useState<string | null>(null);
  const [hoveredPO, setHoveredPO] = useState<string | null>(null);
  const [hoveredLO, setHoveredLO] = useState<string | null>(null);

  const { isDark, themeClasses, mutedText, text } = useThemeColors();

  useEffect(() => {
    setMounted(true);
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchEnrollments();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (selectedCourseId && currentUserId) {
      fetchCourseScoreData(selectedCourseId);
    }
  }, [selectedCourseId, currentUserId]);

  const fetchCurrentUser = async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUserId(user.id);
      // Store student department for filtering Program Outcomes
      if (user.department) {
        setStudentDepartment(user.department);
      }
    } catch (err: any) {
      console.error('Failed to fetch current user:', err);
      setError('Failed to load user information');
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEnrollments();
      setEnrollments(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedCourseId(data[0].course);
      }
    } catch (err: any) {
      console.error('Failed to fetch enrollments:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseScoreData = async (courseId: number) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data with proper error handling
      let course, assessments, los, pos, grades, allAssessmentLOs, allLOPOs;
      
      // Get current user ID for filtering grades
      if (!currentUserId) {
        const user = await api.getCurrentUser();
        setCurrentUserId(user.id);
      }
      const studentId = currentUserId;
      
      try {
        // Get user info if we don't have department yet
        let userDepartment = studentDepartment;
        if (!userDepartment) {
          const user = await api.getCurrentUser();
          userDepartment = user.department || null;
          setStudentDepartment(userDepartment);
        }

        const results = await Promise.allSettled([
          api.getCourse(courseId),
          api.getAssessments({ course: courseId }),
          api.getLearningOutcomes({ course: courseId }),
          // Filter Program Outcomes by department if available
          userDepartment 
            ? api.getProgramOutcomes({ department: userDepartment })
            : api.getProgramOutcomes(),
          studentId ? api.getGrades({ student: studentId }) : api.getGrades(), // Only get current student's grades
          api.getAssessmentLOs(), // Fetch all, then filter by course assessments
          api.getLOPOs(), // Fetch all, then filter by course LOs
        ]);

        // Extract results with fallbacks - ensure arrays
        course = results[0].status === 'fulfilled' ? results[0].value : null;
        assessments = results[1].status === 'fulfilled' ? (Array.isArray(results[1].value) ? results[1].value : []) : [];
        los = results[2].status === 'fulfilled' ? (Array.isArray(results[2].value) ? results[2].value : []) : [];
        pos = results[3].status === 'fulfilled' ? (Array.isArray(results[3].value) ? results[3].value : []) : [];
        grades = results[4].status === 'fulfilled' ? (Array.isArray(results[4].value) ? results[4].value : []) : [];
        allAssessmentLOs = results[5].status === 'fulfilled' ? (Array.isArray(results[5].value) ? results[5].value : []) : [];
        allLOPOs = results[6].status === 'fulfilled' ? (Array.isArray(results[6].value) ? results[6].value : []) : [];

        // Log any failures for debugging
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(`Failed to fetch data at index ${index}:`, result.reason);
          }
        });
      } catch (err) {
        console.error('Error fetching course data:', err);
        // Set defaults
        assessments = [];
        los = [];
        pos = [];
        grades = [];
        allAssessmentLOs = [];
        allLOPOs = [];
      }

      // Final safety check - ensure all are arrays
      assessments = Array.isArray(assessments) ? assessments : [];
      los = Array.isArray(los) ? los : [];
      pos = Array.isArray(pos) ? pos : [];
      grades = Array.isArray(grades) ? grades : [];
      allAssessmentLOs = Array.isArray(allAssessmentLOs) ? allAssessmentLOs : [];
      allLOPOs = Array.isArray(allLOPOs) ? allLOPOs : [];

      // Filter assessment-LOs to only those related to this course's assessments
      // Double-check arrays before filtering
      if (!Array.isArray(allAssessmentLOs)) {
        console.warn('allAssessmentLOs is not an array:', allAssessmentLOs);
        allAssessmentLOs = [];
      }
      if (!Array.isArray(allLOPOs)) {
        console.warn('allLOPOs is not an array:', allLOPOs);
        allLOPOs = [];
      }
      if (!Array.isArray(assessments)) {
        console.warn('assessments is not an array:', assessments);
        assessments = [];
      }
      if (!Array.isArray(los)) {
        console.warn('los is not an array:', los);
        los = [];
      }

      const assessmentIds = assessments.map(a => Number(a.id));
      const assessmentLOs = allAssessmentLOs.filter(al => {
        // Handle both object and number formats
        const alAssessmentId = typeof al.assessment === 'object' && al.assessment !== null
          ? Number(al.assessment.id || al.assessment)
          : Number(al.assessment);
        return assessmentIds.includes(alAssessmentId);
      });

      // Filter LO-POs to only those related to this course's LOs
      const loIds = los.map(lo => Number(lo.id));
      const loPOs = allLOPOs.filter(lp => {
        // Handle both object and number formats
        const lpLoId = typeof lp.learning_outcome === 'object' && lp.learning_outcome !== null
          ? Number(lp.learning_outcome.id || lp.learning_outcome)
          : Number(lp.learning_outcome);
        return loIds.includes(lpLoId);
      });

      // Debug: Log mapping counts
      console.log('📊 Mapping counts:', {
        assessments: assessments.length,
        los: los.length,
        allAssessmentLOs: allAssessmentLOs.length,
        filteredAssessmentLOs: assessmentLOs.length,
        allLOPOs: allLOPOs.length,
        filteredLOPOs: loPOs.length,
      });

      // Debug: Log actual mapping data
      console.log('🔍 Assessment-LO Mappings:', assessmentLOs.map(al => ({
        assessment: al.assessment,
        lo: al.learning_outcome,
        weight: al.weight,
        weightType: typeof al.weight
      })));

      console.log('🔍 LO-PO Mappings:', loPOs.map(lp => ({
        lo: lp.learning_outcome,
        po: lp.program_outcome,
        weight: lp.weight,
        weightType: typeof lp.weight
      })));

      if (assessmentLOs.length === 0) {
        console.warn('⚠️  No Assessment-LO mappings found for this course!');
      }
      if (loPOs.length === 0) {
        console.warn('⚠️  No LO-PO mappings found for this course!');
      }

      // Filter Program Outcomes to only show those that are actually connected to this course's LOs
      const connectedPOIds = new Set(loPOs.map(lp => lp.program_outcome));
      const filteredPOs = pos.filter(po => connectedPOIds.has(po.id));
      
      console.log('📊 Filtering POs:', {
        totalPOs: pos.length,
        connectedPOIds: Array.from(connectedPOIds),
        filteredPOs: filteredPOs.length,
        filteredPOCodes: filteredPOs.map(po => po.code || po.id)
      });

      // Process data into CourseScoreData format (use filtered POs)
      const processedData = processCourseData(
        course,
        assessments,
        los,
        filteredPOs.length > 0 ? filteredPOs : pos, // Use filtered POs if available, otherwise all POs
        grades,
        assessmentLOs,
        loPOs
      );

      console.log('📊 Processed course data:', {
        assessments: processedData.assessments.map(a => ({
          id: a.id,
          label: a.label,
          weights: a.weights,
        })),
        los: processedData.los.map(lo => ({
          id: lo.id,
          label: lo.label,
          poWeights: lo.poWeights,
        })),
        pos: processedData.pos.map(po => ({
          id: po.id,
          label: po.label,
        })),
      });

      // Check if we have enough data to create edges
      const hasAssessments = processedData.assessments.length > 0;
      const hasLOs = processedData.los.length > 0;
      const hasPOs = processedData.pos.length > 0;
      const hasAssessmentEdges = processedData.assessments.some(a => Object.keys(a.weights || {}).length > 0);
      const hasLOEdges = processedData.los.some(lo => Object.keys(lo.poWeights || {}).length > 0);

      // Debug: Show which assessments and LOs have mappings
      console.log('🔍 Edge check details:', {
        assessmentsWithWeights: processedData.assessments.filter(a => Object.keys(a.weights || {}).length > 0).map(a => a.label),
        assessmentsWithoutWeights: processedData.assessments.filter(a => Object.keys(a.weights || {}).length === 0).map(a => a.label),
        losWithWeights: processedData.los.filter(lo => Object.keys(lo.poWeights || {}).length > 0).map(lo => lo.label),
        losWithoutWeights: processedData.los.filter(lo => Object.keys(lo.poWeights || {}).length === 0).map(lo => lo.label),
      });

      console.log('📊 Data check:', {
        hasAssessments,
        hasLOs,
        hasPOs,
        hasAssessmentEdges,
        hasLOEdges,
        assessmentsCount: processedData.assessments.length,
        losCount: processedData.los.length,
        posCount: processedData.pos.length,
      });

      // Always use real data, even if empty - don't use sample data
      setCourseData(processedData);
      
      // Show warning if no data
      if (!hasAssessments && !hasLOs && !hasPOs) {
        setError('No data available for this course. Please ensure assessments, learning outcomes, and program outcomes are configured.');
      } else if (!hasAssessmentEdges && !hasLOEdges) {
        const missingDetails = [];
        if (!hasAssessmentEdges) {
          missingDetails.push('assessments → learning outcomes (Assessment → LO)');
        }
        if (!hasLOEdges) {
          missingDetails.push('learning outcomes → program outcomes (LO → PO)');
        }
        setError(`No relationships configured. Missing mappings: ${missingDetails.join(' and ')}. Please contact your instructor to configure these mappings.`);
      } else {
        // Clear error if we have relationships and generate graph
        setError(null);
        generateGraph(processedData);
      }
    } catch (err: any) {
      console.error('Failed to fetch course data:', err);
      setError(err.message || 'Failed to load course data');
      // Don't use sample data - show error instead
      setCourseData(null);
    } finally {
      setLoading(false);
    }
  };

  const processCourseData = (
    course: any,
    assessments: Assessment[],
    los: LearningOutcome[],
    pos: ProgramOutcome[],
    grades: StudentGrade[],
    assessmentLOs: AssessmentLO[],
    loPOs: LOPO[]
  ): CourseScoreData => {
    // Debug: Log all IDs for comparison
    console.log('🔍 Processing data - IDs:', {
      assessmentIds: assessments.map(a => ({ id: a.id, type: typeof a.id })),
      loIds: los.map(lo => ({ id: lo.id, type: typeof lo.id })),
      poIds: pos.map(po => ({ id: po.id, type: typeof po.id })),
      assessmentLOIds: assessmentLOs.map(al => ({ 
        assessment: al.assessment, 
        lo: al.learning_outcome,
        types: { assessment: typeof al.assessment, lo: typeof al.learning_outcome }
      })),
      loPOIds: loPOs.map(lp => ({
        lo: lp.learning_outcome,
        po: lp.program_outcome,
        types: { lo: typeof lp.learning_outcome, po: typeof lp.program_outcome }
      })),
    });

    // Create assessment data with scores
    const assessmentData = assessments.map(assessment => {
      const assessmentId = Number(assessment.id);
      const grade = grades.find(g => Number(g.assessment) === assessmentId);
      const score = Number(grade?.score || 0);
      const maxScore = Number(assessment.max_score || 100);
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

      // Get weights for this assessment -> LO
      const weights: Record<string, number> = {};
      
      const relevantAssessmentLOs = assessmentLOs.filter(al => {
        // Handle both object and number formats for assessment
        const alAssessmentId = typeof al.assessment === 'object' && al.assessment !== null
          ? Number(al.assessment.id || al.assessment)
          : Number(al.assessment);
        return alAssessmentId === assessmentId;
      });
      
      relevantAssessmentLOs.forEach(al => {
        // Handle both object and number formats for learning_outcome
        const loId = typeof al.learning_outcome === 'object' && al.learning_outcome !== null
          ? Number(al.learning_outcome.id || al.learning_outcome)
          : Number(al.learning_outcome);
        // AssessmentLO weight is 0.01-10.0 scale where 1.0 = 10%, 10.0 = 100%
        // For display purposes, we show the weight as percentage
        const weightStr = String(al.weight || '0');
        const rawWeight = parseFloat(weightStr);
        // Only add if weight is valid and > 0
        if (!isNaN(rawWeight) && rawWeight > 0) {
          // Store normalized weight (0-1 scale: 1.0 = 0.1, 10.0 = 1.0)
          // This will be used for edge label display
          const normalizedWeight = rawWeight / 10.0; // Convert 0.01-10.0 scale to 0-1 scale
          weights[`lo-${loId}`] = normalizedWeight;
        }
      });

      if (Object.keys(weights).length === 0) {
        console.warn(`⚠️  No LO mappings found for assessment: ${assessment.title} (ID: ${assessmentId})`);
      }

      // Get automatic feedback from assessment's feedback_ranges if grade doesn't have feedback
      const getAutomaticFeedback = (score: number, assessment: Assessment): string => {
        // If grade already has feedback, use it
        if (grade?.feedback) {
          return grade.feedback;
        }
        
        // If no feedback_ranges, return empty
        if (!assessment.feedback_ranges || assessment.feedback_ranges.length === 0) {
          return '';
        }
        
        // Calculate percentage
        const maxScore = Number(assessment.max_score || 100);
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
        
        // Find matching range
        for (const range of assessment.feedback_ranges) {
          if (percentage >= range.min_score && percentage <= range.max_score) {
            return range.feedback;
          }
        }
        
        return '';
      };

      const feedback = score > 0 ? getAutomaticFeedback(score, assessment) : (grade?.feedback || '');

      return {
        id: `assessment-${assessment.id}`,
        label: assessment.title,
        score: Number(score),
        maxScore: Number(maxScore),
        percentage: Number(percentage),
        weights,
        feedback: feedback || undefined,
      };
    });

    // Create LO data with calculated scores
    const loData = los.map(lo => {
      const loId = Number(lo.id);
      
      // Calculate LO score from assessments
      let totalWeight = 0;
      let weightedSum = 0;

      assessmentLOs
        .filter(al => {
          // Handle both object and number formats for learning_outcome
          const alLoId = typeof al.learning_outcome === 'object' && al.learning_outcome !== null
            ? Number(al.learning_outcome.id || al.learning_outcome)
            : Number(al.learning_outcome);
          return alLoId === loId;
        })
        .forEach(al => {
          // Handle both object and number formats for assessment
          const assessmentId = typeof al.assessment === 'object' && al.assessment !== null
            ? Number(al.assessment.id || al.assessment)
            : Number(al.assessment);
          const assessment = assessments.find(a => Number(a.id) === assessmentId);
          const grade = grades.find(g => {
            const gradeAssessmentId = typeof g.assessment === 'object' && g.assessment !== null
              ? Number(g.assessment.id || g.assessment)
              : Number(g.assessment);
            return gradeAssessmentId === assessmentId;
          });
          if (assessment && grade) {
            // AssessmentLO weight is 0.01-10.0 scale where 1.0 = 10%, 10.0 = 100%
            // Normalize to 0-1 scale for weighted average calculation
            const rawWeight = typeof al.weight === 'string' ? parseFloat(al.weight) : Number(al.weight || 0);
            const normalizedWeight = rawWeight / 10.0; // Convert 0.01-10.0 scale to 0-1 scale
            
            const assessmentMaxScore = Number(assessment.max_score || 100);
            const gradeScore = Number(grade.score || 0);
            const percentage = assessmentMaxScore > 0 
              ? (gradeScore / assessmentMaxScore) * 100 
              : 0;
            
            // Weighted average: sum(score * weight) / sum(weight)
            weightedSum += percentage * normalizedWeight;
            totalWeight += normalizedWeight;
          }
        });

      const loScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      // Get weights for this LO -> PO
      // LOPO weight is 0.01-10.0 scale where 1.0 = 10%, 10.0 = 100%, so convert to 0-1 scale
      const poWeights: Record<string, number> = {};
      const relevantLOPOs = loPOs.filter(lp => {
        const lpLoId = typeof lp.learning_outcome === 'object' ? lp.learning_outcome.id : Number(lp.learning_outcome);
        return lpLoId === loId;
      });
      
      relevantLOPOs.forEach(lp => {
        const poId = typeof lp.program_outcome === 'object' ? lp.program_outcome.id : Number(lp.program_outcome);
        // Weight comes as string from API, parse it
        const weightStr = String(lp.weight || '0');
        const weight = parseFloat(weightStr);
        // Only add if weight is valid and > 0
        if (!isNaN(weight) && weight > 0) {
          // Convert LOPO weight (0.01-10.0) to percentage (0-1 scale)
          // 10.0 = 100% = 1.0, 1.0 = 10% = 0.1, 0.5 = 5% = 0.05, etc.
          const normalizedWeight = weight / 10.0;
          poWeights[`po-${poId}`] = normalizedWeight;
        }
      });

      if (Object.keys(poWeights).length === 0) {
        console.warn(`⚠️  No PO mappings found for LO: ${lo.code || lo.id} (ID: ${loId})`);
      }

      return {
        id: `lo-${lo.id}`,
        label: lo.code || `LO${lo.id}`,
        score: Number(loScore || 0),
        poWeights,
        title: lo.title || '',
        description: lo.description || '',
        target: Number(lo.target_percentage) || 70,
      };
    });

    // Create PO data with calculated scores
    const poData = pos.map(po => {
      // Calculate PO score from LOs
      let totalWeight = 0;
      let weightedSum = 0;

      loPOs
        .filter(lp => {
          const lpPoId = typeof lp.program_outcome === 'object' && lp.program_outcome !== null
            ? Number(lp.program_outcome.id || lp.program_outcome)
            : Number(lp.program_outcome);
          return lpPoId === Number(po.id);
        })
        .forEach(lp => {
          const lpLoId = typeof lp.learning_outcome === 'object' && lp.learning_outcome !== null
            ? Number(lp.learning_outcome.id || lp.learning_outcome)
            : Number(lp.learning_outcome);
          const lo = los.find(l => Number(l.id) === lpLoId);
          if (lo) {
            // Get LO score (calculated above)
            const loItem = loData.find(l => l.id === `lo-${lo.id}`);
            if (loItem) {
              const weightStr = String(lp.weight || '0');
              const weight = parseFloat(weightStr);
              if (!isNaN(weight) && weight > 0) {
                // Convert LOPO weight (0.1-10.0) to normalized weight (0-1 scale)
                const normalizedWeight = weight / 10.0;
                weightedSum += loItem.score * normalizedWeight;
                totalWeight += normalizedWeight;
              }
            }
          }
        });

      const poScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      return {
        id: `po-${po.id}`,
        label: po.code || `PO${po.id}`,
        score: Number(poScore || 0),
        title: po.title || '',
        description: po.description || '',
        target: Number(po.target_percentage) || 70,
      };
    });

    return {
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
      },
      assessments: assessmentData,
      los: loData,
      pos: poData,
    };
  };


  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<Edge | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState<any>(null);

  // Custom layout function: Left (Assessment) → Center (LO) → Right (PO)
  const getLayoutedElements = (nodes: Node[], edges: Edge[], data: CourseScoreData) => {
    const nodeWidth = 220;
    const nodeHeight = 100;
    const horizontalSpacing = 400; // Distance between Assessment → LO → PO
    const verticalSpacing = 140; // Distance between nodes on the same level
    const startX = 100;
    const startY = 50;

    // Node'ları kategorilere ayır
    const assessmentNodes = nodes.filter(n => n.id.startsWith('assessment-'));
    const loNodes = nodes.filter(n => n.id.startsWith('lo-'));
    const poNodes = nodes.filter(n => n.id.startsWith('po-'));

    // Assessment node'larını sol tarafa yerleştir (dikey sıralama)
    const layoutedNodes: Node[] = assessmentNodes.map((node, index) => {
      const y = startY + index * verticalSpacing;
      return {
        ...node,
        position: { x: startX, y },
        sourcePosition: Position.Right,
        data: {
          ...node.data,
          type: 'assessment',
        },
      };
    });

    // Place LO nodes in the center (vertical stacking)
    loNodes.forEach((node, index) => {
      const y = startY + index * verticalSpacing;
      layoutedNodes.push({
        ...node,
        position: { x: startX + horizontalSpacing, y },
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        data: {
          ...node.data,
          type: 'lo',
        },
      });
    });

    // Place PO nodes on the right side (vertical stacking)
    poNodes.forEach((node, index) => {
      const y = startY + index * verticalSpacing;
      layoutedNodes.push({
        ...node,
        position: { x: startX + horizontalSpacing * 2, y },
        targetPosition: Position.Left,
        data: {
          ...node.data,
          type: 'po',
        },
      });
    });

    return { nodes: layoutedNodes, edges };
  };

  // Generate edges from data
  const generateEdges = useCallback((data: CourseScoreData): Edge[] => {
    const edges: Edge[] = [];

    // Assessment → LO edges (blue/indigo)
    data.assessments.forEach(assessment => {
      Object.keys(assessment.weights || {}).forEach(loId => {
        const weight = assessment.weights[loId];
        if (weight && weight > 0) {
          // AssessmentLO weight is normalized to 0-1 scale
          // Convert to percentage for display (weight * 100)
          const percentage = (weight * 100);
          edges.push({
            id: `${assessment.id}-${loId}`,
            source: assessment.id,
            target: loId,
            label: `${percentage.toFixed(0)}%`,
            type: 'custom',
            markerEnd: { 
              type: MarkerType.ArrowClosed,
              width: 30,
              height: 30,
            },
            style: {
              stroke: isDark ? 'rgba(99, 102, 241, 0.7)' : 'rgba(99, 102, 241, 0.7)',
              strokeWidth: 3,
            },
            animated: true,
          });
        }
      });
    });

    // LO → PO edges (purple)
    data.los.forEach(lo => {
      Object.keys(lo.poWeights || {}).forEach(poId => {
        const weight = lo.poWeights[poId];
        // Weight is already normalized to 0-1 scale, so multiply by 100 for percentage
        if (weight && weight > 0) {
          const percentage = (weight * 100);
          edges.push({
            id: `${lo.id}-${poId}`,
            source: lo.id,
            target: poId,
            label: `${percentage.toFixed(0)}%`,
            type: 'custom',
            markerEnd: { 
              type: MarkerType.ArrowClosed,
              width: 30,
              height: 30,
            },
            style: {
              stroke: isDark ? 'rgba(139, 92, 246, 0.7)' : 'rgba(139, 92, 246, 0.7)',
              strokeWidth: 3,
            },
            animated: true,
          });
        }
      });
    });

    return edges;
  }, [isDark]);

  // Generate graph nodes and edges
  const generateGraph = useCallback((data: CourseScoreData) => {
    const newNodes: Node[] = [];
    
    // Assessment nodes (Left side - Assessments)
    data.assessments.forEach(assessment => {
      newNodes.push({
        id: assessment.id,
        type: 'default',
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div className={`p-3 rounded-lg shadow-md ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-blue-500" />
                <p className="font-bold text-sm">{assessment.label}</p>
              </div>
              <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">
                <span className="font-semibold">{Number(assessment.score || 0).toFixed(1)}</span> / {Number(assessment.maxScore || 100).toFixed(0)}
              </p>
              <p className={`text-xs font-bold ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                {Number(assessment.percentage || 0).toFixed(1)}%
              </p>
              {assessment.feedback && (
                <p className={`text-xs mt-1 ${isDark ? 'text-blue-200' : 'text-blue-700'} line-clamp-2`}>
                  {assessment.feedback}
                </p>
              )}
            </div>
          ),
        },
        sourcePosition: Position.Right,
      });
    });

    // LO nodes (Center - Learning Outcomes)
    data.los.forEach(lo => {
      newNodes.push({
        id: lo.id,
        type: 'default',
        position: { x: 0, y: 0 },
        style: {
          border: 'none',
          background: 'transparent',
        },
        data: {
          label: (
            <div className={`p-3 rounded-lg shadow-md ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-purple-500" />
                <p className="font-bold text-sm">{lo.label}</p>
              </div>
              <p className={`text-lg font-bold ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                {Number(lo.score || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Calculated LO Score
              </p>
            </div>
          ),
        },
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
      });
    });

    // PO nodes (Right side - Program Outcomes)
    data.pos.forEach(po => {
      newNodes.push({
        id: po.id,
        type: 'default',
        position: { x: 0, y: 0 },
        style: {
          border: 'none',
          background: 'transparent',
        },
        data: {
          label: (
            <div className={`p-3 rounded-lg shadow-md ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-green-500" />
                <p className="font-bold text-sm">{po.label}</p>
              </div>
              <p className={`text-lg font-bold ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                {Number(po.score || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total PO Achievement
              </p>
            </div>
          ),
        },
        targetPosition: Position.Left,
      });
    });

    const newEdges = generateEdges(data);
    const layouted = getLayoutedElements(newNodes, newEdges, data);
    
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [isDark, generateEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onNodeMouseEnter = useCallback((_event: React.MouseEvent, node: Node) => {
    // Extract node data for tooltip
    const nodeId = node.id;
    let tooltipContent: any = { title: nodeId, type: 'unknown' };

    if (nodeId.startsWith('assessment-')) {
      const assessmentId = nodeId.replace('assessment-', '');
      const assessment = courseData?.assessments.find(a => a.id === nodeId);
      if (assessment) {
        tooltipContent = {
          type: 'assessment',
          title: assessment.label,
          score: `${Number(assessment.score || 0).toFixed(1)} / ${Number(assessment.maxScore || 100).toFixed(0)}`,
          percentage: `${Number(assessment.percentage || 0).toFixed(1)}%`,
          feedback: assessment.feedback || undefined,
          contributions: Object.entries(assessment.weights || {}).map(([loId, weight]) => ({
            target: courseData?.los.find(lo => lo.id === loId)?.label || loId,
            weight: `${(weight * 100).toFixed(0)}%`,
          })),
        };
      }
    } else if (nodeId.startsWith('lo-')) {
      const lo = courseData?.los.find(l => l.id === nodeId);
      if (lo) {
        // Find which assessments contribute to this LO
        const contributingAssessments = courseData?.assessments.filter(a => 
          Object.keys(a.weights || {}).includes(lo.id)
        ).map(assessment => {
          const weight = assessment.weights[lo.id] || 0;
          return {
            label: assessment.label,
            score: `${Number(assessment.score || 0).toFixed(1)}/${Number(assessment.maxScore || 100).toFixed(0)}`,
            percentage: `${Number(assessment.percentage || 0).toFixed(1)}%`,
            weight: `${(weight * 100).toFixed(0)}%`,
          };
        }) || [];

        tooltipContent = {
          type: 'lo',
          title: lo.label,
          fullTitle: lo.title || '',
          description: lo.description || '',
          score: `${Number(lo.score || 0).toFixed(1)}%`,
          target: lo.target || 70,
          targetMet: Number(lo.score || 0) >= (lo.target || 70),
          difference: Number(lo.score || 0) - (lo.target || 70),
          contributingAssessments,
          contributions: Object.entries(lo.poWeights || {}).map(([poId, weight]) => ({
            target: courseData?.pos.find(po => po.id === poId)?.label || poId,
            weight: `${(weight * 100).toFixed(0)}%`,
          })),
        };
      }
    } else if (nodeId.startsWith('po-')) {
      const po = courseData?.pos.find(p => p.id === nodeId);
      if (po) {
        // Find which LOs contribute to this PO
        const contributingLOs = courseData?.los.filter(lo => 
          Object.keys(lo.poWeights || {}).includes(po.id)
        ).map(lo => {
          const weight = lo.poWeights[po.id] || 0;
          return {
            label: lo.label,
            title: lo.title || '',
            score: `${Number(lo.score || 0).toFixed(1)}%`,
            weight: `${(weight * 100).toFixed(0)}%`,
          };
        }) || [];

        tooltipContent = {
          type: 'po',
          title: po.label,
          fullTitle: po.title || '',
          description: po.description || '',
          score: `${Number(po.score || 0).toFixed(1)}%`,
          target: po.target || 70,
          targetMet: Number(po.score || 0) >= (po.target || 70),
          difference: Number(po.score || 0) - (po.target || 70),
          contributingLOs,
        };
      }
    }

    setTooltipData(tooltipContent);
    setShowTooltip(true);
  }, [courseData]);

  const onNodeMouseMove = useCallback((event: React.MouseEvent) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setShowTooltip(false);
    setTooltipData(null);
  }, []);

  useEffect(() => {
    if (courseData) {
      generateGraph(courseData);
    }
  }, [courseData, generateGraph]);

  const selectedCourse = enrollments.find(e => e.course === selectedCourseId);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-4">
          Learning Flow Graph
        </h1>
        <p className={mutedText}>
          Dynamic flow visualization: See how your assessment scores (midterm, final, project) flow from Assessments → Learning Outcomes (LO) → Program Outcomes (PO)
        </p>
      </motion.div>

      {/* Course Selection */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <button
            onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
            className={`w-full md:w-96 ${themeClasses.card} p-4 rounded-xl shadow-lg flex items-center justify-between hover:shadow-xl transition-all`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <div className="text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">Selected Course</p>
                <p className={text}>
                  {selectedCourse 
                    ? `${selectedCourse.course_code || 'N/A'} - ${selectedCourse.course_name || 'Unknown'}`
                    : 'Select a course'
                  }
                </p>
              </div>
            </div>
            {isCourseDropdownOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {isCourseDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute top-full mt-2 w-full md:w-96 ${themeClasses.card} rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto`}
              >
                {enrollments.length > 0 ? (
                  enrollments.map((enrollment) => (
                    <button
                      key={enrollment.id}
                      onClick={() => {
                        setSelectedCourseId(enrollment.course);
                        setIsCourseDropdownOpen(false);
                      }}
                      className={`w-full text-left p-4 hover:bg-indigo-500/10 transition-colors ${
                        selectedCourseId === enrollment.course ? 'bg-indigo-500/20' : ''
                      }`}
                    >
                      <p className={text}>
                        {enrollment.course_code || 'N/A'} - {enrollment.course_name || 'Unknown'}
                      </p>
                      <p className={`text-sm ${mutedText}`}>
                        {enrollment.is_active ? 'Active' : 'Completed'}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className={mutedText}>No courses found</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
            <p className={mutedText}>Loading course data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className={`${themeClasses.card} p-6 rounded-xl shadow-lg mb-6`}>
          <div className="flex items-center gap-3 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && tooltipData && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 15}px`,
            top: `${tooltipPosition.y + 15}px`,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${isDark ? 'bg-gray-900/95 border border-gray-700' : 'bg-white/95 border border-gray-200'} rounded-lg shadow-xl p-4 max-w-sm backdrop-blur-sm`}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-gray-500/20">
                {tooltipData.type === 'assessment' && <FileText className="w-5 h-5 text-blue-500" />}
                {tooltipData.type === 'lo' && <Target className="w-5 h-5 text-purple-500" />}
                {tooltipData.type === 'po' && <Award className="w-5 h-5 text-green-500" />}
                <div className="flex-1">
                  <h4 className={`font-bold text-sm ${text}`}>{tooltipData.title}</h4>
                  {tooltipData.fullTitle && (
                    <p className={`text-xs ${mutedText} mt-0.5`}>{tooltipData.fullTitle}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              {tooltipData.description && (
                <p className={`text-xs ${mutedText} line-clamp-2`}>
                  {tooltipData.description}
                </p>
              )}

              {/* Score and Target Info */}
              <div className="space-y-2">
                {tooltipData.score && (
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${mutedText}`}>Current Score:</span>
                    <span className={`text-sm font-bold ${
                      tooltipData.type === 'assessment' ? 'text-blue-500' :
                      tooltipData.type === 'lo' ? 'text-purple-500' :
                      'text-green-500'
                    }`}>
                      {tooltipData.score}
                      {tooltipData.percentage && ` (${tooltipData.percentage})`}
                    </span>
                  </div>
                )}

                {/* Feedback for Assessment */}
                {tooltipData.type === 'assessment' && tooltipData.feedback && (
                  <div className="pt-2 border-t border-gray-500/20">
                    <span className={`text-xs font-semibold ${mutedText} mb-1 block`}>Feedback:</span>
                    <p className={`text-xs ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                      {tooltipData.feedback}
                    </p>
                  </div>
                )}

                {tooltipData.target !== undefined && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${mutedText}`}>Target:</span>
                      <span className={`text-xs font-semibold ${text}`}>
                        {tooltipData.target}%
                      </span>
                    </div>
                    {tooltipData.difference !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${mutedText}`}>Difference:</span>
                        <span className={`text-xs font-semibold ${
                          tooltipData.targetMet
                            ? (isDark ? 'text-green-400' : 'text-green-600')
                            : (isDark ? 'text-red-400' : 'text-red-600')
                        }`}>
                          {tooltipData.targetMet ? '+' : ''}{tooltipData.difference.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {tooltipData.score && tooltipData.target && (
                      <div className="pt-1">
                        <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-1.5 overflow-hidden`}>
                          <div
                            className={`h-1.5 rounded-full ${
                              tooltipData.type === 'lo' ? 'bg-purple-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((parseFloat(tooltipData.score) / tooltipData.target) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Contributing Assessments (for LO) */}
              {tooltipData.contributingAssessments && tooltipData.contributingAssessments.length > 0 && (
                <div className="pt-2 border-t border-gray-500/20">
                  <p className={`text-xs font-semibold ${mutedText} mb-2`}>
                    Contributing Assessments:
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {tooltipData.contributingAssessments.map((contrib: any, idx: number) => (
                      <div key={idx} className={`text-xs p-2 rounded ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${text}`}>{contrib.label}</span>
                          <span className={`font-semibold ${text}`}>{contrib.weight}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className={mutedText}>{contrib.score}</span>
                          <span className={mutedText}>{contrib.percentage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contributing LOs (for PO) */}
              {tooltipData.contributingLOs && tooltipData.contributingLOs.length > 0 && (
                <div className="pt-2 border-t border-gray-500/20">
                  <p className={`text-xs font-semibold ${mutedText} mb-2`}>
                    Contributing Learning Outcomes:
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {tooltipData.contributingLOs.map((contrib: any, idx: number) => (
                      <div key={idx} className={`text-xs p-2 rounded ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${text}`}>{contrib.label}</span>
                          <span className={`font-semibold text-purple-500`}>{contrib.weight}</span>
                        </div>
                        {contrib.title && (
                          <p className={`text-xs ${mutedText} mb-1 line-clamp-1`}>{contrib.title}</p>
                        )}
                        <span className={`text-xs ${mutedText}`}>Score: {contrib.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contributions to POs (for LO) */}
              {tooltipData.contributions && tooltipData.contributions.length > 0 && (
                <div className="pt-2 border-t border-gray-500/20">
                  <p className={`text-xs font-semibold ${mutedText} mb-1`}>
                    Contributes to Program Outcomes:
                  </p>
                  <div className="space-y-1">
                    {tooltipData.contributions.map((contrib: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className={mutedText}>{contrib.target}:</span>
                        <span className={`font-semibold ${text}`}>{contrib.weight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Graph */}
      {!loading && courseData && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`${themeClasses.card} rounded-xl shadow-xl p-4 h-[800px] relative overflow-hidden`}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onNodeMouseEnter={onNodeMouseEnter}
                onNodeMouseMove={onNodeMouseMove}
                onNodeMouseLeave={onNodeMouseLeave}
                connectionMode={ConnectionMode.Loose}
                fitView
                edgeTypes={{ custom: CustomEdge }}
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`${themeClasses.card} rounded-xl shadow-xl p-6 sticky top-8`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl font-bold ${text}`}>Node Details</h3>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className={`text-sm ${mutedText} mb-1`}>ID</p>
                      <p className={text}>{selectedNode.id}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Learning Outcomes Summary Section */}
      {!loading && courseData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${themeClasses.card} rounded-xl shadow-xl p-6 mt-6`}
        >
          <h2 className={`text-2xl font-bold ${text} mb-6 flex items-center gap-2`}>
            <Target className="w-6 h-6 text-purple-500" />
            Learning Outcomes Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {courseData.los.map((lo, index) => {
              const score = Number(lo.score || 0);
              const scoreRounded = Math.round(score);
              
              // Determine color based on score - Purple theme for LO
              const getScoreColor = (score: number) => {
                if (score >= 90) return isDark ? 'text-purple-400' : 'text-purple-600';
                if (score >= 70) return isDark ? 'text-indigo-400' : 'text-indigo-600';
                return isDark ? 'text-orange-400' : 'text-orange-600';
              };
              
              const getProgressColor = (score: number) => {
                if (score >= 90) return 'bg-gradient-to-r from-purple-500 to-purple-600';
                if (score >= 70) return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
                return 'bg-gradient-to-r from-orange-500 to-orange-600';
              };
              
              const getBgColor = (score: number) => {
                if (score >= 90) return isDark ? 'bg-purple-500/10 border-purple-400/30' : 'bg-purple-50/50 border-purple-200';
                if (score >= 70) return isDark ? 'bg-indigo-500/10 border-indigo-400/30' : 'bg-indigo-50/50 border-indigo-200';
                return isDark ? 'bg-orange-500/10 border-orange-400/30' : 'bg-orange-50/50 border-orange-200';
              };
              
              // Get LO title from courseData
              const loTitle = lo.title || '';
              const loDescription = lo.description || '';
              const loTarget = lo.target || 70;
              const isHovered = hoveredLO === lo.id;
              const targetMet = score >= loTarget;
              const difference = score - loTarget;
              
              return (
                <div
                  key={lo.id}
                  className="relative"
                  onMouseEnter={() => setHoveredLO(lo.id)}
                  onMouseLeave={() => setHoveredLO(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`p-5 rounded-xl border shadow-lg hover:shadow-xl transition-all cursor-pointer ${getBgColor(score)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                          isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {lo.label}
                        </div>
                      </div>
                      <div className={`text-3xl font-extrabold ${getScoreColor(score)}`}>
                        {scoreRounded}
                      </div>
                    </div>
                    
                    {loTitle && (
                      <p className={`text-sm ${mutedText} mb-3 line-clamp-2`}>
                        {loTitle}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={mutedText}>Achievement</span>
                        <span className={`font-semibold ${getScoreColor(score)}`}>
                          {scoreRounded}%
                        </span>
                      </div>
                      <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5 overflow-hidden`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(score, 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.2 * index }}
                          className={`h-2.5 rounded-full ${getProgressColor(score)}`}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-300/20">
                      <div className="flex items-center justify-between text-xs">
                        <span className={mutedText}>Status</span>
                        <span className={`font-semibold ${
                          score >= 90 ? (isDark ? 'text-purple-400' : 'text-purple-600') :
                          score >= 70 ? (isDark ? 'text-indigo-400' : 'text-indigo-600') :
                          (isDark ? 'text-orange-400' : 'text-orange-600')
                        }`}>
                          {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Hover Tooltip */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute z-50 w-80 p-4 rounded-xl shadow-2xl border ${
                          isDark 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                        } top-full left-1/2 -translate-x-1/2 mt-2`}
                        style={{ pointerEvents: 'none' }}
                      >
                        {/* Arrow */}
                        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 ${
                          isDark ? 'bg-gray-800 border-l border-t border-gray-700' : 'bg-white border-l border-t border-gray-200'
                        }`} />
                        
                        <div className="relative">
                          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-300/20">
                            <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                              isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {lo.label}
                            </div>
                            <div className={`text-2xl font-extrabold ${getScoreColor(score)}`}>
                              {scoreRounded}%
                            </div>
                          </div>
                          
                          {loTitle && (
                            <h3 className={`font-semibold ${text} mb-2`}>
                              {loTitle}
                            </h3>
                          )}
                          
                          {loDescription && (
                            <p className={`text-sm ${mutedText} mb-4 line-clamp-3`}>
                              {loDescription}
                            </p>
                          )}
                          
                          <div className="space-y-3 pt-3 border-t border-gray-300/20">
                            <div className="flex items-center justify-between text-sm">
                              <span className={mutedText}>Target Achievement</span>
                              <span className={`font-semibold ${text}`}>
                                {loTarget}%
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className={mutedText}>Current Achievement</span>
                              <span className={`font-semibold ${getScoreColor(score)}`}>
                                {scoreRounded}%
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className={mutedText}>Difference</span>
                              <span className={`font-semibold ${
                                targetMet 
                                  ? (isDark ? 'text-green-400' : 'text-green-600')
                                  : (isDark ? 'text-red-400' : 'text-red-600')
                              }`}>
                                {targetMet ? '+' : ''}{difference.toFixed(1)}%
                              </span>
                            </div>
                            
                            <div className="pt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className={mutedText}>Progress</span>
                                <span className={mutedText}>{scoreRounded}% / {loTarget}%</span>
                              </div>
                              <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                                <div
                                  className={`h-2 rounded-full ${getProgressColor(score)}`}
                                  style={{ width: `${Math.min((score / loTarget) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Program Outcomes Summary Section */}
      {!loading && courseData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${themeClasses.card} rounded-xl shadow-xl p-6 mt-6`}
        >
          <h2 className={`text-2xl font-bold ${text} mb-6 flex items-center gap-2`}>
            <Award className="w-6 h-6 text-indigo-500" />
            Program Outcomes Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {courseData.pos.map((po, index) => {
              const score = Number(po.score || 0);
              const scoreRounded = Math.round(score);
              
              // Determine color based on score - Indigo theme for PO
              const getScoreColor = (score: number) => {
                if (score >= 90) return isDark ? 'text-indigo-400' : 'text-indigo-600';
                if (score >= 70) return isDark ? 'text-blue-400' : 'text-blue-600';
                return isDark ? 'text-orange-400' : 'text-orange-600';
              };
              
              const getProgressColor = (score: number) => {
                if (score >= 90) return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
                if (score >= 70) return 'bg-gradient-to-r from-blue-500 to-blue-600';
                return 'bg-gradient-to-r from-orange-500 to-orange-600';
              };
              
              const getBgColor = (score: number) => {
                if (score >= 90) return isDark ? 'bg-indigo-500/10 border-indigo-400/30' : 'bg-indigo-50/50 border-indigo-200';
                if (score >= 70) return isDark ? 'bg-blue-500/10 border-blue-400/30' : 'bg-blue-50/50 border-blue-200';
                return isDark ? 'bg-orange-500/10 border-orange-400/30' : 'bg-orange-50/50 border-orange-200';
              };
              
              // Get PO title from courseData
              const poTitle = po.title || '';
              const poDescription = po.description || '';
              const poTarget = po.target || 70;
              const isHovered = hoveredPO === po.id;
              const targetMet = score >= poTarget;
              const difference = score - poTarget;
              
              return (
                <div
                key={po.id}
                  className="relative"
                  onMouseEnter={() => setHoveredPO(po.id)}
                  onMouseLeave={() => setHoveredPO(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`p-5 rounded-xl border shadow-lg hover:shadow-xl transition-all cursor-pointer ${getBgColor(score)}`}
                  >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                        isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {po.label}
                      </div>
                    </div>
                    <div className={`text-3xl font-extrabold ${getScoreColor(score)}`}>
                      {scoreRounded}
                    </div>
                  </div>
                  
                  {poTitle && (
                    <p className={`text-sm ${mutedText} mb-3 line-clamp-2`}>
                      {poTitle}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className={mutedText}>Achievement</span>
                      <span className={`font-semibold ${getScoreColor(score)}`}>
                        {scoreRounded}%
                      </span>
                    </div>
                    <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5 overflow-hidden`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(score, 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.2 * index }}
                        className={`h-2.5 rounded-full ${getProgressColor(score)}`}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-300/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className={mutedText}>Status</span>
                      <span className={`font-semibold ${
                        score >= 90 ? (isDark ? 'text-indigo-400' : 'text-indigo-600') :
                        score >= 70 ? (isDark ? 'text-blue-400' : 'text-blue-600') :
                        (isDark ? 'text-orange-400' : 'text-orange-600')
                      }`}>
                        {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
              </motion.div>
                
                {/* Hover Tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute z-50 w-80 p-4 rounded-xl shadow-2xl border ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      } top-full left-1/2 -translate-x-1/2 mt-2`}
                      style={{ pointerEvents: 'none' }}
                    >
                      {/* Arrow */}
                      <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 ${
                        isDark ? 'bg-gray-800 border-l border-t border-gray-700' : 'bg-white border-l border-t border-gray-200'
                      }`} />
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-300/20">
                          <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                            isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {po.label}
                          </div>
                          <div className={`text-2xl font-extrabold ${getScoreColor(score)}`}>
                            {scoreRounded}%
                          </div>
                        </div>
                        
                        {poTitle && (
                          <h3 className={`font-semibold ${text} mb-2`}>
                            {poTitle}
                          </h3>
                        )}
                        
                        {poDescription && (
                          <p className={`text-sm ${mutedText} mb-4 line-clamp-3`}>
                            {poDescription}
                          </p>
                        )}
                        
                        <div className="space-y-3 pt-3 border-t border-gray-300/20">
                          <div className="flex items-center justify-between text-sm">
                            <span className={mutedText}>Target Achievement</span>
                            <span className={`font-semibold ${text}`}>
                              {poTarget}%
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className={mutedText}>Current Achievement</span>
                            <span className={`font-semibold ${getScoreColor(score)}`}>
                              {scoreRounded}%
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className={mutedText}>Difference</span>
                            <span className={`font-semibold ${
                              targetMet 
                                ? (isDark ? 'text-indigo-400' : 'text-indigo-600')
                                : (isDark ? 'text-orange-400' : 'text-orange-600')
                            }`}>
                              {targetMet ? '+' : ''}{difference.toFixed(1)}%
                            </span>
                          </div>
                          
                          <div className="pt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={mutedText}>Progress</span>
                              <span className={mutedText}>{scoreRounded}% / {poTarget}%</span>
                            </div>
                            <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                              <div
                                className={`h-2 rounded-full ${getProgressColor(score)}`}
                                style={{ width: `${Math.min((score / poTarget) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

