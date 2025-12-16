"""
AcuRate - Health Check Endpoints

Health check endpoints for monitoring and load balancer checks.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.core.cache import cache
from django.conf import settings
import time


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Basic health check endpoint.
    Returns 200 if the application is running.
    
    GET /api/health/
    """
    return Response({
        'status': 'healthy',
        'service': 'AcuRate API',
        'timestamp': time.time()
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def readiness_check(request):
    """
    Readiness check endpoint.
    Checks database and cache connectivity.
    Returns 200 if ready, 503 if not ready.
    
    GET /api/health/ready/
    """
    checks = {
        'database': False,
        'cache': False,
    }
    errors = []
    
    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
            checks['database'] = True
    except Exception as e:
        errors.append(f"Database: {str(e)}")
    
    # Cache check
    try:
        test_key = 'health_check_test'
        cache.set(test_key, 'ok', 10)
        if cache.get(test_key) == 'ok':
            checks['cache'] = True
            cache.delete(test_key)
    except Exception as e:
        errors.append(f"Cache: {str(e)}")
    
    if all(checks.values()):
        return Response({
            'status': 'ready',
            'checks': checks,
            'timestamp': time.time()
        })
    else:
        return Response({
            'status': 'not ready',
            'checks': checks,
            'errors': errors,
            'timestamp': time.time()
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([AllowAny])
def liveness_check(request):
    """
    Liveness check endpoint.
    Simple check to verify the application is alive.
    
    GET /api/health/live/
    """
    return Response({
        'status': 'alive',
        'timestamp': time.time()
    })
