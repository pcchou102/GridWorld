/**
 * Grid World - 深度強化學習 HW1
 * Frontend logic for grid interaction, policy display, and value visualization.
 */

// ===== State =====
const state = {
    n: 5,
    mode: 'start',       // 'start' | 'end' | 'obstacle'
    start: null,          // [r, c]
    end: null,            // [r, c]
    obstacles: [],        // [[r,c], ...]
    policy: null,         // { "r,c": action }
    values: null,         // { "r,c": value }
    isOptimal: false,     // whether current policy is from value iteration
};

const ARROW_MAP = {
    0: '↑',  // up
    1: '↓',  // down
    2: '←',  // left
    3: '→',  // right
};

// ===== DOM Elements =====
const gridContainer = document.getElementById('grid-container');
const gridSizeSlider = document.getElementById('grid-size');
const gridSizeLabel = document.getElementById('grid-size-label');
const obstacleCount = document.getElementById('obstacle-count');
const obstacleMax = document.getElementById('obstacle-max');
const statusText = document.getElementById('status-text');
const statusIcon = document.getElementById('status-icon');
const statusBar = document.getElementById('status-bar');
const iterationInfo = document.getElementById('iteration-info');
const iterCount = document.getElementById('iter-count');

const btnRandomPolicy = document.getElementById('btn-random-policy');
const btnPolicyEval = document.getElementById('btn-policy-eval');
const btnValueIteration = document.getElementById('btn-value-iteration');
const btnReset = document.getElementById('btn-reset');

const modeButtons = document.querySelectorAll('.mode-btn');

// ===== Initialization =====
function init() {
    buildGrid();
    updateObstacleInfo();
    updateButtons();
}

// ===== Grid Building =====
function buildGrid() {
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${state.n}, 80px)`;

    let currentId = 1;
    for (let r = 0; r < state.n; r++) {
        for (let c = 0; c < state.n; c++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.style.animationDelay = `${(r * state.n + c) * 30}ms`;
            
            const cellNumber = document.createElement('span');
            cellNumber.className = 'cell-number';
            cellNumber.textContent = currentId++;
            cell.appendChild(cellNumber);

            cell.addEventListener('click', () => handleCellClick(r, c));
            gridContainer.appendChild(cell);
        }
    }
}

// ===== Cell Click Handler =====
function handleCellClick(r, c) {
    const key = `${r},${c}`;

    const clearOtherTypes = () => {
        if (state.mode !== 'start' && state.start && state.start[0] === r && state.start[1] === c) state.start = null;
        if (state.mode !== 'end' && state.end && state.end[0] === r && state.end[1] === c) state.end = null;
        state.obstacles = state.obstacles.filter(o => !(o[0] === r && o[1] === c));
    };

    if (state.mode === 'start') {
        if (state.start && state.start[0] === r && state.start[1] === c) {
            state.start = null; 
            setStatus('💡', '起點已取消，請重新設定起點', '');
        } else {
            state.start = [r, c];
            clearOtherTypes();
            if (!state.end) {
                setMode('end');
                setStatus('✅', '起點已設定！請點擊設定終點（紅色）', 'success');
            } else {
                setMode('obstacle');
                setStatus('✅', '起點已設定！請點擊設定障礙物或開始演算法', 'success');
            }
        }
    } else if (state.mode === 'end') {
        if (state.end && state.end[0] === r && state.end[1] === c) {
            state.end = null; 
            setStatus('💡', '終點已取消，請重新設定終點', '');
        } else {
            state.end = [r, c];
            clearOtherTypes();
            setMode('obstacle');
            setStatus('✅', '終點已設定！請點擊設定障礙物或開始演算法', 'success');
        }
    } else if (state.mode === 'obstacle') {
        const idx = state.obstacles.findIndex(o => o[0] === r && o[1] === c);
        if (idx !== -1) {
            state.obstacles.splice(idx, 1); 
        } else {
            const maxObstacles = state.n - 2;
            if (state.obstacles.length >= maxObstacles) {
                setStatus('⚠️', `障礙物已達上限 (${maxObstacles})！`, 'warning');
            } else {
                clearOtherTypes();
                state.obstacles.push([r, c]);
            }
        }
    }

    // Clear policy/values when grid changes
    state.policy = null;
    state.values = null;
    state.isOptimal = false;
    iterationInfo.style.display = 'none';

    renderGrid();
    updateObstacleInfo();
    updateButtons();
}

// ===== Render Grid =====
function renderGrid() {
    const cells = gridContainer.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const key = `${r},${c}`;

        // Reset classes
        cell.className = 'grid-cell';
        
        // Keep cell number
        const cellNumberText = (r * state.n + c + 1);
        cell.innerHTML = `<span class="cell-number">${cellNumberText}</span>`;

        // Apply cell type
        if (state.start && state.start[0] === r && state.start[1] === c) {
            cell.classList.add('start');
            cell.innerHTML += '<span class="cell-label">S</span>';
        } else if (state.end && state.end[0] === r && state.end[1] === c) {
            cell.classList.add('end');
            cell.innerHTML += '<span class="cell-label">G</span>';
        } else if (state.obstacles.some(o => o[0] === r && o[1] === c)) {
            cell.classList.add('obstacle');
        } else {
            // Show policy arrow and/or value
            let html = '';

            if (state.policy && state.policy[key] !== undefined && state.policy[key] !== -1) {
                const arrow = ARROW_MAP[state.policy[key]];
                html += `<span class="cell-arrow">${arrow}</span>`;
                if (state.isOptimal) {
                    cell.classList.add('optimal-policy');
                }
            }

            if (state.values && state.values[key] !== undefined) {
                const val = state.values[key];
                html += `<span class="cell-value">${val}</span>`;

                // Heatmap coloring
                if (val > -3) cell.classList.add('value-high');
                else if (val > -7) cell.classList.add('value-mid');
                else cell.classList.add('value-low');
            }

            cell.innerHTML += html;
        }
    });
}

// ===== Status Helpers =====
function setStatus(icon, text, type) {
    statusIcon.textContent = icon;
    statusText.textContent = text;
    statusBar.className = 'status-bar' + (type ? ` ${type}` : '');
}

function updateObstacleInfo() {
    obstacleCount.textContent = state.obstacles.length;
    obstacleMax.textContent = state.n - 2;
}

function updateButtons() {
    const hasSetup = state.start !== null && state.end !== null;
    btnRandomPolicy.disabled = !hasSetup;
    btnValueIteration.disabled = !hasSetup;
    btnPolicyEval.disabled = !hasSetup || !state.policy;
}

// ===== Mode Selection =====
function setMode(newMode) {
    state.mode = newMode;
    modeButtons.forEach(b => {
        b.classList.remove('active');
        if (b.dataset.mode === newMode) b.classList.add('active');
    });
}

modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        setMode(btn.dataset.mode);
    });
});

// ===== Grid Size Slider =====
gridSizeSlider.addEventListener('input', () => {
    state.n = parseInt(gridSizeSlider.value);
    gridSizeLabel.textContent = state.n;
    resetState();
    buildGrid();
    updateObstacleInfo();
    updateButtons();
    setStatus('💡', '網格大小已更改，請重新設定起點', '');
});

// ===== Reset =====
function resetState() {
    state.start = null;
    state.end = null;
    state.obstacles = [];
    state.policy = null;
    state.values = null;
    state.isOptimal = false;
    iterationInfo.style.display = 'none';
    setMode('start');
}

btnReset.addEventListener('click', () => {
    resetState();
    buildGrid();
    updateObstacleInfo();
    updateButtons();
    setStatus('💡', '已重置，請設定起點（綠色）', '');
});

// ===== RL Algorithms (Local) =====
const ACTIONS = [0, 1, 2, 3];
const ACTION_DELTAS = {
    0: [-1, 0],   // up
    1: [1, 0],    // down
    2: [0, -1],   // left
    3: [0, 1],    // right
};
const GAMMA = 0.9;
const THETA = 1e-6;
const REWARD_STEP = -1;
const REWARD_GOAL = 0;

function getNextState(r, c, action, n) {
    const dr = ACTION_DELTAS[action][0];
    const dc = ACTION_DELTAS[action][1];
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
        return [nr, nc];
    }
    return [r, c];
}

// Random Policy
btnRandomPolicy.addEventListener('click', () => {
    btnRandomPolicy.disabled = true;
    setStatus('⏳', '正在生成隨機策略...', '');

    setTimeout(() => {
        try {
            const n = state.n;
            const end = state.end;
            const obstacles = state.obstacles || [];
            
            const policy = {};
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    const isEnd = end && end[0] === r && end[1] === c;
                    const isObs = obstacles.some(o => o[0] === r && o[1] === c);
                    if (isEnd || isObs) {
                        policy[`${r},${c}`] = -1;
                    } else {
                        policy[`${r},${c}`] = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
                    }
                }
            }

            state.policy = policy;
            state.values = null;
            state.isOptimal = false;
            iterationInfo.style.display = 'none';

            renderGrid();
            updateButtons();
            setStatus('🎲', '隨機策略已生成！可執行「策略評估」查看 V(s)', 'success');
        } catch (err) {
            setStatus('❌', '生成策略失敗：' + err.message, 'warning');
        }
        btnRandomPolicy.disabled = false;
    }, 50); // slight delay to show status
});

// Policy Evaluation
btnPolicyEval.addEventListener('click', () => {
    if (!state.policy) return;
    btnPolicyEval.disabled = true;
    setStatus('⏳', '正在執行策略評估...', '');

    setTimeout(() => {
        try {
            const n = state.n;
            const end = state.end;
            const obstacles = state.obstacles || [];
            const policy = state.policy;

            let V = Array.from({length: n}, () => new Array(n).fill(0.0));
            let iteration = 0;

            while (true) {
                let delta = 0.0;
                let new_V = Array.from({length: n}, () => new Array(n).fill(0.0));
                
                for (let r = 0; r < n; r++) {
                    for (let c = 0; c < n; c++) {
                        const isEnd = end && end[0] === r && end[1] === c;
                        const isObs = obstacles.some(o => o[0] === r && o[1] === c);
                        
                        if (isEnd || isObs) {
                            new_V[r][c] = 0.0;
                            continue;
                        }

                        const key = `${r},${c}`;
                        let action = policy[key];
                        if (action === undefined || action === -1) {
                            new_V[r][c] = 0.0;
                            continue;
                        }

                        let [nr, nc] = getNextState(r, c, action, n);
                        if (obstacles.some(o => o[0] === nr && o[1] === nc)) {
                            nr = r;
                            nc = c;
                        }

                        const reward = (nr === end[0] && nc === end[1]) ? REWARD_GOAL : REWARD_STEP;
                        new_V[r][c] = reward + GAMMA * V[nr][nc];

                        delta = Math.max(delta, Math.abs(new_V[r][c] - V[r][c]));
                    }
                }

                V = new_V;
                iteration++;
                if (delta < THETA) break;
            }

            const values = {};
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    values[`${r},${c}`] = Number(V[r][c].toFixed(2));
                }
            }

            state.values = values;
            iterCount.textContent = iteration;
            iterationInfo.style.display = 'inline-block';

            renderGrid();
            setStatus('📊', `策略評估完成！共迭代 ${iteration} 次`, 'success');
        } catch (err) {
            setStatus('❌', '策略評估失敗：' + err.message, 'warning');
        }
        btnPolicyEval.disabled = false;
    }, 50);
});

// Value Iteration
btnValueIteration.addEventListener('click', () => {
    btnValueIteration.disabled = true;
    setStatus('⏳', '正在執行價值迭代...', '');

    setTimeout(() => {
        try {
            const n = state.n;
            const end = state.end;
            const obstacles = state.obstacles || [];

            let V = Array.from({length: n}, () => new Array(n).fill(0.0));
            let iteration = 0;

            while (true) {
                let delta = 0.0;
                let new_V = Array.from({length: n}, () => new Array(n).fill(0.0));
                
                for (let r = 0; r < n; r++) {
                    for (let c = 0; c < n; c++) {
                        const isEnd = end && end[0] === r && end[1] === c;
                        const isObs = obstacles.some(o => o[0] === r && o[1] === c);
                        
                        if (isEnd || isObs) {
                            new_V[r][c] = 0.0;
                            continue;
                        }

                        let best_value = -Infinity;
                        for (let action of ACTIONS) {
                            let [nr, nc] = getNextState(r, c, action, n);
                            if (obstacles.some(o => o[0] === nr && o[1] === nc)) {
                                nr = r;
                                nc = c;
                            }

                            const reward = (nr === end[0] && nc === end[1]) ? REWARD_GOAL : REWARD_STEP;
                            const value = reward + GAMMA * V[nr][nc];
                            if (value > best_value) {
                                best_value = value;
                            }
                        }

                        new_V[r][c] = best_value;
                        delta = Math.max(delta, Math.abs(new_V[r][c] - V[r][c]));
                    }
                }

                V = new_V;
                iteration++;
                if (delta < THETA) break;
            }

            const optimal_policy = {};
            const values = {};
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    values[`${r},${c}`] = Number(V[r][c].toFixed(2));

                    const isEnd = end && end[0] === r && end[1] === c;
                    const isObs = obstacles.some(o => o[0] === r && o[1] === c);
                    
                    if (isEnd || isObs) {
                        optimal_policy[`${r},${c}`] = -1;
                        continue;
                    }

                    let best_action = 0;
                    let best_value = -Infinity;
                    for (let action of ACTIONS) {
                        let [nr, nc] = getNextState(r, c, action, n);
                        if (obstacles.some(o => o[0] === nr && o[1] === nc)) {
                            nr = r;
                            nc = c;
                        }

                        const reward = (nr === end[0] && nc === end[1]) ? REWARD_GOAL : REWARD_STEP;
                        const value = reward + GAMMA * V[nr][nc];
                        if (value > best_value) {
                            best_value = value;
                            best_action = action;
                        }
                    }

                    optimal_policy[`${r},${c}`] = best_action;
                }
            }

            state.policy = optimal_policy;
            state.values = values;
            state.isOptimal = true;

            iterCount.textContent = iteration;
            iterationInfo.style.display = 'inline-block';

            renderGrid();
            updateButtons();
            setStatus('🚀', `價值迭代完成！最佳策略已顯示，共迭代 ${iteration} 次`, 'success');
        } catch (err) {
            setStatus('❌', '價值迭代失敗：' + err.message, 'warning');
        }
        btnValueIteration.disabled = false;
    }, 50);
});

// ===== Start =====
init();
