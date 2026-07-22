// --- WEBSOCKET CONNECTION ---
const socket = io('http://127.0.0.1:5000');
const buddyStatus = document.getElementById('buddy-status');
const sendBoostBtn = document.getElementById('send-boost-btn');

// --- DOM ELEMENTS ---
const totalInput = document.getElementById('total');
const completedInput = document.getElementById('completed');
const updateBtn = document.getElementById('update-btn');
const percentageText = document.getElementById('percentage-text');
const matrixBoard = document.getElementById('matrix-board');
const milestoneMessage = document.getElementById('milestone-message');
const liquidBar = document.getElementById('liquid-bar');
const subjectInput = document.getElementById('subject');
const dashboardTitle = document.getElementById('dashboard-title');
const timerInput = document.getElementById('timer-input');
const timerDisplay = document.getElementById('timer-display');
const startTimerBtn = document.getElementById('start-timer-btn');

// --- RPG ELEMENTS ---
const playerTitle = document.getElementById('player-title');
const xpBar = document.getElementById('xp-bar');
const currentXpText = document.getElementById('current-xp');

// --- 1. PERSISTENT DATA (LOCAL STORAGE) ---
let userXP = parseInt(localStorage.getItem('bca_userXP')) || 0;
let userLevel = parseInt(localStorage.getItem('bca_userLevel')) || 1;
let focusHistory = JSON.parse(localStorage.getItem('bca_focusHistory')) || [0, 0, 0, 0, 0, 0, 0]; 
const xpPerLevel = 200;

const rpgTitles = {
    1: "Novice Coder",
    2: "Script Squire",
    3: "Byte Knight",
    4: "Syntax Sorcerer",
    5: "Matrix Master"
};

// --- 2. WEBSOCKET LOGIC ---

// NEW: The Automatic Handshake
socket.on('connect', () => {
    // As soon as this browser connects, send its current data to anyone already online
    let total = parseInt(totalInput.value) || 0;
    let completed = parseInt(completedInput.value) || 0;
    broadcastProgress(completed, total, subjectInput.value);
});

function broadcastProgress(completed, total, subject) {
    socket.emit('sync_matrix', {
        completed: completed,
        total: total,
        subject: subject || "a topic"
    });
}

sendBoostBtn.addEventListener('click', () => {
    socket.emit('send_xp_boost', { sender: "Study Buddy" });
    buddyStatus.innerText = "XP Boost sent! 🚀";
    setTimeout(() => { buddyStatus.innerText = "Partner is online ✅"; }, 3000);
});

socket.on('partner_matrix_updated', (data) => {
    let percent = Math.round((data.completed / data.total) * 100) || 0;
    buddyStatus.innerText = `Partner is ${percent}% done with ${data.subject} 👀`;
});

socket.on('receive_xp_boost', (data) => {
    gainXP(50);
    milestoneMessage.innerText = "🎁 Incoming! Your partner sent you an XP Boost!";
    milestoneMessage.style.color = '#a3cc85';
    fireConfetti(true);
});

// --- 3. RPG LOGIC ---
function updateRPGProfile() {
    if (userXP >= xpPerLevel) {
        userLevel++;
        userXP = userXP - xpPerLevel;
        fireConfetti(true); 
        alert(`🎉 LEVEL UP! You are now Level ${userLevel}!`);
    }

    localStorage.setItem('bca_userXP', userXP);
    localStorage.setItem('bca_userLevel', userLevel);

    let title = rpgTitles[userLevel] || "Tech Guru";
    playerTitle.innerText = `Lvl ${userLevel}: ${title}`;
    currentXpText.innerText = userXP;
    
    let xpPercentage = (userXP / xpPerLevel) * 100;
    xpBar.style.width = `${xpPercentage}%`;
}

function gainXP(amount) {
    userXP += amount;
    updateRPGProfile();
}

// --- 4. CHART.JS ANALYTICS & GOALS ---
const dailyGoalInput = document.getElementById('daily-goal');
let dailyGoal = parseInt(localStorage.getItem('bca_dailyGoal')) || 4;
let chartInstance = null;

dailyGoalInput.value = dailyGoal;

dailyGoalInput.addEventListener('input', (e) => {
    let val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
        dailyGoal = val;
        localStorage.setItem('bca_dailyGoal', dailyGoal);
        renderChart();
    }
});

function renderChart() {
    const ctx = document.getElementById('focusChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    const goalDataArray = Array(7).fill(dailyGoal);

    chartInstance = new Chart(ctx, {
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    type: 'line',
                    label: 'Daily Target',
                    data: goalDataArray,
                    borderColor: '#a3cc85', 
                    borderWidth: 2,
                    borderDash: [5, 5], 
                    pointRadius: 0, 
                    fill: false,
                    order: 1
                },
                {
                    type: 'bar',
                    label: 'Sessions Completed',
                    data: focusHistory,
                    backgroundColor: '#e66a3d', 
                    borderRadius: 5,
                    borderWidth: 0,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, color: '#b5a49c' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    ticks: { color: '#b5a49c' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { 
                    labels: { color: '#e8d8ce', font: { family: 'JetBrains Mono' } } 
                }
            }
        }
    });
}

function logSession() {
    let today = new Date().getDay();
    let arrayIndex = today === 0 ? 6 : today - 1; 
    
    focusHistory[arrayIndex] += 1;
    localStorage.setItem('bca_focusHistory', JSON.stringify(focusHistory));
    renderChart();
}

// --- 5. TOPIC & MATRIX LOGIC ---
subjectInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    dashboardTitle.innerText = val === '' ? `💻 Session Tracker` : `💻 ${val} Tracker`;
});

function drawMatrix() {
    let total = parseInt(totalInput.value) || 0;
    let completed = parseInt(completedInput.value) || 0;

    if (completed > total && total > 0) completed = total;

    let percentage = 0;
    if (total > 0) {
        percentage = Math.round((completed / total) * 100);
    }
    
    // Broadcast real-time update
    broadcastProgress(completed, total, subjectInput.value);
    
    liquidBar.style.width = `${percentage}%`;
    animateValue(percentageText, parseInt(percentageText.innerText), percentage, 800);
    
    matrixBoard.innerHTML = ''; 
    milestoneMessage.style.color = '#a3cc85'; 
    milestoneMessage.style.transform = 'scale(1)';
    
    if (total === 0) {
        milestoneMessage.innerText = "✨ Enter your goals and topic above to begin.";
        return; 
    } else {
        milestoneMessage.innerText = "🔥 Keep going! You're making great progress.";
    }

    if (percentage === 100) {
        milestoneMessage.innerText = "🏆 Matrix Complete! You've mastered this topic.";
        milestoneMessage.style.transform = 'scale(1.05)';
        fireConfetti(false);
    }

    for (let i = 0; i < total; i++) {
        const box = document.createElement('div');
        box.classList.add('box');
        if (i < completed) box.classList.add('filled');
        
        matrixBoard.appendChild(box);

        setTimeout(() => {
            box.style.animation = `popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`;
            if (i < completed) {
                setTimeout(() => {
                    const randomDelay = (Math.random() * 2).toFixed(2);
                    box.style.animation = `float 3s ease-in-out ${randomDelay}s infinite alternate`;
                }, 500); 
            }
        }, i * 40); 
    }
}

function animateValue(obj, start, end, duration) {
    if (isNaN(start)) start = 0;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start) + "%";
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// --- 6. POMODORO TIMER ---
let timerInterval;
let timeRemaining = 0;

const refreshTasks = [
    "⏰ Time's up! +50 XP! Grab your helmet 🚴‍♀️ and go for a quick bike ride.",
    "⏰ Time's up! +50 XP! Step away and do a 5-minute stretch 🧘‍♀️.",
    "⏰ Time's up! +50 XP! Grab a glass of water 💧 and rest your eyes.",
    "⏰ Time's up! +50 XP! Walk around and grab a healthy snack 🍎.",
    "⏰ Time's up! +50 XP! Do 15 jumping jacks 🤸‍♀️ to get blood flowing."
];

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

startTimerBtn.addEventListener('click', () => {
    if (startTimerBtn.innerText === "⏹️ Stop") {
        clearInterval(timerInterval);
        startTimerBtn.innerText = "▶️ Start";
        startTimerBtn.classList.add('pulse-btn');
        return;
    }

    timeRemaining = parseInt(timerInput.value) * 60;
    if (isNaN(timeRemaining) || timeRemaining <= 0) return;

    timerDisplay.innerText = formatTime(timeRemaining);
    startTimerBtn.innerText = "⏹️ Stop";
    startTimerBtn.classList.remove('pulse-btn'); 
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        timerDisplay.innerText = formatTime(timeRemaining);
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            startTimerBtn.innerText = "▶️ Start";
            startTimerBtn.classList.add('pulse-btn');
            
            gainXP(50);
            logSession();
            
            const randomTask = refreshTasks[Math.floor(Math.random() * refreshTasks.length)];
            milestoneMessage.innerText = randomTask;
            milestoneMessage.style.color = '#c05c36'; 
            milestoneMessage.style.transform = 'scale(1.05)';
            
            fireConfetti(false);
        }
    }, 1000); 
});

function fireConfetti(isLevelUp) {
    let count = isLevelUp ? 350 : 150;
    let spread = isLevelUp ? 120 : 80;
    confetti({ particleCount: count, spread: spread, origin: { y: 0.6 }, colors: ['#c05c36', '#e8d8ce', '#a3cc85'] });
}

// --- INITIALIZE ON LOAD ---
updateBtn.addEventListener('click', drawMatrix);
updateRPGProfile();
renderChart();
drawMatrix();