"""INTEGRATION Test Module"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import json

from ..models import (
    User, Department, ProgramOutcome, Course, CoursePO,
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    LearningOutcome, StudentLOAchievement, ContactRequest
)

from .base import BaseTestCase

# =============================================================================
# INTEGRATION TESTS
# =============================================================================

class IntegrationTest(BaseTestCase):
    """Test complete workflows"""
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def test_complete_workflow_po_creation_to_achievement(self):
        """Test complete workflow: PO creation -> Course mapping -> Assessment -> Grade -> Achievement"""
        import uuid
        unique_code = f'PO3_{uuid.uuid4().hex[:6]}'
        # 1. Institution creates PO
        self.client.force_authenticate(user=self.institution)
        po_response = self.client.post('/api/program-outcomes/', {
            'code': unique_code,
            'title': 'Design Solutions',
            'description': 'Design solutions for complex problems',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        self.assertEqual(po_response.status_code, status.HTTP_201_CREATED)
        po_id = po_response.data['id']
        
        # 2. Teacher creates LO and links it to PO via LOPO
        from ..models import LOPO
        lo_response = self.client.post('/api/learning-outcomes/', {
            'course': self.course.id,
            'code': 'LO3',
            'title': 'Design Solutions LO',
            'description': 'LO for design solutions',
            'target_percentage': '70.00'
        })
        lo_id = lo_response.data['id']
        
        # Link LO to PO
        LOPO.objects.create(
            learning_outcome_id=lo_id,
            program_outcome_id=po_id,
            weight=Decimal('1.0')
        )
        
        # 3. Teacher creates assessment linked to LO
        self.client.force_authenticate(user=self.teacher)
        assessment_response = self.client.post('/api/assessments/', {
            'course': self.course.id,
            'title': 'Final Exam',
            'assessment_type': Assessment.AssessmentType.FINAL,
            'weight': '40.00',
            'max_score': '100.00',
            'is_active': True
        })
        self.assertEqual(assessment_response.status_code, status.HTTP_201_CREATED)
        assessment_id = assessment_response.data['id']
        
        # Link assessment to LO via AssessmentLO
        from ..models import AssessmentLO
        AssessmentLO.objects.create(
            assessment_id=assessment_id,
            learning_outcome_id=lo_id,
            weight=Decimal('1.0')
        )
        
        # 4. Teacher creates grade
        grade_response = self.client.post('/api/grades/', {
            'student': self.student.id,
            'assessment': assessment_id,
            'score': '85.00',
            'feedback': 'Good work'
        })
        self.assertEqual(grade_response.status_code, status.HTTP_201_CREATED)
        
        # 5. Verify grade was created
        grade = StudentGrade.objects.get(id=grade_response.data['id'])
        self.assertEqual(grade.score, Decimal('85.00'))
        self.assertEqual(grade.student, self.student)
        
        # 6. Verify PO achievement was automatically calculated (through LO → PO path)
        po_achievement = StudentPOAchievement.objects.filter(
            student=self.student,
            program_outcome_id=po_id
        ).first()
        self.assertIsNotNone(po_achievement, "PO achievement should be automatically created")
        self.assertGreater(po_achievement.current_percentage, Decimal('0.00'))
    
    def test_complete_workflow_lo_creation(self):
        """Test complete workflow: LO creation -> Assessment link -> Grade"""
        # 1. Teacher creates LO
        self.client.force_authenticate(user=self.teacher)
        lo_response = self.client.post('/api/learning-outcomes/', {
            'course': self.course.id,
            'code': 'LO2',
            'title': 'Implement Algorithms',
            'description': 'Students will implement algorithms',
            'target_percentage': '70.00'
        })
        self.assertEqual(lo_response.status_code, status.HTTP_201_CREATED)
        lo_id = lo_response.data['id']
        
        # 2. Teacher links LO to assessment
        self.assessment.related_los.add(LearningOutcome.objects.get(id=lo_id))
        
        # 3. Verify LO is linked
        self.assertIn(LearningOutcome.objects.get(id=lo_id), self.assessment.related_los.all())
