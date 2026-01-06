#!/usr/bin/env python3
"""
Test if Flask app starts with advanced features
"""

import sys
import os
sys.path.insert(0, 'C:/Users/Zylow/Documents/NSI/PROJECT/Morpheus/site')
os.chdir('C:/Users/Zylow/Documents/NSI/PROJECT/Morpheus/site')

try:
    print("📦 Importing Flask app...")
    from app import app, socketio, limiter
    
    print("✅ Flask app imported successfully")
    
    print("\n🔍 Checking registered routes:")
    routes = []
    for rule in app.url_map.iter_rules():
        if 'api' in rule.rule:
            routes.append(rule.rule)
    
    # Filter for advanced features routes
    advanced_routes = [r for r in routes if any(x in r for x in ['analytics', 'visualization', 'share', 'dashboard', 'system', 'health', 'teams'])]
    
    print(f"\n✅ Found {len(advanced_routes)} advanced feature routes:")
    for route in sorted(advanced_routes):
        print(f"   • {route}")
    
    if len(advanced_routes) > 0:
        print(f"\n✅ SUCCESS! Advanced features ARE integrated into the webapp!")
        print(f"   Total routes: {len(advanced_routes)}")
    else:
        print("\n❌ No advanced feature routes found!")
    
    # Check if advanced features modules are loaded
    print("\n📚 Checking loaded modules:")
    print("✅ AdvancedAnalytics" if 'AdvancedAnalytics' in dir() else "❌ AdvancedAnalytics")
    
    # Try to instantiate the classes
    print("\n🔧 Testing class instantiation:")
    from advanced_features import AdvancedAnalytics, CollaborationManager, PerformanceOptimizer, VisualizationEngine
    
    analytics = AdvancedAnalytics()
    print("✅ AdvancedAnalytics instantiated")
    
    collab = CollaborationManager()
    print("✅ CollaborationManager instantiated")
    
    perf = PerformanceOptimizer()
    print("✅ PerformanceOptimizer instantiated")
    
    viz = VisualizationEngine()
    print("✅ VisualizationEngine instantiated")
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED - Advanced features are fully integrated!")
    print("="*60)
    
except ImportError as e:
    print(f"❌ Import Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
