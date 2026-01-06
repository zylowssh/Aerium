"""
Admin Enhancement Module
Provides advanced admin tools for user management, analytics, and system monitoring
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from database import get_db, DB_PATH
import json
import os
from pathlib import Path


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
        
        db_path = Path(DB_PATH)
        
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


class AuditLogger:
    """Comprehensive audit logging for all admin actions"""
    
    def __init__(self):
        """Initialize audit logger"""
        self._ensure_audit_table()
    
    def _ensure_audit_table(self):
        """Ensure audit log table exists"""
        db = get_db()
        db.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                username TEXT,
                action TEXT,
                entity_type TEXT,
                entity_id TEXT,
                details TEXT,
                ip_address TEXT,
                status TEXT,
                severity TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp 
            ON audit_logs(timestamp DESC)
        """)
        db.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_action 
            ON audit_logs(action)
        """)
        db.commit()
        db.close()
    
    def log_action(self, user_id: int, username: str, action: str, 
                   entity_type: str, details: Optional[Dict] = None, ip_address: str = '',
                   status: str = 'success', severity: str = 'low') -> bool:
        """
        Log an admin action
        
        Args:
            user_id: ID of the admin
            username: Username of the admin
            action: Action performed (e.g., 'CREATE_USER', 'DELETE_BACKUP')
            entity_type: Type of entity affected (e.g., 'user', 'backup', 'session')
            details: Dict with action details
            ip_address: IP address of the admin
            status: 'success' or 'failure'
            severity: 'low', 'medium', or 'high'
        
        Returns:
            True if logged successfully
        """
        if details is None:
            details = {}
        try:
            db = get_db()
            db.execute("""
                INSERT INTO audit_logs 
                (user_id, username, action, entity_type, entity_id, 
                 details, ip_address, status, severity)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, username, action, entity_type,
                details.get('id', details.get('backup_name', '')),
                json.dumps(details), ip_address, status, severity
            ))
            db.commit()
            db.close()
            return True
        except Exception as e:
            print(f"❌ Audit log error: {e}")
            return False
    
    def get_logs(self, limit: int = 100, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Get audit logs with optional filters
        
        Args:
            limit: Maximum number of logs to return
            filters: Dict with optional filters:
                - days: Last N days
                - action: Specific action type
                - user_id: Specific user
                - severity: 'low', 'medium', 'high'
        
        Returns:
            List of audit log dictionaries
        """
        db = get_db()
        query = "SELECT * FROM audit_logs WHERE 1=1"
        params = []
        
        if filters:
            if filters.get('days'):
                since = datetime.now() - timedelta(days=filters['days'])
                query += " AND timestamp > ?"
                params.append(since.isoformat())
            
            if filters.get('action'):
                query += " AND action = ?"
                params.append(filters['action'])
            
            if filters.get('user_id'):
                query += " AND user_id = ?"
                params.append(filters['user_id'])
            
            if filters.get('severity'):
                query += " AND severity = ?"
                params.append(filters['severity'])
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        logs = db.execute(query, params).fetchall()
        db.close()
        
        return [dict(log) for log in logs] if logs else []
    
    def get_summary(self, days: int = 7) -> Dict[str, Any]:
        """Get audit log summary"""
        db = get_db()
        since = datetime.now() - timedelta(days=days)
        
        total = db.execute(
            "SELECT COUNT(*) FROM audit_logs WHERE timestamp > ?",
            (since.isoformat(),)
        ).fetchone()[0]
        
        by_severity = db.execute("""
            SELECT severity, COUNT(*) as count 
            FROM audit_logs 
            WHERE timestamp > ? 
            GROUP BY severity
        """, (since.isoformat(),)).fetchall()
        
        by_action = db.execute("""
            SELECT action, COUNT(*) as count 
            FROM audit_logs 
            WHERE timestamp > ? 
            GROUP BY action 
            ORDER BY count DESC 
            LIMIT 10
        """, (since.isoformat(),)).fetchall()
        
        db.close()
        
        return {
            'total_actions': total,
            'days': days,
            'by_severity': {row[0]: row[1] for row in (by_severity or [])},
            'top_actions': [{'action': row[0], 'count': row[1]} for row in (by_action or [])]
        }


class SessionManager:
    """Manage user sessions and login history"""
    
    def __init__(self):
        """Initialize session manager"""
        self._ensure_session_tables()
    
    def _ensure_session_tables(self):
        """Ensure session tables exist"""
        db = get_db()
        db.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                username TEXT,
                session_token TEXT UNIQUE,
                ip_address TEXT,
                user_agent TEXT,
                login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                logout_time DATETIME
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS login_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                username TEXT,
                login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                success INTEGER,
                failure_reason TEXT
            )
        """)
        db.execute("""
            CREATE INDEX IF NOT EXISTS idx_session_user 
            ON user_sessions(user_id)
        """)
        db.commit()
        db.close()
    
    def get_active_sessions(self) -> List[Dict]:
        """Get all active user sessions"""
        db = get_db()
        sessions = db.execute("""
            SELECT id, user_id, username, ip_address, user_agent, 
                   login_time, last_activity
            FROM user_sessions
            WHERE logout_time IS NULL
            ORDER BY last_activity DESC
        """).fetchall()
        db.close()
        
        return [dict(s) for s in sessions] if sessions else []
    
    def get_login_history(self, limit: int = 50, days: int = 30) -> List[Dict]:
        """Get login history"""
        db = get_db()
        since = datetime.now() - timedelta(days=days)
        
        history = db.execute("""
            SELECT id, user_id, username, login_time, ip_address, success
            FROM login_history
            WHERE login_time > ?
            ORDER BY login_time DESC
            LIMIT ?
        """, (since.isoformat(), limit)).fetchall()
        
        db.close()
        
        return [dict(h) for h in history] if history else []
    
    def end_session(self, session_token: str) -> bool:
        """Terminate a session"""
        try:
            db = get_db()
            db.execute(
                "UPDATE user_sessions SET logout_time = CURRENT_TIMESTAMP WHERE session_token = ?",
                (session_token,)
            )
            db.commit()
            db.close()
            return True
        except Exception as e:
            print(f"❌ Session termination error: {e}")
            return False


class DataRetention:
    """Manage data retention policies"""
    
    def __init__(self):
        """Initialize data retention manager"""
        self._ensure_retention_tables()
    
    def _ensure_retention_tables(self):
        """Ensure retention policy tables exist"""
        db = get_db()
        db.execute("""
            CREATE TABLE IF NOT EXISTS retention_policies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT,
                retention_days INTEGER,
                enabled INTEGER DEFAULT 1,
                auto_delete INTEGER DEFAULT 1,
                last_cleanup DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.commit()
        db.close()
        
        # Initialize default policies
        self._init_default_policies()
    
    def _init_default_policies(self):
        """Initialize default retention policies"""
        db = get_db()
        
        defaults = [
            ('co2_readings', 365),
            ('audit_logs', 90),
            ('login_history', 90),
            ('user_sessions', 30)
        ]
        
        for entity_type, days in defaults:
            existing = db.execute(
                "SELECT id FROM retention_policies WHERE entity_type = ?",
                (entity_type,)
            ).fetchone()
            
            if not existing:
                db.execute("""
                    INSERT INTO retention_policies 
                    (entity_type, retention_days)
                    VALUES (?, ?)
                """, (entity_type, days))
        
        db.commit()
        db.close()
    
    def get_policies(self) -> List[Dict]:
        """Get all retention policies"""
        db = get_db()
        policies = db.execute("""
            SELECT id, entity_type, retention_days, enabled, auto_delete
            FROM retention_policies
            ORDER BY entity_type
        """).fetchall()
        db.close()
        
        return [dict(p) for p in policies] if policies else []
    
    def update_policy(self, policy_id: int, retention_days: int, 
                     enabled: bool = True, auto_delete: bool = True) -> bool:
        """Update a retention policy"""
        try:
            db = get_db()
            db.execute("""
                UPDATE retention_policies
                SET retention_days = ?, enabled = ?, auto_delete = ?
                WHERE id = ?
            """, (retention_days, int(enabled), int(auto_delete), policy_id))
            db.commit()
            db.close()
            return True
        except Exception as e:
            print(f"❌ Policy update error: {e}")
            return False
    
    def cleanup_old_data(self) -> Dict[str, int]:
        """Run cleanup based on policies"""
        db = get_db()
        cleaned = {}
        
        policies = db.execute("""
            SELECT entity_type, retention_days 
            FROM retention_policies 
            WHERE enabled = 1 AND auto_delete = 1
        """).fetchall()
        
        for entity_type, retention_days in policies:
            cutoff = datetime.now() - timedelta(days=retention_days)
            
            if entity_type == 'co2_readings':
                cursor = db.execute(
                    "DELETE FROM co2_readings WHERE timestamp < ?",
                    (cutoff.isoformat(),)
                )
            elif entity_type == 'audit_logs':
                cursor = db.execute(
                    "DELETE FROM audit_logs WHERE timestamp < ?",
                    (cutoff.isoformat(),)
                )
            elif entity_type == 'login_history':
                cursor = db.execute(
                    "DELETE FROM login_history WHERE login_time < ?",
                    (cutoff.isoformat(),)
                )
            
            if cursor.rowcount > 0:
                cleaned[entity_type] = cursor.rowcount
        
        db.commit()
        db.close()
        
        return cleaned


class SystemMonitor:
    """Monitor system resources and database health"""
    
    @staticmethod
    def get_system_stats() -> Dict[str, Any]:
        """Get system resource statistics"""
        try:
            import psutil
            
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'cpu_percent': cpu_percent,
                'memory_total_gb': round(memory.total / (1024**3), 2),
                'memory_used_gb': round(memory.used / (1024**3), 2),
                'memory_percent': memory.percent,
                'disk_total_gb': round(disk.total / (1024**3), 2),
                'disk_used_gb': round(disk.used / (1024**3), 2),
                'disk_percent': disk.percent,
                'timestamp': datetime.now().isoformat()
            }
        except ImportError:
            return {'error': 'psutil not installed', 'timestamp': datetime.now().isoformat()}
    
    @staticmethod
    def get_database_stats() -> Dict[str, Any]:
        """Get database statistics"""
        db = get_db()
        
        stats = {
            'users': db.execute("SELECT COUNT(*) FROM users").fetchone()[0],
            'readings': db.execute("SELECT COUNT(*) FROM co2_readings").fetchone()[0],
            'audit_logs': db.execute("SELECT COUNT(*) FROM audit_logs").fetchone()[0] if db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'").fetchone() else 0,
            'size_mb': round(os.path.getsize(Path(DB_PATH)) / (1024**2), 2) if Path(DB_PATH).exists() else 0,
            'timestamp': datetime.now().isoformat()
        }
        
        db.close()
        return stats
    
    @staticmethod
    def get_service_health() -> Dict[str, str]:
        """Get service health status"""
        try:
            db = get_db()
            db.execute("SELECT COUNT(*) FROM users")
            db.close()
            
            return {
                'database': 'healthy',
                'status': 'operational'
            }
        except Exception as e:
            return {
                'database': 'error',
                'status': 'degraded',
                'error': str(e)
            }


class BackupManager:
    """Manage system backups and restore"""
    
    def __init__(self):
        """Initialize backup manager"""
        self.db_path = Path(DB_PATH)
        self.backup_dir = self.db_path.parent / 'backups'
        self.backup_dir.mkdir(parents=True, exist_ok=True)
    
    def create_backup(self, backup_name: Optional[str] = None) -> Dict[str, Any]:
        """Create a system backup"""
        try:
            import shutil
            
            if not backup_name:
                backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            backup_path = self.backup_dir / f"{backup_name}{self.db_path.suffix or '.db'}"
            
            # Copy database
            if self.db_path.exists():
                shutil.copy2(self.db_path, backup_path)
            
            return {
                'success': True,
                'backup_name': backup_name,
                'created_at': datetime.now().isoformat(),
                'message': f'Backup {backup_name} created successfully'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to create backup'
            }
    
    def get_backups(self) -> List[Dict]:
        """Get list of available backups"""
        try:
            backups = []
            
            if self.backup_dir.exists():
                for filename in os.listdir(self.backup_dir):
                    if filename.endswith(self.db_path.suffix):
                        filepath = self.backup_dir / filename
                        size_bytes = filepath.stat().st_size
                        mod_time = datetime.fromtimestamp(filepath.stat().st_mtime)
                        
                        backups.append({
                            'name': filename.replace(self.db_path.suffix, ''),
                            'size_mb': round(size_bytes / (1024**2), 2),
                            'created': mod_time.isoformat()
                        })
            
            return sorted(backups, key=lambda x: x['created'], reverse=True)
        except Exception as e:
            print(f"❌ Get backups error: {e}")
            return []
    
    def restore_backup(self, backup_name: str) -> Dict[str, Any]:
        """Restore from a backup"""
        try:
            import shutil
            
            backup_path = self.backup_dir / f"{backup_name}{self.db_path.suffix}"
            
            if not os.path.exists(backup_path):
                return {
                    'success': False,
                    'error': 'Backup not found',
                    'message': f'Backup {backup_name} does not exist'
                }
            
            # Create safety backup of current database
            if self.db_path.exists():
                safety_name = self.backup_dir / f"pre_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}{self.db_path.suffix}"
                shutil.copy2(self.db_path, safety_name)
            
            # Restore backup
            shutil.copy2(backup_path, self.db_path)
            
            return {
                'success': True,
                'backup_name': backup_name,
                'restored_at': datetime.now().isoformat(),
                'message': f'Successfully restored from {backup_name}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to restore backup'
            }
    
    def delete_backup(self, backup_name: str) -> Dict[str, Any]:
        """Delete a backup"""
        try:
            backup_path = self.backup_dir / f"{backup_name}{self.db_path.suffix}"
            
            if not os.path.exists(backup_path):
                return {
                    'success': False,
                    'error': 'Backup not found'
                }
            
            os.remove(backup_path)
            
            return {
                'success': True,
                'message': f'Backup {backup_name} deleted successfully'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


class UserManager:
    """Manage user accounts and permissions"""
    
    def __init__(self):
        self.db = get_db()
        self._ensure_user_columns()

    def _ensure_user_columns(self):
        """Add missing user columns if they are absent (non-breaking)."""
        cursor = self.db.cursor()
        for col_def in [
            ("is_admin", "INTEGER DEFAULT 0"),
            ("is_active", "INTEGER DEFAULT 1"),
            ("last_login", "DATETIME")
        ]:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_def[0]} {col_def[1]}")
            except Exception:
                # Column already exists, keep going
                pass
        self.db.commit()
    
    def list_users(self, page: int = 1, per_page: int = 50) -> Dict:
        """Get paginated list of users"""
        try:
            cursor = self.db.cursor()
            offset = (page - 1) * per_page
            
            cursor.execute('''
                SELECT 
                    id, username, email,
                    COALESCE(is_admin, CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as is_admin,
                    COALESCE(is_active, 1) as is_active,
                    created_at,
                    COALESCE(last_login, (
                        SELECT MAX(login_time) FROM login_history lh WHERE lh.user_id = users.id
                    )) as last_login,
                    role,
                    email_verified
                FROM users
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (per_page, offset))
            
            users = cursor.fetchall()
            
            # Get total count
            cursor.execute('SELECT COUNT(*) FROM users')
            total = cursor.fetchone()[0]
            
            return {
                'success': True,
                'users': [dict(u) for u in users],
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def enable_user(self, user_id: int) -> Dict:
        """Enable a user account"""
        try:
            cursor = self.db.cursor()
            cursor.execute('UPDATE users SET is_active = 1 WHERE id = ?', (user_id,))
            self.db.commit()
            return {'success': True, 'message': f'User {user_id} enabled'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def disable_user(self, user_id: int) -> Dict:
        """Disable a user account"""
        try:
            cursor = self.db.cursor()
            cursor.execute('UPDATE users SET is_active = 0 WHERE id = ?', (user_id,))
            self.db.commit()
            return {'success': True, 'message': f'User {user_id} disabled'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def reset_password(self, user_id: int, new_password: str) -> Dict:
        """Reset user password"""
        try:
            from werkzeug.security import generate_password_hash
            cursor = self.db.cursor()
            hashed = generate_password_hash(new_password)
            cursor.execute(
                'UPDATE users SET password_hash = ? WHERE id = ?',
                (hashed, user_id)
            )
            self.db.commit()
            return {'success': True, 'message': f'Password reset for user {user_id}'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def set_admin_status(self, user_id: int, is_admin: bool) -> Dict:
        """Set user admin status"""
        try:
            cursor = self.db.cursor()
            cursor.execute(
                'UPDATE users SET is_admin = ?, role = ? WHERE id = ?',
                (int(is_admin), 'admin' if is_admin else 'user', user_id)
            )
            self.db.commit()
            status = "promoted" if is_admin else "demoted"
            return {'success': True, 'message': f'User {user_id} {status}'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_user_activity(self, user_id: int) -> Dict:
        """Get user activity summary"""
        try:
            cursor = self.db.cursor()
            
            # Get user info
            cursor.execute(
                '''
                SELECT id, username, email, created_at,
                       COALESCE(last_login, (
                           SELECT MAX(login_time) FROM login_history WHERE user_id = users.id
                       )) as last_login
                FROM users WHERE id = ?
                ''',
                (user_id,)
            )
            user = cursor.fetchone()
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            # Get login history
            cursor.execute('''
                SELECT COUNT(*) FROM login_history WHERE user_id = ?
            ''', (user_id,))
            login_count = cursor.fetchone()[0]
            
            # Get recent actions from audit log
            cursor.execute('''
                SELECT COUNT(*) FROM audit_logs 
                WHERE user_id = ? AND timestamp > datetime('now', '-30 days')
            ''', (user_id,))
            recent_actions = cursor.fetchone()[0]
            
            return {
                'success': True,
                'user': dict(user),
                'login_count': login_count,
                'recent_actions': recent_actions
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}


class LogAnalytics:
    """Analyze and export audit logs"""
    
    def __init__(self):
        self.db = get_db()
    
    def search_logs(self, query: str, action: Optional[str] = None, 
                   days: int = 30, limit: int = 100) -> Dict:
        """Search audit logs by user or action"""
        try:
            cursor = self.db.cursor()
            where_clauses = ["timestamp > datetime('now', ? || ' days')"]
            params = [f'-{days}']
            
            if query:
                where_clauses.append('(username LIKE ? OR action LIKE ?)')
                search_term = f'%{query}%'
                params.extend([search_term, search_term])
            
            if action:
                where_clauses.append('action = ?')
                params.append(action)
            
            where_sql = ' AND '.join(where_clauses)
            
            cursor.execute(f'''
                SELECT id, user_id, username, action, entity_type, timestamp, status
                FROM audit_logs
                WHERE {where_sql}
                ORDER BY timestamp DESC
                LIMIT ?
            ''', params + [limit])
            
            logs = cursor.fetchall()
            return {
                'success': True,
                'logs': [dict(log) for log in logs],
                'count': len(logs)
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_activity_stats(self, days: int = 30) -> Dict:
        """Get activity statistics"""
        try:
            cursor = self.db.cursor()
            
            # Top actions
            cursor.execute('''
                SELECT action, COUNT(*) as count
                FROM audit_logs
                WHERE timestamp > datetime('now', ? || ' days')
                GROUP BY action
                ORDER BY count DESC
                LIMIT 10
            ''', (f'-{days}',))
            top_actions = {row[0]: row[1] for row in cursor.fetchall()}
            
            # Top users
            cursor.execute('''
                SELECT username, COUNT(*) as count
                FROM audit_logs
                WHERE timestamp > datetime('now', ? || ' days')
                GROUP BY username
                ORDER BY count DESC
                LIMIT 10
            ''', (f'-{days}',))
            top_users = {row[0]: row[1] for row in cursor.fetchall()}
            
            # Failed actions
            cursor.execute('''
                SELECT COUNT(*) FROM audit_logs
                WHERE status = 'failure' AND timestamp > datetime('now', ? || ' days')
            ''', (f'-{days}',))
            failed_count = cursor.fetchone()[0]
            
            return {
                'success': True,
                'top_actions': top_actions,
                'top_users': top_users,
                'failed_actions': failed_count,
                'period_days': days
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def export_csv(self, days: int = 30) -> Dict:
        """Export audit logs as CSV"""
        try:
            import csv
            from io import StringIO
            
            cursor = self.db.cursor()
            cursor.execute('''
                SELECT id, user_id, username, action, entity_type, details, timestamp, status, severity
                FROM audit_logs
                WHERE timestamp > datetime('now', ? || ' days')
                ORDER BY timestamp DESC
            ''', (f'-{days}',))
            
            logs = cursor.fetchall()
            
            # Create CSV
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['ID', 'User ID', 'Username', 'Action', 'Entity Type', 'Details', 'Timestamp', 'Status', 'Severity'])
            
            for log in logs:
                writer.writerow(log)
            
            csv_content = output.getvalue()
            filename = f"audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            
            return {
                'success': True,
                'filename': filename,
                'content': csv_content,
                'records': len(logs)
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def export_json(self, days: int = 30) -> Dict:
        """Export audit logs as JSON"""
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                SELECT id, user_id, username, action, entity_type, details, timestamp, status, severity
                FROM audit_logs
                WHERE timestamp > datetime('now', ? || ' days')
                ORDER BY timestamp DESC
            ''', (f'-{days}',))
            
            logs = [dict(log) for log in cursor.fetchall()]
            filename = f"audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            return {
                'success': True,
                'filename': filename,
                'content': json.dumps(logs, indent=2),
                'records': len(logs)
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}


class MaintenanceManager:
    """Handle automated maintenance tasks"""
    
    def __init__(self):
        self.db = get_db()
    
    def optimize_database(self) -> Dict:
        """Optimize database (vacuum, analyze)"""
        try:
            cursor = self.db.cursor()
            cursor.execute('VACUUM')
            cursor.execute('ANALYZE')
            self.db.commit()
            return {
                'success': True,
                'message': 'Database optimized successfully',
                'operations': ['VACUUM', 'ANALYZE']
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def rotate_logs(self, days: int = 90) -> Dict:
        """Archive old audit logs"""
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                DELETE FROM audit_logs 
                WHERE timestamp < datetime('now', ? || ' days')
            ''', (f'-{days}',))
            
            deleted = cursor.rowcount
            self.db.commit()
            
            return {
                'success': True,
                'message': f'Rotated logs older than {days} days',
                'records_deleted': deleted
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def cleanup_backups(self, keep_count: int = 10) -> Dict:
        """Remove old backups, keep most recent N"""
        try:
            backup_dir = Path(DB_PATH).parent / 'backups'
            if not backup_dir.exists():
                return {'success': True, 'message': 'No backups to clean', 'deleted': 0}
            
            # List backups sorted by modification time
            backups = sorted(
                [f for f in os.listdir(backup_dir) if f.endswith(Path(DB_PATH).suffix)],
                key=lambda x: (backup_dir / x).stat().st_mtime,
                reverse=True
            )
            
            deleted_count = 0
            for backup in backups[keep_count:]:
                try:
                    (backup_dir / backup).unlink()
                    deleted_count += 1
                except Exception:
                    pass
            
            return {
                'success': True,
                'message': f'Cleaned backups, keeping {keep_count} most recent',
                'deleted': deleted_count,
                'remaining': len(backups[:keep_count])
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_maintenance_status(self) -> Dict:
        """Get current maintenance status"""
        try:
            cursor = self.db.cursor()
            
            # Database size
            cursor.execute("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")
            db_size = cursor.fetchone()[0]
            
            # Log count
            cursor.execute('SELECT COUNT(*) FROM audit_logs')
            log_count = cursor.fetchone()[0]
            
            # Backup count
            backup_dir = Path(DB_PATH).parent / 'backups'
            backup_count = len([f for f in os.listdir(backup_dir) if f.endswith(Path(DB_PATH).suffix)]) if backup_dir.exists() else 0
            
            return {
                'success': True,
                'database_size_mb': round(db_size / 1024 / 1024, 2),
                'audit_logs': log_count,
                'backups': backup_count,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}


if __name__ == "__main__":
    print("Admin Enhancement Module")
    print("\nAvailable classes:")
    print("  - UserManager - User account management and activity")
    print("  - LogAnalytics - Search, filter, and export audit logs")
    print("  - MaintenanceManager - Database and backup maintenance")
    print("  - AuditLogger - Comprehensive audit logging")
    print("  - SessionManager - User session and login tracking")
    print("  - DataRetention - Data retention policies")
    print("  - SystemMonitor - System resource monitoring")
    print("  - BackupManager - Backup and restore functionality")
