// DAYS OF WEEK
const DAYS = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

// Global data structure
let plannerData = {
    tasks: {},
    weekStartKey: null
};

// ========== HELPER FUNCTIONS ==========

// Get current week dates (starting Monday)
function getWeekDates() {
    const today = new Date();
    const currentDay = today.getDay();
    let diffToMonday = (currentDay === 0 ? 6 : currentDay - 1);
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        weekDates.push(date);
    }
    return weekDates;
}

function getCurrentWeekKey() {
    const weekDates = getWeekDates();
    const monday = weekDates[0];
    return monday.toISOString().split('T')[0];
}

function getEmptyTasksStructure() {
    const tasksMap = {};
    DAYS.forEach(day => { tasksMap[day] = []; });
    return tasksMap;
}

function formatDate(date) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ========== LOCALSTORAGE ==========

function saveToLocalStorage() {
    const storageObj = {
        tasks: plannerData.tasks,
        weekStartKey: plannerData.weekStartKey
    };
    localStorage.setItem('weeklyPlannerData', JSON.stringify(storageObj));
}

function loadOrInitData() {
    const currentKey = getCurrentWeekKey();
    const storedRaw = localStorage.getItem('weeklyPlannerData');
    
    if (storedRaw) {
        try {
            const stored = JSON.parse(storedRaw);
            if (stored.weekStartKey === currentKey && stored.tasks) {
                const loadedTasks = stored.tasks;
                const newTasks = getEmptyTasksStructure();
                
                DAYS.forEach(day => {
                    if (loadedTasks[day] && Array.isArray(loadedTasks[day])) {
                        newTasks[day] = loadedTasks[day].map(t => {
                            if (typeof t === 'string') return { text: t, completed: false };
                            if (t && typeof t === 'object') return { text: t.text || '', completed: !!t.completed };
                            return { text: String(t), completed: false };
                        });
                    } else {
                        newTasks[day] = [];
                    }
                });
                
                plannerData.tasks = newTasks;
                plannerData.weekStartKey = stored.weekStartKey;
            } else {
                plannerData.tasks = getEmptyTasksStructure();
                plannerData.weekStartKey = currentKey;
            }
        } catch(e) {
            plannerData.tasks = getEmptyTasksStructure();
            plannerData.weekStartKey = currentKey;
        }
    } else {
        plannerData.tasks = getEmptyTasksStructure();
        plannerData.weekStartKey = currentKey;
    }
    
    DAYS.forEach(day => {
        if (!plannerData.tasks[day]) plannerData.tasks[day] = [];
    });
    
    saveToLocalStorage();
}

// ========== TASK OPERATIONS ==========

function addTask(dayName, taskText) {
    if (!taskText || taskText.trim() === "") return false;
    const cleanText = taskText.trim();
    const newTask = { text: cleanText, completed: false };
    plannerData.tasks[dayName].push(newTask);
    saveToLocalStorage();
    return true;
}

function deleteTask(dayName, taskIndex) {
    if (plannerData.tasks[dayName] && plannerData.tasks[dayName][taskIndex]) {
        plannerData.tasks[dayName].splice(taskIndex, 1);
        saveToLocalStorage();
        return true;
    }
    return false;
}

function toggleTaskComplete(dayName, taskIndex) {
    if (plannerData.tasks[dayName] && plannerData.tasks[dayName][taskIndex]) {
        const task = plannerData.tasks[dayName][taskIndex];
        task.completed = !task.completed;
        saveToLocalStorage();
        return true;
    }
    return false;
}

function resetAllTasks() {
    if (confirm("🌸 Reset all your tasks for this week? This can't be undone. 🌸")) {
        plannerData.tasks = getEmptyTasksStructure();
        saveToLocalStorage();
        renderPlanner();
    }
}

function syncWeekAndResetIfNeeded() {
    const currentKey = getCurrentWeekKey();
    if (plannerData.weekStartKey !== currentKey) {
        plannerData.tasks = getEmptyTasksStructure();
        plannerData.weekStartKey = currentKey;
        saveToLocalStorage();
        renderPlanner();
    }
}

// ========== PNG EXPORT FUNCTION ==========
async function exportAsPNG() {
    const captureElement = document.getElementById('plannerCapture');
    if (!captureElement) return;
    
    // Show a temporary loading effect on the capture area
    captureElement.classList.add('png-loading');
    
    try {
        // Small delay to ensure any pending renders are finished & loading style appears
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Use html2canvas with high quality settings for a crisp PNG
        const canvas = await html2canvas(captureElement, {
            scale: 3,               // High resolution for sharp PNG
            backgroundColor: '#fffef7',
            logging: false,
            useCORS: false,
            allowTaint: false,
            windowWidth: captureElement.scrollWidth,
            windowHeight: captureElement.scrollHeight
        });
        
        // Convert canvas to PNG download link
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const todayDate = new Date().toISOString().slice(0, 10);
        link.download = `weekly-planner-${todayDate}.png`;
        link.href = image;
        link.click();
        
        // Optional: small success feedback (no alert, subtle)
        const originalFooter = document.querySelector('.footer-note');
        if (originalFooter) {
            const originalText = originalFooter.innerText;
            originalFooter.style.transition = '0.2s';
            originalFooter.style.color = '#c88aa4';
            originalFooter.innerText = '✨ PNG exported! ✨';
            setTimeout(() => {
                if (originalFooter) {
                    originalFooter.innerText = originalText;
                    originalFooter.style.color = '';
                }
            }, 1800);
        }
    } catch (error) {
        console.error('PNG export failed:', error);
        alert('🌸 Oops! Could not generate PNG. Please try again. 🌸');
    } finally {
        captureElement.classList.remove('png-loading');
    }
}

// ========== RENDER UI (CUTE + FEMININE, 3-COLUMN LAYOUT) ==========

function renderPlanner() {
    const weekDates = getWeekDates();
    const container = document.getElementById('weekGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Soft pastel header backgrounds (cute alternation)
    const pastelAccents = [
        '#fff0f4', '#fef2f5', '#fff5f0', '#fef0fa', '#f0f5ff', '#f2faf0', '#fff0e7'
    ];
    
    DAYS.forEach((day, idx) => {
        const currentDate = weekDates[idx];
        const dateString = formatDate(currentDate);
        const tasksArray = plannerData.tasks[day] || [];
        
        const card = document.createElement('div');
        card.className = 'day-card';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'day-header';
        headerDiv.style.background = pastelAccents[idx % pastelAccents.length];
        headerDiv.innerHTML = `
            <div class="day-name">${day}</div>
            <div class="day-date">${dateString}</div>
        `;
        card.appendChild(headerDiv);
        
        const tasksList = document.createElement('ul');
        tasksList.className = 'tasks-list';
        
        if (tasksArray.length === 0) {
            const emptyMsg = document.createElement('li');
            emptyMsg.className = 'empty-tasks';
            emptyMsg.innerText = 'add a task';
            tasksList.appendChild(emptyMsg);
        } else {
            tasksArray.forEach((task, tIndex) => {
                const taskItem = document.createElement('li');
                taskItem.className = 'task-item';
                
                const taskSpan = document.createElement('span');
                taskSpan.className = `task-text ${task.completed ? 'completed' : ''}`;
                taskSpan.innerText = task.text;
                taskSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleTaskComplete(day, tIndex);
                    renderPlanner();
                });
                
                const delBtn = document.createElement('button');
                delBtn.className = 'delete-task';
                delBtn.innerHTML = '✿';
                delBtn.setAttribute('aria-label', 'Delete task');
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTask(day, tIndex);
                    renderPlanner();
                });
                
                taskItem.appendChild(taskSpan);
                taskItem.appendChild(delBtn);
                tasksList.appendChild(taskItem);
            });
        }
        card.appendChild(tasksList);
        
        // Add task form with lovely style
        const formDiv = document.createElement('div');
        formDiv.className = 'add-task-form';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'write a task... ✏️';
        input.className = 'task-input';
        input.maxLength = 80;
        const addButton = document.createElement('button');
        addButton.innerText = '+ add';
        addButton.className = 'add-btn';
        
        const addHandler = () => {
            if (addTask(day, input.value)) {
                input.value = '';
                renderPlanner();
            } else {
                if (input.value.trim() === "") {
                    input.placeholder = "🌸 can't be empty! 🌸";
                    setTimeout(() => { input.placeholder = "write a task... ✏️"; }, 1200);
                }
            }
        };
        
        addButton.addEventListener('click', addHandler);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addHandler();
            }
        });
        
        formDiv.appendChild(input);
        formDiv.appendChild(addButton);
        card.appendChild(formDiv);
        
        container.appendChild(card);
    });
}

// ========== INITIALIZATION ==========

function init() {
    loadOrInitData();
    renderPlanner();
    
    window.addEventListener('focus', () => {
        syncWeekAndResetIfNeeded();
        renderPlanner();
    });
    
    const resetBtn = document.getElementById('resetAllBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetAllTasks);
    
    const exportBtn = document.getElementById('exportPngBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportAsPNG);
}

init();
