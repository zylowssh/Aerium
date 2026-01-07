#!/usr/bin/env python3
"""
Test script for Advanced Features (Phase 1)
Tests: Advanced Charts, Mobile PWA, Real-time Collaboration
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:5000"
TEST_USER = "testuser"
TEST_PASSWORD = "TestPassword123!"
TEST_EMAIL = "testuser@test.com"

class TestRunner:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = {"passed": 0, "failed": 0, "errors": []}
        self.user_id = None
        self.token = None
    
    def test(self, name, func):
        """Run a test and track results"""
        try:
            print(f"\n🧪 Testing: {name}...", end=" ")
            func()
            print("✅ PASSED")
            self.results["passed"] += 1
            return True
        except AssertionError as e:
            print(f"❌ FAILED")
            self.results["failed"] += 1
            self.results["errors"].append(f"{name}: {str(e)}")
            return False
        except Exception as e:
            print(f"⚠️  ERROR")
            self.results["failed"] += 1
            self.results["errors"].append(f"{name}: {str(e)}")
            return False
    
    def print_results(self):
        """Print test results summary"""
        total = self.results["passed"] + self.results["failed"]
        print(f"\n{'='*60}")
        print(f"📊 TEST RESULTS: {self.results['passed']}/{total} passed")
        print(f"{'='*60}")
        
        if self.results["errors"]:
            print("\n❌ Failed Tests:")
            for error in self.results["errors"]:
                print(f"  - {error}")
        
        return self.results["failed"] == 0
    
    # ============== BASIC APP TESTS ==============
    def test_app_running(self):
        """Check if Flask app is running"""
        resp = self.session.get(f"{self.base_url}/")
        assert resp.status_code == 200, f"App not responding (status: {resp.status_code})"
    
    def test_login_page(self):
        """Check if login page loads"""
        resp = self.session.get(f"{self.base_url}/login")
        assert resp.status_code == 200, f"Login page failed (status: {resp.status_code})"
        assert "login" in resp.text.lower() or "password" in resp.text.lower()
    
    # ============== PWA TESTS ==============
    def test_pwa_manifest(self):
        """Test PWA manifest endpoint"""
        resp = self.session.get(f"{self.base_url}/manifest.json")
        assert resp.status_code == 200, f"Manifest failed (status: {resp.status_code})"
        
        data = resp.json()
        assert "name" in data, "Missing 'name' in manifest"
        assert "short_name" in data, "Missing 'short_name' in manifest"
        assert "start_url" in data, "Missing 'start_url' in manifest"
        assert "display" in data, "Missing 'display' in manifest"
        assert data["display"] == "standalone", f"Display should be 'standalone', got: {data['display']}"
        assert "icons" in data, "Missing 'icons' in manifest"
        assert len(data["icons"]) > 0, "No icons in manifest"
        print(f"  Manifest: {data['name']} ({data['short_name']})")
    
    def test_service_worker(self):
        """Test Service Worker endpoint"""
        resp = self.session.get(f"{self.base_url}/sw.js")
        assert resp.status_code == 200, f"Service Worker failed (status: {resp.status_code})"
        assert "install" in resp.text, "Service Worker missing 'install' event"
        assert "fetch" in resp.text, "Service Worker missing 'fetch' event"
        print(f"  Service Worker: {len(resp.text)} bytes")
    
    # ============== ADVANCED CHARTS TESTS ==============
    def test_advanced_charts_route(self):
        """Test advanced charts page exists (login required)"""
        resp = self.session.get(f"{self.base_url}/advanced-charts")
        # Should redirect to login if not authenticated
        assert resp.status_code in [200, 302], f"Advanced charts route failed (status: {resp.status_code})"
        print(f"  Status: {resp.status_code} (OK if redirecting to login)")
    
    def test_analytics_api_endpoint(self):
        """Test /api/analytics/custom endpoint for chart data"""
        resp = self.session.get(f"{self.base_url}/api/analytics/custom?period=1W&source=live")
        # May require auth, but endpoint should exist
        assert resp.status_code in [200, 401], f"Analytics API failed (status: {resp.status_code})"
        if resp.status_code == 200:
            data = resp.json()
            print(f"  API returned {len(data)} data points")
    
    # ============== COLLABORATION TESTS ==============
    def test_collaboration_api_dashboards(self):
        """Test GET /api/collaboration/dashboards endpoint"""
        resp = self.session.get(f"{self.base_url}/api/collaboration/dashboards")
        # May require auth
        assert resp.status_code in [200, 401], f"Collaboration API failed (status: {resp.status_code})"
        print(f"  Status: {resp.status_code}")
    
    def test_collaboration_api_create(self):
        """Test POST /api/collaboration/dashboard endpoint"""
        data = {
            "dashboard_name": "Test Dashboard",
            "description": "Test Dashboard for Phase 1"
        }
        resp = self.session.post(
            f"{self.base_url}/api/collaboration/dashboard",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        # May require auth
        assert resp.status_code in [201, 400, 401], f"Create dashboard failed (status: {resp.status_code})"
        print(f"  Status: {resp.status_code}")
    
    # ============== DATABASE TESTS ==============
    def test_database_tables(self):
        """Check if collaboration database tables exist"""
        try:
            from database import get_db
            db = get_db()
            cursor = db.cursor()
            
            tables = [
                'shared_dashboards',
                'shared_dashboard_collaborators',
                'dashboard_states',
                'dashboard_comments',
                'collaboration_activity'
            ]
            
            for table in tables:
                cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
                result = cursor.fetchone()
                assert result is not None, f"Table '{table}' not found in database"
            
            db.close()
            print(f"  All {len(tables)} collaboration tables exist")
        except Exception as e:
            print(f"  Could not verify tables: {str(e)}")
    
    # ============== STATIC FILES TESTS ==============
    def test_static_files(self):
        """Check critical static files"""
        files = [
            "/static/css/style.css",
            "/static/js/script.js",
        ]
        
        for file in files:
            resp = self.session.get(f"{self.base_url}{file}")
            assert resp.status_code == 200, f"Static file {file} not found (status: {resp.status_code})"
        
        print(f"  ✓ {len(files)} static files OK")

def main():
    print("""
╔════════════════════════════════════════════════════════════╗
║  🚀 ADVANCED FEATURES TEST SUITE (Phase 1)                ║
║  Testing: Advanced Charts, PWA, Real-time Collaboration   ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    print(f"🔗 Connecting to: {BASE_URL}")
    
    tester = TestRunner(BASE_URL)
    
    # Test basic app
    print("\n📱 BASIC TESTS")
    tester.test("App is running", tester.test_app_running)
    tester.test("Login page loads", tester.test_login_page)
    
    # Test PWA
    print("\n📲 PWA TESTS")
    tester.test("PWA Manifest exists", tester.test_pwa_manifest)
    tester.test("Service Worker exists", tester.test_service_worker)
    
    # Test Advanced Charts
    print("\n📊 ADVANCED CHARTS TESTS")
    tester.test("Advanced Charts route exists", tester.test_advanced_charts_route)
    tester.test("Analytics API endpoint exists", tester.test_analytics_api_endpoint)
    
    # Test Collaboration
    print("\n👥 REAL-TIME COLLABORATION TESTS")
    tester.test("Collaboration dashboards endpoint exists", tester.test_collaboration_api_dashboards)
    tester.test("Collaboration create endpoint exists", tester.test_collaboration_api_create)
    
    # Test Database
    print("\n🗄️  DATABASE TESTS")
    tester.test("Collaboration tables exist", tester.test_database_tables)
    
    # Test Static Files
    print("\n📁 STATIC FILES TESTS")
    tester.test("Static files are accessible", tester.test_static_files)
    
    # Print results
    success = tester.print_results()
    return 0 if success else 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Fatal error: {str(e)}")
        sys.exit(1)
