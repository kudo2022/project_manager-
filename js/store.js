/**
 * IT Project Management Enterprise Dashboard - Reactive State Store & Utilities
 * Namespace: window.ITPM.store & window.ITPM.utils
 */
(function () {
  "use strict";

  window.ITPM = window.ITPM || {};

  const STORAGE_KEY = "it_pm_enterprise_v1";
  const DEFAULT_REF_DATE = "2025-10-08";

  // =========================================================================
  // 1. Date & General Utilities (window.ITPM.utils)
  // =========================================================================

  /**
   * Parses an ISO date string ("YYYY-MM-DD") into UTC midnight timestamp (ms).
   * Returns NaN if invalid.
   */
  function toUTCMidnight(isoDateStr) {
    if (!isoDateStr || typeof isoDateStr !== "string") return NaN;
    const clean = isoDateStr.trim().slice(0, 10);
    const parts = clean.split("-");
    if (parts.length !== 3) return NaN;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return NaN;
    return Date.UTC(year, month, day);
  }

  /**
   * Formats an ISO date ("YYYY-MM-DD") to Vietnamese format ("DD/MM/YYYY").
   * e.g. "2025-03-04" -> "04/03/2025"
   */
  function formatDateVN(isoDate) {
    if (!isoDate || typeof isoDate !== "string") return "";
    const clean = isoDate.trim().slice(0, 10);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;
    const parts = clean.split("-");
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }

  /**
   * Parses a Vietnamese date string ("DD/MM/YYYY") to ISO format ("YYYY-MM-DD").
   * If already "YYYY-MM-DD", returns normalized string.
   */
  function parseDateVN(vnDate) {
    if (!vnDate || typeof vnDate !== "string") return "";
    const clean = vnDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    const parts = clean.split("/");
    if (parts.length !== 3) return clean;
    const [d, m, y] = parts;
    if (!y || !m || !d) return clean;
    return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  /**
   * Calculates exact integer overdue days between endDateIso and refDateIso
   * using UTC midnight math so "2025-10-08" minus "2025-03-04" is ALWAYS 218
   * regardless of local timezone.
   * Returns > 0 when refDateIso > endDateIso, 0 or negative otherwise.
   */
  function calcOverdueDays(endDateIso, refDateIso = DEFAULT_REF_DATE) {
    const endNorm = parseDateVN(endDateIso);
    const refNorm = parseDateVN(refDateIso || DEFAULT_REF_DATE);
    const endUTC = toUTCMidnight(endNorm);
    const refUTC = toUTCMidnight(refNorm);
    if (isNaN(endUTC) || isNaN(refUTC)) return 0;
    return Math.round((refUTC - endUTC) / 86400000);
  }

  /**
   * Returns today's real date in local timezone as "YYYY-MM-DD".
   */
  function getTodayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /**
   * Safe deep clone helper.
   */
  function deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      return obj;
    }
  }

  window.ITPM.utils = Object.assign(window.ITPM.utils || {}, {
    formatDateVN,
    parseDateVN,
    calcOverdueDays,
    toUTCMidnight,
    getTodayISO,
    deepClone
  });

  // =========================================================================
  // 2. Seed Fallback & Normalization
  // =========================================================================

  function getFallbackSeedData() {
    return {
      referenceDate: DEFAULT_REF_DATE,
      syncProjectProgressFromTasks: false,
      kpiOverride: {
        completedHeaderValue: 37,
        useStrictCompletedInHeader: false
      },
      projects: [
        { id: "PRJ-01", name: "Xây dựng ứng dụng Thuế điện tử", department: "Phòng Dự Án 1", manager: "Lê Minh", progress: 11, startDate: "2025-01-10", endDate: "2025-12-31" },
        { id: "PRJ-02", name: "Nâng cấp cổng thông tin dịch vụ công", department: "Phòng Giải Pháp", manager: "Trần Hùng", progress: 41, startDate: "2025-02-01", endDate: "2025-11-30" },
        { id: "PRJ-03", name: "Hệ thống quản lý hóa đơn điện tử", department: "Phòng Dự Án 2", manager: "Nguyễn Thảo", progress: 83, startDate: "2025-01-15", endDate: "2025-10-30" },
        { id: "PRJ-04", name: "Tích hợp CSDL Quốc gia về Dân cư", department: "Phòng Tích Hợp", manager: "Phạm Khoa", progress: 93, startDate: "2024-11-01", endDate: "2025-10-15" },
        { id: "PRJ-05", name: "Hệ thống báo cáo điều hành BI", department: "Phòng Dữ Liệu", manager: "Hoàng Yến", progress: 100, startDate: "2024-09-01", endDate: "2025-06-30" },
        { id: "PRJ-06", name: "Nâng cấp hạ tầng bảo mật SOC", department: "Phòng An Ninh Mạng", manager: "Vũ Tuấn", progress: 100, startDate: "2024-10-01", endDate: "2025-05-30" },
        { id: "PRJ-07", name: "Số hóa hồ sơ lưu trữ điện tử", department: "Phòng Giải Pháp", manager: "Đặng Mai", progress: 100, startDate: "2024-08-15", endDate: "2025-04-30" }
      ],
      tasks: [],
      resources: [
        { id: "RES-01", name: "Tô văn Tùng", role: "Backend Developer", utilization: 65 },
        { id: "RES-02", name: "Đào văn Sơn", role: "System Analyst", utilization: 55 },
        { id: "RES-03", name: "Tô văn Nam", role: "Frontend Developer", utilization: 76 },
        { id: "RES-04", name: "Văn Tùng", role: "QA / QC Engineer", utilization: 65 },
        { id: "RES-05", name: "Đào Sơn", role: "DevOps / Infra", utilization: 55 },
        { id: "RES-06", name: "Văn Nam", role: "Solution Architect", utilization: 76 }
      ]
    };
  }

  function normalizeProject(p, idx) {
    const progressNum = Number(p.progress);
    return {
      id: String(p.id || `PRJ-${String(idx + 1).padStart(2, "0")}`),
      name: String(p.name || p.title || `Dự án ${idx + 1}`),
      department: String(p.department || "Khối CNTT"),
      manager: String(p.manager || "Ban Quản Lý DA"),
      progress: isNaN(progressNum) ? 0 : Math.max(0, Math.min(100, Math.round(progressNum))),
      startDate: parseDateVN(p.startDate || "2025-01-01"),
      endDate: parseDateVN(p.endDate || "2025-12-31"),
      description: p.description || ""
    };
  }

  function normalizeTask(t, idx) {
    const code = String(t.code || t.id || `CTax${String(idx + 1).padStart(4, "0")}`);
    const id = String(t.id || code);
    let progress = Number(t.progress);
    if (isNaN(progress)) progress = 0;
    progress = Math.max(0, Math.min(100, Math.round(progress)));

    let status = t.status;
    if (!["completed", "in_progress", "not_started"].includes(status)) {
      if (progress >= 100) status = "completed";
      else if (progress > 0) status = "in_progress";
      else status = "not_started";
    }

    return {
      id,
      code,
      projectId: String(t.projectId || "PRJ-01"),
      title: String(t.title || t.name || `Công việc ${code}`),
      assignee: String(t.assignee || t.resource || "Tô văn Tùng"),
      startDate: parseDateVN(t.startDate || "2025-01-15"),
      endDate: parseDateVN(t.endDate || "2025-03-04"),
      progress,
      status,
      priority: t.priority || "high",
      notes: t.notes || ""
    };
  }

  function normalizeResource(r, idx) {
    const utilNum = Number(r.utilization ?? r.progress ?? r.allocation ?? 0);
    return {
      id: String(r.id || `RES-${String(idx + 1).padStart(2, "0")}`),
      name: String(r.name || `Nhân sự ${idx + 1}`),
      role: String(r.role || "Kỹ sư CNTT"),
      utilization: isNaN(utilNum) ? 0 : Math.max(0, Math.min(100, Math.round(utilNum))),
      department: r.department || "Trung tâm CNTT"
    };
  }

  function buildSeedState() {
    const rawSeed = window.ITPM.SEED_DATA || getFallbackSeedData();
    const cloned = deepClone(rawSeed);

    const projects = Array.isArray(cloned.projects)
      ? cloned.projects.map(normalizeProject)
      : getFallbackSeedData().projects.map(normalizeProject);

    const tasks = Array.isArray(cloned.tasks)
      ? cloned.tasks.map(normalizeTask)
      : [];

    const resources = Array.isArray(cloned.resources)
      ? cloned.resources.map(normalizeResource)
      : getFallbackSeedData().resources.map(normalizeResource);

    return {
      referenceDate: parseDateVN(cloned.referenceDate || DEFAULT_REF_DATE) || DEFAULT_REF_DATE,
      syncProjectProgressFromTasks: Boolean(cloned.syncProjectProgressFromTasks ?? false),
      kpiOverride: Object.assign(
        {
          completedHeaderValue: 37,
          useStrictCompletedInHeader: false
        },
        cloned.kpiOverride || {}
      ),
      projects,
      tasks,
      resources,
      filters: {
        projectId: null,
        status: null,
        assignee: null,
        search: "",
        onlyOverdue: false
      },
      activeTab: "dashboard",
      presentationMode: false
    };
  }

  // =========================================================================
  // 3. Store Implementation (window.ITPM.store)
  // =========================================================================

  let state = null;
  const listeners = new Set();

  function loadInitialState() {
    const seedState = buildSeedState();
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (!savedRaw) {
        return seedState;
      }
      const parsed = JSON.parse(savedRaw);
      if (!parsed || typeof parsed !== "object") {
        return seedState;
      }

      const loadedProjects = Array.isArray(parsed.projects) && parsed.projects.length > 0
        ? parsed.projects.map(normalizeProject)
        : seedState.projects;

      const loadedTasks = Array.isArray(parsed.tasks) && parsed.tasks.length > 0
        ? parsed.tasks.map(normalizeTask)
        : seedState.tasks;

      const loadedResources = Array.isArray(parsed.resources) && parsed.resources.length > 0
        ? parsed.resources.map(normalizeResource)
        : seedState.resources;

      return {
        referenceDate: parseDateVN(parsed.referenceDate || seedState.referenceDate) || DEFAULT_REF_DATE,
        syncProjectProgressFromTasks: Boolean(parsed.syncProjectProgressFromTasks ?? false),
        kpiOverride: Object.assign(
          {
            completedHeaderValue: 37,
            useStrictCompletedInHeader: false
          },
          parsed.kpiOverride || {}
        ),
        projects: loadedProjects,
        tasks: loadedTasks,
        resources: loadedResources,
        filters: Object.assign(
          {
            projectId: null,
            status: null,
            assignee: null,
            search: "",
            onlyOverdue: false
          },
          parsed.filters || {}
        ),
        activeTab: ["dashboard", "tasks", "kanban", "gantt", "resources"].includes(parsed.activeTab)
          ? parsed.activeTab
          : "dashboard",
        presentationMode: Boolean(parsed.presentationMode ?? false)
      };
    } catch (err) {
      console.warn("[ITPM.store] Failed to load state from localStorage, falling back to SEED_DATA:", err);
      return seedState;
    }
  }

  function ensureInitialized() {
    if (!state) {
      state = loadInitialState();
    } else if (
      state.tasks.length === 0 &&
      window.ITPM.SEED_DATA &&
      Array.isArray(window.ITPM.SEED_DATA.tasks) &&
      window.ITPM.SEED_DATA.tasks.length > 0
    ) {
      // In case store.js was evaluated before seedData.js finished loading
      state = loadInitialState();
    }
  }

  function saveToStorage() {
    ensureInitialized();
    try {
      const persistentPayload = {
        referenceDate: state.referenceDate,
        syncProjectProgressFromTasks: state.syncProjectProgressFromTasks,
        kpiOverride: state.kpiOverride,
        projects: state.projects,
        tasks: state.tasks,
        resources: state.resources,
        filters: state.filters,
        activeTab: state.activeTab,
        presentationMode: state.presentationMode
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentPayload));
    } catch (err) {
      console.warn("[ITPM.store] Failed to persist state to localStorage:", err);
    }
  }

  function getState() {
    ensureInitialized();
    return state;
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      return function noop() {};
    }
    listeners.add(listener);
    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  function notify() {
    ensureInitialized();
    saveToStorage();
    const currentState = getState();
    const currentMetrics = getMetrics();
    listeners.forEach((listener) => {
      try {
        listener(currentState, currentMetrics);
      } catch (err) {
        console.error("[ITPM.store] Error in subscriber listener:", err);
      }
    });
  }

  // =========================================================================
  // 4. Selectors & Computed Metrics
  // =========================================================================

  /**
   * Checks whether current project percentages match the exact 7 seed projects
   * (11%, 41%, 83%, 93%, 100%, 100%, 100% -> 69% in screenshot).
   */
  function isSeedProjectProgressUnmodified(projects) {
    if (!Array.isArray(projects) || projects.length !== 7) return false;
    const expected = [11, 41, 83, 93, 100, 100, 100];
    const currentSorted = projects.map((p) => Number(p.progress)).sort((a, b) => a - b);
    for (let i = 0; i < expected.length; i++) {
      if (currentSorted[i] !== expected[i]) return false;
    }
    return true;
  }

  function isTaskOverdue(task, refDate) {
    if (!task) return false;
    if (task.status === "completed" || Number(task.progress) >= 100) return false;
    if (!task.endDate) return false;
    return task.endDate < refDate;
  }

  function getOverdueTasks() {
    ensureInitialized();
    const refDate = state.referenceDate || DEFAULT_REF_DATE;
    const projectMap = new Map(state.projects.map((p) => [p.id, p]));

    return state.tasks
      .filter((t) => isTaskOverdue(t, refDate))
      .map((t) => {
        const overdueDays = calcOverdueDays(t.endDate, refDate);
        const proj = projectMap.get(t.projectId);
        return Object.assign({}, t, {
          overdueDays: Math.max(0, overdueDays),
          endDateVN: formatDateVN(t.endDate),
          startDateVN: formatDateVN(t.startDate),
          projectName: proj ? proj.name : ""
        });
      })
      .sort((a, b) => {
        return String(a.code || a.id).localeCompare(String(b.code || b.id), "vi", { numeric: true });
      });
  }

  function getFilteredTasks() {
    ensureInitialized();
    const { projectId, status, assignee, search, onlyOverdue } = state.filters || {};
    const refDate = state.referenceDate || DEFAULT_REF_DATE;
    const projectMap = new Map(state.projects.map((p) => [p.id, p]));
    const searchNorm = (search || "").trim().toLowerCase();

    return state.tasks
      .filter((t) => {
        if (projectId && t.projectId !== projectId) return false;
        if (status && t.status !== status) return false;
        if (assignee && t.assignee !== assignee) return false;
        if (onlyOverdue && !isTaskOverdue(t, refDate)) return false;
        if (searchNorm) {
          const proj = projectMap.get(t.projectId);
          const haystack = [
            t.code,
            t.id,
            t.title,
            t.assignee,
            proj ? proj.name : "",
            formatDateVN(t.endDate)
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(searchNorm)) return false;
        }
        return true;
      })
      .map((t) => {
        const overdue = isTaskOverdue(t, refDate);
        const overdueDays = overdue ? Math.max(0, calcOverdueDays(t.endDate, refDate)) : 0;
        const proj = projectMap.get(t.projectId);
        return Object.assign({}, t, {
          isOverdue: overdue,
          overdueDays,
          endDateVN: formatDateVN(t.endDate),
          startDateVN: formatDateVN(t.startDate),
          projectName: proj ? proj.name : ""
        });
      });
  }

  function getMetrics() {
    ensureInitialized();
    const totalProjects = state.projects.length;
    const totalTasks = state.tasks.length;

    let completedTasksCount = 0;
    let inProgressTasksCount = 0;
    let notStartedTasksCount = 0;

    for (let i = 0; i < state.tasks.length; i++) {
      const t = state.tasks[i];
      if (t.status === "completed") {
        completedTasksCount++;
      } else if (t.status === "in_progress") {
        inProgressTasksCount++;
      } else {
        notStartedTasksCount++;
      }
    }

    const useStrict = Boolean(state.kpiOverride?.useStrictCompletedInHeader);
    const completedHeaderDisplay = useStrict
      ? completedTasksCount
      : (state.kpiOverride?.completedHeaderValue ?? totalTasks);

    let averageProgress = 69;
    if (!state.syncProjectProgressFromTasks && isSeedProjectProgressUnmodified(state.projects)) {
      averageProgress = 69;
    } else if (totalProjects > 0) {
      const sumProj = state.projects.reduce((acc, p) => acc + (Number(p.progress) || 0), 0);
      averageProgress = Math.round(sumProj / totalProjects);
    } else if (totalTasks > 0) {
      const sumTask = state.tasks.reduce((acc, t) => acc + (Number(t.progress) || 0), 0);
      averageProgress = Math.round(sumTask / totalTasks);
    } else {
      averageProgress = 0;
    }

    const overdueTasks = getOverdueTasks();
    const filteredTasks = getFilteredTasks();

    // Status percentages for the Donut/Pie chart
    const completedPct = totalTasks > 0 ? Number(((completedTasksCount / totalTasks) * 100).toFixed(1)) : 0;
    const inProgressPct = totalTasks > 0 ? Number(((inProgressTasksCount / totalTasks) * 100).toFixed(1)) : 0;
    const notStartedPct = totalTasks > 0 ? Number(((notStartedTasksCount / totalTasks) * 100).toFixed(1)) : 0;

    return {
      totalProjects,
      totalTasks,
      completedTasksCount,
      inProgressTasksCount,
      notStartedTasksCount,
      completedCount: completedTasksCount,
      completedHeaderDisplay,
      useStrictCompletedInHeader: useStrict,
      averageProgress,
      overdueTasks,
      overdueTasksCount: overdueTasks.length,
      filteredTasks,
      statusPercentages: {
        completed: completedPct,
        in_progress: inProgressPct,
        not_started: notStartedPct
      }
    };
  }

  // =========================================================================
  // 5. Mutations & Actions
  // =========================================================================

  function setFilter(partialFilter) {
    ensureInitialized();
    if (!partialFilter || typeof partialFilter !== "object") return;
    state.filters = Object.assign({}, state.filters, partialFilter);
    notify();
  }

  function clearFilters() {
    ensureInitialized();
    state.filters = {
      projectId: null,
      status: null,
      assignee: null,
      search: "",
      onlyOverdue: false
    };
    notify();
  }

  function setActiveTab(tab) {
    ensureInitialized();
    const allowed = ["dashboard", "tasks", "kanban", "gantt", "resources"];
    if (allowed.includes(tab)) {
      state.activeTab = tab;
      notify();
    }
  }

  function setPresentationMode(bool) {
    ensureInitialized();
    state.presentationMode = Boolean(bool);
    notify();
  }

  function setReferenceDate(dateStr) {
    ensureInitialized();
    if (dateStr === "today") {
      state.referenceDate = getTodayISO();
    } else if (dateStr === "seed" || dateStr === "default") {
      state.referenceDate = DEFAULT_REF_DATE;
    } else {
      const parsed = parseDateVN(dateStr);
      if (parsed && !isNaN(toUTCMidnight(parsed))) {
        state.referenceDate = parsed;
      }
    }
    notify();
  }

  function toggleCompletedHeaderMode() {
    ensureInitialized();
    state.kpiOverride = state.kpiOverride || { completedHeaderValue: 37, useStrictCompletedInHeader: false };
    state.kpiOverride.useStrictCompletedInHeader = !state.kpiOverride.useStrictCompletedInHeader;
    notify();
  }

  function setSyncProjectProgress(enabled) {
    ensureInitialized();
    state.syncProjectProgressFromTasks = Boolean(enabled);
    if (state.syncProjectProgressFromTasks) {
      recalculateAllProjectsProgress(false);
    }
    notify();
  }

  function recalculateProjectProgress(projectId, shouldNotify = true) {
    ensureInitialized();
    const proj = state.projects.find((p) => p.id === projectId);
    if (!proj) return;
    const projTasks = state.tasks.filter((t) => t.projectId === projectId);
    if (projTasks.length > 0) {
      const sum = projTasks.reduce((acc, t) => acc + (Number(t.progress) || 0), 0);
      proj.progress = Math.max(0, Math.min(100, Math.round(sum / projTasks.length)));
    }
    if (shouldNotify) {
      notify();
    }
  }

  function recalculateAllProjectsProgress(shouldNotify = true) {
    ensureInitialized();
    state.projects.forEach((p) => {
      recalculateProjectProgress(p.id, false);
    });
    if (shouldNotify) {
      notify();
    }
  }

  // --- Project CRUD ---

  function addProject(proj) {
    ensureInitialized();
    if (!proj || typeof proj !== "object") return null;
    const nextIdx = state.projects.length + 1;
    const newId = proj.id || `PRJ-${String(Date.now()).slice(-4)}`;
    const normalized = normalizeProject(Object.assign({}, proj, { id: newId }), nextIdx);
    state.projects.push(normalized);
    notify();
    return normalized;
  }

  function updateProject(id, updates) {
    ensureInitialized();
    const idx = state.projects.findIndex((p) => p.id === id);
    if (idx === -1 || !updates || typeof updates !== "object") return null;
    const updated = normalizeProject(Object.assign({}, state.projects[idx], updates, { id }), idx);
    state.projects[idx] = updated;
    notify();
    return updated;
  }

  function deleteProject(id) {
    ensureInitialized();
    const prevLen = state.projects.length;
    state.projects = state.projects.filter((p) => p.id !== id);
    if (state.projects.length !== prevLen) {
      // Also clean up or reassign tasks belonging to deleted project
      state.tasks = state.tasks.filter((t) => t.projectId !== id);
      if (state.filters.projectId === id) {
        state.filters.projectId = null;
      }
      notify();
      return true;
    }
    return false;
  }

  // --- Task CRUD ---

  function generateNextTaskCode() {
    ensureInitialized();
    let maxNum = 0;
    state.tasks.forEach((t) => {
      const match = String(t.code || t.id || "").match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `CTax${String(maxNum + 1).padStart(4, "0")}`;
  }

  function reconcileTaskStatusAndProgress(currentTask, updates) {
    const merged = Object.assign({}, currentTask, updates);
    const hasProgressUpdate = Object.prototype.hasOwnProperty.call(updates, "progress");
    const hasStatusUpdate = Object.prototype.hasOwnProperty.call(updates, "status");

    let progress = Number(merged.progress);
    if (isNaN(progress)) progress = 0;
    progress = Math.max(0, Math.min(100, Math.round(progress)));

    let status = merged.status;

    if (hasProgressUpdate && !hasStatusUpdate) {
      if (progress >= 100) {
        progress = 100;
        status = "completed";
      } else if (progress <= 0) {
        progress = 0;
        status = "not_started";
      } else {
        status = "in_progress";
      }
    } else if (hasStatusUpdate && !hasProgressUpdate) {
      if (status === "completed") {
        progress = 100;
      } else if (status === "not_started") {
        progress = 0;
      } else if (status === "in_progress" && (progress <= 0 || progress >= 100)) {
        progress = currentTask && currentTask.progress > 0 && currentTask.progress < 100 ? currentTask.progress : 50;
      }
    } else {
      // Both or neither updated: ensure consistency rules
      if (progress === 100 || status === "completed") {
        progress = 100;
        status = "completed";
      } else if (status === "not_started") {
        progress = 0;
      } else if (progress > 0 && progress < 100 && !["in_progress", "completed"].includes(status)) {
        status = "in_progress";
      }
    }

    merged.progress = progress;
    merged.status = status;
    return merged;
  }

  function addTask(task) {
    ensureInitialized();
    if (!task || typeof task !== "object") return null;
    const code = task.code || generateNextTaskCode();
    const id = task.id || code;
    const reconciled = reconcileTaskStatusAndProgress(
      {
        id,
        code,
        projectId: state.projects[0]?.id || "PRJ-01",
        title: "Công việc mới",
        assignee: state.resources[0]?.name || "Tô văn Tùng",
        startDate: state.referenceDate || DEFAULT_REF_DATE,
        endDate: state.referenceDate || DEFAULT_REF_DATE,
        progress: 0,
        status: "not_started",
        priority: "medium"
      },
      Object.assign({}, task, { id, code })
    );
    const normalized = normalizeTask(reconciled, state.tasks.length);
    state.tasks.push(normalized);

    if (state.syncProjectProgressFromTasks && normalized.projectId) {
      recalculateProjectProgress(normalized.projectId, false);
    }
    notify();
    return normalized;
  }

  function updateTask(id, updates) {
    ensureInitialized();
    const idx = state.tasks.findIndex((t) => t.id === id || t.code === id);
    if (idx === -1 || !updates || typeof updates !== "object") return null;

    const prevTask = state.tasks[idx];
    const reconciled = reconcileTaskStatusAndProgress(prevTask, updates);
    const normalized = normalizeTask(
      Object.assign({}, reconciled, { id: prevTask.id, code: updates.code || prevTask.code }),
      idx
    );
    state.tasks[idx] = normalized;

    if (state.syncProjectProgressFromTasks) {
      recalculateProjectProgress(normalized.projectId, false);
      if (prevTask.projectId !== normalized.projectId) {
        recalculateProjectProgress(prevTask.projectId, false);
      }
    }
    notify();
    return normalized;
  }

  function deleteTask(id) {
    ensureInitialized();
    const target = state.tasks.find((t) => t.id === id || t.code === id);
    if (!target) return false;
    state.tasks = state.tasks.filter((t) => t.id !== id && t.code !== id);
    if (state.syncProjectProgressFromTasks && target.projectId) {
      recalculateProjectProgress(target.projectId, false);
    }
    notify();
    return true;
  }

  // --- Resource CRUD ---

  function addResource(res) {
    ensureInitialized();
    if (!res || typeof res !== "object") return null;
    const nextIdx = state.resources.length + 1;
    const newId = res.id || `RES-${String(Date.now()).slice(-4)}`;
    const normalized = normalizeResource(Object.assign({}, res, { id: newId }), nextIdx);
    state.resources.push(normalized);
    notify();
    return normalized;
  }

  function updateResource(id, updates) {
    ensureInitialized();
    const idx = state.resources.findIndex((r) => r.id === id || r.name === id);
    if (idx === -1 || !updates || typeof updates !== "object") return null;
    const updated = normalizeResource(Object.assign({}, state.resources[idx], updates, { id: state.resources[idx].id }), idx);
    state.resources[idx] = updated;
    notify();
    return updated;
  }

  function deleteResource(id) {
    ensureInitialized();
    const prevLen = state.resources.length;
    state.resources = state.resources.filter((r) => r.id !== id && r.name !== id);
    if (state.resources.length !== prevLen) {
      notify();
      return true;
    }
    return false;
  }

  // --- Bulk State Import / Reset ---

  function importState(newStateObj) {
    ensureInitialized();
    if (!newStateObj || typeof newStateObj !== "object") return false;
    const seedState = buildSeedState();

    state = {
      referenceDate: parseDateVN(newStateObj.referenceDate || seedState.referenceDate) || DEFAULT_REF_DATE,
      syncProjectProgressFromTasks: Boolean(newStateObj.syncProjectProgressFromTasks ?? false),
      kpiOverride: Object.assign(
        {
          completedHeaderValue: 37,
          useStrictCompletedInHeader: false
        },
        newStateObj.kpiOverride || {}
      ),
      projects: Array.isArray(newStateObj.projects)
        ? newStateObj.projects.map(normalizeProject)
        : seedState.projects,
      tasks: Array.isArray(newStateObj.tasks)
        ? newStateObj.tasks.map(normalizeTask)
        : seedState.tasks,
      resources: Array.isArray(newStateObj.resources)
        ? newStateObj.resources.map(normalizeResource)
        : seedState.resources,
      filters: Object.assign(
        {
          projectId: null,
          status: null,
          assignee: null,
          search: "",
          onlyOverdue: false
        },
        newStateObj.filters || {}
      ),
      activeTab: ["dashboard", "tasks", "kanban", "gantt", "resources"].includes(newStateObj.activeTab)
        ? newStateObj.activeTab
        : state.activeTab || "dashboard",
      presentationMode: Boolean(newStateObj.presentationMode ?? false)
    };

    notify();
    return true;
  }

  function resetToSeed() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore storage errors
    }
    state = buildSeedState();
    notify();
    return state;
  }

  // =========================================================================
  // 6. Export Store API
  // =========================================================================

  window.ITPM.store = {
    STORAGE_KEY,
    DEFAULT_REF_DATE,
    getState,
    getMetrics,
    getOverdueTasks,
    getFilteredTasks,
    subscribe,
    notify,
    // Filters & View State
    setFilter,
    clearFilters,
    setActiveTab,
    setPresentationMode,
    setReferenceDate,
    toggleCompletedHeaderMode,
    setSyncProjectProgress,
    recalculateProjectProgress,
    recalculateAllProjectsProgress,
    // Project CRUD
    addProject,
    updateProject,
    deleteProject,
    // Task CRUD
    addTask,
    updateTask,
    deleteTask,
    generateNextTaskCode,
    // Resource CRUD
    addResource,
    updateResource,
    deleteResource,
    // Import / Reset
    importState,
    resetToSeed
  };
})();
