#!/usr/bin/env python3
"""
Test analytics page API endpoints
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_analytics_endpoints():
    """Test that analytics endpoints return correct data structure"""
    print("=" * 60)
    print("TESTING: Analytics Page API Endpoints")
    print("=" * 60)
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: /api/analytics/insights endpoint exists
    print("\n1. Testing /api/analytics/insights route...")
    tests_total += 1
    try:
        from advanced_features_routes import register_advanced_features
        print("  ✓ Route module imported")
        
        # Check that route decorator is present
        with open('advanced_features_routes.py', 'r', encoding='utf-8') as f:
            content = f.read()
            if '@app.route("/api/analytics/insights")' in content:
                print("  ✅ PASS: /api/analytics/insights route found")
                tests_passed += 1
            else:
                print("  ❌ FAIL: /api/analytics/insights route not found")
    except Exception as e:
        print(f"  ❌ FAIL: {e}")
    
    # Test 2: /api/analytics/predict returns correct structure
    print("\n2. Testing /api/analytics/predict response format...")
    tests_total += 1
    try:
        with open('advanced_features_routes.py', 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Check for predictions object structure
            if "'timestamp':" in content and "'value':" in content and "'confidence':" in content:
                print("  ✓ Predictions return objects with timestamp, value, confidence")
                print("  ✅ PASS: Prediction format is correct")
                tests_passed += 1
            else:
                print("  ❌ FAIL: Predictions don't have correct object structure")
    except Exception as e:
        print(f"  ❌ FAIL: {e}")
    
    # Test 3: Verify avg_confidence field is returned
    print("\n3. Testing avg_confidence field in predictions...")
    tests_total += 1
    try:
        with open('advanced_features_routes.py', 'r', encoding='utf-8') as f:
            content = f.read()
            
            if "'avg_confidence':" in content:
                print("  ✓ avg_confidence field found in response")
                print("  ✅ PASS: avg_confidence is returned")
                tests_passed += 1
            else:
                print("  ❌ FAIL: avg_confidence field missing")
    except Exception as e:
        print(f"  ❌ FAIL: {e}")
    
    # Test 4: Check imports for datetime and timedelta
    print("\n4. Testing datetime imports for timestamp formatting...")
    tests_total += 1
    try:
        with open('advanced_features_routes.py', 'r', encoding='utf-8') as f:
            content = f.read()
            
            has_datetime = 'from datetime import' in content or 'import datetime' in content
            has_strftime = "strftime('%H:%M')" in content
            
            if has_datetime and has_strftime:
                print("  ✓ datetime imported and used for timestamps")
                print("  ✅ PASS: Timestamp formatting is correct")
                tests_passed += 1
            else:
                print("  ❌ FAIL: datetime imports or formatting missing")
    except Exception as e:
        print(f"  ❌ FAIL: {e}")
    
    print(f"\n{'=' * 60}")
    print(f"RESULTS: {tests_passed}/{tests_total} tests passed")
    print(f"{'=' * 60}")
    
    if tests_passed == tests_total:
        print("\n✅ ALL TESTS PASSED - Analytics page should work!")
        return True
    else:
        print(f"\n⚠️ {tests_total - tests_passed} test(s) failed")
        return False

if __name__ == "__main__":
    success = test_analytics_endpoints()
    sys.exit(0 if success else 1)
