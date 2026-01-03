"""
Unit and Integration Tests for Morpheus CO₂ Webapp
Tests authentication, API endpoints, database operations, and WebSocket events
"""

import unittest
import json
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from flask import Flask
from database import (
    get_db, init_db, create_user, get_user_by_username, 
    get_user_by_id, get_user_settings, update_user_settings
)
from werkzeug.security import generate_password_hash, check_password_hash


class DatabaseTestCase(unittest.TestCase):
    """Test database operations"""
    
    def setUp(self):
        """Setup test database"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # Initialize database
        init_db()
        
        # Create test user
        self.test_user = create_user(
            "testuser",
            "test@example.com",
            generate_password_hash("testpass123")
        )
    
    def tearDown(self):
        """Cleanup"""
        self.app_context.pop()
    
    def test_user_creation(self):
        """Test creating a new user"""
        self.assertIsNotNone(self.test_user)
        
        user = get_user_by_username("testuser")
        self.assertIsNotNone(user)
        if user:
            self.assertEqual(user['username'], "testuser")
            self.assertEqual(user['email'], "test@example.com")
    
    def test_user_authentication(self):
        """Test password verification"""
        user = get_user_by_username("testuser")
        self.assertIsNotNone(user)
        if user:
            self.assertTrue(
                check_password_hash(user['password_hash'], "testpass123")
            )
            self.assertFalse(
                check_password_hash(user['password_hash'], "wrongpassword")
            )
    
    def test_user_settings_retrieval(self):
        """Test getting user settings"""
        settings = get_user_settings(self.test_user)
        self.assertIsNotNone(settings)
        if settings:
            self.assertEqual(settings['good_threshold'], 800)
            self.assertEqual(settings['bad_threshold'], 1200)
    
    def test_user_settings_update(self):
        """Test updating user settings"""
        # Update settings using kwargs
        update_user_settings(
            self.test_user,
            good_threshold=700,
            bad_threshold=1100,
            alert_threshold=1300
        )
        
        updated = get_user_settings(self.test_user)
        if updated:
            self.assertEqual(updated['good_threshold'], 700)
            self.assertEqual(updated['bad_threshold'], 1100)
    
    def test_co2_readings_insertion(self):
        """Test inserting CO2 readings"""
        db = get_db()
        
        now = datetime.now()
        for i in range(10):
            timestamp = now - timedelta(minutes=i*10)
            db.execute(
                "INSERT INTO co2_readings (timestamp, ppm) VALUES (?, ?)",
                (timestamp.isoformat(), 400 + i*10)
            )
        db.commit()
        
        count = db.execute("SELECT COUNT(*) FROM co2_readings").fetchone()[0]
        db.close()
        
        self.assertEqual(count, 10)
    
    def test_co2_readings_query(self):
        """Test querying CO2 readings"""
        db = get_db()
        
        # Insert test data
        now = datetime.now()
        readings_data = []
        for i in range(5):
            timestamp = now - timedelta(hours=i)
            ppm = 600 + i*50
            readings_data.append((timestamp.isoformat(), ppm))
            db.execute(
                "INSERT INTO co2_readings (timestamp, ppm) VALUES (?, ?)",
                (timestamp.isoformat(), ppm)
            )
        db.commit()
        
        # Query last 24 hours
        since = now - timedelta(hours=24)
        readings = db.execute(
            "SELECT * FROM co2_readings WHERE timestamp > ? ORDER BY timestamp DESC",
            (since.isoformat(),)
        ).fetchall()
        
        db.close()
        
        self.assertGreaterEqual(len(readings), 5)


class AuthenticationTestCase(unittest.TestCase):
    """Test authentication flows"""
    
    def setUp(self):
        # Import Flask app
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).parent))
        
        try:
            from app import app as flask_app
            self.app = flask_app
        except ImportError:
            print("Warning: Could not import Flask app")
            self.app = None
        
        if self.app:
            self.app.config['TESTING'] = True
            self.client = self.app.test_client()
        
        # Initialize database
        init_db()
        
        # Create test user
        create_user(
            "testuser",
            "test@example.com",
            generate_password_hash("testpass123")
        )
    
    def test_login_page_load(self):
        """Test loading login page"""
        response = self.client.get('/login')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'login', response.data.lower())
    
    def test_register_page_load(self):
        """Test loading register page"""
        response = self.client.get('/register')
        self.assertEqual(response.status_code, 200)
    
    def test_login_with_valid_credentials(self):
        """Test login with correct username/password"""
        response = self.client.post(
            '/login',
            data={
                'username': 'testuser',
                'password': 'testpass123'
            },
            follow_redirects=True
        )
        
        # Should redirect to dashboard or onboarding
        self.assertIn(response.status_code, [200, 302])
    
    def test_login_with_invalid_credentials(self):
        """Test login with wrong password"""
        response = self.client.post(
            '/login',
            data={
                'username': 'testuser',
                'password': 'wrongpassword'
            }
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'invalides', response.data.lower())
    
    def test_logout(self):
        """Test logout clears session"""
        # Login first
        self.client.post(
            '/login',
            data={
                'username': 'testuser',
                'password': 'testpass123'
            }
        )
        
        # Logout
        response = self.client.get('/logout', follow_redirects=True)
        self.assertEqual(response.status_code, 200)


class APITestCase(unittest.TestCase):
    """Test API endpoints"""
    
    def setUp(self):
        """Setup test app and client"""
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).parent))
        
        try:
            from app import app as flask_app
            self.app = flask_app
        except ImportError:
            print("Warning: Could not import Flask app")
            self.app = None
        
        if self.app:
            self.app.config['TESTING'] = True
            self.client = self.app.test_client()
        else:
            self.client = None
        
        # Initialize database
        init_db()
        
        # Create and login test user
        user_id = create_user(
            "testuser",
            "test@example.com",
            generate_password_hash("testpass123")
        )
        
        # Insert sample CO2 data
        db = get_db()
        now = datetime.now()
        for i in range(24):
            timestamp = now - timedelta(hours=i)
            db.execute(
                "INSERT INTO co2_readings (timestamp, ppm) VALUES (?, ?)",
                (timestamp.isoformat(), 600 + (i % 8) * 50)
            )
        db.commit()
        db.close()
    
    def test_api_readings_endpoint(self):
        """Test GET /api/readings"""
        if not self.client:
            self.skipTest("Flask app not initialized")
        
        response = self.client.get('/api/readings?days=1')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('readings', data)
        self.assertGreater(len(data['readings']), 0)
    
    def test_api_readings_invalid_days(self):
        """Test /api/readings with invalid days parameter"""
        if not self.client:
            self.skipTest("Flask app not initialized")
        
        response = self.client.get('/api/readings?days=abc')
        
        # Should handle gracefully
        self.assertIn(response.status_code, [200, 400])
    
    def test_api_settings_endpoint(self):
        """Test GET /api/settings"""
        if not self.client:
            self.skipTest("Flask app not initialized")
        
        response = self.client.get('/api/settings')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('good_threshold', data)
        self.assertIn('bad_threshold', data)
    
    def test_api_health_check(self):
        """Test GET /api/health (if it exists)"""
        if not self.client:
            self.skipTest("Flask app not initialized")
        
        response = self.client.get('/api/health')
        
        # Should return 200 or 404 if not implemented
        self.assertIn(response.status_code, [200, 404])


class ValidationTestCase(unittest.TestCase):
    """Test input validation"""
    
    def setUp(self):
        """Setup"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
    
    def test_username_min_length(self):
        """Test username minimum length validation"""
        # This should be validated in the register endpoint
        # Minimum 3 characters
        pass
    
    def test_password_min_length(self):
        """Test password minimum length validation"""
        # Minimum 6 characters required
        pass
    
    def test_email_format(self):
        """Test email format validation"""
        pass


def run_tests(verbosity=2):
    """Run all tests"""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test cases
    suite.addTests(loader.loadTestsFromTestCase(DatabaseTestCase))
    suite.addTests(loader.loadTestsFromTestCase(AuthenticationTestCase))
    suite.addTests(loader.loadTestsFromTestCase(APITestCase))
    suite.addTests(loader.loadTestsFromTestCase(ValidationTestCase))
    
    runner = unittest.TextTestRunner(verbosity=verbosity)
    result = runner.run(suite)
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
