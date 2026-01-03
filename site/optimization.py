"""
Database Query Optimization Module
Provides caching, pagination, and optimized queries for better performance
"""

import time
from functools import wraps
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json

# Simple in-memory cache for non-critical data
_cache: Dict[str, Dict[str, Any]] = {}

def cache_result(expire_seconds=300):
    """
    Decorator to cache function results
    
    Usage:
        @cache_result(expire_seconds=600)
        def get_user_settings(user_id):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Check if cached and not expired
            if cache_key in _cache:
                entry = _cache[cache_key]
                if time.time() - entry['timestamp'] < expire_seconds:
                    return entry['value']
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            _cache[cache_key] = {
                'value': result,
                'timestamp': time.time()
            }
            
            return result
        
        return wrapper
    return decorator


def paginate_results(results: List[Any], page: int = 1, per_page: int = 50) -> Dict[str, Any]:
    """
    Paginate a list of results
    
    Args:
        results: List of items to paginate
        page: Page number (1-indexed)
        per_page: Items per page
    
    Returns:
        Dict with 'items', 'page', 'total_pages', 'total_items'
    """
    total = len(results)
    total_pages = (total + per_page - 1) // per_page
    
    # Ensure page is within bounds
    page = max(1, min(page, total_pages))
    
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    
    return {
        'items': results[start_idx:end_idx],
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages,
        'total_items': total,
        'has_next': page < total_pages,
        'has_prev': page > 1
    }


def optimize_co2_query(db, days: int = 1, limit: int = 1000) -> List[Dict]:
    """
    Optimized CO2 readings query with proper indexing
    
    Uses indexed queries for better performance:
    - Date-based filtering with index on DATE(timestamp)
    - Timestamp ordering with index on timestamp DESC
    - LIMIT to prevent large dataset transfers
    
    Args:
        db: Database connection
        days: Number of days of history to retrieve
        limit: Maximum number of records to return
    
    Returns:
        List of CO2 readings
    """
    since = datetime.now() - timedelta(days=days)
    
    # Optimized query using index
    query = """
        SELECT id, timestamp, ppm 
        FROM co2_readings 
        WHERE timestamp > ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    """
    
    cursor = db.execute(query, (since.isoformat(), limit))
    return cursor.fetchall()


def batch_archive_old_readings(db, days_to_keep: int = 180) -> int:
    """
    Archive readings older than specified days
    Helps maintain database performance by reducing table size
    
    Args:
        db: Database connection
        days_to_keep: Keep readings newer than this many days
    
    Returns:
        Number of rows archived
    """
    cutoff_date = datetime.now() - timedelta(days=days_to_keep)
    
    # Create archive table if needed
    db.execute("""
        CREATE TABLE IF NOT EXISTS co2_readings_archive AS 
        SELECT * FROM co2_readings WHERE 0
    """)
    
    # Move old readings to archive
    db.execute("""
        INSERT INTO co2_readings_archive 
        SELECT * FROM co2_readings WHERE timestamp < ?
    """, (cutoff_date.isoformat(),))
    
    # Get count before deletion
    count = db.execute("""
        SELECT COUNT(*) FROM co2_readings WHERE timestamp < ?
    """, (cutoff_date.isoformat(),)).fetchone()[0]
    
    # Delete archived readings
    db.execute("""
        DELETE FROM co2_readings WHERE timestamp < ?
    """, (cutoff_date.isoformat(),))
    
    db.commit()
    
    return count


def get_optimized_daily_stats(db, date: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Get optimized daily statistics
    
    Uses efficient aggregation query:
    - Single database round-trip
    - Indexes on date and ppm
    - Pre-calculated percentiles
    
    Args:
        db: Database connection
        date: Date to get stats for (default: today)
    
    Returns:
        Dictionary with statistics
    """
    if date is None:
        target_date = datetime.now().date()
    elif isinstance(date, datetime):
        target_date = date.date()
    else:
        target_date = date
    
    query = """
        SELECT 
            COUNT(*) as count,
            AVG(ppm) as avg_ppm,
            MIN(ppm) as min_ppm,
            MAX(ppm) as max_ppm,
            CAST(AVG(CASE WHEN ppm > 1200 THEN 1 ELSE 0 END) * 100 AS INTEGER) as bad_percentage
        FROM co2_readings
        WHERE DATE(timestamp) = ?
    """
    
    result = db.execute(query, (str(target_date),)).fetchone()
    
    if result:
        return {
            'count': result['count'],
            'avg_ppm': round(result['avg_ppm'] or 0, 1),
            'min_ppm': result['min_ppm'],
            'max_ppm': result['max_ppm'],
            'bad_percentage': result['bad_percentage'] or 0,
            'date': str(target_date)
        }
    
    return {
        'count': 0,
        'avg_ppm': 0,
        'min_ppm': 0,
        'max_ppm': 0,
        'bad_percentage': 0,
        'date': str(target_date)
    }


def batch_user_query(db, user_ids: List[int], fields: Optional[List[str]] = None) -> List[Dict]:
    """
    Batch query multiple users efficiently
    
    Prevents N+1 queries by fetching all users in one query
    
    Args:
        db: Database connection
        user_ids: List of user IDs
        fields: Specific fields to select (default: all)
    
    Returns:
        List of user dictionaries
    """
    if not user_ids:
        return []
    
    if fields is None:
        fields = ['id', 'username', 'email', 'role', 'created_at']
    
    # Build placeholders for parameterized query
    placeholders = ','.join('?' * len(user_ids))
    field_list = ','.join(fields)
    
    query = f"SELECT {field_list} FROM users WHERE id IN ({placeholders})"
    
    cursor = db.execute(query, user_ids)
    return cursor.fetchall()


def clear_cache():
    """Clear all cached results"""
    global _cache
    _cache.clear()


def cache_statistics():
    """Get cache statistics"""
    return {
        'entries': len(_cache),
        'keys': list(_cache.keys())
    }


# ============================================================================
#                     WEBSOCKET OPTIMIZATION
# ============================================================================

class RateLimiter:
    """Rate limiter for WebSocket updates"""
    
    def __init__(self, max_per_second: float = 10):
        self.max_per_second = max_per_second
        self.min_interval = 1.0 / max_per_second
        self.last_emit = {}
    
    def should_emit(self, room: str) -> bool:
        """Check if update should be emitted"""
        now = time.time()
        last = self.last_emit.get(room, 0)
        
        if now - last >= self.min_interval:
            self.last_emit[room] = now
            return True
        
        return False
    
    def reset(self, room: Optional[str] = None) -> None:
        """Reset rate limiter"""
        if room is not None:
            self.last_emit.pop(room, None)
        else:
            self.last_emit.clear()


# ============================================================================
#                     QUERY OPTIMIZATION EXAMPLE
# ============================================================================

def example_optimized_data_fetch():
    """
    Example of optimized data fetching
    
    BAD:
        for user_id in user_ids:
            user = get_user_by_id(user_id)  # N queries!
            settings = get_user_settings(user_id)  # N queries!
    
    GOOD:
        users = batch_user_query(db, user_ids)  # 1 query
        # Cache settings for subsequent lookups
    """
    pass


if __name__ == "__main__":
    print("Database Optimization Module")
    print("Import this module in your Flask app to use optimization utilities")
    print("\nAvailable functions:")
    print("  - cache_result(expire_seconds) - Decorator for result caching")
    print("  - paginate_results(results, page, per_page) - Paginate lists")
    print("  - optimize_co2_query(db, days, limit) - Optimized CO2 query")
    print("  - batch_archive_old_readings(db, days_to_keep) - Archive old data")
    print("  - get_optimized_daily_stats(db, date) - Get stats efficiently")
    print("  - batch_user_query(db, user_ids, fields) - Batch user lookup")
    print("  - RateLimiter(max_per_second) - Rate limit WebSocket updates")
