/**
 * IT Project Management Enterprise Dashboard - Main Application Controller
 * Namespace: window.ITPM.app
 *
 * Coordinates:
 *   1. Reactive store subscription (window.ITPM.store.subscribe)
 *   2. View routing & rendering ('dashboard', 'tasks', 'kanban', 'gantt', 'resources')
 *   3. Executive Dashboard KPI ribbon, Overdue Tasks table, Today Reference Date picker, and 4 Chart panels
 *   4. Active Filter Strip (#active-filter-bar) & individual filter chips
 *   5. Topbar navigation tabs, counts, JSON import/export dropdown, and sample data reset
 *   6. Keyboard shortcuts (Esc to exit presentation mode or clear active filters)
 */
(function () {
  "use strict";

  window.ITPM = window.ITPM || {};

  const STATUS_LABELS = {
    completed: "Đã hoàn thành",
    in_progress: "Đang thực hiện",
    not_started: "Chưa bắt đầu"
  };

  let isInitialized = false;

  // =========================================================================
  // 1. Utility Helpers
  // =========================================================================

  function escapeHtml(val) {
    if (val === null || val === undefined) return "";
    return String(val)
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

  function showToast(message, type = "info") {
    if (window.ITPM.modals && typeof window.ITPM.modals.showToast === "function") {
      window.ITPM.modals.showToast(message, type);
    }
  }

  // =========================================================================
  // 2. Executive Dashboard Renderer
  // =========================================================================

  function renderDashboardView(state, metrics) {
    if (window.ITPM.dashboardView && typeof window.ITPM.dashboardView.render === "function") {
      window.ITPM.dashboardView.render(state, metrics);
      return;
    }

    const dashboardEl = document.getElementById("view-dashboard");
    if (!dashboardEl) return;

    // 2.1 Top KPI Row
    const totalProjectsEl = document.getElementById("kpi-total-projects");
    const totalTasksEl = document.getElementById("kpi-total-tasks");
    const completedTasksEl = document.getElementById("kpi-completed-tasks");
    const completedGroupEl = document.getElementById("kpi-group-completed");

    if (totalProjectsEl) {
      totalProjectsEl.textContent = String(metrics.totalProjects ?? 7);
    }
    if (totalTasksEl) {
      totalTasksEl.textContent = String(metrics.totalTasks ?? 37);
    }
    if (completedTasksEl) {
      completedTasksEl.textContent = String(metrics.completedHeaderDisplay ?? 37);
    }
    if (completedGroupEl) {
      const cCount = metrics.completedTasksCount ?? 18;
      const ipCount = metrics.inProgressTasksCount ?? 12;
      const nsCount = metrics.notStartedTasksCount ?? 7;
      const totalCount = metrics.totalTasks ?? 37;
      completedGroupEl.title = `${cCount} đã hoàn thành (100%) • ${ipCount} đang thực hiện • ${nsCount} chưa bắt đầu — Nhấn để chuyển đổi hiển thị (${totalCount} theo mẫu / ${cCount} thực tế)`;
    }

    // 2.2 Reference Date ("Today:  08/10/2025")
    const refDateIso = state.referenceDate || "2025-10-08";
    const todayTextEl = document.getElementById("today-date-text");
    const refDatePicker = document.getElementById("ref-date-picker");
    const overdueBadgeEl = document.getElementById("overdue-count-badge");
    const overdueHeaderBox = document.getElementById("overdue-header-box");

    if (todayTextEl) {
      todayTextEl.innerHTML = `Today:&nbsp;&nbsp;${escapeHtml(formatDateVN(refDateIso))}`;
    }
    if (refDatePicker && refDatePicker.value !== refDateIso) {
      refDatePicker.value = refDateIso;
    }

    const allOverdue = Array.isArray(metrics.overdueTasks) ? metrics.overdueTasks : [];
    if (overdueBadgeEl) {
      if (allOverdue.length > 0 && state.filters && state.filters.onlyOverdue) {
        overdueBadgeEl.hidden = false;
        overdueBadgeEl.textContent = `${allOverdue.length} quá hạn`;
      } else {
        overdueBadgeEl.hidden = true;
      }
    }
    if (overdueHeaderBox) {
      overdueHeaderBox.classList.toggle("active-filter", Boolean(state.filters && state.filters.onlyOverdue));
    }

    // 2.3 Overdue Tasks Table (#overdue-table-body)
    renderOverdueTable(state, metrics);

    // 2.4 Four Interactive Dashboard Charts
    renderDashboardCharts(state, metrics);
  }

  function renderOverdueTable(state, metrics) {
    const tbody = document.getElementById("overdue-table-body");
    if (!tbody) return;

    const allOverdue = Array.isArray(metrics.overdueTasks) ? metrics.overdueTasks : [];
    const filters = state.filters || {};
    const searchNorm = (filters.search || "").trim().toLowerCase();

    const filteredOverdue = allOverdue.filter((task) => {
      if (filters.projectId && task.projectId !== filters.projectId) return false;
      if (filters.assignee && task.assignee !== filters.assignee) return false;
      if (filters.status && task.status !== filters.status) return false;
      if (searchNorm) {
        const hay = `${task.projectId} ${task.code} ${task.title} ${task.assignee} ${task.endDateVN || ""}`.toLowerCase();
        if (!hay.includes(searchNorm)) return false;
      }
      return true;
    });

    if (allOverdue.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="overdue-empty-state">
            Không có công việc quá hạn tính đến ngày ${escapeHtml(formatDateVN(state.referenceDate || "2025-10-08"))} 🎉
          </td>
        </tr>
      `;
      return;
    }

    if (filteredOverdue.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="overdue-empty-state">
            Không có công việc quá hạn khớp với bộ lọc đang chọn (Tổng quá hạn: ${allOverdue.length})
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filteredOverdue
      .map((task) => {
        const taskId = escapeHtml(task.id || task.code);
        const projCode = escapeHtml(task.projectId);
        const taskCode = escapeHtml(task.code || task.id);
        const taskTitle = escapeHtml(task.title || taskCode);
        const statusVN = escapeHtml(STATUS_LABELS[task.status] || "Đang thực hiện");
        const assignee = escapeHtml(task.assignee);
        const progressPct = `${Number(task.progress) || 0}%`;

        return `
          <tr data-task-id="${taskId}" title="Nhấn để chỉnh sửa công việc ${taskCode}: ${taskTitle}">
            <td class="text-center col-project">${projCode}</td>
            <td class="text-center col-status">${statusVN}</td>
            <td class="text-center col-assignee">${assignee}</td>
            <td class="text-center col-progress">${progressPct}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderDashboardCharts(state, metrics) {
    const charts = window.ITPM.charts;
    if (!charts) return;

    const store = window.ITPM.store;
    const filters = state.filters || {};

    // 1. Left Column: TIẾN ĐỘ DỰ ÁN (#chart-project-progress)
    const projContainer = document.getElementById("chart-project-progress");
    if (projContainer && typeof charts.renderProjectProgress === "function") {
      charts.renderProjectProgress(projContainer, state.projects, {
        activeProjectId: filters.projectId || null,
        onSelectProject: function (projectId) {
          if (!store) return;
          const current = store.getState().filters?.projectId;
          store.setFilter({ projectId: current === projectId ? null : projectId });
        }
      });
    }

    // 2. Center Top: TIẾN ĐỘ TRUNG BÌNH (#chart-avg-donut)
    const avgContainer = document.getElementById("chart-avg-donut");
    if (avgContainer && typeof charts.renderAverageProgressDonut === "function") {
      charts.renderAverageProgressDonut(avgContainer, metrics.averageProgress, {
        totalProjects: metrics.totalProjects,
        totalTasks: metrics.totalTasks
      });
    }

    // 3. Center Bottom: TRẠNG THÁI (#chart-status-pie)
    const pieContainer = document.getElementById("chart-status-pie");
    if (pieContainer && typeof charts.renderStatusPie === "function") {
      charts.renderStatusPie(
        pieContainer,
        {
          completed: metrics.completedTasksCount,
          in_progress: metrics.inProgressTasksCount,
          not_started: metrics.notStartedTasksCount,
          percentages: metrics.statusPercentages,
          total: metrics.totalTasks
        },
        {
          activeStatus: filters.status || null,
          onSelectStatus: function (statusKey) {
            if (!store) return;
            const current = store.getState().filters?.status;
            store.setFilter({ status: current === statusKey ? null : statusKey });
          }
        }
      );
    }

    // 4. Right Bottom: SỬ DỤNG NGUỒN LỰC (#chart-resource-usage)
    const resContainer = document.getElementById("chart-resource-usage");
    if (resContainer && typeof charts.renderResourceUsage === "function") {
      charts.renderResourceUsage(resContainer, state.resources, {
        activeAssignee: filters.assignee || null,
        onSelectAssignee: function (assigneeName) {
          if (!store) return;
          const current = store.getState().filters?.assignee;
          store.setFilter({ assignee: current === assigneeName ? null : assigneeName });
        }
      });
    }
  }

  // =========================================================================
  // 3. Active Filter Strip & Navigation Tabs Coordination
  // =========================================================================

  function renderActiveFilterBar(state) {
    const filterBar = document.getElementById("active-filter-bar");
    const chipsContainer = document.getElementById("active-filter-chips");
    if (!filterBar || !chipsContainer) return;

    const filters = state.filters || {};
    const chips = [];

    if (filters.projectId) {
      const proj = (state.projects || []).find((p) => p.id === filters.projectId);
      const label = proj ? `${proj.id} (${proj.name})` : filters.projectId;
      chips.push({
        key: "projectId",
        typeLabel: "Dự án",
        valueLabel: label
      });
    }

    if (filters.status) {
      chips.push({
        key: "status",
        typeLabel: "Trạng thái",
        valueLabel: STATUS_LABELS[filters.status] || filters.status
      });
    }

    if (filters.assignee) {
      chips.push({
        key: "assignee",
        typeLabel: "Người làm",
        valueLabel: filters.assignee
      });
    }

    if (filters.onlyOverdue) {
      chips.push({
        key: "onlyOverdue",
        typeLabel: "Quá hạn",
        valueLabel: "Chỉ công việc quá hạn"
      });
    }

    if (filters.search && filters.search.trim()) {
      chips.push({
        key: "search",
        typeLabel: "Tìm kiếm",
        valueLabel: `"${filters.search.trim()}"`
      });
    }

    if (chips.length === 0) {
      filterBar.hidden = true;
      chipsContainer.innerHTML = "";
      return;
    }

    filterBar.hidden = false;
    chipsContainer.innerHTML = chips
      .map(
        (c) => `
        <span class="filter-chip" data-filter-key="${escapeHtml(c.key)}">
          <span class="chip-type">${escapeHtml(c.typeLabel)}:</span>
          <span>${escapeHtml(c.valueLabel)}</span>
          <button type="button" class="chip-remove" data-remove-filter="${escapeHtml(c.key)}" title="Bỏ lọc ${escapeHtml(c.typeLabel)}">✕</button>
        </span>
      `
      )
      .join("");
  }

  function renderNavTabsAndCounts(state, metrics) {
    const activeTab = state.activeTab || "dashboard";
    const tabButtons = document.querySelectorAll(".nav-tab[data-tab]");

    tabButtons.forEach((btn) => {
      const tabName = btn.getAttribute("data-tab");
      const isActive = tabName === activeTab;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    const tasksBadge = document.getElementById("tab-count-tasks");
    if (tasksBadge) {
      tasksBadge.textContent = String(metrics.totalTasks ?? (state.tasks ? state.tasks.length : 0));
    }

    const resourcesBadge = document.getElementById("tab-count-resources");
    if (resourcesBadge) {
      resourcesBadge.textContent = String(state.resources ? state.resources.length : 0);
    }
  }

  function renderActiveWorkspaceView(state, metrics) {
    const activeTab = state.activeTab || "dashboard";

    const viewMap = {
      dashboard: document.getElementById("view-dashboard"),
      tasks: document.getElementById("view-tasks"),
      kanban: document.getElementById("view-kanban"),
      gantt: document.getElementById("view-gantt"),
      resources: document.getElementById("view-resources")
    };

    Object.keys(viewMap).forEach((key) => {
      const el = viewMap[key];
      if (!el) return;
      if (key === activeTab) {
        el.hidden = false;
        el.style.display = "";
      } else {
        el.hidden = true;
        el.style.display = "none";
      }
    });

    const ext = window.ITPM.viewsExtended || window.ITPM.extendedViews;

    if (activeTab === "dashboard") {
      renderDashboardView(state, metrics);
    } else if (activeTab === "tasks" && viewMap.tasks && ext && typeof ext.renderTasksManagerView === "function") {
      ext.renderTasksManagerView(viewMap.tasks);
    } else if (activeTab === "kanban" && viewMap.kanban && ext && typeof ext.renderKanbanView === "function") {
      ext.renderKanbanView(viewMap.kanban);
    } else if (activeTab === "gantt" && viewMap.gantt && ext && typeof ext.renderGanttView === "function") {
      ext.renderGanttView(viewMap.gantt);
    } else if (activeTab === "resources" && viewMap.resources && ext && typeof ext.renderResourcesView === "function") {
      ext.renderResourcesView(viewMap.resources);
    }
  }

  function syncPresentationState(state) {
    const isPresentation = Boolean(state.presentationMode);
    document.body.classList.toggle("presentation-mode", isPresentation);
    document.documentElement.classList.toggle("presentation-mode", isPresentation);

    const exitBtn = document.getElementById("btn-exit-presentation");
    if (exitBtn) {
      exitBtn.hidden = !isPresentation;
    }
  }

  // =========================================================================
  // 4. Master Render Cycle
  // =========================================================================

  function renderAll(passedState, passedMetrics) {
    const store = window.ITPM.store;
    if (!store) return;

    const state = passedState || store.getState();
    const metrics = passedMetrics || store.getMetrics();
    if (!state || !metrics) return;

    syncPresentationState(state);
    renderNavTabsAndCounts(state, metrics);
    renderActiveFilterBar(state);
    renderActiveWorkspaceView(state, metrics);
  }

  // =========================================================================
  // 5. Event Listeners & User Interactions
  // =========================================================================

  function bindGlobalEvents() {
    const store = window.ITPM.store;

    // 5.1 View Switcher Tabs
    const navTabsContainer = document.getElementById("main-nav-tabs");
    if (navTabsContainer) {
      navTabsContainer.addEventListener("click", (e) => {
        const tabBtn = e.target.closest(".nav-tab[data-tab]");
        if (!tabBtn || !store) return;
        const targetTab = tabBtn.getAttribute("data-tab");
        if (targetTab) {
          store.setActiveTab(targetTab);
        }
      });
    }

    // 5.2 Active Filter Bar individual chip removal
    const filterBar = document.getElementById("active-filter-bar");
    if (filterBar) {
      filterBar.addEventListener("click", (e) => {
        const removeBtn = e.target.closest("[data-remove-filter]");
        if (!removeBtn || !store) return;
        const key = removeBtn.getAttribute("data-remove-filter");
        if (key === "onlyOverdue") {
          store.setFilter({ onlyOverdue: false });
        } else if (key === "search") {
          store.setFilter({ search: "" });
        } else if (key) {
          store.setFilter({ [key]: null });
        }
      });
    }

    // 5.3 JSON Dropdown Menu Toggle
    const jsonWrapper = document.getElementById("json-dropdown-wrapper");
    const jsonBtn = document.getElementById("btn-json-dropdown");
    if (jsonWrapper && jsonBtn) {
      jsonBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = jsonWrapper.classList.toggle("open");
        jsonBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      document.addEventListener("click", (e) => {
        if (!jsonWrapper.contains(e.target)) {
          jsonWrapper.classList.remove("open");
          jsonBtn.setAttribute("aria-expanded", "false");
        }
      });
    }

    // 5.4 Hidden File Input for JSON Import
    const importInput = document.getElementById("import-json-input");
    if (importInput) {
      importInput.addEventListener("change", (e) => {
        if (window.ITPM.io && typeof window.ITPM.io.importJSON === "function") {
          window.ITPM.io.importJSON(e);
        }
        if (jsonWrapper) {
          jsonWrapper.classList.remove("open");
        }
      });
    }

    // 5.5 Executive Dashboard Interactive Elements (delegated to dashboardView if present)
    const dashboardEl = document.getElementById("view-dashboard");
    if (dashboardEl && !window.ITPM.dashboardView) {
      dashboardEl.addEventListener("click", (e) => {
        if (!store) return;

        // Click on HOÀN THÀNH KPI Group -> Toggle 37 (screenshot) vs 18 (strict completed)
        const completedKpi = e.target.closest("#kpi-group-completed");
        if (completedKpi) {
          store.toggleCompletedHeaderMode();
          const m = store.getMetrics();
          showToast(
            m.useStrictCompletedInHeader
              ? `Hiển thị số công việc hoàn thành 100% thực tế: ${m.completedTasksCount}`
              : `Hiển thị chỉ số hoàn thành theo mẫu báo cáo: ${m.completedHeaderDisplay}`,
            "info"
          );
          return;
        }

        // Click on TỔNG DỰ ÁN or CÔNG VIỆC KPI Group -> Clear active filters or navigate
        const projectsKpi = e.target.closest("#kpi-group-projects");
        const tasksKpi = e.target.closest("#kpi-group-tasks");
        if (projectsKpi || tasksKpi) {
          const st = store.getState();
          const hasFilter =
            st.filters &&
            (st.filters.projectId || st.filters.status || st.filters.assignee || st.filters.onlyOverdue || st.filters.search);
          if (hasFilter) {
            store.clearFilters();
            showToast("Đã xóa bộ lọc để hiển thị toàn bộ dữ liệu", "info");
          }
          return;
        }

        // Click on CÔNG VIỆC QUÁ HẠN header box -> Toggle onlyOverdue filter
        const overdueHeader = e.target.closest("#overdue-header-box");
        if (overdueHeader && !e.target.closest("button")) {
          const curr = Boolean(store.getState().filters?.onlyOverdue);
          store.setFilter({ onlyOverdue: !curr });
          return;
        }

        // Click on Today Date Box -> Toggle date input picker
        const todayBox = e.target.closest("#today-date-box");
        if (todayBox) {
          const picker = document.getElementById("ref-date-picker");
          if (picker && e.target !== picker) {
            picker.hidden = !picker.hidden;
            if (!picker.hidden) {
              picker.focus();
              if (typeof picker.showPicker === "function") {
                try {
                  picker.showPicker();
                } catch (err) {
                  // Ignore if browser blocks programmatic showPicker
                }
              }
            }
          }
          return;
        }

        // Click on any Overdue Table Row -> Open Task Edit Modal
        const overdueRow = e.target.closest("#overdue-table-body tr[data-task-id]");
        if (overdueRow) {
          const taskId = overdueRow.getAttribute("data-task-id");
          if (taskId && window.ITPM.modals && typeof window.ITPM.modals.openTaskModal === "function") {
            window.ITPM.modals.openTaskModal(taskId);
          }
          return;
        }
      });

      // Double-click Today Date Box -> Reset reference date to 08/10/2025
      const todayBoxEl = document.getElementById("today-date-box");
      if (todayBoxEl) {
        todayBoxEl.addEventListener("dblclick", () => {
          if (!store) return;
          store.setReferenceDate("2025-10-08");
          const picker = document.getElementById("ref-date-picker");
          if (picker) picker.hidden = true;
          showToast("Đã đặt lại ngày tham chiếu mặc định: 08/10/2025", "info");
        });
      }

      // Reference Date Picker Change
      const refDatePicker = document.getElementById("ref-date-picker");
      if (refDatePicker) {
        refDatePicker.addEventListener("change", (e) => {
          const val = e.target.value;
          if (val && store) {
            store.setReferenceDate(val);
            refDatePicker.hidden = true;
            showToast(`Đã cập nhật ngày tham chiếu Today: ${formatDateVN(val)}`, "success");
          }
        });
        refDatePicker.addEventListener("blur", () => {
          setTimeout(() => {
            refDatePicker.hidden = true;
          }, 180);
        });
      }
    }

    // 5.6 Global Keyboard Shortcuts (Esc to exit presentation mode or clear filters)
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;

      // Ignore if a modal dialog is currently open (modals.js handles its own Escape)
      if (document.querySelector(".itpm-modal-backdrop, .itpm-ext-modal-overlay")) {
        return;
      }

      // Close JSON dropdown if open
      if (jsonWrapper && jsonWrapper.classList.contains("open")) {
        jsonWrapper.classList.remove("open");
        return;
      }

      // Hide date picker if visible
      const refDatePicker = document.getElementById("ref-date-picker");
      if (refDatePicker && !refDatePicker.hidden) {
        refDatePicker.hidden = true;
        return;
      }

      if (!store) return;
      const st = store.getState();

      // 1. Exit presentation mode if active
      if (st.presentationMode) {
        if (window.ITPM.io && typeof window.ITPM.io.togglePresentationMode === "function") {
          window.ITPM.io.togglePresentationMode(false);
        } else {
          store.setPresentationMode(false);
        }
        return;
      }

      // 2. Clear active filters if any filter is active
      const f = st.filters || {};
      if (f.projectId || f.status || f.assignee || f.onlyOverdue || (f.search && f.search.trim())) {
        store.clearFilters();
        showToast("Đã xóa toàn bộ bộ lọc (Esc)", "info");
      }
    });
  }

  // =========================================================================
  // 6. Public Actions & Initialization
  // =========================================================================

  function resetSampleData() {
    const store = window.ITPM.store;
    if (!store || typeof store.resetToSeed !== "function") return;
    store.resetToSeed();
    const jsonWrapper = document.getElementById("json-dropdown-wrapper");
    if (jsonWrapper) {
      jsonWrapper.classList.remove("open");
    }
    showToast("Đã khôi phục dữ liệu mẫu gốc (7 dự án, 37 công việc, Today: 08/10/2025)", "success");
  }

  function togglePresentationMode(forceState) {
    if (window.ITPM.io && typeof window.ITPM.io.togglePresentationMode === "function") {
      return window.ITPM.io.togglePresentationMode(forceState);
    }
    const store = window.ITPM.store;
    if (!store) return false;
    const next = typeof forceState === "boolean" ? forceState : !store.getState().presentationMode;
    store.setPresentationMode(next);
    return next;
  }

  function toggleTheme() {
    const isDark = document.body.classList.toggle("theme-dark");
    const btn = document.getElementById("btn-theme-toggle");
    if (btn) {
      btn.textContent = isDark ? "🌙 Tối" : "☀️ Sáng";
    }
    renderAll();
    showToast(isDark ? "Đã chuyển sang giao diện Tối (Gold/Dark)" : "Đã chuyển sang giao diện Sáng (Light Mode)", "info");
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    const store = window.ITPM.store;
    if (store && typeof store.subscribe === "function") {
      store.subscribe((state, metrics) => {
        renderAll(state, metrics);
      });
    }

    bindGlobalEvents();
    renderAll();
  }

  window.ITPM.app = {
    init,
    renderAll,
    renderDashboardView,
    resetSampleData,
    togglePresentationMode,
    toggleTheme
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
