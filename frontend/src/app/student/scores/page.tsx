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
  }>;
  los: Array<{
    id: string;
    label: string;
    score: number;
    poWeights: Record<string, number>; // PO ID -> weight
  }>;
  pos: Array<{
    id: string;
    label: string;
    score: number;
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

  const { isDark, themeClasses, mutedText, text } = useThemeColors();

  useEffect(() => {
    setMounted(true);
    fetchEnrollments();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseScoreData(selectedCourseId);
    }
  }, [selectedCourseId]);

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
      
      try {
        const results = await Promise.allSettled([
          api.getCourse(courseId),
          api.getAssessments({ course: courseId }),
          api.getLearningOutcomes({ course: courseId }),
          api.getProgramOutcomes(),
          api.getGrades(),
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

      const assessmentIds = assessments.map(a => a.id);
      const assessmentLOs = allAssessmentLOs.filter(al => assessmentIds.includes(al.assessment));

      // Filter LO-POs to only those related to this course's LOs
      const loIds = los.map(lo => lo.id);
      const loPOs = allLOPOs.filter(lp => loIds.includes(lp.learning_outcome));

      // Process data into CourseScoreData format
      const processedData = processCourseData(
        course,
        assessments,
        los,
        pos,
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

      console.log('📊 Data check:', {
        hasAssessments,
        hasLOs,
        hasPOs,
        hasAssessmentEdges,
        hasLOEdges,
      });

      // If no edges can be generated, use sample data
      if (!hasLOEdges && !hasAssessmentEdges) {
        console.warn('⚠️ No edges can be generated from real data. Using sample data.');
        const sampleData = getSampleData();
        setCourseData(sampleData);
        generateGraph(sampleData);
      } else {
        setCourseData(processedData);
        generateGraph(processedData);
      }
    } catch (err: any) {
      console.error('Failed to fetch course data:', err);
      setError(err.message || 'Failed to load course data');
      // Use sample data as fallback
      const sampleData = getSampleData();
      setCourseData(sampleData);
      generateGraph(sampleData);
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
    // Create assessment data with scores
    const assessmentData = assessments.map(assessment => {
      const grade = grades.find(g => g.assessment === assessment.id);
      const score = grade?.score || 0;
      const maxScore = assessment.max_score;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

      // Get weights for this assessment -> LO
      const weights: Record<string, number> = {};
      assessmentLOs
        .filter(al => al.assessment === assessment.id)
        .forEach(al => {
          weights[`lo-${al.learning_outcome}`] = al.weight;
        });

      return {
        id: `assessment-${assessment.id}`,
        label: assessment.title,
        score,
        maxScore,
        percentage,
        weights,
      };
    });

    // Create LO data with calculated scores
    const loData = los.map(lo => {
      // Calculate LO score from assessments
      let totalWeight = 0;
      let weightedSum = 0;

      assessmentLOs
        .filter(al => al.learning_outcome === lo.id)
        .forEach(al => {
          const assessment = assessments.find(a => a.id === al.assessment);
          const grade = grades.find(g => g.assessment === al.assessment);
          if (assessment && grade) {
            const percentage = assessment.max_score > 0 
              ? (grade.score / assessment.max_score) * 100 
              : 0;
            weightedSum += percentage * al.weight;
            totalWeight += al.weight;
          }
        });

      const loScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      // Get weights for this LO -> PO
      const poWeights: Record<string, number> = {};
      loPOs
        .filter(lp => lp.learning_outcome === lo.id)
        .forEach(lp => {
          poWeights[`po-${lp.program_outcome}`] = lp.weight;
        });

      return {
        id: `lo-${lo.id}`,
        label: lo.code || `LO${lo.id}`,
        score: loScore,
        poWeights,
      };
    });

    // Create PO data with calculated scores
    const poData = pos.map(po => {
      // Calculate PO score from LOs
      let totalWeight = 0;
      let weightedSum = 0;

      loPOs
        .filter(lp => lp.program_outcome === po.id)
        .forEach(lp => {
          const lo = los.find(l => l.id === lp.learning_outcome);
          if (lo) {
            // Get LO score (calculated above)
            const loItem = loData.find(l => l.id === `lo-${lo.id}`);
            if (loItem) {
              weightedSum += loItem.score * lp.weight;
              totalWeight += lp.weight;
            }
          }
        });

      const poScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      return {
        id: `po-${po.id}`,
        label: po.code || `PO${po.id}`,
        score: poScore,
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

  const getSampleData = (): CourseScoreData => {
    return {
      course: {
        id: 1,
        code: 'CSE302',
        name: 'Database Systems',
      },
      assessments: [
        { 
          id: 'assessment-1', 
          label: 'Midterm Exam', 
          score: 85, 
          maxScore: 100, 
          percentage: 85, 
          weights: { 
            'lo-2': 0.5,  // LO2'ye %50 katkı
            'lo-3': 0.3   // LO3'e %30 katkı
          } 
        },
        { 
          id: 'assessment-2', 
          label: 'Final Exam', 
          score: 90, 
          maxScore: 100, 
          percentage: 90, 
          weights: { 
            'lo-2': 0.3,  // LO2'ye %30 katkı
            'lo-3': 0.4   // LO3'e %40 katkı
          } 
        },
        { 
          id: 'assessment-3', 
          label: 'Project', 
          score: 80, 
          maxScore: 100, 
          percentage: 80, 
          weights: { 
            'lo-3': 0.6   // LO3'e %60 katkı
          } 
        },
      ],
      los: [
        { 
          id: 'lo-2', 
          label: 'LO2', 
          score: 87.5, 
          poWeights: { 
            'po-1': 1.0,  // PO1'e %100 katkı
            'po-2': 0.5   // PO2'ye %50 katkı
          } 
        },
        { 
          id: 'lo-3', 
          label: 'LO3', 
          score: 85.0, 
          poWeights: { 
            'po-1': 0.5,  // PO1'e %50 katkı
            'po-2': 1.0   // PO2'ye %100 katkı
          } 
        },
      ],
      pos: [
        { id: 'po-1', label: 'PO1', score: 86.25 },
        { id: 'po-2', label: 'PO2', score: 85.0 },
      ],
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

  // Dagre layout function
  const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB') => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ 
      rankdir: direction,
      nodesep: 80,
      ranksep: 120,
      marginx: 50,
      marginy: 50,
    });

    nodes.forEach((node) => {
      g.setNode(node.id, { width: 256, height: 120 });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      if (!nodeWithPosition) {
        return {
          ...node,
          targetPosition: Position.Top,
          sourcePosition: Position.Bottom,
          position: { x: 0, y: 0 },
        };
      }
      return {
        ...node,
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
        position: {
          x: nodeWithPosition.x - 128,
          y: nodeWithPosition.y - 60,
        },
      };
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
          edges.push({
            id: `${assessment.id}-${loId}`,
            source: assessment.id,
            target: loId,
            label: `${(weight * 100).toFixed(0)}%`,
            type: 'custom',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: {
              stroke: isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.4)',
              strokeWidth: 2,
            },
          });
        }
      });
    });

    // LO → PO edges (purple)
    data.los.forEach(lo => {
      Object.keys(lo.poWeights || {}).forEach(poId => {
        const weight = lo.poWeights[poId];
        if (weight && weight > 0) {
          edges.push({
            id: `${lo.id}-${poId}`,
            source: lo.id,
            target: poId,
            label: `${(weight * 100).toFixed(0)}%`,
            type: 'custom',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: {
              stroke: isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.4)',
              strokeWidth: 2,
            },
          });
        }
      });
    });

    return edges;
  }, [isDark]);

  // Generate graph nodes and edges
  const generateGraph = useCallback((data: CourseScoreData) => {
    const newNodes: Node[] = [];
    
    // Assessment nodes
    data.assessments.forEach(assessment => {
      newNodes.push({
        id: assessment.id,
        type: 'default',
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-blue-50 border border-blue-200'}`}>
              <p className="font-bold text-sm">{assessment.label}</p>
              <p className="text-xs mt-1">{assessment.score.toFixed(1)} / {assessment.maxScore} ({assessment.percentage.toFixed(1)}%)</p>
            </div>
          ),
        },
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
      });
    });

    // LO nodes
    data.los.forEach(lo => {
      newNodes.push({
        id: lo.id,
        type: 'default',
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-purple-50 border border-purple-200'}`}>
              <p className="font-bold text-sm">{lo.label}</p>
              <p className="text-xs mt-1">{lo.score.toFixed(1)}%</p>
            </div>
          ),
        },
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
      });
    });

    // PO nodes
    data.pos.forEach(po => {
      newNodes.push({
        id: po.id,
        type: 'default',
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div className={`p-4 rounded-lg ${isDark ? 'bg-green-500/20 border border-green-400/30' : 'bg-green-50 border border-green-200'}`}>
              <p className="font-bold text-sm">{po.label}</p>
              <p className="text-xs mt-1">{po.score.toFixed(1)}%</p>
            </div>
          ),
        },
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
      });
    });

    const newEdges = generateEdges(data);
    const layouted = getLayoutedElements(newNodes, newEdges, 'TB');
    
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
          score: `${assessment.score.toFixed(1)} / ${assessment.maxScore}`,
          percentage: `${assessment.percentage.toFixed(1)}%`,
          contributions: Object.entries(assessment.weights || {}).map(([loId, weight]) => ({
            target: courseData?.los.find(lo => lo.id === loId)?.label || loId,
            weight: `${(weight * 100).toFixed(0)}%`,
          })),
        };
      }
    } else if (nodeId.startsWith('lo-')) {
      const lo = courseData?.los.find(l => l.id === nodeId);
      if (lo) {
        tooltipContent = {
          type: 'lo',
          title: lo.label,
          score: `${lo.score.toFixed(1)}%`,
          contributions: Object.entries(lo.poWeights || {}).map(([poId, weight]) => ({
            target: courseData?.pos.find(po => po.id === poId)?.label || poId,
            weight: `${(weight * 100).toFixed(0)}%`,
          })),
        };
      }
    } else if (nodeId.startsWith('po-')) {
      const po = courseData?.pos.find(p => p.id === nodeId);
      if (po) {
        tooltipContent = {
          type: 'po',
          title: po.label,
          score: `${po.score.toFixed(1)}%`,
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
          Score Flow Visualization
        </h1>
        <p className={mutedText}>
          Visualize how your scores flow from assessments → Learning Outcomes → Program Outcomes
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
                        {enrollment.is_active ? 'In Progress' : 'Completed'}
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
            className={`${isDark ? 'bg-gray-900/95 border border-gray-700' : 'bg-white/95 border border-gray-200'} rounded-lg shadow-xl p-4 max-w-xs backdrop-blur-sm`}
          >
            <div className="space-y-2">
              <h4 className={`font-bold text-sm ${text} flex items-center gap-2`}>
                {tooltipData.type === 'assessment' && <FileText className="w-4 h-4 text-blue-500" />}
                {tooltipData.type === 'lo' && <Target className="w-4 h-4 text-purple-500" />}
                {tooltipData.type === 'po' && <Award className="w-4 h-4 text-green-500" />}
                {tooltipData.title}
              </h4>
              {tooltipData.score && (
                <p className={`text-xs ${mutedText}`}>
                  Score: <span className={`font-semibold ${text}`}>{tooltipData.score}</span>
                  {tooltipData.percentage && (
                    <span className={`ml-2 ${text}`}>({tooltipData.percentage})</span>
                  )}
                </p>
              )}
              {tooltipData.contributions && tooltipData.contributions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-500/20">
                  <p className={`text-xs font-semibold ${mutedText} mb-1`}>Contributions:</p>
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
              className={`${themeClasses.card} rounded-xl shadow-xl p-4 h-[700px] relative`}
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

      {/* Summary Section */}
      {!loading && courseData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${themeClasses.card} rounded-xl shadow-xl p-6 mt-6`}
        >
          <h2 className={`text-2xl font-bold ${text} mb-4 flex items-center gap-2`}>
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Program Outcomes Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {courseData.pos.map((po) => (
              <motion.div
                key={po.id}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`p-4 rounded-lg ${
                  isDark ? 'bg-blue-500/10 border border-blue-400/30' : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{po.label}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {po.score.toFixed(0)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

