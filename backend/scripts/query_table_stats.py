#!/usr/bin/env python
"""
Script to query PostgreSQL database for table row counts and sizes.
This script generates statistics needed for Section 3: Data Model report.

Usage: python manage.py shell < scripts/query_table_stats.py
Or: python scripts/query_table_stats.py (if run from backend directory)
"""
import os
import sys
import django
from decimal import Decimal
from pathlib import Path

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Try to load .env file if it exists, but don't fail if it doesn't
try:
    from dotenv import load_dotenv
    env_path = BASE_DIR / '.env'
    if env_path.exists():
        load_dotenv(env_path)
except (ImportError, PermissionError):
    pass  # Continue without .env file

django.setup()

from django.db import connection
from api.models import (
    StudentGrade, User, Course, Assessment, LearningOutcome, 
    ProgramOutcome, AssessmentLO, LOPO
)


def get_table_size(table_name):
    """Get table size in bytes and human-readable format."""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                pg_size_pretty(pg_total_relation_size(%s)) as size,
                pg_total_relation_size(%s) as size_bytes
        """, [table_name, table_name])
        result = cursor.fetchone()
        if result:
            return result[0], result[1]  # human-readable, bytes
        return "0 bytes", 0


def get_row_count(model_class):
    """Get row count for a Django model."""
    return model_class.objects.count()


def get_student_count():
    """Get count of students only."""
    return User.objects.filter(role='STUDENT').count()


def main():
    """Query all relevant tables and print statistics."""
    print("=" * 80)
    print("DATABASE TABLE STATISTICS")
    print("=" * 80)
    print()
    
    # Mapping of dimensional schema names to actual tables/models
    tables = [
        # (Dimensional Schema Name, Actual Table Name, Model Class, Special Query Function)
        ("Fact_AssessmentGrade", "student_grades", StudentGrade, None),
        ("Dim_Student", "users", User, get_student_count),  # Only students
        ("Dim_Course", "courses", Course, None),
        ("Dim_Assessment", "assessments", Assessment, None),
        ("Dim_LearningOutcome", "learning_outcomes", LearningOutcome, None),
        ("Dim_ProgramOutcome", "program_outcomes", ProgramOutcome, None),
        ("Fact_AssessmentGrade_Bridge_LO", "assessment_learning_outcomes", AssessmentLO, None),
        ("Fact_AssessmentGrade_Bridge_PO", "lo_program_outcomes", LOPO, None),
    ]
    
    results = []
    
    for dim_name, table_name, model_class, special_query in tables:
        if special_query:
            row_count = special_query()
        else:
            row_count = get_row_count(model_class)
        
        size_human, size_bytes = get_table_size(f'"{table_name}"')
        
        results.append({
            'dimensional_name': dim_name,
            'table_name': table_name,
            'row_count': row_count,
            'size_human': size_human,
            'size_bytes': size_bytes
        })
        
        print(f"{dim_name:40} | {table_name:35} | Rows: {row_count:8} | Size: {size_human}")
    
    print()
    print("=" * 80)
    print("DETAILED RESULTS (for report)")
    print("=" * 80)
    print()
    
    for result in results:
        print(f"Table: {result['dimensional_name']}")
        print(f"  Actual DB Table: {result['table_name']}")
        print(f"  Row Count: {result['row_count']}")
        print(f"  Size: {result['size_human']} ({result['size_bytes']} bytes)")
        print()
    
    # Check for Dim_Time - might be derived or separate
    print("Checking for time dimension table...")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%time%' OR table_name LIKE '%date%'
            ORDER BY table_name
        """)
        time_tables = cursor.fetchall()
        if time_tables:
            print("Found potential time-related tables:")
            for table in time_tables:
                print(f"  - {table[0]}")
        else:
            print("  No separate time dimension table found (likely derived from date fields)")
    
    return results


if __name__ == '__main__':
    main()

