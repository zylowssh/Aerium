# Project Structure Overview

## Final Organized Structure

```
Aerium/
│
├── 📁 site/                          # Flask Application (Core)
│   ├── app.py                        # Main Flask app
│   ├── database.py                   # Database config
│   ├── advanced_features.py          # Advanced features
│   ├── advanced_features_routes.py   # API routes
│   ├── advanced_api_routes.py        # Additional API routes
│   │
│   ├── 📁 utils/                     # Utility modules
│   │   ├── __init__.py
│   │   ├── fake_co2.py               # CO2 data generator
│   │   ├── admin_tools.py            # Admin utilities
│   │   ├── collaboration.py          # Collaboration features
│   │   ├── export_manager.py         # Export functionality
│   │   ├── optimization.py           # Optimization tools
│   │   ├── performance_optimizer.py  # Performance tools
│   │   ├── ai_recommender.py         # AI recommendations
│   │   ├── ml_analytics.py           # ML analytics
│   │   └── tenant_manager.py         # Tenant management
│   │
│   ├── 📁 scripts/                   # Admin & setup scripts
│   │   ├── check_admin.py
│   │   ├── check_db.py
│   │   ├── debug_admin.py
│   │   ├── fix_admin_access.py
│   │   ├── setup_admin_perms.py
│   │   ├── setup_advanced_features_db.py
│   │   ├── promote_admin.py
│   │   └── update_db.py
│   │
│   ├── 📁 tests/                     # Application tests
│   │   ├── test_auth.py
│   │   ├── test_data_websocket.py
│   │   ├── test_login_flow.py
│   │   └── ...
│   │
│   ├── 📁 docs/                      # Documentation
│   │   ├── INTEGRATION_GUIDE.py
│   │   ├── QUICKSTART_INTEGRATION.py
│   │   └── OPTIMIZATION_LOG.md
│   │
│   ├── 📁 templates/                 # HTML templates
│   ├── 📁 static/                    # CSS, JS, images
│   └── 📁 data/                      # Runtime data
│
├── 📁 tests/                         # Root-level tests
│   ├── test_advanced_endpoints.py
│   ├── test_api_endpoints.py
│   ├── test_pages.py
│   ├── test_sensor_api.py
│   ├── test_sensor_endpoints.py
│   ├── test_thresholds.py
│   ├── test_webapp_integration.py
│   ├── quick_test.py
│   ├── check_db_schema.py
│   ├── verify_db.py
│   ├── verify_features.py
│   └── verify_integration.py
│
├── 📁 docs/                          # Project documentation
│   ├── ARCHITECTURE_DIAGRAM.py
│   └── ...
│
├── 📁 app/                           # Legacy app folder
├── 📁 venv/                          # Python virtual environment
├── 📁 data/                          # Project data
├── 📁 .git/                          # Git repository
│
├── 📄 Configuration & Docs
│   ├── README.md                     # Main documentation
│   ├── requirements.txt              # Python dependencies
│   ├── .gitignore                    # Git ignore rules
│   ├── start_server.bat              # Server startup script
│   └── app_output.txt                # Output log
│
└── 📄 Documentation Files
    ├── API_REFERENCE.md              # API documentation
    ├── CHANGELOG.md                  # Change history
    ├── DOCUMENTATION_INDEX.md        # Documentation index
    ├── FIXES_COMPLETE.md             # Fix documentation
    ├── IMPLEMENTATION_CHECKLIST.md   # Implementation tracking
    ├── PROJECT_COMPLETION_SUMMARY.md # Summary
    ├── QUICK_SUMMARY.md              # Quick reference
    └── USER_GUIDE.md                 # User guide
```

## Organization Benefits

✅ **Clean Root**: Only documentation and config files  
✅ **Organized Utils**: All utility modules in `site/utils/`  
✅ **Centralized Tests**: All tests in dedicated `tests/` directory  
✅ **Admin Scripts**: Setup/maintenance scripts in `site/scripts/`  
✅ **Easy Navigation**: Clear separation of concerns  
✅ **Maintainable**: Simpler to find and update code  

## File Count Summary

- **Root**: 13 files (config + documentation)
- **site/**: 7 core files + organized subdirectories
- **site/utils/**: 9 utility modules
- **site/scripts/**: 9 admin scripts
- **site/tests/**: 7 test files
- **tests/ (root)**: 13 test files
- **docs/**: 3 documentation files

**Total Reduction**: From 40+ scattered files → Organized structure
