/**
 * IT Project Management Enterprise Dashboard - I/O, Persistence & Reporting
 * Namespace: window.ITPM.io
 *
 * Provides client-side file persistence & reporting capabilities:
 *   1. exportJSON()            - Export full state to IT_Project_Dashboard_${referenceDate}.json
 *   2. importJSON(fileOrEvent) - Validate & restore state from a .json file
 *   3. exportCSV()             - Export all tasks to UTF-8 BOM Excel CSV (Bao_Cao_Du_An_IT_${referenceDate}.csv)
 *   4. exportOverdueCSV()      - Export overdue tasks to UTF-8 BOM Excel CSV (Cong_Viec_Qua_Han_${referenceDate}.csv)
 *   5. printDashboard()        - Switch to dashboard view and trigger landscape PDF/Print report
 *   6. togglePresentationMode()- Toggle TV/Meeting presentation mode & browser Fullscreen
 */
(function () {
  "use strict";

  window.ITPM = window.ITPM || {};

  const STATUS_LABELS_VN = {
    completed: "Đã hoàn thành",
    in_progress: "Đang thực hiện",
    not_started: "Chưa bắt đầu"
  };

  const PRIORITY_LABELS_VN = {
    critical: "Khẩn cấp",
    high: "Cao",
    medium: "Trung bình",
    low: "Thấp"
  };

  // =========================================================================
  // Internal Helpers
  // =========================================================================

  /**
   * Safely invokes window.ITPM.modals.showToast if available,
   * with a clean fallback notification if modals module is not yet initialized.
   */
  function notifyToast(message, type = "success") {
    if (window.ITPM.modals && typeof window.ITPM.modals.showToast === "function") {
      window.ITPM.modals.showToast(message, type);
      return;
    }
    console.info(`[ITPM.io] (${type.toUpperCase()}) ${message}`);
  }

  /**
   * Returns the current reference date from the store in YYYY-MM-DD format.
   */
  function getRefDate() {
    const store = window.ITPM.store;
    if (store && typeof store.getState === "function") {
      const st = store.getState();
      if (st && st.referenceDate) {
        return String(st.referenceDate).trim().slice(0, 10);
      }
    }
    return "2025-10-08";
  }

  /**
   * Formats an ISO date string ("YYYY-MM-DD") to Vietnamese format ("DD/MM/YYYY").
   */
  function formatDateVN(isoDate) {
    if (window.ITPM.utils && typeof window.ITPM.utils.formatDateVN === "function") {
      return window.ITPM.utils.formatDateVN(isoDate);
    }
    if (!isoDate || typeof isoDate !== "string") return "";
    const parts = isoDate.trim().slice(0, 10).split("-");
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  /**
   * Calculates overdue days between endDate and refDate.
   */
  function calcOverdueDays(endDate, refDate) {
    if (window.ITPM.utils && typeof window.ITPM.utils.calcOverdueDays === "function") {
      return window.ITPM.utils.calcOverdueDays(endDate, refDate);
    }
    if (!endDate || !refDate) return 0;
    const endMs = Date.parse(endDate);
    const refMs = Date.parse(refDate);
    if (isNaN(endMs) || isNaN(refMs)) return 0;
    return Math.round((refMs - endMs) / 86400000);
  }

  /**
   * Escapes a cell value for RFC 4180 CSV compatibility.
   */
  function escapeCSVCell(val) {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Builds a CSV string with UTF-8 BOM (\uFEFF) from headers and rows.
   */
  function buildCSVContent(headers, rows) {
    const headerLine = headers.map(escapeCSVCell).join(",");
    const bodyLines = rows.map((row) => row.map(escapeCSVCell).join(","));
    return "\uFEFF" + [headerLine, ...bodyLines].join("\r\n");
  }

  /**
   * Triggers a client-side file download from a Blob or content string.
   */
  function triggerBrowserDownload(content, filename, mimeType) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      }
      URL.revokeObjectURL(url);
    }, 250);
  }

  // =========================================================================
  // 1. Export State to JSON
  // =========================================================================

  /**
   * Serializes the current state (projects, tasks, resources, referenceDate, kpiOverride)
   * to a formatted .json file (IT_Project_Dashboard_${referenceDate}.json) and triggers a download.
   */
  function exportJSON() {
    const store = window.ITPM.store;
    if (!store || typeof store.getState !== "function") {
      notifyToast("Không thể xuất dữ liệu: Store chưa sẵn sàng.", "error");
      return false;
    }

    try {
      const state = store.getState();
      const refDate = getRefDate();

      const payload = {
        meta: {
          app: "BÁO CÁO THEO DÕI DỰ ÁN IT - ENTERPRISE DASHBOARD",
          version: "1.0.0",
          exportedAt: new Date().toISOString(),
          referenceDate: refDate
        },
        referenceDate: state.referenceDate || refDate,
        syncProjectProgressFromTasks: Boolean(state.syncProjectProgressFromTasks),
        kpiOverride: state.kpiOverride || {
          completedHeaderValue: 37,
          useStrictCompletedInHeader: false
        },
        projects: Array.isArray(state.projects) ? state.projects : [],
        tasks: Array.isArray(state.tasks) ? state.tasks : [],
        resources: Array.isArray(state.resources) ? state.resources : []
      };

      const jsonString = JSON.stringify(payload, null, 2);
      const filename = `IT_Project_Dashboard_${refDate}.json`;

      triggerBrowserDownload(jsonString, filename, "application/json;charset=utf-8");
      notifyToast(`Đã xuất file dữ liệu: ${filename}`, "success");
      return true;
    } catch (err) {
      console.error("[ITPM.io] exportJSON failed:", err);
      notifyToast("Lỗi khi xuất dữ liệu JSON.", "error");
      return false;
    }
  }

  // =========================================================================
  // 2. Import State from JSON
  // =========================================================================

  /**
   * Reads an uploaded .json file via FileReader, validates that it has `projects` and `tasks`,
   * calls window.ITPM.store.importState(data), and displays a toast via window.ITPM.modals.showToast(...).
   *
   * Accepts:
   *   - A `File` instance directly
   *   - An `<input type="file">` change `Event`
   *   - Nothing (opens a temporary file picker dialog automatically)
   */
  function importJSON(fileOrEvent) {
    // Support passing an input change event or FileList
    let file = null;

    if (!fileOrEvent) {
      openFilePickerForImport();
      return;
    }

    if (fileOrEvent instanceof File) {
      file = fileOrEvent;
    } else if (fileOrEvent.target && fileOrEvent.target.files && fileOrEvent.target.files[0]) {
      file = fileOrEvent.target.files[0];
    } else if (fileOrEvent.files && fileOrEvent.files[0]) {
      file = fileOrEvent.files[0];
    }

    if (!file) {
      notifyToast("Không tìm thấy file JSON để nhập.", "warning");
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const rawText = e.target && e.target.result ? String(e.target.result) : "";
        if (!rawText.trim()) {
          throw new Error("File JSON trống.");
        }

        const data = JSON.parse(rawText);
        if (!data || typeof data !== "object") {
          throw new Error("Cấu trúc JSON không hợp lệ.");
        }

        if (!Array.isArray(data.projects) || !Array.isArray(data.tasks)) {
          notifyToast(
            "File JSON không hợp lệ: Cần có danh sách 'projects' và 'tasks'.",
            "error"
          );
          return;
        }

        const store = window.ITPM.store;
        if (!store || typeof store.importState !== "function") {
          throw new Error("Store chưa hỗ trợ importState.");
        }

        const ok = store.importState(data);
        if (ok) {
          notifyToast(
            `Đã nhập thành công ${data.projects.length} dự án và ${data.tasks.length} công việc!`,
            "success"
          );
        } else {
          notifyToast("Không thể nhập dữ liệu từ file JSON đã chọn.", "error");
        }
      } catch (err) {
        console.error("[ITPM.io] importJSON parse/validation error:", err);
        notifyToast(
          `Lỗi đọc file JSON: ${err && err.message ? err.message : "Định dạng không hợp lệ"}`,
          "error"
        );
      } finally {
        // Reset input value if called from an <input type="file"> event so re-uploading the same file triggers change
        if (fileOrEvent && fileOrEvent.target && "value" in fileOrEvent.target) {
          fileOrEvent.target.value = "";
        }
      }
    };

    reader.onerror = function () {
      console.error("[ITPM.io] FileReader error:", reader.error);
      notifyToast("Lỗi khi đọc file từ thiết bị.", "error");
    };

    reader.readAsText(file, "utf-8");
  }

  /**
   * Helper to open a native file picker when importJSON() is invoked directly from a button click.
   */
  function openFilePickerForImport() {
    let input = document.getElementById("itpm-hidden-json-input");
    if (!input) {
      input = document.createElement("input");
      input.type = "file";
      input.id = "itpm-hidden-json-input";
      input.accept = ".json,application/json";
      input.style.display = "none";
      input.addEventListener("change", function (evt) {
        if (evt.target && evt.target.files && evt.target.files[0]) {
          importJSON(evt.target.files[0]);
        }
        evt.target.value = "";
      });
      document.body.appendChild(input);
    }
    input.click();
  }

  // =========================================================================
  // 3. Export All Tasks to Excel-Compatible UTF-8 BOM CSV
  // =========================================================================

  /**
   * Exports all tasks (with project name, task code, title, assignee, start date,
   * end date, progress %, status in Vietnamese, overdue days) to an Excel-compatible
   * UTF-8 with BOM .csv file (`Bao_Cao_Du_An_IT_${referenceDate}.csv`).
   */
  function exportCSV() {
    const store = window.ITPM.store;
    if (!store || typeof store.getState !== "function") {
      notifyToast("Không thể xuất CSV: Store chưa sẵn sàng.", "error");
      return false;
    }

    try {
      const state = store.getState();
      const refDate = getRefDate();
      const projects = Array.isArray(state.projects) ? state.projects : [];
      const tasks = Array.isArray(state.tasks) ? state.tasks : [];

      const projectMap = new Map(projects.map((p) => [p.id, p]));

      const headers = [
        "STT",
        "Mã Dự Án",
        "Tên Dự Án",
        "Mã Công Việc",
        "Tên Công Việc",
        "Người Thực Hiện",
        "Ngày Bắt Đầu",
        "Ngày Kết Thúc (Deadline)",
        "Tiến Độ (%)",
        "Trạng Thái",
        "Mức Độ Ưu Tiên",
        "Tình Trạng Hạn",
        "Số Ngày Quá Hạn",
        "Ghi Chú"
      ];

      const rows = tasks.map((task, idx) => {
        const proj = projectMap.get(task.projectId);
        const projectName = proj ? proj.name : task.projectId || "";
        const progress = Number(task.progress) || 0;
        const statusVN = STATUS_LABELS_VN[task.status] || "Chưa bắt đầu";
        const priorityVN = PRIORITY_LABELS_VN[task.priority] || "Cao";

        const isCompleted = task.status === "completed" || progress >= 100;
        const rawOverdue = !isCompleted && task.endDate && task.endDate < refDate
          ? Math.max(0, calcOverdueDays(task.endDate, refDate))
          : 0;

        const deadlineStatus = isCompleted
          ? "Hoàn thành"
          : rawOverdue > 0
          ? "Quá hạn"
          : "Trong hạn";

        return [
          idx + 1,
          task.projectId || "",
          projectName,
          task.code || task.id || "",
          task.title || "",
          task.assignee || "",
          formatDateVN(task.startDate),
          formatDateVN(task.endDate),
          `${progress}%`,
          statusVN,
          priorityVN,
          deadlineStatus,
          rawOverdue,
          task.notes || ""
        ];
      });

      const csvContent = buildCSVContent(headers, rows);
      const filename = `Bao_Cao_Du_An_IT_${refDate}.csv`;

      triggerBrowserDownload(csvContent, filename, "text/csv;charset=utf-8");
      notifyToast(`Đã xuất báo cáo Excel/CSV (${tasks.length} công việc): ${filename}`, "success");
      return true;
    } catch (err) {
      console.error("[ITPM.io] exportCSV failed:", err);
      notifyToast("Lỗi khi xuất báo cáo CSV.", "error");
      return false;
    }
  }

  // =========================================================================
  // 4. Export Overdue Tasks to Excel-Compatible UTF-8 BOM CSV
  // =========================================================================

  /**
   * Exports specifically the overdue tasks (`CÔNG VIỆC QUÁ HẠN`) to an
   * Excel-compatible UTF-8 BOM .csv file (`Cong_Viec_Qua_Han_${referenceDate}.csv`).
   */
  function exportOverdueCSV() {
    const store = window.ITPM.store;
    if (!store || typeof store.getOverdueTasks !== "function") {
      notifyToast("Không thể xuất danh sách quá hạn: Store chưa sẵn sàng.", "error");
      return false;
    }

    try {
      const refDate = getRefDate();
      const overdueTasks = store.getOverdueTasks();

      const headers = [
        "STT",
        "Mã Công Việc",
        "Tên Công Việc",
        "Dự Án",
        "Người Thực Hiện",
        "Ngày Bắt Đầu",
        "Ngày Kết Thúc (Deadline)",
        "Tiến Độ (%)",
        "Trạng Thái",
        "Số Ngày Quá Hạn",
        "Ngày Tham Chiếu Báo Cáo"
      ];

      const rows = overdueTasks.map((task, idx) => {
        const progress = Number(task.progress) || 0;
        const statusVN = STATUS_LABELS_VN[task.status] || "Đang thực hiện";
        return [
          idx + 1,
          task.code || task.id || "",
          task.title || "",
          task.projectName || task.projectId || "",
          task.assignee || "",
          task.startDateVN || formatDateVN(task.startDate),
          task.endDateVN || formatDateVN(task.endDate),
          `${progress}%`,
          statusVN,
          task.overdueDays ?? Math.max(0, calcOverdueDays(task.endDate, refDate)),
          formatDateVN(refDate)
        ];
      });

      const csvContent = buildCSVContent(headers, rows);
      const filename = `Cong_Viec_Qua_Han_${refDate}.csv`;

      triggerBrowserDownload(csvContent, filename, "text/csv;charset=utf-8");
      notifyToast(
        `Đã xuất danh sách ${overdueTasks.length} công việc quá hạn: ${filename}`,
        "success"
      );
      return true;
    } catch (err) {
      console.error("[ITPM.io] exportOverdueCSV failed:", err);
      notifyToast("Lỗi khi xuất CSV công việc quá hạn.", "error");
      return false;
    }
  }

  // =========================================================================
  // 5. Print / Save Landscape PDF Report
  // =========================================================================

  /**
   * Triggers window.print() after ensuring the dashboard tab is active
   * so the user can save a clean landscape PDF report.
   */
  function printDashboard() {
    const store = window.ITPM.store;
    let switchedTab = false;

    if (store && typeof store.getState === "function" && typeof store.setActiveTab === "function") {
      const state = store.getState();
      if (state && state.activeTab !== "dashboard") {
        store.setActiveTab("dashboard");
        switchedTab = true;
      }
    }

    // Trigger chart resize if charts module exists so canvases render sharply for print
    if (window.ITPM.charts && typeof window.ITPM.charts.resizeAll === "function") {
      try {
        window.ITPM.charts.resizeAll();
      } catch (e) {
        // ignore chart resize errors
      }
    }

    const delayMs = switchedTab ? 220 : 60;
    setTimeout(() => {
      window.print();
    }, delayMs);
  }

  // =========================================================================
  // 6. Presentation / TV Mode Toggle
  // =========================================================================

  /**
   * Synchronizes the DOM body class with state.presentationMode.
   */
  function syncPresentationDOM(isActive) {
    if (!document || !document.body) return;
    document.body.classList.toggle("presentation-mode", Boolean(isActive));
    document.documentElement.classList.toggle("presentation-mode", Boolean(isActive));
  }

  /**
   * Toggles state.presentationMode and browser full-screen mode (if supported)
   * so the user can display the exact dashboard on a meeting room TV / monitor
   * without any management chrome.
   *
   * @param {boolean} [forceState] Optional explicit boolean state to set.
   */
  function togglePresentationMode(forceState) {
    const store = window.ITPM.store;
    if (!store || typeof store.getState !== "function") {
      return false;
    }

    const currentState = store.getState();
    const nextMode =
      typeof forceState === "boolean" ? forceState : !Boolean(currentState.presentationMode);

    if (nextMode && currentState.activeTab !== "dashboard" && typeof store.setActiveTab === "function") {
      store.setActiveTab("dashboard");
    }

    if (typeof store.setPresentationMode === "function") {
      store.setPresentationMode(nextMode);
    }

    syncPresentationDOM(nextMode);

    // Manage browser Fullscreen API if available and triggered by user gesture
    try {
      if (nextMode) {
        const docEl = document.documentElement;
        if (!document.fullscreenElement && docEl && typeof docEl.requestFullscreen === "function") {
          docEl.requestFullscreen().catch(() => {
            // Fullscreen might be blocked in headless/iframe environments; class-based TV mode still works
          });
        }
        notifyToast("Đã bật Chế độ Trình chiếu TV (Nhấn ESC để thoát)", "info");
      } else {
        if (document.fullscreenElement && typeof document.exitFullscreen === "function") {
          document.exitFullscreen().catch(() => {});
        }
        notifyToast("Đã thoát Chế độ Trình chiếu TV", "info");
      }
    } catch (e) {
      // Ignore Fullscreen API exceptions
    }

    return nextMode;
  }

  // Keep state.presentationMode synchronized if the user exits fullscreen via browser ESC key
  if (typeof document !== "undefined") {
    document.addEventListener("fullscreenchange", () => {
      const store = window.ITPM.store;
      if (!document.fullscreenElement && store && typeof store.getState === "function") {
        const st = store.getState();
        if (st && st.presentationMode && typeof store.setPresentationMode === "function") {
          store.setPresentationMode(false);
          syncPresentationDOM(false);
        }
      }
    });

    document.addEventListener("keydown", (evt) => {
      if (evt.key === "Escape") {
        const store = window.ITPM.store;
        if (store && typeof store.getState === "function") {
          const st = store.getState();
          if (st && st.presentationMode) {
            togglePresentationMode(false);
          }
        }
      }
    });
  }

  // =========================================================================
  // Expose Public API (window.ITPM.io)
  // =========================================================================

  window.ITPM.io = {
    exportJSON,
    importJSON,
    openFilePickerForImport,
    exportCSV,
    exportOverdueCSV,
    printDashboard,
    togglePresentationMode
  };
})();
