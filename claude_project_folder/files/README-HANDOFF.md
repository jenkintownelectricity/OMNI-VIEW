# SDIO Workspace v9.0 — Claude Code Handoff Package
## L0-CMD-SDIO-WS-V9

**Date:** 2026-02-02
**Authority:** Armand Lefebvre, L0 Governance (ROOT)
**Expiry:** 2026-03-02T23:59:59Z

---

## PACKAGE CONTENTS

```
sdio-ws-v9-handoff/
├── README-HANDOFF.md          ← YOU ARE HERE — Read this first
├── L0-CMD-SDIO-WS-V9.docx    ← L0 Authoritative Command (formal spec)
├── sdio-workspace-v8.html     ← Source file — v8.1 with all fixes applied
├── SDIO-WS-V9-PROGRESS.md    ← PPP progress tracker (update after each checkpoint)
└── SDIO-WS-V9-ARCHITECTURE.md ← Technical architecture notes for implementation
```

---

## CLAUDE CODE SESSION BOOTSTRAP

Paste this into your first Claude Code message:

```
I am executing L0-CMD-SDIO-WS-V9 — upgrading SDIO Workspace to v9.0 (Bluebeam-class PDF platform).

1. Read SDIO-WS-V9-PROGRESS.md to check current state
2. Read L0-CMD-SDIO-WS-V9.docx for full command spec
3. Read sdio-workspace-v8.html as the source base
4. Read SDIO-WS-V9-ARCHITECTURE.md for implementation guidance
5. Begin Phase 1 (or resume from last checkpoint)
6. Output working file after each phase
7. Update PROGRESS.md after each checkpoint

RULES:
- IV.02 FAIL-CLOSED: If ambiguous, ask me — don't assume
- IV.04 NO IMPLICIT AUTHORITY: Don't modify taxonomy/rename logic
- Single HTML file output, no build tools
- Every phase must produce a working file
- Checkpoint after designated tasks per phase tables
```

---

## WHAT THIS PROJECT IS

SDIO (ShopDrawings.io) Workspace is a browser-based file management and PDF review tool for construction shop drawing production. It runs as a single HTML file using the File System Access API to work with local project folders.

**Current state (v8.1):**
- File explorer with folder navigation
- Scrolling multi-page PDF preview
- Page thumbnail sidebar
- Multi-page range extraction
- File renaming with SDIO Taxonomy v2.0 format
- Quick select buttons, recently used codes
- Image/doc/spreadsheet file info cards
- Archive and delete operations

**Target state (v9.0):**
- All of v8.1 plus:
- AutoCAD-style zoom/pan (scroll-to-cursor, middle-click pan)
- Bluebeam-style menu bar (File/Edit/View/Document/Tools)
- Page label system (custom labels per page like A-101, ROOF PLAN)
- Markup annotation layer (text box, callout, pen, shapes, cloud)
- Enhanced page operations (rotate, insert, split, delete)
- Fixed rename button state management
- Undo/redo system with keyboard shortcuts

---

## PHASE SUMMARY

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 8 tasks, 3 checkpoints | Zoom/pan engine, fit width/page, thumbnails fix |
| 2 | 7 tasks, 2 checkpoints | Menu bar with dropdowns and shortcut labels |
| 3 | 6 tasks, 2 checkpoints | Page labels — Bluebeam-style page organization |
| 4 | 14 tasks, 5 checkpoints | SVG markup layer — 10 drawing tools |
| 5 | 5 tasks, 2 checkpoints | Page rotate, insert, extract, split, delete |
| 6 | 4 tasks, 1 checkpoint | Rename button validation and state management |
| 7 | 6 tasks, 2 checkpoints | Undo/redo + keyboard shortcut dispatcher |
| **Total** | **50 tasks** | **17 checkpoints** |

---

## CRITICAL CONSTRAINTS

1. **Single HTML file** — no build tools, no separate CSS/JS files
2. **CDN only** — PDF.js and pdf-lib loaded from CDN
3. **No taxonomy changes** — the 110+ classification codes and 90+ spec codes are frozen
4. **No rename logic changes** — the filename format [XXX]-[RXX]-[VXX]-[XXXXXX]-[YYMMDD]-[AAAYYJJ]-[NOTES].[EXT] is frozen
5. **Performance** — must handle 189+ page PDFs smoothly
6. **localStorage** — used for persistence (quick buttons, recent codes, page labels, markups)

---

## KEY TECHNICAL DECISIONS (PRE-MADE)

- **Zoom engine:** CSS transform scale on scroll container + scroll position adjustment to track cursor
- **Pan:** Middle mouse button event listeners, translate scroll position
- **Markup layer:** SVG overlay per page, viewBox matching canvas dimensions
- **Markup data:** Map<pageNum, Array<{id, type, geometry, style, text}>>
- **Page labels:** Map<pageNum, {label, color?}> persisted in localStorage by filename hash
- **Thumbnails:** Minimum 110px column width enforced, scrollbar for overflow
