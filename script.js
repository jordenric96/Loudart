let targetScore = 30;
let players = [];
let currentPlayerIndex = 0;
let dartsThrownThisTurn = 0;
const MAX_DARTS = 3;
let history = []; 

// NATIVE AUDIO ENGINE (Geen MP3's nodig!)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    
    if (type === 'hit') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); 
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'miss') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(130, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.connect(g); g.connect(audioCtx.destination); o.frequency.value = freq;
            g.gain.setValueAtTime(0.1, audioCtx.currentTime + idx*0.1);
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + idx*0.1 + 0.3);
            o.start(audioCtx.currentTime + idx*0.1); o.stop(audioCtx.currentTime + idx*0.1 + 0.3);
        });
    }
}

// SETUP LOGIC
const targetInput = document.getElementById('target-score');
function adjustTarget(amount) {
    let current = parseInt(targetInput.value) + amount;
    if (current < 10) current = 10;
    if (current > 200) current = 200;
    targetInput.value = current;
}

document.getElementById('start-btn').addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    targetScore = parseInt(targetInput.value) || 30;
    players = [];
    document.querySelectorAll('.player-cb').forEach(cb => {
        if (cb.checked) {
            let name = cb.value; let avatar = '🧑';
            if (cb.id === 'extra-cb') { name = document.getElementById('extra-name').value || 'Gast'; avatar = '🌟'; }
            else if (name === 'Lou') avatar = '🦖'; else if (name === 'Mama') avatar = '👩‍🦰'; else if (name === 'Papa') avatar = '👨‍🦱';
            players.push({ name: name, score: 0, avatar: avatar });
        }
    });
    if(players.length === 0) return;
    currentPlayerIndex = 0; dartsThrownThisTurn = 0; history = [];
    document.getElementById('target-display').textContent = `${targetScore} PT`;
    buildRacetracks(); updateTurnUI(); switchScreen('game');
});

// UI BUILDER
function buildRacetracks() {
    const container = document.getElementById('players-tracks-container');
    container.innerHTML = '';
    players.forEach((p, idx) => {
        container.innerHTML += `
            <div class="race-row" id="race-row-${idx}">
                <div class="race-info"><span>${p.avatar} ${p.name}</span> <span id="score-val-${idx}" class="score-val">0 / ${targetScore}</span></div>
                <div class="track-line">
                    <div class="track-progress-fill" id="fill-${idx}"></div>
                    <div class="moving-arrow" id="arrow-${idx}">${p.avatar}</div>
                    <div class="fixed-board">🎯</div>
                </div>
            </div>`;
    });
}

// GAMEPLAY ACTIONS
document.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('click', (e) => {
        const pts = parseInt(card.getAttribute('data-points'));
        const color = card.getAttribute('data-color');
        
        // Zwevende score animatie
        const el = document.createElement('div');
        el.className = 'floating-score'; el.textContent = `+${pts}`;
        el.style.left = `${e.clientX - 20}px`; el.style.top = `${e.clientY - 40}px`; el.style.color = color;
        document.getElementById('floating-score-container').appendChild(el);
        setTimeout(() => el.remove(), 800);

        handleScore(pts);
    });
});

document.getElementById('miss-btn').addEventListener('click', () => { playSound('miss'); handleScore(0); });
document.getElementById('undo-btn').addEventListener('click', () => {
    if (history.length === 0) return;
    const last = history.pop();
    currentPlayerIndex = last.playerIndex; dartsThrownThisTurn = last.dartsThrownBefore;
    players[currentPlayerIndex].score -= last.pointsAdded;
    if(players[currentPlayerIndex].score < 0) players[currentPlayerIndex].score = 0;
    updateTrackProgress(currentPlayerIndex); updateTurnUI();
});
document.getElementById('restart-btn').addEventListener('click', () => switchScreen('setup'));

function handleScore(pts) {
    if(pts > 0) playSound('hit');
    const cp = players[currentPlayerIndex];
    history.push({ playerIndex: currentPlayerIndex, pointsAdded: pts, dartsThrownBefore: dartsThrownThisTurn });
    cp.score += pts;
    updateTrackProgress(currentPlayerIndex);

    if (cp.score >= targetScore) return setTimeout(() => triggerVictory(cp), 300);

    dartsThrownThisTurn++;
    if (dartsThrownThisTurn >= MAX_DARTS) { dartsThrownThisTurn = 0; currentPlayerIndex = (currentPlayerIndex + 1) % players.length; }
    updateTurnUI();
}

function updateTrackProgress(idx) {
    const p = players[idx];
    document.getElementById(`score-val-${idx}`).textContent = `${p.score} / ${targetScore}`;
    let percent = (p.score / targetScore) * 100; if (percent > 100) percent = 100;
    document.getElementById(`fill-${idx}`).style.width = `${percent}%`;
    document.getElementById(`arrow-${idx}`).style.left = `${percent * 0.92}%`;
}

function updateTurnUI() {
    players.forEach((_, idx) => document.getElementById(`race-row-${idx}`).classList.toggle('active-turn', idx === currentPlayerIndex));
    const cp = players[currentPlayerIndex];
    document.getElementById('current-player-name').textContent = cp.name;
    document.getElementById('current-avatar').textContent = cp.avatar;
    for (let i = 1; i <= MAX_DARTS; i++) document.getElementById(`dart${i}`).classList.toggle('active', i > dartsThrownThisTurn);
}

function triggerVictory(winner) {
    playSound('win');
    document.getElementById('winner-name').textContent = `${winner.name} IS DE KAMPIOEN! 🏆`;
    document.getElementById('winner-avatar').textContent = winner.avatar;
    switchScreen('winner'); fireConfetti();
}

function switchScreen(name) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(`${name}-screen`).classList.add('active'); }

function fireConfetti() {
    const cvs = document.getElementById('confetti-canvas'), ctx = cvs.getContext('2d');
    cvs.width = window.innerWidth; cvs.height = window.innerHeight;
    const pts = [], cols = ['#f44336', '#e91e63', '#2196f3', '#4CAF50', '#FFEB3B', '#FF9800'];
    for(let i=0;i<150;i++) pts.push({ x: Math.random()*cvs.width, y: Math.random()*cvs.height - cvs.height, w: Math.random()*12+6, h: Math.random()*12+6, c: cols[Math.floor(Math.random()*cols.length)], dy: Math.random()*5+4, dx: Math.random()*4-2, rot: Math.random()*360, rotS: Math.random()*4-2 });
    function render() {
        if (!document.getElementById('winner-screen').classList.contains('active')) return;
        ctx.clearRect(0,0,cvs.width,cvs.height);
        pts.forEach(p => {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot*Math.PI/180); ctx.fillStyle = p.c; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
            p.y += p.dy; p.x += p.dx; p.rot += p.rotS;
            if (p.y > cvs.height) { p.y = -10; p.x = Math.random()*cvs.width; }
        });
        requestAnimationFrame(render);
    }
    render();
}
