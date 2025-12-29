"""
AcuRate - Bulk Operation Views (Class-Based)

This module provides class-based API views for bulk operations.
These views use the service layer for business logic.
"""

import logging
from typing import Any

from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from ..models import User
from ..services.student_import_service import (
    StudentImportService,
    StudentImportServiceError,
)
from ..utils import log_activity


logger = logging.getLogger(__name__)


# =============================================================================
# BULK STUDENT IMPORT VIEW
# =============================================================================

class BulkStudentImportView(APIView):
    """
    API View for bulk importing students from CSV files.
    
    This endpoint allows institution admins to upload a CSV file
    containing student information to create multiple student accounts
    at once.
    
    Permissions:
        - Requires authentication
        - Only INSTITUTION role or staff can import students
    
    Request:
        - Method: POST
        - Content-Type: multipart/form-data
        - Body: file (CSV file)
    
    Response:
        {
            "success": true,
            "data": {
                "success_count": 10,
                "skipped_count": 2,
                "errors": [
                    {"row": 3, "message": "Email already exists", "email": "..."}
                ]
            },
            "message": "Successfully imported 10 students"
        }
    """
    
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    @swagger_auto_schema(
        operation_summary="Bulk import students from CSV",
        operation_description=(
            "Upload a CSV file to bulk import students. "
            "Required columns: email, first_name, last_name. "
            "Optional columns: student_id, department, year_of_study, phone."
        ),
        manual_parameters=[
            openapi.Parameter(
                name='file',
                in_=openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=True,
                description='CSV file containing student data'
            ),
            openapi.Parameter(
                name='skip_existing',
                in_=openapi.IN_FORM,
                type=openapi.TYPE_BOOLEAN,
                required=False,
                default=True,
                description='Skip rows with existing emails instead of reporting as errors'
            ),
            openapi.Parameter(
                name='send_emails',
                in_=openapi.IN_FORM,
                type=openapi.TYPE_BOOLEAN,
                required=False,
                default=False,
                description='Send welcome emails to newly created students'
            ),
        ],
        responses={
            200: openapi.Response(
                description="Import completed",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'success': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'data': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'success_count': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'skipped_count': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'errors': openapi.Schema(
                                    type=openapi.TYPE_ARRAY,
                                    items=openapi.Schema(
                                        type=openapi.TYPE_OBJECT,
                                        properties={
                                            'row': openapi.Schema(type=openapi.TYPE_INTEGER),
                                            'message': openapi.Schema(type=openapi.TYPE_STRING),
                                            'email': openapi.Schema(type=openapi.TYPE_STRING),
                                        }
                                    )
                                ),
                            }
                        ),
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                    }
                )
            ),
            400: openapi.Response(description="Validation error"),
            403: openapi.Response(description="Permission denied"),
        },
        tags=['Bulk Operations'],
    )
    def post(self, request: Request) -> Response:
        """
        Handle POST request for bulk student import.
        
        Args:
            request: DRF Request object containing the uploaded file.
        
        Returns:
            Response with import results or error details.
        """
        user = request.user
        
        # Permission check
        if user.role != User.Role.INSTITUTION and not user.is_staff:
            logger.warning(
                f"User {user.username} attempted student import without permission"
            )
            return Response(
                {
                    'success': False,
                    'error': {
                        'type': 'PermissionDenied',
                        'message': 'Only institution admins can import students',
                        'code': status.HTTP_403_FORBIDDEN,
                    }
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check file presence
        if 'file' not in request.FILES:
            return Response(
                {
                    'success': False,
                    'error': {
                        'type': 'ValidationError',
                        'message': 'No file provided. Please upload a CSV file.',
                        'code': status.HTTP_400_BAD_REQUEST,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        
        # Validate file extension
        if not uploaded_file.name.lower().endswith('.csv'):
            return Response(
                {
                    'success': False,
                    'error': {
                        'type': 'ValidationError',
                        'message': 'Only CSV files are allowed. Please upload a .csv file.',
                        'code': status.HTTP_400_BAD_REQUEST,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse optional parameters
        skip_existing = self._parse_boolean(request.data.get('skip_existing', 'true'))
        send_emails = self._parse_boolean(request.data.get('send_emails', 'false'))
        
        try:
            # Create service and perform import
            service = StudentImportService(uploaded_file)
            result = service.import_students(
                created_by=user,
                skip_existing=skip_existing,
                send_emails=send_emails,
            )
            
            # Log activity
            log_activity(
                user=user,
                action_type='CREATE',
                model_name='User',
                description=(
                    f'Bulk imported {result.success_count} students, '
                    f'skipped {result.skipped_count}'
                )
            )
            
            logger.info(
                f"Student import by {user.username}: "
                f"{result.success_count} created, {result.skipped_count} skipped"
            )
            
            return Response(
                {
                    'success': True,
                    'data': result.to_dict(),
                    'message': (
                        f'Successfully imported {result.success_count} students'
                        + (f', skipped {result.skipped_count}' if result.skipped_count else '')
                    ),
                },
                status=status.HTTP_200_OK
            )
            
        except StudentImportServiceError as e:
            logger.warning(f"Student import validation error: {str(e)}")
            return Response(
                {
                    'success': False,
                    'error': {
                        'type': 'ValidationError',
                        'message': str(e),
                        'code': status.HTTP_400_BAD_REQUEST,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            logger.error(f"Unexpected error during student import: {str(e)}", exc_info=True)
            return Response(
                {
                    'success': False,
                    'error': {
                        'type': 'ServerError',
                        'message': f'Failed to import students: {str(e)}',
                        'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _parse_boolean(self, value: Any) -> bool:
        """Parse a boolean value from request data."""
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ('true', '1', 'yes', 'on')
        return bool(value)
    
    @swagger_auto_schema(
        operation_summary="Get CSV template for student import",
        operation_description="Returns a CSV template with headers and example data.",
        responses={
            200: openapi.Response(
                description="CSV template",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'success': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'data': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'template': openapi.Schema(type=openapi.TYPE_STRING),
                                'required_columns': openapi.Schema(
                                    type=openapi.TYPE_ARRAY,
                                    items=openapi.Schema(type=openapi.TYPE_STRING)
                                ),
                                'optional_columns': openapi.Schema(
                                    type=openapi.TYPE_ARRAY,
                                    items=openapi.Schema(type=openapi.TYPE_STRING)
                                ),
                            }
                        ),
                    }
                )
            ),
        },
        tags=['Bulk Operations'],
    )
    def get(self, request: Request) -> Response:
        """
        Handle GET request to retrieve CSV template.
        
        Args:
            request: DRF Request object.
        
        Returns:
            Response with CSV template and column information.
        """
        return Response(
            {
                'success': True,
                'data': {
                    'template': StudentImportService.get_csv_template(),
                    'required_columns': ['email', 'first_name', 'last_name'],
                    'optional_columns': ['student_id', 'department', 'year_of_study', 'phone'],
                },
            },
            status=status.HTTP_200_OK
        )

