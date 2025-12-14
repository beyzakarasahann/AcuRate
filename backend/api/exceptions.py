"""
AcuRate - Custom Exception Handlers
Provides structured error responses and logging
SECURITY: Hides sensitive error details in production
"""

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.conf import settings

logger = logging.getLogger(__name__)

# SECURITY: Error messages that are safe to show to users
SAFE_ERROR_MESSAGES = {
    'NotAuthenticated': 'Authentication credentials were not provided.',
    'AuthenticationFailed': 'Invalid authentication credentials.',
    'PermissionDenied': 'You do not have permission to perform this action.',
    'NotFound': 'The requested resource was not found.',
    'MethodNotAllowed': 'This method is not allowed.',
    'Throttled': 'Request was throttled. Please try again later.',
    'ValidationError': 'The provided data is invalid.',
    'ParseError': 'Invalid data format.',
}


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
        exc_type = type(exc).__name__
        
        # SECURITY: In production, use safe error messages to prevent information leakage
        if settings.DEBUG:
            error_message = str(exc)
        else:
            # Use safe message or generic message
            error_message = SAFE_ERROR_MESSAGES.get(exc_type, 'An error occurred.')
        
        # Customize the response data structure
        custom_response_data = {
            'success': False,
            'error': {
                'type': exc_type,
                'message': error_message,
                'code': response.status_code,
            }
        }
        
        # Add field-specific errors if available (validation errors are safe to show)
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                # Field validation errors are safe to expose
                custom_response_data['error']['fields'] = exc.detail
            elif isinstance(exc.detail, list):
                custom_response_data['error']['messages'] = exc.detail
            else:
                # In debug mode, show actual message; in production, use safe message
                if settings.DEBUG:
                    custom_response_data['error']['message'] = str(exc.detail)
        
        response.data = custom_response_data
        
    else:
        # Handle non-DRF exceptions
        if isinstance(exc, ValidationError):
            # SECURITY: Only show validation details in debug mode
            if settings.DEBUG:
                details = exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
            else:
                details = 'Please check your input and try again.'
            
            response = Response(
                {
                    'success': False,
                    'error': {
                        'type': 'ValidationError',
                        'message': 'Validation failed',
                        'details': details,
                        'code': status.HTTP_400_BAD_REQUEST,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        elif isinstance(exc, IntegrityError):
            # SECURITY: Generic message - don't reveal database structure
            response = Response(
                {
                    'success': False,
                    'error': {
                        'type': 'IntegrityError',
                        'message': 'This operation could not be completed. The record may already exist.',
                        'code': status.HTTP_409_CONFLICT,
                    }
                },
                status=status.HTTP_409_CONFLICT
            )
        else:
            # SECURITY: Generic 500 error - never expose internal details in production
            error_data = {
                'success': False,
                'error': {
                    'type': 'ServerError',
                    'message': 'An unexpected error occurred. Please try again later.',
                    'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                }
            }
            
            # Only include exception type in debug mode
            if settings.DEBUG:
                error_data['error']['debug_type'] = type(exc).__name__
                error_data['error']['debug_message'] = str(exc)
            
            response = Response(error_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return response

