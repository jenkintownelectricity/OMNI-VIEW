# OMNI-VIEW v6.0 — CAD Edition
## Bluebeam-Class PDF + CAD Platform

**Date:** 2026-02-03
**Authority:** Armand Lefebvre, L0 Governance (ROOT)
**Evolved from:** SDIO Workspace v8.1 → v9.0 → OMNI-VIEW v6.0

---

## WHAT THIS IS

OMNI-VIEW is a browser-based, single-file HTML application for construction document management, PDF review, markup annotation, and lightweight CAD operations. It runs entirely client-side using the File System Access API to work with local project folders.

**Primary file:** `sdio-workspace-v9 (2).html` (~2900 lines, single-file, no build tools)

---

## CAPABILITIES

### Core Platform
- File explorer with directory picker and folder navigation
- Scrolling multi-page PDF preview with lazy IntersectionObserver rendering
- Page thumbnail sidebar with labels and multi-select
- AutoCAD-style zoom (scroll-to-cursor) and pan (middle-click drag, spacebar)
- Bluebeam-style menu bar (File / Edit / View / Document / Tools)

### Document Operations
- Page rotate, insert blank, extract (combined/individual), split, delete
- Page label system (custom labels per page, batch labeling)
- File renaming with SDIO Taxonomy v2.0 format (110+ classification codes, 90+ spec codes)
- Archive tool for cleanup of old files
- Flatten / unflatten markups into PDF
- Watermark tool (text, opacity, all pages)

### Markup & Annotation (10 SVG Tools)
- Select, Text Box, Callout, Pen, Highlight, Line, Arrow, Rectangle, Ellipse, Cloud
- Color picker, line weight selector, opacity, dash patterns
- Undo/redo (1000 depth), copy/cut/paste, select all
- localStorage persistence per document

### File Previews
- PDF (PDF.js v3.11.174)
- Spreadsheets — xlsx, xls, csv, ods (SheetJS v0.20.3)
- Word documents — docx (Mammoth.js v1.8.0)
- Text/code — txt, md, json, xml, yaml, py, js, ts, css, html, log, ini, cfg, toml, rtf (marked.js v12.0.1)
- Images — jpg, png, gif, bmp, tiff, svg, webp, ico, avif

### CAD Module (v6.0)
- **Snap Engine:** End/Mid/Perp/Near OSNAP modes with visual indicators
- **Scale Calibration:** 2-point calibration with unit support (ft, in, m, mm)
- **CAD Polyline/Polygon:** Click-to-place with snap-to-endpoint, double-click to finish
- **Magic Wand:** BFS flood fill + RDP boundary simplification → auto-trace PDF regions as polylines
- **Measure Tool:** 2-point distance measurement in calibrated or pixel units
- **Layer Manager:** Named layers with color, active layer selection
- **DXF Export:** Full HEADER/TABLES/ENTITIES/EOF with layer support, ACI colors, Y-axis inversion
- **Coordinate Display:** Live X/Y readout in calibrated units

### Keyboard Shortcuts
| Key | Action | Key | Action |
|-----|--------|-----|--------|
| T | Text Box | Ctrl+Z | Undo |
| Q | Callout | Ctrl+Y | Redo |
| P | Pen | Ctrl+C | Copy |
| H | Highlight | Ctrl+X | Cut |
| L | Line | Ctrl+V | Paste |
| A | Arrow | Ctrl+A | Select All |
| R | Rectangle | Ctrl+O | Open Project |
| E | Ellipse | Ctrl+S | Save Markups |
| C | Cloud | Ctrl+M | Toggle Wheel Mode |
| Esc | Select | F2 | Taxonomy Tab |
| Del | Delete | F5 | Refresh |
| +/- | Zoom | Alt+T | Toggle Thumbnails |

---

## CDN DEPENDENCIES

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>
<script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.1/marked.min.js"></script>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">
```

---

## ARCHITECTURE

```
Single HTML File (~2900 lines)
├── <head> CDN scripts (PDF.js, pdf-lib, SheetJS, Mammoth, marked)
├── <style> Dark Matter theme CSS (~250 lines)
├── <body> HTML structure
│   ├── Title bar + Menu bar
│   ├── Toolbar (nav, zoom, tools)
│   ├── Explorer panel (file tree)
│   ├── Thumbnail sidebar
│   ├── Viewport (scrolling PDF/image/doc preview)
│   ├── Right panel (tabs: Props / SDIO / Tools / CAD)
│   └── Modals (extract, split, label, rename, watermark)
└── <script> Application logic IIFE (~2400 lines)
    ├── State object S
    ├── DOM refs & utilities
    ├── Menu bar system
    ├── File system access (directory picker, scan, select)
    ├── PDF loading + lazy rendering (IntersectionObserver)
    ├── PDF page rendering with rotation
    ├── File preview loaders (image, spreadsheet, docx, text)
    ├── SVG markup system (render, events, mouse handlers)
    ├── Undo/redo + clipboard
    ├── Page operations (labels, rotate, insert, delete, extract, split)
    ├── Markup save/load (JSON, localStorage)
    ├── SDIO taxonomy + rename
    ├── Flatten/unflatten + watermark
    ├── Zoom/pan engine
    ├── Keyboard shortcuts
    └── CAD module (snap, calibration, magic wand, layers, DXF export)
```

---

## CRITICAL CONSTRAINTS

1. **Single HTML file** — no build tools, no separate CSS/JS files
2. **CDN only** — all libraries loaded from CDN
3. **No taxonomy changes** — 110+ classification codes and 90+ spec codes are frozen
4. **Performance** — handles 189+ page PDFs via lazy rendering
5. **localStorage** — persistence for quick buttons, recent codes, page labels, markups
6. **File System Access API** — requires Chromium-based browser (Chrome/Edge)
7. **Fresh handle pattern** — always re-request FileHandle from dirHandle before read/write

---

## KNOWN PATTERNS & GOTCHAS

- **Inline pointer-events:** `setupMarkupEvents()` sets `svg.style.pointerEvents='none'` for select mode. Must clear with `svg.style.pointerEvents=''` before adding `tool-active` class, or CSS class won't override.
- **Stale FileHandle:** After writing to a file, the old `S.selectedHandle` goes stale. Always get a fresh handle: `await S.dirHandle.getFileHandle(name)`.
- **CAD tool activation:** Magic Wand, Calibrate, and Measure must call `setTool()` or manually rebind SVG events — setting `S.activeTool` directly won't rebind handlers.
- **Zoom scroll preservation:** `setZoom()` must save `S.currentPage` and `scrollIntoView` after `renderAllPages()` to avoid jumping to page 1.
- **pageDims indexing:** `S.pageDims` is 0-indexed (push-based) with `.w`/`.h` properties, not `.width`/`.height`.
