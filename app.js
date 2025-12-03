// app.js v3.0

const STORAGE_KEY = "habits_v3";
const TRACKING_KEY = "tracking_v3";

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

    const actions = document.createElement("div");
    actions.className = "actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "action toggle";
    toggleBtn.title = done ? "Mark as not done" : "Mark as done";
    toggleBtn.innerHTML = done ? "✓" : "○";
    toggleBtn.addEventListener("click", async () => {
      await toggleComplete(h.id, viewingDate);
      card.classList.add("done");
      setTimeout(() => { saveData(); render(); }, 140);
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
    moreBtn.addEventListener("click", () => openEditModal(h.id));

    actions.appendChild(toggleBtn);
    actions.appendChild(editBtn);
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

function addHabit(name, color) {
  habits.push({ id: uid(), name, color, createdAt: new Date() });
  saveData();
  render();
}

function updateHabit(id, name, color) {
  const h = habits.find(h=>h.id===id);
  if(h){ h.name=name; h.color=color; saveData(); render(); }
}

function deleteHabit(id) {
  habits = habits.filter(h=>h.id!==id);
  for (let day in tracking) delete tracking[day][id];
  saveData();
  render();
}

/* ---------------- MODAL ---------------- */
const modal = document.getElementById("modal");
const editName = document.getElementById("edit-name");
const editColor = document.getElementById("edit-color");
let editingId = null;

function openEditModal(id) {
  const h = habits.find(h=>h.id===id);
  if(!h) return;
  editingId = id;
  editName.value = h.name;
  editColor.value = h.color;
  modal.classList.remove("hidden");
}
document.getElementById("cancel-edit").onclick = () => modal.classList.add("hidden");
document.getElementById("save-edit").onclick = () => {
  updateHabit(editingId, editName.value, editColor.value);
  modal.classList.add("hidden");
};
document.getElementById("delete-habit").onclick = () => { deleteHabit(editingId); modal.classList.add("hidden"); };

/* ---------------- ADD ---------------- */
document.getElementById("add-toggle").onclick = () => {
  const panel = document.getElementById("add-panel");
  panel.style.display = panel.style.display === "flex" ? "none" : "flex";
};
document.getElementById("confirm-add").onclick = () => {
  const input = document.getElementById("new-habit-input");
  const color = document.getElementById("new-habit-color").value;
  if(input.value.trim()!==""){ addHabit(input.value.trim(), color); input.value=""; }
};

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
  if(view==="habits"){
    habitsPage.classList.remove("hidden");
    statsPage.classList.add("hidden");
    btnHabits.classList.add("active");
    btnStats.classList.remove("active");
  } else {
    habitsPage.classList.add("hidden");
    statsPage.classList.remove("hidden");
    btnHabits.classList.remove("active");
    btnStats.classList.add("active");
    renderStreaks();
    renderOverview();
  }
}

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
    if (!habitsPage.classList.contains("hidden")) return; // only update stats
    renderStreaks();
    renderOverview();
  });
});

function createWeekGrid(centerDate) {
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.gap = "6px";

  // 7-day range centered on viewingDate
  const start = new Date(centerDate);
  start.setDate(start.getDate() - 3); // show 3 days before
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
  const daysInMonth = new Date(centerDate.getFullYear(), centerDate.getMonth() + 1, 0).getDate();
  const startDay = first.getDay(); // 0=Sun

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


// Show/hide the mode buttons depending on the view
function switchView(view) {
  const modeContainer = document.getElementById("view-mode");
  if(view==="habits"){
    habitsPage.classList.remove("hidden");
    statsPage.classList.add("hidden");
    btnHabits.classList.add("active");
    btnStats.classList.remove("active");
    modeContainer.style.display = "none"; // hide on habits page
  } else {
    habitsPage.classList.add("hidden");
    statsPage.classList.remove("hidden");
    btnHabits.classList.remove("active");
    btnStats.classList.add("active");
    modeContainer.style.display = "flex"; // show on stats page
    renderStreaks();
    renderOverview();
  }
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


/* ---------------- INIT ---------------- */
loadData();
render();
