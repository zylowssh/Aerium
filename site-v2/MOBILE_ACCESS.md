# 📱 Mobile Access Guide

## Quick Setup for Mobile Testing

### 1️⃣ Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig | Select-String "IPv4"
```

**macOS/Linux:**
```bash
ifconfig | grep "inet "
```

Your **main IP** is likely: `172.20.10.4`

---

### 2️⃣ Start Backend (Already configured for 0.0.0.0)

```powershell
cd site-v2\backend
python app.py
```

✅ The backend now accepts connections from any device on your network.

---

### 3️⃣ Start Frontend with Network Access

**Option A: Use Vite's --host flag**
```powershell
cd site-v2
npm run dev -- --host
```

**Option B: Update package.json** (Recommended)
Add to `site-v2/package.json`:
```json
{
  "scripts": {
    "dev": "vite --host",
    "dev:mobile": "vite --host 0.0.0.0"
  }
}
```

Then run:
```powershell
npm run dev
```

---

### 4️⃣ Update Environment for Mobile

**Copy the mobile config:**
```powershell
cd site-v2
Copy-Item .env.mobile .env
```

**Or manually update `.env`:**
```env
VITE_API_URL=http://172.20.10.4:5000/api
```

---

### 5️⃣ Access from Mobile

**On your phone/tablet:**
1. Connect to the **same WiFi network** as your computer
2. Open browser and go to:
   ```
   http://172.20.10.4:5173
   ```

**Troubleshooting URLs to try:**
- `http://172.20.10.4:5173` (Main IP)
- `http://192.168.127.1:5173` (Alternative)
- `http://192.168.42.1:5173` (Alternative)

---

### 🔧 Firewall Configuration

**If you can't connect, allow the ports through Windows Firewall:**

```powershell
# Allow Vite dev server (port 5173)
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Allow Flask backend (port 5000)
New-NetFirewallRule -DisplayName "Flask Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

---

### 🐛 Common Issues

**Issue: "Cannot connect" / "ERR_CONNECTION_REFUSED"**
- ✅ Check both computer and mobile are on same WiFi
- ✅ Try `http://172.20.10.4:5173` instead of `localhost`
- ✅ Check Windows Firewall (see above)
- ✅ Restart backend with `python app.py`

**Issue: "CORS error"**
- ✅ CORS is now set to `*` (allow all) for development
- ✅ Backend logs should show your IP: `[CORS] Local IP detected: 172.20.10.4`

**Issue: Login doesn't work**
- ✅ Check browser console (inspect on mobile or use Chrome DevTools)
- ✅ Verify API URL in `.env` matches your computer's IP
- ✅ Check backend terminal shows incoming requests

---

### 📊 Verify Setup

**1. Check backend is accessible:**
```
http://172.20.10.4:5000/api/health
```
Should return: `{"status": "healthy"}`

**2. Check frontend loads:**
```
http://172.20.10.4:5173
```
Should show login page

**3. Test login:**
- Username: `admin@aerium.app`
- Password: `admin123`

---

### 🔒 Security Note

**For production:** Change CORS back to specific origins in `app.py`:
```python
origins=allowed_origins,  # Instead of '*'
```

The current `origins=['*']` setting is **only for development/testing**.
