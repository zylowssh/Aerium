# Quick Start Guide - Refinements Testing

## Start the Server

```bash
cd site
python app.py
```

Server will start on `http://localhost:5000`

---

## Test 1: CSV Import on Visualization Page

### Setup
1. Log in with credentials:
   - Username: `admin` (or any user)
   - Password: (whatever password you set)

2. Navigate to: `http://localhost:5000/visualization`

### What to Look For
You should see:
- 4 chart tabs at the top (Daily, Comparison, Heatmap, Hourly)
- Below the charts: **CSV Import Section** with:
  - 📥 Importer des Données (Import CO₂ Data) heading
  - File input field (accepts .csv files)
  - ⬆️ Charger le fichier (Upload File) button
  - Result display area (hidden until upload)

### Test CSV Upload
1. Create a test CSV file with this format:
```csv
timestamp,ppm
2024-01-01 10:00:00,750
2024-01-01 11:00:00,780
2024-01-01 12:00:00,820
```

2. Click the file input and select your test CSV
3. Click "⬆️ Charger le fichier" button
4. You should see:
   - ✅ Succès! (Success message)
   - Import statistics (number of readings imported)
   - Charts automatically refresh with new data

### Expected Response
```
✅ Succès!

Lectures importées: 3
Lignes ignorées: 0
Erreurs: 0
```

---

## Test 2: Analytics Page Removed

### What to Verify
1. Navigate to: `http://localhost:5000/analytics`
   - Should return: **404 Not Found**

2. Check Navigation:
   - Top menu: NO "🔎 Analytique" link
   - Hamburger menu (☰): NO "🔎 Analytique" link
   - Only these menu items should appear:
     - 🏠 Accueil (Home)
     - 📊 En direct (Live)
     - ⚙️ Paramètres (Settings)
     - 📈 Visualisations (Visualizations)
     - 📖 Guide (Guide)

3. Browser Console (F12):
   - Should NOT see 404 error for `analytics.js`
   - All other scripts should load normally

---

## Test 3: Admin Dashboard Access

### Setup
1. Log in as admin:
   - Username: `admin`
   - Password: (admin password)

2. Navigate to: `http://localhost:5000/admin`

### What to See
You should see the **Admin Dashboard** with:

1. **Statistics Panel**
   - Total users
   - Readings last 24h
   - Average CO₂

2. **User Management Table**
   - List of all users
   - Username, Email, Role, Created Date
   - Verified status
   - Buttons to:
     - Promote/Demote to admin
     - Delete user
     - View permissions

3. **Audit Log**
   - Last 20 admin actions
   - Who did what, when, from where

4. **Database Information**
   - Total readings
   - Database file size
   - Last cleanup date

### If Access Denied (403)
Run diagnostic:
```bash
cd site
python check_admin.py
```

If admin role is missing, promote the user:
```bash
python check_admin.py promote admin
```

---

## Test 4: Non-Admin User CSV Import

### Setup
1. Create/log in with a regular user account (not admin)
2. Navigate to: `http://localhost:5000/visualization`

### Expected Behavior
- Regular user SHOULD see the CSV import section
- Regular user CAN upload CSV files
- Regular user CANNOT access `/admin` (should get 403 error)

This verifies that CSV import is now open to all users, not just admins.

---

## Verification Script

Run automated verification:
```bash
cd site
python verify_quick.py
```

Output:
```
✓ CSV import route uses @login_required (not @admin_required)
✓ No /analytics route in app.py
✓ No /analytics links in base.html
✓ analytics.js script not imported
✓ CSV import section found in visualization.html
✓ Visualization route found
```

---

## Admin Management

### Check Admin Status
```bash
python check_admin.py
```

Shows:
- All users in database
- Current admin users
- User roles and verification status

### Promote a User to Admin
```bash
python check_admin.py promote <username>
```

Example:
```bash
python check_admin.py promote john_doe
```

### Remove Admin Privileges
Use the web interface:
1. Go to `/admin` dashboard
2. Find user in the User Management table
3. Click "Demote" button (if they're admin)
4. OR use admin API:

```bash
# Via curl
curl -X POST \
  -H "Cookie: session=YOUR_SESSION" \
  http://localhost:5000/admin/user/2/role/user
```

---

## Common Issues & Solutions

### Issue: CSV import section not showing
**Solution:**
1. Hard refresh browser: `Ctrl+F5`
2. Check template is updated: `cat site/templates/visualization.html | grep csv_import`
3. Restart Flask server

### Issue: CSV upload returns error
**Solution:**
1. Check file format: Must be CSV with `timestamp` and `ppm` columns
2. Check file is actually uploaded: Network tab in DevTools
3. Check permissions: Must be logged in
4. Check rate limit: Max 5 imports per minute

### Issue: Admin can't access `/admin`
**Solution:**
1. Verify admin role: `python check_admin.py`
2. Promote if needed: `python check_admin.py promote admin`
3. Clear session: Log out and log back in
4. Clear browser cache: `Ctrl+F5`

### Issue: Analytics link still appearing
**Solution:**
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Hard refresh: `Ctrl+F5`
3. Check file was updated: `grep analytics site/templates/base.html`
4. Restart Flask server

---

## API Endpoints

### CSV Import
```
POST /api/import/csv
Headers:
  - Content-Type: multipart/form-data
Auth: @login_required (any logged-in user)
Rate Limit: 5 per minute

Request:
  - file: (CSV file)

Response:
  {
    "success": true,
    "imported": 150,
    "skipped": 2,
    "errors": 0,
    "message": "Import completed"
  }
```

### Admin Dashboard
```
GET /admin
Auth: @admin_required (admin users only)

Response: HTML page with admin interface
Status Codes:
  - 200: OK (admin user)
  - 403: Forbidden (not admin)
  - 302: Redirect to login (not logged in)
```

---

## Files for Reference

- **CSV Upload Function:** [site/templates/visualization.html](../site/templates/visualization.html)
- **API Route:** [site/app.py](../site/app.py) (search for `/api/import/csv`)
- **Admin Dashboard:** [site/templates/admin.html](../site/templates/admin.html)
- **Decorators:** [site/app.py](../site/app.py) (search for `def admin_required`)

---

## Success Criteria Checklist

- [ ] CSV import section visible on visualization page
- [ ] CSV import works for logged-in users
- [ ] CSV import fails gracefully with error messages
- [ ] Analytics page returns 404
- [ ] Analytics links removed from navigation
- [ ] Admin can access `/admin` dashboard
- [ ] Regular users get 403 on `/admin`
- [ ] All charts still work on visualization page
- [ ] No console errors on any page
- [ ] Rate limiting works (try uploading 6+ times in a minute)

---

## Next Steps

If all tests pass, the refinements are ready for production deployment!

For questions or issues:
1. Check browser console for JavaScript errors
2. Check Flask server logs for Python errors
3. Run diagnostic scripts: `verify_quick.py`, `check_admin.py`
4. Review [REFINEMENTS_COMPLETE.md](../REFINEMENTS_COMPLETE.md) for detailed info
