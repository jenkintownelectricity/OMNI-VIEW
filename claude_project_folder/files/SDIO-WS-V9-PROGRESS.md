# ValidKernel Command Progress
## Command: L0-CMD-SDIO-WS-V9
## Issued: 2026-02-02
## Expiry: 2026-03-02T23:59:59Z
## Predecessor: SDIO Workspace v8.1 (sdio-workspace-v8.html)

---

## MISSION: SDIO Workspace v9.0 — Bluebeam-Class PDF Platform

Transform SDIO Workspace from a file-renaming tool with basic PDF preview into a Bluebeam Revu-class PDF workspace for construction shop drawing production.

---

## EXECUTION STATUS

| Phase | Status | Started | Completed | Tasks |
|-------|--------|---------|-----------|-------|
| 1. Core Infrastructure — Zoom/Pan Engine | ⬜ NOT STARTED | - | - | 0/8 |
| 2. Menu Bar System | ⬜ NOT STARTED | - | - | 0/7 |
| 3. Page Label System | ⬜ NOT STARTED | - | - | 0/6 |
| 4. Markup & Annotation Layer | ⬜ NOT STARTED | - | - | 0/14 |
| 5. Enhanced Page Operations | ⬜ NOT STARTED | - | - | 0/5 |
| 6. Rename Button Fix & State Mgmt | ⬜ NOT STARTED | - | - | 0/4 |
| 7. Edit Operations & Shortcuts | ⬜ NOT STARTED | - | - | 0/6 |
| **TOTAL** | **NOT STARTED** | - | - | **0/50** |

---

## CHECKPOINT LOG

_No checkpoints recorded yet._

---

## PHASE 1: Core Infrastructure — Navigation & Zoom Engine

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1.1 | AutoCAD zoom: scroll wheel zooms to cursor position | CRITICAL | ⬜ NOT STARTED |
| 1.2 | AutoCAD pan: middle mouse button click-and-drag pan | CRITICAL | ⬜ NOT STARTED |
| 1.3 | Fit Width button — scale pages to fill preview width | CRITICAL | ⬜ NOT STARTED |
| 1.4 | Fit Page button — scale single page to fit viewport | HIGH | ⬜ NOT STARTED |
| 1.5 | First Page / Last Page jump buttons in toolbar | HIGH | ⬜ NOT STARTED |
| 1.6 | Zoom In (+) and Zoom Out (-) toolbar buttons | HIGH | ⬜ NOT STARTED |
| 1.7 | Zoom percentage indicator in toolbar (e.g. 125%) | MEDIUM | ⬜ NOT STARTED |
| 1.8 | Fix thumbnail min-width: enforce 110px min, never collapse | CRITICAL | ⬜ NOT STARTED |

**Checkpoints:** 001 (after 1.1-1.3), 002 (after 1.4-1.6), 003 (after 1.7-1.8)

---

## PHASE 2: Menu Bar System

| # | Task | Priority | Status |
|---|------|----------|--------|
| 2.1 | Menu bar HTML/CSS: File, Edit, View, Document, Tools | CRITICAL | ⬜ NOT STARTED |
| 2.2 | File menu: Open Project, Save As, Export Page(s), Print | HIGH | ⬜ NOT STARTED |
| 2.3 | Edit menu: Undo, Redo, Cut, Copy, Paste, Delete, Select All | HIGH | ⬜ NOT STARTED |
| 2.4 | View menu: Zoom controls, Fit Width/Page, Single/Continuous, Thumbnails, Grid | HIGH | ⬜ NOT STARTED |
| 2.5 | Document menu: Rotate Page, Insert Blank, Extract Pages, Split, Page Labels | HIGH | ⬜ NOT STARTED |
| 2.6 | Tools menu: Text Box, Callout, Pen, Highlight, Shapes, Cloud, Measurements (stub) | HIGH | ⬜ NOT STARTED |
| 2.7 | Keyboard shortcut dispatch: T, W, N, Q, P, H, L, A, R, E, Ctrl+Z/Y | MEDIUM | ⬜ NOT STARTED |

**Checkpoints:** 004 (after 2.1-2.3), 005 (after 2.4-2.7)

---

## PHASE 3: Page Label System

| # | Task | Priority | Status |
|---|------|----------|--------|
| 3.1 | Page label data structure: Map<pageNum, {label, color?}> | CRITICAL | ⬜ NOT STARTED |
| 3.2 | Right-click thumbnail to add/edit page label | HIGH | ⬜ NOT STARTED |
| 3.3 | Label display on thumbnail (overlay text on thumb) | HIGH | ⬜ NOT STARTED |
| 3.4 | Label display in toolbar page indicator | MEDIUM | ⬜ NOT STARTED |
| 3.5 | Batch label tool: label range of pages at once | MEDIUM | ⬜ NOT STARTED |
| 3.6 | Persist labels in localStorage keyed by filename hash | HIGH | ⬜ NOT STARTED |

**Checkpoints:** 006 (after 3.1-3.3), 007 (after 3.4-3.6)

---

## PHASE 4: Markup & Annotation Layer

| # | Task | Priority | Status |
|---|------|----------|--------|
| 4.1 | SVG overlay layer: one SVG per page, positioned over canvas | CRITICAL | ⬜ NOT STARTED |
| 4.2 | Tool state machine: select, text, pen, line, rect, ellipse, cloud | CRITICAL | ⬜ NOT STARTED |
| 4.3 | Text Box tool (T): click to place, type text, drag to resize | CRITICAL | ⬜ NOT STARTED |
| 4.4 | Callout tool (Q): text box with leader line to point | HIGH | ⬜ NOT STARTED |
| 4.5 | Pen tool (P): freehand SVG path drawing | HIGH | ⬜ NOT STARTED |
| 4.6 | Highlight tool (H): semi-transparent rectangle drag | HIGH | ⬜ NOT STARTED |
| 4.7 | Line tool (L): click start, click end | HIGH | ⬜ NOT STARTED |
| 4.8 | Arrow tool (A): line with arrowhead | HIGH | ⬜ NOT STARTED |
| 4.9 | Rectangle tool (R): drag to draw rectangle | HIGH | ⬜ NOT STARTED |
| 4.10 | Ellipse tool (E): drag to draw ellipse | MEDIUM | ⬜ NOT STARTED |
| 4.11 | Cloud tool: scalloped rectangle markup | HIGH | ⬜ NOT STARTED |
| 4.12 | Select tool: click to select, drag to move, Delete to remove | CRITICAL | ⬜ NOT STARTED |
| 4.13 | Color picker for markup stroke/fill | MEDIUM | ⬜ NOT STARTED |
| 4.14 | Line weight selector for markup tools | MEDIUM | ⬜ NOT STARTED |

**Checkpoints:** 008 (after 4.1-4.3), 009 (after 4.4-4.6), 010 (after 4.7-4.9), 011 (after 4.10-4.12), 012 (after 4.13-4.14)

---

## PHASE 5: Enhanced Page Operations

| # | Task | Priority | Status |
|---|------|----------|--------|
| 5.1 | Rotate page: 90/180/270 degree rotation per page | HIGH | ⬜ NOT STARTED |
| 5.2 | Insert blank page: add blank after current page | MEDIUM | ⬜ NOT STARTED |
| 5.3 | Multi-page extract: visual selection + typed range (from v8.1) | CRITICAL | ⬜ NOT STARTED |
| 5.4 | Split document: split by page count or page range | MEDIUM | ⬜ NOT STARTED |
| 5.5 | Delete page(s): remove selected pages from document | HIGH | ⬜ NOT STARTED |

**Checkpoints:** 013 (after 5.1-5.3), 014 (after 5.4-5.5)

---

## PHASE 6: Rename Button Fix & State Management

| # | Task | Priority | Status |
|---|------|----------|--------|
| 6.1 | Gray out RENAME button until classification code is filled | CRITICAL | ⬜ NOT STARTED |
| 6.2 | Validate all required fields before enabling rename | HIGH | ⬜ NOT STARTED |
| 6.3 | Visual feedback: highlight incomplete required fields in red border | MEDIUM | ⬜ NOT STARTED |
| 6.4 | Confirmation dialog with old name → new name preview | MEDIUM | ⬜ NOT STARTED |

**Checkpoints:** 015 (after 6.1-6.4)

---

## PHASE 7: Edit Operations & Keyboard Shortcuts

| # | Task | Priority | Status |
|---|------|----------|--------|
| 7.1 | Undo stack: track markup add/remove/move operations | HIGH | ⬜ NOT STARTED |
| 7.2 | Redo stack: complement to undo | HIGH | ⬜ NOT STARTED |
| 7.3 | Ctrl+Z / Ctrl+Y keyboard shortcuts for undo/redo | HIGH | ⬜ NOT STARTED |
| 7.4 | Tool switching shortcuts: T, P, H, L, A, R, E, Q, Esc for select | HIGH | ⬜ NOT STARTED |
| 7.5 | Delete key removes selected markup | HIGH | ⬜ NOT STARTED |
| 7.6 | Ctrl+A selects all markups on current page | MEDIUM | ⬜ NOT STARTED |

**Checkpoints:** 016 (after 7.1-7.3), 017 (after 7.4-7.6)

---

## RESUME INSTRUCTIONS

To continue this command in a new session:
1. FIRST ACTION: Read this SDIO-WS-V9-PROGRESS.md file
2. Read the L0-CMD-SDIO-WS-V9.docx command document
3. Check last checkpoint in the CHECKPOINT LOG above
4. Continue from the next NOT STARTED task
5. Do NOT re-implement completed tasks
6. Each phase must produce a working HTML file
7. Update this file after each checkpoint
8. If ambiguous, FAIL-CLOSED and ask L0 for clarification
