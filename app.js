// ------------------ DATA ------------------

let habits = [];
let tracking = {};

function saveData() {
    localStorage.setItem("habits", JSON.stringify(habits));
    localStorage.setItem("tracking", JSON.stringify(tracking));
}

function loadData() {
    habits = JSON.parse(localStorage.getItem("habits")) || [];
    tracking = JSON.parse(localStorage.getItem("tracking")) || {};
}

// ------------------ DATE HANDLING ------------------

let viewingDate = new Date();
let today = new Date();

function formatDate(d) {
    let dow = d.toLocaleDateString("en-GB", { weekday: "short" });
    let day = d.getDate();
    let month = d.toLocaleDateString("en-GB", { month: "short" });

    let suffix = "th";
    if (day % 10 === 1 && day !== 11) suffix = "st";
    else if (day % 10 === 2 && day !== 12) suffix = "nd";
    else if (day % 10 === 3 && day !== 13) suffix = "rd";

    return `${dow} ${day}${suffix} ${month}`;
}

function isSameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function canGoForward() {
    return viewingDate < today;
}

// ------------------ RENDER ------------------

function render() {
    const dateText = document.getElementById("date-text");

    if (isSameDay(viewingDate, today)) {
        dateText.textContent = "Today";
    } else {
        dateText.textContent = formatDate(viewingDate);
    }

    renderHabits();
}

function renderHabits() {
    const list = document.getElementById("habit-list");
    list.innerHTML = "";

    let dateKey = viewingDate.toISOString().split("T")[0];
    if (!tracking[dateKey]) tracking[dateKey] = [];

    habits.forEach(h => {
        const div = document.createElement("div");
        div.className = "habit";

        div.innerHTML = `
            <span>${h}</span>
            <button data-habit="${h}">X</button>
        `;

        div.querySelector("button").addEventListener("click", () => {
            habits = habits.filter(x => x !== h);
            saveData();
            render();
        });

        list.appendChild(div);
    });
}

// ------------------ BOTTOM BAR UI ------------------

const toggleBtn = document.getElementById("add-toggle");
const input = document.getElementById("new-habit-input");
const confirmAdd = document.getElementById("confirm-add");

let panelOpen = false;

toggleBtn.addEventListener("click", () => {
    panelOpen = !panelOpen;

    if (panelOpen) {
        toggleBtn.textContent = "−";
        confirmAdd.textContent = "✓";
        input.style.display = "block";
        confirmAdd.style.display = "block";
        input.focus();
    } else {
        toggleBtn.textContent = "+";
        input.style.display = "none";
        confirmAdd.style.display = "none";
    }
});

confirmAdd.addEventListener("click", () => {
    const text = input.value.trim();
    if (text.length === 0) return;

    habits.push(text);
    input.value = "";

    saveData();
    render();

    // Hide UI
    panelOpen = false;
    toggleBtn.textContent = "+";
    input.style.display = "none";
    confirmAdd.style.display = "none";
});

// ------------------ DAY NAVIGATION ------------------

document.getElementById("prev-day").addEventListener("click", () => {
    viewingDate.setDate(viewingDate.getDate() - 1);
    render();
});

document.getElementById("next-day").addEventListener("click", () => {
    if (!canGoForward()) return;
    viewingDate.setDate(viewingDate.getDate() + 1);
    render();
});

// ------------------ SWIPE ------------------

let startX = 0;

document.body.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
});

document.body.addEventListener("touchend", e => {
    let endX = e.changedTouches[0].clientX;
    let diff = endX - startX;

    if (Math.abs(diff) < 60) return;

    if (diff < 0 && canGoForward()) {
        viewingDate.setDate(viewingDate.getDate() + 1);
        render();
    } else if (diff > 0) {
        viewingDate.setDate(viewingDate.getDate() - 1);
        render();
    }
});

// ------------------ INIT -----------------

loadData();
render();
