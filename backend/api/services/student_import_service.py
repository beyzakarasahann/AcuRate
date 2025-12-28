"""
AcuRate - Student Import Service

This module provides a robust service for bulk importing students from CSV files.
It handles validation, duplicate detection, and atomic database operations.

Usage:
    from api.services.student_import_service import StudentImportService
    
    service = StudentImportService(csv_file)
    result = service.import_students(created_by=request.user)
    # result = {"success_count": 10, "skipped_count": 2, "errors": [...]}
"""

import csv
import io
import logging
import secrets
import string
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, BinaryIO

from django.db import transaction

from ..models import User


logger = logging.getLogger(__name__)


# =============================================================================
# CONSTANTS
# =============================================================================

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB max file size
MAX_ROWS = 10000  # Maximum rows to process
REQUIRED_COLUMNS = {'email', 'first_name', 'last_name'}
OPTIONAL_COLUMNS = {'student_id', 'department', 'year_of_study', 'phone'}


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class ImportError:
    """Represents an error encountered during import."""
    row: int
    message: str
    email: str | None = None


@dataclass
class ImportResult:
    """Result of a student import operation."""
    success_count: int = 0
    skipped_count: int = 0
    errors: list[ImportError] = field(default_factory=list)
    
    def to_dict(self) -> dict[str, Any]:
        """Convert result to a dictionary for API response."""
        return {
            "success_count": self.success_count,
            "skipped_count": self.skipped_count,
            "errors": [
                {"row": e.row, "message": e.message, "email": e.email}
                for e in self.errors
            ],
        }


# =============================================================================
# SERVICE CLASS
# =============================================================================

class StudentImportServiceError(Exception):
    """Custom exception for student import service errors."""
    pass


class StudentImportService:
    """
    A service class for bulk importing students from CSV files.
    
    This service provides a clean, testable interface for importing student
    data with proper validation, duplicate detection, and atomic operations.
    
    Attributes:
        file: The CSV file object to import.
        encoding: File encoding (default: utf-8).
    
    Example:
        >>> service = StudentImportService(csv_file)
        >>> result = service.import_students(created_by=admin_user)
        >>> print(result.success_count)
        10
    """
    
    def __init__(
        self,
        file: BinaryIO,
        encoding: str = 'utf-8',
    ) -> None:
        """
        Initialize the service with a CSV file.
        
        Args:
            file: A file-like object containing CSV data.
            encoding: Character encoding of the file. Defaults to 'utf-8'.
        
        Raises:
            StudentImportServiceError: If file validation fails.
        """
        self.file = file
        self.encoding = encoding
        self._rows: list[dict[str, str]] = []
        self._existing_emails: set[str] = set()
        self._existing_student_ids: set[str] = set()
    
    def _generate_temp_password(self, length: int = 12) -> str:
        """Generate a secure random temporary password."""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def _generate_student_id(self) -> str:
        """Generate a unique student ID based on year and random number."""
        current_year = datetime.now().year
        while True:
            candidate = f"{current_year}{secrets.randbelow(9000) + 1000}"
            if candidate not in self._existing_student_ids:
                if not User.objects.filter(student_id=candidate).exists():
                    self._existing_student_ids.add(candidate)
                    return candidate
    
    def _validate_file_size(self) -> None:
        """Validate that file size is within limits."""
        self.file.seek(0, 2)  # Seek to end
        size = self.file.tell()
        self.file.seek(0)  # Seek back to start
        
        if size > MAX_FILE_SIZE:
            raise StudentImportServiceError(
                f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )
    
    def _read_and_validate_csv(self) -> None:
        """Read CSV file and validate its structure."""
        try:
            content = self.file.read()
            if isinstance(content, bytes):
                content = content.decode(self.encoding)
        except UnicodeDecodeError as e:
            raise StudentImportServiceError(
                f"Invalid file encoding. Please use {self.encoding} encoded CSV files. "
                f"Error: {str(e)}"
            )
        
        reader = csv.DictReader(io.StringIO(content))
        
        # Check required columns
        if reader.fieldnames is None:
            raise StudentImportServiceError("CSV file is empty or has no header row.")
        
        fieldnames = {name.strip().lower() for name in reader.fieldnames if name}
        missing_columns = REQUIRED_COLUMNS - fieldnames
        
        if missing_columns:
            raise StudentImportServiceError(
                f"Missing required columns: {', '.join(missing_columns)}. "
                f"Required columns are: {', '.join(REQUIRED_COLUMNS)}"
            )
        
        # Read all rows
        self._rows = list(reader)
        
        if len(self._rows) > MAX_ROWS:
            raise StudentImportServiceError(
                f"Too many rows. Maximum allowed: {MAX_ROWS}. "
                f"File contains {len(self._rows)} rows."
            )
        
        if len(self._rows) == 0:
            raise StudentImportServiceError("CSV file contains no data rows.")
    
    def _load_existing_emails(self) -> None:
        """Load existing emails from database for duplicate detection."""
        self._existing_emails = set(
            User.objects.values_list('email', flat=True)
        )
    
    def _validate_row(self, row: dict[str, str], row_number: int) -> tuple[bool, str | None]:
        """
        Validate a single row of data.
        
        Args:
            row: Dictionary containing row data.
            row_number: The row number (1-indexed, accounting for header).
        
        Returns:
            Tuple of (is_valid, error_message).
        """
        email = row.get('email', '').strip().lower()
        
        if not email:
            return False, "Email is required"
        
        # Basic email validation
        if '@' not in email or '.' not in email.split('@')[-1]:
            return False, f"Invalid email format: {email}"
        
        first_name = row.get('first_name', '').strip()
        last_name = row.get('last_name', '').strip()
        
        if not first_name:
            return False, "First name is required"
        
        if not last_name:
            return False, "Last name is required"
        
        # Validate year_of_study if provided
        year_str = row.get('year_of_study', '').strip()
        if year_str:
            try:
                year = int(year_str)
                if year < 1 or year > 6:
                    return False, f"Year of study must be between 1 and 6, got: {year}"
            except ValueError:
                return False, f"Invalid year of study: {year_str}"
        
        return True, None
    
    def _create_student(
        self,
        row: dict[str, str],
        created_by: User | None = None,
    ) -> User:
        """
        Create a new student user from row data.
        
        Args:
            row: Dictionary containing row data.
            created_by: The user creating this student (for audit).
        
        Returns:
            The created User instance.
        """
        email = row.get('email', '').strip().lower()
        first_name = row.get('first_name', '').strip()
        last_name = row.get('last_name', '').strip()
        
        # Get or generate student_id
        student_id = row.get('student_id', '').strip()
        if not student_id:
            student_id = self._generate_student_id()
        
        # Parse optional fields
        department = row.get('department', '').strip() or None
        phone = row.get('phone', '').strip() or None
        
        year_str = row.get('year_of_study', '').strip()
        year_of_study = int(year_str) if year_str else 1
        
        # Generate temporary password
        temp_password = self._generate_temp_password()
        
        # Create user
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=User.Role.STUDENT,
            password=temp_password,
            is_temporary_password=True,
            student_id=student_id,
            department=department,
            year_of_study=year_of_study,
            phone=phone,
            created_by=created_by,
        )
        
        # Store temp password for potential email notification
        user._temp_password = temp_password
        
        return user
    
    def import_students(
        self,
        created_by: User | None = None,
        skip_existing: bool = True,
        send_emails: bool = False,
    ) -> ImportResult:
        """
        Import students from the CSV file.
        
        This method performs the entire import process including validation,
        duplicate detection, and database operations. All database changes
        are wrapped in an atomic transaction.
        
        Args:
            created_by: The user performing the import (for audit trail).
            skip_existing: If True, skip rows with existing emails.
                          If False, report them as errors.
            send_emails: If True, send welcome emails to new students.
        
        Returns:
            ImportResult containing success count, skipped count, and errors.
        
        Raises:
            StudentImportServiceError: If file validation fails.
        """
        result = ImportResult()
        
        logger.info(
            f"Starting student import by user {created_by.username if created_by else 'Anonymous'}"
        )
        
        # Step 1: Validate file size
        self._validate_file_size()
        
        # Step 2: Read and validate CSV structure
        self._read_and_validate_csv()
        
        # Step 3: Load existing emails for duplicate detection
        self._load_existing_emails()
        
        logger.info(f"Processing {len(self._rows)} rows for student import")
        
        # Step 4: Process rows in atomic transaction
        created_users: list[User] = []
        
        try:
            with transaction.atomic():
                for row_num, row in enumerate(self._rows, start=2):  # Header is row 1
                    # Normalize column names
                    normalized_row = {
                        k.strip().lower(): v for k, v in row.items() if k
                    }
                    
                    email = normalized_row.get('email', '').strip().lower()
                    
                    # Validate row
                    is_valid, error_msg = self._validate_row(normalized_row, row_num)
                    if not is_valid:
                        result.errors.append(ImportError(
                            row=row_num,
                            message=error_msg or "Validation failed",
                            email=email or None,
                        ))
                        continue
                    
                    # Check for duplicate email
                    if email in self._existing_emails:
                        if skip_existing:
                            result.skipped_count += 1
                            result.errors.append(ImportError(
                                row=row_num,
                                message="Email already exists (skipped)",
                                email=email,
                            ))
                        else:
                            result.errors.append(ImportError(
                                row=row_num,
                                message="Email already exists",
                                email=email,
                            ))
                        continue
                    
                    # Check for duplicate student_id if provided
                    student_id = normalized_row.get('student_id', '').strip()
                    if student_id:
                        if student_id in self._existing_student_ids:
                            result.errors.append(ImportError(
                                row=row_num,
                                message=f"Student ID '{student_id}' already exists in this import",
                                email=email,
                            ))
                            continue
                        
                        if User.objects.filter(student_id=student_id).exists():
                            result.errors.append(ImportError(
                                row=row_num,
                                message=f"Student ID '{student_id}' already exists in database",
                                email=email,
                            ))
                            continue
                        
                        self._existing_student_ids.add(student_id)
                    
                    # Create student
                    try:
                        user = self._create_student(normalized_row, created_by)
                        created_users.append(user)
                        self._existing_emails.add(email)
                        result.success_count += 1
                        
                    except Exception as e:
                        result.errors.append(ImportError(
                            row=row_num,
                            message=f"Failed to create student: {str(e)}",
                            email=email,
                        ))
                
                # If no students were created successfully, raise to rollback
                if result.success_count == 0 and len(result.errors) > 0:
                    # Don't rollback if there are skipped entries
                    if result.skipped_count == 0:
                        logger.warning("No students created successfully, rolling back")
                        raise StudentImportServiceError(
                            "No students were imported. Check errors for details."
                        )
        
        except StudentImportServiceError:
            raise
        except Exception as e:
            logger.error(f"Error during student import: {str(e)}", exc_info=True)
            raise StudentImportServiceError(f"Import failed: {str(e)}")
        
        # Step 5: Send emails (outside transaction to not block on email failures)
        if send_emails and created_users:
            self._send_welcome_emails(created_users)
        
        logger.info(
            f"Student import completed: {result.success_count} created, "
            f"{result.skipped_count} skipped, {len(result.errors)} errors"
        )
        
        return result
    
    def _send_welcome_emails(self, users: list[User]) -> None:
        """
        Send welcome emails to newly created students.
        
        This method is called outside the transaction to prevent
        email failures from rolling back the database changes.
        
        Args:
            users: List of User instances to send emails to.
        """
        from .email_service import EmailService
        
        for user in users:
            try:
                temp_password = getattr(user, '_temp_password', None)
                if temp_password:
                    # Send welcome email with credentials
                    EmailService.send_html_email(
                        subject="🎓 AcuRate'e Hoş Geldiniz!",
                        template_name="student_welcome.html",
                        context={
                            "first_name": user.first_name,
                            "email": user.email,
                            "username": user.username,
                            "student_id": user.student_id,
                            "temp_password": temp_password,
                        },
                        recipient_list=[user.email],
                    )
            except Exception as e:
                logger.warning(
                    f"Failed to send welcome email to {user.email}: {str(e)}"
                )
    
    @staticmethod
    def get_csv_template() -> str:
        """
        Get a CSV template string with headers and example data.
        
        Returns:
            A CSV string that can be used as a template.
        """
        return (
            "email,first_name,last_name,student_id,department,year_of_study,phone\n"
            "student1@example.com,John,Doe,2024001,Computer Science,2,+905551234567\n"
            "student2@example.com,Jane,Smith,,Electrical Engineering,1,\n"
        )

