#!/usr/bin/env python3
"""
Quick test to verify uptime fix - ensures API returns number and JS can handle it
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_performance_api_returns_number():
    """Test that /api/system/performance returns uptime_percent as number"""
    print("=" * 60)
    print("TESTING: Performance API Response")
    print("=" * 60)
    
    from database import get_system_performance_metrics
    
    try:
        metrics = get_system_performance_metrics()
        
        print(f"\n✓ Function executed successfully")
        print(f"\n📊 Returned metrics:")
        for key, value in metrics.items():
            print(f"  - {key}: {value} (type: {type(value).__name__})")
        
        # Verify uptime_percent is a number
        assert 'uptime_percent' in metrics, "Missing uptime_percent"
        uptime = metrics['uptime_percent']
        
        print(f"\n🔍 Checking uptime_percent:")
        print(f"  Value: {uptime}")
        print(f"  Type: {type(uptime).__name__}")
        
        assert isinstance(uptime, (int, float)), f"uptime_percent should be numeric, got {type(uptime)}"
        assert 0 <= uptime <= 100, f"uptime_percent should be 0-100, got {uptime}"
        
        print(f"  ✅ PASS: uptime_percent is numeric ({uptime})")
        
        # Simulate JavaScript handling
        print(f"\n🔧 JavaScript handling simulation:")
        uptime_str = f"{uptime}%" if isinstance(uptime, (int, float)) else uptime
        print(f"  Display value: {uptime_str}")
        
        is_good = uptime >= 99 if isinstance(uptime, (int, float)) else False
        print(f"  Status check (>=99): {is_good}")
        
        print(f"\n{'='*60}")
        print("✅ ALL CHECKS PASSED - uptime fix verified!")
        print("='*60}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_performance_api_returns_number()
    sys.exit(0 if success else 1)
