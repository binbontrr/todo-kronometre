let startTime;
let elapsedTime = 0;
let timerInterval;

const timerDisplay = document.querySelector('.timer-display');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodo');
const todoList = document.getElementById('todoList');
const oldTodosContainer = document.getElementById('oldTodosContainer');
const archiveBtn = document.getElementById('archiveBtn');
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');

const popup = document.getElementById('popup');
const popupClose = document.querySelector('.popup-close');
const popupTitle = document.querySelector('.popup-header h3');
const popupMessage = document.querySelector('.popup-body p');

function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function getStoredTodos() {
    const stored = localStorage.getItem('todos');
    if (!stored) {
        return {
            current: [],
            history: {},
            timerHistory: {}
        };
    }
    const parsed = JSON.parse(stored);
    return {
        current: parsed.current || [],
        history: parsed.history || {},
        timerHistory: parsed.timerHistory || {}
    };
}

function saveTodos() {
    const stored = getStoredTodos();
    const todos = {
        current: getCurrentTodos(),
        history: stored.history,
        timerHistory: stored.timerHistory
    };
    localStorage.setItem('todos', JSON.stringify(todos));
}

function getCurrentTodos() {
    const todos = [];
    todoList.querySelectorAll('.todo-item').forEach(item => {
        todos.push({
            text: item.querySelector('span').textContent,
            completed: item.classList.contains('completed')
        });
    });
    return todos;
}

function formatTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getTimerColorClass(ms) {
    const hours = ms / 3600000;
    if (hours < 2) return 'timer-blue';
    if (hours < 4) return 'timer-green';
    if (hours < 8) return 'timer-orange';
    if (hours < 10) return 'timer-red';
    if (hours >= 10) return 'timer-purple';
    return '';
}

function updateTimerColorClass(element, ms) {
    const colorClasses = ['timer-blue', 'timer-green', 'timer-orange', 'timer-red', 'timer-purple'];
    element.classList.remove(...colorClasses);
    const colorClass = getTimerColorClass(ms);
    if (colorClass) element.classList.add(colorClass);
}


function startTimer() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        timerDisplay.textContent = formatTime(elapsedTime);
        updateTimerColorClass(timerDisplay, elapsedTime);   
        saveTimer(); 
    }, 10);
    
    startBtn.disabled = true;
    stopBtn.disabled = false;
    timerDisplay.classList.add('active');

    confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff0000', '#00ff00', '#800080'],
        ticks: 200
    });
}


function stopTimer() {
    clearInterval(timerInterval);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    timerDisplay.classList.remove('active');
    saveTimer(); 
}

function resetTimer() {
    clearInterval(timerInterval);
    elapsedTime = 0;
    timerDisplay.textContent = '00:00:00';
    updateTimerColorClass(timerDisplay, 0);
    startBtn.disabled = false;
    stopBtn.disabled = false;
    timerDisplay.classList.remove('active');
    saveTimer();
}

function createTodoElement(todo, isHistory = false) {
    const li = document.createElement('li');
    li.className = isHistory ? 'old-todo-item' : 'todo-item';
    if (todo.completed) li.classList.add('completed');
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => {
        li.classList.toggle('completed');
        if (!isHistory) saveTodos();
    });
    
    const span = document.createElement('span');
    span.textContent = todo.text;
    
    li.appendChild(checkbox);
    li.appendChild(span);
    
    if (!isHistory) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Sil';
        deleteBtn.addEventListener('click', () => {
            li.remove();
            saveTodos();
        });
        li.appendChild(deleteBtn);
    }
    
    return li;
}

function addTodo() {
    const todoText = todoInput.value.trim();
    if (todoText === '') return;

    const todo = {
        text: todoText,
        completed: false
    };

    const li = createTodoElement(todo);
    todoList.appendChild(li);
    todoInput.value = '';
    saveTodos();
}

function loadTodos() {
    const stored = getStoredTodos();
    const today = getTodayString();

    todoList.innerHTML = '';
    stored.current.forEach(todo => {
        todoList.appendChild(createTodoElement(todo));
    });

    oldTodosContainer.innerHTML = '';

    const sortedDates = Object.keys(stored.history)
        .sort((a, b) => new Date(b) - new Date(a));
    
    sortedDates.forEach(date => {
        const card = document.createElement('div');
        card.className = 'old-todo-card';
        
        const dateDiv = document.createElement('div');
        dateDiv.className = 'old-todo-date';
        dateDiv.textContent = formatDate(date);

        if (stored.timerHistory[date]) {
            const timerDiv = document.createElement('div');
            timerDiv.className = 'old-todo-timer';
            timerDiv.textContent = `\u23f1\ufe0f ${stored.timerHistory[date].formattedTime}`;
            updateTimerColorClass(timerDiv, stored.timerHistory[date].time);
            dateDiv.appendChild(timerDiv);
        }
        
        const itemsList = document.createElement('ul');
        itemsList.className = 'old-todo-items';
        
        stored.history[date].forEach(todo => {
            itemsList.appendChild(createTodoElement(todo, true));
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-card-btn';
        deleteBtn.textContent = 'Sil';
        deleteBtn.addEventListener('click', () => {
            if (confirm('Bu günün tüm görevlerini ve kronometre verisini silmek istediğinize emin misiniz?')) {
                delete stored.history[date];
                delete stored.timerHistory[date];
                localStorage.setItem('todos', JSON.stringify({
                    current: stored.current,
                    history: stored.history,
                    timerHistory: stored.timerHistory
                }));
                loadTodos();
            }
        });
        
        card.appendChild(dateDiv);
        card.appendChild(itemsList);
        card.appendChild(deleteBtn);
        oldTodosContainer.appendChild(card);
    });
}

function checkAndMoveOldTodos() {
    const { current, history } = getStoredTodos();
    const today = getTodayString();
    
    if (history[today] && current.length === 0) {
        current.push(...history[today]);
        delete history[today];
    }

    if (current.length > 0) {
        history[today] = current;
    }
    
    localStorage.setItem('todos', JSON.stringify({
        current: [],
        history: history
    }));
}

function showPopup(title, message) {
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    popup.classList.add('show');
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

popupClose.addEventListener('click', () => {
    popup.classList.remove('show');
});

function archiveCurrentTodos() {
    const stored = getStoredTodos();
    const today = getTodayString();
    
    if (stored.current.length > 0) {
        stored.history[today] = stored.current;
    }
    
    if (elapsedTime > 0) {
        stored.timerHistory[today] = {
            time: elapsedTime,
            formattedTime: formatTime(elapsedTime)
        };
    }
    
    localStorage.setItem('todos', JSON.stringify({
        current: [],
        history: stored.history,
        timerHistory: stored.timerHistory
    }));
    
    todoList.innerHTML = '';
    resetTimer();
    loadTodos();
    showPopup('Başarılı!', 'Görevler ve kronometre başarıyla arşivlendi!');
}

function toggleHistory() {
    const container = oldTodosContainer;
    const button = toggleHistoryBtn;
    
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        button.classList.add('active');
    } else {
        container.classList.add('hidden');
        button.classList.remove('active');
    }
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);
addTodoBtn.addEventListener('click', addTodo);
archiveBtn.addEventListener('click', () => {
    const stored = getStoredTodos();
    if (stored.current.length > 0 || elapsedTime > 0) {
        if (confirm('Tüm görevleri ve kronometre verisini arşivlemek istediğinize emin misiniz?')) {
            archiveCurrentTodos();
        }
    } else {
        showPopup('Uyarı!', 'Arşivlenecek görev veya kronometre verisi bulunamadı.');
    }
});
toggleHistoryBtn.addEventListener('click', toggleHistory);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

window.addEventListener('load', () => {
    loadTodos();
    loadTimer();
});

stopBtn.disabled = true;

const themeToggle = document.getElementById('themeToggle');
const themes = ['theme-sunrise', 'theme-green', 'theme-dark', 'theme-midnight'];
let currentThemeIndex = -1;

themeToggle.addEventListener('click', () => {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    if (currentThemeIndex === -1) {
        document.body.classList.remove(...themes);
    } else {
        document.body.classList.remove(...themes);
        document.body.classList.add(themes[currentThemeIndex]);
    }
});

function loadTimer() {
    const stored = getStoredTodos();
    const today = getTodayString();
    
    if (stored.timerHistory[today]) {
        elapsedTime = stored.timerHistory[today].time;
        timerDisplay.textContent = stored.timerHistory[today].formattedTime;
        updateTimerColorClass(timerDisplay, elapsedTime);
    } else {
        updateTimerColorClass(timerDisplay, 0);
    }
}

function saveTimer() {
    const stored = getStoredTodos();
    const today = getTodayString();
    
    if (elapsedTime > 0) {
        stored.timerHistory[today] = {
            time: elapsedTime,
            formattedTime: formatTime(elapsedTime)
        };
        localStorage.setItem('todos', JSON.stringify(stored));
    }
}

window.addEventListener('beforeunload', () => {
    saveTimer();
}); 
