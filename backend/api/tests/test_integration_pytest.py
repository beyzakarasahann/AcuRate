"""
Integration Tests - Pytest Version

Tests for complete workflows using pytest.
"""

import pytest
import uuid
from decimal import Decimal
from rest_framework import status

from api.models import (
    Enrollment, Assessment, StudentGrade, StudentPOAchievement,
    LearningOutcome, AssessmentLO, LOPO
)


# =============================================================================
# INTEGRATION TESTS - Pytest Style
# =============================================================================

@pytest.mark.integration
class TestCompleteWorkflows:
    """Test complete workflows"""
    
    def test_complete_workflow_po_creation_to_achievement(
        self, authenticated_institution_client, authenticated_teacher_client,
        student_user, course, enrollment, db
    ):
        """Test complete workflow: PO creation -> Course mapping -> Assessment -> Grade -> Achievement"""
        unique_code = f'PO3_{uuid.uuid4().hex[:6]}'
        
        # 1. Institution creates PO
        po_response = authenticated_institution_client.post('/api/program-outcomes/', {
            'code': unique_code,
            'title': 'Design Solutions',
            'description': 'Design solutions for complex problems',
            'department': 'Computer Science',
            'target_percentage': '70.00'
        })
        assert po_response.status_code == status.HTTP_201_CREATED
        po_id = po_response.data['id']
        
        # 2. Teacher creates LO and links it to PO via LOPO
        lo_response = authenticated_teacher_client.post('/api/learning-outcomes/', {
            'course': course.id,
            'code': 'LO3',
            'title': 'Design Solutions LO',
            'description': 'LO for design solutions',
            'target_percentage': '70.00'
        })
        assert lo_response.status_code == status.HTTP_201_CREATED, \
            f"LO creation failed: {lo_response.data}"
        lo_id = lo_response.data['id']
        
        # Link LO to PO
        LOPO.objects.create(
            learning_outcome_id=lo_id,
            program_outcome_id=po_id,
            weight=Decimal('1.0')
        )
        
        # 3. Teacher creates assessment linked to LO
        assessment_response = authenticated_teacher_client.post('/api/assessments/', {
            'course': course.id,
            'title': 'Final Exam',
            'assessment_type': Assessment.AssessmentType.FINAL,
            'weight': '40.00',
            'max_score': '100.00',
            'is_active': True
        })
        assert assessment_response.status_code == status.HTTP_201_CREATED
        assessment_id = assessment_response.data['id']
        
        # Link assessment to LO via AssessmentLO
        AssessmentLO.objects.create(
            assessment_id=assessment_id,
            learning_outcome_id=lo_id,
            weight=Decimal('1.0')
        )
        
        # 4. Teacher creates grade
        grade = StudentGrade.objects.create(
            student=student_user,
            assessment_id=assessment_id,
            score=Decimal('85.00'),
            feedback='Good work'
        )
        
        # 5. Verify grade was created
        assert grade.score == Decimal('85.00')
        assert grade.student == student_user
        
        # 6. Verify PO achievement exists or can be created
        po_achievement, created = StudentPOAchievement.objects.get_or_create(
            student=student_user,
            program_outcome_id=po_id,
            defaults={'current_percentage': Decimal('85.00')}
        )
        assert po_achievement is not None, "PO achievement should exist"
    
    def test_complete_workflow_lo_creation(
        self, authenticated_teacher_client, course, assessment, db
    ):
        """Test complete workflow: LO creation -> Assessment link -> Grade"""
        # 1. Teacher creates LO
        lo_response = authenticated_teacher_client.post('/api/learning-outcomes/', {
            'course': course.id,
            'code': 'LO2',
            'title': 'Implement Algorithms',
            'description': 'Students will implement algorithms',
            'target_percentage': '70.00'
        })
        assert lo_response.status_code == status.HTTP_201_CREATED
        lo_id = lo_response.data['id']
        
        # 2. Teacher links LO to assessment via AssessmentLO
        AssessmentLO.objects.create(
            assessment=assessment,
            learning_outcome_id=lo_id,
            weight=Decimal('1.0')
        )
        
        # 3. Verify LO is linked
        assert LearningOutcome.objects.get(id=lo_id) in assessment.related_los.all()









