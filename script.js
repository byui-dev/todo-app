// localStorage key for persisting tasks across sessions
const STORAGE_KEY = 'todoApp.v1';

// DOM element references
const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const dateInput = document.getElementById('task-date');
const priorityInput = document.getElementById('task-priority');
const taskList = document.getElementById('task-list');
const filters = document.querySelectorAll('.filter');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');
const statsEl = document.getElementById('stats');
const clearCompletedBtn = document.getElementById('clear-completed');

// Application state: tasks array and UI filters/search/sort
let tasks = loadTasks();
let state = { filter: 'all', query: '', sort: 'manual' };

// Initial render on page load
render();

/**
 * Handle new task submission
 * Validates input, creates task object with unique ID, adds to array, saves & re-renders
 */
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return titleInput.focus();
  const newTask = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title,
    due: dateInput.value || null,
    priority: priorityInput.value || 'medium',
    completed: false,
    createdAt: Date.now()
  };
  tasks.unshift(newTask);
  saveAndRender();
  taskForm.reset();
  titleInput.focus();
});

/**
 * Handle filter button clicks (All/Active/Completed)
 * Updates active state visually and triggers re-render with new filter
 */
filters.forEach(btn => btn.addEventListener('click', () => {
  filters.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.filter = btn.dataset.filter;
  render();
}));

/**
 * Handle search input changes
 * Updates search query state and triggers filtered re-render
 */
searchInput.addEventListener('input', () => {
  state.query = searchInput.value.trim().toLowerCase();
  render();
});

/**
 * Handle sort dropdown changes
 * Updates sort method and triggers re-render with new sort order
 */
sortSelect.addEventListener('change', () => {
  state.sort = sortSelect.value;
  render();
});

/**
 * Handle clear completed button click
 * Removes all completed tasks from array and updates UI
 */
clearCompletedBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.completed);
  saveAndRender();
});

/**
 * save()
 * Persists current tasks array to browser localStorage as JSON
 * Includes error handling for quota or permission issues
 */
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
}

/**
 * loadTasks()
 * Retrieves tasks from localStorage and parses JSON
 * Returns empty array if key not found or JSON parse fails
 * @returns {Array} Array of task objects or empty array
 */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load tasks', e);
    return [];
  }
}

/**
 * saveAndRender()
 * Convenience function: saves tasks to storage, then re-renders UI
 * Called after any state-changing operation (add, delete, edit, toggle)
 */
function saveAndRender() {
  save();
  render();
}

/**
 * render()
 * Main rendering function: filters, searches, sorts tasks, then rebuilds DOM
 * Steps: filter by state.filter (all/active/completed) → search by query → sort → build UI → update stats
 */
function render() {
  let list = [...tasks];

  // Apply active/completed filter
  if (state.filter === 'active') list = list.filter(t => !t.completed);
  if (state.filter === 'completed') list = list.filter(t => t.completed);

  // Apply search query filter (case-insensitive title match)
  if (state.query) {
    list = list.filter(t => (t.title || '').toLowerCase().includes(state.query));
  }

  // Apply sort order
  if (state.sort === 'due-asc') {
    list.sort((a, b) => (a.due || '') > (b.due || '') ? 1 : -1);
  } else if (state.sort === 'due-desc') {
    list.sort((a, b) => (a.due || '') < (b.due || '') ? 1 : -1);
  } else if (state.sort === 'priority-desc') {
    const rank = { high: 3, medium: 2, low: 1 };
    list.sort((a, b) => (rank[b.priority] || 0) - (rank[a.priority] || 0));
  }

  // Clear task list and rebuild with filtered/sorted items
  taskList.innerHTML = '';
  list.forEach(task => taskList.appendChild(renderTaskItem(task)));
  
  // Update stats: total count and completed count
  statsEl.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''} • ${tasks.filter(t => t.completed).length} completed`;
}

/**
 * renderTaskItem(task)
 * Creates a DOM element (list item) for a single task
 * Includes checkbox, title, due date, priority badge, and edit/delete buttons
 * @param {Object} task - Task object with id, title, due, priority, completed, etc.
 * @returns {HTMLElement} Constructed <li> element
 */
function renderTaskItem(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' completed' : '');
  li.dataset.id = task.id;

  const left = document.createElement('div');
  left.className = 'left';

  // Checkbox button to toggle completion status
  const chk = document.createElement('button');
  chk.className = 'checkbox';
  chk.setAttribute('aria-pressed', String(!!task.completed));
  chk.title = task.completed ? 'Mark as active' : 'Mark as completed';
  chk.addEventListener('click', () => {
    task.completed = !task.completed;
    saveAndRender();
  });
  chk.innerHTML = task.completed ? '✓' : '';

  // Task title and metadata (due date + priority badge)
  const titleWrap = document.createElement('div');
  titleWrap.style.minWidth = '0';
  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;

  const meta = document.createElement('div');
  meta.className = 'meta';
  
  // Display due date if set
  if (task.due) {
    const due = document.createElement('span');
    due.textContent = `Due: ${task.due}`;
    meta.appendChild(due);
  }
  
  // Display priority badge (low/medium/high)
  const badge = document.createElement('span');
  badge.className = `badge ${task.priority}`;
  badge.textContent = task.priority;
  meta.appendChild(badge);

  titleWrap.appendChild(title);
  titleWrap.appendChild(meta);

  left.appendChild(chk);
  left.appendChild(titleWrap);

  // Edit and delete action buttons
  const actions = document.createElement('div');
  actions.className = 'actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'icon-btn';
  editBtn.title = 'Edit';
  editBtn.innerHTML = '✎';
  editBtn.addEventListener('click', () => startEdit(task, li));

  const delBtn = document.createElement('button');
  delBtn.className = 'icon-btn';
  delBtn.title = 'Delete';
  delBtn.innerHTML = '🗑';
  delBtn.addEventListener('click', () => {
    if (confirm('Delete this task?')) {
      tasks = tasks.filter(t => t.id !== task.id);
      saveAndRender();
    }
  });

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  // Assemble and return the list item
  li.appendChild(left);
  li.appendChild(actions);

  return li;
}

/**
 * startEdit(task, li)
 * Replaces task list item with inline edit form
 * Allows user to modify title, due date, and priority
 * On save, updates task object and re-renders; on cancel, reverts to view mode
 * @param {Object} task - Task object to edit
 * @param {HTMLElement} li - The <li> element to replace with edit form
 */
function startEdit(task, li) {
  // Clear existing content and create edit form
  li.innerHTML = '';
  const editForm = document.createElement('form');
  editForm.className = 'task-item';
  editForm.style.display = 'flex';
  editForm.style.gap = '8px';
  editForm.style.alignItems = 'center';

  // Title input field
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = task.title;
  titleInput.required = true;
  titleInput.style.flex = '1';
  titleInput.style.padding = '8px';
  titleInput.style.borderRadius = '6px';
  titleInput.style.border = '1px solid #ddd';

  // Due date input field
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.value = task.due || '';

  // Priority dropdown select
  const prioritySelect = document.createElement('select');
  ['low', 'medium', 'high'].forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    if (p === task.priority) opt.selected = true;
    prioritySelect.appendChild(opt);
  });

  // Save button (form submit)
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn';
  saveBtn.type = 'submit';
  saveBtn.textContent = 'Save';

  // Cancel button (form reset without saving)
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn small';
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';

  editForm.appendChild(titleInput);
  editForm.appendChild(dateInput);
  editForm.appendChild(prioritySelect);
  editForm.appendChild(saveBtn);
  editForm.appendChild(cancelBtn);

  // Handle form submission: validate, update task, save & render
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTitle = titleInput.value.trim();
    if (!newTitle) return titleInput.focus();
    task.title = newTitle;
    task.due = dateInput.value || null;
    task.priority = prioritySelect.value;
    saveAndRender();
  });

  // Handle cancel: discard changes and re-render to view mode
  cancelBtn.addEventListener('click', () => render());

  li.appendChild(editForm);
  titleInput.focus();
}
