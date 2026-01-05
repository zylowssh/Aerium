"""
Collaborative Features Module
Real-time team dashboards, shared alerts, comments on anomalies
"""

import json
from datetime import datetime
from typing import Dict, List, Optional
from database import get_db


class CollaborationManager:
    """Manage team collaboration features"""
    
    def __init__(self):
        self.db = get_db()
        self._init_schema()
    
    def _init_schema(self):
        """Initialize collaboration database tables"""
        cursor = self.db.cursor()
        
        try:
            # Team collaboration settings
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS team_shares (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    sensor_id INTEGER NOT NULL,
                    team_members TEXT NOT NULL,  -- JSON array of user_ids
                    permission_level TEXT DEFAULT 'viewer',  -- viewer, commenter, editor
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (sensor_id) REFERENCES sensors(id)
                )
            ''')
            
            # Shared alerts/thresholds
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS shared_alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    team_share_id INTEGER NOT NULL,
                    alert_name TEXT NOT NULL,
                    condition TEXT NOT NULL,  -- e.g. "ppm > 800"
                    threshold_value REAL NOT NULL,
                    notify_users TEXT NOT NULL,  -- JSON array of user_ids
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (team_share_id) REFERENCES team_shares(id)
                )
            ''')
            
            # Comments/annotations on readings
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS reading_comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    reading_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    comment_text TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP,
                    FOREIGN KEY (reading_id) REFERENCES sensor_readings(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            ''')
            
            # Activity feed for team
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS team_activity (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    team_share_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    activity_type TEXT NOT NULL,  -- anomaly_detected, threshold_changed, comment_added, alert_fired
                    activity_data TEXT NOT NULL,  -- JSON object
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (team_share_id) REFERENCES team_shares(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            ''')
            
            self.db.commit()
        except Exception as e:
            print(f"Schema already exists: {e}")
    
    def create_team_share(self, user_id: int, sensor_id: int, 
                         team_members: List[int], permission_level: str = 'viewer') -> Optional[int]:
        """
        Create a shared dashboard for a team
        
        Args:
            user_id: Owner user ID
            sensor_id: Sensor being shared
            team_members: List of user IDs to share with
            permission_level: 'viewer', 'commenter', or 'editor'
        
        Returns:
            Share ID or None
        """
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                INSERT INTO team_shares (user_id, sensor_id, team_members, permission_level)
                VALUES (?, ?, ?, ?)
            ''', (user_id, sensor_id, json.dumps(team_members), permission_level))
            
            self.db.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error creating team share: {e}")
            return None
    
    def add_team_member(self, team_share_id: int, user_id: int) -> bool:
        """Add a member to shared dashboard"""
        try:
            cursor = self.db.cursor()
            cursor.execute('SELECT team_members FROM team_shares WHERE id = ?', (team_share_id,))
            result = cursor.fetchone()
            
            if not result:
                return False
            
            members = json.loads(result[0])
            if user_id not in members:
                members.append(user_id)
            
            cursor.execute('''
                UPDATE team_shares SET team_members = ? WHERE id = ?
            ''', (json.dumps(members), team_share_id))
            
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error adding team member: {e}")
            return False
    
    def remove_team_member(self, team_share_id: int, user_id: int) -> bool:
        """Remove a member from shared dashboard"""
        try:
            cursor = self.db.cursor()
            cursor.execute('SELECT team_members FROM team_shares WHERE id = ?', (team_share_id,))
            result = cursor.fetchone()
            
            if not result:
                return False
            
            members = json.loads(result[0])
            if user_id in members:
                members.remove(user_id)
            
            cursor.execute('''
                UPDATE team_shares SET team_members = ? WHERE id = ?
            ''', (json.dumps(members), team_share_id))
            
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error removing team member: {e}")
            return False
    
    def create_shared_alert(self, team_share_id: int, alert_name: str, 
                           condition: str, threshold_value: float,
                           notify_users: List[int]) -> Optional[int]:
        """
        Create a shared alert that notifies the team
        
        Args:
            team_share_id: Team share ID
            alert_name: Alert name (e.g., "High CO₂ Alert")
            condition: Condition (e.g., "ppm > 800")
            threshold_value: Threshold value
            notify_users: List of user IDs to notify
        
        Returns:
            Alert ID or None
        """
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                INSERT INTO shared_alerts 
                (team_share_id, alert_name, condition, threshold_value, notify_users)
                VALUES (?, ?, ?, ?, ?)
            ''', (team_share_id, alert_name, condition, threshold_value, json.dumps(notify_users)))
            
            self.db.commit()
            
            # Log activity
            self._log_activity(team_share_id, 0, 'alert_created', {
                'alert_name': alert_name,
                'threshold': threshold_value
            })
            
            return cursor.lastrowid
        except Exception as e:
            print(f"Error creating shared alert: {e}")
            return None
    
    def add_comment(self, reading_id: int, user_id: int, comment_text: str) -> Optional[int]:
        """
        Add a comment to a sensor reading
        
        Args:
            reading_id: Reading ID
            user_id: User ID making the comment
            comment_text: Comment text
        
        Returns:
            Comment ID or None
        """
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                INSERT INTO reading_comments (reading_id, user_id, comment_text)
                VALUES (?, ?, ?)
            ''', (reading_id, user_id, comment_text))
            
            self.db.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error adding comment: {e}")
            return None
    
    def get_reading_comments(self, reading_id: int) -> List[Dict]:
        """Get all comments for a reading"""
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                SELECT id, user_id, comment_text, created_at
                FROM reading_comments
                WHERE reading_id = ?
                ORDER BY created_at DESC
            ''', (reading_id,))
            
            comments = []
            for row in cursor.fetchall():
                comments.append({
                    'id': row[0],
                    'user_id': row[1],
                    'text': row[2],
                    'created_at': row[3]
                })
            
            return comments
        except Exception as e:
            print(f"Error getting comments: {e}")
            return []
    
    def get_team_activity_feed(self, team_share_id: int, limit: int = 50) -> List[Dict]:
        """Get recent activity for a team share"""
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                SELECT id, user_id, activity_type, activity_data, created_at
                FROM team_activity
                WHERE team_share_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            ''', (team_share_id, limit))
            
            activities = []
            for row in cursor.fetchall():
                activities.append({
                    'id': row[0],
                    'user_id': row[1],
                    'type': row[2],
                    'data': json.loads(row[3]) if row[3] else {},
                    'created_at': row[4]
                })
            
            return activities
        except Exception as e:
            print(f"Error getting activity feed: {e}")
            return []
    
    def _log_activity(self, team_share_id: int, user_id: int, 
                     activity_type: str, activity_data: Dict) -> bool:
        """Log team activity"""
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                INSERT INTO team_activity (team_share_id, user_id, activity_type, activity_data)
                VALUES (?, ?, ?, ?)
            ''', (team_share_id, user_id, activity_type, json.dumps(activity_data)))
            
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error logging activity: {e}")
            return False
    
    def get_team_statistics(self, team_share_id: int) -> Dict:
        """Get statistics for a team"""
        try:
            cursor = self.db.cursor()
            
            # Get team members count
            cursor.execute('SELECT team_members FROM team_shares WHERE id = ?', (team_share_id,))
            result = cursor.fetchone()
            members_count = len(json.loads(result[0])) if result else 0
            
            # Get active alerts
            cursor.execute(
                'SELECT COUNT(*) FROM shared_alerts WHERE team_share_id = ? AND is_active = 1',
                (team_share_id,)
            )
            alerts_count = cursor.fetchone()[0]
            
            # Get recent comments count (last 30 days)
            cursor.execute('''
                SELECT COUNT(*) FROM reading_comments
                WHERE created_at > datetime('now', '-30 days')
            ''')
            comments_count = cursor.fetchone()[0]
            
            # Get activity count (last 30 days)
            cursor.execute('''
                SELECT COUNT(*) FROM team_activity
                WHERE team_share_id = ? AND created_at > datetime('now', '-30 days')
            ''', (team_share_id,))
            activity_count = cursor.fetchone()[0]
            
            return {
                'team_members': members_count,
                'active_alerts': alerts_count,
                'recent_comments': comments_count,
                'team_activities': activity_count
            }
        except Exception as e:
            print(f"Error getting team statistics: {e}")
            return {}
