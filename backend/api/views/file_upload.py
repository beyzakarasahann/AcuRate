"""
AcuRate - File Upload Views
Handles file uploads (profile pictures, documents, etc.)
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
# File upload views - no additional imports needed
from django.core.files.base import ContentFile
from django.conf import settings
import os
from PIL import Image
import uuid

ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    """
    Upload profile picture for current user
    
    POST /api/files/upload/profile-picture/
    Content-Type: multipart/form-data
    Body: file (image file)
    
    Returns:
    {
        "success": true,
        "url": "/media/profile_pictures/uuid.jpg"
    }
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
    
    # Validate file extension
    file_ext = os.path.splitext(file.name)[1].lower()
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
    
    try:
        # Validate it's actually an image
        image = Image.open(file)
        image.verify()
        
        # Reset file pointer
        file.seek(0)
        
        # Generate unique filename
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
            except:
                pass
        
        user.profile_picture = saved_path
        user.save()
        
        return Response(
            {
                'success': True,
                'url': file_url,
                'message': 'Profile picture uploaded successfully'
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ValidationError',
                    'message': f'Invalid image file: {str(e)}',
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
    Body: file (any file), type (optional: 'document', 'assignment', etc.)
    
    Returns:
    {
        "success": true,
        "url": "/media/files/uuid.pdf",
        "filename": "original_name.pdf"
    }
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
    
    try:
        # Generate unique filename
        file_ext = os.path.splitext(file.name)[1]
        filename = f"{uuid.uuid4()}{file_ext}"
        filepath = f"files/{file_type}/{filename}"
        
        # Save file
        saved_path = default_storage.save(filepath, ContentFile(file.read()))
        file_url = default_storage.url(saved_path)
        
        return Response(
            {
                'success': True,
                'url': file_url,
                'filename': file.name,
                'size': file.size,
                'type': file_type,
                'message': 'File uploaded successfully'
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {
                'success': False,
                'error': {
                    'type': 'ServerError',
                    'message': f'Failed to upload file: {str(e)}',
                    'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

