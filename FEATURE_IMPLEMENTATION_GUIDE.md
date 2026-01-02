# Implementation Guide: Remaining Phase 4 Features

## Feature 4: PDF Export with Donut Chart

### Overview
Enhance the daily PDF report to include a visual donut chart showing the breakdown of exposure time by CO₂ level category (Good/Medium/Bad).

### Files to Modify
1. `site/app.py` - Add donut chart SVG generation
2. `site/templates/report_daily.html` - Embed the donut chart

### Implementation Steps

#### Step 1: Add SVG Donut Generator to app.py

Add this function to `site/app.py` after the imports:

```python
def generate_donut_svg(good_pct, medium_pct, bad_pct, width=200, height=200):
    """Generate SVG donut chart for CO2 exposure breakdown"""
    import math
    
    radius = 70
    cx, cy = width / 2, height / 2
    
    # Calculate angles for each segment
    angles = [
        good_pct * 3.6,      # Convert percentage to degrees
        medium_pct * 3.6,
        bad_pct * 3.6
    ]
    
    # Colors matching CSS tokens
    colors = ['#4ade80', '#facc15', '#f87171']  # green, yellow, red
    labels = ['Bon', 'Moyen', 'Mauvais']
    values = [good_pct, medium_pct, bad_pct]
    
    # Start with SVG header
    svg = f'''<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
    <style>
        .donut-label {{ font-size: 11px; font-weight: bold; text-anchor: middle; }}
        .donut-percent {{ font-size: 10px; text-anchor: middle; }}
    </style>'''
    
    # Add donut segments
    current_angle = -90  # Start at top
    
    for i, (angle, color, label, value) in enumerate(zip(angles, colors, labels, values)):
        if value == 0:
            continue
            
        # Convert to radians for arc calculation
        start_rad = math.radians(current_angle)
        end_rad = math.radians(current_angle + angle)
        
        # Calculate path points for donut
        x1 = cx + radius * math.cos(start_rad)
        y1 = cy + radius * math.sin(start_rad)
        x2 = cx + radius * math.cos(end_rad)
        y2 = cy + radius * math.sin(end_rad)
        
        large_arc = 1 if angle > 180 else 0
        
        # Donut path (hollow circle)
        inner_radius = 45
        x3 = cx + inner_radius * math.cos(end_rad)
        y3 = cy + inner_radius * math.sin(end_rad)
        x4 = cx + inner_radius * math.cos(start_rad)
        y4 = cy + inner_radius * math.sin(start_rad)
        
        path = f'''M {x1} {y1} A {radius} {radius} 0 {large_arc} 1 {x2} {y2} 
                   L {x3} {y3} A {inner_radius} {inner_radius} 0 {large_arc} 0 {x4} {y4} Z'''
        
        svg += f'\n    <path d="{path}" fill="{color}" stroke="white" stroke-width="2"/>'
        
        # Add label at mid-angle
        label_angle = math.radians(current_angle + angle / 2)
        label_radius = (radius + inner_radius) / 2
        label_x = cx + label_radius * math.cos(label_angle)
        label_y = cy + label_radius * math.sin(label_angle)
        
        svg += f'\n    <text x="{label_x}" y="{label_y + 3}" class="donut-percent" fill="white">{int(value)}%</text>'
        
        current_angle += angle
    
    # Add legend
    legend_y = height - 30
    for i, (color, label, value) in enumerate(zip(colors, labels, values)):
        legend_x = 10 + i * 60
        svg += f'''
    <rect x="{legend_x}" y="{legend_y}" width="12" height="12" fill="{color}" stroke="white" stroke-width="1"/>
    <text x="{legend_x + 18}" y="{legend_y + 10}" style="font-size: 9px; fill: #666;">{label}</text>'''
    
    svg += '\n</svg>'
    return svg
```

#### Step 2: Modify `/api/report/daily/pdf` endpoint

Find the `@app.route('/api/report/daily/pdf')` endpoint and modify it to generate the donut chart:

```python
@app.route('/api/report/daily/pdf', methods=['POST'])
def generate_daily_pdf():
    from weasyprint import HTML, CSS
    
    data = request.json or {}
    report_date = data.get('date', datetime.now().date().isoformat())
    
    db = get_db()
    
    # Fetch data for the day
    rows = db.execute(
        'SELECT ppm FROM co2_readings WHERE DATE(timestamp) = ? ORDER BY timestamp',
        (report_date,)
    ).fetchall()
    
    if not rows:
        return {'error': 'No data for this date'}, 404
    
    ppms = [r[0] for r in rows]
    
    # Get current thresholds
    settings = {}
    for key in ['good_threshold', 'bad_threshold']:
        row = db.execute('SELECT value FROM settings WHERE key = ?', (key,)).fetchone()
        settings[key] = int(row[0]) if row else (800 if key == 'good_threshold' else 1200)
    
    good_threshold = settings['good_threshold']
    bad_threshold = settings['bad_threshold']
    
    # Calculate exposure percentages
    good_count = sum(1 for p in ppms if p <= good_threshold)
    bad_count = sum(1 for p in ppms if p >= bad_threshold)
    medium_count = len(ppms) - good_count - bad_count
    
    total = len(ppms)
    good_pct = int((good_count / total) * 100) if total > 0 else 0
    bad_pct = int((bad_count / total) * 100) if total > 0 else 0
    medium_pct = 100 - good_pct - bad_pct
    
    # Generate donut SVG
    donut_svg = generate_donut_svg(good_pct, medium_pct, bad_pct)
    
    # Render HTML template with chart
    html_content = render_template(
        'report_daily.html',
        date=report_date,
        avg_ppm=int(sum(ppms) / len(ppms)) if ppms else 0,
        min_ppm=min(ppms) if ppms else 0,
        max_ppm=max(ppms) if ppms else 0,
        good_minutes=good_count,
        medium_minutes=medium_count,
        bad_minutes=bad_count,
        donut_chart=donut_svg  # Pass SVG to template
    )
    
    # Generate PDF
    pdf = HTML(string=html_content).write_pdf()
    
    return pdf, 200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': f'attachment; filename="report_{report_date}.pdf"'
    }
```

#### Step 3: Update `report_daily.html` template

Add this to the template where you want the donut chart to appear:

```html
<div class="chart-section">
    <h3>Répartition de l'exposition</h3>
    {{ donut_chart | safe }}
</div>
```

### Testing the PDF Feature

1. Navigate to Analytics page
2. Select a date range with data
3. Click "Télécharger PDF"
4. Verify the PDF includes the donut chart showing exposure breakdown

---

## Feature 8: Advanced Analytics - Heatmap

### Overview
Create a heatmap visualization showing hour-of-day (0-23) vs day-of-week patterns with color intensity representing average CO₂ levels.

### Files to Modify
1. `site/app.py` - Add `/api/analytics/heatmap` endpoint
2. `site/static/js/analytics.js` - Add heatmap rendering
3. `site/templates/analytics.html` - Add heatmap container

### Implementation Steps

#### Step 1: Add Heatmap Endpoint to app.py

Add this endpoint to `site/app.py`:

```python
@app.route('/api/analytics/heatmap', methods=['GET'])
def get_heatmap_data():
    """Get hourly CO2 data grouped by hour-of-day and day-of-week"""
    from datetime import datetime, timedelta
    from dateutil.parser import parse as parse_date
    
    from_date = request.args.get('from', (datetime.now() - timedelta(days=7)).date().isoformat())
    to_date = request.args.get('to', datetime.now().date().isoformat())
    
    db = get_db()
    
    # Fetch all data in range
    rows = db.execute('''
        SELECT 
            CAST(strftime('%H', timestamp) AS INTEGER) as hour,
            CAST(strftime('%w', timestamp) AS INTEGER) as day_of_week,
            ppm
        FROM co2_readings
        WHERE DATE(timestamp) BETWEEN ? AND ?
        ORDER BY timestamp
    ''', (from_date, to_date)).fetchall()
    
    if not rows:
        return {'error': 'No data for selected range'}, 404
    
    # Initialize 24x7 matrix (hours x days)
    heatmap = {}
    counts = {}
    
    for hour, dow, ppm in rows:
        key = f'{hour}_{dow}'
        if key not in heatmap:
            heatmap[key] = 0
            counts[key] = 0
        heatmap[key] += ppm
        counts[key] += 1
    
    # Calculate averages
    for key in heatmap:
        heatmap[key] = int(heatmap[key] / counts[key])
    
    # Format for frontend (row = hour, col = day)
    matrix = []
    for hour in range(24):
        row = []
        for dow in range(7):
            key = f'{hour}_{dow}'
            row.append(heatmap.get(key, None))
        matrix.append(row)
    
    return {
        'matrix': matrix,
        'hours': list(range(24)),
        'days': ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
        'min': min(v for v in heatmap.values() if v is not None) if heatmap else 0,
        'max': max(v for v in heatmap.values() if v is not None) if heatmap else 2000,
        'good_threshold': get_setting('good_threshold', 800),
        'bad_threshold': get_setting('bad_threshold', 1200)
    }
```

#### Step 2: Add Heatmap Rendering to analytics.js

Add this to `site/static/js/analytics.js` within the main initialization:

```javascript
// Heatmap visualization
const heatmapBtn = document.getElementById('heatmap-btn');
const heatmapContainer = document.getElementById('heatmap-container');

if (heatmapBtn && heatmapContainer) {
  heatmapBtn.addEventListener('click', async () => {
    const from = document.getElementById('range-from').value || 
                 new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
    const to = document.getElementById('range-to').value || 
               new Date().toISOString().split('T')[0];
    
    try {
      const res = await fetch(`/api/analytics/heatmap?from=${from}&to=${to}`);
      const data = await res.json();
      
      if (data.error) {
        heatmapContainer.innerHTML = '<p style="color: var(--muted);">❌ ' + data.error + '</p>';
        return;
      }
      
      renderHeatmap(data);
    } catch (e) {
      console.error('Heatmap error:', e);
      heatmapContainer.innerHTML = '<p style="color: var(--bad);">Erreur: ' + e.message + '</p>';
    }
  });
}

function renderHeatmap(data) {
  const { matrix, hours, days, min, max, good_threshold, bad_threshold } = data;
  
  // Helper function to get color for PPM value
  function getColor(ppm) {
    if (ppm === null) return '#333';
    if (ppm <= good_threshold) return '#4ade80';     // Green
    if (ppm < bad_threshold) return '#facc15';       // Yellow
    return '#f87171';                                 // Red
  }
  
  // Build HTML table
  let html = '<table class="heatmap-table" style="border-collapse: collapse; margin: 20px 0;">';
  
  // Header row
  html += '<tr><td></td>';
  days.forEach(day => {
    html += `<th style="padding: 10px; text-align: center; color: var(--muted);">${day}</th>`;
  });
  html += '</tr>';
  
  // Data rows
  hours.forEach((hour, i) => {
    html += `<tr>
      <td style="padding: 5px 10px; color: var(--muted); font-size: 0.9rem; text-align: right; width: 35px;">${hour.toString().padStart(2, '0')}:00</td>`;
    
    matrix[i].forEach(ppm => {
      const color = getColor(ppm);
      const opacity = ppm === null ? 0.3 : 1;
      const ppmText = ppm === null ? '—' : ppm.toString();
      
      html += `<td style="
        padding: 8px;
        width: 50px;
        text-align: center;
        background-color: ${color};
        opacity: ${opacity};
        border: 1px solid rgba(0,0,0,0.2);
        font-size: 0.85rem;
        font-weight: bold;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      ">${ppmText}</td>`;
    });
    
    html += '</tr>';
  });
  
  html += '</table>';
  
  // Add legend
  html += `<div style="margin-top: 20px; padding: 15px; background: var(--card); border-radius: 8px;">
    <p style="color: var(--muted); font-size: 0.9rem; margin: 0 0 10px 0;">Légende:</p>
    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 30px; height: 30px; background: #4ade80; border-radius: 4px;"></div>
        <span style="font-size: 0.85rem;">Bon (≤${good_threshold} ppm)</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 30px; height: 30px; background: #facc15; border-radius: 4px;"></div>
        <span style="font-size: 0.85rem;">Moyen (${good_threshold}-${bad_threshold} ppm)</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 30px; height: 30px; background: #f87171; border-radius: 4px;"></div>
        <span style="font-size: 0.85rem;">Mauvais (≥${bad_threshold} ppm)</span>
      </div>
    </div>
  </div>`;
  
  heatmapContainer.innerHTML = html;
}
```

#### Step 3: Update analytics.html

Add this to the template in the analytics section:

```html
<div class="card">
  <h2>📊 Analyse Avancée</h2>
  
  <button id="heatmap-btn" class="link" style="margin-bottom: 15px;">
    🔥 Générer Heatmap (heure vs jour)
  </button>
  
  <div id="heatmap-container" style="overflow-x: auto;">
    <!-- Heatmap will render here -->
  </div>
</div>
```

### Testing the Heatmap Feature

1. Navigate to Analytics page
2. Select a date range with at least 7 days of data
3. Click "Générer Heatmap (heure vs jour)"
4. Verify the heatmap shows:
   - 24 rows (hours 0-23)
   - 7 columns (days of week)
   - Color intensity matching PPM values
   - Legend showing threshold ranges

---

## Quick Integration Checklist

### PDF Donut Chart
- [ ] Add `generate_donut_svg()` function to app.py
- [ ] Update `/api/report/daily/pdf` endpoint
- [ ] Add donut_svg parameter to template render
- [ ] Update report_daily.html template
- [ ] Test PDF generation with sample data

### Analytics Heatmap
- [ ] Add `/api/analytics/heatmap` endpoint to app.py
- [ ] Add heatmap rendering functions to analytics.js
- [ ] Add heatmap button and container to analytics.html
- [ ] Test with 7+ days of historical data
- [ ] Verify color coding matches thresholds

---

## Performance Notes

### PDF Generation
- SVG rendering is lightweight
- Donut calculation O(n) where n = data points
- WeasyPrint handles SVG natively
- PDF generation takes ~500-1000ms for typical reports

### Heatmap
- Query groups by hour and day_of_week (fast with indexes)
- Matrix calculation O(24×7) = O(1) essentially
- HTML table rendering is snappy
- Total load time <200ms for month of data

---

## Future Enhancements

1. **Weekly Patterns Chart**: Line graph showing avg PPM by day of week
2. **Correlation Analysis**: CO₂ vs temperature, humidity, occupancy
3. **Predictive Alerts**: Warn when trending toward bad thresholds
4. **Export Heatmap**: Download as PNG or CSV
5. **Custom Time Ranges**: Heatmap for specific hours only

---

**Guide Created**: Phase 4 Implementation Support  
**Last Updated**: 2025-01-XX  
**Status**: Ready for Implementation
