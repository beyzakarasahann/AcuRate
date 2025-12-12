"""
AcuRate - File Upload Views
Handles file uploads (profile pictures, documents, etc.)
SECURITY: Includes MIME validation, magic bytes check, filename sanitization
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import os
from PIL import Image
import uuid
import re
import logging
import mimetypes

logger = logging.getLogger(__name__)

# Security: Allowed file types with MIME validation
ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

# Allowed document types (restrict dangerous files)
ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv']
ALLOWED_DOCUMENT_MIMES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
]

# DANGEROUS file extensions (never allow)
BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.php', '.py', '.js', '.html', '.htm', '.asp', '.aspx', '.jsp']

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def sanitize_filename(filename):
    """
    SECURITY: Sanitize filename to prevent path traversal attacks
    """
    # Remove any directory components
    filename = os.path.basename(filename)
    # Remove any special characters except alphanumeric, dash, underscore, dot
    filename = re.sub(r'[^\w\-\.]', '_', filename)
    # Prevent double extensions like .jpg.exe
    parts = filename.rsplit('.', 1)
    if len(parts) == 2:
        name, ext = parts
        # Only keep the last extension
        return f"{name[:100]}.{ext.lower()}"
    return filename[:100]


def validate_mime_type(file, allowed_mimes):
    """
    SECURITY: Validate MIME type matches expected types
    """
    # Read first few bytes for magic number check
    file.seek(0)
    header = file.read(8)
    file.seek(0)
    
    # Check magic bytes for common file types
    magic_signatures = {
        b'\xFF\xD8\xFF': 'image/jpeg',
        b'\x89PNG\r\n\x1a\n': 'image/png',
        b'GIF87a': 'image/gif',
        b'GIF89a': 'image/gif',
        b'RIFF': 'image/webp',  # WebP starts with RIFF
        b'%PDF': 'application/pdf',
        b'PK\x03\x04': 'application/zip',  # docx, xlsx are zip files
    }
    
    detected_mime = None
    for sig, mime in magic_signatures.items():
        if header.startswith(sig):
            detected_mime = mime
            break
    
    # Also check content_type from upload
    content_type = getattr(file, 'content_type', None)
    
    if detected_mime and detected_mime not in allowed_mimes:
        return False, f"File content doesn't match expected type. Detected: {detected_mime}"
    
    if content_type and content_type not in allowed_mimes:
        return False, f"Invalid content type: {content_type}"
    
    return True, None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    """
    Upload profile picture for current user
    
    POST /api/files/upload/profile-picture/
    Content-Type: multipart/form-data
    Body: file (image file)
    
    SECURITY: Validates extension, MIME type, magic bytes, and file size
    """
    if 'file' not in request.FILES:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ValidationError',
                    'message': 'No file provided',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    # SECURITY: Sanitize and validate filename
    original_name = sanitize_filename(file.name)
    file_ext = os.path.splitext(original_name)[1].lower()
    
    # SECURITY: Check blocked extensions first
    if file_ext in BLOCKED_EXTENSIONS:
        logger.warning(f"Blocked file upload attempt: {file_ext} by user {request.user.username}")
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'SecurityError',
                    'message': 'This file type is not allowed for security reasons',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file extension
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ValidationError',
                    'message': f'Invalid file type. Allowed: {", ".join(ALLOWED_IMAGE_EXTENSIONS)}',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size
    if file.size > MAX_IMAGE_SIZE:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ValidationError',
                    'message': f'File too large. Maximum size: {MAX_IMAGE_SIZE / 1024 / 1024}MB',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # SECURITY: Validate MIME type
    is_valid_mime, mime_error = validate_mime_type(file, ALLOWED_IMAGE_MIMES)
    if not is_valid_mime:
        logger.warning(f"MIME type validation failed for user {request.user.username}: {mime_error}")
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ValidationError',
                    'message': mime_error or 'Invalid file content',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Validate it's actually an image using PIL
        image = Image.open(file)
        image.verify()
        
        # Reset file pointer
        file.seek(0)
        
        # SECURITY: Generate unique filename (UUID prevents guessing)
        filename = f"{uuid.uuid4()}{file_ext}"
        filepath = f"profile_pictures/{filename}"
        
        # Save file
        saved_path = default_storage.save(filepath, ContentFile(file.read()))
        file_url = default_storage.url(saved_path)
        
        # Update user profile picture
        user = request.user
        if user.profile_picture:
            # Delete old profile picture
            try:
                default_storage.delete(user.profile_picture.name)
            except Exception:
                pass
        
        user.profile_picture = saved_path
        user.save()
        
        logger.info(f"Profile picture uploaded successfully for user {request.user.username}")
        
        return Response(
            {
                'success': True,
                'url': file_url,
                'message': 'Profile picture uploaded successfully'
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"Image upload error for user {request.user.username}: {str(e)}")
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ValidationError',
                    'message': 'Invalid or corrupted image file',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file(request):
    """
    Generic file upload endpoint
    
    POST /api/files/upload/
    Content-Type: multipart/form-data
    Body: file (document file), type (optional: 'document', 'assignment', etc.)
    
    SECURITY: Only allows safe document types, validates MIME, sanitizes filename
    """
    if 'file' not in request.FILES:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ValidationError',
                    'message': 'No file provided',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    file_type = request.data.get('type', 'document')
    
    # SECURITY: Sanitize filename
    original_name = sanitize_filename(file.name)
    file_ext = os.path.splitext(original_name)[1].lower()
    
    # SECURITY: Check blocked extensions (executables, scripts)
    if file_ext in BLOCKED_EXTENSIONS:
        logger.warning(f"Blocked file upload attempt: {file_ext} by user {request.user.username}")
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'SecurityError',
                    'message': 'This file type is not allowed for security reasons',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # SECURITY: Only allow specific document types
    all_allowed_ext = ALLOWED_IMAGE_EXTENSIONS + ALLOWED_DOCUMENT_EXTENSIONS
    if file_ext not in all_allowed_ext:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ValidationError',
                    'message': f'Invalid file type. Allowed: {", ".join(all_allowed_ext)}',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size
    if file.size > MAX_FILE_SIZE:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ValidationError',
                    'message': f'File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # SECURITY: Validate MIME type
    all_allowed_mimes = ALLOWED_IMAGE_MIMES + ALLOWED_DOCUMENT_MIMES
    is_valid_mime, mime_error = validate_mime_type(file, all_allowed_mimes)
    if not is_valid_mime:
        logger.warning(f"MIME validation failed for user {request.user.username}: {mime_error}")
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ValidationError',
                    'message': mime_error or 'Invalid file content',
                    'code': status.HTTP_400_BAD_REQUEST,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # SECURITY: Sanitize file_type to prevent path traversal
        safe_file_type = re.sub(r'[^\w]', '_', file_type)[:50]
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}{file_ext}"
        filepath = f"files/{safe_file_type}/{filename}"
        
        # Save file
        saved_path = default_storage.save(filepath, ContentFile(file.read()))
        file_url = default_storage.url(saved_path)
        
        logger.info(f"File uploaded successfully by user {request.user.username}: {filepath}")
        
        return Response(
            {
                'success': True,
                'url': file_url,
                'filename': original_name,
                'size': file.size,
                'type': safe_file_type,
                'message': 'File uploaded successfully'
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"File upload error for user {request.user.username}: {str(e)}")
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ServerError',
                    'message': 'Failed to upload file. Please try again.',
                    'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

