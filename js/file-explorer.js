/* ═══════════════════════════════════════════════════════════════════
   OMNI-VIEW — File Explorer Module
   Handles: Drag-and-drop reorder (future), context menu, file ops
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const FileExplorer = (() => {

  /* ── CONTEXT MENU ─────────────────────────────────────────────── */
  let contextMenuEl = null;

  function createContextMenu() {
    contextMenuEl = document.createElement('div');
    contextMenuEl.id = 'context-menu';
    Object.assign(contextMenuEl.style, {
      position: 'fixed',
      display: 'none',
      background: 'var(--bg-surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: '2000',
      minWidth: '160px',
      padding: '4px 0',
      fontSize: '12px',
    });
    document.body.appendChild(contextMenuEl);
  }

  function showContextMenu(x, y, items) {
    contextMenuEl.innerHTML = '';
    items.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        Object.assign(sep.style, {
          height: '1px',
          background: 'var(--border)',
          margin: '4px 0',
        });
        contextMenuEl.appendChild(sep);
        return;
      }
      const btn = document.createElement('button');
      btn.textContent = item.label;
      Object.assign(btn.style, {
        display: 'block',
        width: '100%',
        padding: '6px 14px',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        color: item.danger ? 'var(--danger)' : 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '12px',
        fontFamily: 'inherit',
      });
      btn.addEventListener('mouseenter', () => btn.style.background = 'var(--bg-hover)');
      btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
      btn.addEventListener('click', () => {
        hideContextMenu();
        item.action();
      });
      contextMenuEl.appendChild(btn);
    });

    // Position
    contextMenuEl.style.display = 'block';
    const rect = contextMenuEl.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 8;
    const maxY = window.innerHeight - rect.height - 8;
    contextMenuEl.style.left = Math.min(x, maxX) + 'px';
    contextMenuEl.style.top = Math.min(y, maxY) + 'px';
  }

  function hideContextMenu() {
    if (contextMenuEl) contextMenuEl.style.display = 'none';
  }

  /* ── FILE OPERATIONS ──────────────────────────────────────────── */

  async function deleteFile(entry) {
    const confirmed = await OmniView.showModal(
      'Delete File',
      `<p>Are you sure you want to delete <strong>${OmniView.escapeHTML(entry.name)}</strong>?</p>
       <p style="color:var(--danger);margin-top:8px;font-size:12px;">This action cannot be undone.</p>`,
      'Delete'
    );
    if (!confirmed) return;

    try {
      // Find parent directory handle
      const parentPath = entry.path.includes('/') ?
        entry.path.substring(0, entry.path.lastIndexOf('/')) : '';
      const parentHandle = parentPath ?
        OmniView.state.dirHandleMap.get(parentPath) :
        OmniView.state.workspaceDirHandle;

      if (!parentHandle) {
        OmniView.toast('Could not find parent directory', 'error');
        return;
      }

      await parentHandle.removeEntry(entry.name);
      OmniView.toast(`Deleted: ${entry.name}`, 'success');

      // If this was the selected file, clear canvas
      if (OmniView.state.selectedFile && OmniView.state.selectedFile.path === entry.path) {
        OmniView.state.selectedFile = null;
        OmniView.dom.canvasWelcome.classList.remove('hidden');
        OmniView.dom.canvasContent.classList.add('hidden');
        OmniView.dom.canvasToolbar.classList.add('hidden');
      }

      await OmniView.scanDirectory();
    } catch (err) {
      OmniView.toast(`Delete failed: ${err.message}`, 'error');
    }
  }

  async function duplicateFile(entry) {
    try {
      const parentPath = entry.path.includes('/') ?
        entry.path.substring(0, entry.path.lastIndexOf('/')) : '';
      const parentHandle = parentPath ?
        OmniView.state.dirHandleMap.get(parentPath) :
        OmniView.state.workspaceDirHandle;

      if (!parentHandle) {
        OmniView.toast('Could not find parent directory', 'error');
        return;
      }

      const ext = OmniView.getFileExt(entry.name);
      const base = ext ? entry.name.slice(0, -(ext.length + 1)) : entry.name;
      const newName = ext ? `${base}_copy.${ext}` : `${base}_copy`;

      const sourceFile = await entry.handle.getFile();
      const newHandle = await parentHandle.getFileHandle(newName, { create: true });
      const writable = await newHandle.createWritable();
      await writable.write(await sourceFile.arrayBuffer());
      await writable.close();

      OmniView.toast(`Duplicated: ${newName}`, 'success');
      await OmniView.scanDirectory();
    } catch (err) {
      OmniView.toast(`Duplicate failed: ${err.message}`, 'error');
    }
  }

  /* ── RIGHT-CLICK HANDLER ──────────────────────────────────────── */
  function init() {
    createContextMenu();

    document.addEventListener('click', hideContextMenu);
    document.addEventListener('contextmenu', (e) => {
      const treeItem = e.target.closest('.tree-item[data-path]');
      if (!treeItem) {
        hideContextMenu();
        return;
      }
      e.preventDefault();

      const path = treeItem.dataset.path;
      const entry = OmniView.state.files.find(f => f.path === path);
      if (!entry) return;

      showContextMenu(e.clientX, e.clientY, [
        {
          label: 'Open',
          action: () => OmniView.selectFile(entry, treeItem),
        },
        {
          label: 'Rename (use Taxonomy)',
          action: () => {
            OmniView.selectFile(entry, treeItem);
            OmniView.toast('Use the Renaming Engine panel on the right', 'info');
          },
        },
        {
          label: 'Duplicate',
          action: () => duplicateFile(entry),
        },
        { separator: true },
        {
          label: 'Delete',
          danger: true,
          action: () => deleteFile(entry),
        },
      ]);
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { deleteFile, duplicateFile };
})();
