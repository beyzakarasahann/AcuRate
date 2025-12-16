"""
AcuRate - Custom Middleware
Rate limiting, request logging, and security headers
SECURITY: Includes endpoint-specific rate limiting
"""

import logging
from functools import wraps
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

logger = logging.getLogger(__name__)


# =============================================================================
# ENDPOINT-SPECIFIC RATE LIMITING DECORATOR
# =============================================================================

def rate_limit(requests_per_minute=10, key_prefix='rl'):
    """
    SECURITY: Decorator for endpoint-specific rate limiting.
    
    Usage:
        @rate_limit(requests_per_minute=5, key_prefix='login')
        def login_view(request):
            ...
    
    Args:
        requests_per_minute: Maximum requests allowed per minute per IP
        key_prefix: Prefix for cache key (to separate different endpoints)
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Skip in DEBUG mode
            if settings.DEBUG:
                return view_func(request, *args, **kwargs)
            
            # Get client IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR', 'unknown')
            
            # Create unique cache key for this endpoint and IP
            cache_key = f'{key_prefix}:{ip}'
            current_count = cache.get(cache_key, 0)
            
            if current_count >= requests_per_minute:
                logger.warning(
                    f"Rate limit exceeded for {key_prefix}: IP {ip} "
                    f"({current_count}/{requests_per_minute} requests/min)"
                )
                return JsonResponse(
                    {
                        'success': False,
                        'error': {
                            'type': 'RateLimitExceeded',
                            'message': f'Too many requests. Please wait before trying again.',
                            'code': 429,
                        }
                    },
                    status=429
                )
            
            # Increment counter (expires in 60 seconds)
            cache.set(cache_key, current_count + 1, 60)
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


class RateLimitMiddleware(MiddlewareMixin):
    """
    Enhanced rate limiting middleware
    Limits requests per IP address or user
    Only active when RATELIMIT_ENABLE is True (production mode)
    SECURITY: Includes user-based rate limiting for authenticated users
    """
    
    def get_client_ip(self, request):
        """Get client IP address, handling X-Forwarded-For header"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')
    
    def process_request(self, request):
        # Skip rate limiting if disabled in settings
        if not getattr(settings, 'RATELIMIT_ENABLE', False):
            return None
        
        # Skip rate limiting in DEBUG mode
        if settings.DEBUG:
            return None
        
        # Skip for admin and static files
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return None
        
        # Get identifier (user ID if authenticated, IP if not)
        if request.user.is_authenticated:
            identifier = f"user:{request.user.id}"
            limit = 200  # Higher limit for authenticated users
        else:
            identifier = f"ip:{self.get_client_ip(request)}"
            limit = 100  # Lower limit for anonymous users
        
        cache_key = f'ratelimit:{identifier}'
        requests = cache.get(cache_key, 0)
        
        if requests >= limit:
            # SECURITY: Log rate limit exceeded event
            try:
                from .utils import log_security_event
                log_security_event(
                    event_type='rate_limit_exceeded',
                    user=request.user if request.user.is_authenticated else None,
                    ip_address=self.get_client_ip(request),
                    details={'limit': limit, 'requests': requests, 'identifier': identifier},
                    severity='WARNING'
                )
            except Exception:
                pass  # Don't fail if logging fails
            
            logger.warning(f"Rate limit exceeded: {identifier} ({requests}/{limit} requests/min)")
            return JsonResponse(
                {
                    'success': False,
                    'error': {
                        'type': 'RateLimitExceeded',
                        'message': 'Too many requests. Please try again later.',
                        'code': 429,
                        'retry_after': 60,
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


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    SECURITY: Add security headers to all responses
    Content-Security-Policy, Permissions-Policy, etc.
    """
    
    def process_response(self, request, response):
        # Content-Security-Policy - Prevent XSS and injection attacks
        # Note: Adjust 'self' and domains based on your frontend URLs
        if not settings.DEBUG:
            # Production CSP - strict
            csp_directives = [
                "default-src 'self'",
                "script-src 'self'",
                "style-src 'self' 'unsafe-inline'",  # Allow inline styles for UI frameworks
                "img-src 'self' data: https:",
                "font-src 'self' https://fonts.gstatic.com",
                "connect-src 'self'",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
            ]
        else:
            # Development CSP - more permissive for hot reload, etc.
            csp_directives = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https: http:",
                "font-src 'self' https://fonts.gstatic.com data:",
                "connect-src 'self' ws: wss: http://localhost:* http://127.0.0.1:*",
                "frame-ancestors 'self'",
            ]
        
        response['Content-Security-Policy'] = '; '.join(csp_directives)
        
        # Permissions-Policy - Disable unnecessary browser features
        response['Permissions-Policy'] = (
            'accelerometer=(), '
            'camera=(), '
            'geolocation=(), '
            'gyroscope=(), '
            'magnetometer=(), '
            'microphone=(), '
            'payment=(), '
            'usb=()'
        )
        
        # Additional security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer-Policy (also set in settings.py for production)
        if not response.get('Referrer-Policy'):
            response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response
