/* ============================================================
   CloudDash — JavaScript Application
   Features:
     1. Real-time animated charts (Canvas API) with live data simulation
     2. Dynamic search & filtering of server resources
     3. Dark/Light theme toggle with localStorage persistence
     4. Toast notification system for infrastructure alerts
   ============================================================ */

// ===================== DATA =====================

const SERVERS = [
  { id: 1, name: "web-prod-01", status: "running", cpu: 67, mem: 72, region: "us-east-1", type: "t3.large", ip: "10.0.1.12" },
  { id: 2, name: "web-prod-02", status: "running", cpu: 54, mem: 61, region: "us-east-1", type: "t3.large", ip: "10.0.1.13" },
  { id: 3, name: "api-prod-01", status: "running", cpu: 82, mem: 78, region: "us-west-2", type: "c5.xlarge", ip: "10.0.2.20" },
  { id: 4, name: "api-prod-02", status: "warning", cpu: 91, mem: 85, region: "us-west-2", type: "c5.xlarge", ip: "10.0.2.21" },
  { id: 5, name: "db-primary", status: "running", cpu: 45, mem: 88, region: "us-east-1", type: "r5.2xlarge", ip: "10.0.3.10" },
  { id: 6, name: "db-replica-01", status: "running", cpu: 32, mem: 74, region: "eu-west-1", type: "r5.xlarge", ip: "10.1.3.11" },
  { id: 7, name: "cache-redis-01", status: "running", cpu: 18, mem: 42, region: "us-east-1", type: "r6g.large", ip: "10.0.4.5" },
  { id: 8, name: "worker-batch-01", status: "stopped", cpu: 0, mem: 0, region: "us-west-2", type: "m5.large", ip: "10.0.5.30" },
  { id: 9, name: "ml-inference-01", status: "running", cpu: 76, mem: 69, region: "us-east-1", type: "g4dn.xlarge", ip: "10.0.6.15" },
  { id: 10, name: "monitoring-01", status: "running", cpu: 28, mem: 55, region: "eu-west-1", type: "t3.medium", ip: "10.1.1.8" },
  { id: 11, name: "ci-runner-01", status: "warning", cpu: 88, mem: 92, region: "us-east-1", type: "c5.2xlarge", ip: "10.0.7.40" },
  { id: 12, name: "gateway-lb-01", status: "running", cpu: 35, mem: 41, region: "us-east-1", type: "t3.medium", ip: "10.0.0.5" },
];

const ALERTS_DATA = [
  { id: 1, severity: "critical", title: "High CPU on api-prod-02", desc: "CPU usage exceeded 90% for 5 minutes", time: "2 min ago" },
  { id: 2, severity: "warning", title: "Disk space low on db-primary", desc: "Volume /data at 87% capacity", time: "15 min ago" },
  { id: 3, severity: "critical", title: "ci-runner-01 memory critical", desc: "Memory usage at 92%, OOM risk", time: "8 min ago" },
  { id: 4, severity: "info", title: "Auto-scaling triggered", desc: "Added 1 instance to web-prod group", time: "32 min ago" },
  { id: 5, severity: "warning", title: "SSL certificate expiring", desc: "*.clouddash.io expires in 14 days", time: "1 hr ago" },
];

const ACTIVITIES = [
  { type: "success", text: "Deployment to web-prod completed successfully", time: "2m ago" },
  { type: "info", text: "Auto-scaling added 1 instance to web-prod group", time: "5m ago" },
  { type: "warning", text: "High memory usage detected on ci-runner-01", time: "8m ago" },
  { type: "error", text: "API latency spike on api-prod-02 (p99 > 500ms)", time: "12m ago" },
  { type: "success", text: "Database backup completed for db-primary", time: "18m ago" },
  { type: "info", text: "SSL certificate renewed for monitoring-01", time: "25m ago" },
];

const REGION_DATA = [
  { label: "US East", value: 42, color: "#3b82f6" },
  { label: "US West", value: 28, color: "#10b981" },
  { label: "EU West", value: 18, color: "#f59e0b" },
  { label: "AP South", value: 12, color: "#8b5cf6" },
];

// ===================== STATE =====================

let state = {
  cpuHistory: Array(60).fill(0).map(() => 40 + Math.random() * 30),
  memHistory: Array(60).fill(0).map(() => 55 + Math.random() * 25),
  alerts: [...ALERTS_DATA],
  liveCharts: true,
  notifications: true,
  refreshInterval: 2,
  chartTimer: null,
};

// ===================== INIT =====================

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavigation();
  initSearch();
  initServerFilter();
  initAlerts();
  initSettings();
  initHamburger();
  renderServers(SERVERS);
  renderActivity();
  drawCpuChart();
  drawRegionChart();
  startLiveCharts();
  startAlertSimulation();
});

// ===================== FEATURE 1: REAL-TIME CHARTS =====================
// Uses the HTML5 Canvas API to draw animated line charts and a donut chart.
// CPU and Memory data is simulated and pushed to arrays every N seconds,
// creating a scrolling real-time visualization.

function drawCpuChart() {
  const canvas = document.getElementById("chart-cpu");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width;
  const H = rect.height;
  const pad = { top: 10, right: 15, bottom: 28, left: 40 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  // Clear
  ctx.clearRect(0, 0, W, H);

  // Grid lines
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
  }

  // Y-axis labels
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.fillText((100 - i * 25) + "%", pad.left - 8, y + 4);
  }

  // X-axis labels
  ctx.textAlign = "center";
  for (let i = 0; i < 60; i += 10) {
    const x = pad.left + (chartW / 59) * i;
    ctx.fillText(-60 + i + "s", x, H - 6);
  }

  // Draw line helper
  function drawLine(data, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    data.forEach((val, i) => {
      const x = pad.left + (chartW / (data.length - 1)) * i;
      const y = pad.top + chartH - (val / 100) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Gradient fill under line
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    const rgb = color === "#3b82f6" ? "59,130,246" : "16,185,129";
    gradient.addColorStop(0, `rgba(${rgb}, 0.15)`);
    gradient.addColorStop(1, `rgba(${rgb}, 0.0)`);
    ctx.lineTo(pad.left + chartW, pad.top + chartH);
    ctx.lineTo(pad.left, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  drawLine(state.cpuHistory, "#3b82f6");
  drawLine(state.memHistory, "#10b981");
}

function drawRegionChart() {
  const canvas = document.getElementById("chart-region");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const cx = W / 2;
  const cy = H / 2 - 10;
  const radius = Math.min(cx, cy) - 20;
  const innerRadius = radius * 0.55;
  const total = REGION_DATA.reduce((s, d) => s + d.value, 0);

  let angle = -Math.PI / 2;
  REGION_DATA.forEach((d) => {
    const sliceAngle = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, angle, angle + sliceAngle);
    ctx.arc(cx, cy, innerRadius, angle + sliceAngle, angle, true);
    ctx.closePath();
    ctx.fillStyle = d.color;
    ctx.fill();
    angle += sliceAngle;
  });

  // Center label
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  ctx.fillStyle = isDark ? "#e5e7eb" : "#1a1d2e";
  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(total + "%", cx, cy - 4);
  ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
  ctx.font = "11px 'DM Sans', sans-serif";
  ctx.fillText("Total Load", cx, cy + 14);

  // Legend below
  const legendY = H - 18;
  let lx = 15;
  ctx.font = "11px 'DM Sans', sans-serif";
  REGION_DATA.forEach((d) => {
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(lx + 4, legendY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
    ctx.fillText(`${d.label} ${d.value}%`, lx + 14, legendY + 4);
    lx += ctx.measureText(`${d.label} ${d.value}%`).width + 24;
  });
}

function updateChartData() {
  // Simulate realistic fluctuating CPU/memory data
  const last_cpu = state.cpuHistory[state.cpuHistory.length - 1];
  const last_mem = state.memHistory[state.memHistory.length - 1];
  const newCpu = Math.max(10, Math.min(95, last_cpu + (Math.random() - 0.48) * 8));
  const newMem = Math.max(30, Math.min(95, last_mem + (Math.random() - 0.5) * 5));
  state.cpuHistory.push(newCpu);
  state.memHistory.push(newMem);
  if (state.cpuHistory.length > 60) state.cpuHistory.shift();
  if (state.memHistory.length > 60) state.memHistory.shift();
}

function startLiveCharts() {
  if (state.chartTimer) clearInterval(state.chartTimer);
  if (!state.liveCharts) return;
  state.chartTimer = setInterval(() => {
    updateChartData();
    drawCpuChart();
  }, state.refreshInterval * 1000);
}

// ===================== FEATURE 2: DYNAMIC SEARCH & FILTER =====================
// Two-layer filtering: text search across server names, IPs, regions, and types,
// combined with a status dropdown filter. Results update instantly via DOM
// manipulation with smooth CSS animations.

function initSearch() {
  const input = document.getElementById("search-input");
  input.addEventListener("input", () => {
    applyFilters();
  });
}

function initServerFilter() {
  const select = document.getElementById("server-filter");
  select.addEventListener("change", () => {
    applyFilters();
  });
}

function applyFilters() {
  const query = document.getElementById("search-input").value.toLowerCase().trim();
  const statusFilter = document.getElementById("server-filter").value;

  let filtered = SERVERS.filter((s) => {
    const matchesSearch = !query ||
      s.name.toLowerCase().includes(query) ||
      s.ip.includes(query) ||
      s.region.toLowerCase().includes(query) ||
      s.type.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  renderServers(filtered);

  // Update stat card count
  const running = filtered.filter((s) => s.status === "running").length;
  document.getElementById("stat-servers").textContent = running;
}

function renderServers(servers) {
  const grid = document.getElementById("server-grid");
  if (!grid) return;

  if (servers.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">
      No servers match your filters.
    </div>`;
    return;
  }

  grid.innerHTML = servers.map((s) => {
    const cpuColor = s.cpu > 80 ? "var(--chart-red)" : s.cpu > 60 ? "var(--chart-orange)" : "var(--chart-green)";
    return `
    <div class="server-card">
      <div class="server-card-header">
        <span class="server-name">${s.name}</span>
        <span class="status-pill ${s.status}">${s.status}</span>
      </div>
      <dl class="server-specs">
        <dt>Region</dt><dd>${s.region}</dd>
        <dt>Type</dt><dd>${s.type}</dd>
        <dt>IP</dt><dd>${s.ip}</dd>
        <dt>Memory</dt><dd>${s.mem}%</dd>
      </dl>
      <div class="server-bar">
        <div class="server-bar-label">
          <span>CPU</span>
          <span>${s.cpu}%</span>
        </div>
        <div class="server-bar-track">
          <div class="server-bar-fill" style="width:${s.cpu}%;background:${cpuColor}"></div>
        </div>
      </div>
    </div>`;
  }).join("");
}

// ===================== FEATURE 3: DARK/LIGHT THEME TOGGLE =====================
// Uses localStorage to persist the user's theme preference across sessions.
// CSS custom properties switch instantly via the [data-theme] attribute.
// The toggle updates both the sidebar icon button and the Settings switch.

function initTheme() {
  const saved = localStorage.getItem("clouddash-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  syncThemeUI(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("clouddash-theme", next);
  syncThemeUI(next);
  // Redraw charts with new theme colors
  drawCpuChart();
  drawRegionChart();
}

function syncThemeUI(theme) {
  const settingsToggle = document.getElementById("settings-theme-toggle");
  if (settingsToggle) settingsToggle.checked = theme === "dark";
}

// ===================== FEATURE 4: TOAST NOTIFICATION SYSTEM =====================
// Infrastructure alerts pop in from the right with staggered animations.
// Toasts auto-dismiss after 5 seconds. New alerts are periodically simulated
// to demonstrate the real-time notification system.

function showToast(message, severity = "info") {
  if (!state.notifications) return;
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span class="toast-icon ${severity}"></span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 5000);
}

const RANDOM_ALERTS = [
  { msg: "Network latency spike in us-east-1", sev: "warning" },
  { msg: "Auto-healing restarted cache-redis-01", sev: "info" },
  { msg: "CPU threshold breach on ml-inference-01", sev: "critical" },
  { msg: "New deployment queued for web-prod", sev: "info" },
  { msg: "Disk I/O warning on db-replica-01", sev: "warning" },
  { msg: "Health check recovered for gateway-lb-01", sev: "success" },
];

function startAlertSimulation() {
  setInterval(() => {
    if (!state.notifications) return;
    const alert = RANDOM_ALERTS[Math.floor(Math.random() * RANDOM_ALERTS.length)];
    showToast(alert.msg, alert.sev);
  }, 12000);
}

// ===================== NAVIGATION =====================

function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const section = item.getAttribute("data-section");
      navigateTo(section);
      // Close mobile sidebar
      document.getElementById("sidebar").classList.remove("open");
    });
  });
}

function navigateTo(section) {
  // Update nav
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  document.querySelector(`.nav-item[data-section="${section}"]`).classList.add("active");

  // Update sections
  document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
  document.getElementById(`section-${section}`).classList.add("active");

  // Update title
  const titles = { dashboard: "Dashboard", servers: "Servers", alerts: "Alerts", settings: "Settings" };
  document.getElementById("page-title").textContent = titles[section] || section;
}

// ===================== ALERTS MANAGEMENT =====================

function initAlerts() {
  renderAlerts();
  document.getElementById("btn-dismiss-all").addEventListener("click", () => {
    state.alerts = [];
    renderAlerts();
    updateAlertBadge();
    showToast("All alerts dismissed", "success");
  });
}

function renderAlerts() {
  const container = document.getElementById("alert-list-main");
  if (!container) return;

  if (state.alerts.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-muted);">
      No active alerts. All systems nominal.
    </div>`;
    return;
  }

  container.innerHTML = state.alerts.map((a) => `
    <div class="alert-item" data-id="${a.id}">
      <div class="alert-severity ${a.severity}"></div>
      <div class="alert-body">
        <div class="alert-title">${a.title}</div>
        <div class="alert-desc">${a.desc}</div>
      </div>
      <span class="alert-time">${a.time}</span>
      <button class="alert-dismiss" onclick="dismissAlert(${a.id})" title="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  `).join("");
}

function dismissAlert(id) {
  state.alerts = state.alerts.filter((a) => a.id !== id);
  renderAlerts();
  updateAlertBadge();
}

function updateAlertBadge() {
  const badge = document.getElementById("alert-badge");
  const statAlerts = document.getElementById("stat-alerts");
  badge.textContent = state.alerts.length;
  statAlerts.textContent = state.alerts.length;
  badge.style.display = state.alerts.length > 0 ? "inline-block" : "none";
}

// ===================== ACTIVITY LOG =====================

function renderActivity() {
  const list = document.getElementById("activity-list");
  if (!list) return;
  list.innerHTML = ACTIVITIES.map((a) => `
    <li class="activity-item">
      <span class="activity-dot ${a.type}"></span>
      <span class="activity-text">${a.text}</span>
      <span class="activity-time">${a.time}</span>
    </li>
  `).join("");
}

// ===================== SETTINGS =====================

function initSettings() {
  // Theme toggle in settings
  document.getElementById("settings-theme-toggle").addEventListener("change", toggleTheme);
  // Sidebar theme toggle
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  // Live chart toggle
  document.getElementById("settings-live-toggle").addEventListener("change", (e) => {
    state.liveCharts = e.target.checked;
    if (state.liveCharts) startLiveCharts();
    else if (state.chartTimer) clearInterval(state.chartTimer);
  });

  // Notification toggle
  document.getElementById("settings-notif-toggle").addEventListener("change", (e) => {
    state.notifications = e.target.checked;
  });

  // Refresh interval
  document.getElementById("settings-interval").addEventListener("change", (e) => {
    state.refreshInterval = parseInt(e.target.value);
    startLiveCharts(); // restart with new interval
  });
}

// ===================== HAMBURGER (MOBILE) =====================

function initHamburger() {
  document.getElementById("hamburger-btn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  // Close sidebar on outside click (mobile)
  document.querySelector(".main-content").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
  });
}

// ===================== WINDOW RESIZE =====================

window.addEventListener("resize", () => {
  drawCpuChart();
  drawRegionChart();
});
