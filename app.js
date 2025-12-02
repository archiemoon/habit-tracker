///
// DATA SYSTEM
///

function loadData() {
    const saved = localStorage.getItem("habitData");
    if (saved) {
        return JSON.parse(saved);
    }
    return { habits: [], tracking: {} };
}

function saveData(data) {
    localStorage.setItem("habitData", JSON.stringify(data));
}

function addHabit(name) {
    const data = loadData();

    const newHabit = {
        id: Date.now(),
        name: name
    };

    data.habits.push(newHabit);
    saveData(data);

    return newHabit;
}

function removeHabit(id) {
    const data = loadData();

    data.habits = data.habits.filter(h => h.id !== id);

    for (const date in data.tracking) {
        delete data.tracking[date][id];
    }

    saveData(data);
}

function toggleHabit(habitId, date) {
    const data = loadData();

    if (!data.tracking[date]) {
        data.tracking[date] = {};
    }

    const current = data.tracking[date][habitId];
    data.tracking[date][habitId] = !current;

    saveData(data);
}

function getTrackingForDate(date) {
    const data = loadData();
    return data.tracking[date] || {};
}


///
// Logic
///

let currentDate = new Date();

function formatDate(date) {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];

    // Add suffix: 1st, 2nd, 3rd, 4th...
    let suffix = "th";
    if (dayNum % 10 === 1 && dayNum !== 11) suffix = "st";
    else if (dayNum % 10 === 2 && dayNum !== 12) suffix = "nd";
    else if (dayNum % 10 === 3 && dayNum !== 13) suffix = "rd";

    return `${dayName} ${dayNum}${suffix} ${monthName}`;
}


function getDateLabel(date) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    ) return "Today";

    if (
        date.getFullYear() === yesterday.getFullYear() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate()
    ) return "Yesterday";

    // fallback to formatted date
    return formatDate(date);
}


function updateNavButtons() {
    const nextBtn = document.getElementById("next-day");

    // Enable by default
    nextBtn.disabled = false;

    // Disable only if currentDate is today or after today
    const today = new Date();
    // Remove time portion for comparison
    const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (current >= now) {
        nextBtn.disabled = true;
    }
}


function renderDailyView() {
    const data = loadData();
    
    const dateDisplay = document.getElementById("date-display");
    const dateStr = formatDate(currentDate); // FIXED

    dateDisplay.textContent = getDateLabel(currentDate);

    const habitListDiv = document.getElementById("habits-list");
    habitListDiv.innerHTML = ""; // FIXED name to match HTML

    const habits = data.habits;
    const tracking = data.tracking[dateStr] || {}; // FIXED

    habits.forEach(habit => {
        const habitDiv = document.createElement("div");
        habitDiv.className = "habit-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = tracking[habit.id] || false;

        checkbox.addEventListener("change", () => {
            toggleHabit(habit.id, dateStr);
            renderDailyView();
        });

        const label = document.createElement("span");
        label.textContent = habit.name;

        habitDiv.appendChild(checkbox);
        habitDiv.appendChild(label);

        habitListDiv.appendChild(habitDiv);
    });
    updateNavButtons();
}

document.getElementById("add-habit-btn").addEventListener("click", () => {
    const nameInput = document.getElementById("new-habit-name");
    const name = nameInput.value.trim();

    if (name !== "") {
        addHabit(name);
        nameInput.value = "";
        renderDailyView();
    }
});

document.getElementById("prev-day").addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 1);
    renderDailyView();
});

document.getElementById("next-day").addEventListener("click", () => {
    const today = new Date();
    const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (current < now) {
        currentDate.setDate(currentDate.getDate() + 1);
        renderDailyView();
    }
});

let touchStartX = 0;

document.addEventListener('touchstart', (e) => {
touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
const touchEndX = e.changedTouches[0].screenX;
const diff = touchEndX - touchStartX;

  if (Math.abs(diff) > 50) { // threshold
    if (diff > 0) {
      // swipe right → previous day
    currentDate.setDate(currentDate.getDate() - 1);
    renderDailyView();
    } else {
      // swipe left → next day
    const today = new Date();
    const current = new Date(currentDate.getFullYear(), currentDate.getMonth(),

    currentDate.getDate());

    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (current < now) {
        currentDate.setDate(currentDate.getDate() + 1);
        renderDailyView();
    }
    }
}
});


renderDailyView();