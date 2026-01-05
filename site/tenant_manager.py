"""
Multi-Tenancy Module
Enables multiple organizations/teams to use the same application
Each tenant has isolated data and permissions
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple
import json
from database import get_db


class TenantManager:
    """Manage organizations and multi-tenancy"""
    
    def __init__(self):
        self.db = get_db()
    
    def init_tenant_schema(self):
        """Initialize tenant tables in database"""
        cursor = self.db.cursor()
        
        # Tenants table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tenants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                slug TEXT NOT NULL UNIQUE,
                owner_user_id INTEGER NOT NULL,
                logo_url TEXT,
                subscription_tier TEXT DEFAULT 'free',
                max_sensors INTEGER DEFAULT 5,
                max_users INTEGER DEFAULT 5,
                max_storage_gb INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
        
        # Tenant members table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tenant_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role TEXT DEFAULT 'member',
                permissions TEXT,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(tenant_id, user_id)
            )
        ''')
        
        # Tenant locations table (multiple locations per tenant)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tenant_locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                address TEXT,
                latitude REAL,
                longitude REAL,
                timezone TEXT DEFAULT 'UTC',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
            )
        ''')
        
        # Link sensors to locations
        cursor.execute('''
            ALTER TABLE sensors ADD COLUMN location_id INTEGER REFERENCES tenant_locations(id)
        ''')
        
        self.db.commit()
        print("✓ Tenant schema initialized")
    
    def create_tenant(self, name: str, owner_user_id: int, slug: Optional[str] = None) -> Optional[int]:
        """
        Create new tenant/organization
        
        Args:
            name: Organization name
            owner_user_id: User ID of organization owner
            slug: URL-friendly slug (auto-generated if not provided)
        
        Returns:
            Tenant ID if successful, None otherwise
        """
        if not slug:
            slug = name.lower().replace(' ', '-').replace('_', '-')
        
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                INSERT INTO tenants (name, slug, owner_user_id)
                VALUES (?, ?, ?)
            ''', (name, slug, owner_user_id))
            
            tenant_id = cursor.lastrowid
            
            # Add owner as member with admin role
            cursor.execute('''
                INSERT INTO tenant_members (tenant_id, user_id, role, permissions)
                VALUES (?, ?, ?, ?)
            ''', (tenant_id, owner_user_id, 'admin', json.dumps(['read', 'write', 'admin'])))
            
            self.db.commit()
            return tenant_id
        except Exception as e:
            print(f"Error creating tenant: {e}")
            return None
    
    def add_tenant_member(self, tenant_id: int, user_id: int, role: str = 'member') -> bool:
        """
        Add user to tenant
        
        Args:
            tenant_id: Tenant ID
            user_id: User ID to add
            role: User role ('admin', 'member', 'viewer')
        
        Returns:
            True if successful
        """
        permissions_map = {
            'admin': ['read', 'write', 'admin', 'delete'],
            'member': ['read', 'write'],
            'viewer': ['read']
        }
        
        try:
            cursor = self.db.cursor()
            permissions = permissions_map.get(role, ['read'])
            
            cursor.execute('''
                INSERT INTO tenant_members (tenant_id, user_id, role, permissions)
                VALUES (?, ?, ?, ?)
            ''', (tenant_id, user_id, role, json.dumps(permissions)))
            
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error adding tenant member: {e}")
            return False
    
    def remove_tenant_member(self, tenant_id: int, user_id: int) -> bool:
        """Remove user from tenant"""
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                DELETE FROM tenant_members
                WHERE tenant_id = ? AND user_id = ?
            ''', (tenant_id, user_id))
            
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error removing tenant member: {e}")
            return False
    
    def get_user_tenants(self, user_id: int) -> List[Dict]:
        """Get all tenants for a user"""
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                SELECT t.*, tm.role
                FROM tenants t
                JOIN tenant_members tm ON t.id = tm.tenant_id
                WHERE tm.user_id = ? AND t.is_active = TRUE
                ORDER BY t.created_at DESC
            ''', (user_id,))
            
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error getting user tenants: {e}")
            return []
    
    def create_location(self, tenant_id: int, name: str, address: str = "", 
                       lat: Optional[float] = None, lon: Optional[float] = None) -> Optional[int]:
        """Create location within tenant"""
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                INSERT INTO tenant_locations (tenant_id, name, address, latitude, longitude)
                VALUES (?, ?, ?, ?, ?)
            ''', (tenant_id, name, address, lat, lon))
            
            self.db.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error creating location: {e}")
            return None
    
    def get_tenant_locations(self, tenant_id: int) -> List[Dict]:
        """Get all locations for a tenant"""
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                SELECT * FROM tenant_locations
                WHERE tenant_id = ?
                ORDER BY name
            ''', (tenant_id,))
            
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error getting locations: {e}")
            return []
    
    def get_tenant_statistics(self, tenant_id: int) -> Dict:
        """Get usage statistics for tenant"""
        try:
            cursor = self.db.cursor()
            
            # Get member count
            cursor.execute('SELECT COUNT(*) FROM tenant_members WHERE tenant_id = ?', (tenant_id,))
            member_count = cursor.fetchone()[0]
            
            # Get location count
            cursor.execute('SELECT COUNT(*) FROM tenant_locations WHERE tenant_id = ?', (tenant_id,))
            location_count = cursor.fetchone()[0]
            
            # Get sensor count
            cursor.execute('''
                SELECT COUNT(*) FROM sensors s
                JOIN tenant_locations tl ON s.location_id = tl.id
                WHERE tl.tenant_id = ?
            ''', (tenant_id,))
            sensor_count = cursor.fetchone()[0]
            
            # Get reading count
            cursor.execute('''
                SELECT COUNT(*) FROM sensor_readings sr
                JOIN sensors s ON sr.sensor_id = s.id
                JOIN tenant_locations tl ON s.location_id = tl.id
                WHERE tl.tenant_id = ?
            ''', (tenant_id,))
            reading_count = cursor.fetchone()[0]
            
            return {
                'members': member_count,
                'locations': location_count,
                'sensors': sensor_count,
                'readings': reading_count
            }
        except Exception as e:
            print(f"Error getting tenant statistics: {e}")
            return {}
    
    def upgrade_subscription(self, tenant_id: int, tier: str, 
                           max_sensors: int, max_users: int, max_storage_gb: int) -> bool:
        """Upgrade tenant subscription tier"""
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                UPDATE tenants
                SET subscription_tier = ?, max_sensors = ?, max_users = ?, max_storage_gb = ?
                WHERE id = ?
            ''', (tier, max_sensors, max_users, max_storage_gb, tenant_id))
            
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error upgrading subscription: {e}")
            return False
    
    def check_quota(self, tenant_id: int, resource: str) -> Tuple[bool, Dict]:
        """
        Check if tenant has reached quota for resource
        
        Returns:
            (is_under_quota, quota_info)
        """
        try:
            cursor = self.db.cursor()
            cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,))
            columns = [desc[0] for desc in cursor.description]
            tenant = dict(zip(columns, cursor.fetchone()))
            
            stats = self.get_tenant_statistics(tenant_id)
            
            quotas = {
                'sensors': (stats['sensors'], tenant['max_sensors']),
                'users': (stats['members'], tenant['max_users']),
            }
            
            if resource in quotas:
                current, max_val = quotas[resource]
                return current < max_val, {'current': current, 'max': max_val}
            
            return True, {}
        except Exception as e:
            print(f"Error checking quota: {e}")
            return True, {}
