"""
AcuRate - Custom Middleware
Rate limiting and request logging middleware
"""

import logging
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

logger = logging.getLogger(__name__)


class RateLimitMiddleware(MiddlewareMixin):
    """
    Simple rate limiting middleware
    Limits requests per IP address
    """
    
    def process_request(self, request):
        # Skip rate limiting in DEBUG mode
        if settings.DEBUG:
            return None
        
        # Skip for admin and static files
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return None
        
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Rate limit: 100 requests per minute per IP
        cache_key = f'ratelimit:{ip}'
        requests = cache.get(cache_key, 0)
        
        if requests >= 100:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return JsonResponse(
                {
                    'success': False,
                    'error': {
                        'type': 'RateLimitExceeded',
                        'message': 'Too many requests. Please try again later.',
                        'code': 429,
                    }
                },
                status=429
            )
        
        # Increment counter (expires in 60 seconds)
        cache.set(cache_key, requests + 1, 60)
        
        return None


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Log all API requests for monitoring
    """
    
    def process_request(self, request):
        if request.path.startswith('/api/'):
            logger.info(
                f"API Request: {request.method} {request.path}",
                extra={
                    'method': request.method,
                    'path': request.path,
                    'user': request.user.username if hasattr(request, 'user') and request.user.is_authenticated else 'Anonymous',
                    'ip': request.META.get('REMOTE_ADDR'),
                }
            )
        return None
    
    def process_response(self, request, response):
        if request.path.startswith('/api/'):
            logger.info(
                f"API Response: {request.method} {request.path} - {response.status_code}",
                extra={
                    'method': request.method,
                    'path': request.path,
                    'status_code': response.status_code,
                }
            )
        return response

