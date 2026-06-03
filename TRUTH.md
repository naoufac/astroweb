# AstroWeb Build — TRUTH Page

**Last updated:** 2026-06-03 11:57 UTC
**Status:** BUILDING

---

## Chain of Command

```
Nao (owner) → gives goal
  ↓
Manager (Soul) → assigns, reviews, decides — NEVER codes
  ↓
Builder A → Backend: ephemeris, calculations, API
Builder B → Frontend: UI/UX, birth chart wheel, transit view
```

---

## Scope

**Builder A — Backend:**
- ephemeris.js — Swiss Ephemeris planetary positions
- house.js — Placidus + Whole Sign house systems
- aspects.js — aspect calculation with orbs
- birthchart.js — full natal chart builder
- api/chart.js — GET /api/chart endpoint
- api/transits.js — GET /api/transits endpoint
- api/aspects.js — GET /api/aspects endpoint
- server.js — Express app on port 3000

**Builder B — Frontend:**
- index.html — main entry, dark theme, mobile responsive
- components/BirthChart.js — birth chart wheel SVG + input form
- components/TransitView.js — daily transits + horoscope
- components/AspectGrid.js — natal aspect grid
- styles/main.css — dark theme, gold accents
- app.js — frontend logic, API calls, localStorage

---

## Expected Files

```
/root/astroweb/
├── backend/
│   ├── calculations/
│   │   ├── ephemeris.js
│   │   ├── house.js
│   │   ├── aspects.js
│   │   └── birthchart.js
│   ├── api/
│   │   ├── chart.js
│   │   ├── transits.js
│   │   └── aspects.js
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── components/
│   │   ├── BirthChart.js
│   │   ├── TransitView.js
│   │   └── AspectGrid.js
│   └── styles/
│       └── main.css
└── package.json
```

---

## Status

| Builder | Files Expected | Files Done | Status |
|---------|---------------|------------|--------|
| Builder A | 8 | 0 | ⏳ BUILDING |
| Builder B | 6 | 0 | ⏳ BUILDING |

---

## Rules

- Builders: write files, don't talk to each other
- Manager: checks disk, not builder's word
- Syntax check every .js file before marking done
- No status requests — only disk check + truth update

---