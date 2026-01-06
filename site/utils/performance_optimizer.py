"""
Performance Optimization Module
Caching, query optimization, connection pooling, rate limiting
"""

import time
from functools import wraps
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, Callable
from collections import OrderedDict
import threading
from database import get_db


class CacheManager:
    """In-memory caching for frequently accessed data"""
    
    def __init__(self, max_size: int = 1000, ttl: int = 300):
        """
        Initialize cache
        
        Args:
            max_size: Maximum number of cached items
            ttl: Time to live in seconds (default 5 minutes)
        """
        self.cache = OrderedDict()
        self.max_size = max_size
        self.ttl = ttl
        self.lock = threading.Lock()
    
    def get(self, key: str) -> Optional[Any]:
        """Get item from cache if not expired"""
        with self.lock:
            if key not in self.cache:
                return None
            
            value, timestamp = self.cache[key]
            
            # Check if expired
            if time.time() - timestamp > self.ttl:
                del self.cache[key]
                return None
            
            # Move to end (LRU)
            self.cache.move_to_end(key)
            return value
    
    def set(self, key: str, value: Any):
        """Set item in cache"""
        with self.lock:
            if key in self.cache:
                del self.cache[key]
            
            self.cache[key] = (value, time.time())
            
            # Evict oldest if over max size
            if len(self.cache) > self.max_size:
                self.cache.popitem(last=False)
    
    def clear(self):
        """Clear all cache"""
        with self.lock:
            self.cache.clear()
    
    def stats(self) -> Dict:
        """Get cache statistics"""
        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'ttl': self.ttl
        }


class QueryOptimizer:
    """Database query optimization"""
    
    def __init__(self):
        self.db = get_db()
        self.query_stats = {}
    
    def ensure_indexes(self):
        """Create database indexes for common queries"""
        cursor = self.db.cursor()
        
        indexes = [
            ('idx_sensor_readings_sensor_timestamp', 
             'sensor_readings', '(sensor_id, timestamp)'),
            ('idx_sensor_readings_timestamp', 
             'sensor_readings', '(timestamp)'),
            ('idx_users_username', 
             'users', '(username)'),
            ('idx_audit_log_user_timestamp', 
             'audit_log', '(user_id, timestamp)'),
            ('idx_sensors_user_id', 
             'sensors', '(user_id)'),
            ('idx_readings_ppm_timestamp',
             'sensor_readings', '(ppm, timestamp)'),
        ]
        
        try:
            for idx_name, table, columns in indexes:
                cursor.execute(f'''
                    CREATE INDEX IF NOT EXISTS {idx_name}
                    ON {table} {columns}
                ''')
            
            self.db.commit()
            print(f"Created {len(indexes)} database indexes")
        except Exception as e:
            print(f"Error creating indexes: {e}")
    
    def optimize_reading_query(self, sensor_id: int, hours: int = 24, 
                               limit: int = 1000) -> list:
        """Optimized query for sensor readings"""
        cursor = self.db.cursor()
        start_time = time.time()
        
        try:
            # Use indexed columns
            cursor.execute('''
                SELECT id, timestamp, ppm, temperature, humidity
                FROM sensor_readings
                WHERE sensor_id = ? AND timestamp > datetime('now', ? || ' hours')
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (sensor_id, f'-{hours}', limit))
            
            results = cursor.fetchall()
            
            # Track query performance
            exec_time = time.time() - start_time
            self._track_query('optimize_reading_query', exec_time, len(results))
            
            return results
        except Exception as e:
            print(f"Error in optimized query: {e}")
            return []
    
    def _track_query(self, query_name: str, exec_time: float, result_count: int):
        """Track query execution stats"""
        if query_name not in self.query_stats:
            self.query_stats[query_name] = {
                'count': 0,
                'total_time': 0,
                'avg_time': 0,
                'max_time': 0,
                'min_time': float('inf')
            }
        
        stats = self.query_stats[query_name]
        stats['count'] += 1
        stats['total_time'] += exec_time
        stats['avg_time'] = stats['total_time'] / stats['count']
        stats['max_time'] = max(stats['max_time'], exec_time)
        stats['min_time'] = min(stats['min_time'], exec_time)
    
    def get_query_stats(self) -> Dict:
        """Get query performance statistics"""
        return self.query_stats
    
    def analyze_slow_queries(self, threshold_ms: float = 100) -> list:
        """Find queries slower than threshold"""
        slow = []
        for query, stats in self.query_stats.items():
            if stats['avg_time'] * 1000 > threshold_ms:
                slow.append({
                    'query': query,
                    'avg_time_ms': stats['avg_time'] * 1000,
                    'count': stats['count'],
                    'recommendation': 'Add index or optimize logic'
                })
        return slow


class RateLimiter:
    """Rate limiting with adaptive backoff"""
    
    def __init__(self, requests_per_minute: int = 60):
        self.rpm = requests_per_minute
        self.requests = {}  # {user_id: [timestamps]}
        self.lock = threading.Lock()
        self.backoff_multiplier = 1.5
    
    def is_allowed(self, user_id: str, burst_size: int = 5) -> bool:
        """
        Check if request is allowed
        
        Args:
            user_id: User identifier
            burst_size: Allow burst of N requests
        
        Returns:
            True if request allowed, False if rate limited
        """
        with self.lock:
            now = time.time()
            
            if user_id not in self.requests:
                self.requests[user_id] = []
            
            # Remove old requests (outside 1-minute window)
            cutoff = now - 60
            self.requests[user_id] = [
                t for t in self.requests[user_id] if t > cutoff
            ]
            
            # Check rate limit
            if len(self.requests[user_id]) < self.rpm:
                # Allow immediate response
                self.requests[user_id].append(now)
                return True
            
            # Check burst
            if len(self.requests[user_id]) < (self.rpm + burst_size):
                self.requests[user_id].append(now)
                return True
            
            return False
    
    def get_wait_time(self, user_id: str) -> float:
        """Get seconds to wait before next request"""
        with self.lock:
            if user_id not in self.requests:
                return 0
            
            now = time.time()
            old_requests = [t for t in self.requests[user_id] if t > (now - 60)]
            
            if len(old_requests) < self.rpm:
                return 0
            
            # Calculate backoff
            excess = len(old_requests) - self.rpm
            return min(60, excess * 0.1 * self.backoff_multiplier)


class PerformanceOptimizer:
    """Main optimization coordinator"""
    
    def __init__(self):
        self.cache = CacheManager(max_size=5000, ttl=300)
        self.query_optimizer = QueryOptimizer()
        self.rate_limiter = RateLimiter()
    
    def initialize(self):
        """Initialize all optimizations"""
        print("Initializing performance optimizations...")
        self.query_optimizer.ensure_indexes()
    
    def cache_reading(self, sensor_id: int, hours: int = 24) -> Optional[list]:
        """Get sensor readings with caching"""
        cache_key = f"readings_{sensor_id}_{hours}h"
        
        # Try cache first
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached
        
        # Query database
        readings = self.query_optimizer.optimize_reading_query(sensor_id, hours)
        
        # Cache result
        self.cache.set(cache_key, readings)
        
        return readings
    
    def invalidate_cache(self, pattern: str = None):
        """Invalidate cache entries"""
        if pattern:
            with self.cache.lock:
                keys_to_delete = [k for k in self.cache.cache.keys() if pattern in k]
                for k in keys_to_delete:
                    del self.cache.cache[k]
        else:
            self.cache.clear()
    
    def get_performance_report(self) -> Dict:
        """Get comprehensive performance report"""
        return {
            'cache': self.cache.stats(),
            'queries': self.query_optimizer.get_query_stats(),
            'slow_queries': self.query_optimizer.analyze_slow_queries(),
            'rate_limiter': {
                'rpm': self.rate_limiter.rpm,
                'active_users': len(self.rate_limiter.requests)
            }
        }


# Decorator for caching function results
def cache_result(ttl: int = 300):
    """Decorator to cache function results"""
    cache = CacheManager(ttl=ttl)
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and args
            cache_key = f"{func.__name__}_{args}_{kwargs}"
            
            # Try cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            cache.set(cache_key, result)
            
            return result
        
        return wrapper
    
    return decorator


# Decorator for rate limiting
def rate_limit(limiter: RateLimiter):
    """Decorator for rate limiting"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(user_id: str, *args, **kwargs):
            if not limiter.is_allowed(user_id):
                wait_time = limiter.get_wait_time(user_id)
                raise Exception(f"Rate limited. Wait {wait_time:.1f} seconds")
            
            return func(user_id, *args, **kwargs)
        
        return wrapper
    
    return decorator


# Global optimizer instance
optimizer = PerformanceOptimizer()
