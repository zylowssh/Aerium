# UX Enhancements Testing Guide

## Quick Test Checklist

### 1. Keyboard Shortcuts
**Test Steps:**
1. Open any page in the application
2. Press `?` key → Help modal should appear with all shortcuts
3. Press `/` key → Search input should focus
4. Press `h` → Should navigate to home page
5. Press `d` → Should navigate to dashboard
6. Press `Esc` → Should close any open modals

**Expected Behavior:**
- ✓ Help modal displays with keyboard shortcuts list
- ✓ Search focuses without typing `/` character
- ✓ Navigation shortcuts work from any page
- ✓ ESC closes modals

---

### 2. Tooltips
**Test Steps:**
1. Hover over the search input (shows "Appuyez sur / ou Ctrl+K")
2. Hover over theme toggle button
3. Hover over connection status indicator
4. Hover over user profile icon
5. Check tooltip positioning near screen edges

**Expected Behavior:**
- ✓ Tooltips appear above elements after brief delay
- ✓ Tooltips disappear when mouse moves away
- ✓ Tooltips reposition if near viewport edge
- ✓ Touch devices: tap to show, tap again to hide

---

### 3. Global Search
**Test Steps:**
1. Click search input or press `/` or `Ctrl+K`
2. Type "dashboard" → Should show dashboard page result
3. Type "capteur" → Should show sensors page
4. Type "co2" → Should show help topics
5. Use arrow keys to navigate results
6. Press Enter to open selected result
7. Type invalid query → Should show "Aucun résultat"

**Expected Behavior:**
- ✓ Results appear after 300ms delay (debouncing)
- ✓ Results grouped by category (Pages, Capteurs, Aide)
- ✓ Icons display for each result type
- ✓ Keyboard navigation highlights results
- ✓ Enter opens selected/first result
- ✓ Clicking result navigates to page
- ✓ ESC closes dropdown

**Test Queries:**
- "dashboard" → Should find Tableau de bord
- "live" → Should find Surveillance en direct
- "export" → Should find Export page and help
- "ppm" → Should find help topic
- "seuil" → Should find threshold settings

---

### 4. Form Validation (Register Page)
**Test Steps:**
1. Navigate to `/register`
2. **Username field:**
   - Type "ab" → Should show error (too short)
   - Type "abc" → Should show ✓ (valid)
3. **Email field:**
   - Type "invalid" → Should show error
   - Type "test@example.com" → Should show ✓
4. **Password field:**
   - Type "123" → Strength: "Très faible" (red)
   - Type "password" → Strength: "Faible" (orange)
   - Type "Password1" → Strength: "Moyen" (yellow)
   - Type "Password1!" → Strength: "Bon" (light green)
   - Type "P@ssw0rd123!" → Strength: "Très fort" (green)
5. **Confirm password:**
   - Type different password → Should show ✗
   - Type same password → Should show ✓

**Expected Behavior:**
- ✓ Real-time validation as user types
- ✓ Visual feedback (colors, icons)
- ✓ Password strength indicator shows level and color
- ✓ Progress bar updates with strength
- ✓ Confirmation field validates match

---

### 5. Drag-and-Drop CSV Import
**Test Steps:**
1. Navigate to `/visualizations`
2. Click "Données Importées" button
3. **Drag test:**
   - Drag a CSV file over the drop zone
   - Zone should highlight (blue border)
   - Drop file → Upload should start
4. **Browse test:**
   - Click "Parcourir les fichiers" button
   - Select CSV file from file dialog
   - Upload should start
5. **Validation tests:**
   - Try to upload .txt file → Should reject
   - Try to upload 100MB file → Should reject (>50MB)
6. **Progress tracking:**
   - Upload should show progress bar
   - Percentage should update
   - Success message should appear
   - Charts should refresh

**Expected Behavior:**
- ✓ Drop zone appears when "Données Importées" selected
- ✓ Visual feedback on drag-over (border highlight, scale)
- ✓ File validation before upload
- ✓ Progress bar updates during upload
- ✓ Success/error messages display
- ✓ Auto-hide messages after 5 seconds
- ✓ Charts refresh after successful import

---

### 6. Enhanced Onboarding
**Test Steps:**
1. Navigate to `/onboarding`
2. Check progress tracker at top
3. Click "Commencer" on step 1
4. Observe step indicators:
   - Completed steps should be green
   - Current step should be blue and scaled
   - Future steps should be gray
5. Progress through all 5 steps
6. Test "Ignorer la visite" button
7. Complete onboarding

**Expected Behavior:**
- ✓ Progress bar fills as steps advance
- ✓ Step indicators show visual status
- ✓ Current step is highlighted and enlarged
- ✓ Smooth animations between steps
- ✓ Skip shows confirmation dialog
- ✓ Completion redirects to dashboard

---

## Browser Testing Matrix

### Desktop Browsers:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

### Mobile Browsers:
- [ ] Chrome Mobile (Android)
- [ ] Safari (iOS)

### Keyboard Shortcuts (Desktop Only):
- [ ] All shortcuts work in Chrome
- [ ] All shortcuts work in Firefox
- [ ] All shortcuts work in Safari

### Touch Events (Mobile Only):
- [ ] Tooltips work on tap
- [ ] Drag-drop works (if browser supports)
- [ ] Search works on mobile
- [ ] Form validation works on mobile

---

## Performance Testing

### Load Time:
1. Open DevTools → Network tab
2. Refresh page
3. Check JavaScript file sizes:
   - keyboard-shortcuts.js: ~8KB
   - tooltips.js: ~4KB
   - form-validation.js: ~7KB
   - global-search.js: ~9KB
   - csv-dragdrop.js: ~8KB
   - **Total**: ~36KB (minimal)

### Runtime Performance:
1. Open DevTools → Performance tab
2. Record interaction with each feature
3. Verify no memory leaks
4. Check frame rate stays 60fps

---

## Accessibility Testing

### Keyboard Navigation:
- [ ] All shortcuts work without mouse
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] ESC closes modals properly

### Screen Reader:
- [ ] ARIA labels are present
- [ ] Tooltips are announced
- [ ] Form errors are announced
- [ ] Success messages are announced

---

## Error Scenarios

### Network Errors:
1. **Search with network down:**
   - Disable network
   - Try to search
   - Should handle gracefully (no crash)

2. **CSV upload with network down:**
   - Start upload
   - Disable network during upload
   - Should show error message

### Invalid Inputs:
1. **Form validation:**
   - Empty fields → Should show required errors
   - Invalid email → Should show format error
   - Short password → Should show strength warning

2. **File upload:**
   - Wrong file type → Should reject with message
   - Too large file → Should reject with message

---

## Integration Testing

### After Full System Test:
1. Login → Dashboard → Test shortcuts
2. Search → Navigate to result → Test feature
3. Register → Fill form with validation → Submit
4. Upload CSV → View in visualization → Verify data
5. Complete onboarding → Check features work

---

## Known Issues / Limitations

### Keyboard Shortcuts:
- Non-US keyboard layouts may have different key mappings
- Some shortcuts may conflict with browser shortcuts
- Solution: Press `?` to see available shortcuts

### Drag-and-Drop:
- Mobile browsers have limited drag-drop support
- Solution: "Parcourir" button works on all devices

### Tooltips:
- May be clipped if near screen edge
- Solution: Auto-repositioning implemented

---

## Regression Testing

After any code changes, retest:
1. [ ] All keyboard shortcuts still work
2. [ ] Search still returns correct results
3. [ ] Form validation still provides feedback
4. [ ] CSV upload still processes files
5. [ ] Onboarding still tracks progress
6. [ ] No JavaScript console errors

---

## Success Criteria

✅ **Feature is working if:**
- All test steps pass without errors
- No console errors appear
- Performance is smooth (60fps)
- Works across all supported browsers
- Accessible via keyboard
- Mobile-friendly
- Error messages are clear and helpful

---

## Reporting Issues

When reporting issues, include:
1. Browser and version
2. Device type (desktop/mobile)
3. Steps to reproduce
4. Expected behavior
5. Actual behavior
6. Console errors (if any)
7. Screenshots (if visual issue)

---

**Testing Status**: Ready for QA
**Last Updated**: Today
**Tested By**: Awaiting testing
