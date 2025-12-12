"""
AcuRate - Cache Utilities
Provides caching decorators and utilities for API endpoints
"""

from functools import wraps
from django.core.cache import cache
from django.conf import settings
from rest_framework.response import Response
import hashlib
import json


def cache_response(timeout=None, key_prefix='', vary_on_user=True, vary_on_params=True):
    """
    Decorator to cache API response
    
    Args:
        timeout: Cache timeout in seconds (default: CACHE_TIMEOUT_MEDIUM)
        key_prefix: Prefix for cache key
        vary_on_user: Include user ID in cache key
        vary_on_params: Include query parameters in cache key
    
    Usage:
        @cache_response(timeout=600, key_prefix='dashboard')
        def my_view(request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Build cache key
            cache_key_parts = [key_prefix, func.__name__]
            
            # Include user ID if vary_on_user
            if vary_on_user and hasattr(request, 'user') and request.user.is_authenticated:
                cache_key_parts.append(f"user_{request.user.id}")
            
            # Include query parameters if vary_on_params
            if vary_on_params and hasattr(request, 'GET'):
                params = sorted(request.GET.items())
                if params:
                    params_str = json.dumps(params, sort_keys=True)
                    params_hash = hashlib.md5(params_str.encode()).hexdigest()[:8]
                    cache_key_parts.append(f"params_{params_hash}")
            
            cache_key = ':'.join(cache_key_parts)
            
            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                return Response(cached_response)
            
            # Call the function
            response = func(request, *args, **kwargs)
            
            # Cache the response if it's successful
            if hasattr(response, 'status_code') and response.status_code == 200:
                if hasattr(response, 'data'):
                    cache_timeout = timeout or getattr(settings, 'CACHE_TIMEOUT_MEDIUM', 300)
                    cache.set(cache_key, response.data, cache_timeout)
            
            return response
        return wrapper
    return decorator


def cache_key_builder(*args, **kwargs):
    """
    Build a cache key from arguments
    
    Args:
        *args: Positional arguments to include in key
        **kwargs: Keyword arguments to include in key
    
    Returns:
        str: Cache key
    """
    key_parts = []
    
    # Add positional arguments
    for arg in args:
        if hasattr(arg, 'id'):
            key_parts.append(f"{type(arg).__name__}_{arg.id}")
        else:
            key_parts.append(str(arg))
    
    # Add keyword arguments
    for key, value in sorted(kwargs.items()):
        if hasattr(value, 'id'):
            key_parts.append(f"{key}_{type(value).__name__}_{value.id}")
        else:
            key_parts.append(f"{key}_{value}")
    
    return ':'.join(key_parts)


def invalidate_cache_pattern(pattern):
    """
    Invalidate all cache keys matching a pattern
    
    Note: This works best with Redis. For local memory cache,
    we need to track keys manually or clear all cache.
    
    Args:
        pattern: Cache key pattern (e.g., 'dashboard:*')
    """
    if hasattr(cache, 'delete_pattern'):  # Redis
        cache.delete_pattern(pattern)
    else:  # Local memory cache - clear all
        cache.clear()


def invalidate_user_cache(user_id):
    """
    Invalidate all cache entries for a specific user
    
    Args:
        user_id: User ID
    """
    pattern = f"*:user_{user_id}:*"
    invalidate_cache_pattern(pattern)


def invalidate_dashboard_cache(user_id=None, role=None):
    """
    Invalidate dashboard cache for a user or role
    
    Args:
        user_id: Specific user ID (optional)
        role: User role (optional)
    """
    if user_id:
        invalidate_user_cache(user_id)
    elif role:
        pattern = f"dashboard:*:user_*"  # This is a simplified pattern
        invalidate_cache_pattern(pattern)
    else:
        # Invalidate all dashboard caches
        invalidate_cache_pattern("dashboard:*")


def get_or_set_cache(key, timeout, callable_func, *args, **kwargs):
    """
    Get value from cache or set it by calling a function
    
    Args:
        key: Cache key
        timeout: Cache timeout in seconds
        callable_func: Function to call if cache miss
        *args, **kwargs: Arguments to pass to callable_func
    
    Returns:
        Cached or computed value
    """
    value = cache.get(key)
    if value is None:
        value = callable_func(*args, **kwargs)
        cache.set(key, value, timeout)
    return value


