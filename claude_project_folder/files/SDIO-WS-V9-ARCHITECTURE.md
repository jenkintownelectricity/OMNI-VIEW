# SDIO Workspace v9.0 — Architecture & Implementation Guide
## Technical Reference for L2 Proposer

---

## 1. APPLICATION LAYOUT (v9.0)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Menu Bar: File | Edit | View | Document | Tools                    │
├──────────┬──────┬──────────────────────────────────────┬────────────┤
│ Explorer │ Page │              Preview                  │  Controls  │
│  (260px) │Thumbs│    (scrolling PDF / image view)       │  (350px)   │
│          │(130px│                                       │            │
│ 🔍search │ min) │   ┌──────────────────────────┐       │ Taxonomy   │
│          │      │   │  PDF Page 1              │       │ Quick Sel  │
│ file.pdf │ [1]  │   │  [SVG markup overlay]    │       │ Class Code │
│ file.pdf │ [2]  │   └──────────────────────────┘       │ Rev / Ver  │
│ file.pdf │ [3]  │   ┌──────────────────────────┐       │ CSI Spec   │
│ file.pdf │ [4]  │   │  PDF Page 2              │       │ Date       │
│          │ ...  │   │  [SVG markup overlay]    │       │ Client/Job │
│          │      │   └──────────────────────────┘       │ Notes      │
│          │      │   ...continues scrolling...           │            │
│          │      │                                       │ [filename] │
│          │      │                                       │            │
│          │      │  ┌─── Extract Bar (when active) ───┐ │ [RENAME &  │
│          │      │  │ Pages: [1-10, 15] 10 sel [✂][X] │ │  DELETE]   │
├──────────┴──────┼──┴─────────────────────────────────┴─┤────────────┤
│                 │  ⏮ ◀ 3/189 (A-101) ▶ ⏭ │ 125% │ +- FW FP │ ✂  │
│                 │  Toolbar                                           │
└─────────────────┴───────────────────────────────────────────────────┘
```

---

## 2. ZOOM/PAN ENGINE (Phase 1)

### Architecture

The zoom system uses CSS `transform: scale()` on a container wrapper around all PDF pages, combined with scroll position adjustment to maintain the point under the cursor.

```
#scrollView                    ← overflow: auto (the scrollable viewport)
  └── #zoomContainer           ← transform: scale(currentZoom); transform-origin: 0 0
       ├── .pdf-page-wrap#page-1
       │    ├── canvas          ← rendered at base scale
       │    └── svg.markup-overlay  ← same dimensions as canvas
       ├── .pdf-page-wrap#page-2
       │    ├── canvas
       │    └── svg.markup-overlay
       └── ... (all pages)
```

### Zoom-to-Cursor Algorithm

```javascript
// On wheel event:
function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.25, Math.min(5.0, currentZoom + delta));
    
    // Get cursor position relative to scrollView
    const rect = scrollView.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Point in document space under cursor (before zoom)
    const docX = (scrollView.scrollLeft + mouseX) / currentZoom;
    const docY = (scrollView.scrollTop + mouseY) / currentZoom;
    
    // Apply new zoom
    currentZoom = newZoom;
    zoomContainer.style.transform = `scale(${currentZoom})`;
    
    // Adjust scroll to keep same document point under cursor
    scrollView.scrollLeft = docX * currentZoom - mouseX;
    scrollView.scrollTop = docY * currentZoom - mouseY;
    
    updateZoomDisplay();
}
```

### Middle-Click Pan

```javascript
let isPanning = false, panStartX, panStartY, scrollStartX, scrollStartY;

scrollView.addEventListener('mousedown', e => {
    if (e.button === 1) { // Middle button
        e.preventDefault();
        isPanning = true;
        panStartX = e.clientX; panStartY = e.clientY;
        scrollStartX = scrollView.scrollLeft; scrollStartY = scrollView.scrollTop;
        scrollView.style.cursor = 'grabbing';
    }
});

window.addEventListener('mousemove', e => {
    if (!isPanning) return;
    scrollView.scrollLeft = scrollStartX - (e.clientX - panStartX);
    scrollView.scrollTop = scrollStartY - (e.clientY - panStartY);
});

window.addEventListener('mouseup', e => {
    if (e.button === 1) { isPanning = false; scrollView.style.cursor = ''; }
});
```

### Fit Width / Fit Page

```javascript
function fitWidth() {
    if (!pdfDoc) return;
    // Use first page dimensions as reference
    const pageCanvas = document.querySelector('.pdf-page-wrap canvas');
    const baseWidth = pageCanvas.width; // at scale 1.0
    const viewWidth = scrollView.clientWidth - 30; // padding
    currentZoom = viewWidth / baseWidth;
    zoomContainer.style.transform = `scale(${currentZoom})`;
    updateZoomDisplay();
}

function fitPage() {
    if (!pdfDoc) return;
    const pageCanvas = document.querySelector('.pdf-page-wrap canvas');
    const baseW = pageCanvas.width, baseH = pageCanvas.height;
    const viewW = scrollView.clientWidth - 30, viewH = scrollView.clientHeight - 30;
    currentZoom = Math.min(viewW / baseW, viewH / baseH);
    zoomContainer.style.transform = `scale(${currentZoom})`;
    updateZoomDisplay();
}
```

---

## 3. MENU BAR (Phase 2)

### Structure

```html
<div class="menu-bar">
    <div class="menu-item" data-menu="file">
        <span class="menu-label">File</span>
        <div class="menu-dropdown">
            <div class="menu-entry" onclick="openRootFolder()">
                <span>Open Project...</span><span class="shortcut">Ctrl+O</span>
            </div>
            <div class="menu-separator"></div>
            <div class="menu-entry disabled">
                <span>Save As...</span><span class="shortcut">Ctrl+Shift+S</span>
            </div>
            <div class="menu-entry" onclick="startExtractMode()">
                <span>Extract Pages...</span><span class="shortcut">Ctrl+Shift+X</span>
            </div>
            <!-- ... -->
        </div>
    </div>
    <!-- Edit, View, Document, Tools -->
</div>
```

### Dropdown Behavior
- Click menu label to open, click again or click away to close
- Hover adjacent menu labels to switch while any menu is open
- Esc closes all menus
- Disabled items have `.disabled` class and muted text

---

## 4. PAGE LABELS (Phase 3)

### Data Model

```javascript
// Stored per-document in localStorage
// Key: `sdio_labels_${hashFilename(filename)}`
const pageLabels = {
    1: { label: "COVER", color: "#4ade80" },
    2: { label: "A-001", color: null },
    3: { label: "A-101 FLOOR PLAN", color: null },
    // ... sparse map, only labeled pages have entries
};
```

### Label Display
- **Thumbnail:** Small text overlay at bottom of thumb, truncated with ellipsis
- **Toolbar:** Shows next to page number: "3/189 (A-101 FLOOR PLAN)"
- **Right-click menu:** Opens small modal to type label + optional color

### Batch Label Tool
- Modal: "Label pages [start] to [end] with prefix [___] starting at [___]"
- Example: Pages 5-20, prefix "A-", start 101 → A-101, A-102, ... A-116

---

## 5. MARKUP LAYER (Phase 4)

### SVG Overlay Architecture

Each PDF page gets an SVG overlay positioned absolutely over its canvas:

```html
<div class="pdf-page-wrap" id="page-1">
    <div class="page-marker">1 / 189</div>
    <canvas width="918" height="1188"></canvas>
    <svg class="markup-overlay" viewBox="0 0 918 1188" 
         style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;">
        <!-- Markups rendered here -->
        <rect x="100" y="200" width="300" height="50" fill="none" stroke="red" stroke-width="2"/>
        <text x="105" y="225" fill="red" font-size="14">VERIFY DIMENSION</text>
    </svg>
</div>
```

### Tool State Machine

```javascript
const TOOLS = {
    SELECT: 'select',
    TEXT: 'text',
    CALLOUT: 'callout',
    PEN: 'pen',
    HIGHLIGHT: 'highlight',
    LINE: 'line',
    ARROW: 'arrow',
    RECT: 'rect',
    ELLIPSE: 'ellipse',
    CLOUD: 'cloud',
};

let activeTool = TOOLS.SELECT;
let activeMarkup = null;     // Markup being drawn/edited
let selectedMarkup = null;   // Currently selected markup
let markupStyle = {
    strokeColor: '#FF0000',
    fillColor: 'transparent',
    strokeWidth: 2,
    fontSize: 14,
    fontFamily: 'Arial',
};
```

### Markup Data Structure

```javascript
// Per page: array of markup objects
const markupData = new Map(); // Map<pageNum, MarkupObject[]>

// MarkupObject schema:
{
    id: "mk_1706900000_001",          // Unique ID
    type: "rect",                      // TOOLS enum value
    page: 1,                           // Page number
    geometry: {                        // Type-specific geometry
        x: 100, y: 200,               // For rect/ellipse/text/highlight
        width: 300, height: 50,        // For rect/ellipse/text/highlight
        x1: 0, y1: 0, x2: 0, y2: 0,  // For line/arrow
        points: [],                     // For pen (SVG path data)
        leaderX: 0, leaderY: 0,       // For callout (leader line endpoint)
    },
    style: {
        strokeColor: '#FF0000',
        fillColor: 'transparent',
        strokeWidth: 2,
        opacity: 1.0,                  // 0.3 for highlight
    },
    text: "VERIFY DIMENSION",          // For text/callout types
    created: "2026-02-02T14:30:00Z",
    modified: "2026-02-02T14:30:00Z",
}
```

### Cloud Markup (Scalloped Rectangle)

```javascript
function cloudPath(x, y, w, h, scallop = 12) {
    // Generate SVG path with arc segments along rectangle edges
    const d = [];
    const nx = Math.ceil(w / scallop), ny = Math.ceil(h / scallop);
    const sx = w / nx, sy = h / ny;
    
    d.push(`M ${x} ${y}`);
    // Top edge: arcs moving right
    for (let i = 0; i < nx; i++) {
        const cx = x + (i + 0.5) * sx;
        const ex = x + (i + 1) * sx;
        d.push(`A ${sx/2} ${sx/2} 0 0 1 ${ex} ${y}`);
    }
    // Right edge: arcs moving down
    for (let i = 0; i < ny; i++) {
        const ey = y + (i + 1) * sy;
        d.push(`A ${sy/2} ${sy/2} 0 0 1 ${x + w} ${ey}`);
    }
    // Bottom edge: arcs moving left
    for (let i = nx - 1; i >= 0; i--) {
        const ex = x + i * sx;
        d.push(`A ${sx/2} ${sx/2} 0 0 1 ${ex} ${y + h}`);
    }
    // Left edge: arcs moving up
    for (let i = ny - 1; i >= 0; i--) {
        const ey = y + i * sy;
        d.push(`A ${sy/2} ${sy/2} 0 0 1 ${x} ${ey}`);
    }
    d.push('Z');
    return d.join(' ');
}
```

### Markup Persistence

```javascript
function saveMarkups() {
    if (!currentFileHandle) return;
    const key = `sdio_markups_${hashStr(currentFileHandle.name)}`;
    const data = {};
    markupData.forEach((markups, page) => { data[page] = markups; });
    localStorage.setItem(key, JSON.stringify(data));
}

function loadMarkups() {
    if (!currentFileHandle) return;
    const key = `sdio_markups_${hashStr(currentFileHandle.name)}`;
    const raw = localStorage.getItem(key);
    if (raw) {
        const data = JSON.parse(raw);
        Object.entries(data).forEach(([page, markups]) => {
            markupData.set(parseInt(page), markups);
        });
        renderAllMarkups();
    }
}

function hashStr(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}
```

---

## 6. UNDO/REDO SYSTEM (Phase 7)

```javascript
const undoStack = [];  // Array of { action, data }
const redoStack = [];
const MAX_UNDO = 50;

function pushUndo(action) {
    undoStack.push(action);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack.length = 0; // Clear redo on new action
}

function undo() {
    if (!undoStack.length) return;
    const action = undoStack.pop();
    redoStack.push(action);
    applyUndoAction(action);
}

function redo() {
    if (!redoStack.length) return;
    const action = redoStack.pop();
    undoStack.push(action);
    applyRedoAction(action);
}

// Action types:
// { type: 'add', pageNum, markup }       → undo removes, redo adds
// { type: 'delete', pageNum, markup }    → undo adds back, redo removes
// { type: 'move', pageNum, markupId, oldGeom, newGeom } → swap geometries
```

---

## 7. KEYBOARD SHORTCUT SYSTEM (Phase 7)

```javascript
document.addEventListener('keydown', e => {
    // Don't capture when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    
    // Ctrl shortcuts
    if (e.ctrlKey) {
        switch(e.key) {
            case 'z': e.preventDefault(); undo(); return;
            case 'y': e.preventDefault(); redo(); return;
            case 'a': e.preventDefault(); selectAllMarkups(); return;
        }
    }
    
    // Single-key tool shortcuts (only when not in text input)
    switch(e.key.toLowerCase()) {
        case 't': setActiveTool(TOOLS.TEXT); break;
        case 'q': setActiveTool(TOOLS.CALLOUT); break;
        case 'p': setActiveTool(TOOLS.PEN); break;
        case 'h': setActiveTool(TOOLS.HIGHLIGHT); break;
        case 'l': setActiveTool(TOOLS.LINE); break;
        case 'a': setActiveTool(TOOLS.ARROW); break;
        case 'r': setActiveTool(TOOLS.RECT); break;
        case 'e': setActiveTool(TOOLS.ELLIPSE); break;
        case 'escape': setActiveTool(TOOLS.SELECT); break;
        case 'delete': deleteSelectedMarkup(); break;
    }
});
```

---

## 8. RENAME BUTTON STATE (Phase 6)

```javascript
function validateRenameReady() {
    const cls = document.getElementById('classCode').value;
    const spec = document.getElementById('specCode').value;
    const client = document.getElementById('clientCode').value;
    
    const isReady = cls && cls.length === 3 && currentFileHandle;
    
    const btn = document.getElementById('dlBtn');
    btn.disabled = !isReady;
    
    // Highlight missing required fields
    document.getElementById('classCode').style.borderColor = (!cls || cls.length !== 3) ? '#da3633' : '';
}

// Call on every input change
['classCode', 'specCode', 'clientCode', 'jobYear', 'jobNum'].forEach(id => {
    document.getElementById(id).addEventListener('input', validateRenameReady);
});
```

---

## 9. PERFORMANCE NOTES

For 189-page documents:
- **Render pages lazily:** Only render canvas content for pages near the viewport. Use IntersectionObserver to trigger rendering when pages come into view, and optionally release canvas memory for pages far from viewport.
- **Thumbnails:** Render at 0.15-0.2 scale, defer rendering for offscreen thumbs
- **SVG overlays:** Only create SVG elements for pages that have markups
- **Zoom container:** The CSS transform approach avoids re-rendering canvases on zoom — the browser scales the existing rendered content
