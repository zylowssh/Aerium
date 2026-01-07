# 🚀 Quick Start Guide - New Features

## What's New?

4 major features have been added to Morpheus. Here's how to access them:

---

## 1. 📊 Improved Dashboard

**Access:** Go to `/` (home page) after logging in

**What you'll see:**
- Beautiful modern dashboard with smooth animations
- For Admins: User statistics, user management, system overview
- For Users: Personal CO2 stats, quick actions, account info

**Features:**
- ✨ Modern design with gradients
- 📱 Fully responsive (mobile, tablet, desktop)
- 🎯 Quick action buttons to other features
- 📊 Color-coded statistics

---

## 2. 📥 Advanced Data Export

**Access:** 📊 Dados menu → **Export Avancé** OR `/data-export`

**4 Export Options:**

### A. Instant Export 🚀
- Download your data right now
- Choose format: CSV, JSON, Excel, or PDF
- Optional date range filter

### B. Scheduled Exports 📅
- Set up automatic exports (daily/weekly/monthly)
- Optional email delivery
- View all your scheduled exports
- Enable/disable anytime

### C. Custom Report 🔧
- Advanced filtering:
  - Date range
  - CO₂ thresholds
  - Data aggregation (hourly/daily/weekly)
  - Sensor selection
- Multiple format output

### D. History 📋
- View all past exports
- File sizes and dates
- Re-download if needed

---

## 3. 🔒 GDPR Compliance

### For Users: My Data Rights

**Access:** 📈 Dados → **Mes Données (GDPR)** OR `/gdpr/profile`

**Available Actions:**

1. **📥 Download My Data**
   - Get ALL your personal data
   - Formats: JSON (structured) + CSV (readings)
   - Packaged as convenient ZIP file
   - Includes: Profile, readings, settings, login history, consents

2. **✅ Manage Consents**
   - Control: Email notifications
   - Control: Analytics usage
   - Control: Team data sharing
   - Changes saved immediately

3. **🗑️ Request Account Deletion**
   - Permanently delete your account
   - 30-day grace period (can cancel anytime)
   - All data securely removed
   - Confirmation via email

### For Admins: GDPR Management

**Access:** 🔒 **GDPR & Conformité** (admin menu) OR `/gdpr/admin`

**Admin Controls:**

1. **👁️ Monitor Deletion Requests**
   - View all pending deletions
   - See scheduled deletion dates
   - Process deletions immediately
   - View deletion reasons

2. **⏱️ Configure Retention Policies**
   - Set how long different data types are kept:
     - CO₂ Readings: Default 365 days
     - Login History: Default 90 days (auto-delete)
     - Export Files: Default 30 days (auto-delete)
   - Enable automatic cleanup
   - Custom retention per data type

3. **🧹 Manual Cleanup**
   - Run data cleanup manually
   - See how much data was cleaned
   - Respects all retention policies

---

## 4. 📖 REST API v2

### Access API Documentation

**Visit:** 📖 **Documentation API** OR `/api/v2/docs`

**What you'll see:**
- Interactive Swagger UI
- All available endpoints listed
- Try endpoints directly in browser
- See request/response examples
- Authentication instructions

### Available Endpoints

| What | URL | Method |
|------|-----|--------|
| **API Docs** | `/api/v2/docs` | GET |
| **OpenAPI Spec** | `/api/v2/docs/openapi.json` | GET |
| **CO₂ Readings** | `/api/v2/readings` | GET |
| **My Profile** | `/api/v2/profile` | GET/PUT |
| **Statistics** | `/api/v2/stats` | GET |
| **Export Data** | `/api/v2/export` | POST |
| **My Sensors** | `/api/v2/sensors` | GET |
| **Sensor Data** | `/api/v2/sensors/<id>/readings` | GET |
| **Health Check** | `/api/v2/health` | GET |

### Using the API

**Authentication:**
```
Add Header: Authorization: Bearer YOUR_API_KEY
```

**Example Response:**
```json
{
  "data": [
    {
      "timestamp": "2024-01-15 14:30:00",
      "ppm": 450,
      "temperature": 22.5,
      "humidity": 45,
      "sensor_id": "sensor1"
    }
  ],
  "total": 1000,
  "limit": 100,
  "offset": 0
}
```

---

## 🗂️ File Locations

| Feature | Main Files |
|---------|-----------|
| **Dashboard** | `templates/dashboard.html` |
| **Data Export** | `blueprints/data_export.py`, `templates/data-export/export.html` |
| **GDPR** | `blueprints/gdpr.py`, `templates/gdpr/` |
| **API** | `blueprints/api.py`, `templates/api/swagger.html` |

---

## 🔑 Quick Links

- 🏠 **Dashboard**: `/`
- 📥 **Advanced Export**: `/data-export`
- 🔒 **My Data (GDPR)**: `/gdpr/profile`
- 👨‍💼 **GDPR Admin**: `/gdpr/admin`
- 📖 **API Docs**: `/api/v2/docs`

---

## ❓ FAQ

**Q: How long until my export is ready?**
A: Instant exports are instant. Scheduled exports run at the configured time.

**Q: What happens if I request deletion?**
A: You have 30 days to cancel. After that, everything is permanently deleted.

**Q: Can I change my consents?**
A: Yes! Toggle anytime from the GDPR dashboard.

**Q: How do I use the API?**
A: Visit `/api/v2/docs` to see interactive documentation and try endpoints.

**Q: Are my exports secure?**
A: Yes! They only contain YOUR data and are downloaded directly to you.

**Q: What formats are supported?**
A: CSV (spreadsheet), JSON (data), Excel (professional), PDF (printable)

---

## 📞 Need Help?

- Check the documentation at `/api/v2/docs`
- Read `NEW_FEATURES_DOCUMENTATION.md` for detailed info
- Visit `/gdpr/profile` for data rights information
- Contact admin for account/policy questions

---

**Enjoy the new features!** 🎉
