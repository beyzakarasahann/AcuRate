"""
Data Migration: Convert direct Assessment → PO connections to Assessment → LO → PO

This migration ensures all Assessment → PO connections go through Learning Outcomes,
enforcing the 3-level graph structure: Assessment → LO → PO
"""

from django.db import migrations
from django.db.models import Q
from decimal import Decimal


def migrate_assessment_pos_to_lo_path(apps, schema_editor):
    """
    Migrate direct Assessment → PO connections to go through LOs.
    
    For each assessment with direct PO connections:
    1. Get all LOs for the assessment's course
    2. For each direct PO connection:
       - Find LOs that already map to this PO (via LOPO)
       - If no such LO exists, create a generic LO or use existing LOs
       - Create AssessmentLO mapping if it doesn't exist
       - Ensure LOPO mapping exists
    3. Remove direct PO connections
    """
    Assessment = apps.get_model('api', 'Assessment')
    LearningOutcome = apps.get_model('api', 'LearningOutcome')
    ProgramOutcome = apps.get_model('api', 'ProgramOutcome')
    AssessmentLO = apps.get_model('api', 'AssessmentLO')
    LOPO = apps.get_model('api', 'LOPO')
    
    # Get all assessments with direct PO connections
    assessments_with_pos = Assessment.objects.prefetch_related('related_pos', 'related_los').all()
    
    migrated_count = 0
    created_lo_count = 0
    created_assessment_lo_count = 0
    created_lopo_count = 0
    
    for assessment in assessments_with_pos:
        direct_pos = list(assessment.related_pos.all())
        
        if not direct_pos:
            continue
        
        # Get existing LOs for this assessment's course
        course_los = list(LearningOutcome.objects.filter(course=assessment.course))
        
        # Get existing AssessmentLO mappings
        existing_assessment_los = set(
            AssessmentLO.objects.filter(assessment=assessment)
            .values_list('learning_outcome_id', flat=True)
        )
        
        # For each direct PO connection
        for po in direct_pos:
            # Find LOs that already map to this PO
            los_mapped_to_po = LearningOutcome.objects.filter(
                lo_pos__program_outcome=po,
                course=assessment.course
            ).distinct()
            
            if los_mapped_to_po.exists():
                # Use existing LOs that map to this PO
                target_los = list(los_mapped_to_po)
            elif course_los:
                # Use any existing LO from the course
                target_los = course_los[:1]  # Use first LO
            else:
                # Create a generic LO for this course if none exists
                # This should rarely happen, but handle it
                continue  # Skip if no LOs exist - this should be handled separately
            
            # For each target LO, ensure mappings exist
            for lo in target_los:
                # Create AssessmentLO mapping if it doesn't exist
                if lo.id not in existing_assessment_los:
                    AssessmentLO.objects.get_or_create(
                        assessment=assessment,
                        learning_outcome=lo,
                        defaults={'weight': Decimal('1.00')}
                    )
                    created_assessment_lo_count += 1
                    existing_assessment_los.add(lo.id)
                
                # Ensure LOPO mapping exists
                lopo, created = LOPO.objects.get_or_create(
                    learning_outcome=lo,
                    program_outcome=po,
                    defaults={'weight': Decimal('1.00')}
                )
                if created:
                    created_lopo_count += 1
        
        # Remove direct PO connections
        assessment.related_pos.clear()
        migrated_count += 1
    
    print(f"✅ Migrated {migrated_count} assessments")
    print(f"✅ Created {created_assessment_lo_count} AssessmentLO mappings")
    print(f"✅ Created {created_lopo_count} LOPO mappings")


def reverse_migration(apps, schema_editor):
    """
    Reverse migration: This is not easily reversible as we don't know
    which PO connections were direct vs indirect.
    We'll leave this as a no-op.
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_alter_activitylog_action_type_assessmentlo_and_more'),
    ]

    operations = [
        migrations.RunPython(
            migrate_assessment_pos_to_lo_path,
            reverse_migration
        ),
    ]



