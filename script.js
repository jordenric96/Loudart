// --- SPEL STATUS ---
let targetScore = 30;
let players = [];
let currentPlayerIndex = 0;
let dartsThrownThisTurn = 0;
const MAX_DARTS = 3;
let history = []; // Slaat beurten op voor de Undo (Oeps) knop

// --- DOM ELEMENTEN ---
const screens = {
    setup: document.getElementById('setup-screen'),
    game: document.getElementById('game-screen'),
    winner: document.getElementById('winner-screen')
};

const setupBtn = document.getElementById('start-btn');
const extraCb = document.getElementById('extra-cb');
const extraName = document.getElementById('extra-name');
const errorMsg = document.getElementById('error-msg');
const checkboxes = document.querySelectorAll('.player-cb');

const playersListDiv = document.getElementById('players-list');
const targetDisplay = document.getElementById('target-display');
const currentPlayerNameSpan = document.getElementById('current-player-name');
const dartIcons = [
    document.getElementById('dart1'),
    document.getElementById('dart2'),
    document.getElementById('dart3')
];

// --- EVENT LISTENERS ---
setupBtn.addEventListener('click', startGame);

extraName.addEventListener('input', () => {
    if(extraName.value.trim() !== '') extraCb.checked = true;
    else extraCb.checked = false;
});

document.querySelectorAll('.target-btn').forEach(btn => {
    btn.addEventListener('click', () => handleScore(parseInt(btn.getAttribute('data-points'))));
});

document.getElementById('miss-btn').addEventListener('click', () => handleScore(0));
document.getElementById('undo-btn').addEventListener('click', undoLastThrow);
document.getElementById('restart-btn').addEventListener('click', resetToSetup);

// --- FUNCTIES ---

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function startGame() {
    targetScore = parseInt(document.getElementById('target-score').value) || 30;
    
    players = [];
    checkboxes.forEach(cb => {
        if (cb.checked) {
            let name = cb.value;
            if (cb.id === 'extra-cb') name = extraName.value.trim() || 'Speler 4';
            players.push({ name: name, score: 0 });
        }
    });

    if (players.length === 0) {
        errorMsg.textContent = "Kies minstens 1 speler!";
        return;
    }
    if (players.length > 4) {
        errorMsg.textContent = "Maximaal 4 spelers toegestaan!";
        return;
    }

    errorMsg.textContent = "";
    currentPlayerIndex = 0;
    dartsThrownThisTurn = 0;
    history = [];
    
    targetDisplay.textContent = `(Tot ${targetScore} pt)`;
    buildScoreboard();
    updateTurnUI();
    switchScreen('game');
}

function buildScoreboard() {
    playersListDiv.innerHTML = '';
    
    const getAvatar = (name) => {
        let n = name.toLowerCase();
        if(n.includes('lou')) return '🦖';
        if(n.includes('mama')) return '👩';
        if(n.includes('papa')) return '👨';
        return '🧑';
    };

    players.forEach((p, index) => {
        const row = document.createElement('div');
        row.className = `player-row ${index === currentPlayerIndex ? 'active-player' : ''}`;
        row.id = `player-row-${index}`;
        
        row.innerHTML = `
            <div class="player-info">
                <span>${getAvatar(p.name)} ${p.name}</span>
                <span id="score-text-${index}">0 pt</span>
            </div>
            <div class="track-container">
                <div class="track-fill" id="track-fill-${index}"></div>
                <div class="progress-arrow" id="arrow-${index}">🏹</div>
                <div class="dartboard-target">🎯</div>
            </div>
        `;
        playersListDiv.appendChild(row);
    });
}

function updateTurnUI() {
    document.querySelectorAll('.player-row').forEach((row, idx) => {
        row.classList.toggle('active-player', idx === currentPlayerIndex);
    });
    
    currentPlayerNameSpan.textContent = players[currentPlayerIndex].name;
    
    // Update de 3 fysieke dart-icoontjes op het scherm
    dartIcons.forEach((icon, idx) => {
        if (idx >= dartsThrownThisTurn) icon.classList.add('active');
        else icon.classList.remove('active');
    });
}

function updatePlayerProgress(playerIndex) {
    const p = players[playerIndex];
    document.getElementById(`score-text-${playerIndex}`).textContent = `${p.score} pt`;
    
    let percent = (p.score / targetScore) * 100;
    if (percent > 100) percent = 100;
    
    // Houd de pijl net voor het dartbordje aan het einde
    let arrowPercent = percent * 0.92; 
    
    document.getElementById(`track-fill-${playerIndex}`).style.width = `${percent}%`;
    document.getElementById(`arrow-${playerIndex}`).style.left = `${arrowPercent}%`;
}

function handleScore(points) {
    const p = players[currentPlayerIndex];
    
    history.push({
        playerIndex: currentPlayerIndex,
        pointsAdded: points,
        dartsThrownBefore: dartsThrownThisTurn
    });
    
    p.score += points;
    updatePlayerProgress(currentPlayerIndex);
    
    if (p.score >= targetScore) {
        setTimeout(() => triggerWin(p.name), 400);
        return;
    }
    
    dartsThrownThisTurn++;
    if (dartsThrownThisTurn >= MAX_DARTS) {
        dartsThrownThisTurn = 0;
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    }
    
    updateTurnUI();
}

function undoLastThrow() {
    if (history.length === 0) return;
    
    const lastAction = history.pop();
    currentPlayerIndex = lastAction.playerIndex;
    dartsThrownThisTurn = lastAction.dartsThrownBefore;
    
    players[currentPlayerIndex].score -= lastAction.pointsAdded;
    if (players[currentPlayerIndex].score < 0) players[currentPlayerIndex].score = 0;
    
    updatePlayerProgress(currentPlayerIndex);
    updateTurnUI();
}

function triggerWin(winnerName) {
    document.getElementById('winner-name').textContent = `${winnerName} is de kampioen!`;
    switchScreen('winner');
    fireConfetti();
}

function resetToSetup() {
    switchScreen('setup');
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// --- VISUEEL: CONFETTI GENERATOR ---
function fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const pieces = [];
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4CAF50', '#FFEB3B', '#FF9800'];
    
    for (let i = 0; i < 150; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 10 + 6,
            h: Math.random() * 10 + 6,
            c: colors[Math.floor(Math.random() * colors.length)],
            dy: Math.random() * 4 + 3,
            dx: Math.random() * 4 - 2,
            rot: Math.random() * 360,
            dRot: Math.random() * 4 - 2
        });
    }
    
    function draw() {
        if (!screens.winner.classList.contains('active')) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        pieces.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.c;
            ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
            ctx.restore();
            
            p.y += p.dy;
            p.x += p.dx;
            p.rot += p.dRot;
            
            if (p.y > canvas.height) {
                p.y = -10;
                p.x = Math.random() * canvas.width;
            }
        });
        requestAnimationFrame(draw);
    }
    draw();
}
