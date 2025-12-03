"""
Django Management Command: Cleanup Duplicate Departments

This command merges duplicate department names, particularly "Computer Science"
variations (case-insensitive, whitespace differences).

Usage:
    python manage.py cleanup_departments
    python manage.py cleanup_departments --department "Computer Science"
    python manage.py cleanup_departments --dry-run
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import User, Course, ProgramOutcome


class Command(BaseCommand):
    help = "Clean up duplicate department names (case-insensitive, whitespace normalized)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--department',
            type=str,
            help='Specific department name to clean up (default: "Computer Science")',
            default='Computer Science'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without actually making changes'
        )
        parser.add_argument(
            '--auto',
            action='store_true',
            help='Automatically clean up all duplicate departments found'
        )

    def normalize_department_name(self, name):
        """Normalize department name for comparison"""
        if not name:
            return None
        return ' '.join(name.strip().split())

    def find_duplicate_variations(self, target_department):
        """
        Find all variations of the target department name
        Returns a list of all variations found in the database
        """
        normalized_target = self.normalize_department_name(target_department).lower()
        variations = set()
        
        # Find variations in User model
        user_departments = User.objects.exclude(
            department__isnull=True
        ).exclude(
            department=''
        ).values_list('department', flat=True).distinct()
        
        for dept in user_departments:
            if self.normalize_department_name(dept).lower() == normalized_target:
                variations.add(dept)
        
        # Find variations in Course model
        course_departments = Course.objects.values_list('department', flat=True).distinct()
        for dept in course_departments:
            if self.normalize_department_name(dept).lower() == normalized_target:
                variations.add(dept)
        
        # Find variations in ProgramOutcome model
        po_departments = ProgramOutcome.objects.values_list('department', flat=True).distinct()
        for dept in po_departments:
            if self.normalize_department_name(dept).lower() == normalized_target:
                variations.add(dept)
        
        return list(variations)

    def merge_department(self, target_name, variations, dry_run=False):
        """
        Merge all variations into the target department name
        """
        if target_name in variations:
            variations.remove(target_name)
        
        if not variations:
            self.stdout.write(
                self.style.SUCCESS(f'No duplicates found for "{target_name}"')
            )
            return 0
        
        self.stdout.write(
            self.style.WARNING(f'\nFound {len(variations)} duplicate variations:')
        )
        for var in variations:
            self.stdout.write(f'  - "{var}"')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('\n[DRY RUN] Would merge to: ' + target_name)
            )
            return 0
        
        updated_count = 0
        
        with transaction.atomic():
            # Update User records
            user_count = User.objects.filter(
                department__in=variations
            ).update(department=target_name)
            if user_count > 0:
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Updated {user_count} User records')
                )
                updated_count += user_count
            
            # Update Course records
            course_count = Course.objects.filter(
                department__in=variations
            ).update(department=target_name)
            if course_count > 0:
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Updated {course_count} Course records')
                )
                updated_count += course_count
            
            # Update ProgramOutcome records
            po_count = ProgramOutcome.objects.filter(
                department__in=variations
            ).update(department=target_name)
            if po_count > 0:
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Updated {po_count} ProgramOutcome records')
                )
                updated_count += po_count
        
        return updated_count

    def find_all_duplicates(self):
        """
        Find all departments that have duplicate variations
        """
        all_departments = set()
        
        # Get all departments from all models
        user_departments = User.objects.exclude(
            department__isnull=True
        ).exclude(
            department=''
        ).values_list('department', flat=True).distinct()
        
        course_departments = Course.objects.values_list('department', flat=True).distinct()
        po_departments = ProgramOutcome.objects.values_list('department', flat=True).distinct()
        
        all_departments.update(user_departments)
        all_departments.update(course_departments)
        all_departments.update(po_departments)
        
        # Group by normalized name
        normalized_groups = {}
        for dept in all_departments:
            if not dept:
                continue
            normalized = self.normalize_department_name(dept).lower()
            if normalized not in normalized_groups:
                normalized_groups[normalized] = []
            if dept not in normalized_groups[normalized]:
                normalized_groups[normalized].append(dept)
        
        # Find groups with duplicates
        duplicates = {}
        for normalized, variations in normalized_groups.items():
            if len(variations) > 1:
                # Choose the most common variation as target
                target = max(variations, key=lambda v: (
                    User.objects.filter(department=v).count() +
                    Course.objects.filter(department=v).count() +
                    ProgramOutcome.objects.filter(department=v).count()
                ))
                duplicates[normalized] = {
                    'target': target,
                    'variations': [v for v in variations if v != target]
                }
        
        return duplicates

    def handle(self, *args, **options):
        department = options['department']
        dry_run = options['dry_run']
        auto = options['auto']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('\n=== DRY RUN MODE - No changes will be made ===\n')
            )
        
        if auto:
            # Find and clean up all duplicates
            self.stdout.write(self.style.SUCCESS('\nScanning for all duplicate departments...\n'))
            duplicates = self.find_all_duplicates()
            
            if not duplicates:
                self.stdout.write(
                    self.style.SUCCESS('No duplicate departments found!')
                )
                return
            
            self.stdout.write(
                self.style.WARNING(f'Found {len(duplicates)} department(s) with duplicates:\n')
            )
            
            total_updated = 0
            for normalized, data in duplicates.items():
                target = data['target']
                variations = data['variations']
                
                self.stdout.write(
                    f'\n{"="*60}\n'
                    f'Department: {normalized.title()}\n'
                    f'Target name: "{target}"\n'
                    f'Variations to merge: {len(variations)}\n'
                )
                
                updated = self.merge_department(target, [target] + variations, dry_run)
                total_updated += updated
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n{"="*60}\n'
                    f'Total records updated: {total_updated}\n'
                    f'{"="*60}'
                )
            )
        else:
            # Clean up specific department
            normalized_target = self.normalize_department_name(department)
            if not normalized_target:
                self.stdout.write(
                    self.style.ERROR('Invalid department name provided')
                )
                return
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nCleaning up department: "{department}"\n'
                )
            )
            
            variations = self.find_duplicate_variations(normalized_target)
            
            if not variations:
                self.stdout.write(
                    self.style.SUCCESS(f'No department found with name "{department}"')
                )
                return
            
            # Use the most common variation as target (or the provided name if it exists)
            if department in variations:
                target_name = department
            else:
                # Find the variation with most records
                target_name = max(variations, key=lambda v: (
                    User.objects.filter(department=v).count() +
                    Course.objects.filter(department=v).count() +
                    ProgramOutcome.objects.filter(department=v).count()
                ))
                self.stdout.write(
                    self.style.WARNING(
                        f'"{department}" not found. Using most common variation: "{target_name}"'
                    )
                )
            
            updated = self.merge_department(target_name, variations, dry_run)
            
            if not dry_run and updated > 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n✅ Successfully merged {updated} records to "{target_name}"'
                    )
                )
            elif dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f'\n[DRY RUN] Would merge {len(variations)} variations to "{target_name}"'
                    )
                )






