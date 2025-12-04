// app.js v4.0 simplified

const STORAGE_KEY = "habits_v4";
const TRACKING_KEY = "tracking_v4";

let habits = [];
let tracking = {};

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

/* ---------------- DATE ---------------- */
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
  const vk = new Date(viewingDate.getFullYear(), viewingDate.getMonth(), viewingDate.getDate());
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return vk < t;
}

/* swipe support */
let startX = 0;
document.body.addEventListener("touchstart", e => startX = e.touches[0].clientX);
document.body.addEventListener("touchend", e => {
  const endX = e.changedTouches[0].clientX;
  const diff = endX - startX;
  if (Math.abs(diff) < 60) return;
  if (diff < 0 && canGoForward()) viewingDate.setDate(viewingDate.getDate() + 1);
  else if (diff > 0) viewingDate.setDate(viewingDate.getDate() - 1);
  render();
});

/* ---------------- RENDER ---------------- */
const dateText = () => document.getElementById("date-text");
const habitListEl = () => document.getElementById("habit-list");

function render() {
  if (isSameDay(viewingDate, today)) dateText().textContent = "Today";
  else dateText().textContent = formatDateLong(viewingDate);

  document.getElementById("next-day").style.opacity = canGoForward() ? "1" : "0.35";

  if (!habitsPage.classList.contains("hidden")) renderHabits();
  else { renderStreaks(); renderOverview(); }
}

function ensureDateKey(key) {
  if (!tracking[key]) tracking[key] = {};
}

function renderHabits() {
  const list = habitListEl();
  list.innerHTML = "";
  const dKey = dateKey(viewingDate);
  ensureDateKey(dKey);

  if (habits.length === 0) {
    const hint = document.createElement("div");
    hint.className = "panel glass";
    hint.style.color = "white";
    hint.textContent = "No habits yet — why dont we add one!";
    list.appendChild(hint);
    return;
  }

  habits.forEach(h => {
    const done = !!(tracking[dKey] && tracking[dKey][h.id]);
    const card = document.createElement("div");
    card.className = "habit panel glass" + (done ? " done" : "");

    const left = document.createElement("div");
    left.className = "left";

    const meta = document.createElement("div");
    meta.className = "meta";

    const name = document.createElement("div");
    name.className = "habit-name" + (done ? " done" : "");
    name.textContent = h.name;

    meta.appendChild(name);
    left.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "action toggle";
    toggleBtn.title = done ? "Mark as not done" : "Mark as done";
    toggleBtn.innerHTML = done ? "✓" : "○";
    toggleBtn.addEventListener("click", async () => {
      await toggleComplete(h.id, viewingDate);
      card.classList.add("done");
      setTimeout(() => { 
        saveData(); render(); 
      }, 140);
    });

    const moreBtn = document.createElement("button");
    moreBtn.className = "action";
    moreBtn.title = "More";
    moreBtn.textContent = "⋯";
    moreBtn.addEventListener("click", () => openEditModal(h.id));

    actions.appendChild(toggleBtn);
    actions.appendChild(moreBtn);

    card.appendChild(left);
    card.appendChild(actions);

    list.appendChild(card);
  });
}

/* ---------------- CRUD ---------------- */
function toggleComplete(hid, date) {
  const dKey = dateKey(date);
  ensureDateKey(dKey);
  tracking[dKey][hid] = !tracking[dKey][hid];
  saveData();
  return Promise.resolve();
}

function addHabit(name) {
  habits.push({ id: uid(), name, createdAt: new Date() });
  saveData();
  render();
}

function deleteHabit(id) {
  habits = habits.filter(h=>h.id!==id);
  for (let day in tracking) delete tracking[day][id];
  saveData();
  render();
}

/* ---------------- NAV ---------------- */
document.getElementById("prev-day").onclick = () => { viewingDate.setDate(viewingDate.getDate()-1); render(); };
document.getElementById("next-day").onclick = () => { if(canGoForward()){ viewingDate.setDate(viewingDate.getDate()+1); render(); } };

/* ---------------- VIEW SWITCHER ---------------- */
const btnHabits = document.getElementById("btn-habits");
const btnStats = document.getElementById("btn-stats");
const habitsPage = document.getElementById("habits-page");
const statsPage = document.getElementById("stats-page");

btnHabits.addEventListener("click", () => switchView("habits"));
btnStats.addEventListener("click", () => switchView("stats"));

function switchView(view) {
  const modeContainer = document.getElementById("mode-switcher");
  if(view==="habits"){
    habitsPage.classList.remove("hidden");
    statsPage.classList.add("hidden");
    btnHabits.classList.add("active");
    btnStats.classList.remove("active");
    modeContainer.style.display = "none";
  } else {
    habitsPage.classList.add("hidden");
    statsPage.classList.remove("hidden");
    btnHabits.classList.remove("active");
    btnStats.classList.add("active");
    modeContainer.style.display = "flex";
    renderStreaks();
    renderOverview();
  }
}

/* ---------------- MODAL ---------------- */
const modal = document.getElementById("modal");
const editName = document.getElementById("edit-name");
let editingId = null;

function openEditModal(id) {
  const h = habits.find(h=>h.id===id);
  if(!h) return;
  editingId = id;
  editName.value = h.name;
  modal.classList.remove("hidden");
}
document.getElementById("cancel-edit").onclick = () => modal.classList.add("hidden");
document.getElementById("save-edit").onclick = () => {
  updateHabit(editingId, editName.value);
  modal.classList.add("hidden");
};
document.getElementById("delete-habit").onclick = () => { deleteHabit(editingId); modal.classList.add("hidden"); };


/* ---------------- STATS ---------------- */
function getStreaks() {
  const streaks = habits.map(h=>{
    let max=0, cur=0;
    const sortedDays = Object.keys(tracking).sort();
    sortedDays.forEach(d=>{
      if(tracking[d][h.id]) cur++; else cur=0;
      if(cur>max) max=cur;
    });
    return { name:h.name, streak:max };
  });
  return streaks.sort((a,b)=>b.streak-a.streak);
}

function renderStreaks() {
  const el = document.getElementById("streaks-list");
  el.innerHTML="";
  const streaks = getStreaks();
  streaks.forEach(s=>{
    const div = document.createElement("div");
    div.textContent = `${s.name}: ${s.streak} day${s.streak!==1?"s":""}`;
    el.appendChild(div);
  });
}

// Add a variable to track stats period
let statsPeriod = "daily";

// Mode buttons
const modeButtons = document.querySelectorAll(".mode-btn");

modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    modeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    statsPeriod = btn.id.replace("mode-", ""); // "daily", "weekly", "monthly"
    if (!habitsPage.classList.contains("hidden")) return;
    renderStreaks();
    renderOverview();
  });
});

function createWeekGrid(centerDate) {
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.gap = "6px";

  const today = new Date();
  today.setHours(0,0,0,0);

  // Find Monday
  const start = new Date(centerDate);
  const day = start.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  start.setDate(start.getDate() + diff);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setHours(0,0,0,0);
    d.setDate(start.getDate() + i);

    const k = dateKey(d);
    const doneCount = tracking[k] ? Object.values(tracking[k]).filter(Boolean).length : 0;
    const total = habits.length || 1;
    const pct = Math.round((doneCount / total) * 100);

    const cell = document.createElement("div");
    cell.style.width = "44px";
    cell.style.height = "44px";
    cell.style.borderRadius = "10px";
    cell.style.display = "flex";
    cell.style.flexDirection = "column";
    cell.style.alignItems = "center";
    cell.style.justifyContent = "center";
    cell.style.fontSize = "12px";
    cell.style.fontWeight = "700";
    cell.style.color = "white";
    cell.style.cursor = "default";
    cell.style.border = `1px solid rgba(255,255,255,0.08)`;
    cell.style.transition = "0.25s ease";

    // --- CHECK IF THIS IS THE SELECTED DAY ---
    const isSelected =
      d.getFullYear() === centerDate.getFullYear() &&
      d.getMonth() === centerDate.getMonth() &&
      d.getDate() === centerDate.getDate();

    // --- CHECK IF THIS DATE IS IN THE FUTURE ---
    const isFuture = d > today;

    if (isSelected) {
      // Highlight effect
      cell.style.background = `rgba(255, 255, 255, 0.25)`;
      cell.style.boxShadow = `0 0 12px rgba(255, 255, 255, 0.45) inset`;
      cell.style.border = `1px solid rgba(255, 255, 255, 0.5)`;
      cell.style.scale = "1.08";
    } 
    else if (isFuture) {
      // FUTURE DAYS (greyed out)
      cell.style.opacity = "0.45";
      cell.style.color = "rgba(255,255,255,0.4)";
      cell.style.background = `rgba(255,255,255,0.04)`;
      cell.style.border = `1px solid rgba(255,255,255,0.04)`;
      cell.style.filter = "grayscale(100%)";
      cell.style.pointerEvents = "none";   // disables clicking
    }
    else {
      // Normal days
      cell.style.background =
        `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.03))`;
    }

    cell.innerHTML =
      `<div style="font-weight:600">${d.toLocaleDateString("en-GB",{ weekday:"short" })}</div>
      <div style="font-size:11px;margin-top:4px">${pct}%</div>`;

    wrapper.appendChild(cell);
  }

  return wrapper;
}

function createMonthGrid(centerDate) {
  const wrapper = document.createElement("div");
  wrapper.style.display = "grid";
  wrapper.style.gridTemplateColumns = "repeat(7, 1fr)";
  wrapper.style.gap = "6px";

  /* --- WEEKDAY HEADER ROW --- */
  const weekdayInitials = ["S", "M", "T", "W", "T", "F", "S"];
  weekdayInitials.forEach(letter => {
    const head = document.createElement("div");
    head.textContent = letter;
    head.style.textAlign = "center";
    head.style.fontWeight = "700";
    head.style.fontSize = "14px";
    head.style.color = "white";
    head.style.opacity = "0.75";
    head.style.marginBottom = "4px";
    wrapper.appendChild(head);
  });

  /* --- MONTH GRID CELLS --- */
  const first = new Date(centerDate.getFullYear(), centerDate.getMonth(), 1);
  const daysInMonth = new Date(centerDate.getFullYear(), centerDate.getMonth() + 1, 0).getDate();

  // getDay() still works — but we offset because there’s now a header row
  const startDay = first.getDay();

  // Add blank boxes before day 1
  for (let i = 0; i < startDay; i++) {
    const blank = document.createElement("div");
    blank.style.height = "48px";
    wrapper.appendChild(blank);
  }

  // Add each day cell
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
    cell.style.cursor = "default";
    cell.style.background = `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.03))`;
    cell.style.border = `1px solid rgba(255,255,255,0.06)`;

    cell.innerHTML = `
      <div style="text-align:center">
        <div style="font-weight:700">${d}</div>
        <div style="font-size:11px;margin-top:6px">${pct}%</div>
      </div>
    `;

    wrapper.appendChild(cell);
  }

  return wrapper;
}

function renderOverview() {
  const container = document.getElementById("overview-content");
  container.innerHTML = "";

  if (statsPeriod === "daily") {
    container.textContent = `${habits.length} habits`;
    return;
  }

  if (statsPeriod === "weekly") {
    container.appendChild(createWeekGrid(viewingDate));
    return;
  }

  if (statsPeriod === "monthly") {
    container.appendChild(createMonthGrid(viewingDate));
    return;
  }
}

/* ---------------- ADD HABIT ---------------- */
document.getElementById("add-button").onclick = () => {
  const input = document.getElementById("new-habit-input");
  if (input.value.trim() !== "") {
    addHabit(input.value.trim());
    input.value = "";
  }
};

/* ---------------- INIT ---------------- */
loadData();
render();
