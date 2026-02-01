/* ═══════════════════════════════════════════════════════════════════
   OMNI-VIEW — Core Application Module
   Handles: Initialization, layout, resize, toasts, modals
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const OmniView = (() => {

  /* ── STATE ────────────────────────────────────────────────────── */
  const state = {
    workspaceDirHandle: null,   // FileSystemDirectoryHandle
    workspacePath: '',
    files: [],                  // flat array of { handle, name, kind, path, size, type, parentPath }
    directories: [],            // directory handles tree
    selectedFile: null,         // currently active file entry
    checkedFiles: new Set(),    // multi-select set (file paths)
    fileHandleMap: new Map(),   // path -> FileSystemFileHandle
    dirHandleMap: new Map(),    // path -> FileSystemDirectoryHandle
  };

  /* ── DOM REFS ─────────────────────────────────────────────────── */
  const dom = {};

  function cacheDom() {
    dom.btnOpenFolder     = document.getElementById('btn-open-folder');
    dom.btnOpenFolderEmpty= document.getElementById('btn-open-folder-empty');
    dom.btnRefresh        = document.getElementById('btn-refresh');
    dom.btnCollapseAll    = document.getElementById('btn-collapse-all');
    dom.btnSelectAll      = document.getElementById('btn-select-all');
    dom.workspacePath     = document.getElementById('workspace-path-display');
    dom.statusIndicator   = document.getElementById('status-indicator');
    dom.explorerSearch    = document.getElementById('explorer-search');
    dom.fileTreeContainer = document.getElementById('file-tree-container');
    dom.fileTreeEmpty     = document.getElementById('file-tree-empty');
    dom.fileTree          = document.getElementById('file-tree');
    dom.batchActionBar    = document.getElementById('batch-action-bar');
    dom.batchCount        = document.getElementById('batch-count');
    dom.btnBatchRename    = document.getElementById('btn-batch-rename');
    dom.canvasToolbar     = document.getElementById('canvas-toolbar');
    dom.canvasFilename    = document.getElementById('canvas-filename');
    dom.canvasTypeBadge   = document.getElementById('canvas-filetype-badge');
    dom.canvasWelcome     = document.getElementById('canvas-welcome');
    dom.canvasContent     = document.getElementById('canvas-content');
    dom.toastContainer    = document.getElementById('toast-container');
    dom.modalOverlay      = document.getElementById('modal-overlay');
    dom.modalTitle        = document.getElementById('modal-title');
    dom.modalBody         = document.getElementById('modal-body');
    dom.modalClose        = document.getElementById('modal-close');
    dom.modalCancel       = document.getElementById('modal-cancel');
    dom.modalConfirm      = document.getElementById('modal-confirm');
    dom.paneExplorer      = document.getElementById('pane-explorer');
    dom.paneToolchest     = document.getElementById('pane-toolchest');
  }

  /* ── FILE TYPE UTILITIES ──────────────────────────────────────── */
  const FILE_TYPES = {
    pdf:  { icon: '📄', label: 'PDF',   iconClass: 'file-icon-pdf',  badgeClass: 'badge-pdf'  },
    docx: { icon: '📝', label: 'DOCX',  iconClass: 'file-icon-doc',  badgeClass: 'badge-doc'  },
    doc:  { icon: '📝', label: 'DOC',   iconClass: 'file-icon-doc',  badgeClass: 'badge-doc'  },
    xlsx: { icon: '📊', label: 'XLSX',  iconClass: 'file-icon-xls',  badgeClass: 'badge-xls'  },
    xls:  { icon: '📊', label: 'XLS',   iconClass: 'file-icon-xls',  badgeClass: 'badge-xls'  },
    csv:  { icon: '📊', label: 'CSV',   iconClass: 'file-icon-xls',  badgeClass: 'badge-xls'  },
    png:  { icon: '🖼️', label: 'PNG',   iconClass: 'file-icon-img',  badgeClass: 'badge-img'  },
    jpg:  { icon: '🖼️', label: 'JPG',   iconClass: 'file-icon-img',  badgeClass: 'badge-img'  },
    jpeg: { icon: '🖼️', label: 'JPEG',  iconClass: 'file-icon-img',  badgeClass: 'badge-img'  },
    gif:  { icon: '🖼️', label: 'GIF',   iconClass: 'file-icon-img',  badgeClass: 'badge-img'  },
    bmp:  { icon: '🖼️', label: 'BMP',   iconClass: 'file-icon-img',  badgeClass: 'badge-img'  },
    tif:  { icon: '🖼️', label: 'TIF',   iconClass: 'file-icon-img',  badgeClass: 'badge-img'  },
    tiff: { icon: '🖼️', label: 'TIFF',  iconClass: 'file-icon-img',  badgeClass: 'badge-img'  },
    svg:  { icon: '🖼️', label: 'SVG',   iconClass: 'file-icon-img',  badgeClass: 'badge-img'  },
    dwg:  { icon: '📐', label: 'DWG',   iconClass: 'file-icon-cad',  badgeClass: 'badge-default' },
    dxf:  { icon: '📐', label: 'DXF',   iconClass: 'file-icon-cad',  badgeClass: 'badge-default' },
    txt:  { icon: '📃', label: 'TXT',   iconClass: 'file-icon-txt',  badgeClass: 'badge-txt'  },
    rtf:  { icon: '📃', label: 'RTF',   iconClass: 'file-icon-txt',  badgeClass: 'badge-txt'  },
  };

  function getFileExt(name) {
    const dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
  }

  function getFileType(name) {
    const ext = getFileExt(name);
    return FILE_TYPES[ext] || { icon: '📁', label: ext.toUpperCase() || 'FILE', iconClass: 'file-icon-default', badgeClass: 'badge-default' };
  }

  function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  }

  /* ── TOAST SYSTEM ─────────────────────────────────────────────── */
  function toast(message, type = 'info', duration = 3500) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    dom.toastContainer.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-out');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  }

  /* ── MODAL SYSTEM ─────────────────────────────────────────────── */
  let modalResolve = null;

  function showModal(title, bodyHTML, confirmText = 'Confirm') {
    dom.modalTitle.textContent = title;
    dom.modalBody.innerHTML = bodyHTML;
    dom.modalConfirm.textContent = confirmText;
    dom.modalOverlay.classList.remove('hidden');
    return new Promise(resolve => { modalResolve = resolve; });
  }

  function closeModal(result) {
    dom.modalOverlay.classList.add('hidden');
    if (modalResolve) { modalResolve(result); modalResolve = null; }
  }

  /* ── RESIZE HANDLES ───────────────────────────────────────────── */
  function initResize() {
    const handles = document.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
      let startX, startWidth, target;

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handle.classList.add('active');
        startX = e.clientX;

        if (handle.dataset.resize === 'explorer') {
          target = dom.paneExplorer;
        } else {
          target = dom.paneToolchest;
        }
        startWidth = target.getBoundingClientRect().width;

        const onMove = (ev) => {
          const delta = ev.clientX - startX;
          let newW;
          if (handle.dataset.resize === 'explorer') {
            newW = startWidth + delta;
          } else {
            newW = startWidth - delta;
          }
          const minW = parseInt(getComputedStyle(target).minWidth) || 200;
          const maxW = parseInt(getComputedStyle(target).maxWidth) || 600;
          target.style.width = Math.max(minW, Math.min(maxW, newW)) + 'px';
        };
        const onUp = () => {
          handle.classList.remove('active');
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  /* ── FILE SYSTEM ACCESS API ───────────────────────────────────── */
  async function openWorkspace() {
    if (!('showDirectoryPicker' in window)) {
      toast('File System Access API not supported. Use Chrome or Edge.', 'error', 5000);
      return;
    }
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      state.workspaceDirHandle = dirHandle;
      state.workspacePath = dirHandle.name;
      dom.workspacePath.textContent = dirHandle.name;
      dom.workspacePath.title = dirHandle.name;
      dom.btnRefresh.disabled = false;
      dom.statusIndicator.classList.add('active');
      toast(`Workspace opened: ${dirHandle.name}`, 'success');
      await scanDirectory();
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast(`Failed to open folder: ${err.message}`, 'error');
      }
    }
  }

  async function scanDirectory() {
    if (!state.workspaceDirHandle) return;
    state.files = [];
    state.fileHandleMap.clear();
    state.dirHandleMap.clear();
    state.checkedFiles.clear();

    const tree = await buildTree(state.workspaceDirHandle, '');
    renderTree(tree);
    updateBatchBar();

    dom.fileTreeEmpty.classList.add('hidden');
    dom.fileTree.classList.remove('hidden');
  }

  async function buildTree(dirHandle, parentPath) {
    const entries = [];
    try {
      for await (const [name, handle] of dirHandle.entries()) {
        const path = parentPath ? `${parentPath}/${name}` : name;
        if (handle.kind === 'file') {
          let size = 0;
          try {
            const file = await handle.getFile();
            size = file.size;
          } catch (e) { /* permission denied, skip size */ }
          const entry = { name, kind: 'file', path, size, handle, type: getFileType(name) };
          state.files.push(entry);
          state.fileHandleMap.set(path, handle);
          entries.push(entry);
        } else if (handle.kind === 'directory') {
          state.dirHandleMap.set(path, handle);
          const children = await buildTree(handle, path);
          entries.push({ name, kind: 'directory', path, handle, children });
        }
      }
    } catch (err) {
      toast(`Error reading directory: ${err.message}`, 'error');
    }
    // Sort: directories first, then files alphabetically
    entries.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
    return entries;
  }

  /* ── FILE TREE RENDERING ──────────────────────────────────────── */
  function renderTree(entries) {
    dom.fileTree.innerHTML = '';
    entries.forEach(entry => {
      dom.fileTree.appendChild(createTreeNode(entry));
    });
  }

  function createTreeNode(entry) {
    if (entry.kind === 'directory') {
      return createFolderNode(entry);
    }
    return createFileNode(entry);
  }

  function createFolderNode(entry) {
    const li = document.createElement('li');
    li.className = 'tree-folder';
    li.dataset.path = entry.path;

    const row = document.createElement('div');
    row.className = 'tree-item';

    const arrow = document.createElement('span');
    arrow.className = 'folder-arrow';
    arrow.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 2l4 3-4 3" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

    const icon = document.createElement('span');
    icon.className = 'item-icon';
    icon.textContent = '📁';

    const name = document.createElement('span');
    name.className = 'item-name';
    name.textContent = entry.name;

    row.appendChild(arrow);
    row.appendChild(icon);
    row.appendChild(name);

    row.addEventListener('click', () => {
      li.classList.toggle('collapsed');
    });

    li.appendChild(row);

    if (entry.children && entry.children.length > 0) {
      const childUl = document.createElement('ul');
      childUl.className = 'tree-children';
      entry.children.forEach(child => {
        childUl.appendChild(createTreeNode(child));
      });
      li.appendChild(childUl);
    }

    return li;
  }

  function createFileNode(entry) {
    const li = document.createElement('li');

    const row = document.createElement('div');
    row.className = 'tree-item';
    row.dataset.path = entry.path;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'item-checkbox';
    checkbox.checked = state.checkedFiles.has(entry.path);
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      if (checkbox.checked) {
        state.checkedFiles.add(entry.path);
      } else {
        state.checkedFiles.delete(entry.path);
      }
      updateBatchBar();
    });
    checkbox.addEventListener('click', (e) => e.stopPropagation());

    const icon = document.createElement('span');
    icon.className = `item-icon ${entry.type.iconClass}`;
    icon.textContent = entry.type.icon;

    const name = document.createElement('span');
    name.className = 'item-name';
    name.textContent = entry.name;

    const size = document.createElement('span');
    size.className = 'item-size';
    size.textContent = formatSize(entry.size);

    row.appendChild(checkbox);
    row.appendChild(icon);
    row.appendChild(name);
    row.appendChild(size);

    row.addEventListener('click', () => selectFile(entry, row));

    li.appendChild(row);
    return li;
  }

  /* ── FILE SELECTION ───────────────────────────────────────────── */
  function selectFile(entry, rowEl) {
    // Remove active from all
    document.querySelectorAll('.tree-item.active').forEach(el => el.classList.remove('active'));
    rowEl.classList.add('active');

    state.selectedFile = entry;

    // Update canvas
    dom.canvasWelcome.classList.add('hidden');
    dom.canvasContent.classList.remove('hidden');
    dom.canvasToolbar.classList.remove('hidden');

    dom.canvasFilename.textContent = entry.name;
    dom.canvasTypeBadge.textContent = entry.type.label;
    dom.canvasTypeBadge.className = '';
    dom.canvasTypeBadge.classList.add(entry.type.badgeClass);

    // Show "File Loaded" confirmation card
    dom.canvasContent.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'file-loaded-card';
    card.innerHTML = `
      <div class="loaded-icon">${entry.type.icon}</div>
      <h3>${escapeHTML(entry.name)}</h3>
      <div class="loaded-meta">
        <span>${entry.type.label}</span>
        <span>${formatSize(entry.size)}</span>
        <span>${escapeHTML(entry.path)}</span>
      </div>
      <div class="file-loaded-check">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5"/></svg>
        File Loaded Successfully
      </div>
    `;
    dom.canvasContent.appendChild(card);

    // Update rename panel
    if (typeof RenamingEngine !== 'undefined') {
      RenamingEngine.setActiveFile(entry);
    }

    toast(`Loaded: ${entry.name}`, 'info', 2000);
  }

  /* ── BATCH SELECTION ──────────────────────────────────────────── */
  function updateBatchBar() {
    const count = state.checkedFiles.size;
    if (count > 0) {
      dom.batchActionBar.classList.remove('hidden');
      dom.batchCount.textContent = `${count} selected`;
    } else {
      dom.batchActionBar.classList.add('hidden');
    }
  }

  function selectAllFiles() {
    const checkboxes = dom.fileTree.querySelectorAll('.item-checkbox');
    const allChecked = state.checkedFiles.size === state.files.length;
    checkboxes.forEach(cb => {
      cb.checked = !allChecked;
    });
    if (allChecked) {
      state.checkedFiles.clear();
    } else {
      state.files.forEach(f => state.checkedFiles.add(f.path));
    }
    updateBatchBar();
  }

  function collapseAll() {
    dom.fileTree.querySelectorAll('.tree-folder').forEach(f => {
      f.classList.add('collapsed');
    });
  }

  /* ── SEARCH / FILTER ──────────────────────────────────────────── */
  function filterTree(query) {
    const q = query.toLowerCase().trim();
    const items = dom.fileTree.querySelectorAll('.tree-item[data-path]');
    const folders = dom.fileTree.querySelectorAll('.tree-folder');

    if (!q) {
      items.forEach(el => el.parentElement.style.display = '');
      folders.forEach(f => f.style.display = '');
      return;
    }

    // Hide all folders initially, show matching files
    folders.forEach(f => f.style.display = 'none');
    items.forEach(el => {
      const path = (el.dataset.path || '').toLowerCase();
      const match = path.includes(q);
      el.parentElement.style.display = match ? '' : 'none';
      // Show parent folders if a child matches
      if (match) {
        let parent = el.parentElement.parentElement;
        while (parent && parent !== dom.fileTree) {
          parent.style.display = '';
          if (parent.classList.contains('tree-folder')) {
            parent.classList.remove('collapsed');
          }
          parent = parent.parentElement;
        }
      }
    });
  }

  /* ── UTILITY ──────────────────────────────────────────────────── */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ── INIT ─────────────────────────────────────────────────────── */
  function init() {
    cacheDom();
    initResize();

    // Open folder buttons
    dom.btnOpenFolder.addEventListener('click', openWorkspace);
    dom.btnOpenFolderEmpty.addEventListener('click', openWorkspace);
    dom.btnRefresh.addEventListener('click', () => scanDirectory());
    dom.btnCollapseAll.addEventListener('click', collapseAll);
    dom.btnSelectAll.addEventListener('click', selectAllFiles);

    // Search
    dom.explorerSearch.addEventListener('input', (e) => filterTree(e.target.value));

    // Modal
    dom.modalClose.addEventListener('click', () => closeModal(false));
    dom.modalCancel.addEventListener('click', () => closeModal(false));
    dom.modalConfirm.addEventListener('click', () => closeModal(true));
    dom.modalOverlay.addEventListener('click', (e) => {
      if (e.target === dom.modalOverlay) closeModal(false);
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal(false);
    });

    // Check API support
    if (!('showDirectoryPicker' in window)) {
      toast('File System Access API not available. Please use Chrome 86+ or Edge 86+.', 'warning', 8000);
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  /* ── PUBLIC API ───────────────────────────────────────────────── */
  return {
    get state() { return state; },
    get dom() { return dom; },
    toast,
    showModal,
    closeModal,
    getFileExt,
    getFileType,
    formatSize,
    escapeHTML,
    scanDirectory,
    selectFile,
  };

})();
