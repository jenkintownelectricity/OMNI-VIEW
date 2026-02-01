import { useState, useRef, useEffect, useCallback, useReducer } from "react";

/* ═══════════════════════════════════════════════════════════════
   OMNI-VIEW — CHUNK 1: THE SHELL & FILE EXPLORER
   ═══════════════════════════════════════════════════════════════
   ✅ 3-Pane Layout (Explorer | Canvas | Tool Chest)
   ✅ File System Access API (showDirectoryPicker)
   ✅ File type detection with icons
   ✅ AEC Renaming Engine (Class-Rev-Ver-Spec-Date-Client-Job-Desc)
   ✅ Taxonomy Quick Buttons + Predict Box
   ✅ File selection → "File Loaded" confirmation
   ✅ Dark Matter theme (#0f1115)
   ═══════════════════════════════════════════════════════════════ */

// ─── AEC TAXONOMY DATA ───────────────────────────────────────
const TAXONOMY = {
  Class: {
    label: "Document Class",
    options: [
      { code: "DWG", desc: "Drawing" },
      { code: "SPEC", desc: "Specification" },
      { code: "SUB", desc: "Submittal" },
      { code: "RFI", desc: "Request for Information" },
      { code: "CO", desc: "Change Order" },
      { code: "ASI", desc: "Addendum / Supplemental" },
      { code: "SHOP", desc: "Shop Drawing" },
      { code: "PHOTO", desc: "Photo Documentation" },
      { code: "RPT", desc: "Report" },
      { code: "SCHED", desc: "Schedule" },
      { code: "CORR", desc: "Correspondence" },
      { code: "CALC", desc: "Calculation" },
      { code: "LOG", desc: "Log / Register" },
      { code: "MTG", desc: "Meeting Minutes" },
      { code: "INV", desc: "Invoice" },
      { code: "PM", desc: "Project Management" },
      { code: "SAF", desc: "Safety" },
      { code: "QC", desc: "Quality Control" },
    ],
  },
  Rev: {
    label: "Revision",
    options: [
      { code: "R00", desc: "Initial Issue" },
      { code: "R01", desc: "Revision 1" },
      { code: "R02", desc: "Revision 2" },
      { code: "R03", desc: "Revision 3" },
      { code: "R04", desc: "Revision 4" },
      { code: "R05", desc: "Revision 5" },
      { code: "RA", desc: "Revision A" },
      { code: "RB", desc: "Revision B" },
      { code: "RC", desc: "Revision C" },
      { code: "RD", desc: "Revision D" },
    ],
  },
  Ver: {
    label: "Version",
    options: [
      { code: "V1", desc: "Version 1" },
      { code: "V2", desc: "Version 2" },
      { code: "V3", desc: "Version 3" },
      { code: "DRAFT", desc: "Draft" },
      { code: "FINAL", desc: "Final" },
      { code: "IFC", desc: "Issued for Construction" },
      { code: "IFR", desc: "Issued for Review" },
      { code: "IFB", desc: "Issued for Bid" },
      { code: "RECORD", desc: "Record / As-Built" },
    ],
  },
  Spec: {
    label: "Discipline / Spec Section",
    options: [
      { code: "ARCH", desc: "Architectural" },
      { code: "STRUC", desc: "Structural" },
      { code: "MEP", desc: "Mechanical/Electrical/Plumbing" },
      { code: "ELEC", desc: "Electrical" },
      { code: "MECH", desc: "Mechanical" },
      { code: "PLMB", desc: "Plumbing" },
      { code: "CIVIL", desc: "Civil" },
      { code: "FIRE", desc: "Fire Protection" },
      { code: "LAND", desc: "Landscape" },
      { code: "GEN", desc: "General" },
      { code: "DIV01", desc: "Division 01 — General" },
      { code: "DIV03", desc: "Division 03 — Concrete" },
      { code: "DIV05", desc: "Division 05 — Metals" },
      { code: "DIV07", desc: "Division 07 — Thermal/Moisture" },
      { code: "DIV08", desc: "Division 08 — Openings" },
      { code: "DIV09", desc: "Division 09 — Finishes" },
      { code: "DIV22", desc: "Division 22 — Plumbing" },
      { code: "DIV23", desc: "Division 23 — HVAC" },
      { code: "DIV26", desc: "Division 26 — Electrical" },
    ],
  },
};

// ─── FILE TYPE CONFIG ────────────────────────────────────────
const FILE_TYPES = {
  pdf: { color: "#e74c3c", icon: "PDF", bg: "#2a1a1a" },
  docx: { color: "#3498db", icon: "DOC", bg: "#1a222a" },
  doc: { color: "#3498db", icon: "DOC", bg: "#1a222a" },
  xlsx: { color: "#27ae60", icon: "XLS", bg: "#1a2a1e" },
  xls: { color: "#27ae60", icon: "XLS", bg: "#1a2a1e" },
  csv: { color: "#27ae60", icon: "CSV", bg: "#1a2a1e" },
  jpg: { color: "#e67e22", icon: "IMG", bg: "#2a241a" },
  jpeg: { color: "#e67e22", icon: "IMG", bg: "#2a241a" },
  png: { color: "#e67e22", icon: "IMG", bg: "#2a241a" },
  tiff: { color: "#e67e22", icon: "IMG", bg: "#2a241a" },
  tif: { color: "#e67e22", icon: "IMG", bg: "#2a241a" },
  bmp: { color: "#e67e22", icon: "IMG", bg: "#2a241a" },
  gif: { color: "#e67e22", icon: "IMG", bg: "#2a241a" },
  svg: { color: "#9b59b6", icon: "SVG", bg: "#241a2a" },
  dwg: { color: "#1abc9c", icon: "CAD", bg: "#1a2a28" },
  dxf: { color: "#1abc9c", icon: "CAD", bg: "#1a2a28" },
  txt: { color: "#95a5a6", icon: "TXT", bg: "#1e1e1e" },
};

const getFileType = (name) => {
  const ext = name.split(".").pop().toLowerCase();
  return FILE_TYPES[ext] || { color: "#7f8c8d", icon: "FILE", bg: "#1a1a1a" };
};

const getExt = (name) => name.split(".").pop().toLowerCase();

const isSupported = (name) => {
  const ext = getExt(name);
  return ["pdf", "docx", "doc", "xlsx", "xls", "csv", "jpg", "jpeg", "png", "tiff", "tif", "bmp", "gif", "svg"].includes(ext);
};

// ─── DATE UTIL ───────────────────────────────────────────────
const todayStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
};

// ─── INITIAL STATE ───────────────────────────────────────────
const initialState = {
  dirHandle: null,
  files: [],
  selectedFile: null,
  selectedFileHandle: null,
  loadedConfirmation: null,
  explorerWidth: 280,
  toolChestWidth: 260,
  renameModal: false,
  renameFields: { Class: "", Rev: "", Ver: "", Spec: "", Date: todayStamp(), Client: "", Job: "", Desc: "" },
  renamePrediction: "",
  contextMenu: null,
  expandedFolders: {},
  sortBy: "name",
  filterText: "",
  multiSelect: [],
  batchRenameMode: false,
  toast: null,
  statusBar: "Ready",
};

function reducer(state, action) {
  switch (action.type) {
    case "SET":
      return { ...state, ...action.payload };
    case "SET_RENAME_FIELD":
      const updated = { ...state.renameFields, [action.field]: action.value };
      return { ...state, renameFields: updated, renamePrediction: buildPrediction(updated, state.selectedFile) };
    case "RESET_RENAME":
      return { ...state, renameFields: { ...initialState.renameFields, Date: todayStamp() }, renamePrediction: "" };
    case "TOAST":
      return { ...state, toast: action.message };
    case "CLEAR_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}

function buildPrediction(fields, selectedFile) {
  const parts = [fields.Class, fields.Rev, fields.Ver, fields.Spec, fields.Date, fields.Client, fields.Job, fields.Desc].filter(Boolean);
  if (parts.length === 0) return "";
  const ext = selectedFile ? "." + getExt(selectedFile.name) : "";
  return parts.join("-") + ext;
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function OmniView() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const explorerRef = useRef(null);
  const toastTimer = useRef(null);

  // Toast system
  const showToast = useCallback((msg) => {
    dispatch({ type: "TOAST", message: msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dispatch({ type: "CLEAR_TOAST" }), 3000);
  }, []);

  // ─── FILE SYSTEM ACCESS ──────────────────────────────────
  const openDirectory = useCallback(async () => {
    try {
      if (!window.showDirectoryPicker) {
        showToast("⚠ File System Access API not supported in this browser. Use Chrome or Edge.");
        return;
      }
      const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      dispatch({ type: "SET", payload: { dirHandle, statusBar: `Workspace: ${dirHandle.name}` } });
      await scanDirectory(dirHandle);
      showToast(`✓ Opened workspace: ${dirHandle.name}`);
    } catch (e) {
      if (e.name !== "AbortError") showToast("✗ Failed to open directory");
    }
  }, [showToast]);

  const scanDirectory = useCallback(async (dirHandle, path = "") => {
    const entries = [];
    for await (const [name, handle] of dirHandle) {
      const entry = { name, handle, path: path ? `${path}/${name}` : name, kind: handle.kind };
      if (handle.kind === "directory") {
        entry.children = await scanDirectory(handle, entry.path);
      }
      entries.push(entry);
    }
    entries.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    if (!path) dispatch({ type: "SET", payload: { files: entries } });
    return entries;
  }, []);

  const refreshFiles = useCallback(async () => {
    if (state.dirHandle) {
      await scanDirectory(state.dirHandle);
      showToast("✓ Refreshed file list");
    }
  }, [state.dirHandle, scanDirectory, showToast]);

  // ─── FILE SELECTION ──────────────────────────────────────
  const selectFile = useCallback(async (entry) => {
    if (entry.kind === "directory") {
      dispatch({ type: "SET", payload: { expandedFolders: { ...state.expandedFolders, [entry.path]: !state.expandedFolders[entry.path] } } });
      return;
    }
    dispatch({
      type: "SET",
      payload: {
        selectedFile: entry,
        selectedFileHandle: entry.handle,
        loadedConfirmation: entry.name,
        statusBar: `Loaded: ${entry.name} (${getExt(entry.name).toUpperCase()})`,
      },
    });
    showToast(`✓ File Loaded: ${entry.name}`);
  }, [state.expandedFolders, showToast]);

  // ─── RENAME ENGINE ───────────────────────────────────────
  const openRenameModal = useCallback(() => {
    if (!state.selectedFile) {
      showToast("⚠ Select a file first");
      return;
    }
    dispatch({ type: "RESET_RENAME" });
    dispatch({ type: "SET", payload: { renameModal: true } });
  }, [state.selectedFile, showToast]);

  const executeRename = useCallback(async () => {
    if (!state.renamePrediction || !state.selectedFileHandle) {
      showToast("⚠ Build a filename first using the taxonomy buttons");
      return;
    }
    try {
      // File System Access API rename via move
      if (state.selectedFileHandle.move) {
        await state.selectedFileHandle.move(state.renamePrediction);
        showToast(`✓ Renamed to: ${state.renamePrediction}`);
      } else {
        // Fallback: read → create new → delete old (some browsers)
        const parentDir = state.dirHandle;
        const file = await state.selectedFileHandle.getFile();
        const newHandle = await parentDir.getFileHandle(state.renamePrediction, { create: true });
        const writable = await newHandle.createWritable();
        await writable.write(await file.arrayBuffer());
        await writable.close();
        await parentDir.removeEntry(state.selectedFile.name);
        showToast(`✓ Renamed to: ${state.renamePrediction}`);
      }
      dispatch({ type: "SET", payload: { renameModal: false } });
      if (state.dirHandle) await scanDirectory(state.dirHandle);
    } catch (e) {
      showToast(`✗ Rename failed: ${e.message}`);
    }
  }, [state.renamePrediction, state.selectedFileHandle, state.selectedFile, state.dirHandle, scanDirectory, showToast]);

  // ─── BATCH SELECT ────────────────────────────────────────
  const toggleMultiSelect = useCallback((entry, e) => {
    if (!e.ctrlKey && !e.metaKey) return false;
    e.preventDefault();
    const path = entry.path;
    const current = state.multiSelect;
    const next = current.includes(path) ? current.filter((p) => p !== path) : [...current, path];
    dispatch({ type: "SET", payload: { multiSelect: next } });
    return true;
  }, [state.multiSelect]);

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* ═══ TITLE BAR ═══ */}
      <div style={styles.titleBar}>
        <div style={styles.titleLeft}>
          <div style={styles.logoMark}>◆</div>
          <span style={styles.titleText}>OMNI-VIEW</span>
          <span style={styles.titleEdition}>eXtreme</span>
        </div>
        <MenuBar state={state} dispatch={dispatch} openDirectory={openDirectory} refreshFiles={refreshFiles} openRenameModal={openRenameModal} showToast={showToast} />
        <div style={styles.titleRight}>
          <span style={styles.titleVersion}>CHUNK 1</span>
        </div>
      </div>

      {/* ═══ TOOLBAR ═══ */}
      <Toolbar state={state} dispatch={dispatch} openDirectory={openDirectory} refreshFiles={refreshFiles} openRenameModal={openRenameModal} showToast={showToast} />

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={styles.mainContainer}>
        {/* EXPLORER PANEL */}
        <div style={{ ...styles.explorerPanel, width: state.explorerWidth }}>
          <ExplorerPanel state={state} dispatch={dispatch} selectFile={selectFile} toggleMultiSelect={toggleMultiSelect} openDirectory={openDirectory} />
        </div>

        {/* CANVAS AREA */}
        <div style={styles.canvasArea}>
          <CanvasPlaceholder state={state} />
        </div>

        {/* TOOL CHEST PANEL */}
        <div style={{ ...styles.toolChestPanel, width: state.toolChestWidth }}>
          <ToolChestPanel state={state} showToast={showToast} />
        </div>
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div style={styles.statusBar}>
        <span>{state.statusBar}</span>
        <span style={styles.statusRight}>
          {state.files.length > 0 && `${countFiles(state.files)} files`}
          {state.multiSelect.length > 0 && ` · ${state.multiSelect.length} selected`}
        </span>
      </div>

      {/* ═══ RENAME MODAL ═══ */}
      {state.renameModal && (
        <RenameModal state={state} dispatch={dispatch} executeRename={executeRename} />
      )}

      {/* ═══ TOAST ═══ */}
      {state.toast && <div style={styles.toast}>{state.toast}</div>}

      {/* ═══ FILE LOADED CONFIRMATION ═══ */}
      {state.loadedConfirmation && (
        <LoadedBanner name={state.loadedConfirmation} onDismiss={() => dispatch({ type: "SET", payload: { loadedConfirmation: null } })} />
      )}
    </div>
  );
}

// ─── MENU BAR ────────────────────────────────────────────────
function MenuBar({ state, dispatch, openDirectory, refreshFiles, openRenameModal, showToast }) {
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const menus = {
    File: [
      { label: "Open Workspace…", action: openDirectory, shortcut: "Ctrl+O" },
      { label: "Refresh", action: refreshFiles, shortcut: "F5" },
      { divider: true },
      { label: "Close Workspace", action: () => { dispatch({ type: "SET", payload: { ...initialState } }); showToast("Workspace closed"); }, shortcut: "" },
    ],
    Edit: [
      { label: "Rename File…", action: openRenameModal, shortcut: "F2" },
      { divider: true },
      { label: "Select All Files", action: () => { const all = flatFiles(state.files).map(f => f.path); dispatch({ type: "SET", payload: { multiSelect: all } }); }, shortcut: "Ctrl+A" },
      { label: "Clear Selection", action: () => dispatch({ type: "SET", payload: { multiSelect: [] } }), shortcut: "Esc" },
    ],
    View: [
      { label: "Sort by Name", action: () => dispatch({ type: "SET", payload: { sortBy: "name" } }) },
      { label: "Sort by Type", action: () => dispatch({ type: "SET", payload: { sortBy: "type" } }) },
      { divider: true },
      { label: "Collapse All", action: () => dispatch({ type: "SET", payload: { expandedFolders: {} } }) },
    ],
    Batch: [
      { label: "Batch Rename (Selected)…", action: () => { if (state.multiSelect.length < 2) { showToast("⚠ Select 2+ files with Ctrl+Click"); return; } dispatch({ type: "SET", payload: { batchRenameMode: true, renameModal: true } }); dispatch({ type: "RESET_RENAME" }); } },
      { divider: true },
      { label: "Batch OCR (Chunk 5)", action: () => showToast("⏳ Available in Chunk 5"), disabled: true },
      { label: "Batch Flatten (Chunk 5)", action: () => showToast("⏳ Available in Chunk 5"), disabled: true },
    ],
    Help: [
      { label: "About OMNI-VIEW", action: () => showToast("OMNI-VIEW v0.1 — Chunk 1: Shell & File Explorer") },
      { label: "Keyboard Shortcuts", action: () => showToast("F2: Rename · F5: Refresh · Ctrl+O: Open · Ctrl+A: Select All") },
    ],
  };

  return (
    <div ref={menuRef} style={styles.menuBar}>
      {Object.entries(menus).map(([label, items]) => (
        <div key={label} style={styles.menuGroup}>
          <button
            style={{ ...styles.menuBtn, ...(openMenu === label ? styles.menuBtnActive : {}) }}
            onClick={() => setOpenMenu(openMenu === label ? null : label)}
            onMouseEnter={() => openMenu && setOpenMenu(label)}
          >
            {label}
          </button>
          {openMenu === label && (
            <div style={styles.menuDropdown}>
              {items.map((item, i) =>
                item.divider ? (
                  <div key={i} style={styles.menuDivider} />
                ) : (
                  <button
                    key={i}
                    style={{ ...styles.menuItem, ...(item.disabled ? styles.menuItemDisabled : {}) }}
                    onClick={() => { if (!item.disabled) { item.action(); setOpenMenu(null); } }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <span style={styles.menuShortcut}>{item.shortcut}</span>}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── TOOLBAR ─────────────────────────────────────────────────
function Toolbar({ state, dispatch, openDirectory, refreshFiles, openRenameModal, showToast }) {
  const tools = [
    { icon: "📂", tip: "Open Workspace", action: openDirectory },
    { icon: "🔄", tip: "Refresh", action: refreshFiles },
    { sep: true },
    { icon: "✏️", tip: "Rename (F2)", action: openRenameModal },
    { icon: "📋", tip: "Batch Select Mode", action: () => showToast("Ctrl+Click files to multi-select, then use Batch menu") },
    { sep: true },
    { icon: "📄", tip: "PDF Engine (Chunk 2)", action: () => showToast("⏳ Available in Chunk 2"), disabled: true },
    { icon: "✍️", tip: "Markup Tools (Chunk 3)", action: () => showToast("⏳ Available in Chunk 3"), disabled: true },
    { icon: "📝", tip: "Office Module (Chunk 4)", action: () => showToast("⏳ Available in Chunk 4"), disabled: true },
    { icon: "⚡", tip: "Automation (Chunk 5)", action: () => showToast("⏳ Available in Chunk 5"), disabled: true },
  ];

  return (
    <div style={styles.toolbar}>
      {tools.map((t, i) =>
        t.sep ? (
          <div key={i} style={styles.toolSep} />
        ) : (
          <button
            key={i}
            style={{ ...styles.toolBtn, ...(t.disabled ? { opacity: 0.35 } : {}) }}
            title={t.tip}
            onClick={t.action}
          >
            {t.icon}
          </button>
        )
      )}
    </div>
  );
}

// ─── EXPLORER PANEL ──────────────────────────────────────────
function ExplorerPanel({ state, dispatch, selectFile, toggleMultiSelect, openDirectory }) {
  const renderTree = (entries, depth = 0) => {
    let sorted = [...entries];
    if (state.sortBy === "type") {
      sorted.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
        return getExt(a.name).localeCompare(getExt(b.name)) || a.name.localeCompare(b.name);
      });
    }
    if (state.filterText) {
      sorted = sorted.filter(
        (e) => e.kind === "directory" || e.name.toLowerCase().includes(state.filterText.toLowerCase())
      );
    }
    return sorted.map((entry) => {
      const isDir = entry.kind === "directory";
      const isExpanded = state.expandedFolders[entry.path];
      const isSelected = state.selectedFile?.path === entry.path;
      const isMulti = state.multiSelect.includes(entry.path);
      const ft = isDir ? null : getFileType(entry.name);

      return (
        <div key={entry.path}>
          <button
            style={{
              ...styles.fileRow,
              paddingLeft: 12 + depth * 16,
              background: isSelected ? "rgba(0,168,255,0.15)" : isMulti ? "rgba(255,168,0,0.1)" : "transparent",
              borderLeft: isSelected ? "2px solid #00a8ff" : isMulti ? "2px solid #f0a030" : "2px solid transparent",
            }}
            onClick={(e) => {
              if (!toggleMultiSelect(entry, e)) selectFile(entry);
            }}
            onDoubleClick={() => isDir && selectFile(entry)}
          >
            {isDir ? (
              <span style={{ ...styles.fileIcon, color: "#f0c040", fontSize: 14 }}>{isExpanded ? "📂" : "📁"}</span>
            ) : (
              <span style={{ ...styles.fileTypeBadge, background: ft.bg, color: ft.color }}>{ft.icon}</span>
            )}
            <span style={{ ...styles.fileName, fontWeight: isSelected ? 600 : 400 }}>{entry.name}</span>
            {isMulti && <span style={styles.multiDot}>●</span>}
          </button>
          {isDir && isExpanded && entry.children && renderTree(entry.children, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div style={styles.explorerInner}>
      <div style={styles.panelHeader}>
        <span style={styles.panelTitle}>EXPLORER</span>
        <button style={styles.panelAction} onClick={openDirectory} title="Open Workspace">+</button>
      </div>

      {/* Search / Filter */}
      <div style={styles.filterBox}>
        <input
          style={styles.filterInput}
          placeholder="Filter files…"
          value={state.filterText}
          onChange={(e) => dispatch({ type: "SET", payload: { filterText: e.target.value } })}
        />
        {state.filterText && (
          <button style={styles.filterClear} onClick={() => dispatch({ type: "SET", payload: { filterText: "" } })}>✕</button>
        )}
      </div>

      {/* File Tree */}
      <div style={styles.fileTree}>
        {state.files.length === 0 ? (
          <div style={styles.emptyExplorer}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📂</div>
            <div style={{ opacity: 0.5, fontSize: 12 }}>No workspace open</div>
            <button style={styles.openBtn} onClick={openDirectory}>
              Open Workspace
            </button>
          </div>
        ) : (
          renderTree(state.files)
        )}
      </div>

      {/* Workspace Info */}
      {state.dirHandle && (
        <div style={styles.workspaceInfo}>
          <div style={styles.workspaceName}>⚡ {state.dirHandle.name}</div>
        </div>
      )}
    </div>
  );
}

// ─── CANVAS PLACEHOLDER (Chunk 2+) ──────────────────────────
function CanvasPlaceholder({ state }) {
  const ft = state.selectedFile ? getFileType(state.selectedFile.name) : null;

  return (
    <div style={styles.canvasInner}>
      {state.selectedFile ? (
        <div style={styles.canvasLoaded}>
          <div style={{ ...styles.canvasFileIcon, color: ft?.color || "#555" }}>{ft?.icon || "FILE"}</div>
          <div style={styles.canvasFileName}>{state.selectedFile.name}</div>
          <div style={styles.canvasFileType}>{getExt(state.selectedFile.name).toUpperCase()} Document</div>
          <div style={styles.canvasReady}>
            {isSupported(state.selectedFile.name) ? (
              <>
                <div style={{ ...styles.readyDot, background: "#2ecc71" }} />
                <span>Ready for rendering (Chunk 2)</span>
              </>
            ) : (
              <>
                <div style={{ ...styles.readyDot, background: "#e67e22" }} />
                <span>Unsupported format for canvas rendering</span>
              </>
            )}
          </div>
          <div style={styles.canvasGrid}>
            <div style={styles.canvasGridItem}>
              <div style={styles.gridLabel}>Type</div>
              <div style={styles.gridValue}>{getExt(state.selectedFile.name).toUpperCase()}</div>
            </div>
            <div style={styles.canvasGridItem}>
              <div style={styles.gridLabel}>Path</div>
              <div style={styles.gridValue}>{state.selectedFile.path}</div>
            </div>
            <div style={styles.canvasGridItem}>
              <div style={styles.gridLabel}>Status</div>
              <div style={styles.gridValue}>Handle Locked (Read/Write)</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.canvasEmpty}>
          <div style={styles.canvasLogo}>◆</div>
          <div style={styles.canvasTitle}>OMNI-VIEW</div>
          <div style={styles.canvasSubtitle}>Unified Document Workspace</div>
          <div style={styles.canvasHint}>Open a workspace and select a file to begin</div>
          <div style={styles.chunkMap}>
            <ChunkBadge n={1} label="Shell & Explorer" active />
            <ChunkBadge n={2} label="PDF Engine" />
            <ChunkBadge n={3} label="Markup Tools" />
            <ChunkBadge n={4} label="Office Module" />
            <ChunkBadge n={5} label="Automation" />
          </div>
        </div>
      )}
    </div>
  );
}

function ChunkBadge({ n, label, active }) {
  return (
    <div style={{ ...styles.chunkBadge, borderColor: active ? "#00a8ff" : "#2a2d35", background: active ? "rgba(0,168,255,0.08)" : "transparent" }}>
      <span style={{ ...styles.chunkN, color: active ? "#00a8ff" : "#555" }}>#{n}</span>
      <span style={{ color: active ? "#c8d8e8" : "#555", fontSize: 11 }}>{label}</span>
      {active && <span style={styles.chunkActive}>ACTIVE</span>}
    </div>
  );
}

// ─── TOOL CHEST PANEL ────────────────────────────────────────
function ToolChestPanel({ state, showToast }) {
  const toolGroups = [
    {
      title: "MARKUP TOOLS",
      chunk: 3,
      tools: [
        { icon: "T", label: "Text Box", key: "T" },
        { icon: "☁", label: "Cloud+", key: "" },
        { icon: "📏", label: "Dimension", key: "" },
        { icon: "🖍", label: "Highlighter", key: "H" },
        { icon: "📌", label: "Note", key: "N" },
        { icon: "↗", label: "Arrow", key: "A" },
      ],
    },
    {
      title: "MEASURE",
      chunk: 3,
      tools: [
        { icon: "📐", label: "Length", key: "" },
        { icon: "▢", label: "Area", key: "" },
        { icon: "◎", label: "Count", key: "" },
        { icon: "⊘", label: "Diameter", key: "" },
      ],
    },
    {
      title: "DOCUMENT",
      chunk: 2,
      tools: [
        { icon: "🔍", label: "Zoom", key: "" },
        { icon: "↕", label: "Pan", key: "" },
        { icon: "📄", label: "Thumbnails", key: "" },
        { icon: "🔖", label: "Bookmarks", key: "" },
      ],
    },
  ];

  return (
    <div style={styles.toolChestInner}>
      <div style={styles.panelHeader}>
        <span style={styles.panelTitle}>TOOL CHEST</span>
      </div>
      {toolGroups.map((group) => (
        <div key={group.title} style={styles.toolGroup}>
          <div style={styles.toolGroupHeader}>
            <span>{group.title}</span>
            <span style={styles.chunkTag}>Chunk {group.chunk}</span>
          </div>
          <div style={styles.toolGrid}>
            {group.tools.map((t) => (
              <button
                key={t.label}
                style={styles.toolChestBtn}
                title={`${t.label}${t.key ? ` (${t.key})` : ""} — Available in Chunk ${group.chunk}`}
                onClick={() => showToast(`⏳ ${t.label} tool available in Chunk ${group.chunk}`)}
              >
                <span style={styles.toolChestIcon}>{t.icon}</span>
                <span style={styles.toolChestLabel}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Profile Selector */}
      <div style={styles.toolGroup}>
        <div style={styles.toolGroupHeader}>
          <span>PROFILE</span>
        </div>
        <div style={styles.profileList}>
          {["Construction", "Estimator", "Design Review", "Punch", "Office"].map((p) => (
            <button key={p} style={styles.profileBtn} onClick={() => showToast(`⏳ Profile "${p}" — layout switching in later chunks`)}>
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RENAME MODAL ────────────────────────────────────────────
function RenameModal({ state, dispatch, executeRename }) {
  const close = () => dispatch({ type: "SET", payload: { renameModal: false, batchRenameMode: false } });

  return (
    <div style={styles.modalOverlay} onClick={close}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalTitle}>
              {state.batchRenameMode ? `BATCH RENAME (${state.multiSelect.length} files)` : "RENAME FILE"}
            </div>
            <div style={styles.modalSubtitle}>AEC Taxonomy: Class-Rev-Ver-Spec-Date-Client-Job-Desc</div>
          </div>
          <button style={styles.modalClose} onClick={close}>✕</button>
        </div>

        {/* Current File */}
        {!state.batchRenameMode && state.selectedFile && (
          <div style={styles.currentFile}>
            <span style={styles.currentFileLabel}>Current:</span>
            <span style={styles.currentFileName}>{state.selectedFile.name}</span>
          </div>
        )}

        {/* Taxonomy Quick Buttons */}
        <div style={styles.taxonomySections}>
          {Object.entries(TAXONOMY).map(([key, section]) => (
            <TaxonomySection
              key={key}
              fieldKey={key}
              section={section}
              value={state.renameFields[key]}
              onSelect={(val) => dispatch({ type: "SET_RENAME_FIELD", field: key, value: val })}
            />
          ))}

          {/* Free-text fields */}
          <div style={styles.taxSection}>
            <div style={styles.taxLabel}>Date</div>
            <input
              style={styles.taxInput}
              value={state.renameFields.Date}
              onChange={(e) => dispatch({ type: "SET_RENAME_FIELD", field: "Date", value: e.target.value })}
              placeholder="YYYYMMDD"
            />
            <button style={styles.taxTodayBtn} onClick={() => dispatch({ type: "SET_RENAME_FIELD", field: "Date", value: todayStamp() })}>
              Today
            </button>
          </div>

          <div style={styles.taxSection}>
            <div style={styles.taxLabel}>Client</div>
            <input
              style={styles.taxInput}
              value={state.renameFields.Client}
              onChange={(e) => dispatch({ type: "SET_RENAME_FIELD", field: "Client", value: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
              placeholder="e.g. ACME"
              maxLength={20}
            />
          </div>

          <div style={styles.taxSection}>
            <div style={styles.taxLabel}>Job #</div>
            <input
              style={styles.taxInput}
              value={state.renameFields.Job}
              onChange={(e) => dispatch({ type: "SET_RENAME_FIELD", field: "Job", value: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") })}
              placeholder="e.g. 2026-001"
              maxLength={20}
            />
          </div>

          <div style={styles.taxSection}>
            <div style={styles.taxLabel}>Description</div>
            <input
              style={{ ...styles.taxInput, flex: 1 }}
              value={state.renameFields.Desc}
              onChange={(e) => dispatch({ type: "SET_RENAME_FIELD", field: "Desc", value: e.target.value.replace(/[^a-zA-Z0-9_ -]/g, "").replace(/\s+/g, "_") })}
              placeholder="e.g. Floor_Plan_Level_2"
              maxLength={60}
            />
          </div>
        </div>

        {/* PREDICT BOX */}
        <div style={styles.predictBox}>
          <div style={styles.predictLabel}>PREDICTED FILENAME</div>
          <div style={styles.predictValue}>
            {state.renamePrediction || <span style={{ opacity: 0.3 }}>Select taxonomy fields to build filename…</span>}
          </div>
          {state.renamePrediction && (
            <div style={styles.predictParts}>
              {Object.entries(state.renameFields)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <span key={k} style={styles.predictPart}>
                    <span style={styles.predictPartKey}>{k}</span>
                    <span>{v}</span>
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={styles.modalActions}>
          <button style={styles.btnSecondary} onClick={close}>Cancel</button>
          <button style={styles.btnClear} onClick={() => dispatch({ type: "RESET_RENAME" })}>Clear All</button>
          <button
            style={{ ...styles.btnPrimary, opacity: state.renamePrediction ? 1 : 0.4 }}
            onClick={executeRename}
            disabled={!state.renamePrediction}
          >
            {state.batchRenameMode ? `Rename ${state.multiSelect.length} Files` : "Rename File"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaxonomySection({ fieldKey, section, value, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? section.options : section.options.slice(0, 6);

  return (
    <div style={styles.taxSection}>
      <div style={styles.taxLabel}>{section.label}</div>
      <div style={styles.taxBtnGrid}>
        {visible.map((opt) => (
          <button
            key={opt.code}
            style={{
              ...styles.taxBtn,
              background: value === opt.code ? "rgba(0,168,255,0.2)" : "rgba(255,255,255,0.03)",
              borderColor: value === opt.code ? "#00a8ff" : "#2a2d35",
              color: value === opt.code ? "#00a8ff" : "#8090a0",
            }}
            title={opt.desc}
            onClick={() => onSelect(value === opt.code ? "" : opt.code)}
          >
            {opt.code}
          </button>
        ))}
        {section.options.length > 6 && (
          <button style={styles.taxMoreBtn} onClick={() => setExpanded(!expanded)}>
            {expanded ? "Less ▲" : `+${section.options.length - 6} ▼`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── LOADED BANNER ───────────────────────────────────────────
function LoadedBanner({ name, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={styles.loadedBanner}>
      <span style={styles.loadedCheck}>✓</span>
      <span>File Loaded: <strong>{name}</strong></span>
    </div>
  );
}

// ─── UTILS ───────────────────────────────────────────────────
function countFiles(entries) {
  let count = 0;
  for (const e of entries) {
    if (e.kind === "file") count++;
    if (e.children) count += countFiles(e.children);
  }
  return count;
}

function flatFiles(entries) {
  const result = [];
  for (const e of entries) {
    if (e.kind === "file") result.push(e);
    if (e.children) result.push(...flatFiles(e.children));
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// STYLES — DARK MATTER THEME (#0f1115)
// ═══════════════════════════════════════════════════════════════
const styles = {
  root: {
    position: "fixed", inset: 0,
    background: "#0f1115",
    color: "#c8d0d8",
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
    fontSize: 12,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    userSelect: "none",
  },

  // ─── TITLE BAR ──────
  titleBar: {
    height: 36,
    background: "linear-gradient(180deg, #181b22 0%, #12141a 100%)",
    borderBottom: "1px solid #1e2128",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 8px",
    flexShrink: 0,
  },
  titleLeft: { display: "flex", alignItems: "center", gap: 8 },
  logoMark: { color: "#00a8ff", fontSize: 16, fontWeight: 900, lineHeight: 1 },
  titleText: { color: "#e0e8f0", fontWeight: 700, fontSize: 13, letterSpacing: 2 },
  titleEdition: { color: "#f0a030", fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", background: "rgba(240,160,48,0.1)", padding: "2px 6px", borderRadius: 3 },
  titleRight: { display: "flex", alignItems: "center", gap: 8 },
  titleVersion: { color: "#556", fontSize: 10, letterSpacing: 1 },

  // ─── MENU BAR ──────
  menuBar: { display: "flex", alignItems: "center", gap: 0 },
  menuGroup: { position: "relative" },
  menuBtn: {
    background: "transparent", border: "none", color: "#8090a0", padding: "6px 10px",
    fontSize: 12, cursor: "pointer", fontFamily: "inherit",
  },
  menuBtnActive: { background: "rgba(0,168,255,0.1)", color: "#00a8ff" },
  menuDropdown: {
    position: "absolute", top: "100%", left: 0, minWidth: 220,
    background: "#1a1d24", border: "1px solid #2a2d35", borderRadius: 6,
    boxShadow: "0 12px 40px rgba(0,0,0,0.6)", zIndex: 1000, padding: "4px 0",
  },
  menuItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    width: "100%", padding: "7px 14px", background: "transparent", border: "none",
    color: "#b0bcc8", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
  },
  menuItemDisabled: { opacity: 0.35, cursor: "default" },
  menuShortcut: { color: "#556", fontSize: 10, marginLeft: 20 },
  menuDivider: { height: 1, background: "#2a2d35", margin: "4px 10px" },

  // ─── TOOLBAR ──────
  toolbar: {
    height: 36, background: "#14171d", borderBottom: "1px solid #1e2128",
    display: "flex", alignItems: "center", padding: "0 8px", gap: 2, flexShrink: 0,
  },
  toolBtn: {
    background: "transparent", border: "1px solid transparent", borderRadius: 4,
    width: 32, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", fontSize: 14, transition: "all 0.15s",
  },
  toolSep: { width: 1, height: 20, background: "#2a2d35", margin: "0 4px" },

  // ─── MAIN CONTAINER ──────
  mainContainer: { flex: 1, display: "flex", overflow: "hidden" },

  // ─── EXPLORER ──────
  explorerPanel: {
    background: "#12141a", borderRight: "1px solid #1e2128",
    display: "flex", flexDirection: "column", flexShrink: 0,
  },
  explorerInner: { display: "flex", flexDirection: "column", height: "100%" },
  panelHeader: {
    height: 32, display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 12px", background: "#161920", borderBottom: "1px solid #1e2128", flexShrink: 0,
  },
  panelTitle: { color: "#607080", fontSize: 10, fontWeight: 700, letterSpacing: 1.5 },
  panelAction: {
    background: "transparent", border: "none", color: "#607080", cursor: "pointer",
    fontSize: 16, lineHeight: 1, padding: "0 4px", fontFamily: "inherit",
  },
  filterBox: {
    padding: "6px 8px", borderBottom: "1px solid #1e2128", display: "flex",
    alignItems: "center", gap: 4, flexShrink: 0,
  },
  filterInput: {
    flex: 1, background: "#0c0e12", border: "1px solid #1e2128", borderRadius: 4,
    padding: "5px 8px", color: "#c8d0d8", fontSize: 11, fontFamily: "inherit", outline: "none",
  },
  filterClear: {
    background: "transparent", border: "none", color: "#607080", cursor: "pointer",
    fontSize: 12, fontFamily: "inherit",
  },
  fileTree: { flex: 1, overflowY: "auto", overflowX: "hidden", padding: "4px 0" },
  fileRow: {
    display: "flex", alignItems: "center", gap: 8, width: "100%",
    padding: "4px 12px", background: "transparent", border: "none", borderLeft: "2px solid transparent",
    color: "#b0bcc8", cursor: "pointer", fontFamily: "inherit", fontSize: 12, textAlign: "left",
    transition: "background 0.1s",
  },
  fileIcon: { flexShrink: 0 },
  fileTypeBadge: {
    flexShrink: 0, fontSize: 8, fontWeight: 700, letterSpacing: 0.5,
    padding: "2px 4px", borderRadius: 3, minWidth: 28, textAlign: "center",
  },
  fileName: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  multiDot: { color: "#f0a030", fontSize: 8, marginLeft: "auto", flexShrink: 0 },
  emptyExplorer: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: 32, height: "100%",
  },
  openBtn: {
    marginTop: 12, background: "rgba(0,168,255,0.12)", border: "1px solid #00a8ff",
    borderRadius: 6, color: "#00a8ff", padding: "8px 20px", cursor: "pointer",
    fontFamily: "inherit", fontSize: 12, fontWeight: 600,
  },
  workspaceInfo: {
    padding: "8px 12px", borderTop: "1px solid #1e2128", flexShrink: 0,
  },
  workspaceName: { color: "#00a8ff", fontSize: 10, fontWeight: 600 },

  // ─── CANVAS ──────
  canvasArea: { flex: 1, overflow: "hidden", display: "flex" },
  canvasInner: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    background: "radial-gradient(ellipse at center, #14171d 0%, #0c0e12 70%)",
    position: "relative",
  },
  canvasEmpty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  canvasLogo: { fontSize: 48, color: "#00a8ff", opacity: 0.15, fontWeight: 900 },
  canvasTitle: { fontSize: 28, fontWeight: 800, color: "#2a3040", letterSpacing: 6 },
  canvasSubtitle: { fontSize: 11, color: "#3a4050", letterSpacing: 3, textTransform: "uppercase" },
  canvasHint: { fontSize: 11, color: "#404858", marginTop: 8 },
  chunkMap: { display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap", justifyContent: "center" },
  chunkBadge: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    border: "1px solid #2a2d35", borderRadius: 8, padding: "10px 14px", minWidth: 100,
  },
  chunkN: { fontSize: 10, fontWeight: 700, letterSpacing: 1 },
  chunkActive: { fontSize: 8, fontWeight: 700, color: "#00a8ff", letterSpacing: 1.5, background: "rgba(0,168,255,0.1)", padding: "2px 6px", borderRadius: 3 },
  canvasLoaded: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  canvasFileIcon: { fontSize: 32, fontWeight: 900, letterSpacing: 2 },
  canvasFileName: { fontSize: 18, fontWeight: 700, color: "#e0e8f0" },
  canvasFileType: { fontSize: 11, color: "#607080", textTransform: "uppercase", letterSpacing: 2 },
  canvasReady: { display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#7a8a9a" },
  readyDot: { width: 8, height: 8, borderRadius: "50%" },
  canvasGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16,
    background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 16,
  },
  canvasGridItem: { display: "flex", flexDirection: "column", gap: 4 },
  gridLabel: { fontSize: 9, color: "#556", textTransform: "uppercase", letterSpacing: 1 },
  gridValue: { fontSize: 11, color: "#90a0b0" },

  // ─── TOOL CHEST ──────
  toolChestPanel: {
    background: "#12141a", borderLeft: "1px solid #1e2128",
    display: "flex", flexDirection: "column", flexShrink: 0,
  },
  toolChestInner: { display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" },
  toolGroup: { borderBottom: "1px solid #1e2128" },
  toolGroupHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 12px", background: "rgba(255,255,255,0.02)",
  },
  chunkTag: { fontSize: 8, color: "#556", background: "rgba(255,255,255,0.03)", padding: "2px 6px", borderRadius: 3 },
  toolGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "4px 8px 8px" },
  toolChestBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    background: "rgba(255,255,255,0.02)", border: "1px solid #1e2128", borderRadius: 4,
    padding: "8px 4px", cursor: "pointer", color: "#7a8a9a", fontFamily: "inherit",
    transition: "all 0.15s",
  },
  toolChestIcon: { fontSize: 16 },
  toolChestLabel: { fontSize: 9, letterSpacing: 0.3 },
  profileList: { display: "flex", flexDirection: "column", gap: 2, padding: "4px 8px 8px" },
  profileBtn: {
    background: "rgba(255,255,255,0.02)", border: "1px solid #1e2128", borderRadius: 4,
    padding: "6px 10px", color: "#7a8a9a", cursor: "pointer", fontFamily: "inherit",
    fontSize: 11, textAlign: "left",
  },

  // ─── STATUS BAR ──────
  statusBar: {
    height: 24, background: "#0c0e12", borderTop: "1px solid #1e2128",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 12px", fontSize: 10, color: "#506070", flexShrink: 0,
  },
  statusRight: { color: "#405060" },

  // ─── MODAL ──────
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#181b22", border: "1px solid #2a2d35", borderRadius: 12,
    width: 680, maxHeight: "85vh", overflow: "hidden", display: "flex",
    flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "16px 20px 12px", borderBottom: "1px solid #1e2128",
  },
  modalTitle: { fontSize: 15, fontWeight: 700, color: "#e0e8f0", letterSpacing: 1 },
  modalSubtitle: { fontSize: 10, color: "#556", marginTop: 4, letterSpacing: 0.5 },
  modalClose: {
    background: "transparent", border: "none", color: "#556", cursor: "pointer",
    fontSize: 16, padding: "0 4px", fontFamily: "inherit",
  },
  currentFile: {
    display: "flex", alignItems: "center", gap: 8, padding: "8px 20px",
    background: "rgba(0,0,0,0.2)", borderBottom: "1px solid #1e2128",
  },
  currentFileLabel: { fontSize: 10, color: "#556" },
  currentFileName: { fontSize: 12, color: "#90a0b0", fontWeight: 600 },

  // ─── TAXONOMY ──────
  taxonomySections: { padding: "12px 20px", overflowY: "auto", flex: 1, maxHeight: "45vh" },
  taxSection: { marginBottom: 12, display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 8 },
  taxLabel: {
    width: "100%", fontSize: 10, fontWeight: 700, color: "#607080",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 2,
  },
  taxBtnGrid: { display: "flex", flexWrap: "wrap", gap: 4, flex: 1 },
  taxBtn: {
    padding: "5px 10px", borderRadius: 4, border: "1px solid #2a2d35",
    background: "rgba(255,255,255,0.03)", color: "#8090a0", cursor: "pointer",
    fontFamily: "inherit", fontSize: 11, fontWeight: 600, transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  taxMoreBtn: {
    padding: "5px 10px", borderRadius: 4, border: "1px dashed #2a2d35",
    background: "transparent", color: "#556", cursor: "pointer",
    fontFamily: "inherit", fontSize: 10,
  },
  taxInput: {
    background: "#0c0e12", border: "1px solid #2a2d35", borderRadius: 4,
    padding: "6px 10px", color: "#c8d0d8", fontSize: 12, fontFamily: "inherit",
    outline: "none", width: 160,
  },
  taxTodayBtn: {
    padding: "6px 10px", borderRadius: 4, border: "1px solid #2a2d35",
    background: "rgba(0,168,255,0.08)", color: "#00a8ff", cursor: "pointer",
    fontFamily: "inherit", fontSize: 10, fontWeight: 600,
  },

  // ─── PREDICT BOX ──────
  predictBox: {
    margin: "0 20px 12px", padding: 14, background: "#0c0e12",
    border: "1px solid #2a2d35", borderRadius: 8,
  },
  predictLabel: { fontSize: 9, fontWeight: 700, color: "#00a8ff", letterSpacing: 1.5, marginBottom: 6 },
  predictValue: {
    fontSize: 14, fontWeight: 700, color: "#e0e8f0", wordBreak: "break-all",
    padding: "8px 0", borderBottom: "1px solid #1e2128",
  },
  predictParts: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 },
  predictPart: {
    display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10,
    background: "rgba(0,168,255,0.06)", padding: "3px 8px", borderRadius: 4, color: "#90a0b0",
  },
  predictPartKey: { color: "#00a8ff", fontWeight: 700, fontSize: 9 },

  // ─── MODAL ACTIONS ──────
  modalActions: {
    display: "flex", justifyContent: "flex-end", gap: 8,
    padding: "12px 20px", borderTop: "1px solid #1e2128",
  },
  btnPrimary: {
    background: "#00a8ff", color: "#fff", border: "none", borderRadius: 6,
    padding: "8px 20px", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
  },
  btnSecondary: {
    background: "transparent", color: "#8090a0", border: "1px solid #2a2d35", borderRadius: 6,
    padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 12,
  },
  btnClear: {
    background: "transparent", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 6,
    padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 12,
  },

  // ─── TOAST ──────
  toast: {
    position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
    background: "#1a1d24", border: "1px solid #2a2d35", borderRadius: 8,
    padding: "10px 20px", color: "#c8d0d8", fontSize: 12, zIndex: 10000,
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)", whiteSpace: "nowrap",
    animation: "fadeInUp 0.2s ease",
  },

  // ─── LOADED BANNER ──────
  loadedBanner: {
    position: "fixed", top: 80, right: 20,
    background: "rgba(46,204,113,0.12)", border: "1px solid rgba(46,204,113,0.3)",
    borderRadius: 8, padding: "10px 16px", color: "#2ecc71",
    display: "flex", alignItems: "center", gap: 8, fontSize: 12, zIndex: 10000,
    animation: "fadeInRight 0.3s ease",
  },
  loadedCheck: { fontSize: 16, fontWeight: 700 },
};
