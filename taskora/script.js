const taskInput = document.getElementById("taskInput");
const categorySelect = document.getElementById("categorySelect");
const dueDateInput = document.getElementById("dueDateInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const themeToggle = document.getElementById("themeToggle");
taskList.addEventListener("dragover", handleDragOver);


const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");

const filterButtons = document.querySelectorAll(".filter-btn");

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️ Light Mode";
}

// Toggle Theme
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    themeToggle.textContent = "☀️ Light Mode";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggle.textContent = "🌙 Dark Mode";
    localStorage.setItem("theme", "light");
  }
});

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";
// Ask notification permission
if ("Notification" in window) {
  Notification.requestPermission();
}
renderTasks();

addTaskBtn.addEventListener("click", addTask);

// Filter Button Click
filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    renderTasks();
  });
});

// Add Task
function addTask() {
  const text = taskInput.value.trim();
  const category = categorySelect.value;
  const dueDate = dueDateInput.value;

  if (text === "") {
    alert("Please enter a task.");
    return;
  }

  tasks.push({
    id: Date.now(),
    text,
    category,
    dueDate,
    completed: false
  });

  taskInput.value = "";
  dueDateInput.value = "";

  saveTasks();
  renderTasks();
  setTimeout(checkDueTodayTasks, 500);
  checkDueTodayTasks();
}

// Render Tasks
function renderTasks() {
  taskList.innerHTML = "";
  if (tasks.length === 0) {
  taskList.innerHTML = `
    <div class="empty-message">
      <h3>No tasks yet 🚀</h3>
      <p>Start by adding your first task.</p>
    </div>
  `;

  updateStats();
  return;
}

  let filteredTasks = tasks;

  if (currentFilter === "pending") {
    filteredTasks = tasks.filter(task => !task.completed);
  } else if (currentFilter === "completed") {
    filteredTasks = tasks.filter(task => task.completed);
  } else if (currentFilter !== "all") {
    filteredTasks = tasks.filter(task => task.category === currentFilter);
  }

  filteredTasks.forEach(task => {
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.id = task.id;

    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:start; gap:10px;">
        <div>
          <input type="checkbox"
            ${task.completed ? "checked" : ""}
            onchange="toggleComplete(${task.id})">

          <strong style="
            text-decoration:${task.completed ? "line-through" : "none"};
            color:${task.completed ? "#777" : "#111"};
            margin-left:8px;
          ">
            ${task.text}
          </strong>

          <br><br>

          <small class="badge ${task.category.toLowerCase()}">
            ${task.category}
          </small><br>

          <small class="due-date ${getDueStatus(task.dueDate).className}">
            ${getDueStatus(task.dueDate).text}
          </small>
        </div>

        <div style="display:flex; gap:8px;">
  <button onclick="editTask(${task.id})" title="Edit Task">✏️</button>
  <button onclick="deleteTask(${task.id})" title="Delete Task">🗑️</button>
  </div>
    `;

    li.addEventListener("dragstart", () => {
      li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      updateTaskOrder();
    });

    taskList.appendChild(li);
  });

  updateStats();
}

// Complete Task
function toggleComplete(id) {
  tasks = tasks.map(task =>
    task.id === id
      ? { ...task, completed: !task.completed }
      : task
  );

  saveTasks();
  renderTasks();
}

// Delete Task
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);

  saveTasks();
  renderTasks();
}

// Save
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Stats
function updateStats() {
  const completed = tasks.filter(task => task.completed).length;

  totalTasks.textContent = tasks.length;
  completedTasks.textContent = completed;
  pendingTasks.textContent = tasks.length - completed;
}
function getDueStatus(date) {
  if (!date) {
    return {
      text: "No Date",
      className: "no-date"
    };
  }

  const today = new Date();
  const due = new Date(date);

  today.setHours(0,0,0,0);
  due.setHours(0,0,0,0);

  if (due < today) {
    return {
      text: "🔴 Overdue",
      className: "overdue"
    };
  }

  if (due.getTime() === today.getTime()) {
    return {
      text: "🟠 Due Today",
      className: "today"
    };
  }

  return {
    text: "🟢 " + date,
    className: "upcoming"
  };
}
function handleDragOver(e) {
  e.preventDefault();

  const draggingItem = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(taskList, e.clientY);

  if (afterElement == null) {
    taskList.appendChild(draggingItem);
  } else {
    taskList.insertBefore(draggingItem, afterElement);
  }
}

function getDragAfterElement(container, y) {
  const items = [...container.querySelectorAll("li:not(.dragging)")];

  return items.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateTaskOrder() {
  const ids = [...taskList.querySelectorAll("li")].map(li =>
    Number(li.dataset.id)
  );

  tasks.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

  saveTasks();
}

function editTask(id) {
  const task = tasks.find(task => task.id === id);

  const newText = prompt("Edit your task:", task.text);

  if (newText === null) return;

  const updatedText = newText.trim();

  if (updatedText === "") {
    alert("Task cannot be empty.");
    return;
  }

  task.text = updatedText;

  saveTasks();
  renderTasks();
}

function checkDueTodayTasks() {
  const today = new Date();
  today.setHours(0,0,0,0);

  const dueToday = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;

    const due = new Date(task.dueDate);
    due.setHours(0,0,0,0);

    return due.getTime() === today.getTime();
  });

  if (dueToday.length > 0) {
    alert(`🔔 You have ${dueToday.length} task(s) due today!`);

    if (Notification.permission === "granted") {
      new Notification("Taskora Reminder", {
        body: `${dueToday.length} task(s) are due today.`,
      });
    }
  }
}