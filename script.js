const STORAGE_KEY = "daybook-tasks";
const filters = new Set(["all", "active", "completed"]);
const taskList = document.querySelector("#task-list");
const taskInput = document.querySelector("#task-input");
const addForm = document.querySelector("#add-form");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyCopy = document.querySelector("#empty-copy");
const clearCompletedButton = document.querySelector("#clear-completed");
let currentFilter = "all";

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);
  if (!savedTasks) return [];

  try {
    const parsedTasks = JSON.parse(savedTasks);
    if (!Array.isArray(parsedTasks)) throw new TypeError("Saved tasks must be an array.");
    return parsedTasks.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean",
    );
  } catch (error) {
    console.error("Could not read the saved todo list. Starting with an empty list.", error);
    return [];
  }
}

let tasks = loadTasks();

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Could not save your todo list in this browser.", error);
    document.querySelector("#remaining-label").textContent =
      "Couldn't save changes — check your browser's storage settings.";
  }
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " is-completed" : ""}`;

  const toggleButton = document.createElement("button");
  toggleButton.className = "task-toggle";
  toggleButton.type = "button";
  toggleButton.setAttribute("aria-label", task.completed ? "Mark task as in progress" : "Mark task as completed");
  toggleButton.setAttribute("aria-pressed", String(task.completed));
  if (task.completed) {
    toggleButton.innerHTML = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8 3 3 6-6" /></svg>';
  }
  toggleButton.addEventListener("click", () => {
    task.completed = !task.completed;
    saveTasks();
    render();
  });

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "task-delete";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Delete task: ${task.text}`);
  deleteButton.textContent = "×";
  deleteButton.addEventListener("click", () => {
    tasks = tasks.filter((entry) => entry.id !== task.id);
    saveTasks();
    render();
  });

  item.append(toggleButton, text, deleteButton);
  return item;
}

function render() {
  const completedCount = tasks.filter((task) => task.completed).length;
  const activeCount = tasks.length - completedCount;
  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  taskList.replaceChildren(...visibleTasks.map(createTaskElement));
  document.querySelector("#task-count").textContent = String(tasks.length);
  document.querySelector("#all-count").textContent = String(tasks.length);
  document.querySelector("#active-count").textContent = String(activeCount);
  document.querySelector("#completed-count").textContent = String(completedCount);
  document.querySelector("#progress-count").innerHTML =
    `${completedCount}<span> / ${tasks.length}</span>`;
  document.querySelector("#remaining-label").textContent =
    activeCount === 0 && tasks.length > 0
      ? "Everything on your list is done"
      : activeCount === 0
        ? "Nothing on the list just yet"
        : `${activeCount} ${activeCount === 1 ? "task" : "tasks"} left to do`;

  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  const progressBar = document.querySelector(".progress-track");
  document.querySelector("#progress-fill").style.width = `${progress}%`;
  progressBar.setAttribute("aria-valuenow", String(progress));
  document.querySelector("#progress-message").textContent =
    progress === 100 && tasks.length > 0
      ? "Look at you go. You did it!"
      : activeCount > 0
        ? "Keep going, you're doing great."
        : "Every big thing starts small.";

  const isEmpty = visibleTasks.length === 0;
  emptyState.hidden = !isEmpty;
  if (isEmpty && tasks.length > 0) {
    emptyTitle.textContent = currentFilter === "active" ? "Nothing left to do." : "No completed tasks yet.";
    emptyCopy.textContent = currentFilter === "active"
      ? "You've made it through your whole list. Nice work!"
      : "Finish a task and it will show up here.";
  } else {
    emptyTitle.textContent = "Your day is a blank page.";
    emptyCopy.textContent = "Add your first task above and make it a good one.";
  }

  clearCompletedButton.hidden = completedCount === 0;
}

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }

  tasks.unshift({ id: crypto.randomUUID(), text, completed: false });
  currentFilter = "all";
  document.querySelectorAll(".filter-button").forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  saveTasks();
  render();
  addForm.reset();
  taskInput.focus();
});

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    if (!filters.has(filter)) return;
    currentFilter = filter;
    document.querySelectorAll(".filter-button").forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });
    render();
  });
});

clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

document.querySelector("#today-date").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date()).toUpperCase();

render();
