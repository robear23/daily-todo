// Habit Tracker Application Logic

// DOM elements
const currentDateEl = document.getElementById('current-date');
const themeToggleBtn = document.getElementById('theme-toggle');
const addTaskForm = document.getElementById('add-task-form');
const taskInput = document.getElementById('task-input');
const taskListContainer = document.getElementById('task-list');
const emptyStateEl = document.getElementById('empty-state');
const progressCircle = document.getElementById('progress-circle');
const progressText = document.getElementById('progress-text');
const completionRatioEl = document.getElementById('completion-ratio');
const streakCountEl = document.getElementById('streak-count');
const celebrationBanner = document.getElementById('celebration');
const taskCountEl = document.getElementById('task-count');

// State
let tasks = [];
let streak = 0;
let lastCompletedDate = ''; // 'YYYY-MM-DD'
let lastVisitDate = ''; // 'YYYY-MM-DD'

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateDateDisplay();
  loadData();
  checkDailyReset();
  render();
});

// Update Date Display
function updateDateDisplay() {
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  const today = new Date();
  currentDateEl.textContent = today.toLocaleDateString('en-US', options);
}

// Format date helper
function getFormattedDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Load Data from LocalStorage
function loadData() {
  const savedTasks = localStorage.getItem('daily_tasks');
  if (savedTasks) {
    tasks = JSON.parse(savedTasks);
  } else {
    // Default welcome tasks if none exist
    tasks = [
      { id: '1', title: 'Plan my daily priority list', completed: false },
      { id: '2', title: '30 minutes of focused product work', completed: false },
      { id: '3', title: 'Complete client outreach goals', completed: false }
    ];
    saveTasks();
  }

  streak = parseInt(localStorage.getItem('daily_streak') || '0', 10);
  lastCompletedDate = localStorage.getItem('last_completed_date') || '';
  lastVisitDate = localStorage.getItem('last_visit_date') || '';
}

// Check Daily Reset
function checkDailyReset() {
  const todayStr = getFormattedDate(new Date());

  if (lastVisitDate && lastVisitDate !== todayStr) {
    // A new day has started since the last visit!
    // 1. Uncheck all tasks so the user can complete them again today
    tasks.forEach(t => t.completed = false);
    saveTasks();

    // 2. Determine if the streak was broken
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getFormattedDate(yesterday);

    if (lastCompletedDate !== yesterdayStr && lastCompletedDate !== todayStr) {
      // User didn't complete tasks yesterday, and has not completed them today.
      // Streak resets.
      streak = 0;
      localStorage.setItem('daily_streak', streak);
    }
  }

  // Update last visit
  localStorage.setItem('last_visit_date', todayStr);
  lastVisitDate = todayStr;
}

// Save Tasks to LocalStorage
function saveTasks() {
  localStorage.setItem('daily_tasks', JSON.stringify(tasks));
}

// Save Streak Status
function updateStreakAndCompletion() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const todayStr = getFormattedDate(new Date());

  if (total > 0 && completed === total) {
    // All tasks completed today!
    if (lastCompletedDate !== todayStr) {
      // Only increment if we haven't already marked today as completed
      streak += 1;
      lastCompletedDate = todayStr;
      localStorage.setItem('daily_streak', streak);
      localStorage.setItem('last_completed_date', lastCompletedDate);
      
      // Trigger animations
      triggerCelebration();
    }
  } else {
    // Not all tasks completed today. If it was completed, undo it.
    if (lastCompletedDate === todayStr) {
      streak = Math.max(0, streak - 1);
      lastCompletedDate = '';
      localStorage.setItem('daily_streak', streak);
      localStorage.setItem('last_completed_date', lastCompletedDate);
    }
  }
}

// Celebration / Confetti Animation
function triggerCelebration() {
  // Show celebration banner with animation
  celebrationBanner.classList.remove('hidden');
  celebrationBanner.style.animation = 'none';
  void celebrationBanner.offsetWidth; // Trigger reflow
  celebrationBanner.style.animation = 'slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1), pulseGlow 2s infinite alternate';

  // Confetti explosion options
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // double blast
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
}

// Render UI Components
function render() {
  // Render task list
  taskListContainer.innerHTML = '';
  
  if (tasks.length === 0) {
    emptyStateEl.style.display = 'flex';
  } else {
    emptyStateEl.style.display = 'none';
    
    tasks.forEach(task => {
      const taskItem = document.createElement('div');
      taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
      
      taskItem.innerHTML = `
        <label class="task-left" style="cursor: pointer;">
          <span class="custom-checkbox ${task.completed ? 'checked' : ''}">
            <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
            <i data-lucide="check" class="check-mark" style="pointer-events: none;"></i>
          </span>
          <span class="task-title">${escapeHTML(task.title)}</span>
        </label>
        <button class="btn-delete" data-id="${task.id}" title="Delete Task" aria-label="Delete Task">
          <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
        </button>
      `;
      
      taskListContainer.appendChild(taskItem);
    });
  }

  // Update Lucide Icons for dynamic content
  lucide.createIcons();

  // Add event listeners for dynamic tasks
  setupTaskEventListeners();

  // Update statistics
  updateStats();
}

// Setup Event Listeners on Tasks
function setupTaskEventListeners() {
  // Checkbox toggle
  const checkboxes = taskListContainer.querySelectorAll('.custom-checkbox input');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', (e) => {
      const taskId = e.target.getAttribute('data-id');
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = e.target.checked;
        saveTasks();
        updateStreakAndCompletion();
        render();
      }
    });
  });

  // Delete button
  const deleteBtns = taskListContainer.querySelectorAll('.btn-delete');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = btn.getAttribute('data-id');
      tasks = tasks.filter(t => t.id !== taskId);
      saveTasks();
      updateStreakAndCompletion();
      render();
    });
  });
}

// Update Statistics Panel
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  
  // Ratio text
  completionRatioEl.textContent = `${completed}/${total}`;
  
  // Tasks count text
  taskCountEl.textContent = `${total} task${total !== 1 ? 's' : ''}`;

  // Streak
  streakCountEl.textContent = streak;

  // Circular Progress Bar
  const circleRadius = 18;
  const circumference = 2 * Math.PI * circleRadius; // ~113.09
  const percent = total > 0 ? (completed / total) * 100 : 0;
  const offset = circumference - (percent / 100) * circumference;
  
  progressCircle.style.strokeDashoffset = offset;
  progressText.textContent = `${Math.round(percent)}%`;

  // Hide celebration banner if not 100% complete
  const todayStr = getFormattedDate(new Date());
  if (total === 0 || completed < total || lastCompletedDate !== todayStr) {
    celebrationBanner.classList.add('hidden');
  } else {
    celebrationBanner.classList.remove('hidden');
  }
}

// Add Task Submit
addTaskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (text) {
    const newTask = {
      id: Date.now().toString(),
      title: text,
      completed: false
    };
    tasks.push(newTask);
    saveTasks();
    taskInput.value = '';
    
    // Reset daily completion state if a new task is added
    const todayStr = getFormattedDate(new Date());
    if (lastCompletedDate === todayStr) {
      lastCompletedDate = '';
      localStorage.setItem('last_completed_date', '');
    }

    render();
  }
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const icon = themeToggleBtn.querySelector('i');
  if (theme === 'light') {
    icon.setAttribute('data-lucide', 'sun');
  } else {
    icon.setAttribute('data-lucide', 'moon');
  }
  lucide.createIcons();
}

// Utility: HTML Escaping
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
