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
