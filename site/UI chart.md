## Site-v2 UI Design Chart (Markdown, with colors for PowerPoint reuse)

### 1. Visual Direction
- Style: modern environmental tech dashboard
- Core mood: deep navy surfaces with aqua-teal signals
- Contrast strategy: high contrast for data readability, softer neutrals for secondary UI
- UI language: glassy overlays on landing pages, structured cards in app pages

---

### 2. Core App Palette (Dashboard, Data Pages, Dark Mode Default)

| Token | HEX | HSL | Usage |
|---|---|---|---|
| Background | #0B0E14 | 220 30% 6% | Main app canvas |
| Foreground | #EEF1F6 | 220 30% 95% | Primary text |
| Card | #0F1624 | 220 40% 10% | Panels and cards |
| Primary | #30E8D6 | 174 80% 55% | CTA, active states, highlights |
| Secondary | #192234 | 220 35% 15% | Secondary buttons/surfaces |
| Muted | #20293C | 220 30% 18% | Neutral blocks and low-emphasis zones |
| Border | #212D45 | 220 35% 20% | Dividers and outlines |
| Success | #48E080 | 142 71% 58% | Good sensor status |
| Warning | #F9CE4E | 45 93% 64% | Caution thresholds |
| Destructive | #DC2828 | 0 72% 51% | Critical alerts/errors |

---

### 3. Light Mode Palette (Alternative App Theme)

| Token | HEX | HSL | Usage |
|---|---|---|---|
| Background | #F9F9FB | 220 25% 98% | Light app canvas |
| Foreground | #0F1624 | 220 40% 10% | Main text |
| Card | #FFFFFF | 0 0% 100% | Light cards |
| Primary | #1FAD9F | 174 70% 40% | CTA and active states |
| Secondary | #ECEEF4 | 220 25% 94% | Secondary surfaces |
| Muted | #EAECF1 | 220 20% 93% | Neutral blocks |
| Border | #DADEE7 | 220 20% 88% | Inputs/dividers |
| Success | #21C45D | 142 71% 45% | Positive states |
| Warning | #E7B008 | 45 93% 47% | Warning states |
| Destructive | #EF4343 | 0 84% 60% | Error/critical |

---

### 4. Landing Palette (Marketing Pages)

| Token | HEX | HSL | Usage |
|---|---|---|---|
| Landing Dark Background | #0E131B | 217 30% 8% | Hero dark scenes |
| Landing Dark Foreground | #EBF6F9 | 196 55% 95% | Hero text |
| Landing Primary | #35C092 | 160 57% 48% | CTA, highlight |
| Landing Accent | #3EB8E5 | 196 76% 57% | Secondary accent |
| Landing Light Background | #EEF0F1 | 200 10% 94% | Light section canvas |
| Landing Light Foreground | #1A323C | 199 39% 17% | Light section text |
| Landing Border | #3A5964 (dark) / #BCD1D7 (light) | 196 26% 31% / 193 26% 79% | Framing/glass edges |

---

### 5. Signature Gradients

| Gradient | Stops | Direction | Use |
|---|---|---|---|
| App Primary | #30E8D6 to #17CFBC | 135deg | Main action buttons |
| Landing Primary | #34A881 to #28A9DC | 135deg | Landing CTA accents |
| Landing Section Wash | #EFF1F2 to #0F141C (theme-dependent) | vertical | Large section backgrounds |

---

### 6. Data Visualization Palette

| Data Element | Color |
|---|---|
| CO2 trend line | Primary token (#30E8D6 dark, #1FAD9F light) |
| Temperature line | Warning token (#F9CE4E / #E7B008) |
| Humidity line | Success token (#48E080 / #21C45D) |
| Critical threshold lines | Destructive token (#DC2828 / #EF4343) |
| Report chart set | #EF4444, #F59E0B, #3B82F6, #10B981 |

---

### 7. Typography System

| Role | Font | Weight | Typical Use |
|---|---|---|---|
| Base UI | Inter | 300-700 | Body text, tables, labels |
| UI Emphasis | Manrope | 400-800 | Navigation, feature titles, headers |
| Editorial Accent | Cormorant Garamond | 500-700, italic variants | Landing hero/section artistic lines |

PowerPoint font mapping:
- Primary: Inter
- Secondary: Manrope
- Accent: Cormorant Garamond Italic
- Fallback set: Segoe UI, Calibri, Georgia Italic

---

### 8. Component Style Chart

| Component | Fill | Border | Radius | Notes |
|---|---|---|---|---|
| Card | Card token | Border token | 12px base | Structured dashboard block |
| Primary Button | Primary gradient or primary solid | none | 8-12px | High emphasis CTA |
| Outline Button | Background token | Input/border token | 8px | Secondary action |
| Badge | Primary/success/warning/destructive | thin border | Full pill | Status and tags |
| Tabs | Muted container | subtle | 6-8px | Active tab uses background token |
| Sidebar | Sidebar background token | Sidebar border token | Soft corners | Collapsible desktop nav |

---

### 9. Motion and Interaction Tone

| Motion Pattern | Timing | Use |
|---|---|---|
| Micro entrance (fade/slide/scale) | 0.2s to 0.3s ease-out | Cards, tabs, small elements |
| Section reveal | 0.5s to 0.8s ease-out | Landing sections |
| Theme color interpolation | ~420ms | Light/dark transitions |
| Ambient floating blobs | 8s to 12s loop | Hero atmosphere |
| Hover lift on feature cards | subtle translate/tilt | Landing interaction depth |

---

### 10. PowerPoint Master Theme Setup (directly reusable)

1. Background slides:
- Data slides: #0B0E14
- Marketing slides: #0E131B with teal-blue glow accents

2. Text colors:
- On dark: title #EEF1F6, body rgba equivalent of muted foreground
- On light: title #0F1624, body #1A323C to #4B5C6A range

3. Accent colors:
- Primary accent: #30E8D6
- Secondary accent: #3EB8E5
- Warning accent: #F9CE4E
- Critical accent: #DC2828

4. Shape style:
- Cards with 12px corners
- 1px borders using #212D45 on dark, #DADEE7 on light
- Soft shadow only, avoid heavy blur in data-heavy slides

5. Chart style:
- CO2 always teal
- Temperature amber
- Humidity green
- Alert severity red-amber-blue-green sequence

---

### 11. Quick Palette Block for Copy/Paste into a Design Slide

- Primary Teal: #30E8D6
- Deep Navy: #0B0E14
- Card Navy: #0F1624
- Border Navy: #212D45
- Sky Accent: #3EB8E5
- Success Green: #48E080
- Warning Amber: #F9CE4E
- Critical Red: #DC2828
- Light Surface: #F9F9FB
- Light Primary: #1FAD9F
