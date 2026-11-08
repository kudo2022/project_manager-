/**
 * IT Project Management Enterprise Dashboard - Executive Dashboard View
 * Namespace: window.ITPM.dashboardView
 *
 * Responsible for rendering and updating the Executive Dashboard DOM (#view-dashboard / #dashboard-view):
 * 1. Top KPI Ribbon (TỔNG DỰ ÁN: 7, CÔNG VIỆC: 37, HOÀN THÀNH: 37/18 toggleable with breakdown tooltip)
 * 2. Overdue Sub-header & Reference Date Bar (CÔNG VIỆC QUÁ HẠN | Today: 08/10/2025 with date menu)
 * 3. Overdue Tasks Table (6 exact columns in #e0533c on #1e1e1e, row click opens Edit Task Modal)
 * 4. Orchestrating the 4 Chart Panels via window.ITPM.charts + hover quick-action buttons
 */
(function () {
  "use strict";

  window.ITPM = window.ITPM || {};

  let initialized = false;
  let subscribed = false;
  let dateMenuOpen = false;
  let documentClickBound = false;

  // =========================================================================
  // 1. Scoped Styles for Quick Actions, Date Menu Popover & Table Enhancements
  // =========================================================================

  function injectEnhancementStyles() {
    if (document.getElementById("itpm-dashboard-view-enhancements")) return;

    const style = document.createElement("style");
    style.id = "itpm-dashboard-view-enhancements";
    style.textContent = `
      /* Ensure KPI ribbon displays all 3 KPI groups side-by-side cleanly */
      .kpi-ribbon {
        display: grid !important;
        grid-template-columns: 35.5% 1fr 1fr !important;
        gap: 18px !important;
        align-items: stretch !important;
      }

      @media (max-width: 1100px) {
        .kpi-ribbon {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 10px !important;
        }
      }

      @media (max-width: 720px) {
        .kpi-ribbon {
          grid-template-columns: 1fr !important;
        }
      }

      #kpi-group-completed,
      #kpi-completed-tasks {
        cursor: pointer;
        position: relative;
      }

      #kpi-group-completed:hover .kpi-value-box {
        box-shadow: inset 0 0 0 2px #d99b26;
      }

      .kpi-mode-indicator {
        position: absolute;
        bottom: 2px;
        right: 6px;
        font-size: 9.5px;
        font-weight: 700;
        color: #b45309;
        opacity: 0;
        transition: opacity 0.16s ease;
        pointer-events: none;
      }
      body.theme-dark .kpi-mode-indicator {
        color: #d5b36b;
      }

      #kpi-group-completed:hover .kpi-mode-indicator {
        opacity: 0.9;
      }

      /* Overdue Table Styling (Light Mode Default + Dark Mode support) */
      .overdue-table {
        width: 100%;
        border-collapse: collapse;
        background-color: #ffffff;
      }
      body.theme-dark .overdue-table {
        background-color: #1e1e1e;
      }

      .overdue-table thead th {
        background-color: #f8fafc;
        color: #0f172a;
        font-weight: 800;
        text-transform: uppercase;
        text-align: center !important;
        padding: 8px 8px;
        border-bottom: 2px solid #e2e8f0;
      }
      body.theme-dark .overdue-table thead th {
        background-color: #1e1e1e;
        color: #ffffff;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      }

      .overdue-table tbody tr {
        background-color: #ffffff;
        color: #dc2626;
        cursor: pointer;
        border-bottom: 1px solid #f1f5f9;
        transition: background-color 0.14s ease, opacity 0.16s ease;
      }
      body.theme-dark .overdue-table tbody tr {
        background-color: #1e1e1e;
        color: #e0533c;
        border-bottom: none;
      }

      .overdue-table tbody tr:hover {
        background-color: #fef2f2;
      }
      body.theme-dark .overdue-table tbody tr:hover {
        background-color: rgba(222, 186, 100, 0.12);
      }

      .overdue-table tbody tr.is-highlighted {
        background-color: #fee2e2;
      }
      body.theme-dark .overdue-table tbody tr.is-highlighted {
        background-color: rgba(224, 83, 60, 0.16);
      }

      .overdue-table tbody tr.is-dimmed {
        opacity: 0.32;
      }

      .overdue-table tbody td {
        color: #dc2626;
        font-weight: 600;
        text-align: center !important;
        padding: 5.5px 8px;
        white-space: nowrap;
      }
      body.theme-dark .overdue-table tbody td {
        color: #e0533c;
      }

      .overdue-celebration-cell {
        text-align: center !important;
        padding: 26px 14px !important;
        color: #15803d !important;
        font-weight: 700 !important;
        font-size: 0.95rem !important;
        background-color: #ffffff;
      }
      body.theme-dark .overdue-celebration-cell {
        color: #d5b36b !important;
        background-color: #1e1e1e;
      }

      /* Subtle Panel Quick-Action Buttons on Hover */
      .col-left-progress,
      .overdue-title-box,
      .card-resource-usage,
      .card-avg-progress,
      .card-status-pie {
        position: relative;
      }

      .itpm-hover-quick-btn,
      .btn-panel-add {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #f59e0b;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 700;
        line-height: 1.4;
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.16s ease, background-color 0.15s ease, color 0.15s ease;
        white-space: nowrap;
        z-index: 6;
      }
      body.theme-dark .itpm-hover-quick-btn,
      body.theme-dark .btn-panel-add {
        background: rgba(222, 186, 100, 0.14);
        color: #e2be6e;
        border-color: rgba(222, 186, 100, 0.45);
      }

      .col-left-progress:hover .itpm-hover-quick-btn,
      .col-left-progress:hover .btn-panel-add,
      .overdue-title-box:hover .itpm-hover-quick-btn,
      .card-resource-usage:hover .itpm-hover-quick-btn {
        opacity: 1;
        pointer-events: auto;
      }

      .itpm-hover-quick-btn:hover,
      .btn-panel-add:hover {
        background: #d99b26;
        color: #ffffff;
        border-color: #b45309;
      }

      body.presentation-mode .itpm-hover-quick-btn,
      body.presentation-mode .btn-panel-add {
        display: none !important;
      }

      /* Overdue Header Left Box Active Filter State */
      .overdue-title-box {
        cursor: pointer;
        user-select: none;
        transition: box-shadow 0.15s ease, background-color 0.15s ease;
      }

      .overdue-title-box.is-filter-active {
        box-shadow: inset 0 0 0 2px #dc2626;
      }

      .overdue-title-left-wrap {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      /* Reference Date ("Today: 08/10/2025") Interactive Box & Popover Menu */
      .today-date-box {
        position: relative;
        cursor: pointer;
        user-select: none;
        transition: background-color 0.15s ease, box-shadow 0.15s ease;
      }

      .itpm-refdate-popover {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        width: 260px;
        background-color: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
        padding: 10px 12px;
        z-index: 250;
        cursor: default;
        font-style: normal;
        text-align: left;
      }
      body.theme-dark .itpm-refdate-popover {
        background-color: #161616;
        border-color: #deba64;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.75);
      }

      .itpm-refdate-popover[hidden] {
        display: none !important;
      }

      .itpm-refdate-popover-header {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: #b45309;
        margin-bottom: 7px;
        letter-spacing: 0.03em;
      }
      body.theme-dark .itpm-refdate-popover-header {
        color: #e2be6e;
      }

      .itpm-refdate-input-wrap {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
      }

      .itpm-refdate-input {
        width: 100%;
        background-color: #f8fafc;
        color: #0f172a;
        border: 1px solid #cbd5e1;
        border-radius: 5px;
        padding: 5px 8px;
        font-size: 12.5px;
        font-weight: 600;
        outline: none;
      }
      body.theme-dark .itpm-refdate-input {
        background-color: #0c0c0c;
        color: #ffffff;
        border-color: rgba(222, 186, 100, 0.45);
      }

      .itpm-refdate-input:focus {
        border-color: #d99b26;
      }

      .itpm-refdate-actions {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .itpm-refdate-btn {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        background-color: #f1f5f9;
        color: #1e293b;
        border: 1px solid #e2e8f0;
        border-radius: 5px;
        padding: 5px 8px;
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.14s ease, color 0.14s ease, border-color 0.14s ease;
      }
      body.theme-dark .itpm-refdate-btn {
        background-color: #242424;
        color: #f3f4f6;
        border-color: rgba(255, 255, 255, 0.14);
      }

      .itpm-refdate-btn:hover {
        background-color: #d99b26;
        color: #ffffff;
        border-color: #b45309;
      }
    `;
    document.head.appendChild(style);
  }

  // =========================================================================
  // 2. Utility Helpers
  // =========================================================================

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDateVN(isoDate) {
    if (window.ITPM.utils && typeof window.ITPM.utils.formatDateVN === "function") {
      return window.ITPM.utils.formatDateVN(isoDate);
    }
    if (!isoDate || typeof isoDate !== "string") return "";
    const parts = isoDate.trim().slice(0, 10).split("-");
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function getDashboardRoot() {
    let root = document.getElementById("view-dashboard") || document.getElementById("dashboard-view");
    if (root && !document.getElementById("dashboard-view") && root.id === "view-dashboard") {
      // Allow querying by either #view-dashboard or data-view="dashboard-view"
      root.setAttribute("data-dashboard-root", "true");
    }
    return root;
  }

  // =========================================================================
  // 3. DOM Augmentation (Quick Action Buttons, Badge, Date Menu Popover)
  // =========================================================================

  function ensureAugmentedElements(root) {
    if (!root) return;
    injectEnhancementStyles();

    // 1. Enhance "+ Thêm dự án" button in TIẾN ĐỘ DỰ ÁN panel header
    const addProjBtn = root.querySelector("#btn-panel-add-project");
    if (addProjBtn) {
      addProjBtn.textContent = "+ Thêm dự án";
      addProjBtn.title = "Thêm dự án CNTT mới";
    } else {
      const leftHeader = root.querySelector(".col-left-progress .panel-header");
      if (leftHeader && !leftHeader.querySelector("[data-quick-action='add-project']")) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "itpm-hover-quick-btn";
        btn.setAttribute("data-quick-action", "add-project");
        btn.title = "Thêm dự án CNTT mới";
        btn.textContent = "+ Thêm dự án";
        leftHeader.appendChild(btn);
      }
    }

    // 2. Enhance CÔNG VIỆC QUÁ HẠN box with subtle badge (> 6 overdue tasks) & "+ Thêm việc" quick action
    const overdueTitleBox = root.querySelector("#overdue-title-box, #overdue-header-box");
    if (overdueTitleBox && !overdueTitleBox.dataset.augmented) {
      overdueTitleBox.dataset.augmented = "true";
      const heading = overdueTitleBox.querySelector(".overdue-title-text");

      const leftWrap = document.createElement("div");
      leftWrap.className = "overdue-title-left-wrap";
      if (heading) {
        overdueTitleBox.insertBefore(leftWrap, heading);
        leftWrap.appendChild(heading);
      } else {
        overdueTitleBox.appendChild(leftWrap);
      }

      let badge = overdueTitleBox.querySelector("#overdue-count-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.id = "overdue-count-badge";
        badge.className = "overdue-count-badge";
        badge.hidden = true;
      }
      leftWrap.appendChild(badge);

      const addTaskQuickBtn = document.createElement("button");
      addTaskQuickBtn.type = "button";
      addTaskQuickBtn.className = "itpm-hover-quick-btn";
      addTaskQuickBtn.setAttribute("data-quick-action", "add-task");
      addTaskQuickBtn.title = "Thêm công việc mới";
      addTaskQuickBtn.textContent = "+ Thêm việc";
      overdueTitleBox.appendChild(addTaskQuickBtn);
    }

    // 3. Enhance SỬ DỤNG NGUỒN LỰC panel with "+ Nguồn lực" quick action
    const resourceCard = root.querySelector(".card-resource-usage");
    if (resourceCard && !resourceCard.querySelector("[data-quick-action='add-resource']")) {
      const titleEl = resourceCard.querySelector(".panel-title");
      if (titleEl) {
        const headerRow = document.createElement("div");
        headerRow.style.display = "flex";
        headerRow.style.alignItems = "center";
        headerRow.style.justifyContent = "space-between";
        headerRow.style.width = "100%";
        headerRow.style.marginBottom = "8px";
        resourceCard.insertBefore(headerRow, titleEl);
        titleEl.style.marginBottom = "0";
        headerRow.appendChild(titleEl);

        const addResBtn = document.createElement("button");
        addResBtn.type = "button";
        addResBtn.className = "itpm-hover-quick-btn";
        addResBtn.setAttribute("data-quick-action", "add-resource");
        addResBtn.title = "Thêm hoặc điều chỉnh nguồn lực";
        addResBtn.textContent = "+ Nguồn lực";
        headerRow.appendChild(addResBtn);
      }
    }

    // 4. Enhance HOÀN THÀNH KPI box with subtle mode indicator
    const completedValueBox = root.querySelector("#kpi-completed-tasks");
    if (completedValueBox && !completedValueBox.querySelector(".kpi-mode-indicator")) {
      completedValueBox.style.position = "relative";
      const indicator = document.createElement("span");
      indicator.className = "kpi-mode-indicator";
      indicator.id = "kpi-completed-mode-hint";
      completedValueBox.appendChild(indicator);
    }

    // 5. Enhance Today Reference Date box with interactive inline menu popover
    const todayBox = root.querySelector("#today-date-box");
    if (todayBox && !todayBox.querySelector("#itpm-refdate-popover")) {
      const popover = document.createElement("div");
      popover.id = "itpm-refdate-popover";
      popover.className = "itpm-refdate-popover";
      popover.hidden = true;
      popover.innerHTML = `
        <div class="itpm-refdate-popover-header">Ngày tham chiếu (Today)</div>
        <div class="itpm-refdate-input-wrap">
          <input type="date" id="itpm-refdate-input" class="itpm-refdate-input" value="2025-10-08" />
        </div>
        <div class="itpm-refdate-actions">
          <button type="button" class="itpm-refdate-btn" data-refdate-mode="seed">
            <span>Mặc định báo cáo</span>
            <strong>08/10/2025</strong>
          </button>
          <button type="button" class="itpm-refdate-btn" data-refdate-mode="today">
            <span>Hôm nay thực tế</span>
            <strong id="itpm-realtime-today-label"></strong>
          </button>
        </div>
      `;
      todayBox.appendChild(popover);
    }

    bindDashboardEvents(root);
  }

  // =========================================================================
  // 4. Event Listeners & Interactive Handlers
  // =========================================================================

  function bindDashboardEvents(root) {
    if (!root || root.dataset.dashboardEventsBound === "true") return;
    root.dataset.dashboardEventsBound = "true";

    root.addEventListener("click", function (e) {
      const store = window.ITPM.store;
      if (!store) return;

      // 1. Quick-action buttons (+ Thêm dự án, + Thêm việc, + Nguồn lực)
      const quickBtn = e.target.closest("[data-quick-action]");
      if (quickBtn) {
        e.stopPropagation();
        const action = quickBtn.getAttribute("data-quick-action");
        triggerQuickAction(action);
        return;
      }

      // 2. Reference Date Quick Menu buttons ("seed" -> 08/10/2025, "today" -> real-time today)
      const refModeBtn = e.target.closest("[data-refdate-mode]");
      if (refModeBtn) {
        e.stopPropagation();
        const mode = refModeBtn.getAttribute("data-refdate-mode");
        store.setReferenceDate(mode);
        closeDateMenu();
        return;
      }

      // Keep popover open when interacting with the date input inside it
      if (e.target.closest("#itpm-refdate-popover")) {
        e.stopPropagation();
        return;
      }

      // 3. Clicking "Today: 08/10/2025" box opens/toggles inline date picker menu
      const todayBox = e.target.closest("#today-date-box");
      if (todayBox) {
        e.stopPropagation();
        toggleDateMenu(root);
        return;
      }

      // 4. Clicking HOÀN THÀNH KPI card toggles between 37 and 18
      const completedGroup = e.target.closest("#kpi-group-completed, #kpi-completed-tasks");
      if (completedGroup) {
        e.stopPropagation();
        store.toggleCompletedHeaderMode();
        return;
      }

      // 5. Clicking TỔNG DỰ ÁN or CÔNG VIỆC KPI cards clears active filters if any
      const projectsGroup = e.target.closest("#kpi-group-projects");
      const tasksGroup = e.target.closest("#kpi-group-tasks");
      if (projectsGroup || tasksGroup) {
        const st = store.getState();
        if (st.filters && (st.filters.projectId || st.filters.assignee || st.filters.status || st.filters.onlyOverdue)) {
          store.clearFilters();
        }
        return;
      }

      // 6. Clicking CÔNG VIỆC QUÁ HẠN box toggles overdue filter
      const overdueBox = e.target.closest("#overdue-title-box, #overdue-header-box");
      if (overdueBox) {
        const st = store.getState();
        const currentOnlyOverdue = Boolean(st.filters && st.filters.onlyOverdue);
        store.setFilter({ onlyOverdue: !currentOnlyOverdue });
        return;
      }

      // 7. Clicking any row in CÔNG VIỆC QUÁ HẠN opens the Edit Task modal
      const overdueRow = e.target.closest("#overdue-table-body tr[data-task-id]");
      if (overdueRow) {
        const taskId = overdueRow.getAttribute("data-task-id");
        if (taskId) {
          if (window.ITPM.modals && typeof window.ITPM.modals.openTaskModal === "function") {
            window.ITPM.modals.openTaskModal(taskId);
          } else {
            document.dispatchEvent(new CustomEvent("itpm:open-task-modal", { detail: { taskId } }));
          }
        }
        return;
      }
    });

    // Listen to date input changes (both our popover input and #ref-date-picker if triggered directly)
    root.addEventListener("change", function (e) {
      if (!window.ITPM.store) return;
      if (e.target && (e.target.id === "itpm-refdate-input" || e.target.id === "ref-date-picker")) {
        const val = e.target.value;
        if (val) {
          window.ITPM.store.setReferenceDate(val);
          closeDateMenu();
        }
      }
    });

    if (!documentClickBound) {
      documentClickBound = true;
      document.addEventListener("click", function (e) {
        if (!dateMenuOpen) return;
        if (!e.target.closest("#today-date-box")) {
          closeDateMenu();
        }
      });
    }
  }

  function triggerQuickAction(action) {
    const modals = window.ITPM.modals;
    if (action === "add-project") {
      if (modals && typeof modals.openProjectModal === "function") {
        modals.openProjectModal();
      }
    } else if (action === "add-task") {
      if (modals && typeof modals.openTaskModal === "function") {
        modals.openTaskModal();
      }
    } else if (action === "add-resource") {
      if (modals && typeof modals.openResourceModal === "function") {
        modals.openResourceModal();
      } else if (window.ITPM.store && typeof window.ITPM.store.setActiveTab === "function") {
        window.ITPM.store.setActiveTab("resources");
      }
    }
  }

  function toggleDateMenu(root) {
    const scope = root || document;
    const popover = scope.querySelector("#itpm-refdate-popover");
    if (!popover) return;

    dateMenuOpen = !dateMenuOpen;
    popover.hidden = !dateMenuOpen;

    if (dateMenuOpen && window.ITPM.store) {
      const state = window.ITPM.store.getState();
      const dateInput = popover.querySelector("#itpm-refdate-input");
      if (dateInput && state.referenceDate) {
        dateInput.value = state.referenceDate;
      }
      const realtimeLabel = popover.querySelector("#itpm-realtime-today-label");
      if (realtimeLabel && window.ITPM.utils && typeof window.ITPM.utils.getTodayISO === "function") {
        realtimeLabel.textContent = formatDateVN(window.ITPM.utils.getTodayISO());
      }
    }
  }

  function closeDateMenu() {
    dateMenuOpen = false;
    const popover = document.getElementById("itpm-refdate-popover");
    if (popover) {
      popover.hidden = true;
    }
  }

  // =========================================================================
  // 5. Rendering Sections
  // =========================================================================

  /**
   * 1. Top KPI Ribbon:
   * - TỔNG DỰ ÁN -> metrics.totalProjects (7)
   * - CÔNG VIỆC -> metrics.totalTasks (37)
   * - HOÀN THÀNH -> metrics.completedHeaderDisplay (37 by default, toggles between 37 and 18)
   */
  function renderTopKpiRibbon(root, state, metrics) {
    const totalProjectsEl = root.querySelector("#kpi-total-projects");
    const totalTasksEl = root.querySelector("#kpi-total-tasks");
    const completedTasksEl = root.querySelector("#kpi-completed-tasks");
    const completedGroupEl = root.querySelector("#kpi-group-completed");

    if (totalProjectsEl) {
      totalProjectsEl.textContent = String(metrics.totalProjects ?? 7);
    }
    if (totalTasksEl) {
      totalTasksEl.textContent = String(metrics.totalTasks ?? 37);
    }

    const completedCount = metrics.completedTasksCount ?? 18;
    const inProgressCount = metrics.inProgressTasksCount ?? 12;
    const notStartedCount = metrics.notStartedTasksCount ?? 7;
    const totalTasksCount = metrics.totalTasks ?? 37;
    const displayValue = metrics.completedHeaderDisplay ?? 37;

    const tooltipText = `${completedCount} hoàn thành / ${inProgressCount} đang thực hiện / ${notStartedCount} chưa bắt đầu (Click để chuyển đổi hiển thị ${completedCount} hoặc ${totalTasksCount})`;

    if (completedTasksEl) {
      // Preserve child mode hint span while updating numeric text
      const hintEl = completedTasksEl.querySelector("#kpi-completed-mode-hint");
      completedTasksEl.textContent = String(displayValue);
      if (hintEl) {
        hintEl.textContent = metrics.useStrictCompletedInHeader
          ? `${completedCount}/${totalTasksCount}`
          : `${completedCount} xong`;
        completedTasksEl.appendChild(hintEl);
      }
      completedTasksEl.setAttribute("title", tooltipText);
    }
    if (completedGroupEl) {
      completedGroupEl.setAttribute("title", tooltipText);
    }
  }

  /**
   * 2. Overdue Sub-header & Reference Date Bar:
   * - Left box: CÔNG VIỆC QUÁ HẠN (with subtle badge if > 6 overdue tasks, click to filter overdue)
   * - Right box: Today: 08/10/2025 (formatted as DD/MM/YYYY from state.referenceDate)
   */
  function renderOverdueSubheader(root, state, metrics) {
    const overdueTitleBox = root.querySelector("#overdue-title-box, #overdue-header-box");
    const badgeEl = root.querySelector("#overdue-count-badge");
    const todayDisplayEl = root.querySelector("#today-date-display, #today-date-text");
    const hiddenPickerEl = root.querySelector("#ref-date-picker");
    const popoverInputEl = root.querySelector("#itpm-refdate-input");

    const overdueCount = Array.isArray(metrics.overdueTasks) ? metrics.overdueTasks.length : 0;

    if (badgeEl) {
      if (overdueCount > 6) {
        badgeEl.hidden = false;
        badgeEl.textContent = `${overdueCount} quá hạn`;
      } else {
        badgeEl.hidden = true;
      }
    }

    if (overdueTitleBox) {
      const isOnlyOverdue = Boolean(state.filters && state.filters.onlyOverdue);
      overdueTitleBox.classList.toggle("is-filter-active", isOnlyOverdue);
    }

    const refIso = state.referenceDate || "2025-10-08";
    const refVN = formatDateVN(refIso);

    if (todayDisplayEl) {
      todayDisplayEl.innerHTML = `Today:&nbsp;&nbsp;${escapeHtml(refVN)}`;
    }
    if (hiddenPickerEl) {
      hiddenPickerEl.value = refIso;
    }
    if (popoverInputEl && !dateMenuOpen) {
      popoverInputEl.value = refIso;
    }
  }

  /**
   * 3. Project & Status Table (DỰ ÁN):
   * Columns in exact order:
   * DỰ ÁN | TRẠNG THÁI | NGƯỜI LÀM | TIẾN ĐỘ
   */
  function getStatusLabelVN(statusKey, progress) {
    if (statusKey === "completed" || Number(progress) >= 100) return "Hoàn thành";
    if (statusKey === "not_started" || Number(progress) === 0) return "Chưa bắt đầu";
    return "Đang thực hiện";
  }

  function renderOverdueTable(root, state, metrics) {
    const tbody = root.querySelector("#overdue-table-body, #overdue-tasks-tbody");
    if (!tbody) return;

    const allOverdue = Array.isArray(metrics.overdueTasks) ? metrics.overdueTasks : [];
    const allTasks = Array.isArray(state.tasks) ? state.tasks : [];
    const filters = state.filters || {};
    const hasFilter = Boolean(filters.projectId || filters.assignee || filters.status || filters.search || filters.onlyOverdue);
    const searchNorm = (filters.search || "").trim().toLowerCase();

    // When no filter is active, show the 6 featured project rows (or fallback to allTasks.slice(0, 6)).
    // When a filter is active (e.g. clicking a project bar, pie slice, or resource), filter across allTasks!
    const sourceList = hasFilter ? allTasks : (allOverdue.length > 0 ? allOverdue : allTasks.slice(0, 6));

    const filteredRows = sourceList.filter((task) => {
      if (filters.projectId && task.projectId !== filters.projectId) return false;
      if (filters.assignee && task.assignee !== filters.assignee) return false;
      if (filters.status && task.status !== filters.status) return false;
      if (searchNorm) {
        const statusText = getStatusLabelVN(task.status, task.progress);
        const hay = `${task.projectId} ${task.code || task.id} ${task.title || ""} ${task.assignee || ""} ${statusText}`.toLowerCase();
        if (!hay.includes(searchNorm)) return false;
      }
      return true;
    });

    if (filteredRows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="overdue-celebration-cell">
            Không có dữ liệu dự án khớp với bộ lọc
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filteredRows
      .map((task) => {
        const taskId = escapeHtml(task.id || task.code);
        const projectCode = escapeHtml(task.projectId);
        const taskTitle = escapeHtml(task.title || task.code || task.id);
        const statusVN = escapeHtml(getStatusLabelVN(task.status, task.progress));
        const assignee = escapeHtml(task.assignee);
        const progressFormatted = `${Number(task.progress) || 0}%`;
        const highlightClass = hasFilter ? "is-highlighted" : "";

        return `
          <tr data-task-id="${taskId}" class="${highlightClass}" title="Nhấn để chỉnh sửa: ${taskTitle}">
            <td class="col-project">${projectCode}</td>
            <td class="col-status">${statusVN}</td>
            <td class="col-assignee">${assignee}</td>
            <td class="col-progress">${progressFormatted}</td>
          </tr>
        `;
      })
      .join("");
  }

  /**
   * 4. Active Filter Strip Synchronization (Top filter bar if present in index.html)
   */
  function renderActiveFilterStrip(state) {
    const filterBar = document.getElementById("active-filter-bar");
    const chipsList = document.getElementById("filter-chips-list");
    if (!filterBar || !chipsList) return;

    const filters = state.filters || {};
    const chips = [];

    if (filters.projectId) {
      chips.push({ key: "projectId", label: `Dự án: ${filters.projectId}` });
    }
    if (filters.assignee) {
      chips.push({ key: "assignee", label: `Nhân sự: ${filters.assignee}` });
    }
    if (filters.status) {
      const statusNames = {
        not_started: "Chưa bắt đầu",
        in_progress: "Đang thực hiện",
        completed: "Hoàn thành"
      };
      chips.push({ key: "status", label: `Trạng thái: ${statusNames[filters.status] || filters.status}` });
    }
    if (filters.onlyOverdue) {
      chips.push({ key: "onlyOverdue", label: "Chỉ việc quá hạn" });
    }
    if (filters.search) {
      chips.push({ key: "search", label: `Tìm kiếm: "${filters.search}"` });
    }

    if (chips.length === 0) {
      filterBar.hidden = true;
      chipsList.innerHTML = "";
      return;
    }

    filterBar.hidden = false;
    chipsList.innerHTML = chips
      .map(
        (c) => `
        <span class="filter-chip" data-clear-filter-key="${escapeHtml(c.key)}" style="display:inline-flex;align-items:center;gap:6px;background:#252525;border:1px solid #deba64;color:#fff;padding:2px 9px;border-radius:999px;font-size:12px;cursor:pointer;margin-right:6px;" title="Nhấn để bỏ điều kiện lọc này">
          <span>${escapeHtml(c.label)}</span>
          <strong style="color:#e0533c;">✕</strong>
        </span>
      `
      )
      .join("");

    chipsList.querySelectorAll("[data-clear-filter-key]").forEach((chipEl) => {
      chipEl.addEventListener("click", function () {
        const key = chipEl.getAttribute("data-clear-filter-key");
        if (!window.ITPM.store || !key) return;
        const resetVal = key === "onlyOverdue" ? false : key === "search" ? "" : null;
        window.ITPM.store.setFilter({ [key]: resetVal });
      });
    });
  }

  /**
   * 5. Orchestrating the 4 Chart Panels via window.ITPM.charts
   */
  function renderChartPanels(root, state, metrics) {
    const charts = window.ITPM.charts;
    if (!charts) return;

    const projectContainer = root.querySelector("#chart-project-progress");
    const avgDonutContainer = root.querySelector("#chart-avg-donut, #chart-avg-progress");
    const statusPieContainer = root.querySelector("#chart-status-pie");
    const resourceContainer = root.querySelector("#chart-resource-usage");

    const activeProjectId = (state.filters && state.filters.projectId) || null;
    const activeStatus = (state.filters && state.filters.status) || null;
    const activeAssignee = (state.filters && state.filters.assignee) || null;

    // 1. TIẾN ĐỘ DỰ ÁN
    if (projectContainer && typeof charts.renderProjectProgress === "function") {
      charts.renderProjectProgress(
        projectContainer,
        state.projects,
        activeProjectId,
        function onSelectProject(projectId) {
          if (!window.ITPM.store) return;
          const curr = window.ITPM.store.getState().filters?.projectId;
          window.ITPM.store.setFilter({ projectId: curr === projectId ? null : projectId });
        }
      );
    }

    // 2. TIẾN ĐỘ TRUNG BÌNH (69% Donut)
    if (avgDonutContainer && typeof charts.renderAverageProgressDonut === "function") {
      charts.renderAverageProgressDonut(avgDonutContainer, metrics.averageProgress);
    }

    // 3. TRẠNG THÁI (18 Hoàn thành, 12 Đang thực hiện, 7 Chưa bắt đầu)
    if (statusPieContainer && typeof charts.renderStatusPie === "function") {
      charts.renderStatusPie(
        statusPieContainer,
        {
          not_started: metrics.notStartedTasksCount,
          in_progress: metrics.inProgressTasksCount,
          completed: metrics.completedTasksCount
        },
        activeStatus,
        function onSelectStatus(statusKey) {
          if (!window.ITPM.store) return;
          const curr = window.ITPM.store.getState().filters?.status;
          window.ITPM.store.setFilter({ status: curr === statusKey ? null : statusKey });
        }
      );
    }

    // 4. SỬ DỤNG NGUỒN LỰC
    if (resourceContainer && typeof charts.renderResourceUsage === "function") {
      charts.renderResourceUsage(
        resourceContainer,
        state.resources,
        activeAssignee,
        function onSelectAssignee(assigneeName) {
          if (!window.ITPM.store) return;
          const curr = window.ITPM.store.getState().filters?.assignee;
          window.ITPM.store.setFilter({ assignee: curr === assigneeName ? null : assigneeName });
        }
      );
    }
  }

  // =========================================================================
  // 6. Main Render & Initialization API (window.ITPM.dashboardView)
  // =========================================================================

  function render(passedState, passedMetrics) {
    const store = window.ITPM.store;
    const state = passedState || (store ? store.getState() : null);
    const metrics = passedMetrics || (store ? store.getMetrics() : null);
    if (!state || !metrics) return;

    const root = getDashboardRoot();
    if (!root) return;

    ensureAugmentedElements(root);

    // Sync presentation mode class
    document.body.classList.toggle("presentation-mode", Boolean(state.presentationMode));

    renderTopKpiRibbon(root, state, metrics);
    renderOverdueSubheader(root, state, metrics);
    renderOverdueTable(root, state, metrics);
    renderActiveFilterStrip(state);
    renderChartPanels(root, state, metrics);

    // Also keep top navigation tab badges in sync if present
    const tasksBadge = document.getElementById("tab-badge-tasks");
    if (tasksBadge) {
      tasksBadge.textContent = String(metrics.totalTasks ?? state.tasks.length);
    }
    const resBadge = document.getElementById("tab-badge-resources");
    if (resBadge) {
      resBadge.textContent = String(state.resources ? state.resources.length : 7);
    }
  }

  function init() {
    const root = getDashboardRoot();
    if (root) {
      ensureAugmentedElements(root);
    }
    if (window.ITPM.store && !subscribed) {
      subscribed = true;
      window.ITPM.store.subscribe(function (state, metrics) {
        render(state, metrics);
      });
    }
    initialized = true;
    render();
    return root;
  }

  window.ITPM.dashboardView = {
    init,
    render,
    update: render,
    refresh: function () {
      render();
    },
    openDateMenu: toggleDateMenu,
    closeDateMenu
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (!initialized) {
        init();
      }
    });
  } else {
    if (!initialized) {
      init();
    }
  }
})();
