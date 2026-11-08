/**
 * IT Project Management Enterprise Dashboard - Interactive CRUD Modals & Toast System
 * Namespace: window.ITPM.modals
 *
 * Provides full client-side CRUD dialogs for:
 *   1. openProjectModal(projectId = null)
 *   2. openTaskModal(taskId = null, defaultProjectId = null)
 *   3. openResourceModal(resourceId = null)
 *   4. showToast(message, type = "success")
 *   5. closeModal()
 */
(function () {
  "use strict";

  window.ITPM = window.ITPM || {};

  const MODAL_ROOT_ID = "itpm-modal-root";
  const TOAST_ROOT_ID = "itpm-toast-container";
  const STYLE_TAG_ID = "itpm-modals-inline-styles";

  let activeEscListener = null;

  // =========================================================================
  // 1. Self-Contained Enterprise Styling for Modals & Toasts
  // =========================================================================

  function ensureModalStyles() {
    if (document.getElementById(STYLE_TAG_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_TAG_ID;
    style.textContent = `
      /* Modal Backdrop & Container */
      .itpm-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9990;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        transition: opacity 0.18s ease-out;
        font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
      }
      .itpm-modal-backdrop.is-open {
        opacity: 1;
      }
      .itpm-modal-dialog {
        background: #ffffff;
        color: #1e293b;
        width: 100%;
        max-width: 640px;
        max-height: 92vh;
        border-radius: 14px;
        box-shadow: 0 22px 50px -12px rgba(15, 23, 42, 0.38), 0 0 0 1px rgba(15, 23, 42, 0.08);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(12px) scale(0.985);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .itpm-modal-backdrop.is-open .itpm-modal-dialog {
        transform: translateY(0) scale(1);
      }

      /* Header */
      .itpm-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 24px;
        background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
        color: #ffffff;
      }
      .itpm-modal-header-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 17px;
        font-weight: 700;
        letter-spacing: 0.2px;
        margin: 0;
      }
      .itpm-modal-badge {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        padding: 3px 8px;
        border-radius: 999px;
        letter-spacing: 0.5px;
      }
      .itpm-modal-close {
        background: rgba(255, 255, 255, 0.14);
        border: none;
        color: #ffffff;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        line-height: 1;
        transition: background 0.15s ease;
      }
      .itpm-modal-close:hover {
        background: rgba(255, 255, 255, 0.28);
      }

      /* Body & Form Grid */
      .itpm-modal-body {
        padding: 20px 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .itpm-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px 16px;
      }
      .itpm-form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .itpm-form-group.full-width {
        grid-column: 1 / -1;
      }
      .itpm-label {
        font-size: 12.5px;
        font-weight: 600;
        color: #334155;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .itpm-label .req {
        color: #ef4444;
        margin-left: 3px;
      }
      .itpm-input,
      .itpm-select,
      .itpm-textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 9px 12px;
        font-size: 13.5px;
        color: #0f172a;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        font-family: inherit;
      }
      .itpm-input:focus,
      .itpm-select:focus,
      .itpm-textarea:focus {
        background: #ffffff;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      }
      .itpm-input[readonly] {
        background: #f1f5f9;
        color: #475569;
      }

      /* Progress Slider + Number Row */
      .itpm-progress-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .itpm-progress-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .itpm-range {
        flex: 1;
        accent-color: #2563eb;
        height: 6px;
        cursor: pointer;
      }
      .itpm-number-wrap {
        display: flex;
        align-items: center;
        gap: 4px;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 4px 8px;
      }
      .itpm-number-input {
        width: 52px;
        border: none;
        outline: none;
        font-size: 14px;
        font-weight: 700;
        color: #1e3a8a;
        text-align: right;
        background: transparent;
      }
      .itpm-progress-bar-visual {
        height: 8px;
        width: 100%;
        background: #e2e8f0;
        border-radius: 999px;
        overflow: hidden;
      }
      .itpm-progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #2563eb 0%, #10b981 100%);
        border-radius: 999px;
        transition: width 0.15s ease;
      }
      .itpm-progress-Subrow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
      }
      .itpm-auto-calc-btn {
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
        border-radius: 7px;
        padding: 6px 11px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s ease;
      }
      .itpm-auto-calc-btn:hover {
        background: #dbeafe;
        border-color: #93c5fd;
      }

      /* Live Overdue Preview Banner */
      .itpm-overdue-preview {
        padding: 10px 14px;
        border-radius: 9px;
        font-size: 12.5px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .itpm-overdue-preview.is-overdue {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #b91c1c;
      }
      .itpm-overdue-preview.is-ontrack {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #15803d;
      }
      .itpm-overdue-preview.is-completed {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        color: #1d4ed8;
      }
      .itpm-overdue-pill {
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 11.5px;
        font-weight: 700;
      }
      .itpm-overdue-preview.is-overdue .itpm-overdue-pill {
        background: #ef4444;
        color: #ffffff;
      }
      .itpm-overdue-preview.is-ontrack .itpm-overdue-pill {
        background: #16a34a;
        color: #ffffff;
      }
      .itpm-overdue-preview.is-completed .itpm-overdue-pill {
        background: #2563eb;
        color: #ffffff;
      }

      /* Footer & Buttons */
      .itpm-modal-footer {
        padding: 15px 24px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
      }
      .itpm-footer-left,
      .itpm-footer-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .itpm-btn {
        border: none;
        border-radius: 8px;
        padding: 9px 15px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s ease;
        font-family: inherit;
      }
      .itpm-btn-primary {
        background: #2563eb;
        color: #ffffff;
        box-shadow: 0 2px 6px rgba(37, 99, 235, 0.28);
      }
      .itpm-btn-primary:hover {
        background: #1d4ed8;
      }
      .itpm-btn-success {
        background: #059669;
        color: #ffffff;
        box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
      }
      .itpm-btn-success:hover {
        background: #047857;
      }
      .itpm-btn-danger {
        background: #fee2e2;
        color: #b91c1c;
        border: 1px solid #fecaca;
      }
      .itpm-btn-danger:hover {
        background: #ef4444;
        color: #ffffff;
        border-color: #ef4444;
      }
      .itpm-btn-secondary {
        background: #ffffff;
        color: #475569;
        border: 1px solid #cbd5e1;
      }
      .itpm-btn-secondary:hover {
        background: #f1f5f9;
        color: #0f172a;
      }

      /* Inline Delete Confirmation Bar */
      .itpm-confirm-bar {
        background: #fff1f2;
        border: 1px solid #fecdd3;
        border-radius: 8px;
        padding: 10px 14px;
        display: none;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        font-size: 12.5px;
        color: #9f1239;
        font-weight: 600;
      }
      .itpm-confirm-bar.is-visible {
        display: flex;
      }

      /* Toast Notifications */
      .itpm-toast-container {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 390px;
        pointer-events: none;
        font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
      }
      .itpm-toast {
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 12px 16px;
        border-radius: 10px;
        background: #0f172a;
        color: #f8fafc;
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.08);
        font-size: 13px;
        font-weight: 500;
        line-height: 1.4;
        transform: translateX(30px);
        opacity: 0;
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease;
      }
      .itpm-toast.is-visible {
        transform: translateX(0);
        opacity: 1;
      }
      .itpm-toast-icon {
        width: 22px;
        height: 22px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .itpm-toast--success {
        border-left: 4px solid #10b981;
      }
      .itpm-toast--success .itpm-toast-icon {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
      }
      .itpm-toast--info {
        border-left: 4px solid #3b82f6;
      }
      .itpm-toast--info .itpm-toast-icon {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
      }
      .itpm-toast--warning {
        border-left: 4px solid #f59e0b;
      }
      .itpm-toast--warning .itpm-toast-icon {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
      }
      .itpm-toast--error,
      .itpm-toast--danger {
        border-left: 4px solid #ef4444;
      }
      .itpm-toast--error .itpm-toast-icon,
      .itpm-toast--danger .itpm-toast-icon {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
      }
      .itpm-toast-close {
        margin-left: auto;
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 15px;
        padding: 2px 4px;
        line-height: 1;
      }
      .itpm-toast-close:hover {
        color: #ffffff;
      }

      @media (max-width: 600px) {
        .itpm-form-grid {
          grid-template-columns: 1fr;
        }
        .itpm-modal-footer {
          flex-direction: column;
          align-items: stretch;
        }
        .itpm-footer-left,
        .itpm-footer-right {
          justify-content: stretch;
        }
        .itpm-btn {
          justify-content: center;
          flex: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // =========================================================================
  // 2. Helpers & Store Accessors
  // =========================================================================

  function getStore() {
    return window.ITPM && window.ITPM.store ? window.ITPM.store : null;
  }

  function getState() {
    const store = getStore();
    return store ? store.getState() : { projects: [], tasks: [], resources: [], referenceDate: "2025-10-08" };
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDateVN(isoStr) {
    if (window.ITPM && window.ITPM.utils && typeof window.ITPM.utils.formatDateVN === "function") {
      return window.ITPM.utils.formatDateVN(isoStr);
    }
    if (!isoStr) return "";
    const parts = String(isoStr).slice(0, 10).split("-");
    if (parts.length !== 3) return isoStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function calcOverdueDays(endDateIso, refDateIso) {
    if (window.ITPM && window.ITPM.utils && typeof window.ITPM.utils.calcOverdueDays === "function") {
      return window.ITPM.utils.calcOverdueDays(endDateIso, refDateIso);
    }
    if (!endDateIso || !refDateIso) return 0;
    const [ey, em, ed] = String(endDateIso).slice(0, 10).split("-").map(Number);
    const [ry, rm, rd] = String(refDateIso).slice(0, 10).split("-").map(Number);
    const endUTC = Date.UTC(ey, em - 1, ed);
    const refUTC = Date.UTC(ry, rm - 1, rd);
    if (isNaN(endUTC) || isNaN(refUTC)) return 0;
    return Math.round((refUTC - endUTC) / 86400000);
  }

  /**
   * Auto-suggest next Project ID like CTPro08
   */
  function suggestNextProjectId() {
    const state = getState();
    let maxNum = 0;
    (state.projects || []).forEach((p) => {
      const m = String(p.id || p.code || "").match(/(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `CTPro${String(maxNum + 1).padStart(2, "0")}`;
  }

  /**
   * Auto-suggest next Task Code like CTax0038
   */
  function suggestNextTaskCode() {
    const store = getStore();
    if (store && typeof store.generateNextTaskCode === "function") {
      return store.generateNextTaskCode();
    }
    const state = getState();
    let maxNum = 0;
    (state.tasks || []).forEach((t) => {
      const m = String(t.code || t.id || "").match(/(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `CTax${String(maxNum + 1).padStart(4, "0")}`;
  }

  /**
   * Normalize priority labels to Vietnamese values: "Thấp", "Trung bình", "Cao", "Khẩn cấp"
   */
  function normalizePriorityLabel(rawPriority) {
    if (!rawPriority) return "Cao";
    const map = {
      low: "Thấp",
      medium: "Trung bình",
      high: "Cao",
      critical: "Khẩn cấp",
      urgent: "Khẩn cấp",
      "Thấp": "Thấp",
      "Trung bình": "Trung bình",
      "Cao": "Cao",
      "Khẩn cấp": "Khẩn cấp"
    };
    return map[rawPriority] || "Cao";
  }

  // =========================================================================
  // 3. Toast Notification System — showToast(message, type = "success")
  // =========================================================================

  function showToast(message, type = "success") {
    ensureModalStyles();

    let container = document.getElementById(TOAST_ROOT_ID);
    if (!container) {
      container = document.createElement("div");
      container.id = TOAST_ROOT_ID;
      container.className = "itpm-toast-container";
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }

    const normalizedType = ["success", "info", "warning", "error", "danger"].includes(type)
      ? type
      : "success";

    const icons = {
      success: "✓",
      info: "ℹ",
      warning: "!",
      error: "✕",
      danger: "✕"
    };

    const toast = document.createElement("div");
    toast.className = `itpm-toast itpm-toast--${normalizedType}`;
    toast.innerHTML = `
      <span class="itpm-toast-icon">${icons[normalizedType] || "✓"}</span>
      <span class="itpm-toast-msg">${escapeHtml(message)}</span>
      <button type="button" class="itpm-toast-close" aria-label="Đóng thông báo">&times;</button>
    `;

    const dismiss = () => {
      toast.classList.remove("is-visible");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    };

    const closeBtn = toast.querySelector(".itpm-toast-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", dismiss);
    }

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    setTimeout(dismiss, 3600);
  }

  // =========================================================================
  // 4. Core Modal Lifecycle (Open / Close / Escape / Backdrop Click)
  // =========================================================================

  function closeModal() {
    if (activeEscListener) {
      document.removeEventListener("keydown", activeEscListener);
      activeEscListener = null;
    }

    const existing = document.getElementById(MODAL_ROOT_ID);
    if (!existing) return;

    const backdrop = existing.querySelector(".itpm-modal-backdrop");
    if (backdrop) {
      backdrop.classList.remove("is-open");
      setTimeout(() => {
        if (existing.parentNode) existing.parentNode.removeChild(existing);
      }, 160);
    } else if (existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  function mountModal(dialogHtml, onMount) {
    ensureModalStyles();

    // Clean up any existing modal immediately before opening a new one
    if (activeEscListener) {
      document.removeEventListener("keydown", activeEscListener);
      activeEscListener = null;
    }
    const prev = document.getElementById(MODAL_ROOT_ID);
    if (prev && prev.parentNode) {
      prev.parentNode.removeChild(prev);
    }

    const wrapper = document.createElement("div");
    wrapper.id = MODAL_ROOT_ID;
    wrapper.innerHTML = `
      <div class="itpm-modal-backdrop" role="dialog" aria-modal="true">
        <div class="itpm-modal-dialog">
          ${dialogHtml}
        </div>
      </div>
    `;
    document.body.appendChild(wrapper);

    const backdrop = wrapper.querySelector(".itpm-modal-backdrop");
    const dialog = wrapper.querySelector(".itpm-modal-dialog");

    // Backdrop click closes modal cleanly
    backdrop.addEventListener("mousedown", (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    // Prevent clicks inside dialog from bubbling to backdrop
    if (dialog) {
      dialog.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });
    }

    // Close button(s)
    wrapper.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal());
    });

    // Escape key closes modal cleanly
    activeEscListener = function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      }
    };
    document.addEventListener("keydown", activeEscListener);

    requestAnimationFrame(() => {
      backdrop.classList.add("is-open");
    });

    if (typeof onMount === "function") {
      onMount(wrapper);
    }
  }

  // =========================================================================
  // 5. Project Modal — openProjectModal(projectId = null)
  // =========================================================================

  function openProjectModal(projectId = null) {
    const state = getState();
    const store = getStore();
    const existingProject = projectId
      ? (state.projects || []).find((p) => p.id === projectId || p.code === projectId)
      : null;

    const isEditing = Boolean(existingProject);
    const defaultId = isEditing ? existingProject.id : suggestNextProjectId();
    const defaultName = isEditing ? existingProject.name : "";
    const defaultDepartment = isEditing ? existingProject.department : "Cloud & DevOps";
    const defaultManager = isEditing
      ? existingProject.manager
      : (state.resources && state.resources[0] ? state.resources[0].name : "Phù Cát");
    const defaultProgress = isEditing ? Number(existingProject.progress) || 0 : 0;
    const defaultStartDate = isEditing
      ? existingProject.startDate
      : (state.referenceDate || "2025-10-08");
    const defaultEndDate = isEditing
      ? existingProject.endDate
      : "2025-12-31";
    const defaultDescription = isEditing ? (existingProject.description || "") : "";

    const departmentsList = [
      "Cloud & DevOps",
      "Enterprise Apps",
      "Cyber Security",
      "AI & Data",
      "AI & Automation",
      "Digital Web",
      "Data Engineering",
      "Mobile Team",
      "Hạ tầng & Mạng"
    ];

    const resourceOptionsHtml = (state.resources || [])
      .map((r) => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)} (${escapeHtml(r.role || "IT Team")})</option>`)
      .join("");

    const departmentOptionsHtml = departmentsList
      .map((d) => `<option value="${escapeHtml(d)}"></option>`)
      .join("");

    const projectTasksCount = isEditing
      ? (state.tasks || []).filter((t) => t.projectId === existingProject.id).length
      : 0;

    const html = `
      <div class="itpm-modal-header">
        <h3 class="itpm-modal-header-title">
          <span>${isEditing ? "Chỉnh sửa Dự án CNTT" : "Thêm Dự án CNTT mới"}</span>
          <span class="itpm-modal-badge">${escapeHtml(defaultId)}</span>
        </h3>
        <button type="button" class="itpm-modal-close" data-modal-close aria-label="Đóng">&times;</button>
      </div>

      <form id="itpm-project-form" class="itpm-modal-body" novalidate>
        <div class="itpm-form-grid">
          <div class="itpm-form-group">
            <label class="itpm-label" for="proj-id-input">
              <span>Mã dự án <span class="req">*</span></span>
            </label>
            <input
              id="proj-id-input"
              name="id"
              type="text"
              class="itpm-input"
              value="${escapeHtml(defaultId)}"
              placeholder="VD: CTPro08"
              ${isEditing ? "readonly" : ""}
              required
            />
          </div>

          <div class="itpm-form-group">
            <label class="itpm-label" for="proj-dept-input">
              <span>Phòng ban / Mảng IT <span class="req">*</span></span>
            </label>
            <input
              id="proj-dept-input"
              name="department"
              type="text"
              list="itpm-dept-datalist"
              class="itpm-input"
              value="${escapeHtml(defaultDepartment)}"
              placeholder="VD: Cloud & DevOps, Enterprise Apps..."
              required
            />
            <datalist id="itpm-dept-datalist">
              ${departmentOptionsHtml}
            </datalist>
          </div>

          <div class="itpm-form-group full-width">
            <label class="itpm-label" for="proj-name-input">
              <span>Tên dự án IT <span class="req">*</span></span>
            </label>
            <input
              id="proj-name-input"
              name="name"
              type="text"
              class="itpm-input"
              value="${escapeHtml(defaultName)}"
              placeholder="VD: Hệ thống ERP / Cloud Migration"
              required
            />
          </div>

          <div class="itpm-form-group full-width">
            <label class="itpm-label" for="proj-manager-input">
              <span>Quản lý dự án / Nhóm phụ trách</span>
            </label>
            <input
              id="proj-manager-input"
              name="manager"
              type="text"
              list="itpm-manager-datalist"
              class="itpm-input"
              value="${escapeHtml(defaultManager)}"
              placeholder="Chọn hoặc nhập tên Quản lý dự án..."
            />
            <datalist id="itpm-manager-datalist">
              ${resourceOptionsHtml}
            </datalist>
          </div>

          <div class="itpm-form-group full-width">
            <label class="itpm-label" for="proj-progress-range">
              <span>Tiến độ dự án (%)</span>
              <span id="proj-progress-label" style="color:#2563eb;font-weight:700;">${defaultProgress}%</span>
            </label>
            <div class="itpm-progress-box">
              <div class="itpm-progress-controls">
                <input
                  id="proj-progress-range"
                  type="range"
                  class="itpm-range"
                  min="0"
                  max="100"
                  step="1"
                  value="${defaultProgress}"
                />
                <div class="itpm-number-wrap">
                  <input
                    id="proj-progress-number"
                    name="progress"
                    type="number"
                    class="itpm-number-input"
                    min="0"
                    max="100"
                    step="1"
                    value="${defaultProgress}"
                  />
                  <span style="font-size:12px;font-weight:700;color:#64748b;">%</span>
                </div>
              </div>
              <div class="itpm-progress-bar-visual">
                <div id="proj-progress-fill" class="itpm-progress-bar-fill" style="width: ${defaultProgress}%;"></div>
              </div>
              <div class="itpm-progress-Subrow">
                <button type="button" id="btn-calc-proj-progress" class="itpm-auto-calc-btn">
                  ⚡ Tính tự động từ công việc thuộc dự án
                </button>
                <span id="proj-task-stats-hint" style="font-size:11.5px;color:#64748b;">
                  ${isEditing ? `Đang có ${projectTasksCount} công việc thuộc dự án ${escapeHtml(existingProject.id)}` : "Áp dụng khi dự án đã có công việc"}
                </span>
              </div>
            </div>
          </div>

          <div class="itpm-form-group">
            <label class="itpm-label" for="proj-start-input">
              <span>Ngày bắt đầu</span>
            </label>
            <input
              id="proj-start-input"
              name="startDate"
              type="date"
              class="itpm-input"
              value="${escapeHtml(defaultStartDate)}"
            />
          </div>

          <div class="itpm-form-group">
            <label class="itpm-label" for="proj-end-input">
              <span>Ngày kết thúc</span>
            </label>
            <input
              id="proj-end-input"
              name="endDate"
              type="date"
              class="itpm-input"
              value="${escapeHtml(defaultEndDate)}"
            />
          </div>

          <div class="itpm-form-group full-width">
            <label class="itpm-label" for="proj-desc-input">
              <span>Mô tả phạm vi / Ghi chú dự án</span>
            </label>
            <textarea
              id="proj-desc-input"
              name="description"
              rows="2"
              class="itpm-textarea"
              placeholder="Mô tả mục tiêu, kiến trúc hoặc ghi chú triển khai dự án..."
            >${escapeHtml(defaultDescription)}</textarea>
          </div>
        </div>

        <div id="proj-delete-confirm-bar" class="itpm-confirm-bar">
          <span>Bạn có chắc muốn xóa dự án <strong>${escapeHtml(defaultId)}</strong> và ${projectTasksCount} công việc liên quan?</span>
          <div style="display:flex;gap:6px;">
            <button type="button" id="btn-confirm-delete-proj" class="itpm-btn itpm-btn-danger" style="padding:6px 12px;">Xác nhận xóa</button>
            <button type="button" id="btn-cancel-delete-proj" class="itpm-btn itpm-btn-secondary" style="padding:6px 12px;">Không</button>
          </div>
        </div>

        <div class="itpm-modal-footer" style="margin: 4px -24px -20px -24px;">
          <div class="itpm-footer-left">
            ${
              isEditing
                ? `<button type="button" id="btn-delete-project" class="itpm-btn itpm-btn-danger">🗑 Xóa dự án</button>`
                : ""
            }
          </div>
          <div class="itpm-footer-right">
            <button type="button" class="itpm-btn itpm-btn-secondary" data-modal-close>Hủy</button>
            <button type="submit" class="itpm-btn itpm-btn-primary">💾 Lưu dự án</button>
          </div>
        </div>
      </form>
    `;

    mountModal(html, (wrapper) => {
      const form = wrapper.querySelector("#itpm-project-form");
      const idInput = wrapper.querySelector("#proj-id-input");
      const nameInput = wrapper.querySelector("#proj-name-input");
      const deptInput = wrapper.querySelector("#proj-dept-input");
      const managerInput = wrapper.querySelector("#proj-manager-input");
      const rangeInput = wrapper.querySelector("#proj-progress-range");
      const numInput = wrapper.querySelector("#proj-progress-number");
      const progressLabel = wrapper.querySelector("#proj-progress-label");
      const progressFill = wrapper.querySelector("#proj-progress-fill");
      const calcBtn = wrapper.querySelector("#btn-calc-proj-progress");
      const hintSpan = wrapper.querySelector("#proj-task-stats-hint");
      const startInput = wrapper.querySelector("#proj-start-input");
      const endInput = wrapper.querySelector("#proj-end-input");
      const descInput = wrapper.querySelector("#proj-desc-input");

      function syncProjectProgressUI(val) {
        let clamped = Math.round(Number(val) || 0);
        clamped = Math.max(0, Math.min(100, clamped));
        rangeInput.value = String(clamped);
        numInput.value = String(clamped);
        progressLabel.textContent = `${clamped}%`;
        progressFill.style.width = `${clamped}%`;
      }

      rangeInput.addEventListener("input", () => syncProjectProgressUI(rangeInput.value));
      numInput.addEventListener("input", () => syncProjectProgressUI(numInput.value));

      // Button: "Tính tự động từ công việc thuộc dự án"
      if (calcBtn) {
        calcBtn.addEventListener("click", () => {
          const targetProjId = (idInput.value || "").trim() || defaultId;
          const currentTasks = (getState().tasks || []).filter((t) => t.projectId === targetProjId);
          if (currentTasks.length === 0) {
            hintSpan.textContent = `Chưa có công việc nào thuộc mã dự án ${targetProjId}.`;
            showToast(`Dự án ${targetProjId} chưa có công việc để tính tự động`, "info");
            return;
          }
          const sum = currentTasks.reduce((acc, t) => acc + (Number(t.progress) || 0), 0);
          const avg = Math.round(sum / currentTasks.length);
          syncProjectProgressUI(avg);
          hintSpan.textContent = `Đã tính trung bình từ ${currentTasks.length} công việc: ${avg}%`;
          showToast(`Tiến độ tự động của ${targetProjId}: ${avg}% (${currentTasks.length} công việc)`, "info");
        });
      }

      // Delete project handling with inline confirmation
      const deleteBtn = wrapper.querySelector("#btn-delete-project");
      const confirmBar = wrapper.querySelector("#proj-delete-confirm-bar");
      const confirmDeleteBtn = wrapper.querySelector("#btn-confirm-delete-proj");
      const cancelDeleteBtn = wrapper.querySelector("#btn-cancel-delete-proj");

      if (deleteBtn && confirmBar) {
        deleteBtn.addEventListener("click", () => {
          confirmBar.classList.add("is-visible");
        });
      }
      if (cancelDeleteBtn && confirmBar) {
        cancelDeleteBtn.addEventListener("click", () => {
          confirmBar.classList.remove("is-visible");
        });
      }
      if (confirmDeleteBtn && isEditing && store) {
        confirmDeleteBtn.addEventListener("click", () => {
          store.deleteProject(existingProject.id);
          closeModal();
          showToast(`Đã xóa dự án ${existingProject.id} - ${existingProject.name}`, "warning");
        });
      }

      // Submit handler
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const idVal = (idInput.value || "").trim() || defaultId;
        const nameVal = (nameInput.value || "").trim();
        const deptVal = (deptInput.value || "").trim() || "Khối CNTT";
        const managerVal = (managerInput.value || "").trim() || "Phù Cát";
        const progressVal = Math.max(0, Math.min(100, Math.round(Number(numInput.value) || 0)));
        const startDateVal = startInput.value || "2025-01-01";
        const endDateVal = endInput.value || "2025-12-31";
        const descVal = (descInput.value || "").trim();

        if (!nameVal) {
          nameInput.focus();
          showToast("Vui lòng nhập Tên dự án IT", "error");
          return;
        }

        const payload = {
          id: idVal,
          code: idVal,
          name: nameVal,
          department: deptVal,
          manager: managerVal,
          progress: progressVal,
          startDate: startDateVal,
          endDate: endDateVal,
          description: descVal
        };

        if (!store) return;

        if (isEditing) {
          store.updateProject(existingProject.id, payload);
          closeModal();
          showToast(`Đã cập nhật dự án ${idVal}: ${nameVal} (${progressVal}%)`, "success");
        } else {
          // Check duplicate ID
          const dup = (getState().projects || []).some((p) => p.id.toLowerCase() === idVal.toLowerCase());
          if (dup) {
            idInput.focus();
            showToast(`Mã dự án "${idVal}" đã tồn tại, vui lòng chọn mã khác`, "error");
            return;
          }
          store.addProject(payload);
          closeModal();
          showToast(`Đã thêm dự án mới ${idVal}: ${nameVal}`, "success");
        }
      });

      setTimeout(() => {
        nameInput.focus();
      }, 50);
    });
  }

  // =========================================================================
  // 6. Task Modal — openTaskModal(taskId = null, defaultProjectId = null)
  // =========================================================================

  function openTaskModal(taskId = null, defaultProjectId = null) {
    const state = getState();
    const store = getStore();
    const existingTask = taskId
      ? (state.tasks || []).find((t) => t.id === taskId || t.code === taskId)
      : null;

    const isEditing = Boolean(existingTask);
    const defaultCode = isEditing ? (existingTask.code || existingTask.id) : suggestNextTaskCode();
    const fallbackProjectId =
      defaultProjectId ||
      state.filters?.projectId ||
      (state.projects && state.projects[0] ? state.projects[0].id : "CTPro04");

    const currentProjectId = isEditing ? existingTask.projectId : fallbackProjectId;
    const defaultTitle = isEditing ? existingTask.title : "";
    const defaultAssignee = isEditing
      ? existingTask.assignee
      : (state.resources && state.resources[0] ? state.resources[0].name : "Phù Cát");
    const defaultStatus = isEditing ? existingTask.status : "in_progress";
    const defaultProgress = isEditing
      ? Number(existingTask.progress) || 0
      : defaultStatus === "completed"
      ? 100
      : defaultStatus === "not_started"
      ? 0
      : 50;
    const defaultStartDate = isEditing
      ? existingTask.startDate
      : (state.referenceDate || "2025-10-08");
    const defaultEndDate = isEditing
      ? existingTask.endDate
      : (state.referenceDate || "2025-10-08");
    const defaultPriority = isEditing
      ? normalizePriorityLabel(existingTask.priority)
      : "Cao";

    const projectOptionsHtml = (state.projects || [])
      .map((p) => {
        const selected = p.id === currentProjectId ? "selected" : "";
        return `<option value="${escapeHtml(p.id)}" ${selected}>${escapeHtml(p.id)} — ${escapeHtml(p.name)}</option>`;
      })
      .join("");

    const resourceDatalistHtml = (state.resources || [])
      .map((r) => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.role || "")}</option>`)
      .join("");

    const priorities = ["Thấp", "Trung bình", "Cao", "Khẩn cấp"];
    const priorityOptionsHtml = priorities
      .map((prio) => {
        const selected = prio === defaultPriority ? "selected" : "";
        return `<option value="${escapeHtml(prio)}" ${selected}>${escapeHtml(prio)}</option>`;
      })
      .join("");

    const refDate = state.referenceDate || "2025-10-08";

    const html = `
      <div class="itpm-modal-header">
        <h3 class="itpm-modal-header-title">
          <span>${isEditing ? "Cập nhật Công việc CNTT" : "Tạo Công việc CNTT mới"}</span>
          <span class="itpm-modal-badge">${escapeHtml(defaultCode)}</span>
        </h3>
        <button type="button" class="itpm-modal-close" data-modal-close aria-label="Đóng">&times;</button>
      </div>

      <form id="itpm-task-form" class="itpm-modal-body" novalidate>
        <div class="itpm-form-grid">
          <div class="itpm-form-group">
            <label class="itpm-label" for="task-code-input">
              <span>Mã nhiệm vụ <span class="req">*</span></span>
            </label>
            <input
              id="task-code-input"
              name="code"
              type="text"
              class="itpm-input"
              value="${escapeHtml(defaultCode)}"
              placeholder="VD: CTax0038"
              required
            />
          </div>

          <div class="itpm-form-group">
            <label class="itpm-label" for="task-project-select">
              <span>Thuộc Dự Án <span class="req">*</span></span>
            </label>
            <select id="task-project-select" name="projectId" class="itpm-select" required>
              ${projectOptionsHtml}
            </select>
          </div>

          <div class="itpm-form-group full-width">
            <label class="itpm-label" for="task-title-input">
              <span>Tên công việc IT <span class="req">*</span></span>
            </label>
            <input
              id="task-title-input"
              name="title"
              type="text"
              class="itpm-input"
              value="${escapeHtml(defaultTitle)}"
              placeholder="VD: Tích hợp SSO & OAuth2 cho cổng nội bộ"
              required
            />
          </div>

          <div class="itpm-form-group">
            <label class="itpm-label" for="task-assignee-input">
              <span>Người làm / Nhóm phụ trách <span class="req">*</span></span>
            </label>
            <input
              id="task-assignee-input"
              name="assignee"
              type="text"
              list="itpm-task-assignee-list"
              class="itpm-input"
              value="${escapeHtml(defaultAssignee)}"
              placeholder="Chọn nhóm hoặc nhập tên..."
              required
            />
            <datalist id="itpm-task-assignee-list">
              ${resourceDatalistHtml}
            </datalist>
          </div>

          <div class="itpm-form-group">
            <label class="itpm-label" for="task-priority-select">
              <span>Độ ưu tiên</span>
            </label>
            <select id="task-priority-select" name="priority" class="itpm-select">
              ${priorityOptionsHtml}
            </select>
          </div>

          <div class="itpm-form-group">
            <label class="itpm-label" for="task-status-select">
              <span>Trạng thái</span>
            </label>
            <select id="task-status-select" name="status" class="itpm-select">
              <option value="not_started" ${defaultStatus === "not_started" ? "selected" : ""}>Chưa bắt đầu (0%)</option>
              <option value="in_progress" ${defaultStatus === "in_progress" ? "selected" : ""}>Đang thực hiện (1% - 99%)</option>
              <option value="completed" ${defaultStatus === "completed" ? "selected" : ""}>Hoàn thành (100%)</option>
            </select>
          </div>

          <div class="itpm-form-group">
            <label class="itpm-label" for="task-progress-range">
              <span>Tiến độ (%)</span>
              <span id="task-progress-badge" style="color:#2563eb;font-weight:700;">${defaultProgress}%</span>
            </label>
            <div class="itpm-progress-controls" style="padding-top:2px;">
              <input
                id="task-progress-range"
                type="range"
                class="itpm-range"
                min="0"
                max="100"
                step="1"
                value="${defaultProgress}"
              />
              <div class="itpm-number-wrap">
                <input
                  id="task-progress-number"
                  name="progress"
                  type="number"
                  class="itpm-number-input"
                  min="0"
                  max="100"
                  step="1"
                  value="${defaultProgress}"
                />
                <span style="font-size:12px;font-weight:700;color:#64748b;">%</span>
              </div>
            </div>
          </div>

          <div class="itpm-form-group">
            <label class="itpm-label" for="task-start-input">
              <span>Ngày bắt đầu</span>
            </label>
            <input
              id="task-start-input"
              name="startDate"
              type="date"
              class="itpm-input"
              value="${escapeHtml(defaultStartDate)}"
            />
          </div>

          <div class="itpm-form-group">
            <label class="itpm-label" for="task-end-input">
              <span>Ngày kết thúc (Hạn hoàn thành)</span>
            </label>
            <input
              id="task-end-input"
              name="endDate"
              type="date"
              class="itpm-input"
              value="${escapeHtml(defaultEndDate)}"
            />
          </div>

          <div class="itpm-form-group full-width">
            <div id="task-overdue-live-banner" class="itpm-overdue-preview is-ontrack">
              <span id="task-overdue-live-text">Đang kiểm tra hạn hoàn thành...</span>
              <span id="task-overdue-live-pill" class="itpm-overdue-pill">Đúng hạn</span>
            </div>
          </div>
        </div>

        <div id="task-delete-confirm-bar" class="itpm-confirm-bar">
          <span>Xác nhận xóa công việc <strong>${escapeHtml(defaultCode)}</strong> khỏi dự án?</span>
          <div style="display:flex;gap:6px;">
            <button type="button" id="btn-confirm-delete-task" class="itpm-btn itpm-btn-danger" style="padding:6px 12px;">Xóa vĩnh viễn</button>
            <button type="button" id="btn-cancel-delete-task" class="itpm-btn itpm-btn-secondary" style="padding:6px 12px;">Hủy</button>
          </div>
        </div>

        <div class="itpm-modal-footer" style="margin: 4px -24px -20px -24px;">
          <div class="itpm-footer-left">
            ${
              isEditing
                ? `<button type="button" id="btn-delete-task" class="itpm-btn itpm-btn-danger">🗑 Xóa công việc</button>`
                : ""
            }
            <button type="button" id="btn-quick-complete-task" class="itpm-btn itpm-btn-success">
              ✓ Đánh dấu Hoàn thành 100%
            </button>
          </div>
          <div class="itpm-footer-right">
            <button type="button" class="itpm-btn itpm-btn-secondary" data-modal-close>Hủy</button>
            <button type="submit" class="itpm-btn itpm-btn-primary">💾 Lưu công việc</button>
          </div>
        </div>
      </form>
    `;

    mountModal(html, (wrapper) => {
      const form = wrapper.querySelector("#itpm-task-form");
      const codeInput = wrapper.querySelector("#task-code-input");
      const projectSelect = wrapper.querySelector("#task-project-select");
      const titleInput = wrapper.querySelector("#task-title-input");
      const assigneeInput = wrapper.querySelector("#task-assignee-input");
      const prioritySelect = wrapper.querySelector("#task-priority-select");
      const statusSelect = wrapper.querySelector("#task-status-select");
      const progressRange = wrapper.querySelector("#task-progress-range");
      const progressNumber = wrapper.querySelector("#task-progress-number");
      const progressBadge = wrapper.querySelector("#task-progress-badge");
      const startInput = wrapper.querySelector("#task-start-input");
      const endInput = wrapper.querySelector("#task-end-input");
      const liveBanner = wrapper.querySelector("#task-overdue-live-banner");
      const liveText = wrapper.querySelector("#task-overdue-live-text");
      const livePill = wrapper.querySelector("#task-overdue-live-pill");
      const quickCompleteBtn = wrapper.querySelector("#btn-quick-complete-task");

      function updateLiveOverdueBanner() {
        const currentRef = getState().referenceDate || refDate;
        const endDateVal = endInput.value;
        const statusVal = statusSelect.value;
        const progressVal = Number(progressNumber.value) || 0;

        liveBanner.classList.remove("is-overdue", "is-ontrack", "is-completed");

        if (statusVal === "completed" || progressVal >= 100) {
          liveBanner.classList.add("is-completed");
          liveText.textContent = `Công việc đã hoàn thành 100% (Ngày kết thúc: ${formatDateVN(endDateVal)})`;
          livePill.textContent = "Đã hoàn thành";
          return;
        }

        if (!endDateVal) {
          liveBanner.classList.add("is-ontrack");
          liveText.textContent = `Mốc tham chiếu hệ thống: ${formatDateVN(currentRef)}`;
          livePill.textContent = "Chưa đặt hạn";
          return;
        }

        const diffDays = calcOverdueDays(endDateVal, currentRef);
        if (endDateVal < currentRef && diffDays > 0) {
          liveBanner.classList.add("is-overdue");
          liveText.textContent = `Cảnh báo: Hạn ${formatDateVN(endDateVal)} < Ngày tham chiếu ${formatDateVN(currentRef)}`;
          livePill.textContent = `Quá hạn ${diffDays} ngày`;
        } else if (diffDays === 0) {
          liveBanner.classList.add("is-ontrack");
          liveText.textContent = `Đến hạn ngay hôm nay (${formatDateVN(endDateVal)}) theo ngày tham chiếu ${formatDateVN(currentRef)}`;
          livePill.textContent = "Đến hạn hôm nay";
        } else {
          const remaining = Math.abs(diffDays);
          liveBanner.classList.add("is-ontrack");
          liveText.textContent = `Trong hạn hoàn thành (${formatDateVN(endDateVal)}) — so với ngày ${formatDateVN(currentRef)}`;
          livePill.textContent = `Còn ${remaining} ngày`;
        }
      }

      // Sync Status -> Progress
      statusSelect.addEventListener("change", () => {
        const st = statusSelect.value;
        let p = Number(progressNumber.value) || 0;
        if (st === "completed") {
          p = 100;
        } else if (st === "not_started") {
          p = 0;
        } else if (st === "in_progress" && (p <= 0 || p >= 100)) {
          p = isEditing && existingTask.progress > 0 && existingTask.progress < 100 ? existingTask.progress : 50;
        }
        progressRange.value = String(p);
        progressNumber.value = String(p);
        progressBadge.textContent = `${p}%`;
        updateLiveOverdueBanner();
      });

      // Sync Progress -> Status
      function handleProgressInput(rawVal) {
        let p = Math.round(Number(rawVal) || 0);
        p = Math.max(0, Math.min(100, p));
        progressRange.value = String(p);
        progressNumber.value = String(p);
        progressBadge.textContent = `${p}%`;

        if (p >= 100) {
          statusSelect.value = "completed";
        } else if (p <= 0) {
          statusSelect.value = "not_started";
        } else {
          statusSelect.value = "in_progress";
        }
        updateLiveOverdueBanner();
      }

      progressRange.addEventListener("input", () => handleProgressInput(progressRange.value));
      progressNumber.addEventListener("input", () => handleProgressInput(progressNumber.value));
      endInput.addEventListener("input", updateLiveOverdueBanner);
      startInput.addEventListener("input", updateLiveOverdueBanner);

      // Quick Action: "Đánh dấu Hoàn thành 100%"
      if (quickCompleteBtn) {
        quickCompleteBtn.addEventListener("click", () => {
          handleProgressInput(100);
          if (isEditing && store) {
            const payload = {
              code: (codeInput.value || "").trim() || defaultCode,
              projectId: projectSelect.value,
              title: (titleInput.value || "").trim() || existingTask.title,
              assignee: (assigneeInput.value || "").trim() || existingTask.assignee,
              priority: prioritySelect.value,
              status: "completed",
              progress: 100,
              startDate: startInput.value,
              endDate: endInput.value
            };
            store.updateTask(existingTask.id, payload);
            closeModal();
            showToast(`Đã đánh dấu Hoàn thành 100%: ${payload.code} - ${payload.title}`, "success");
          } else {
            showToast("Đã đặt trạng thái Hoàn thành (100%). Nhấn 'Lưu công việc' để hoàn tất.", "info");
          }
        });
      }

      // Delete task confirmation
      const deleteBtn = wrapper.querySelector("#btn-delete-task");
      const confirmBar = wrapper.querySelector("#task-delete-confirm-bar");
      const confirmDeleteBtn = wrapper.querySelector("#btn-confirm-delete-task");
      const cancelDeleteBtn = wrapper.querySelector("#btn-cancel-delete-task");

      if (deleteBtn && confirmBar) {
        deleteBtn.addEventListener("click", () => {
          confirmBar.classList.add("is-visible");
        });
      }
      if (cancelDeleteBtn && confirmBar) {
        cancelDeleteBtn.addEventListener("click", () => {
          confirmBar.classList.remove("is-visible");
        });
      }
      if (confirmDeleteBtn && isEditing && store) {
        confirmDeleteBtn.addEventListener("click", () => {
          store.deleteTask(existingTask.id);
          closeModal();
          showToast(`Đã xóa công việc ${existingTask.code || existingTask.id}`, "warning");
        });
      }

      // Form submission
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const codeVal = (codeInput.value || "").trim() || defaultCode;
        const projVal = projectSelect.value;
        const titleVal = (titleInput.value || "").trim();
        const assigneeVal = (assigneeInput.value || "").trim() || "Phù Cát";
        const prioVal = prioritySelect.value || "Cao";
        const statusVal = statusSelect.value;
        const progVal = Math.max(0, Math.min(100, Math.round(Number(progressNumber.value) || 0)));
        const startVal = startInput.value || refDate;
        const endVal = endInput.value || refDate;

        if (!titleVal) {
          titleInput.focus();
          showToast("Vui lòng nhập Tên công việc IT", "error");
          return;
        }

        const payload = {
          id: isEditing ? existingTask.id : codeVal,
          code: codeVal,
          projectId: projVal,
          title: titleVal,
          assignee: assigneeVal,
          status: statusVal,
          progress: progVal,
          startDate: startVal,
          endDate: endVal,
          priority: prioVal
        };

        if (!store) return;

        if (isEditing) {
          store.updateTask(existingTask.id, payload);
          closeModal();
          showToast(`Đã cập nhật công việc ${codeVal}: ${titleVal} (${progVal}%)`, "success");
        } else {
          store.addTask(payload);
          closeModal();
          showToast(`Đã thêm công việc mới ${codeVal}: ${titleVal}`, "success");
        }
      });

      // Initialize live overdue preview immediately
      updateLiveOverdueBanner();
      setTimeout(() => {
        titleInput.focus();
      }, 50);
    });
  }

  // =========================================================================
  // 7. Resource Modal — openResourceModal(resourceId = null)
  // =========================================================================

  function openResourceModal(resourceId = null) {
    const state = getState();
    const store = getStore();
    const existingRes = resourceId
      ? (state.resources || []).find((r) => r.id === resourceId || r.name === resourceId)
      : null;

    const isEditing = Boolean(existingRes);
    const defaultName = isEditing ? existingRes.name : "";
    const defaultRole = isEditing ? (existingRes.role || "Backend & ERP") : "Backend & ERP";
    const defaultUtil = isEditing ? Number(existingRes.utilization) || 0 : 30;

    const rolesSuggestions = [
      "Backend & ERP",
      "Cloud & DevOps",
      "Security SOC",
      "QA / Tester",
      "Fullstack & CRM Team",
      "SysAdmin & Infra",
      "Data & BI Team",
      "AI & Automation"
    ];

    const roleOptionsHtml = rolesSuggestions
      .map((role) => `<option value="${escapeHtml(role)}"></option>`)
      .join("");

    const html = `
      <div class="itpm-modal-header">
        <h3 class="itpm-modal-header-title">
          <span>${isEditing ? "Cập nhật Nguồn lực / Nhóm IT" : "Thêm Nguồn lực / Nhóm IT"}</span>
          ${isEditing ? `<span class="itpm-modal-badge">${escapeHtml(existingRes.name)}</span>` : ""}
        </h3>
        <button type="button" class="itpm-modal-close" data-modal-close aria-label="Đóng">&times;</button>
      </div>

      <form id="itpm-resource-form" class="itpm-modal-body" novalidate>
        <div class="itpm-form-grid">
          <div class="itpm-form-group">
            <label class="itpm-label" for="res-name-input">
              <span>Tên nhân sự / Nhóm <span class="req">*</span></span>
            </label>
            <input
              id="res-name-input"
              name="name"
              type="text"
              class="itpm-input"
              value="${escapeHtml(defaultName)}"
              placeholder="VD: Phù Cát, Kỳ Co, Đập Đá, An Nhơn..."
              required
            />
          </div>

          <div class="itpm-form-group">
            <label class="itpm-label" for="res-role-input">
              <span>Vai trò chuyên môn <span class="req">*</span></span>
            </label>
            <input
              id="res-role-input"
              name="role"
              type="text"
              list="itpm-role-datalist"
              class="itpm-input"
              value="${escapeHtml(defaultRole)}"
              placeholder="VD: Backend & ERP, Cloud & DevOps..."
              required
            />
            <datalist id="itpm-role-datalist">
              ${roleOptionsHtml}
            </datalist>
          </div>

          <div class="itpm-form-group full-width">
            <label class="itpm-label" for="res-util-range">
              <span>Chỉ số sử dụng nguồn lực (0 - 100)</span>
              <span id="res-util-label" style="color:#2563eb;font-weight:700;">${defaultUtil}</span>
            </label>
            <div class="itpm-progress-box">
              <div class="itpm-progress-controls">
                <input
                  id="res-util-range"
                  type="range"
                  class="itpm-range"
                  min="0"
                  max="100"
                  step="1"
                  value="${defaultUtil}"
                />
                <div class="itpm-number-wrap">
                  <input
                    id="res-util-number"
                    name="utilization"
                    type="number"
                    class="itpm-number-input"
                    min="0"
                    max="100"
                    step="1"
                    value="${defaultUtil}"
                  />
                </div>
              </div>
              <div class="itpm-progress-bar-visual">
                <div id="res-util-fill" class="itpm-progress-bar-fill" style="width: ${defaultUtil}%;"></div>
              </div>
              <div class="itpm-progress-Subrow">
                <button type="button" id="btn-calc-res-util" class="itpm-auto-calc-btn">
                  ⚡ Tính theo số lượng công việc đang giao
                </button>
                <span id="res-task-stats-hint" style="font-size:11.5px;color:#64748b;">
                  Tự động quy đổi tải công việc thực tế của nhóm
                </span>
              </div>
            </div>
          </div>
        </div>

        <div id="res-delete-confirm-bar" class="itpm-confirm-bar">
          <span>Xác nhận xóa nguồn lực <strong>${escapeHtml(defaultName)}</strong> khỏi biểu đồ Sử dụng nguồn lực?</span>
          <div style="display:flex;gap:6px;">
            <button type="button" id="btn-confirm-delete-res" class="itpm-btn itpm-btn-danger" style="padding:6px 12px;">Xác nhận xóa</button>
            <button type="button" id="btn-cancel-delete-res" class="itpm-btn itpm-btn-secondary" style="padding:6px 12px;">Hủy</button>
          </div>
        </div>

        <div class="itpm-modal-footer" style="margin: 4px -24px -20px -24px;">
          <div class="itpm-footer-left">
            ${
              isEditing
                ? `<button type="button" id="btn-delete-resource" class="itpm-btn itpm-btn-danger">🗑 Xóa</button>`
                : ""
            }
          </div>
          <div class="itpm-footer-right">
            <button type="button" class="itpm-btn itpm-btn-secondary" data-modal-close>Hủy</button>
            <button type="submit" class="itpm-btn itpm-btn-primary">💾 Lưu nguồn lực</button>
          </div>
        </div>
      </form>
    `;

    mountModal(html, (wrapper) => {
      const form = wrapper.querySelector("#itpm-resource-form");
      const nameInput = wrapper.querySelector("#res-name-input");
      const roleInput = wrapper.querySelector("#res-role-input");
      const rangeInput = wrapper.querySelector("#res-util-range");
      const numInput = wrapper.querySelector("#res-util-number");
      const utilLabel = wrapper.querySelector("#res-util-label");
      const utilFill = wrapper.querySelector("#res-util-fill");
      const calcBtn = wrapper.querySelector("#btn-calc-res-util");
      const hintSpan = wrapper.querySelector("#res-task-stats-hint");

      function syncUtilUI(val) {
        let clamped = Math.round(Number(val) || 0);
        clamped = Math.max(0, Math.min(100, clamped));
        rangeInput.value = String(clamped);
        numInput.value = String(clamped);
        utilLabel.textContent = `${clamped}`;
        utilFill.style.width = `${clamped}%`;
      }

      rangeInput.addEventListener("input", () => syncUtilUI(rangeInput.value));
      numInput.addEventListener("input", () => syncUtilUI(numInput.value));

      // Button: "Tính theo số lượng công việc đang giao"
      if (calcBtn) {
        calcBtn.addEventListener("click", () => {
          const targetName = (nameInput.value || "").trim();
          if (!targetName) {
            nameInput.focus();
            showToast("Vui lòng nhập Tên nhân sự / Nhóm trước khi tính", "warning");
            return;
          }
          const allTasks = getState().tasks || [];
          const assignedTasks = allTasks.filter(
            (t) => String(t.assignee || "").trim().toLowerCase() === targetName.toLowerCase()
          );
          const activeTasks = assignedTasks.filter((t) => t.status !== "completed");

          if (assignedTasks.length === 0) {
            syncUtilUI(0);
            hintSpan.textContent = `Nhóm "${targetName}" hiện chưa được giao công việc nào.`;
            showToast(`"${targetName}" chưa có công việc được giao (Chỉ số: 0)`, "info");
            return;
          }

          // Compute realistic utilization index based on active & total tasks assigned
          const computed = Math.min(
            100,
            Math.max(10, Math.round((activeTasks.length * 14) + (assignedTasks.length * 4)))
          );
          syncUtilUI(computed);
          hintSpan.textContent = `Đang phụ trách ${assignedTasks.length} công việc (${activeTasks.length} đang mở) → Chỉ số: ${computed}`;
          showToast(`Đã tính chỉ số nguồn lực cho ${targetName}: ${computed}`, "info");
        });
      }

      // Delete resource confirmation
      const deleteBtn = wrapper.querySelector("#btn-delete-resource");
      const confirmBar = wrapper.querySelector("#res-delete-confirm-bar");
      const confirmDeleteBtn = wrapper.querySelector("#btn-confirm-delete-res");
      const cancelDeleteBtn = wrapper.querySelector("#btn-cancel-delete-res");

      if (deleteBtn && confirmBar) {
        deleteBtn.addEventListener("click", () => {
          confirmBar.classList.add("is-visible");
        });
      }
      if (cancelDeleteBtn && confirmBar) {
        cancelDeleteBtn.addEventListener("click", () => {
          confirmBar.classList.remove("is-visible");
        });
      }
      if (confirmDeleteBtn && isEditing && store) {
        confirmDeleteBtn.addEventListener("click", () => {
          store.deleteResource(existingRes.id);
          closeModal();
          showToast(`Đã xóa nguồn lực ${existingRes.name}`, "warning");
        });
      }

      // Form Submit
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameVal = (nameInput.value || "").trim();
        const roleVal = (roleInput.value || "").trim() || "Kỹ sư CNTT";
        const utilVal = Math.max(0, Math.min(100, Math.round(Number(numInput.value) || 0)));

        if (!nameVal) {
          nameInput.focus();
          showToast("Vui lòng nhập Tên nhân sự / Nhóm", "error");
          return;
        }

        const payload = {
          name: nameVal,
          role: roleVal,
          utilization: utilVal
        };

        if (!store) return;

        if (isEditing) {
          // If the resource name was changed, also update tasks/projects referencing the old name
          const oldName = existingRes.name;
          store.updateResource(existingRes.id, payload);
          if (oldName && oldName !== nameVal) {
            const st = getState();
            (st.tasks || []).forEach((t) => {
              if (t.assignee === oldName) {
                store.updateTask(t.id, { assignee: nameVal });
              }
            });
            (st.projects || []).forEach((p) => {
              if (p.manager === oldName) {
                store.updateProject(p.id, { manager: nameVal });
              }
            });
          }
          closeModal();
          showToast(`Đã cập nhật nguồn lực ${nameVal} (Chỉ số: ${utilVal})`, "success");
        } else {
          store.addResource(payload);
          closeModal();
          showToast(`Đã thêm nguồn lực mới: ${nameVal} (${roleVal})`, "success");
        }
      });

      setTimeout(() => {
        nameInput.focus();
      }, 50);
    });
  }

  // =========================================================================
  // 8. Export Public API on window.ITPM.modals
  // =========================================================================

  window.ITPM.modals = {
    openProjectModal,
    openTaskModal,
    openResourceModal,
    showToast,
    closeModal
  };

  // Convenience top-level aliases on window.ITPM
  window.ITPM.openProjectModal = openProjectModal;
  window.ITPM.openTaskModal = openTaskModal;
  window.ITPM.openResourceModal = openResourceModal;
  window.ITPM.showToast = showToast;
})();
