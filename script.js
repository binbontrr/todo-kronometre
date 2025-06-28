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
    const stored = JSON.parse(localStorage.getItem('todos'));
    const today = getTodayString();
    if (stored.timerHistory[today]) {
        delete stored.timerHistory[today];
        localStorage.setItem('todos', JSON.stringify(stored));
    }
    saveTimer();
}

function createTodoElement(todo, isHistory = false, dateKey = null, todoIndex = null) {
    const li = document.createElement('li');
    li.className = isHistory ? 'old-todo-item' : 'todo-item';
    if (todo.completed) li.classList.add('completed');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => {
        li.classList.toggle('completed');
        if (!isHistory) localStorage.setItem('todos', JSON.stringify(JSON.parse(localStorage.getItem('todos'))));
    });

    const span = document.createElement('span');
    span.textContent = todo.text;
    span.style.cursor = 'pointer';

    if (!isHistory) {
        span.addEventListener('click', () => {
            const input = document.createElement('textarea');
            input.value = todo.note || '';
            input.className = 'note-textarea';

            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Kaydet';
            saveBtn.className = 'note-save-btn';

            const popupBg = document.createElement('div');
            popupBg.className = 'popup-bg';

            const popupBox = document.createElement('div');
            popupBox.className = 'popup-box';

            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = 'popup-close-btn';
            closeBtn.onclick = () => document.body.removeChild(popupBg);
            popupBox.appendChild(closeBtn);

            popupBox.appendChild(input);
            popupBox.appendChild(saveBtn);
            popupBg.appendChild(popupBox);
            document.body.appendChild(popupBg);

            saveBtn.onclick = () => {
                todo.note = input.value;
                let stored = JSON.parse(localStorage.getItem('todos'));
                let idx = stored.current.findIndex(t => t.text === todo.text && t.completed === todo.completed);
                if (idx !== -1) {
                    stored.current[idx].note = input.value;
                    localStorage.setItem('todos', JSON.stringify(stored));
                }
                localStorage.setItem('todos', JSON.stringify(JSON.parse(localStorage.getItem('todos'))));
                document.body.removeChild(popupBg);
            };

            popupBg.onclick = e => {
                if (e.target === popupBg) document.body.removeChild(popupBg);
            };
        });
    } else {
        if (todo.note && todo.note.trim() !== '') {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'todo-note-tooltip';
            noteDiv.textContent = todo.note;
            noteDiv.style.display = 'none';
            noteDiv.style.position = 'fixed';
            noteDiv.style.pointerEvents = 'none';
            noteDiv.style.background = '#23232b';
            noteDiv.style.color = '#fff';
            noteDiv.style.padding = '8px 14px';
            noteDiv.style.borderRadius = '8px';
            noteDiv.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
            noteDiv.style.maxWidth = '250px';
            noteDiv.style.whiteSpace = 'pre-wrap';
            noteDiv.style.zIndex = '9999';
            noteDiv.style.fontSize = '0.96em';
            noteDiv.style.opacity = '0.98';

            document.body.appendChild(noteDiv);
            span.addEventListener('mouseenter', (e) => {
                noteDiv.style.display = 'block';
            });
            span.addEventListener('mousemove', (e) => {
                noteDiv.style.left = (e.clientX - 15) + 'px';
                noteDiv.style.top = (e.clientY + 10) + 'px';
            });
            span.addEventListener('mouseleave', () => {
                noteDiv.style.display = 'none';
            });
            li.addEventListener('mouseleave', () => {
                noteDiv.style.display = 'none';
            });
        }
    }

    li.appendChild(checkbox);
    li.appendChild(span);

    if (!isHistory) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Sil';
        deleteBtn.onclick = () => {
            const popupBg = document.createElement('div');
            popupBg.className = 'popup-bg';
            const popupBox = document.createElement('div');
            popupBox.className = 'popup-box';
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = 'popup-close-btn';
            closeBtn.onclick = () => document.body.removeChild(popupBg);
            popupBox.appendChild(closeBtn);
            const icon = document.createElement('div');
            icon.innerHTML = '&#x26A0;';
            icon.style.fontSize = '2em';
            icon.style.textAlign = 'center';
            popupBox.appendChild(icon);
            const title = document.createElement('h3');
            title.textContent = 'Görevi silmek istediğinize emin misiniz?';
            title.style.textAlign = 'center';
            popupBox.appendChild(title);
            const msg = document.createElement('p');
            msg.textContent = 'Bu görev kalıcı olarak silinecek.';
            msg.style.textAlign = 'center';
            popupBox.appendChild(msg);
            const btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = '10px';
            btnRow.style.margin = '18px 0 0 0';
            btnRow.style.justifyContent = 'center';
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Sil';
            confirmBtn.className = 'note-save-btn';
            confirmBtn.style.background = '#ff3b30';
            confirmBtn.onclick = () => {
                let stored = JSON.parse(localStorage.getItem('todos'));
                stored.current = stored.current.filter(t => !(t.text === todo.text && t.completed === todo.completed && (t.note || '') === (todo.note || '')));
                localStorage.setItem('todos', JSON.stringify(stored));
                li.remove();
                localStorage.setItem('todos', JSON.stringify(JSON.parse(localStorage.getItem('todos'))));
                document.body.removeChild(popupBg);
            };
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Vazgeç';
            cancelBtn.className = 'note-save-btn';
            cancelBtn.onclick = () => document.body.removeChild(popupBg);
            btnRow.appendChild(confirmBtn);
            btnRow.appendChild(cancelBtn);
            popupBox.appendChild(btnRow);
            popupBg.appendChild(popupBox);
            popupBg.onclick = e => { if (e.target === popupBg) document.body.removeChild(popupBg); };
            document.body.appendChild(popupBg);
        };
        li.appendChild(deleteBtn);
    }

    return li;
}

function addTodo() {
    const todoText = todoInput.value.trim();
    if (todoText === '') return;

    const todo = {
        text: todoText,
        completed: false,
        note: ''
    };

    let stored = JSON.parse(localStorage.getItem('todos'));
    stored.current.push(todo);
    localStorage.setItem('todos', JSON.stringify(stored));

    const li = createTodoElement(todo);
    todoList.appendChild(li);
    todoInput.value = '';
    localStorage.setItem('todos', JSON.stringify(JSON.parse(localStorage.getItem('todos'))));
}

function loadTodos() {
    const stored = JSON.parse(localStorage.getItem('todos'));
    const today = getTodayString();

    todoList.innerHTML = '';
    stored.current.forEach(todo => {
        todoList.appendChild(createTodoElement(todo));
    });

    oldTodosContainer.innerHTML = '';

    const sortedDates = Object.keys(stored.history)
        .sort((a, b) => new Date(b.split('_')[0]) - new Date(a.split('_')[0]) || b.localeCompare(a));
    
    sortedDates.forEach(date => {
        const card = document.createElement('div');
        card.className = 'old-todo-card';
        
        const dateDiv = document.createElement('div');
        dateDiv.className = 'old-todo-date';

        let displayDate = date;
        let displayTime = '';
        if (date.includes('_')) {
            const [d, t] = date.split('_');
            displayDate = d;
            if (t && t.length === 6) {
                displayTime = ' ' + t.slice(0,2) + ':' + t.slice(2,4) + ':' + t.slice(4,6);
            }
        }
        dateDiv.textContent = formatDate(displayDate) + displayTime;

        if (stored.timerHistory[date]) {
            const timerDiv = document.createElement('div');
            timerDiv.className = 'old-todo-timer';
            timerDiv.textContent = '⏱️ ' + stored.timerHistory[date].formattedTime;
            updateTimerColorClass(timerDiv, stored.timerHistory[date].time);
            dateDiv.appendChild(timerDiv);
        }
        
        const itemsList = document.createElement('ul');
        itemsList.className = 'old-todo-items';
        
        stored.history[date].forEach((todo, idx) => {
            itemsList.appendChild(createTodoElement(todo, true, date, idx));
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-card-btn';
        deleteBtn.textContent = 'Sil';
        deleteBtn.onclick = () => {
            const popupBg = document.createElement('div');
            popupBg.className = 'popup-bg';
            const popupBox = document.createElement('div');
            popupBox.className = 'popup-box';
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = 'popup-close-btn';
            closeBtn.onclick = () => document.body.removeChild(popupBg);
            popupBox.appendChild(closeBtn);
            
            const icon = document.createElement('div');
            icon.innerHTML = '&#x26A0;';
            icon.style.fontSize = '2em';
            icon.style.textAlign = 'center';
            popupBox.appendChild(icon);
            
            const title = document.createElement('h3');
            title.textContent = 'Silmek istediğinize emin misiniz?';
            title.style.textAlign = 'center';
            popupBox.appendChild(title);
            
            const msg = document.createElement('p');
            msg.textContent = 'Bu günün tüm görevleri ve kronometre verisi kalıcı olarak silinecek.';
            msg.style.textAlign = 'center';
            popupBox.appendChild(msg);

            const btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = '10px';
            btnRow.style.margin = '18px 0 0 0';
            btnRow.style.justifyContent = 'center';
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Sil';
            confirmBtn.className = 'note-save-btn';
            confirmBtn.style.background = '#ff3b30';
            confirmBtn.onclick = () => {
                delete stored.history[date];
                delete stored.timerHistory[date];
                localStorage.setItem('todos', JSON.stringify({
                    current: stored.current,
                    history: stored.history,
                    timerHistory: stored.timerHistory
                }));
                loadTodos();
                document.body.removeChild(popupBg);
            };
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Vazgeç';
            cancelBtn.className = 'note-save-btn';
            cancelBtn.onclick = () => document.body.removeChild(popupBg);
            btnRow.appendChild(confirmBtn);
            btnRow.appendChild(cancelBtn);
            popupBox.appendChild(btnRow);
            popupBg.appendChild(popupBox);
            popupBg.onclick = e => { if (e.target === popupBg) document.body.removeChild(popupBg); };
            document.body.appendChild(popupBg);
        };
        
        card.appendChild(dateDiv);
        card.appendChild(itemsList);
        card.appendChild(deleteBtn);
        oldTodosContainer.appendChild(card);
    });
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
    const stored = JSON.parse(localStorage.getItem('todos'));
    const today = getTodayString();
    const now = new Date();
    const uniqueKey = today + '_' + now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0') + now.getSeconds().toString().padStart(2, '0');

    const newHistory = { ...stored.history };
    if (stored.current.length > 0) {
        newHistory[uniqueKey] = [...stored.current];
    }

    const newTimerHistory = { ...stored.timerHistory };
    if (elapsedTime > 0) {
        newTimerHistory[uniqueKey] = {
            time: elapsedTime,
            formattedTime: formatTime(elapsedTime)
        };
    }

    localStorage.setItem('todos', JSON.stringify({
        current: [],
        history: newHistory,
        timerHistory: newTimerHistory
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
archiveBtn.addEventListener('click', archiveCurrentTodos);
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
    const stored = JSON.parse(localStorage.getItem('todos'));
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
    const stored = JSON.parse(localStorage.getItem('todos'));
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
