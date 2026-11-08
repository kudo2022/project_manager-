/**
 * IT Project Management Workspace — Extended Views
 * Provides 4 interactive enterprise IT views complementing the Executive Dashboard:
 *   1. renderTasksManagerView(containerEl) — Full Projects & Tasks Manager
 *   2. renderKanbanView(containerEl)       — 3-Column Agile IT Kanban Board (Drag & Drop + Quick Move)
 *   3. renderGanttView(containerEl)        — Visual IT Project & Task Timeline (Gantt Chart)
 *   4. renderResourcesView(containerEl)    — Resource & Team Capacity Manager
 */
(function () {
  'use strict';

  window.ITPM = window.ITPM || {};

  const REFERENCE_TODAY_ISO = '2025-10-08';
  const REFERENCE_TODAY_MS = Date.UTC(2025, 9, 8);

  // Persistent UI filter states across re-renders
  const uiState = {
    tasksFilter: {
      search: '',
      project: 'ALL',
      status: 'ALL',
      assignee: 'ALL',
      sortBy: 'code'
    },
    kanbanFilter: {
      search: '',
      project: 'ALL',
      assignee: 'ALL'
    },
    ganttFilter: {
      project: 'ALL',
      status: 'ALL',
      zoom: 'month'
    }
  };

  // Status Mapping between store.js ("completed" | "in_progress" | "not_started") and Vietnamese UI labels
  function toStatusLabelVN(rawStatus, progress) {
    if (rawStatus === 'completed' || rawStatus === 'Hoàn thành') return 'Hoàn thành';
    if (rawStatus === 'in_progress' || rawStatus === 'Đang thực hiện') return 'Đang thực hiện';
    if (rawStatus === 'not_started' || rawStatus === 'Chưa bắt đầu') return 'Chưa bắt đầu';
    if (Number(progress) >= 100) return 'Hoàn thành';
    if (Number(progress) > 0) return 'Đang thực hiện';
    return 'Chưa bắt đầu';
  }

  function toStoreStatusKey(vnOrKeyStatus) {
    if (vnOrKeyStatus === 'Hoàn thành' || vnOrKeyStatus === 'completed') return 'completed';
    if (vnOrKeyStatus === 'Đang thực hiện' || vnOrKeyStatus === 'in_progress') return 'in_progress';
    if (vnOrKeyStatus === 'Chưa bắt đầu' || vnOrKeyStatus === 'not_started') return 'not_started';
    return 'not_started';
  }

  // Inject Scoped Styles for Extended Views once
  function ensureExtendedStyles() {
    if (document.getElementById('itpm-extended-views-styles')) return;
    const style = document.createElement('style');
    style.id = 'itpm-extended-views-styles';
    style.textContent = `
      .itpm-ext-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
        color: #f4f1ea;
        font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
        padding-bottom: 28px;
      }
      .itpm-ext-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: linear-gradient(135deg, rgba(64, 59, 43, 0.92), rgba(45, 41, 30, 0.95));
        border: 1px solid rgba(222, 186, 100, 0.28);
        border-radius: 10px;
        padding: 14px 18px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
      }
      .itpm-ext-title-group h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
        color: #f5d98e;
        letter-spacing: 0.3px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .itpm-ext-title-group p {
        margin: 4px 0 0 0;
        font-size: 0.82rem;
        color: #cbbf9e;
      }
      .itpm-ext-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .itpm-btn {
        background: rgba(255, 255, 255, 0.08);
        color: #f4f1ea;
        border: 1px solid rgba(222, 186, 100, 0.35);
        border-radius: 6px;
        padding: 7px 13px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.16s ease;
      }
      .itpm-btn:hover {
        background: rgba(222, 186, 100, 0.2);
        border-color: #deba64;
        transform: translateY(-1px);
      }
      .itpm-btn-gold {
        background: linear-gradient(135deg, #deba64, #b89138);
        color: #1f1b12;
        border: 1px solid #f0d284;
        font-weight: 700;
      }
      .itpm-btn-gold:hover {
        background: linear-gradient(135deg, #ebd083, #c9a145);
        color: #14110a;
      }
      .itpm-btn-danger {
        background: rgba(242, 72, 54, 0.15);
        color: #ff9c91;
        border-color: rgba(242, 72, 54, 0.45);
      }
      .itpm-btn-danger:hover {
        background: rgba(242, 72, 54, 0.32);
        color: #fff;
      }
      .itpm-btn-sm {
        padding: 4px 9px;
        font-size: 0.75rem;
        border-radius: 5px;
      }

      /* Filter Bar */
      .itpm-filter-bar {
        display: grid;
        grid-template-columns: 2fr 1.1fr 1.1fr 1.1fr auto;
        gap: 10px;
        background: rgba(48, 44, 32, 0.9);
        border: 1px solid rgba(222, 186, 100, 0.22);
        border-radius: 9px;
        padding: 12px 14px;
        align-items: center;
      }
      @media (max-width: 1024px) {
        .itpm-filter-bar {
          grid-template-columns: 1fr 1fr;
        }
      }
      .itpm-input, .itpm-select {
        width: 100%;
        background: rgba(24, 22, 15, 0.78);
        color: #f4f1ea;
        border: 1px solid rgba(222, 186, 100, 0.3);
        border-radius: 6px;
        padding: 7px 11px;
        font-size: 0.82rem;
        outline: none;
      }
      .itpm-input:focus, .itpm-select:focus {
        border-color: #deba64;
        box-shadow: 0 0 0 2px rgba(222, 186, 100, 0.2);
      }
      .itpm-select option {
        background: #232017;
        color: #f4f1ea;
      }

      /* Project Summary Cards Row */
      .itpm-proj-strip {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
        gap: 10px;
      }
      .itpm-proj-card {
        background: linear-gradient(155deg, rgba(61, 56, 40, 0.94), rgba(40, 36, 26, 0.94));
        border: 1px solid rgba(222, 186, 100, 0.25);
        border-radius: 9px;
        padding: 11px 13px;
        display: flex;
        flex-direction: column;
        gap: 7px;
        position: relative;
        transition: transform 0.15s ease, border-color 0.15s ease;
      }
      .itpm-proj-card:hover {
        border-color: #deba64;
        transform: translateY(-2px);
      }
      .itpm-proj-card.active-filter {
        border: 2px solid #deba64;
        box-shadow: 0 0 14px rgba(222, 186, 100, 0.25);
      }
      .itpm-proj-card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .itpm-proj-code {
        font-weight: 800;
        font-size: 0.88rem;
        color: #f5d98e;
        background: rgba(222, 186, 100, 0.15);
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid rgba(222, 186, 100, 0.3);
        cursor: pointer;
      }
      .itpm-proj-name {
        font-size: 0.78rem;
        color: #d8ceb4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .itpm-proj-stats {
        display: flex;
        justify-content: space-between;
        font-size: 0.74rem;
        color: #beb396;
      }
      .itpm-progress-track {
        height: 7px;
        background: rgba(0, 0, 0, 0.42);
        border-radius: 999px;
        overflow: hidden;
      }
      .itpm-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #c99e3b, #f0d27f);
        border-radius: 999px;
        transition: width 0.25s ease;
      }
      .itpm-slider {
        width: 100%;
        accent-color: #deba64;
        cursor: pointer;
        height: 5px;
      }

      /* Table Styles */
      .itpm-table-card {
        background: rgba(45, 41, 29, 0.92);
        border: 1px solid rgba(222, 186, 100, 0.25);
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
      }
      .itpm-table-scroll {
        overflow-x: auto;
      }
      .itpm-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.81rem;
      }
      .itpm-table th {
        background: rgba(28, 25, 18, 0.9);
        color: #deba64;
        text-align: left;
        padding: 11px 12px;
        font-weight: 700;
        border-bottom: 1px solid rgba(222, 186, 100, 0.28);
        white-space: nowrap;
      }
      .itpm-table td {
        padding: 10px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        vertical-align: middle;
      }
      .itpm-table tr:hover td {
        background: rgba(222, 186, 100, 0.07);
      }
      .itpm-table tr.row-overdue td {
        background: rgba(242, 72, 54, 0.07);
      }
      .itpm-table tr.row-overdue:hover td {
        background: rgba(242, 72, 54, 0.13);
      }
      .itpm-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        white-space: nowrap;
      }
      .itpm-badge-project {
        background: rgba(222, 186, 100, 0.16);
        color: #f5d98e;
        border: 1px solid rgba(222, 186, 100, 0.35);
      }
      .itpm-badge-overdue {
        background: rgba(242, 72, 54, 0.22);
        color: #ff8a7a;
        border: 1px solid rgba(242, 72, 54, 0.55);
      }
      .itpm-badge-ok {
        background: rgba(110, 204, 130, 0.16);
        color: #9be6ad;
        border: 1px solid rgba(110, 204, 130, 0.35);
      }
      .itpm-badge-done {
        background: rgba(222, 186, 100, 0.24);
        color: #ffe39e;
        border: 1px solid #deba64;
      }

      /* Kanban Board */
      .itpm-kanban-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        align-items: start;
      }
      @media (max-width: 980px) {
        .itpm-kanban-grid {
          grid-template-columns: 1fr;
        }
      }
      .itpm-kanban-col {
        background: rgba(42, 38, 27, 0.92);
        border: 1px solid rgba(222, 186, 100, 0.22);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        min-height: 520px;
        transition: border-color 0.18s ease, background 0.18s ease;
      }
      .itpm-kanban-col.drag-over {
        border: 2px dashed #deba64;
        background: rgba(222, 186, 100, 0.11);
      }
      .itpm-kanban-col-head {
        padding: 12px 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top-left-radius: 9px;
        border-top-right-radius: 9px;
      }
      .itpm-kanban-cards {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 1;
      }
      .itpm-kcard {
        background: linear-gradient(145deg, rgba(62, 57, 41, 0.96), rgba(47, 43, 31, 0.96));
        border: 1px solid rgba(222, 186, 100, 0.24);
        border-radius: 8px;
        padding: 11px 12px;
        cursor: grab;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.24);
        transition: transform 0.15s ease, border-color 0.15s ease;
      }
      .itpm-kcard:hover {
        transform: translateY(-2px);
        border-color: #deba64;
      }
      .itpm-kcard.kcard-overdue {
        border-left: 4px solid #f24836;
      }
      .itpm-kcard.kcard-done {
        border-left: 4px solid #deba64;
      }
      .itpm-kcard.kcard-active {
        border-left: 4px solid #ffffff;
      }

      /* Gantt View */
      .itpm-gantt-card {
        background: rgba(42, 38, 27, 0.94);
        border: 1px solid rgba(222, 186, 100, 0.26);
        border-radius: 10px;
        overflow: hidden;
      }
      .itpm-gantt-row {
        display: grid;
        grid-template-columns: 310px 1fr;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        align-items: center;
      }
      .itpm-gantt-row.project-group-row {
        background: rgba(26, 23, 16, 0.72);
        font-weight: 700;
      }
      .itpm-gantt-label {
        padding: 8px 12px;
        border-right: 1px solid rgba(222, 186, 100, 0.18);
        font-size: 0.78rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        overflow: hidden;
      }
      .itpm-gantt-track-area {
        position: relative;
        height: 34px;
        background: repeating-linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.025) 0px,
          rgba(255, 255, 255, 0.025) 1px,
          transparent 1px,
          transparent 8.333%
        );
      }
      .itpm-gantt-bar {
        position: absolute;
        top: 6px;
        height: 22px;
        border-radius: 5px;
        display: flex;
        align-items: center;
        padding: 0 7px;
        font-size: 0.7rem;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
        cursor: pointer;
        transition: filter 0.15s ease, transform 0.15s ease;
      }
      .itpm-gantt-bar:hover {
        filter: brightness(1.12);
        transform: scaleY(1.06);
        z-index: 4;
      }
      .itpm-gantt-today-line {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #00e5ff;
        box-shadow: 0 0 8px rgba(0, 229, 255, 0.8);
        z-index: 3;
        pointer-events: none;
      }

      /* Resources View */
      .itpm-res-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 14px;
      }
      .itpm-res-card {
        background: linear-gradient(150deg, rgba(61, 56, 40, 0.95), rgba(39, 35, 25, 0.95));
        border: 1px solid rgba(222, 186, 100, 0.28);
        border-radius: 10px;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 11px;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.26);
      }
      .itpm-res-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #deba64, #8f6f24);
        color: #1c1911;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.92rem;
      }
      .itpm-kpi-mini-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        text-align: center;
      }
      .itpm-kpi-mini {
        background: rgba(20, 18, 12, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 6px;
        padding: 6px 4px;
      }
      .itpm-kpi-mini strong {
        display: block;
        font-size: 0.95rem;
      }
      .itpm-kpi-mini span {
        font-size: 0.68rem;
        color: #bdb295;
      }

      /* Inline Modal Fallback */
      .itpm-inline-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.72);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 16px;
      }
      .itpm-inline-modal {
        background: #2c281c;
        border: 1px solid #deba64;
        border-radius: 10px;
        width: 100%;
        max-width: 500px;
        padding: 18px 20px;
        color: #f4f1ea;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65);
      }
      .itpm-inline-modal h3 {
        margin: 0 0 12px 0;
        color: #f5d98e;
      }
      .itpm-form-row {
        margin-bottom: 11px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .itpm-form-row label {
        font-size: 0.78rem;
        color: #d6cba8;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
  }

  // =========================================================================
  // DATA & STORE ADAPTER HELPERS
  // =========================================================================

  function getStore() {
    return window.ITPM && window.ITPM.store ? window.ITPM.store : null;
  }

  function getStateData() {
    const store = getStore();
    if (!store) return { projects: [], tasks: [], resources: [] };
    if (typeof store.getState === 'function') {
      return store.getState();
    }
    if (store.state) {
      return store.state;
    }
    return {
      projects: typeof store.getProjects === 'function' ? store.getProjects() : (store.projects || []),
      tasks: typeof store.getTasks === 'function' ? store.getTasks() : (store.tasks || []),
      resources: typeof store.getResources === 'function' ? store.getResources() : (store.resources || [])
    };
  }

  function normalizeProject(p) {
    const id = p.id || p.code || '';
    const name = p.name || p.title || id;
    const progress = typeof p.progress === 'number' ? p.progress : (typeof p.completion === 'number' ? p.completion : 0);
    return {
      ...p,
      id,
      code: p.code || id,
      name,
      progress: Math.round(progress)
    };
  }

  function parseDateMs(dateStr) {
    if (!dateStr) return REFERENCE_TODAY_MS;
    if (window.ITPM && window.ITPM.utils && typeof window.ITPM.utils.toUTCMidnight === 'function') {
      const iso = window.ITPM.utils.parseDateVN ? window.ITPM.utils.parseDateVN(dateStr) : dateStr;
      const ms = window.ITPM.utils.toUTCMidnight(iso);
      if (!isNaN(ms)) return ms;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
      return Date.UTC(y, m - 1, d);
    }
    const parts = String(dateStr).split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
      return Date.UTC(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    const t = new Date(dateStr).getTime();
    return isNaN(t) ? REFERENCE_TODAY_MS : t;
  }

  function formatDateVN(dateStr) {
    if (!dateStr) return '—';
    if (window.ITPM && window.ITPM.utils && typeof window.ITPM.utils.formatDateVN === 'function') {
      return window.ITPM.utils.formatDateVN(dateStr);
    }
    const ms = parseDateMs(dateStr);
    const d = new Date(ms);
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  function toInputDate(dateStr) {
    if (!dateStr) return REFERENCE_TODAY_ISO;
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10);
    const ms = parseDateMs(dateStr);
    const d = new Date(ms);
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }

  function normalizeTask(t) {
    const state = getStateData();
    const refIso = state.referenceDate || REFERENCE_TODAY_ISO;
    const refMs = parseDateMs(refIso);

    const code = t.code || t.id || '';
    const id = t.id || code;
    const projectId = t.projectId || t.project || 'CTPro01';
    const title = t.title || t.name || `Công việc IT ${code}`;
    const assignee = t.assignee || t.resource || 'Phù Cát';
    const progress = typeof t.progress === 'number'
      ? Math.max(0, Math.min(100, Math.round(t.progress)))
      : (t.status === 'completed' || t.status === 'Hoàn thành' ? 100 : (t.status === 'in_progress' || t.status === 'Đang thực hiện' ? 50 : 0));

    const statusVN = toStatusLabelVN(t.status, progress);
    const statusKey = toStoreStatusKey(statusVN);

    const endDate = t.endDate || t.dueDate || t.deadline || '2025-10-08';
    const startDate = t.startDate || '2025-01-15';

    // Compute overdue days relative to reference Today (08/10/2025)
    let overdueDays = 0;
    const endMs = parseDateMs(endDate);
    if (statusVN !== 'Hoàn thành' && progress < 100) {
      const diffDays = Math.round((refMs - endMs) / 86400000);
      if (diffDays > 0) {
        overdueDays = diffDays;
      } else if (typeof t.overdueDays === 'number' && t.overdueDays > 0) {
        overdueDays = t.overdueDays;
      }
    }

    const isOverdue = statusVN !== 'Hoàn thành' && progress < 100 && overdueDays > 0;

    return {
      ...t,
      id,
      code,
      projectId,
      title,
      assignee,
      status: statusVN,
      statusKey,
      progress,
      startDate,
      endDate,
      overdueDays,
      isOverdue
    };
  }

  function normalizeResource(r) {
    const id = r.id || r.name || '';
    const name = r.name || r.id || '';
    const score = typeof r.utilization === 'number'
      ? r.utilization
      : (typeof r.score === 'number' ? r.score : (typeof r.capacity === 'number' ? r.capacity : 25));
    const role = r.role || r.department || 'Chuyên viên CNTT / Quản trị Hệ thống';
    return {
      ...r,
      id,
      name,
      role,
      utilization: Math.max(0, Math.min(100, Math.round(score)))
    };
  }

  function notifyToast(message, type) {
    if (window.ITPM && typeof window.ITPM.showToast === 'function') {
      window.ITPM.showToast(message, type || 'success');
      return;
    }
    if (window.ITPM && window.ITPM.toast && typeof window.ITPM.toast.show === 'function') {
      window.ITPM.toast.show(message, type || 'success');
      return;
    }
    // Lightweight self-contained toast fallback
    let container = document.getElementById('itpm-ext-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'itpm-ext-toast-container';
      container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    const borderColor = type === 'danger' ? '#f24836' : '#deba64';
    el.style.cssText = `background:#221f16;color:#f5d98e;border-left:4px solid ${borderColor};border:1px solid rgba(222,186,100,0.45);border-left-width:4px;padding:10px 15px;border-radius:7px;font-size:0.83rem;font-weight:600;box-shadow:0 8px 20px rgba(0,0,0,0.5);`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2600);
  }

  function updateTaskInStore(taskIdOrCode, patch) {
    const store = getStore();
    if (!store) return;

    const updatedPatch = { ...patch };

    if (typeof updatedPatch.progress === 'number' && !updatedPatch.status) {
      if (updatedPatch.progress >= 100) {
        updatedPatch.progress = 100;
        updatedPatch.status = 'completed';
      } else if (updatedPatch.progress > 0) {
        updatedPatch.status = 'in_progress';
      } else {
        updatedPatch.progress = 0;
        updatedPatch.status = 'not_started';
      }
    } else if (updatedPatch.status) {
      const storeStatus = toStoreStatusKey(updatedPatch.status);
      updatedPatch.status = storeStatus;
      if (storeStatus === 'completed') {
        updatedPatch.progress = 100;
      } else if (storeStatus === 'not_started' && typeof updatedPatch.progress !== 'number') {
        updatedPatch.progress = 0;
      } else if (storeStatus === 'in_progress' && typeof updatedPatch.progress !== 'number') {
        const current = (getStateData().tasks || []).find(t => (t.id || t.code) === taskIdOrCode || t.code === taskIdOrCode);
        if (!current || current.progress <= 0 || current.progress >= 100) {
          updatedPatch.progress = 50;
        }
      }
    }

    if (typeof store.updateTask === 'function') {
      store.updateTask(taskIdOrCode, updatedPatch);
    } else {
      const state = getStateData();
      const idx = (state.tasks || []).findIndex(t => t.id === taskIdOrCode || t.code === taskIdOrCode);
      if (idx !== -1) {
        state.tasks[idx] = { ...state.tasks[idx], ...updatedPatch };
        if (typeof store.notify === 'function') store.notify();
      }
    }
  }

  function deleteTaskInStore(taskIdOrCode) {
    const store = getStore();
    if (!store) return;
    if (typeof store.deleteTask === 'function') {
      store.deleteTask(taskIdOrCode);
    } else {
      const state = getStateData();
      if (Array.isArray(state.tasks)) {
        const idx = state.tasks.findIndex(t => t.id === taskIdOrCode || t.code === taskIdOrCode);
        if (idx !== -1) state.tasks.splice(idx, 1);
        if (typeof store.notify === 'function') store.notify();
      }
    }
  }

  function updateProjectInStore(projectId, patch) {
    const store = getStore();
    if (!store) return;
    if (typeof store.updateProject === 'function') {
      store.updateProject(projectId, patch);
    } else {
      const state = getStateData();
      const idx = (state.projects || []).findIndex(p => p.id === projectId || p.code === projectId);
      if (idx !== -1) {
        state.projects[idx] = { ...state.projects[idx], ...patch };
        if (typeof store.notify === 'function') store.notify();
      }
    }
  }

  function updateResourceInStore(resourceIdOrName, patch) {
    const store = getStore();
    if (!store) return;
    const normalizedPatch = {
      ...patch,
      utilization: typeof patch.utilization === 'number' ? patch.utilization : patch.score,
      score: typeof patch.utilization === 'number' ? patch.utilization : patch.score,
      capacity: typeof patch.utilization === 'number' ? patch.utilization : patch.score
    };
    if (typeof store.updateResource === 'function') {
      store.updateResource(resourceIdOrName, normalizedPatch);
    } else {
      const state = getStateData();
      const idx = (state.resources || []).findIndex(r => r.id === resourceIdOrName || r.name === resourceIdOrName);
      if (idx !== -1) {
        state.resources[idx] = { ...state.resources[idx], ...normalizedPatch };
        if (typeof store.notify === 'function') store.notify();
      }
    }
  }

  // =========================================================================
  // MODAL HELPERS (Uses window.ITPM.modals if present, or built-in dialog)
  // =========================================================================

  function openTaskDialog(existingTask, onDone) {
    const state = getStateData();
    const projects = (state.projects || []).map(normalizeProject);
    const resources = (state.resources || []).map(normalizeResource);
    const isEdit = Boolean(existingTask);
    const store = getStore();
    const nextCode = store && typeof store.generateNextTaskCode === 'function'
      ? store.generateNextTaskCode()
      : `CTax${String((state.tasks || []).length + 1).padStart(4, '0')}`;

    const t = existingTask ? normalizeTask(existingTask) : {
      code: nextCode,
      projectId: projects[0] ? projects[0].id : 'CTPro01',
      title: '',
      assignee: resources[0] ? resources[0].name : 'Phù Cát',
      status: 'Đang thực hiện',
      progress: 30,
      startDate: '2025-09-01',
      endDate: '2025-10-25'
    };

    const backdrop = document.createElement('div');
    backdrop.className = 'itpm-inline-modal-backdrop';
    backdrop.innerHTML = `
      <div class="itpm-inline-modal">
        <h3>${isEdit ? 'Chỉnh Sửa Công Việc IT (' + escapeHtml(t.code) + ')' : 'Thêm Công Việc IT Mới'}</h3>
        <form id="itpm-ext-task-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="itpm-form-row">
              <label>Mã Công Việc</label>
              <input class="itpm-input" name="code" value="${escapeHtml(t.code)}" ${isEdit ? 'readonly' : ''} required />
            </div>
            <div class="itpm-form-row">
              <label>Dự Án IT</label>
              <select class="itpm-select" name="projectId">
                ${projects.map(p => `<option value="${escapeHtml(p.id)}" ${p.id === t.projectId ? 'selected' : ''}>${escapeHtml(p.id)} — ${escapeHtml(p.name)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="itpm-form-row">
            <label>Tên Công Việc / Hạng Mục Kỹ Thuật</label>
            <input class="itpm-input" name="title" value="${escapeHtml(t.title)}" placeholder="VD: Triển khai tường lửa cụm máy chủ..." required />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="itpm-form-row">
              <label>Người Phụ Trách (Nguồn Lực)</label>
              <select class="itpm-select" name="assignee">
                ${resources.map(r => `<option value="${escapeHtml(r.name)}" ${r.name === t.assignee ? 'selected' : ''}>${escapeHtml(r.name)}</option>`).join('')}
              </select>
            </div>
            <div class="itpm-form-row">
              <label>Trạng Thái</label>
              <select class="itpm-select" name="status">
                <option value="Chưa bắt đầu" ${t.status === 'Chưa bắt đầu' ? 'selected' : ''}>Chưa bắt đầu</option>
                <option value="Đang thực hiện" ${t.status === 'Đang thực hiện' ? 'selected' : ''}>Đang thực hiện</option>
                <option value="Hoàn thành" ${t.status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            <div class="itpm-form-row">
              <label>Ngày Bắt Đầu</label>
              <input type="date" class="itpm-input" name="startDate" value="${toInputDate(t.startDate)}" />
            </div>
            <div class="itpm-form-row">
              <label>Hạn Chót</label>
              <input type="date" class="itpm-input" name="endDate" value="${toInputDate(t.endDate)}" required />
            </div>
            <div class="itpm-form-row">
              <label>Tiến Độ (%)</label>
              <input type="number" min="0" max="100" class="itpm-input" name="progress" value="${t.progress}" />
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
            <button type="button" class="itpm-btn" id="itpm-modal-cancel">Hủy</button>
            <button type="submit" class="itpm-btn itpm-btn-gold">${isEdit ? 'Lưu Cập Nhật' : 'Tạo Công Việc'}</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.querySelector('#itpm-modal-cancel').onclick = () => backdrop.remove();
    backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };

    backdrop.querySelector('#itpm-ext-task-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const statusLabel = fd.get('status');
      const payload = {
        id: fd.get('code').trim(),
        code: fd.get('code').trim(),
        projectId: fd.get('projectId'),
        title: fd.get('title').trim(),
        assignee: fd.get('assignee'),
        status: toStoreStatusKey(statusLabel),
        startDate: fd.get('startDate'),
        endDate: fd.get('endDate'),
        progress: Number(fd.get('progress') || 0)
      };

      if (isEdit) {
        updateTaskInStore(t.id || t.code, payload);
        notifyToast(`Đã cập nhật công việc ${payload.code}!`);
      } else if (store && typeof store.addTask === 'function') {
        store.addTask(payload);
        notifyToast(`Đã thêm công việc mới ${payload.code}!`);
      } else {
        const s = getStateData();
        if (Array.isArray(s.tasks)) s.tasks.unshift(payload);
        if (store && typeof store.notify === 'function') store.notify();
        notifyToast(`Đã thêm công việc mới ${payload.code}!`);
      }
      backdrop.remove();
      if (typeof onDone === 'function') onDone();
    };
  }

  function openProjectDialog(existingProj, onDone) {
    const state = getStateData();
    const isEdit = Boolean(existingProj);
    const p = existingProj ? normalizeProject(existingProj) : {
      id: `CTPro0${(state.projects || []).length + 1}`,
      name: '',
      progress: 0,
      manager: 'Phù Cát'
    };

    const backdrop = document.createElement('div');
    backdrop.className = 'itpm-inline-modal-backdrop';
    backdrop.innerHTML = `
      <div class="itpm-inline-modal">
        <h3>${isEdit ? 'Chỉnh Sửa Dự Án ' + escapeHtml(p.id) : 'Thêm Dự Án CNTT Mới'}</h3>
        <form id="itpm-ext-proj-form">
          <div class="itpm-form-row">
            <label>Mã Dự Án</label>
            <input class="itpm-input" name="id" value="${escapeHtml(p.id)}" ${isEdit ? 'readonly' : ''} required />
          </div>
          <div class="itpm-form-row">
            <label>Tên Dự Án CNTT</label>
            <input class="itpm-input" name="name" value="${escapeHtml(p.name)}" placeholder="VD: Nâng cấp Hạ tầng Cloud & ERP..." required />
          </div>
          <div class="itpm-form-row">
            <label>Tiến Độ Tổng Thể (%)</label>
            <input type="number" min="0" max="100" class="itpm-input" name="progress" value="${p.progress}" required />
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
            <button type="button" class="itpm-btn" id="itpm-proj-cancel">Hủy</button>
            <button type="submit" class="itpm-btn itpm-btn-gold">${isEdit ? 'Lưu Dự Án' : 'Thêm Dự Án'}</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.querySelector('#itpm-proj-cancel').onclick = () => backdrop.remove();
    backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };

    backdrop.querySelector('#itpm-ext-proj-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        id: fd.get('id').trim(),
        code: fd.get('id').trim(),
        name: fd.get('name').trim(),
        progress: Math.max(0, Math.min(100, Number(fd.get('progress') || 0)))
      };
      const store = getStore();
      if (isEdit) {
        updateProjectInStore(p.id, payload);
        notifyToast(`Đã cập nhật dự án ${payload.id}!`);
      } else if (store && typeof store.addProject === 'function') {
        store.addProject(payload);
        notifyToast(`Đã tạo dự án mới ${payload.id}!`);
      }
      backdrop.remove();
      if (typeof onDone === 'function') onDone();
    };
  }

  function openResourceDialog(existingRes, onDone) {
    const isEdit = Boolean(existingRes);
    const r = existingRes ? normalizeResource(existingRes) : {
      name: '',
      role: 'Kỹ sư Hệ thống & Hạ tầng IT',
      utilization: 30
    };

    const backdrop = document.createElement('div');
    backdrop.className = 'itpm-inline-modal-backdrop';
    backdrop.innerHTML = `
      <div class="itpm-inline-modal">
        <h3>${isEdit ? 'Cập Nhật Nguồn Lực: ' + escapeHtml(r.name) : 'Thêm Nguồn Lực IT Mới'}</h3>
        <form id="itpm-ext-res-form">
          <div class="itpm-form-row">
            <label>Tên Đơn Vị / Nhân Sự Phụ Trách</label>
            <input class="itpm-input" name="name" value="${escapeHtml(r.name)}" ${isEdit ? 'readonly' : ''} placeholder="VD: Phù Cát, Qui Nhơn..." required />
          </div>
          <div class="itpm-form-row">
            <label>Chuyên Môn / Vai Trò</label>
            <input class="itpm-input" name="role" value="${escapeHtml(r.role)}" required />
          </div>
          <div class="itpm-form-row">
            <label>Chỉ Số Tải / Công Suất Nguồn Lực (0 - 100)</label>
            <input type="number" min="0" max="100" class="itpm-input" name="utilization" value="${r.utilization}" required />
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
            <button type="button" class="itpm-btn" id="itpm-res-cancel">Hủy</button>
            <button type="submit" class="itpm-btn itpm-btn-gold">${isEdit ? 'Lưu Thay Đổi' : 'Thêm Nguồn Lực'}</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.querySelector('#itpm-res-cancel').onclick = () => backdrop.remove();
    backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };

    backdrop.querySelector('#itpm-ext-res-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const util = Math.max(0, Math.min(100, Number(fd.get('utilization') || 0)));
      const payload = {
        id: isEdit ? (r.id || r.name) : fd.get('name').trim(),
        name: fd.get('name').trim(),
        role: fd.get('role').trim(),
        utilization: util,
        score: util,
        capacity: util
      };
      const store = getStore();
      if (isEdit) {
        updateResourceInStore(r.id || r.name, payload);
        notifyToast(`Đã cập nhật nguồn lực ${payload.name} (${util})!`);
      } else if (store && typeof store.addResource === 'function') {
        store.addResource(payload);
        notifyToast(`Đã thêm nguồn lực ${payload.name}!`);
      }
      backdrop.remove();
      if (typeof onDone === 'function') onDone();
    };
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =========================================================================
  // 1. TASKS & PROJECTS MANAGER VIEW (`renderTasksManagerView`)
  // =========================================================================

  function renderTasksManagerView(containerEl) {
    if (!containerEl) return;
    ensureExtendedStyles();

    const state = getStateData();
    const projects = (state.projects || []).map(normalizeProject);
    const allTasks = (state.tasks || []).map(normalizeTask);
    const resources = (state.resources || []).map(normalizeResource);

    // Collect unique assignees
    const assigneeNames = Array.from(new Set([
      ...resources.map(r => r.name),
      ...allTasks.map(t => t.assignee)
    ])).filter(Boolean);

    // Filter tasks according to uiState.tasksFilter
    const f = uiState.tasksFilter;
    const q = (f.search || '').trim().toLowerCase();

    const filteredTasks = allTasks.filter(t => {
      if (f.project !== 'ALL' && t.projectId !== f.project) return false;
      if (f.assignee !== 'ALL' && t.assignee !== f.assignee) return false;
      if (f.status !== 'ALL') {
        if (f.status === 'Quá hạn') {
          if (!t.isOverdue) return false;
        } else if (t.status !== f.status) {
          return false;
        }
      }
      if (q) {
        const hay = `${t.code} ${t.projectId} ${t.title} ${t.assignee} ${t.status}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    containerEl.innerHTML = `
      <div class="itpm-ext-wrap">
        <!-- Header -->
        <div class="itpm-ext-header">
          <div class="itpm-ext-title-group">
            <h2>📋 Quản Lý Công Việc & Dự Án CNTT</h2>
            <p>Điều hành chi tiết ${projects.length} dự án trọng điểm & ${allTasks.length} hạng mục kỹ thuật (Đang hiển thị: <strong>${filteredTasks.length}</strong> công việc)</p>
          </div>
          <div class="itpm-ext-actions">
            <button class="itpm-btn" id="btn-ext-add-project">+ Thêm Dự Án Mới</button>
            <button class="itpm-btn itpm-btn-gold" id="btn-ext-add-task">+ Thêm Công Việc Mới</button>
          </div>
        </div>

        <!-- Project Summary Cards Row -->
        <div class="itpm-proj-strip">
          ${projects.map(p => {
            const pTasks = allTasks.filter(t => t.projectId === p.id);
            const pDone = pTasks.filter(t => t.status === 'Hoàn thành').length;
            const pOverdue = pTasks.filter(t => t.isOverdue).length;
            const isSelected = f.project === p.id;
            return `
              <div class="itpm-proj-card ${isSelected ? 'active-filter' : ''}" data-proj-card="${escapeHtml(p.id)}">
                <div class="itpm-proj-card-top">
                  <span class="itpm-proj-code" data-filter-proj="${escapeHtml(p.id)}" title="Nhấn để lọc theo dự án ${escapeHtml(p.id)}">${escapeHtml(p.id)}</span>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:0.82rem;font-weight:800;color:#deba64;" id="proj-pct-lbl-${escapeHtml(p.id)}">${p.progress}%</span>
                    <button class="itpm-btn itpm-btn-sm" data-edit-proj="${escapeHtml(p.id)}" title="Sửa dự án">Sửa</button>
                  </div>
                </div>
                <div class="itpm-proj-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
                <div class="itpm-progress-track">
                  <div class="itpm-progress-fill" id="proj-bar-${escapeHtml(p.id)}" style="width:${p.progress}%;"></div>
                </div>
                <input type="range" min="0" max="100" value="${p.progress}" class="itpm-slider" data-proj-slider="${escapeHtml(p.id)}" title="Kéo để cập nhật tiến độ dự án ${escapeHtml(p.id)}" />
                <div class="itpm-proj-stats">
                  <span>Tổng: <strong>${pTasks.length}</strong> NV (${pDone} xong)</span>
                  <span style="color:${pOverdue > 0 ? '#ff8a7a' : '#9be6ad'};font-weight:700;">
                    ${pOverdue > 0 ? `⚠ ${pOverdue} quá hạn` : '✓ Đúng hạn'}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Top Filter Bar -->
        <div class="itpm-filter-bar">
          <div>
            <input type="text" class="itpm-input" id="ext-filter-search" placeholder="🔍 Tìm mã NV (CTax0013), tên công việc (ERP, Cloud, Bảo mật)..." value="${escapeHtml(f.search)}" />
          </div>
          <div>
            <select class="itpm-select" id="ext-filter-project">
              <option value="ALL" ${f.project === 'ALL' ? 'selected' : ''}>Tất cả Dự Án (CTPro01..07)</option>
              ${projects.map(p => `<option value="${escapeHtml(p.id)}" ${f.project === p.id ? 'selected' : ''}>${escapeHtml(p.id)} — ${escapeHtml(p.name)}</option>`).join('')}
            </select>
          </div>
          <div>
            <select class="itpm-select" id="ext-filter-status">
              <option value="ALL" ${f.status === 'ALL' ? 'selected' : ''}>Trạng Thái: Tất cả</option>
              <option value="Hoàn thành" ${f.status === 'Hoàn thành' ? 'selected' : ''}>✓ Hoàn thành</option>
              <option value="Đang thực hiện" ${f.status === 'Đang thực hiện' ? 'selected' : ''}>⚡ Đang thực hiện</option>
              <option value="Chưa bắt đầu" ${f.status === 'Chưa bắt đầu' ? 'selected' : ''}>⏳ Chưa bắt đầu</option>
              <option value="Quá hạn" ${f.status === 'Quá hạn' ? 'selected' : ''}>🚨 Quá hạn (${allTasks.filter(t => t.isOverdue).length})</option>
            </select>
          </div>
          <div>
            <select class="itpm-select" id="ext-filter-assignee">
              <option value="ALL" ${f.assignee === 'ALL' ? 'selected' : ''}>Người Làm: Tất cả</option>
              ${assigneeNames.map(a => `<option value="${escapeHtml(a)}" ${f.assignee === a ? 'selected' : ''}>👤 ${escapeHtml(a)}</option>`).join('')}
            </select>
          </div>
          <div>
            <button class="itpm-btn" id="ext-filter-reset" title="Xóa bộ lọc">Đặt lại</button>
          </div>
        </div>

        <!-- Tasks Interactive Table -->
        <div class="itpm-table-card">
          <div class="itpm-table-scroll">
            <table class="itpm-table">
              <thead>
                <tr>
                  <th>Mã NV</th>
                  <th>Dự Án</th>
                  <th>Tên Công Việc IT</th>
                  <th>Người Làm</th>
                  <th>Hạn Chót</th>
                  <th>Trạng Thái</th>
                  <th style="min-width:165px;">Tiến Độ ( kéo thanh trượt )</th>
                  <th>Tình Trạng Quá Hạn</th>
                  <th style="text-align:right;">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTasks.length === 0 ? `
                  <tr>
                    <td colspan="9" style="text-align:center;padding:28px;color:#cbbf9e;">
                      Không tìm thấy công việc phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ` : filteredTasks.map(t => `
                  <tr class="${t.isOverdue ? 'row-overdue' : ''}" data-task-row="${escapeHtml(t.code)}">
                    <td><strong style="color:#f5d98e;">${escapeHtml(t.code)}</strong></td>
                    <td><span class="itpm-badge itpm-badge-project">${escapeHtml(t.projectId)}</span></td>
                    <td style="max-width:290px;font-weight:500;">${escapeHtml(t.title)}</td>
                    <td><span style="color:#e5dcc4;">👤 ${escapeHtml(t.assignee)}</span></td>
                    <td style="white-space:nowrap;">${formatDateVN(t.endDate)}</td>
                    <td>
                      <select class="itpm-select" style="padding:4px 8px;font-size:0.76rem;width:auto;" data-task-status="${escapeHtml(t.code)}">
                        <option value="Chưa bắt đầu" ${t.status === 'Chưa bắt đầu' ? 'selected' : ''}>Chưa bắt đầu</option>
                        <option value="Đang thực hiện" ${t.status === 'Đang thực hiện' ? 'selected' : ''}>Đang thực hiện</option>
                        <option value="Hoàn thành" ${t.status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
                      </select>
                    </td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px;">
                        <input type="range" min="0" max="100" value="${t.progress}" class="itpm-slider" data-task-slider="${escapeHtml(t.code)}" />
                        <span style="min-width:36px;font-size:0.76rem;font-weight:700;color:#f5d98e;" id="task-pct-${escapeHtml(t.code)}">${t.progress}%</span>
                      </div>
                    </td>
                    <td>
                      ${t.status === 'Hoàn thành'
                        ? `<span class="itpm-badge itpm-badge-done">✓ Đã hoàn thành</span>`
                        : (t.isOverdue
                          ? `<span class="itpm-badge itpm-badge-overdue">Quá hạn ${t.overdueDays} ngày</span>`
                          : `<span class="itpm-badge itpm-badge-ok">Đúng tiến độ</span>`)
                      }
                    </td>
                    <td style="text-align:right;white-space:nowrap;">
                      <button class="itpm-btn itpm-btn-sm" data-action-edit="${escapeHtml(t.code)}" title="Chỉnh sửa công việc">Sửa</button>
                      ${t.status !== 'Hoàn thành' ? `
                        <button class="itpm-btn itpm-btn-sm itpm-btn-gold" data-action-complete="${escapeHtml(t.code)}" title="Đánh dấu hoàn thành 100%">Hoàn thành</button>
                      ` : ''}
                      <button class="itpm-btn itpm-btn-sm itpm-btn-danger" data-action-delete="${escapeHtml(t.code)}" title="Xóa công việc">Xóa</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Wire Event Listeners
    const searchEl = containerEl.querySelector('#ext-filter-search');
    if (searchEl) {
      searchEl.addEventListener('input', (e) => {
        uiState.tasksFilter.search = e.target.value;
        const pos = e.target.selectionStart;
        renderTasksManagerView(containerEl);
        const nextSearch = containerEl.querySelector('#ext-filter-search');
        if (nextSearch) {
          nextSearch.focus();
          try { nextSearch.setSelectionRange(pos, pos); } catch (_) {}
        }
      });
    }

    containerEl.querySelector('#ext-filter-project')?.addEventListener('change', (e) => {
      uiState.tasksFilter.project = e.target.value;
      renderTasksManagerView(containerEl);
    });

    containerEl.querySelector('#ext-filter-status')?.addEventListener('change', (e) => {
      uiState.tasksFilter.status = e.target.value;
      renderTasksManagerView(containerEl);
    });

    containerEl.querySelector('#ext-filter-assignee')?.addEventListener('change', (e) => {
      uiState.tasksFilter.assignee = e.target.value;
      renderTasksManagerView(containerEl);
    });

    containerEl.querySelector('#ext-filter-reset')?.addEventListener('click', () => {
      uiState.tasksFilter = { search: '', project: 'ALL', status: 'ALL', assignee: 'ALL', sortBy: 'code' };
      renderTasksManagerView(containerEl);
      notifyToast('Đã đặt lại bộ lọc danh sách công việc.');
    });

    // Click project code badge on summary card to filter by project
    containerEl.querySelectorAll('[data-filter-proj]').forEach(el => {
      el.addEventListener('click', () => {
        const pid = el.getAttribute('data-filter-proj');
        uiState.tasksFilter.project = uiState.tasksFilter.project === pid ? 'ALL' : pid;
        renderTasksManagerView(containerEl);
      });
    });

    // Project inline progress slider
    containerEl.querySelectorAll('[data-proj-slider]').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const pid = slider.getAttribute('data-proj-slider');
        const val = Number(e.target.value);
        const lbl = containerEl.querySelector(`#proj-pct-lbl-${pid}`);
        const bar = containerEl.querySelector(`#proj-bar-${pid}`);
        if (lbl) lbl.textContent = `${val}%`;
        if (bar) bar.style.width = `${val}%`;
      });
      slider.addEventListener('change', (e) => {
        const pid = slider.getAttribute('data-proj-slider');
        const val = Number(e.target.value);
        updateProjectInStore(pid, { progress: val });
        notifyToast(`Đã cập nhật tiến độ dự án ${pid}: ${val}%`);
        renderTasksManagerView(containerEl);
      });
    });

    // Edit Project buttons
    containerEl.querySelectorAll('[data-edit-proj]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-edit-proj');
        const proj = projects.find(p => p.id === pid);
        openProjectDialog(proj, () => renderTasksManagerView(containerEl));
      });
    });

    // Add Task & Add Project buttons
    containerEl.querySelector('#btn-ext-add-task')?.addEventListener('click', () => {
      openTaskDialog(null, () => renderTasksManagerView(containerEl));
    });
    containerEl.querySelector('#btn-ext-add-project')?.addEventListener('click', () => {
      openProjectDialog(null, () => renderTasksManagerView(containerEl));
    });

    // Task status dropdown change
    containerEl.querySelectorAll('[data-task-status]').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const code = sel.getAttribute('data-task-status');
        const newStatusLabel = e.target.value;
        updateTaskInStore(code, { status: newStatusLabel });
        notifyToast(`Công việc ${code} → "${newStatusLabel}"`);
        renderTasksManagerView(containerEl);
      });
    });

    // Task progress slider change
    containerEl.querySelectorAll('[data-task-slider]').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const code = slider.getAttribute('data-task-slider');
        const lbl = containerEl.querySelector(`#task-pct-${code}`);
        if (lbl) lbl.textContent = `${e.target.value}%`;
      });
      slider.addEventListener('change', (e) => {
        const code = slider.getAttribute('data-task-slider');
        const val = Number(e.target.value);
        updateTaskInStore(code, { progress: val });
        notifyToast(`Đã cập nhật tiến độ ${code}: ${val}%`);
        renderTasksManagerView(containerEl);
      });
    });

    // Row actions: Edit / Complete / Delete
    containerEl.querySelectorAll('[data-action-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-action-edit');
        const task = allTasks.find(t => t.code === code || t.id === code);
        openTaskDialog(task, () => renderTasksManagerView(containerEl));
      });
    });

    containerEl.querySelectorAll('[data-action-complete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-action-complete');
        updateTaskInStore(code, { status: 'completed', progress: 100 });
        notifyToast(`🎉 Công việc ${code} đã hoàn thành 100%!`);
        renderTasksManagerView(containerEl);
      });
    });

    containerEl.querySelectorAll('[data-action-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-action-delete');
        deleteTaskInStore(code);
        notifyToast(`Đã xóa công việc ${code}`, 'danger');
        renderTasksManagerView(containerEl);
      });
    });
  }

  // =========================================================================
  // 2. KANBAN BOARD VIEW (`renderKanbanView`)
  // =========================================================================

  function renderKanbanView(containerEl) {
    if (!containerEl) return;
    ensureExtendedStyles();

    const state = getStateData();
    const projects = (state.projects || []).map(normalizeProject);
    const allTasks = (state.tasks || []).map(normalizeTask);
    const resources = (state.resources || []).map(normalizeResource);

    const kf = uiState.kanbanFilter;
    const q = (kf.search || '').trim().toLowerCase();

    const filtered = allTasks.filter(t => {
      if (kf.project !== 'ALL' && t.projectId !== kf.project) return false;
      if (kf.assignee !== 'ALL' && t.assignee !== kf.assignee) return false;
      if (q) {
        const hay = `${t.code} ${t.projectId} ${t.title} ${t.assignee}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const columns = [
      {
        status: 'Chưa bắt đầu',
        title: 'Chưa bắt đầu',
        accent: '#f24836',
        badgeBg: 'rgba(242, 72, 54, 0.2)',
        items: filtered.filter(t => t.status === 'Chưa bắt đầu')
      },
      {
        status: 'Đang thực hiện',
        title: 'Đang thực hiện',
        accent: '#ffffff',
        badgeBg: 'rgba(255, 255, 255, 0.16)',
        items: filtered.filter(t => t.status === 'Đang thực hiện')
      },
      {
        status: 'Hoàn thành',
        title: 'Hoàn thành',
        accent: '#deba64',
        badgeBg: 'rgba(222, 186, 100, 0.25)',
        items: filtered.filter(t => t.status === 'Hoàn thành')
      }
    ];

    containerEl.innerHTML = `
      <div class="itpm-ext-wrap">
        <div class="itpm-ext-header">
          <div class="itpm-ext-title-group">
            <h2>🗂️ Bảng Điều Phối Agile IT Kanban</h2>
            <p>Kéo thả thẻ (Drag & Drop) hoặc nhấn mũi tên chuyển cột nhanh để cập nhật trạng thái công việc theo thời gian thực</p>
          </div>
          <div class="itpm-ext-actions">
            <select class="itpm-select" id="kb-filter-project" style="width:auto;">
              <option value="ALL" ${kf.project === 'ALL' ? 'selected' : ''}>Tất cả Dự Án</option>
              ${projects.map(p => `<option value="${escapeHtml(p.id)}" ${kf.project === p.id ? 'selected' : ''}>${escapeHtml(p.id)} — ${escapeHtml(p.name)}</option>`).join('')}
            </select>
            <select class="itpm-select" id="kb-filter-assignee" style="width:auto;">
              <option value="ALL" ${kf.assignee === 'ALL' ? 'selected' : ''}>Tất cả Nguồn Lực</option>
              ${resources.map(r => `<option value="${escapeHtml(r.name)}" ${kf.assignee === r.name ? 'selected' : ''}>👤 ${escapeHtml(r.name)}</option>`).join('')}
            </select>
            <button class="itpm-btn itpm-btn-gold" id="kb-add-task">+ Thêm Thẻ Công Việc</button>
          </div>
        </div>

        <div class="itpm-kanban-grid">
          ${columns.map((col, colIdx) => `
            <div class="itpm-kanban-col" data-kanban-col="${escapeHtml(col.status)}">
              <div class="itpm-kanban-col-head" style="border-top: 4px solid ${col.accent};">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="width:10px;height:10px;border-radius:50%;background:${col.accent};display:inline-block;"></span>
                  <strong style="font-size:0.92rem;color:${col.accent};">${escapeHtml(col.title)}</strong>
                </div>
                <span class="itpm-badge" style="background:${col.badgeBg};color:${col.accent};border:1px solid ${col.accent};">
                  ${col.items.length} công việc
                </span>
              </div>
              <div class="itpm-kanban-cards" data-dropzone="${escapeHtml(col.status)}">
                ${col.items.length === 0 ? `
                  <div style="text-align:center;padding:34px 12px;color:#9e947a;font-size:0.8rem;border:1px dashed rgba(222,186,100,0.2);border-radius:8px;">
                    Kéo thả công việc vào cột "${escapeHtml(col.title)}"
                  </div>
                ` : col.items.map(t => {
                  const cardStateClass = t.status === 'Hoàn thành'
                    ? 'kcard-done'
                    : (t.isOverdue ? 'kcard-overdue' : 'kcard-active');
                  const prevCol = colIdx > 0 ? columns[colIdx - 1].status : null;
                  const nextCol = colIdx < columns.length - 1 ? columns[colIdx + 1].status : null;

                  return `
                    <div class="itpm-kcard ${cardStateClass}" draggable="true" data-kcard-code="${escapeHtml(t.code)}">
                      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                        <div style="display:flex;align-items:center;gap:6px;">
                          <strong style="color:#f5d98e;font-size:0.82rem;">${escapeHtml(t.code)}</strong>
                          <span class="itpm-badge itpm-badge-project">${escapeHtml(t.projectId)}</span>
                        </div>
                        ${t.isOverdue ? `<span class="itpm-badge itpm-badge-overdue">Quá hạn ${t.overdueDays} ngày</span>` : ''}
                      </div>

                      <div style="font-size:0.83rem;font-weight:600;color:#f4f1ea;line-height:1.35;">
                        ${escapeHtml(t.title)}
                      </div>

                      <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;color:#cbbf9e;">
                        <span>👤 <strong>${escapeHtml(t.assignee)}</strong></span>
                        <span>📅 ${formatDateVN(t.endDate)}</span>
                      </div>

                      <div>
                        <div style="display:flex;justify-content:space-between;font-size:0.71rem;color:#cbbf9e;margin-bottom:3px;">
                          <span>Tiến độ</span>
                          <strong style="color:#f5d98e;">${t.progress}%</strong>
                        </div>
                        <div class="itpm-progress-track">
                          <div class="itpm-progress-fill" style="width:${t.progress}%;background:${t.isOverdue ? '#f24836' : 'linear-gradient(90deg,#c99e3b,#f0d27f)'};"></div>
                        </div>
                      </div>

                      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06);">
                        <button class="itpm-btn itpm-btn-sm" data-kb-edit="${escapeHtml(t.code)}">Sửa</button>
                        <div style="display:flex;gap:5px;">
                          ${prevCol ? `
                            <button class="itpm-btn itpm-btn-sm" data-kb-move="${escapeHtml(t.code)}" data-kb-target="${escapeHtml(prevCol)}" title="Chuyển sang ${escapeHtml(prevCol)}">
                              ← ${escapeHtml(prevCol)}
                            </button>
                          ` : ''}
                          ${nextCol ? `
                            <button class="itpm-btn itpm-btn-sm itpm-btn-gold" data-kb-move="${escapeHtml(t.code)}" data-kb-target="${escapeHtml(nextCol)}" title="Chuyển sang ${escapeHtml(nextCol)}">
                              ${escapeHtml(nextCol)} →
                            </button>
                          ` : ''}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Filter handlers
    containerEl.querySelector('#kb-filter-project')?.addEventListener('change', (e) => {
      uiState.kanbanFilter.project = e.target.value;
      renderKanbanView(containerEl);
    });
    containerEl.querySelector('#kb-filter-assignee')?.addEventListener('change', (e) => {
      uiState.kanbanFilter.assignee = e.target.value;
      renderKanbanView(containerEl);
    });
    containerEl.querySelector('#kb-add-task')?.addEventListener('click', () => {
      openTaskDialog(null, () => renderKanbanView(containerEl));
    });

    // Quick-move arrow buttons
    containerEl.querySelectorAll('[data-kb-move]').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-kb-move');
        const targetStatus = btn.getAttribute('data-kb-target');
        updateTaskInStore(code, { status: targetStatus });
        notifyToast(`Đã chuyển ${code} sang "${targetStatus}"`);
        renderKanbanView(containerEl);
      });
    });

    // Edit buttons on cards
    containerEl.querySelectorAll('[data-kb-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-kb-edit');
        const task = allTasks.find(t => t.code === code || t.id === code);
        openTaskDialog(task, () => renderKanbanView(containerEl));
      });
    });

    // HTML5 Drag & Drop
    let draggedCode = null;
    containerEl.querySelectorAll('[data-kcard-code]').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedCode = card.getAttribute('data-kcard-code');
        e.dataTransfer.setData('text/plain', draggedCode);
        e.dataTransfer.effectAllowed = 'move';
        card.style.opacity = '0.55';
      });
      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
      });
    });

    containerEl.querySelectorAll('[data-kanban-col]').forEach(colEl => {
      colEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        colEl.classList.add('drag-over');
      });
      colEl.addEventListener('dragleave', () => {
        colEl.classList.remove('drag-over');
      });
      colEl.addEventListener('drop', (e) => {
        e.preventDefault();
        colEl.classList.remove('drag-over');
        const targetStatus = colEl.getAttribute('data-kanban-col');
        const code = e.dataTransfer.getData('text/plain') || draggedCode;
        if (code && targetStatus) {
          updateTaskInStore(code, { status: targetStatus });
          notifyToast(`Kéo thả: ${code} → "${targetStatus}"`);
          renderKanbanView(containerEl);
        }
      });
    });
  }

  // =========================================================================
  // 3. GANTT TIMELINE VIEW (`renderGanttView`)
  // =========================================================================

  function renderGanttView(containerEl) {
    if (!containerEl) return;
    ensureExtendedStyles();

    const state = getStateData();
    const projects = (state.projects || []).map(normalizeProject).sort((a, b) => b.id.localeCompare(a.id)); // CTPro07 down to CTPro01
    const allTasks = (state.tasks || []).map(normalizeTask);

    const gf = uiState.ganttFilter;

    // Calendar Window: Jan 01, 2025 -> Dec 31, 2025
    const TIMELINE_START_MS = Date.UTC(2025, 0, 1);
    const TIMELINE_END_MS = Date.UTC(2025, 11, 31, 23, 59, 59);
    const TOTAL_SPAN_MS = TIMELINE_END_MS - TIMELINE_START_MS;

    const todayPct = Math.max(0, Math.min(100, ((REFERENCE_TODAY_MS - TIMELINE_START_MS) / TOTAL_SPAN_MS) * 100));

    const months = ['Thg 01', 'Thg 02', 'Thg 03', 'Thg 04', 'Thg 05', 'Thg 06', 'Thg 07', 'Thg 08', 'Thg 09', 'Thg 10', 'Thg 11', 'Thg 12'];

    const displayedProjects = gf.project === 'ALL'
      ? projects
      : projects.filter(p => p.id === gf.project);

    containerEl.innerHTML = `
      <div class="itpm-ext-wrap">
        <div class="itpm-ext-header">
          <div class="itpm-ext-title-group">
            <h2>📅 Tiến Độ Gantt — Lộ Trình Dự Án & Hạng Mục CNTT</h2>
            <p>Biểu đồ tiến độ tổng thể từ CTPro07 đến CTPro01 • Mốc đối chiếu: <strong style="color:#00e5ff;">Today: 08/10/2025</strong></p>
          </div>
          <div class="itpm-ext-actions">
            <div style="display:flex;align-items:center;gap:12px;font-size:0.76rem;margin-right:8px;">
              <span><span style="display:inline-block;width:10px;height:10px;background:#deba64;border-radius:2px;margin-right:4px;"></span>Hoàn thành</span>
              <span><span style="display:inline-block;width:10px;height:10px;background:#ffffff;border-radius:2px;margin-right:4px;"></span>Đang thực hiện</span>
              <span><span style="display:inline-block;width:10px;height:10px;background:#e0533c;border-radius:2px;margin-right:4px;"></span>Quá hạn</span>
              <span><span style="display:inline-block;width:10px;height:10px;background:#00e5ff;border-radius:2px;margin-right:4px;"></span>Today (08/10/2025)</span>
            </div>
            <select class="itpm-select" id="gantt-filter-proj" style="width:auto;">
              <option value="ALL" ${gf.project === 'ALL' ? 'selected' : ''}>Tất cả Dự Án (CTPro07 → CTPro01)</option>
              ${projects.map(p => `<option value="${escapeHtml(p.id)}" ${gf.project === p.id ? 'selected' : ''}>${escapeHtml(p.id)} — ${escapeHtml(p.name)}</option>`).join('')}
            </select>
            <select class="itpm-select" id="gantt-filter-status" style="width:auto;">
              <option value="ALL" ${gf.status === 'ALL' ? 'selected' : ''}>Mọi Trạng Thái</option>
              <option value="OVERDUE" ${gf.status === 'OVERDUE' ? 'selected' : ''}>Chỉ Hiện Quá Hạn</option>
              <option value="ACTIVE" ${gf.status === 'ACTIVE' ? 'selected' : ''}>Đang Thực Hiện</option>
              <option value="DONE" ${gf.status === 'DONE' ? 'selected' : ''}>Đã Hoàn Thành</option>
            </select>
          </div>
        </div>

        <div class="itpm-gantt-card">
          <!-- Timeline Header Row -->
          <div class="itpm-gantt-row" style="background:rgba(20,18,12,0.95);border-bottom:1px solid rgba(222,186,100,0.3);">
            <div class="itpm-gantt-label" style="font-weight:700;color:#deba64;">
              <span>Dự Án / Mã Công Việc IT</span>
              <span>Tiến Độ</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(12, 1fr);position:relative;height:36px;align-items:center;">
              ${months.map(m => `<div style="text-align:center;font-size:0.72rem;font-weight:700;color:#cbbf9e;border-right:1px solid rgba(255,255,255,0.06);">${m}/2025</div>`).join('')}
              <div class="itpm-gantt-today-line" style="left:${todayPct.toFixed(2)}%;" title="Today: 08/10/2025"></div>
            </div>
          </div>

          <!-- Project & Child Task Rows -->
          ${displayedProjects.map(proj => {
            let pTasks = allTasks.filter(t => t.projectId === proj.id);
            if (gf.status === 'OVERDUE') pTasks = pTasks.filter(t => t.isOverdue);
            if (gf.status === 'ACTIVE') pTasks = pTasks.filter(t => t.status === 'Đang thực hiện');
            if (gf.status === 'DONE') pTasks = pTasks.filter(t => t.status === 'Hoàn thành');

            // Compute project span
            const startTimes = pTasks.map(t => parseDateMs(t.startDate));
            const endTimes = pTasks.map(t => parseDateMs(t.endDate));
            const pStartMs = startTimes.length ? Math.min(...startTimes) : Date.UTC(2025, 1, 1);
            const pEndMs = endTimes.length ? Math.max(...endTimes) : Date.UTC(2025, 9, 1);

            const pLeft = Math.max(0, Math.min(96, ((pStartMs - TIMELINE_START_MS) / TOTAL_SPAN_MS) * 100));
            const pWidth = Math.max(4, Math.min(100 - pLeft, ((pEndMs - pStartMs) / TOTAL_SPAN_MS) * 100));

            return `
              <!-- Project Group Summary Bar -->
              <div class="itpm-gantt-row project-group-row">
                <div class="itpm-gantt-label">
                  <span style="color:#f5d98e;">📁 ${escapeHtml(proj.id)} — ${escapeHtml(proj.name)}</span>
                  <span class="itpm-badge itpm-badge-project">${proj.progress}%</span>
                </div>
                <div class="itpm-gantt-track-area">
                  <div class="itpm-gantt-today-line" style="left:${todayPct.toFixed(2)}%;"></div>
                  <div class="itpm-gantt-bar" style="left:${pLeft.toFixed(2)}%;width:${pWidth.toFixed(2)}%;background:rgba(222,186,100,0.28);border:1px solid #deba64;color:#ffe39e;">
                    ${escapeHtml(proj.id)} (${proj.progress}% hoàn thành • ${pTasks.length} công việc)
                  </div>
                </div>
              </div>

              <!-- Child Task Bars -->
              ${pTasks.map(t => {
                const endMs = parseDateMs(t.endDate);
                let startMs = t.startDate ? parseDateMs(t.startDate) : (endMs - 35 * 86400000);
                if (endMs - startMs < 18 * 86400000) {
                  startMs = endMs - 28 * 86400000;
                }
                const leftPct = Math.max(0, Math.min(95, ((startMs - TIMELINE_START_MS) / TOTAL_SPAN_MS) * 100));
                const widthPct = Math.max(3.5, Math.min(100 - leftPct, ((endMs - startMs) / TOTAL_SPAN_MS) * 100));

                let barBg = '#ffffff';
                let barColor = '#1c1911';
                if (t.status === 'Hoàn thành') {
                  barBg = '#deba64';
                  barColor = '#1c1911';
                } else if (t.isOverdue) {
                  barBg = '#e0533c';
                  barColor = '#ffffff';
                }

                return `
                  <div class="itpm-gantt-row">
                    <div class="itpm-gantt-label" style="padding-left:24px;">
                      <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(t.code)} - ${escapeHtml(t.title)}">
                        <strong style="color:#f5d98e;">${escapeHtml(t.code)}</strong> • ${escapeHtml(t.title)}
                      </div>
                      <span style="font-size:0.71rem;color:${t.isOverdue ? '#ff8a7a' : '#cbbf9e'};white-space:nowrap;">
                        ${escapeHtml(t.assignee)}
                      </span>
                    </div>
                    <div class="itpm-gantt-track-area">
                      <div class="itpm-gantt-today-line" style="left:${todayPct.toFixed(2)}%;"></div>
                      <div class="itpm-gantt-bar"
                           data-gantt-task="${escapeHtml(t.code)}"
                           style="left:${leftPct.toFixed(2)}%;width:${widthPct.toFixed(2)}%;background:${barBg};color:${barColor};"
                           title="${escapeHtml(t.code)}: ${escapeHtml(t.title)} | Người làm: ${escapeHtml(t.assignee)} | Hạn: ${formatDateVN(t.endDate)} (${t.progress}%)">
                        ${escapeHtml(t.code)} (${t.progress}%)${t.isOverdue ? ` • Quá hạn ${t.overdueDays}d` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            `;
          }).join('')}
        </div>
      </div>
    `;

    containerEl.querySelector('#gantt-filter-proj')?.addEventListener('change', (e) => {
      uiState.ganttFilter.project = e.target.value;
      renderGanttView(containerEl);
    });
    containerEl.querySelector('#gantt-filter-status')?.addEventListener('change', (e) => {
      uiState.ganttFilter.status = e.target.value;
      renderGanttView(containerEl);
    });

    containerEl.querySelectorAll('[data-gantt-task]').forEach(bar => {
      bar.addEventListener('click', () => {
        const code = bar.getAttribute('data-gantt-task');
        const task = allTasks.find(t => t.code === code || t.id === code);
        openTaskDialog(task, () => renderGanttView(containerEl));
      });
    });
  }

  // =========================================================================
  // 4. RESOURCES & TEAM CAPACITY MANAGER VIEW (`renderResourcesView`)
  // =========================================================================

  function renderResourcesView(containerEl) {
    if (!containerEl) return;
    ensureExtendedStyles();

    const state = getStateData();
    const resources = (state.resources || []).map(normalizeResource);
    const allTasks = (state.tasks || []).map(normalizeTask);

    containerEl.innerHTML = `
      <div class="itpm-ext-wrap">
        <div class="itpm-ext-header">
          <div class="itpm-ext-title-group">
            <h2>👥 Quản Lý Nguồn Lực & Công Suất Đội Ngũ CNTT</h2>
            <p>Theo dõi mức độ phân bổ nguồn lực (Phù Cát, Kỳ Co, Đập Đá, An Nhơn, Qui Nhơn, Đề Gi, Cát Tiến) và điều chỉnh tải trực tiếp</p>
          </div>
          <div class="itpm-ext-actions">
            <button class="itpm-btn itpm-btn-gold" id="res-add-btn">+ Thêm Nguồn Lực Mới</button>
          </div>
        </div>

        <div class="itpm-res-grid">
          ${resources.map(res => {
            const assigned = allTasks.filter(t => t.assignee === res.name);
            const completed = assigned.filter(t => t.status === 'Hoàn thành').length;
            const active = assigned.filter(t => t.status === 'Đang thực hiện').length;
            const notStarted = assigned.filter(t => t.status === 'Chưa bắt đầu').length;
            const overdue = assigned.filter(t => t.isOverdue).length;

            const initials = res.name
              .split(/\s+/)
              .map(w => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return `
              <div class="itpm-res-card" data-res-card="${escapeHtml(res.name)}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div class="itpm-res-avatar">${escapeHtml(initials)}</div>
                    <div>
                      <div style="font-size:0.98rem;font-weight:800;color:#f5d98e;">${escapeHtml(res.name)}</div>
                      <div style="font-size:0.75rem;color:#cbbf9e;">${escapeHtml(res.role)}</div>
                    </div>
                  </div>
                  <button class="itpm-btn itpm-btn-sm" data-res-edit="${escapeHtml(res.name)}">Sửa</button>
                </div>

                <!-- Utilization Score & Interactive Slider -->
                <div style="background:rgba(20,18,12,0.55);padding:10px 12px;border-radius:8px;border:1px solid rgba(222,186,100,0.2);">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="font-size:0.76rem;color:#d6cba8;">Chỉ số Nguồn lực / Hiệu suất:</span>
                    <strong style="font-size:1.05rem;color:#deba64;" id="res-score-lbl-${escapeHtml(res.name)}">${res.utilization}</strong>
                  </div>
                  <div class="itpm-progress-track" style="margin-bottom:7px;">
                    <div class="itpm-progress-fill" id="res-score-bar-${escapeHtml(res.name)}" style="width:${res.utilization}%;"></div>
                  </div>
                  <input type="range" min="0" max="100" value="${res.utilization}" class="itpm-slider" data-res-slider="${escapeHtml(res.name)}" title="Kéo để điều chỉnh chỉ số nguồn lực của ${escapeHtml(res.name)}" />
                </div>

                <!-- Task Breakdown KPI Grid -->
                <div class="itpm-kpi-mini-grid">
                  <div class="itpm-kpi-mini">
                    <strong style="color:#f4f1ea;">${assigned.length}</strong>
                    <span>Tổng NV</span>
                  </div>
                  <div class="itpm-kpi-mini">
                    <strong style="color:#deba64;">${completed}</strong>
                    <span>Hoàn thành</span>
                  </div>
                  <div class="itpm-kpi-mini">
                    <strong style="color:#ffffff;">${active + notStarted}</strong>
                    <span>Đang mở</span>
                  </div>
                  <div class="itpm-kpi-mini">
                    <strong style="color:#f24836;">${overdue}</strong>
                    <span>Quá hạn</span>
                  </div>
                </div>

                <!-- Assigned Tasks Preview List -->
                <div style="display:flex;flex-direction:column;gap:5px;max-height:135px;overflow-y:auto;padding-right:2px;">
                  ${assigned.length === 0 ? `
                    <div style="font-size:0.75rem;color:#9e947a;font-style:italic;">Chưa có công việc được giao</div>
                  ` : assigned.map(t => `
                    <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.74rem;padding:5px 8px;background:rgba(255,255,255,0.04);border-radius:5px;">
                      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:185px;">
                        <strong style="color:#f5d98e;">${escapeHtml(t.code)}</strong> • ${escapeHtml(t.title)}
                      </span>
                      <span class="itpm-badge ${t.status === 'Hoàn thành' ? 'itpm-badge-done' : (t.isOverdue ? 'itpm-badge-overdue' : 'itpm-badge-project')}">
                        ${t.status === 'Hoàn thành' ? '100%' : (t.isOverdue ? `Trễ ${t.overdueDays}d` : `${t.progress}%`)}
                      </span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Add Resource button
    containerEl.querySelector('#res-add-btn')?.addEventListener('click', () => {
      openResourceDialog(null, () => renderResourcesView(containerEl));
    });

    // Edit Resource buttons
    containerEl.querySelectorAll('[data-res-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-res-edit');
        const res = resources.find(r => r.name === name || r.id === name);
        openResourceDialog(res, () => renderResourcesView(containerEl));
      });
    });

    // Interactive capacity sliders
    containerEl.querySelectorAll('[data-res-slider]').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const name = slider.getAttribute('data-res-slider');
        const val = Number(e.target.value);
        const lbl = document.getElementById(`res-score-lbl-${name}`);
        const bar = document.getElementById(`res-score-bar-${name}`);
        if (lbl) lbl.textContent = String(val);
        if (bar) bar.style.width = `${val}%`;
      });
      slider.addEventListener('change', (e) => {
        const name = slider.getAttribute('data-res-slider');
        const val = Number(e.target.value);
        updateResourceInStore(name, { utilization: val });
        notifyToast(`Đã cập nhật chỉ số nguồn lực ${name}: ${val}`);
        renderResourcesView(containerEl);
      });
    });
  }

  // Export Public API
  window.ITPM.viewsExtended = {
    renderTasksManagerView,
    renderKanbanView,
    renderGanttView,
    renderResourcesView
  };
})();
