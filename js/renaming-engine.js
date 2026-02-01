/* ═══════════════════════════════════════════════════════════════════
   OMNI-VIEW — Renaming Engine Module
   Taxonomy: Class – Rev – Ver – Spec – Date – Client – Job – Desc
   Features: Quick buttons, predictive text, live preview,
             batch rename, rename history with undo
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const RenamingEngine = (() => {

  /* ── TAXONOMY STATE ───────────────────────────────────────────── */
  const taxonomy = {
    class: '',
    rev: '',
    ver: '',
    spec: '',
    date: '',
    client: '',
    job: '',
    desc: '',
  };

  // Active file being renamed
  let activeFile = null;

  // History tracking
  const renameHistory = [];
  const MAX_HISTORY = 50;

  // Predictive text memory (persisted in localStorage)
  const STORAGE_KEY_CLIENTS = 'omniview_clients';
  const STORAGE_KEY_JOBS = 'omniview_jobs';

  let knownClients = loadArray(STORAGE_KEY_CLIENTS);
  let knownJobs = loadArray(STORAGE_KEY_JOBS);

  /* ── DOM REFS ─────────────────────────────────────────────────── */
  const dom = {};

  function cacheDom() {
    dom.currentName    = document.getElementById('rename-current-name');
    dom.preview        = document.getElementById('rename-preview');
    dom.dateInput      = document.getElementById('tax-date');
    dom.btnDateToday   = document.getElementById('btn-date-today');
    dom.clientInput    = document.getElementById('tax-client');
    dom.clientPredict  = document.getElementById('client-predict');
    dom.jobInput       = document.getElementById('tax-job');
    dom.jobPredict     = document.getElementById('job-predict');
    dom.descInput      = document.getElementById('tax-desc');
    dom.btnApply       = document.getElementById('btn-apply-rename');
    dom.btnClear       = document.getElementById('btn-clear-rename');
    dom.btnBatchRename = document.getElementById('btn-batch-rename');
    dom.historyList    = document.getElementById('rename-history');
  }

  /* ── LOCAL STORAGE HELPERS ────────────────────────────────────── */
  function loadArray(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }

  function saveArray(key, arr) {
    try {
      localStorage.setItem(key, JSON.stringify(arr));
    } catch { /* storage full, ignore */ }
  }

  function addToKnown(arr, storageKey, value) {
    const v = value.trim().toUpperCase();
    if (!v || arr.includes(v)) return;
    arr.unshift(v);
    if (arr.length > 100) arr.length = 100;
    saveArray(storageKey, arr);
  }

  /* ── TAXONOMY BUILDER ─────────────────────────────────────────── */

  /**
   * Build the new filename from taxonomy segments.
   * Format: CLASS-REV-VER-SPEC-DATE-CLIENT-JOB-DESC.ext
   * Empty segments are skipped. Separator is hyphen.
   */
  function buildName() {
    if (!activeFile) return '';

    const ext = OmniView.getFileExt(activeFile.name);
    const segments = [
      taxonomy.class,
      taxonomy.rev,
      taxonomy.ver,
      taxonomy.spec,
      taxonomy.date,
      taxonomy.client,
      taxonomy.job,
      taxonomy.desc,
    ].filter(s => s.trim() !== '');

    if (segments.length === 0) return '';

    const base = segments.join('-');
    return ext ? `${base}.${ext}` : base;
  }

  function updatePreview() {
    const name = buildName();
    if (name) {
      dom.preview.textContent = name;
      dom.preview.style.color = '';
      dom.btnApply.disabled = false;
    } else {
      dom.preview.textContent = activeFile ? '(select taxonomy segments)' : '—';
      dom.preview.style.color = 'var(--text-muted)';
      dom.btnApply.disabled = true;
    }
  }

  /* ── QUICK BUTTONS ────────────────────────────────────────────── */
  function initQuickButtons() {
    const allButtons = document.querySelectorAll('.quick-buttons button[data-field]');
    allButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.field;
        const value = btn.dataset.value;

        // Toggle: if already active, deselect
        if (taxonomy[field] === value) {
          taxonomy[field] = '';
          btn.classList.remove('active');
        } else {
          // Deactivate siblings
          const siblings = btn.parentElement.querySelectorAll(`button[data-field="${field}"]`);
          siblings.forEach(s => s.classList.remove('active'));
          taxonomy[field] = value;
          btn.classList.add('active');
        }
        updatePreview();
      });
    });
  }

  /* ── DATE HANDLING ────────────────────────────────────────────── */
  function formatDateForName(dateStr) {
    // Convert YYYY-MM-DD to YYYYMMDD
    return dateStr.replace(/-/g, '');
  }

  function initDateControls() {
    dom.dateInput.addEventListener('change', () => {
      taxonomy.date = dom.dateInput.value ? formatDateForName(dom.dateInput.value) : '';
      updatePreview();
    });

    dom.btnDateToday.addEventListener('click', () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      dom.dateInput.value = `${yyyy}-${mm}-${dd}`;
      taxonomy.date = `${yyyy}${mm}${dd}`;
      updatePreview();
    });
  }

  /* ── PREDICTIVE TEXT (CLIENT & JOB) ───────────────────────────── */
  function initPredictiveInputs() {
    // Client input
    dom.clientInput.addEventListener('input', () => {
      taxonomy.client = dom.clientInput.value.trim().toUpperCase();
      updatePreview();
      showPredictions(dom.clientInput, dom.clientPredict, knownClients);
    });
    dom.clientInput.addEventListener('focus', () => {
      showPredictions(dom.clientInput, dom.clientPredict, knownClients);
    });
    dom.clientInput.addEventListener('blur', () => {
      // Delay to allow click on prediction item
      setTimeout(() => dom.clientPredict.classList.add('hidden'), 200);
    });

    // Job input
    dom.jobInput.addEventListener('input', () => {
      taxonomy.job = dom.jobInput.value.trim().toUpperCase();
      updatePreview();
      showPredictions(dom.jobInput, dom.jobPredict, knownJobs);
    });
    dom.jobInput.addEventListener('focus', () => {
      showPredictions(dom.jobInput, dom.jobPredict, knownJobs);
    });
    dom.jobInput.addEventListener('blur', () => {
      setTimeout(() => dom.jobPredict.classList.add('hidden'), 200);
    });

    // Description input
    dom.descInput.addEventListener('input', () => {
      taxonomy.desc = dom.descInput.value.trim().replace(/\s+/g, '-');
      updatePreview();
    });
  }

  function showPredictions(input, predictBox, knownList) {
    const query = input.value.trim().toUpperCase();
    const matches = knownList.filter(item =>
      item.includes(query)
    ).slice(0, 8);

    if (matches.length === 0 || (!query && knownList.length === 0)) {
      predictBox.classList.add('hidden');
      return;
    }

    predictBox.innerHTML = '';
    matches.forEach(match => {
      const div = document.createElement('div');
      div.className = 'predict-item';
      div.textContent = match;
      div.addEventListener('mousedown', (e) => {
        e.preventDefault(); // prevent blur
        input.value = match;
        if (input === dom.clientInput) {
          taxonomy.client = match;
        } else {
          taxonomy.job = match;
        }
        predictBox.classList.add('hidden');
        updatePreview();
      });
      predictBox.appendChild(div);
    });
    predictBox.classList.remove('hidden');
  }

  /* ── APPLY RENAME ─────────────────────────────────────────────── */
  async function applyRename() {
    if (!activeFile) {
      OmniView.toast('No file selected', 'warning');
      return;
    }

    const newName = buildName();
    if (!newName) {
      OmniView.toast('Build a name using the taxonomy buttons first', 'warning');
      return;
    }

    if (newName === activeFile.name) {
      OmniView.toast('New name is the same as current name', 'warning');
      return;
    }

    const oldName = activeFile.name;
    const oldPath = activeFile.path;

    // Determine parent directory
    const parentPath = oldPath.includes('/') ?
      oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
    const parentHandle = parentPath ?
      OmniView.state.dirHandleMap.get(parentPath) :
      OmniView.state.workspaceDirHandle;

    if (!parentHandle) {
      OmniView.toast('Cannot locate parent directory', 'error');
      return;
    }

    try {
      // Read old file content
      const oldFileObj = await activeFile.handle.getFile();
      const content = await oldFileObj.arrayBuffer();

      // Create new file with new name
      const newHandle = await parentHandle.getFileHandle(newName, { create: true });
      const writable = await newHandle.createWritable();
      await writable.write(content);
      await writable.close();

      // Delete old file
      await parentHandle.removeEntry(oldName);

      // Save to predictive memory
      if (taxonomy.client) addToKnown(knownClients, STORAGE_KEY_CLIENTS, taxonomy.client);
      if (taxonomy.job) addToKnown(knownJobs, STORAGE_KEY_JOBS, taxonomy.job);

      // Record in history
      addHistoryEntry(oldName, newName, parentHandle, parentPath);

      OmniView.toast(`Renamed: ${oldName} → ${newName}`, 'success');

      // Refresh file tree
      await OmniView.scanDirectory();

      // Select the renamed file
      const newPath = parentPath ? `${parentPath}/${newName}` : newName;
      const newEntry = OmniView.state.files.find(f => f.path === newPath);
      if (newEntry) {
        const row = document.querySelector(`.tree-item[data-path="${CSS.escape(newPath)}"]`);
        if (row) OmniView.selectFile(newEntry, row);
      }

    } catch (err) {
      OmniView.toast(`Rename failed: ${err.message}`, 'error');
    }
  }

  /* ── BATCH RENAME ─────────────────────────────────────────────── */
  async function applyBatchRename() {
    const checked = OmniView.state.checkedFiles;
    if (checked.size === 0) {
      OmniView.toast('No files selected for batch rename', 'warning');
      return;
    }

    const newNameTemplate = buildName();
    if (!newNameTemplate) {
      OmniView.toast('Build a name using the taxonomy buttons first', 'warning');
      return;
    }

    const confirmed = await OmniView.showModal(
      'Batch Rename',
      `<p>Rename <strong>${checked.size}</strong> files using the current taxonomy?</p>
       <p style="margin-top:8px;font-family:var(--font-mono);font-size:11px;color:var(--accent);">
         Pattern: ${OmniView.escapeHTML(newNameTemplate)}</p>
       <p style="margin-top:8px;font-size:11px;color:var(--text-muted);">
         Files will be numbered sequentially (e.g. -001, -002, ...)</p>`,
      'Rename All'
    );
    if (!confirmed) return;

    const ext = OmniView.getFileExt(newNameTemplate);
    const base = ext ? newNameTemplate.slice(0, -(ext.length + 1)) : newNameTemplate;
    let index = 1;
    let successCount = 0;

    for (const path of checked) {
      const entry = OmniView.state.files.find(f => f.path === path);
      if (!entry) continue;

      const fileExt = OmniView.getFileExt(entry.name);
      const seqNum = String(index).padStart(3, '0');
      const batchName = fileExt ? `${base}-${seqNum}.${fileExt}` : `${base}-${seqNum}`;

      const parentPath = entry.path.includes('/') ?
        entry.path.substring(0, entry.path.lastIndexOf('/')) : '';
      const parentHandle = parentPath ?
        OmniView.state.dirHandleMap.get(parentPath) :
        OmniView.state.workspaceDirHandle;

      if (!parentHandle) continue;

      try {
        const oldFileObj = await entry.handle.getFile();
        const content = await oldFileObj.arrayBuffer();
        const newHandle = await parentHandle.getFileHandle(batchName, { create: true });
        const writable = await newHandle.createWritable();
        await writable.write(content);
        await writable.close();
        await parentHandle.removeEntry(entry.name);

        addHistoryEntry(entry.name, batchName, parentHandle, parentPath);
        successCount++;
      } catch (err) {
        OmniView.toast(`Failed to rename ${entry.name}: ${err.message}`, 'error');
      }
      index++;
    }

    // Save predictive memory
    if (taxonomy.client) addToKnown(knownClients, STORAGE_KEY_CLIENTS, taxonomy.client);
    if (taxonomy.job) addToKnown(knownJobs, STORAGE_KEY_JOBS, taxonomy.job);

    OmniView.toast(`Batch renamed ${successCount}/${checked.size} files`, 'success');
    await OmniView.scanDirectory();
  }

  /* ── HISTORY ──────────────────────────────────────────────────── */
  function addHistoryEntry(oldName, newName, parentHandle, parentPath) {
    renameHistory.unshift({ oldName, newName, parentHandle, parentPath, timestamp: Date.now() });
    if (renameHistory.length > MAX_HISTORY) renameHistory.length = MAX_HISTORY;
    renderHistory();
  }

  function renderHistory() {
    dom.historyList.innerHTML = '';
    renameHistory.forEach(entry => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="hist-old" title="${OmniView.escapeHTML(entry.oldName)}">${OmniView.escapeHTML(entry.oldName)}</span>
        <span class="hist-arrow">→</span>
        <span class="hist-new" title="${OmniView.escapeHTML(entry.newName)}">${OmniView.escapeHTML(entry.newName)}</span>
      `;
      dom.historyList.appendChild(li);
    });
  }

  /* ── CLEAR ALL ────────────────────────────────────────────────── */
  function clearAll() {
    // Reset taxonomy state
    Object.keys(taxonomy).forEach(k => taxonomy[k] = '');

    // Deactivate all quick buttons
    document.querySelectorAll('.quick-buttons button.active').forEach(b => b.classList.remove('active'));

    // Clear inputs
    dom.dateInput.value = '';
    dom.clientInput.value = '';
    dom.jobInput.value = '';
    dom.descInput.value = '';

    updatePreview();
  }

  /* ── PUBLIC: SET ACTIVE FILE ──────────────────────────────────── */
  function setActiveFile(entry) {
    activeFile = entry;
    dom.currentName.textContent = entry ? entry.name : 'No file selected';
    updatePreview();
  }

  /* ── INIT ─────────────────────────────────────────────────────── */
  function init() {
    cacheDom();
    initQuickButtons();
    initDateControls();
    initPredictiveInputs();

    dom.btnApply.addEventListener('click', applyRename);
    dom.btnClear.addEventListener('click', clearAll);
    dom.btnBatchRename.addEventListener('click', applyBatchRename);

    updatePreview();
  }

  document.addEventListener('DOMContentLoaded', init);

  /* ── PUBLIC API ───────────────────────────────────────────────── */
  return {
    setActiveFile,
    clearAll,
    get taxonomy() { return taxonomy; },
    get activeFile() { return activeFile; },
  };

})();
