"""
AcuRate - Custom Exception Handlers
Provides structured error responses and logging
"""

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from django.db import IntegrityError

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF
    Provides structured error responses with logging
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # Get the view and request
    view = context.get('view')
    request = context.get('request')
    
    # Log the exception
    logger.error(
        f"Exception in {view.__class__.__name__ if view else 'Unknown'}: {type(exc).__name__}",
        exc_info=True,
        extra={
            'view': view.__class__.__name__ if view else None,
            'request_path': request.path if request else None,
            'request_method': request.method if request else None,
            'user': request.user.username if request and hasattr(request, 'user') else None,
        }
    )
    
    # Custom handling for different exception types
    if response is not None:
        # Customize the response data structure
        custom_response_data = {
            'success': False,
            'error': {
                'type': type(exc).__name__,
                'message': str(exc),
                'code': response.status_code,
            }
        }
        
        # Add field-specific errors if available
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                custom_response_data['error']['fields'] = exc.detail
            elif isinstance(exc.detail, list):
                custom_response_data['error']['messages'] = exc.detail
            else:
                custom_response_data['error']['message'] = str(exc.detail)
        
        response.data = custom_response_data
        
    else:
        # Handle non-DRF exceptions
        if isinstance(exc, ValidationError):
            response = Response(
                {
                    'success': False,
                    'error': {
                        'type': 'ValidationError',
                        'message': 'Validation failed',
                        'details': exc.message_dict if hasattr(exc, 'message_dict') else str(exc),
                        'code': status.HTTP_400_BAD_REQUEST,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        elif isinstance(exc, IntegrityError):
            response = Response(
                {
                    'success': False,
                    'error': {
                        'type': 'IntegrityError',
                        'message': 'Database integrity error. This record may already exist.',
                        'code': status.HTTP_409_CONFLICT,
                    }
                },
                status=status.HTTP_409_CONFLICT
            )
        else:
            # Generic 500 error for unhandled exceptions
            response = Response(
                {
                    'success': False,
                    'error': {
                        'type': type(exc).__name__,
                        'message': 'An unexpected error occurred. Please try again later.',
                        'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return response

