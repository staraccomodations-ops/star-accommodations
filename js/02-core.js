//  THEME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function applyTheme() {
  document.documentElement.setAttribute(
    "data-theme",
    darkMode ? "dark" : "light",
  );

  document.querySelector(".theme-toggle").innerHTML = darkMode
    ? '<ion-icon name="sunny"></ion-icon>'
    : '<ion-icon name="moon"></ion-icon>';
}

function toggleTheme() {
  darkMode = !darkMode;
  applyTheme();
  save();
}
applyTheme();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SIDEBAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-overlay").classList.toggle("active");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("active");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SINGLE TIER LOGIC (always returns 'member')
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getTierKey(nights) {
  return "member";
}

function tierByKey(k) {
  return (
    tiers[0] || {
      key: "member",
      name: "Member",
      discount: 10,
      mult: 0.05,
      color: "#C9A84C",
      letter: "M",
    }
  );
}

function tierBadge(k) {
  const T = tierByKey(k);
  return `<span class="tier-badge tier-member">${esc(T.name)}</span>`;
}

function resetTierIfInactive(g) {
  /* No tiers to reset */
}

// Blackout period: Dec 15 to Jan 15
function isBlackoutPeriod(dateStr) {
  const d = new Date(dateStr);
  const month = d.getMonth(); // 0=Jan
  const day = d.getDate();
  if (month === 11 && day >= 15) return true; // Dec 15-31
  if (month === 0 && day <= 15) return true; // Jan 1-15
  return false;
}

function totals() {
  let rev = 0;
  txs.forEach((t) => (rev += t.amount));
  let pts = 0;
  guests.forEach((g) => (pts += g.points));
  const tc = { member: guests.length };
  return { rev, pts, tc };
}

function monthlyRevenue() {
  const map = {};
  txs.forEach((t) => {
    const m = (t.date || "").slice(0, 7);
    if (!m) return;
    map[m] = (map[m] || 0) + t.amount;
  });
  const keys = Object.keys(map).sort().slice(-6);
  return keys.map((k) => {
    const d = new Date(k + "-01T00:00:00");
    return { m: d.toLocaleDateString("en-US", { month: "short" }), v: map[k] };
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NAVIGATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const NAV = [
  { id: "dashboard", label: "Dashboard", ic: `<ion-icon name="grid"></ion-icon>`, sec: "Overview" },
  { id: "bookings", label: "Bookings", ic: `<ion-icon name="calendar"></ion-icon>`, sec: "Overview" },
  { id: "guests", label: "Guest Registry", ic: `<ion-icon name="people"></ion-icon>`, sec: "Loyalty" },
  { id: "loyalty", label: "Loyalty Info", ic: `<ion-icon name="trophy"></ion-icon>`, sec: "Loyalty" },
  { id: "analytics", label: "Analytics", ic: `<ion-icon name="bar-chart"></ion-icon>`, sec: "Loyalty" },
  { id: "cashbook", label: "Cash Book", ic: `<ion-icon name="wallet"></ion-icon>`, sec: "Finance" },
  { id: "accounting", label: "Accounting Ledger", ic: `<ion-icon name="card"></ion-icon>`, sec: "Finance" },
  { id: "coa", label: "Chart of Accounts", ic: `<ion-icon name="albums"></ion-icon>`, sec: "Finance" },
  { id: "settings", label: "Settings & Export", ic: `<ion-icon name="settings"></ion-icon>`, sec: "System" },
];
const PAGE_TITLE = {
  dashboard: "Dashboard",
  bookings: "Bookings",
  guests: "Guest Registry",
  guestDetail: "Guest Profile",
  loyalty: "Loyalty Info",
  analytics: "Analytics",
  cashbook: "Cash Book",
  accounting: "Accounting Ledger",
  coa: "Chart of Accounts",
  settings: "Settings & Data Export",
};

function renderNav() {
  const secs = ["Overview", "Loyalty", "Finance", "System"];
  let html = "";
  secs.forEach((sec) => {
    html += `<div class="nav-section">${sec}</div>`;
    NAV.filter((n) => n.sec === sec).forEach((n) => {
      const active =
        page === n.id || (page === "guestDetail" && n.id === "guests")
          ? " active"
          : "";
      const lock =
        (n.id === "coa" || n.id === "accounting") && !adminUnlocked
          ? `<span class="nav-lock"><ion-icon name="lock-closed"></ion-icon></span>`
          : "";
      html += `<div class="nav-item${active}" onclick="go('${n.id}')"><span class="nav-ico">${n.ic}</span><span>${n.label}</span>${lock}</div>`;
    });
  });
  document.getElementById("nav").innerHTML = html;
}

function go(p) {
  page = p;
  selGuestId = null;
  closeSidebar();
  render();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RENDER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function render() {
  renderNav();
  document.getElementById("page-title").textContent =
    PAGE_TITLE[page] || "Dashboard";
  const t = totals();
  document.getElementById("top-pts").innerHTML =
    `<ion-icon name="star" size="medium"></ion-icon> ${t.pts >= 1000 ? Math.round(t.pts / 1000) + "K" : t.pts.toLocaleString()} pts`;
  document.getElementById("top-meta").textContent =
    `${guests.length} members · ${PKR(t.rev)} revenue`;

  // Update admin toggle button
  const btn = document.getElementById("adminToggleBtn");
  if (adminUnlocked) {
    btn.innerHTML = `<ion-icon name="lock-closed"></ion-icon> Admin Mode`;
    btn.classList.add("admin-active");
  } else {
    btn.innerHTML = `<ion-icon name="lock-open"></ion-icon> Admin Access`;
    btn.classList.remove("admin-active");
  }

  const c = document.getElementById("content");
  let html = "";
  if ((page === "coa" || page === "accounting") && !adminUnlocked)
    html = lockedPage(page);
  else if (page === "dashboard") html = pageDashboard();
  else if (page === "bookings") html = pageBookings();
  else if (page === "guests") html = pageGuests();
  else if (page === "guestDetail") html = pageGuestDetail();
  else if (page === "loyalty") html = pageLoyalty();
  else if (page === "analytics") html = pageAnalytics();
  else if (page === "cashbook") html = pageCashbook();
  else if (page === "accounting") html = pageAccounting();
  else if (page === "coa") html = pageCOA();
  else if (page === "settings") html = pageSettings();
  c.innerHTML = html;

  if (page === "guests") {
    const si = document.getElementById("search-in");
    if (si) {
      si.focus();
      si.value = si.value;
    }
  }
  if (page === "cashbook") {
    const cs = document.getElementById("cb-search");
    if (cs) {
      cs.focus();
      cs.value = cs.value;
    }
  }
}

function emptyState(icon, title, sub) {
  return `<div class="empty"><div class="empty-big">${icon}</div><div class="empty-title">${title}</div><div class="empty-sub">${sub}</div></div>`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ARCHIVE FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function archiveMonth(month) {
  // Find all cashbook entries with that month that are not archived
  const toArchive = cashbook.filter((e) => e.month === month && !e.archived);
  if (toArchive.length === 0) return false;
  // Mark them as archived
  toArchive.forEach((e) => (e.archived = true));
  // Add to archivedCashbooks if not exists
  if (!archivedCashbooks[month]) {
    archivedCashbooks[month] = { verified: false, verifiedBy: "" };
  }
  save();
  return true;
}

function autoArchive() {
  const todayStr = today();
  if (!isFirstMonday(todayStr)) return;
  const prevMonth = getPreviousMonth();
  // Check if already archived
  if (archivedCashbooks[prevMonth]) return;
  // Check if there are entries for that month
  const hasEntries = cashbook.some((e) => e.month === prevMonth && !e.archived);
  if (!hasEntries) return;
  // Archive
  const success = archiveMonth(prevMonth);
  if (success) {
    toast(`Archived cash book for ${prevMonth}`);
  }
}

function getCurrentMonthEntries() {
  const current = getCurrentMonth();
  return cashbook.filter(
    (e) => !e.archived && getMonthFromDate(e.date) === current,
  );
}

function getArchivedMonths() {
  return Object.keys(archivedCashbooks).sort((a, b) => {
    const [mA, yA] = a.split("/");
    const [mB, yB] = b.split("/");
    if (yA !== yB) return parseInt(yA) - parseInt(yB);
    return parseInt(mA) - parseInt(mB);
  });
}

function verifyMonth(month, verifier) {
  if (archivedCashbooks[month]) {
    archivedCashbooks[month].verified = true;
    archivedCashbooks[month].verifiedBy = verifier;
    save();
    toast(`Month ${month} verified by ${verifier}`);
    render();
  }
}

// ─── PAGES ──────────────────────────────────────────────────
