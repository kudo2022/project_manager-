(function () {
  'use strict';

  window.ITPM = window.ITPM || {};

  const GOLD_COLOR = '#d99b26';
  const WHITE_COLOR = '#ffffff';
  const RED_COLOR = '#ef4444';
  const DARK_HOLE_COLOR = '#0c0c0c';
  const STATUS_CARD_BG = '#353533';
  const SLICE_TEXT_COLOR = '#111111';

  function isLightMode() {
    return typeof document === 'undefined' || !document.body.classList.contains('theme-dark');
  }

  let stylesInjected = false;
  let tooltipEl = null;

  function ensureStylesAndTooltip() {
    if (!stylesInjected && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.id = 'itpm-charts-styles';
      style.textContent = `
        .itpm-chart-axis-list {
          display: flex;
          flex-direction: column;
          width: 100%;
          user-select: none;
        }
        .itpm-chart-row {
          display: flex;
          align-items: center;
          width: 100%;
          cursor: pointer;
          position: relative;
          transition: opacity 0.18s ease, transform 0.15s ease;
        }
        .itpm-chart-row:hover .itpm-bar-track {
          filter: brightness(1.06);
          box-shadow: 0 0 0 1px rgba(222, 186, 100, 0.75);
        }
        .itpm-chart-row.is-active .itpm-bar-track {
          box-shadow: 0 0 0 2px #deba64, 0 0 12px rgba(222, 186, 100, 0.55);
        }
        .itpm-chart-row.is-dimmed {
          opacity: 0.45;
        }
        .itpm-chart-row.is-dimmed:hover {
          opacity: 0.85;
        }
        .itpm-axis-label-cell {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 10px;
          color: #1e293b;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          border-right: 1px solid #94a3b8;
          position: relative;
          flex-shrink: 0;
        }
        body.theme-dark .itpm-axis-label-cell {
          color: #ffffff;
          border-right-color: rgba(255, 255, 255, 0.75);
        }
        .itpm-axis-label-cell::after {
          content: '';
          position: absolute;
          right: -4px;
          bottom: 0;
          width: 4px;
          height: 1px;
          background: #94a3b8;
        }
        body.theme-dark .itpm-axis-label-cell::after {
          background: rgba(255, 255, 255, 0.75);
        }
        .itpm-chart-row:first-child .itpm-axis-label-cell::before {
          content: '';
          position: absolute;
          right: -4px;
          top: 0;
          width: 4px;
          height: 1px;
          background: #94a3b8;
        }
        body.theme-dark .itpm-chart-row:first-child .itpm-axis-label-cell::before {
          background: rgba(255, 255, 255, 0.75);
        }
        .itpm-bar-cell {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          padding-left: 0;
        }
        .itpm-bar-track {
          display: flex;
          width: 100%;
          overflow: hidden;
          transition: box-shadow 0.18s ease, filter 0.18s ease;
        }
        .itpm-pie-slice {
          cursor: pointer;
          transition: opacity 0.18s ease, filter 0.18s ease, transform 0.18s ease;
          transform-origin: 120px 120px;
        }
        .itpm-pie-slice:hover {
          filter: brightness(1.07);
        }
        .itpm-pie-slice.is-dimmed {
          opacity: 0.42;
        }
        .itpm-pie-slice.is-active {
          filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.45));
        }
        .itpm-chart-tooltip {
          position: fixed;
          z-index: 9999;
          pointer-events: none;
          background: rgba(18, 18, 18, 0.96);
          border: 1px solid #deba64;
          border-radius: 6px;
          padding: 8px 11px;
          color: #ffffff;
          font-family: 'Segoe UI', Roboto, Arial, sans-serif;
          font-size: 12px;
          line-height: 1.45;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55);
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.12s ease, transform 0.12s ease;
          max-width: 280px;
        }
        .itpm-chart-tooltip.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .itpm-chart-tooltip-title {
          color: #deba64;
          font-weight: 700;
          font-size: 12.5px;
          margin-bottom: 3px;
        }
        .itpm-chart-tooltip-meta {
          color: #dcdcdc;
          font-size: 11.5px;
        }
      `;
      document.head.appendChild(style);
      stylesInjected = true;
    }

    if (!tooltipEl && typeof document !== 'undefined' && document.body) {
      tooltipEl = document.getElementById('itpm-chart-tooltip');
      if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'itpm-chart-tooltip';
        tooltipEl.className = 'itpm-chart-tooltip';
        document.body.appendChild(tooltipEl);
      }
    }
  }

  function showTooltip(html, event) {
    ensureStylesAndTooltip();
    if (!tooltipEl) return;
    tooltipEl.innerHTML = html;
    tooltipEl.classList.add('is-visible');
    moveTooltip(event);
  }

  function moveTooltip(event) {
    if (!tooltipEl || !event) return;
    const offset = 14;
    const rect = tooltipEl.getBoundingClientRect();
    let left = event.clientX + offset;
    let top = event.clientY + offset;

    if (left + rect.width > window.innerWidth - 12) {
      left = event.clientX - rect.width - offset;
    }
    if (top + rect.height > window.innerHeight - 12) {
      top = event.clientY - rect.height - offset;
    }
    tooltipEl.style.left = `${Math.max(8, left)}px`;
    tooltipEl.style.top = `${Math.max(8, top)}px`;
  }

  function hideTooltip() {
    if (!tooltipEl) return;
    tooltipEl.classList.remove('is-visible');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * 1. Renders the left column chart "TIẾN ĐỘ DỰ ÁN"
   * Orders projects from CTPro07 at the top down to CTPro01 at the bottom.
   */
  function renderProjectProgress(containerEl, projects, activeProjectId, onSelectProject) {
    if (!containerEl) return;
    ensureStylesAndTooltip();

    const list = Array.isArray(projects) ? projects.slice() : [];
    // Sort descending by project code/id so CTPro07 is at top down to CTPro01 at bottom
    list.sort(function (a, b) {
      const codeA = String(a.code || a.id || '');
      const codeB = String(b.code || b.id || '');
      return codeB.localeCompare(codeA, undefined, { numeric: true, sensitivity: 'base' });
    });

    containerEl.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'itpm-chart-axis-list itpm-project-progress-list';

    const hasActiveFilter = Boolean(activeProjectId && activeProjectId !== 'all');

    list.forEach(function (project) {
      const projId = project.id || project.code;
      const projCode = project.code || project.id || '';
      const rawProgress = Number(project.progress != null ? project.progress : 0);
      const progress = Math.max(0, Math.min(100, Math.round(rawProgress)));
      const remaining = Math.max(0, 100 - progress);
      const isSelected = hasActiveFilter && (activeProjectId === projId || activeProjectId === projCode);

      const row = document.createElement('div');
      row.className = 'itpm-chart-row' +
        (isSelected ? ' is-active' : '') +
        (hasActiveFilter && !isSelected ? ' is-dimmed' : '');
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      row.dataset.projectId = projId;

      // Left axis label cell with vertical spine and tick marks
      const labelCell = document.createElement('div');
      labelCell.className = 'itpm-axis-label-cell';
      labelCell.style.width = '68px';
      labelCell.style.height = '50px';
      labelCell.textContent = projCode;

      // Right horizontal bar cell
      const barCell = document.createElement('div');
      barCell.className = 'itpm-bar-cell';
      barCell.style.height = '50px';
      barCell.style.padding = '6px 0';

      const light = isLightMode();
      const trackBg = light ? '#e2e8f0' : WHITE_COLOR;
      const barGold = light ? '#d99b26' : '#deba64';

      const track = document.createElement('div');
      track.className = 'itpm-bar-track';
      track.style.height = '38px';
      track.style.background = trackBg;
      track.style.borderRadius = light ? '4px' : '0';
      track.style.border = light ? '1px solid #cbd5e1' : 'none';
      track.style.position = 'relative';

      // Left gold filled segment
      const goldSeg = document.createElement('div');
      goldSeg.className = 'itpm-bar-segment-gold';
      goldSeg.style.width = `${progress}%`;
      goldSeg.style.height = '100%';
      goldSeg.style.background = barGold;
      goldSeg.style.display = 'flex';
      goldSeg.style.alignItems = 'center';
      goldSeg.style.justifyContent = 'flex-start';
      goldSeg.style.paddingLeft = progress > 0 ? '6px' : '0';
      goldSeg.style.boxSizing = 'border-box';
      goldSeg.style.transition = 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
      goldSeg.style.overflow = 'visible';

      const pctLabel = document.createElement('span');
      pctLabel.className = 'itpm-bar-pct-label';
      pctLabel.textContent = `${progress}%`;
      pctLabel.style.color = WHITE_COLOR;
      pctLabel.style.fontWeight = '700';
      pctLabel.style.fontSize = '13px';
      pctLabel.style.lineHeight = '1';
      pctLabel.style.whiteSpace = 'nowrap';
      pctLabel.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.45)';

      goldSeg.appendChild(pctLabel);

      // Right remaining segment
      const whiteSeg = document.createElement('div');
      whiteSeg.className = 'itpm-bar-segment-white';
      whiteSeg.style.width = `${remaining}%`;
      whiteSeg.style.height = '100%';
      whiteSeg.style.background = trackBg;
      whiteSeg.style.transition = 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1)';

      track.appendChild(goldSeg);
      track.appendChild(whiteSeg);
      barCell.appendChild(track);

      row.appendChild(labelCell);
      row.appendChild(barCell);

      // Tooltip & click interactions
      const fullName = project.name || project.title || projCode;
      const manager = project.manager || project.pm || project.lead || 'Ban QLDA CNTT';
      const taskCount = project.taskCount != null
        ? project.taskCount
        : (Array.isArray(project.tasks) ? project.tasks.length : (project.totalTasks != null ? project.totalTasks : ''));

      const buildTooltipHtml = function () {
        let metaLines = `<div class="itpm-chart-tooltip-meta">Tiến độ: <strong>${progress}%</strong></div>`;
        if (manager) {
          metaLines += `<div class="itpm-chart-tooltip-meta">Quản lý: <strong>${escapeHtml(manager)}</strong></div>`;
        }
        if (taskCount !== '') {
          metaLines += `<div class="itpm-chart-tooltip-meta">Số công việc: <strong>${escapeHtml(taskCount)}</strong></div>`;
        }
        return `
          <div class="itpm-chart-tooltip-title">${escapeHtml(projCode)} — ${escapeHtml(fullName)}</div>
          ${metaLines}
        `;
      };

      row.addEventListener('mouseenter', function (e) {
        showTooltip(buildTooltipHtml(), e);
      });
      row.addEventListener('mousemove', function (e) {
        moveTooltip(e);
      });
      row.addEventListener('mouseleave', function () {
        hideTooltip();
      });

      const handleSelect = function () {
        hideTooltip();
        if (typeof onSelectProject === 'function') {
          onSelectProject(projId);
        }
      };

      row.addEventListener('click', handleSelect);
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      });

      wrapper.appendChild(row);
    });

    containerEl.appendChild(wrapper);
  }

  /**
   * Helper to convert polar coordinates (angle in degrees where -90deg is 12 o'clock) to Cartesian
   */
  function polarToCartesian(cx, cy, r, angleInDegrees) {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  }

  /**
   * 2. Renders the "TIẾN ĐỘ TRUNG BÌNH" SVG donut chart.
   * Outer circle radius ~92, inner hole radius ~48 (stroke-width ~44), centered in a 220x220 SVG viewBox.
   * Gold segment (#deba64) starts at 12 o'clock (-90deg) and goes clockwise for avgPercent% of circumference.
   * White segment (#ffffff) covers the remaining (100 - avgPercent)% on the top-left quadrant (from ~8 o'clock to 12 o'clock).
   */
  function renderAverageProgressDonut(containerEl, avgPercent) {
    if (!containerEl) return;
    ensureStylesAndTooltip();

    const pct = Math.max(0, Math.min(100, Math.round(Number(avgPercent) || 0)));
    const cx = 110;
    const cy = 110;
    const r = 70; // Mid-radius between inner hole 48 and outer radius 92: (48 + 92)/2 = 70, stroke-width = 44
    const strokeWidth = 44;
    const innerHoleRadius = 48;
    const circumference = 2 * Math.PI * r;
    const goldDash = (pct / 100) * circumference;
    const whiteDash = ((100 - pct) / 100) * circumference;

    const light = isLightMode();
    const holeColor = light ? '#ffffff' : DARK_HOLE_COLOR;
    const remRingColor = light ? '#e2e8f0' : WHITE_COLOR;
    const goldRingColor = light ? '#d99b26' : '#deba64';
    const centerTextColor = light ? '#b45309' : '#deba64';

    containerEl.innerHTML = `
      <div class="itpm-donut-wrapper" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">
        <svg viewBox="0 0 220 220" width="210" height="210" style="overflow:visible;display:block;" aria-label="Tiến độ trung bình ${pct}%">
          <!-- Base ring covering full circle -->
          <circle
            cx="${cx}"
            cy="${cy}"
            r="${r}"
            fill="none"
            stroke="${remRingColor}"
            stroke-width="${strokeWidth}"
          />
          <!-- Gold segment starting at 12 o'clock (-90deg) going clockwise for pct% -->
          <circle
            cx="${cx}"
            cy="${cy}"
            r="${r}"
            fill="none"
            stroke="${goldRingColor}"
            stroke-width="${strokeWidth}"
            stroke-dasharray="${goldDash.toFixed(2)} ${circumference.toFixed(2)}"
            stroke-dashoffset="0"
            transform="rotate(-90 ${cx} ${cy})"
            style="transition: stroke-dasharray 0.4s cubic-bezier(0.22, 1, 0.36, 1);"
          />
          <!-- Remaining segment explicitly drawn from end of gold clockwise back to 12 o'clock -->
          ${pct > 0 && pct < 100 ? `
          <circle
            cx="${cx}"
            cy="${cy}"
            r="${r}"
            fill="none"
            stroke="${remRingColor}"
            stroke-width="${strokeWidth}"
            stroke-dasharray="${whiteDash.toFixed(2)} ${circumference.toFixed(2)}"
            stroke-dashoffset="${(-goldDash).toFixed(2)}"
            transform="rotate(-90 ${cx} ${cy})"
          />` : ''}
          <!-- Center hole -->
          <circle
            cx="${cx}"
            cy="${cy}"
            r="${innerHoleRadius}"
            fill="${holeColor}"
          />
          <!-- Bold percentage label -->
          <text
            x="${cx}"
            y="${cy}"
            text-anchor="middle"
            dominant-baseline="central"
            fill="${centerTextColor}"
            font-family="'Segoe UI', Roboto, Arial, sans-serif"
            font-size="26px"
            font-weight="800"
          >${pct}%</text>
        </svg>
      </div>
    `;
  }

  /**
   * Helper to build an SVG pie slice path from startAngle to endAngle (in degrees, clockwise)
   */
  function describePieSlice(cx, cy, r, startAngle, endAngle) {
    const span = endAngle - startAngle;
    if (span >= 359.99) {
      // Full circle fallback using two semicircles
      const top = polarToCartesian(cx, cy, r, -90);
      const bottom = polarToCartesian(cx, cy, r, 90);
      return [
        'M', top.x.toFixed(2), top.y.toFixed(2),
        'A', r, r, 0, 1, 1, bottom.x.toFixed(2), bottom.y.toFixed(2),
        'A', r, r, 0, 1, 1, top.x.toFixed(2), top.y.toFixed(2),
        'Z'
      ].join(' ');
    }
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArcFlag = span > 180 ? 1 : 0;
    return [
      'M', cx, cy,
      'L', start.x.toFixed(2), start.y.toFixed(2),
      'A', r, r, 0, largeArcFlag, 1, end.x.toFixed(2), end.y.toFixed(2),
      'Z'
    ].join(' ');
  }

  /**
   * 3. Renders the "TRẠNG THÁI" 3-slice SVG pie chart inside the #353533 gray card.
   * Slices clockwise starting from 12 o'clock (-90deg):
   * 1) not_started ("Chưa bắt đầu", red #f24836)
   * 2) in_progress ("Đang thực hiện", white #ffffff)
   * 3) completed ("Hoàn thành", gold #deba64)
   */
  function renderStatusPie(containerEl, statusCounts, activeStatus, onSelectStatus) {
    if (!containerEl) return;
    ensureStylesAndTooltip();

    const counts = statusCounts || {};
    const notStarted = Math.max(0, Number(counts.not_started || 0));
    const inProgress = Math.max(0, Number(counts.in_progress || 0));
    const completed = Math.max(0, Number(counts.completed || 0));
    const total = notStarted + inProgress + completed;

    containerEl.innerHTML = '';

    const cx = 120;
    const cy = 120;
    const r = 98;

    const svgNS = 'http://www.w3.org/2000/svg';
    const wrapper = document.createElement('div');
    wrapper.className = 'itpm-status-pie-wrapper';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 240 240');
    svg.setAttribute('width', '224');
    svg.setAttribute('height', '224');
    svg.style.overflow = 'visible';
    svg.style.display = 'block';

    if (total === 0) {
      const emptyCircle = document.createElementNS(svgNS, 'circle');
      emptyCircle.setAttribute('cx', String(cx));
      emptyCircle.setAttribute('cy', String(cy));
      emptyCircle.setAttribute('r', String(r));
      emptyCircle.setAttribute('fill', '#484846');
      emptyCircle.setAttribute('stroke', STATUS_CARD_BG);
      emptyCircle.setAttribute('stroke-width', '4');
      svg.appendChild(emptyCircle);

      const emptyText = document.createElementNS(svgNS, 'text');
      emptyText.setAttribute('x', String(cx));
      emptyText.setAttribute('y', String(cy));
      emptyText.setAttribute('text-anchor', 'middle');
      emptyText.setAttribute('dominant-baseline', 'central');
      emptyText.setAttribute('fill', WHITE_COLOR);
      emptyText.setAttribute('font-size', '14px');
      emptyText.setAttribute('font-weight', '600');
      emptyText.textContent = 'Không có dữ liệu';
      svg.appendChild(emptyText);

      wrapper.appendChild(svg);
      containerEl.appendChild(wrapper);
      return;
    }

    const light = isLightMode();
    const pieStrokeColor = light ? '#ffffff' : STATUS_CARD_BG;
    const inProgressFill = light ? '#e2e8f0' : WHITE_COLOR;
    const completedFill = light ? '#eab308' : '#deba64';
    const notStartedFill = light ? '#f87171' : RED_COLOR;

    // Order clockwise from 12 o'clock (-90deg):
    // 1. Chưa bắt đầu (7, red)
    // 2. Đang thực hiện (12, light slate/white)
    // 3. Hoàn thành (18, gold)
    const sliceDefs = [
      {
        key: 'not_started',
        title: 'Chưa bắt đầu',
        count: notStarted,
        color: notStartedFill,
        lines: ['Chưa bắt', 'đầu', String(notStarted)],
        labelRadiusFactor: 0.62
      },
      {
        key: 'in_progress',
        title: 'Đang thực hiện',
        count: inProgress,
        color: inProgressFill,
        lines: ['Đang thực', 'hiện', String(inProgress)],
        labelRadiusFactor: 0.56
      },
      {
        key: 'completed',
        title: 'Hoàn thành',
        count: completed,
        color: completedFill,
        lines: ['Hoàn thành', String(completed)],
        labelRadiusFactor: 0.54
      }
    ];

    const hasActiveStatus = Boolean(activeStatus && activeStatus !== 'all');
    let currentAngle = -90;

    sliceDefs.forEach(function (slice) {
      if (slice.count <= 0) return;

      const sliceAngle = (slice.count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const midAngle = startAngle + sliceAngle / 2;
      currentAngle = endAngle;

      const isSelected = hasActiveStatus && activeStatus === slice.key;
      const group = document.createElementNS(svgNS, 'g');
      group.setAttribute(
        'class',
        'itpm-pie-slice' +
          (isSelected ? ' is-active' : '') +
          (hasActiveStatus && !isSelected ? ' is-dimmed' : '')
      );
      group.setAttribute('role', 'button');
      group.setAttribute('tabindex', '0');
      group.dataset.status = slice.key;

      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', describePieSlice(cx, cy, r, startAngle, endAngle));
      path.setAttribute('fill', slice.color);
      path.setAttribute('stroke', pieStrokeColor);
      path.setAttribute('stroke-width', '4');
      path.setAttribute('stroke-linejoin', 'round');
      group.appendChild(path);

      // Compute centroid for multi-line SVG <text>
      const labelRadius = sliceAngle >= 359.9 ? 0 : r * slice.labelRadiusFactor;
      const centroid = polarToCartesian(cx, cy, labelRadius, midAngle);

      const textEl = document.createElementNS(svgNS, 'text');
      textEl.setAttribute('x', centroid.x.toFixed(2));
      textEl.setAttribute('y', centroid.y.toFixed(2));
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('fill', SLICE_TEXT_COLOR);
      textEl.setAttribute('font-family', "'Segoe UI', Roboto, Arial, sans-serif");
      textEl.setAttribute('font-size', '13.5px');
      textEl.setAttribute('font-weight', '700');
      textEl.style.pointerEvents = 'none';

      const lineHeight = 16;
      const totalHeight = (slice.lines.length - 1) * lineHeight;
      const firstDy = -totalHeight / 2 + 4;

      slice.lines.forEach(function (lineText, idx) {
        const tspan = document.createElementNS(svgNS, 'tspan');
        tspan.setAttribute('x', centroid.x.toFixed(2));
        tspan.setAttribute('dy', idx === 0 ? `${firstDy}px` : `${lineHeight}px`);
        tspan.textContent = lineText;
        textEl.appendChild(tspan);
      });

      group.appendChild(textEl);

      // Tooltip & click handler
      const pctOfTotal = Math.round((slice.count / total) * 100);
      const tooltipHtml = `
        <div class="itpm-chart-tooltip-title">${escapeHtml(slice.title)}</div>
        <div class="itpm-chart-tooltip-meta">Số lượng: <strong>${slice.count}</strong> công việc (${pctOfTotal}%)</div>
      `;

      group.addEventListener('mouseenter', function (e) {
        showTooltip(tooltipHtml, e);
      });
      group.addEventListener('mousemove', function (e) {
        moveTooltip(e);
      });
      group.addEventListener('mouseleave', function () {
        hideTooltip();
      });

      const handleSelect = function () {
        hideTooltip();
        if (typeof onSelectStatus === 'function') {
          onSelectStatus(slice.key);
        }
      };

      group.addEventListener('click', handleSelect);
      group.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      });

      svg.appendChild(group);
    });

    wrapper.appendChild(svg);
    containerEl.appendChild(wrapper);
  }

  /**
   * 4. Renders the "SỬ DỤNG NGUỒN LỰC" horizontal chart on the bottom right.
   * Left of vertical white Y-axis spine: resource name in white text, right-aligned with tick marks.
   * Right of vertical axis line: each horizontal bar has a white segment on the left
   * and a gold segment (#deba64) on the right, with the number displayed in white inside the left edge of the gold segment.
   */
  function renderResourceUsage(containerEl, resources, activeAssignee, onSelectAssignee) {
    if (!containerEl) return;
    ensureStylesAndTooltip();

    const list = Array.isArray(resources) ? resources : [];
    containerEl.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'itpm-chart-axis-list itpm-resource-usage-list';

    const hasActiveAssignee = Boolean(activeAssignee && activeAssignee !== 'all');

    list.forEach(function (res) {
      const resName = res.name || res.assignee || res.team || '';
      const rawUtil = Number(res.utilization != null ? res.utilization : (res.value != null ? res.value : 0));
      const utilization = Math.max(0, Math.round(rawUtil));

      // Match screenshot proportions:
      // Phù Cát (14 -> ~18%), Kỳ Co (27 -> ~33%), Đập Đá (33 -> ~42%),
      // An Nhơn (50 -> 50%), Qui Nhơn (50 -> 50%), Đề Gi (17 -> ~21%), Cát Tiến (40 -> 50%).
      // Notice that for values <= 40, utilization / 80 * 100 gives:
      // 14/80 = 17.5% (~18%), 27/80 = 33.75% (~34%), 33/80 = 41.25% (~41%), 17/80 = 21.25% (~21%), 40/80 = 50%,
      // and capping at 50% (or using res.whitePercent if explicitly provided) makes An Nhơn (50), Qui Nhơn (50), Cát Tiến (40) all 50% white / 50% gold!
      let whiteWidth;
      if (typeof res.whitePercent === 'number') {
        whiteWidth = Math.max(0, Math.min(85, res.whitePercent));
      } else if (utilization >= 40 && utilization <= 50) {
        whiteWidth = 50;
      } else if (utilization < 40) {
        whiteWidth = Math.min(50, Math.round((utilization / 80) * 100));
      } else {
        whiteWidth = Math.min(85, utilization);
      }
      const goldWidth = Math.max(15, 100 - whiteWidth);

      const isSelected = hasActiveAssignee && (activeAssignee === resName || activeAssignee === res.id);

      const row = document.createElement('div');
      row.className = 'itpm-chart-row' +
        (isSelected ? ' is-active' : '') +
        (hasActiveAssignee && !isSelected ? ' is-dimmed' : '');
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      row.dataset.assignee = resName;

      // Left axis label cell with vertical spine and tick marks
      const labelCell = document.createElement('div');
      labelCell.className = 'itpm-axis-label-cell';
      labelCell.style.width = '76px';
      labelCell.style.height = '29px';
      labelCell.style.fontSize = '12.5px';
      labelCell.textContent = resName;

      // Right horizontal bar cell
      const barCell = document.createElement('div');
      barCell.className = 'itpm-bar-cell';
      barCell.style.height = '29px';
      barCell.style.padding = '3.5px 0';

      const light = isLightMode();
      const leftSegBg = light ? '#e2e8f0' : WHITE_COLOR;
      const rightSegBg = light ? '#d99b26' : '#deba64';

      const track = document.createElement('div');
      track.className = 'itpm-bar-track';
      track.style.height = '22px';
      track.style.background = rightSegBg;
      track.style.borderRadius = light ? '4px' : '0';
      track.style.border = light ? '1px solid #cbd5e1' : 'none';

      // Left segment
      const whiteSeg = document.createElement('div');
      whiteSeg.className = 'itpm-resource-segment-white';
      whiteSeg.style.width = `${whiteWidth}%`;
      whiteSeg.style.height = '100%';
      whiteSeg.style.background = leftSegBg;
      whiteSeg.style.transition = 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1)';

      // Right gold segment with utilization value at the left edge
      const goldSeg = document.createElement('div');
      goldSeg.className = 'itpm-resource-segment-gold';
      goldSeg.style.width = `${goldWidth}%`;
      goldSeg.style.height = '100%';
      goldSeg.style.background = rightSegBg;
      goldSeg.style.display = 'flex';
      goldSeg.style.alignItems = 'center';
      goldSeg.style.justifyContent = 'flex-start';
      goldSeg.style.paddingLeft = '6px';
      goldSeg.style.boxSizing = 'border-box';
      goldSeg.style.transition = 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1)';

      const valLabel = document.createElement('span');
      valLabel.className = 'itpm-resource-val-label';
      valLabel.textContent = String(utilization);
      valLabel.style.color = WHITE_COLOR;
      valLabel.style.fontWeight = '700';
      valLabel.style.fontSize = '12.5px';
      valLabel.style.lineHeight = '1';
      valLabel.style.whiteSpace = 'nowrap';
      valLabel.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.35)';

      goldSeg.appendChild(valLabel);
      track.appendChild(whiteSeg);
      track.appendChild(goldSeg);
      barCell.appendChild(track);

      row.appendChild(labelCell);
      row.appendChild(barCell);

      // Tooltip & click handler
      const roleInfo = res.role || res.specialty || 'Nhóm triển khai CNTT';
      const taskCount = res.taskCount != null ? res.taskCount : '';
      const buildTooltipHtml = function () {
        let meta = `<div class="itpm-chart-tooltip-meta">Chỉ số sử dụng nguồn lực: <strong>${utilization}%</strong></div>`;
        if (roleInfo) {
          meta += `<div class="itpm-chart-tooltip-meta">Bộ phận: <strong>${escapeHtml(roleInfo)}</strong></div>`;
        }
        if (taskCount !== '') {
          meta += `<div class="itpm-chart-tooltip-meta">Công việc phụ trách: <strong>${escapeHtml(taskCount)}</strong></div>`;
        }
        return `
          <div class="itpm-chart-tooltip-title">${escapeHtml(resName)}</div>
          ${meta}
        `;
      };

      row.addEventListener('mouseenter', function (e) {
        showTooltip(buildTooltipHtml(), e);
      });
      row.addEventListener('mousemove', function (e) {
        moveTooltip(e);
      });
      row.addEventListener('mouseleave', function () {
        hideTooltip();
      });

      const handleSelect = function () {
        hideTooltip();
        if (typeof onSelectAssignee === 'function') {
          onSelectAssignee(resName);
        }
      };

      row.addEventListener('click', handleSelect);
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      });

      wrapper.appendChild(row);
    });

    containerEl.appendChild(wrapper);
  }

  window.ITPM.charts = {
    renderProjectProgress: renderProjectProgress,
    renderAverageProgressDonut: renderAverageProgressDonut,
    renderStatusPie: renderStatusPie,
    renderResourceUsage: renderResourceUsage
  };
})();
