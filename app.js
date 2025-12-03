// app.js - main application logic (v2.0)
// Features added:
// - habit objects with id/name/color/createdAt
// - tracking per date per habitId
// - add/edit/delete habits
// - toggle complete with animation
// - weekly / monthly overview grids
// - streak calculation & top streaks panel
// - export/import JSON
// - random color per habit
// - PWA ready (service worker + manifest included separately)

const STORAGE_KEY = "habits_v2";
const TRACKING_KEY = "tracking_v2";

let habits = []; // array of { id, name, color, createdAt }
let tracking = {}; // { 'YYYY-MM-DD': { habitId: true/false } }

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  localStorage.setItem(TRACKING_KEY, JSON.stringify(tracking));
}

function loadData() {
  habits = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  tracking = JSON.parse(localStorage.getItem(TRACKING_KEY)) || {};
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/* ---------------- DATE HANDLING ---------------- */
let viewingDate = new Date();
const today = new Date();

function dateKey(d) {
  return d.toISOString().split("T")[0];
}

function formatDateLong(d) {
  const dow = d.toLocaleDateString("en-GB", { weekday: "short" });
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  let suffix = "th";
  if (day % 10 === 1 && day !== 11) suffix = "st";
  else if (day % 10 === 2 && day !== 12) suffix = "nd";
  else if (day % 10 === 3 && day !== 13) suffix = "rd";
  return `${dow} ${day}${suffix} ${month}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function canGoForward() {
  // allow forward only until today
  const vk = new Date(viewingDate.getFullYear(), viewingDate.getMonth(), viewingDate.getDate());
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return vk < t;
}

/* ---------------- RENDER ---------------- */

const dateText = () => document.getElementById("date-text");
const habitListEl = () => document.getElementById("habit-list");

function render() {
  // date text
  if (isSameDay(viewingDate, today)) {
    dateText().textContent = "Today";
  } else {
    dateText().textContent = formatDateLong(viewingDate);
  }

  // next button opacity
  document.getElementById("next-day").style.opacity = canGoForward() ? "1" : "0.35";

  renderHabits();
  renderStreaks();
  renderOverview(); // depending on mode it will show daily/weekly/monthly
}

// create empty map for a date if missing
function ensureDateKey(key) {
  if (!tracking[key]) tracking[key] = {};
}

function renderHabits() {
  const list = habitListEl();
  list.innerHTML = "";

  const dKey = dateKey(viewingDate);
  ensureDateKey(dKey);

  // sort habits by createdAt descending (newest top)
  const copy = [...habits].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (copy.length === 0) {
    const hint = document.createElement("div");
    hint.className = "glass-panel";
    hint.style.color = "white";
    hint.textContent = "No habits yet — add one using the + button";
    list.appendChild(hint);
    return;
  }

  copy.forEach(h => {
    const done = !!(tracking[dKey] && tracking[dKey][h.id]);
    const card = document.createElement("div");
    card.className = "habit" + (done ? " done" : "");
    card.style.background = `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.06))`;
    card.style.borderLeft = `6px solid ${h.color}`;

    // left side
    const left = document.createElement("div");
    left.className = "left";

    const sw = document.createElement("div");
    sw.className = "color-swatch";
    sw.style.background = h.color;

    const meta = document.createElement("div");
    meta.className = "meta";

    const name = document.createElement("div");
    name.className = "habit-name" + (done ? " done" : "");
    name.textContent = h.name;

    const created = document.createElement("div");
    created.className = "habit-meta";
    created.textContent = `Added ${new Date(h.createdAt).toLocaleDateString()}`;

    meta.appendChild(name);
    meta.appendChild(created);

    left.appendChild(sw);
    left.appendChild(meta);

    // actions
    const actions = document.createElement("div");
    actions.className = "actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "action toggle";
    toggleBtn.title = done ? "Mark as not done" : "Mark as done";
    toggleBtn.innerHTML = done ? "✓" : "○";
    toggleBtn.addEventListener("click", async () => {
      await toggleComplete(h.id, viewingDate);
      // quick animation
      card.classList.add("done");
      setTimeout(() => {
        saveData();
        render();
      }, 140);
    });

    const editBtn = document.createElement("button");
    editBtn.className = "action";
    editBtn.title = "Edit";
    editBtn.textContent = "✎";
    editBtn.addEventListener("click", () => openEditModal(h.id));

    const moreBtn = document.createElement("button");
    moreBtn.className = "action";
    moreBtn.title = "More";
    moreBtn.textContent = "⋯";
    moreBtn.addEventListener("click", () => {
      // quick context: show popover for more (not implemented heavy)
      openEditModal(h.id);
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(editBtn);
    actions.appendChild(moreBtn);

    card.appendChild(left);
    card.appendChild(actions);

    list.appendChild(card);
  });
}

/* ---------------- HABIT CRUD ---------------- */

function addHabit(name, color) {
  const h = {
    id: uid(),
    name: name.trim(),
    color: color || randomColor(),
    createdAt: new Date().toISOString()
  };
  habits.push(h);
  saveData();
  render();
  return h;
}

function updateHabit(id, updates) {
  const idx = habits.findIndex(x => x.id === id);
  if (idx === -1) return;
  habits[idx] = { ...habits[idx], ...updates };
  saveData();
  render();
}

function deleteHabit(id) {
  habits = habits.filter(h => h.id !== id);
  // remove from tracking entirely
  Object.keys(tracking).forEach(day => {
    if (tracking[day][id] !== undefined) {
      delete tracking[day][id];
    }
  });
  saveData();
  render();
}

/* ---------------- TOGGLING & TRACKING ---------------- */

async function toggleComplete(habitId, date) {
  const key = dateKey(date);
  ensureDateKey(key);
  tracking[key][habitId] = !tracking[key][habitId];
  saveData();
}

/* ---------------- STREAKS ---------------- */

function computeStreakForHabit(habitId, untilDate = new Date()) {
  // count continuous days including untilDate backwards
  let streak = 0;
  let d = new Date(untilDate.getFullYear(), untilDate.getMonth(), untilDate.getDate());
  while (true) {
    const k = dateKey(d);
    if (tracking[k] && tracking[k][habitId]) streak++;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function renderStreaks() {
  const el = document.getElementById("streaks-list");
  el.innerHTML = "";

  if (habits.length === 0) {
    el.innerHTML = `<div class="habit-meta">No habits yet</div>`;
    return;
  }

  const list = habits.map(h => {
    const streak = computeStreakForHabit(h.id, today);
    return { h, streak };
  }).sort((a,b) => b.streak - a.streak);

  list.slice(0,6).forEach(item => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.marginBottom = "6px";
    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:12px;height:12px;border-radius:3px;background:${item.h.color}"></div>
        <div style="font-size:13px">${item.h.name}</div>
      </div>
      <div style="font-weight:700">${item.streak}d</div>
    `;
    el.appendChild(row);
  });
}

/* ---------------- OVERVIEW (weekly/monthly/daily summaries) ---------------- */

let mode = "daily"; // or weekly, monthly

function setMode(m) {
  mode = m;
  document.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b.id === `mode-${m}`));
  renderOverview();
}

function renderOverview() {
  const container = document.getElementById("overview-content");
  container.innerHTML = "";

  if (mode === "daily") {
    container.textContent = `${habits.length} habits`;
    return;
  }

  if (mode === "weekly") {
    container.appendChild(createWeekGrid(viewingDate));
    return;
  }

  if (mode === "monthly") {
    container.appendChild(createMonthGrid(viewingDate));
    return;
  }
}

// create a 7-day grid with completion ratios
function createWeekGrid(centerDate) {
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.gap = "6px";

  // find Monday as start (or previous 6 days)
  const start = new Date(centerDate);
  start.setDate(start.getDate() - 3); // center-ish
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k = dateKey(d);
    const doneCount = tracking[k] ? Object.values(tracking[k]).filter(Boolean).length : 0;
    const total = habits.length || 1;
    const pct = Math.round((doneCount / total) * 100);
    const cell = document.createElement("div");
    cell.style.width = "44px";
    cell.style.height = "44px";
    cell.style.borderRadius = "8px";
    cell.style.display = "flex";
    cell.style.flexDirection = "column";
    cell.style.alignItems = "center";
    cell.style.justifyContent = "center";
    cell.style.fontSize = "12px";
    cell.style.fontWeight = "700";
    cell.style.color = "white";
    cell.style.background = `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.03))`;
    cell.style.border = `1px solid rgba(255,255,255,0.06)`;
    cell.innerHTML = `<div style="font-weight:600">${d.toLocaleDateString('en-GB',{weekday:'short'})}</div><div style="font-size:11px;margin-top:4px">${pct}%</div>`;
    wrapper.appendChild(cell);
  }
  return wrapper;
}

function createMonthGrid(centerDate) {
  const wrapper = document.createElement("div");
  wrapper.style.display = "grid";
  wrapper.style.gridTemplateColumns = "repeat(7, 1fr)";
  wrapper.style.gap = "6px";

  const first = new Date(centerDate.getFullYear(), centerDate.getMonth(), 1);
  const daysInMonth = new Date(centerDate.getFullYear(), centerDate.getMonth()+1, 0).getDate();

  // prepend blanks if month doesn't start on Sunday
  const startDay = first.getDay(); // 0..6 Sunday..Saturday
  for (let i = 0; i < startDay; i++) {
    const blank = document.createElement("div");
    blank.style.height = "48px";
    wrapper.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(centerDate.getFullYear(), centerDate.getMonth(), d);
    const key = dateKey(date);
    const doneCount = tracking[key] ? Object.values(tracking[key]).filter(Boolean).length : 0;
    const total = habits.length || 1;
    const pct = Math.round((doneCount / total) * 100);
    const cell = document.createElement("div");
    cell.style.minHeight = "48px";
    cell.style.borderRadius = "8px";
    cell.style.display = "flex";
    cell.style.alignItems = "center";
    cell.style.justifyContent = "center";
    cell.style.fontSize = "13px";
    cell.style.color = "white";
    cell.style.background = `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.03))`;
    cell.style.border = `1px solid rgba(255,255,255,0.06)`;
    cell.innerHTML = `<div style="text-align:center"><div style="font-weight:700">${d}</div><div style="font-size:11px;margin-top:6px">${pct}%</div></div>`;
    wrapper.appendChild(cell);
  }
  return wrapper;
}

/* ----------------- UTILS ------------------ */

function randomColor() {
  // pleasing pastel-ish palette
  const palettes = [
    "#60a5fa","#f59e0b","#34d399","#fb7185","#8b5cf6","#f97316","#06b6d4","#f472b6"
  ];
  return palettes[Math.floor(Math.random()*palettes.length)];
}

/* --------------- UI: add panel & edit modal ------------- */

let panelOpen = false;
const toggleBtn = document.getElementById("add-toggle");
const input = document.getElementById("new-habit-input");
const colorPicker = document.getElementById("new-habit-color");
const confirmAdd = document.getElementById("confirm-add");
const addPanel = document.getElementById("add-panel");

toggleBtn.addEventListener("click", () => {
  panelOpen = !panelOpen;
  addPanel.style.display = panelOpen ? "flex" : "none";
  toggleBtn.textContent = panelOpen ? "−" : "+";
  if (panelOpen) input.focus();
});

confirmAdd.addEventListener("click", () => {
  const text = input.value.trim();
  if (text.length === 0) return;
  addHabit(text, colorPicker.value);
  input.value = "";
  panelOpen = false;
  addPanel.style.display = "none";
  toggleBtn.textContent = "+";
});

/* day navigation */
document.getElementById("prev-day").addEventListener("click", () => {
  viewingDate.setDate(viewingDate.getDate() - 1);
  render();
});
document.getElementById("next-day").addEventListener("click", () => {
  if (!canGoForward()) return;
  viewingDate.setDate(viewingDate.getDate() + 1);
  render();
});

/* mode buttons */
document.getElementById("mode-daily").addEventListener("click", () => setMode("daily"));
document.getElementById("mode-weekly").addEventListener("click", () => setMode("weekly"));
document.getElementById("mode-monthly").addEventListener("click", () => setMode("monthly"));

/* swipe support */
let startX = 0;
document.body.addEventListener("touchstart", e => startX = e.touches[0].clientX);
document.body.addEventListener("touchend", e => {
  const endX = e.changedTouches[0].clientX;
  const diff = endX - startX;
  if (Math.abs(diff) < 60) return;
  if (diff < 0 && canGoForward()) {
    viewingDate.setDate(viewingDate.getDate() + 1);
  } else if (diff > 0) {
    viewingDate.setDate(viewingDate.getDate() - 1);
  }
  render();
});

/* ----------------- Edit modal ----------------- */
const modal = document.getElementById("modal");
const editName = document.getElementById("edit-name");
const editColor = document.getElementById("edit-color");
const saveEditBtn = document.getElementById("save-edit");
const cancelEditBtn = document.getElementById("cancel-edit");
const deleteHabitBtn = document.getElementById("delete-habit");

let editingId = null;

function openEditModal(id) {
  const h = habits.find(x => x.id === id);
  if (!h) return;
  editingId = id;
  editName.value = h.name;
  editColor.value = h.color || "#60a5fa";
  modal.classList.remove("hidden");
}

saveEditBtn.addEventListener("click", () => {
  if (!editingId) return;
  const nm = editName.value.trim();
  if (nm.length === 0) return;
  updateHabit(editingId, { name: nm, color: editColor.value });
  editingId = null;
  modal.classList.add("hidden");
});

cancelEditBtn.addEventListener("click", () => {
  editingId = null;
  modal.classList.add("hidden");
});

deleteHabitBtn.addEventListener("click", () => {
  if (!editingId) return;
  if (confirm("Delete this habit? This cannot be undone.")) {
    deleteHabit(editingId);
    editingId = null;
    modal.classList.add("hidden");
  }
});

/* ----------------- Export / Import ----------------- */
document.getElementById("export-data").addEventListener("click", () => {
  const data = { habits, tracking, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `habits-export-${dateKey(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

const importFile = document.getElementById("import-file");
document.getElementById("import-data").addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const obj = JSON.parse(ev.target.result);
      if (obj.habits && obj.tracking) {
        // Merge reasonably: keep existing habit ids; if ids collide, generate new ids
        const existingNames = new Set(habits.map(h=>h.name));
        obj.habits.forEach(h => {
          if (!existingNames.has(h.name)) {
            // adopt imported habit
            h.id = uid();
            habits.push(h);
          }
        });
        // merge tracking (only for habit ids we have)
        Object.keys(obj.tracking || {}).forEach(day => {
          if (!tracking[day]) tracking[day] = {};
          Object.keys(obj.tracking[day]).forEach(importId => {
            // we can't map exact ids reliably; ignore imported tracking unless habit names matched
            // skip for simplicity to avoid wrong mapping
          });
        });
        saveData();
        render();
        alert("Import finished. Habit names were added; tracking data is not mapped to avoid collisions.");
      } else {
        alert("Invalid import file");
      }
    } catch (err) {
      alert("Error reading import file");
    }
  };
  reader.readAsText(f);
});

/* ----------------- Init ----------------- */
loadData();
setMode("daily");

// Pre-populate example habit if empty (optional friendly starter)
if (habits.length === 0) {
  addHabit("Drink water", randomColor());
  addHabit("Read for 20 mins", randomColor());
  addHabit("Exercise", randomColor());
}

render();
