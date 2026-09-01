// Smart To-Do List logic
const STORAGE_KEY = "smartTodoListTasks";

const state = {
  tasks: loadTasks(),
  filter: "all",
  searchTerm: "",
  editingId: null,
};

const todoForm = document.getElementById("todo-form");
const taskTitleInput = document.getElementById("task-title");
const taskPriorityInput = document.getElementById("task-priority");
const taskDueDateInput = document.getElementById("task-due-date");
const submitBtn = document.getElementById("submit-btn");
const formTitle = document.getElementById("form-title");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const clearAllBtn = document.getElementById("clear-all-btn");
const filterButtons = document.querySelectorAll(".filter-btn");

const totalCountEl = document.getElementById("total-count");
const pendingCountEl = document.getElementById("pending-count");
const completedCountEl = document.getElementById("completed-count");

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  } catch (error) {
    console.error("Failed to load tasks from localStorage:", error);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function getVisibleTasks() {
  return state.tasks.filter((task) => {
    const matchesFilter =
      state.filter === "all" ||
      (state.filter === "pending" && !task.completed) ||
      (state.filter === "completed" && task.completed);

    const normalizedSearch = state.searchTerm.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch === "" || task.title.toLowerCase().includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });
}

function updateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((task) => task.completed).length;
  const pending = total - completed;

  totalCountEl.textContent = total;
  pendingCountEl.textContent = pending;
  completedCountEl.textContent = completed;
}

function formatDate(dateString) {
  if (!dateString) return "No due date";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function createTaskId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  if (visibleTasks.length === 0) {
    taskList.innerHTML = "";
    emptyState.classList.remove("hidden");
    updateStats();
    return;
  }

  emptyState.classList.add("hidden");

  taskList.innerHTML = visibleTasks
    .map((task) => {
      const priorityClass = task.priority.toLowerCase();
      const checkedAttribute = task.completed ? "checked" : "";
      const completedClass = task.completed ? "completed" : "";

      return `
        <article class="todo-card ${completedClass}" data-id="${task.id}">
          <div class="todo-main">
            <input
              class="task-toggle"
              type="checkbox"
              data-action="toggle"
              data-id="${task.id}"
              ${checkedAttribute}
              aria-label="Mark task as completed"
            />

            <div class="todo-content">
              <div class="task-header">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <span class="priority-badge ${priorityClass}">${task.priority}</span>
              </div>

              <div class="task-meta">
                <span>Due: ${formatDate(task.dueDate)}</span>
                <span>•</span>
                <span>${task.completed ? "Completed" : "Pending"}</span>
              </div>
            </div>
          </div>

          <div class="task-actions">
            <button class="icon-btn edit" type="button" data-action="edit" data-id="${task.id}" title="Edit task">✎</button>
            <button class="icon-btn delete" type="button" data-action="delete" data-id="${task.id}" title="Delete task">🗑</button>
          </div>
        </article>
      `;
    })
    .join("");

  updateStats();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function resetForm() {
  todoForm.reset();
  taskPriorityInput.value = "Medium";
  state.editingId = null;
  formTitle.textContent = "Add New Task";
  submitBtn.textContent = "Add Task";
  cancelEditBtn.classList.add("hidden");
}

function populateEditForm(task) {
  taskTitleInput.value = task.title;
  taskPriorityInput.value = task.priority;
  taskDueDateInput.value = task.dueDate;
  state.editingId = task.id;
  formTitle.textContent = "Edit Task";
  submitBtn.textContent = "Update Task";
  cancelEditBtn.classList.remove("hidden");
  taskTitleInput.focus();
}

function addTask(taskData) {
  const newTask = {
    id: createTaskId(),
    title: taskData.title.trim(),
    priority: taskData.priority,
    dueDate: taskData.dueDate,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  state.tasks.unshift(newTask);
  saveTasks();
  renderTasks();
}

function updateTask(taskId, updatedData) {
  state.tasks = state.tasks.map((task) => {
    if (task.id === taskId) {
      return {
        ...task,
        title: updatedData.title.trim(),
        priority: updatedData.priority,
        dueDate: updatedData.dueDate,
      };
    }
    return task;
  });

  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  const shouldDelete = window.confirm("Are you sure you want to delete this task?");
  if (!shouldDelete) return;

  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  saveTasks();

  if (state.editingId === taskId) {
    resetForm();
  }

  renderTasks();
}

function toggleTask(taskId) {
  state.tasks = state.tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });

  saveTasks();
  renderTasks();
}

function handleFormSubmit(event) {
  event.preventDefault();

  const title = taskTitleInput.value.trim();
  const priority = taskPriorityInput.value;
  const dueDate = taskDueDateInput.value;

  if (!title) {
    alert("Please enter a task title.");
    taskTitleInput.focus();
    return;
  }

  if (!dueDate) {
    alert("Please select a due date.");
    taskDueDateInput.focus();
    return;
  }

  const taskData = { title, priority, dueDate };

  if (state.editingId) {
    updateTask(state.editingId, taskData);
  } else {
    addTask(taskData);
  }

  resetForm();
}

function handleTaskListClick(event) {
  const target = event.target;
  const action = target.dataset.action;
  const taskId = target.dataset.id;

  if (!action || !taskId) return;

  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  if (action === "toggle") {
    toggleTask(taskId);
    return;
  }

  if (action === "edit") {
    populateEditForm(task);
    return;
  }

  if (action === "delete") {
    deleteTask(taskId);
  }
}

function setActiveFilter(selectedFilter) {
  state.filter = selectedFilter;

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === selectedFilter;
    button.classList.toggle("active", isActive);
  });

  renderTasks();
}

function clearAllTasks() {
  if (state.tasks.length === 0) {
    alert("There are no tasks to clear.");
    return;
  }

  const confirmClear = window.confirm("This will delete all tasks. Continue?");
  if (!confirmClear) return;

  state.tasks = [];
  saveTasks();
  resetForm();
  renderTasks();
}

function initializeFilters() {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveFilter(button.dataset.filter);
    });
  });
}

function initializeSearch() {
  searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    renderTasks();
  });
}

function initializeApp() {
  initializeFilters();
  initializeSearch();
  todoForm.addEventListener("submit", handleFormSubmit);
  taskList.addEventListener("click", handleTaskListClick);
  cancelEditBtn.addEventListener("click", resetForm);
  clearAllBtn.addEventListener("click", clearAllTasks);
  renderTasks();
}

initializeApp();
