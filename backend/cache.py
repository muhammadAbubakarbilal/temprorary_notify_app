import redis
import json
import os
from typing import Any, Optional
from functools import wraps

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
except Exception:
    redis_client = None
    REDIS_AVAILABLE = False
    print("Warning: Redis not available. Caching disabled.")

def cache_key(*args, **kwargs) -> str:
    """Generate a cache key from function arguments"""
    key_parts = [str(arg) for arg in args]
    key_parts.extend([f"{k}:{v}" for k, v in sorted(kwargs.items())])
    return ":".join(key_parts)

def get_cached(key: str) -> Optional[Any]:
    """Get value from cache"""
    if not REDIS_AVAILABLE or not redis_client:
        return None
    try:
        value = redis_client.get(key)
        return json.loads(value) if value else None
    except Exception:
        return None

def set_cached(key: str, value: Any, ttl: int = 300):
    """Set value in cache with TTL in seconds"""
    if not REDIS_AVAILABLE or not redis_client:
        return
    try:
        redis_client.setex(key, ttl, json.dumps(value))
    except Exception:
        pass

def invalidate_cache(pattern: str):
    """Invalidate cache keys matching pattern"""
    if not REDIS_AVAILABLE or not redis_client:
        return
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
    except Exception:
        pass

def cached(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator to cache function results
    Usage: @cached(ttl=600, key_prefix="user_data")
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not REDIS_AVAILABLE:
                return await func(*args, **kwargs)
            
            # Generate cache key
            key = f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached_value = get_cached(key)
            if cached_value is not None:
                return cached_value
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            set_cached(key, result, ttl)
            return result
        
        return wrapper
    return decorator
