"""
Admin Enhancement Module
Provides advanced admin tools for user management, analytics, and system monitoring
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from database import get_db
import json


class AdminAnalytics:
    """Advanced analytics for administrators"""
    
    @staticmethod
    def get_user_activity_timeline(user_id: int, days: int = 30) -> List[Dict]:
        """
        Get user activity timeline
        
        Returns:
            List of user actions with timestamps
        """
        db = get_db()
        since = datetime.now() - timedelta(days=days)
        
        activities = db.execute("""
            SELECT 
                id, user_id, action, entity_type, entity_id, 
                details, ip_address, timestamp
            FROM audit_logs
            WHERE user_id = ? AND timestamp > ?
            ORDER BY timestamp DESC
            LIMIT 500
        """, (user_id, since.isoformat())).fetchall()
        
        db.close()
        return activities or []
    
    @staticmethod
    def get_system_health() -> Dict[str, Any]:
        """
        Get overall system health metrics
        
        Returns:
            Dictionary with health indicators
        """
        db = get_db()
        
        # Get metrics
        user_count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        reading_count = db.execute("SELECT COUNT(*) FROM co2_readings").fetchone()[0]
        
        # Get recent readings count
        today = datetime.now().date()
        today_readings = db.execute(
            "SELECT COUNT(*) FROM co2_readings WHERE DATE(timestamp) = ?",
            (today.isoformat(),)
        ).fetchone()[0]
        
        # Get average ppm today
        today_stats = db.execute("""
            SELECT AVG(ppm) as avg_ppm, MAX(ppm) as max_ppm
            FROM co2_readings
            WHERE DATE(timestamp) = ?
        """, (today.isoformat(),)).fetchone()
        
        db.close()
        
        return {
            'total_users': user_count,
            'total_readings': reading_count,
            'readings_today': today_readings,
            'avg_ppm_today': round(today_stats['avg_ppm'] or 0, 1),
            'max_ppm_today': today_stats['max_ppm'] or 0,
            'timestamp': datetime.now().isoformat()
        }
    
    @staticmethod
    def get_user_engagement_metrics(days: int = 30) -> Dict[str, Any]:
        """
        Get user engagement metrics
        
        Returns:
            Engagement statistics
        """
        db = get_db()
        since = datetime.now() - timedelta(days=days)
        
        # Active users (those with logins in period)
        active_users = db.execute("""
            SELECT COUNT(DISTINCT user_id) 
            FROM login_history 
            WHERE login_time > ? AND success = 1
        """, (since.isoformat(),)).fetchone()[0]
        
        # Users with CO2 data in period
        users_with_data = db.execute("""
            SELECT COUNT(DISTINCT u.id)
            FROM users u
            JOIN co2_readings c ON u.id IS NOT NULL
            WHERE c.timestamp > ?
        """, (since.isoformat(),)).fetchone()[0]
        
        # Total users
        total_users = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        
        db.close()
        
        return {
            'active_users': active_users,
            'users_with_data': users_with_data,
            'total_users': total_users,
            'activity_rate': round((active_users / max(total_users, 1)) * 100, 1),
            'period_days': days
        }
    
    @staticmethod
    def get_data_quality_report() -> Dict[str, Any]:
        """
        Get data quality report
        
        Returns:
            Data quality metrics
        """
        db = get_db()
        
        # Check for gaps in data (>30 min gaps)
        gaps = db.execute("""
            SELECT COUNT(*) FROM (
                SELECT 
                    timestamp,
                    LAG(timestamp) OVER (ORDER BY timestamp) as prev_timestamp
                FROM co2_readings
                WHERE timestamp > datetime('now', '-7 days')
            ) gaps
            WHERE (julianday(timestamp) - julianday(prev_timestamp)) * 1440 > 30
        """).fetchone()[0]
        
        # Get duplicate readings
        duplicates = db.execute("""
            SELECT COUNT(*) FROM (
                SELECT timestamp, ppm, COUNT(*) 
                FROM co2_readings 
                GROUP BY timestamp, ppm 
                HAVING COUNT(*) > 1
            )
        """).fetchone()[0]
        
        # Get readings outside normal range
        outliers = db.execute("""
            SELECT COUNT(*) FROM co2_readings
            WHERE ppm < 300 OR ppm > 5000
        """).fetchone()[0]
        
        # Total readings
        total = db.execute("SELECT COUNT(*) FROM co2_readings").fetchone()[0]
        
        db.close()
        
        return {
            'total_readings': total,
            'data_gaps': gaps,
            'duplicates': duplicates,
            'outliers': outliers,
            'quality_score': round((1 - (gaps + duplicates + outliers) / max(total, 1)) * 100, 1)
        }


class AdminUserManagement:
    """User management tools for administrators"""
    
    @staticmethod
    def get_inactive_users(days: int = 90) -> List[Dict]:
        """
        Get users inactive for specified days
        
        Returns:
            List of inactive user records
        """
        db = get_db()
        since = datetime.now() - timedelta(days=days)
        
        users = db.execute("""
            SELECT 
                u.id, u.username, u.email, u.role, u.created_at,
                MAX(l.login_time) as last_login
            FROM users u
            LEFT JOIN login_history l ON u.id = l.user_id AND l.success = 1
            GROUP BY u.id
            HAVING last_login < ? OR last_login IS NULL
            ORDER BY last_login DESC
        """, (since.isoformat(),)).fetchall()
        
        db.close()
        return users or []
    
    @staticmethod
    def bulk_export_users(user_ids: Optional[List[int]] = None, format: str = 'csv') -> str:
        """
        Export user data in specified format
        
        Args:
            user_ids: Specific users to export (None = all)
            format: 'csv' or 'json'
        
        Returns:
            Formatted data as string
        """
        db = get_db()
        
        if user_ids:
            placeholders = ','.join('?' * len(user_ids))
            query = f"""
                SELECT id, username, email, role, email_verified, created_at
                FROM users WHERE id IN ({placeholders})
                ORDER BY created_at DESC
            """
            users = db.execute(query, user_ids).fetchall()
        else:
            users = db.execute("""
                SELECT id, username, email, role, email_verified, created_at
                FROM users ORDER BY created_at DESC
            """).fetchall()
        
        db.close()
        
        if format == 'json':
            return json.dumps([dict(u) for u in users], indent=2, default=str)
        else:  # CSV
            import csv
            import io
            
            output = io.StringIO()
            if users:
                writer = csv.DictWriter(output, fieldnames=users[0].keys())
                writer.writeheader()
                for user in users:
                    writer.writerow(dict(user))
            
            return output.getvalue()
    
    @staticmethod
    def get_user_session_management(user_id: int) -> Dict[str, Any]:
        """
        Get user session information
        
        Returns:
            Session details and devices
        """
        db = get_db()
        
        sessions = db.execute("""
            SELECT 
                id, ip_address, user_agent, login_time, success
            FROM login_history
            WHERE user_id = ?
            ORDER BY login_time DESC
            LIMIT 10
        """, (user_id,)).fetchall()
        
        db.close()
        
        return {
            'user_id': user_id,
            'recent_sessions': sessions or [],
            'session_count': len(sessions)
        }


class AdminAuditTools:
    """Audit and compliance tools"""
    
    @staticmethod
    def get_audit_logs(
        limit: int = 100,
        action_filter: Optional[str] = None,
        user_filter: Optional[int] = None
    ) -> List[Dict]:
        """
        Get filtered audit logs
        
        Args:
            limit: Maximum logs to retrieve
            action_filter: Filter by action type
            user_filter: Filter by user ID
        
        Returns:
            List of audit log entries
        """
        db = get_db()
        
        query = "SELECT * FROM audit_logs WHERE 1=1"
        params = []
        
        if action_filter:
            query += " AND action = ?"
            params.append(action_filter)
        
        if user_filter:
            query += " AND user_id = ?"
            params.append(user_filter)
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        logs = db.execute(query, params).fetchall()
        db.close()
        
        return logs or []
    
    @staticmethod
    def export_audit_logs(format: str = 'csv', days: int = 30) -> str:
        """
        Export audit logs for compliance
        
        Args:
            format: 'csv' or 'json'
            days: Number of days to export
        
        Returns:
            Formatted audit logs
        """
        db = get_db()
        since = datetime.now() - timedelta(days=days)
        
        logs = db.execute("""
            SELECT * FROM audit_logs
            WHERE timestamp > ?
            ORDER BY timestamp DESC
        """, (since.isoformat(),)).fetchall()
        
        db.close()
        
        if format == 'json':
            return json.dumps([dict(log) for log in logs], indent=2, default=str)
        else:  # CSV
            import csv
            import io
            
            output = io.StringIO()
            if logs:
                writer = csv.DictWriter(output, fieldnames=logs[0].keys())
                writer.writeheader()
                for log in logs:
                    writer.writerow(dict(log))
            
            return output.getvalue()
    
    @staticmethod
    def detect_suspicious_activity(days: int = 7) -> List[Dict]:
        """
        Detect suspicious activity patterns
        
        Returns:
            List of suspicious activities
        """
        db = get_db()
        since = datetime.now() - timedelta(days=days)
        
        suspicious = []
        
        # Failed login attempts (>5 in 1 hour)
        failed_logins = db.execute("""
            SELECT user_id, COUNT(*) as attempts, MIN(login_time) as first_attempt
            FROM login_history
            WHERE success = 0 AND login_time > ?
            GROUP BY user_id
            HAVING attempts > 5
        """, (since.isoformat(),)).fetchall()
        
        for attempt in failed_logins:
            suspicious.append({
                'type': 'brute_force',
                'user_id': attempt['user_id'],
                'details': f"{attempt['attempts']} failed login attempts",
                'timestamp': attempt['first_attempt']
            })
        
        db.close()
        
        return suspicious


class AdminDatabaseMaintenance:
    """Database maintenance and optimization"""
    
    @staticmethod
    def get_database_size(db) -> Dict[str, Any]:
        """Get database size information"""
        import os
        from pathlib import Path
        
        db_path = Path("data/aerium.sqlite")
        
        if db_path.exists():
            size_bytes = db_path.stat().st_size
            size_mb = size_bytes / (1024 * 1024)
            
            return {
                'size_bytes': size_bytes,
                'size_mb': round(size_mb, 2),
                'path': str(db_path)
            }
        
        return {'error': 'Database file not found'}
    
    @staticmethod
    def optimize_database(db) -> Dict[str, str]:
        """Run VACUUM and ANALYZE on database"""
        try:
            db.execute("VACUUM")
            db.execute("ANALYZE")
            db.commit()
            
            return {'status': 'success', 'message': 'Database optimized'}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    @staticmethod
    def get_database_integrity_check(db) -> Dict[str, Any]:
        """Run PRAGMA integrity_check"""
        result = db.execute("PRAGMA integrity_check").fetchone()
        
        return {
            'status': 'ok' if result and result[0] == 'ok' else 'error',
            'message': result[0] if result else 'Unknown error'
        }


if __name__ == "__main__":
    print("Admin Enhancement Module")
    print("\nAvailable classes:")
    print("  - AdminAnalytics - System health, engagement, data quality")
    print("  - AdminUserManagement - Inactive users, bulk export, sessions")
    print("  - AdminAuditTools - Audit logs, compliance, suspicious activity")
    print("  - AdminDatabaseMaintenance - DB size, optimization, integrity")
