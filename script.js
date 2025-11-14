const STORAGE_KEY = 'todoApp.v1';

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

let tasks = loadTasks();
let state = { filter: 'all', query: '', sort: 'manual' };

render();

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
    created: Date.now()
  };
  tasks.unshift(newTask);
  saveAndRender();
  taskForm.reset();
  titleInput.focus();
});

filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.filter = btn.dataset.filter;
    render();
}));

searchInput.addEventListener('input', () => {
  state.query = searchInput.value.trim().toLowerCase();
  render();
});

sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    render();
});

clearCompletedBtn.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.completed);
    saveAndRender();
});

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
}

function saveAndRender() {
  save();
  render();
}

function render() {
    let list = [...tasks];
    
// Filter
    if (state.filter === 'active') list.filter(t => !t.completed);
    if (state.filter === 'completed') list = list.filter(t => t.completed);    

// Search
 if (state.query) {
   list = list.filter(t => (t.title || '').toLowerCase().includes(state.query));
}

// Sort 
if (state.sort === 'due-asc') {
  list.sort((a, b) => (a.due || '') > (b.due || '') ? 1 : -1);
} else if (state.sort === 'due-desc') {
  list.sort((a, b) => (a.due || '') < (b.due || '') ? 1 : -1);
} else if (state.sort === 'priority-desc') {
  const rank = { high: 3, medium: 2, low: 1 };
  list.sort((a, b) => (rank[b.priority]||0) - (rank[a.priority]||0));
}

taskList.innerHTML = '';
  list.forEach(task => taskList.appendChild(renderTaskItem(task)));  
  statsEl.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''} • ${tasks.filter(t=>t.completed).length} completed`;
}

function renderTaskItem(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' completed' : '');
  li.dataset.id = task.id;

  const left = document.createElement('div');
  left.className = 'left';  

  const chk = document.createElement('button');
  chk.className = 'checkbox';
  chk.setAttribute('aria-pressed', String(!!task.completed)); 
  chk.title = task.completed ? 'Mark as active' : 'Mark as completed';
  chk.addEventListener('click', () => {
    task.completed = !task.completed;
    saveAndRender();
  });
  chk.innerHTML = task.completed ? '✔️' : '';

  const titleWrap = document.createElement('div');
  titleWrap.style.minWidth = '0';
  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;

  const meta = document.createElement('div');
  meta.className = 'meta';
  if (task.due) {
    const due = document.createElement('span');
    due.textContent = 'Due: ${task.due}'; 
    meta.appendChild(due);
  }
  const badge = document.createElement('span');
  badge.className = `badge ${task.priority}`;
  badge.textContent = task.priority;
  meta.appendChild(badge);

  titleWrap.appendChild(title);
  titleWrap.appendChild(meta);

  left.appendChild(chk);
  left.appendChild(titleWrap);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'icon-btn';
  editBtn.title = 'Edit task';
  editBtn.innerHTML = '✏️';
  editBtn.addEventListener('click', () => startEdit(task, li));

  const delBtn = document.createElement('button');
  delBtn.className = 'icon-btn';
  delBtn.title = 'Delete';
  delBtn.innerHTML = '🗑️';
  delBtn.addEventListener('click', () => {
    if (confirm('Delete this task?')) {
      tasks = tasks.filter(t => t.id !== task.id);
      saveAndRender();
    }
  });

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  li.appendChild(left);
  li.appendChild(actions);

  return li;
}

function startEdit(task, li) {
// Replace content with inline form
  li.innerHTML = '';
  const editForm = document.createElement('form');
  editForm.className = 'task-item';
  editForm.style.gap = '8px';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = task.title;
  titleInput.required = true;
  titleInput.style.flex = '1';
  titleInput.style.padding = '8px';
  titleInput.style.borderRadius = '6px';
  titleInput.style.border = '1px solid #ddd';

  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.value = task.due || '';

  const prioritySelect = document.createElement('select');
  ['low', 'medium', 'high'].forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    if (p === task.priority) opt.selected = true;
    prioritySelect.appendChild(opt);
  });

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn';
  saveBtn.type = 'submit';
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn small';
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';

  editForm.appendChild(titleInput);
  editForm.appendChild(dateInput);
  editForm.appendChild(prioritySelect);
  editForm.appendChild(saveBtn);
  editForm.appendChild(cancelBtn);

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTitle = titleInput.value.trim();
    if (!newTitle) return titleInput.focus();
    task.title = newTitle;
    task.due = dateInput.value || null;
    task.priority = prioritySelect.value;
    saveAndRender();
  });
    
  cancelBtn.addEventListener('click', () => render());

  li.appendChild(editForm);
  titleInput.focus();
}
// filepath: c:\Users\pc\Desktop\todo-app\script.js
// ... existing code to be added ...
const STORAGE_KEY = 'todoApp.v1';

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

let tasks = loadTasks();
let state = { filter: 'all', query: '', sort: 'manual' };

render();

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
    created: Date.now()
  };
  tasks.unshift(newTask);
  saveAndRender();
  taskForm.reset();
  titleInput.focus();
});

filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.filter = btn.dataset.filter;
    render();
}));

searchInput.addEventListener('input', () => {
  state.query = searchInput.value.trim().toLowerCase();
  render();
});

sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    render();
});

clearCompletedBtn.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.completed);
    saveAndRender();
});

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAndRender() {
  save();
  render();
}

function render() {
  let list = [...tasks];  
  
// Filter
    if (state.filter === 'active') list = list.filter(t => !t.completed);
    if (state.filter === 'completed') list = list.filter(t => t.completed);
  
// Search
  if (state.query) {
    list = list.filter(t => (t.title || '').toLowerCase().includes(state.query));
  }  
  
// Sort
  if (state.sort === 'due-asc') {
    list.sort((a, b) => (a.due || '') > (b.due || '') ? 1 : -1);
  } else if (state.sort === 'due-desc') {
    list.sort((a, b) => (a.due || '') < (b.due || '') ? 1 : -1);
  } else if (state.sort === 'priority-desc') {
    const rank = { high: 3, medium: 2, low: 1 };
    list.sort((a, b) => (rank[b.priority]||0) - (rank[a.priority]||0)
  }

  task.innerHTML = '';
  list.forEach(task => taskList.appendChild(renderTaskItem(task)));
  statsEl.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''} • ${tasks.filter(t=>t.completed).length} completed`;
}

function renderTaskItem(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' completed' : '');
  li.dataset.id = task.id;

  const left = document.createElement('div'); 
  left.className = 'left';

  const chk = document.createElement('button');
  chk.className = 'checkbox';
  chk.setAttribute('aria-pressed', String(!!task.completed));
  chk.title = task.completed ? 'Mark as active' : 'Mark as completed';
  chk.addEventListener('click', () => {
    task.completed = !task.completed;
    saveAndRender();
  });
  chk.innerHTML = task.completed ? '✔️' : '';

  const titleWrap = document.createElement('div');
  titleWrap.style.minWidth = '0';
  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;

  const meta = document.createElement('div');
  meta.className = 'meta';
  if (task.due) {
    const due = document.createElement('span');
    due.textContent = `Due: ${task.due}`;
    meta.appendChild(due);
  }
  const badge = document.createElement('span');
  badge.className = `badge ${task.priority}`;
  badge.textContent = task.priority;
  meta.appendChild(badge);

  titleWrap.appendChild(title);
  titleWrap.appendChild(meta);

  left.appendChild(chk);
  left.appendChild(titleWrap);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'icon-btn';
  editBtn.title = 'Edit task';
  editBtn.innerHTML = '✏️';
  editBtn.addEventListener('click', () => startEdit(task, li));

  const delBtn = document.createElement('button');
  delBtn.className = 'icon-btn';
  delBtn.title = 'Delete';
  delBtn.innerHTML = '🗑️';
  delBtn.addEventListener('click', () => {
    if (confirm('Delete this task?')) {
      tasks = tasks.filter(t => t.id !== task.id);
      saveAndRender();
    }
  });

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  li.appendChild(left);
  li.appendChild(actions);

  return li;
}

function startEdit(task, li) {
// Replace content with inline form
  li.innerHTML = '';
  const editForm = document.createElement('form');
  editForm.className = 'task-item';
  editForm.style.gap = '8px';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = task.title;
  titleInput.required = true;
  titleInput.style.flex = '1';
  titleInput.style.padding = '8px';
  titleInput.style.borderRadius = '6px';
  titleInput.style.border = '1px solid #ddd';

  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.value = task.due || '';

  const prioritySelect = document.createElement('select');
  ['low', 'medium', 'high'].forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    if (p === task.priority) opt.selected = true;
    prioritySelect.appendChild(opt);
  });

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn small';
  saveBtn.type = 'button';
  saveBtn.textContent = 'Cancel';

  editForm.appendChild(titleInput);
  editForm.appendChild(dateInput);
  editForm.appendChild(prioritySelect);
  editForm.appendChild(saveBtn);
  editForm.appendChild(cancelBtn);

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTitle = titleInput.value.trim(); 
    if (!newTitle) return titleInput.focus();
    task.title = newTitle;
    task.due = dateInput.value || null;
    task.priority = prioritySelect.value;
    saveAndRender();
  });

  cancelBtn.addEventListener('click', () => render());

  li.appendChild(editForm);
  titleInput.focus();
}


