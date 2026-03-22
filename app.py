"""
Flask Grid World - 深度強化學習 HW1
HW1-1: Grid Map Development
HW1-2: Random Policy & Policy Evaluation
HW1-3: Value Iteration & Optimal Policy
"""

from flask import Flask, render_template, request, jsonify
import random
import copy

app = Flask(__name__)

# Actions: 0=up, 1=down, 2=left, 3=right
ACTIONS = [0, 1, 2, 3]
ACTION_NAMES = {0: 'up', 1: 'down', 2: 'left', 3: 'right'}
ACTION_DELTAS = {
    0: (-1, 0),   # up
    1: (1, 0),    # down
    2: (0, -1),   # left
    3: (0, 1),    # right
}

GAMMA = 0.9       # discount factor
THETA = 1e-6      # convergence threshold
REWARD_STEP = -1   # reward for each step
REWARD_GOAL = 0    # reward for reaching goal


def get_next_state(r, c, action, n):
    """Get next state given current position and action."""
    dr, dc = ACTION_DELTAS[action]
    nr, nc = r + dr, c + dc
    if 0 <= nr < n and 0 <= nc < n:
        return nr, nc
    return r, c  # stay in place if out of bounds


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/random_policy', methods=['POST'])
def random_policy():
    """Generate a random policy for each non-terminal, non-obstacle cell."""
    data = request.get_json()
    n = data['n']
    start = tuple(data['start'])
    end = tuple(data['end'])
    obstacles = [tuple(o) for o in data['obstacles']]

    policy = {}
    for r in range(n):
        for c in range(n):
            cell = (r, c)
            if cell == end or cell in obstacles:
                policy[f"{r},{c}"] = -1  # no action
            else:
                policy[f"{r},{c}"] = random.choice(ACTIONS)

    return jsonify({'policy': policy})


@app.route('/api/policy_evaluation', methods=['POST'])
def policy_evaluation():
    """Evaluate a given policy and return V(s) for each state."""
    data = request.get_json()
    n = data['n']
    start = tuple(data['start'])
    end = tuple(data['end'])
    obstacles = [tuple(o) for o in data['obstacles']]
    policy = data['policy']  # dict: "r,c" -> action_index

    # Initialize values
    V = [[0.0] * n for _ in range(n)]

    iteration = 0
    while True:
        delta = 0.0
        new_V = [[0.0] * n for _ in range(n)]
        for r in range(n):
            for c in range(n):
                cell = (r, c)
                if cell == end or cell in obstacles:
                    new_V[r][c] = 0.0
                    continue

                key = f"{r},{c}"
                action = policy.get(key, 0)
                if isinstance(action, str):
                    action = int(action)
                if action == -1:
                    new_V[r][c] = 0.0
                    continue

                nr, nc = get_next_state(r, c, action, n)
                if (nr, nc) in obstacles:
                    nr, nc = r, c  # can't move into obstacle

                reward = REWARD_GOAL if (nr, nc) == end else REWARD_STEP
                new_V[r][c] = reward + GAMMA * V[nr][nc]

                delta = max(delta, abs(new_V[r][c] - V[r][c]))

        V = new_V
        iteration += 1
        if delta < THETA:
            break

    # Round values
    values = {}
    for r in range(n):
        for c in range(n):
            values[f"{r},{c}"] = round(V[r][c], 2)

    return jsonify({'values': values, 'iterations': iteration})


@app.route('/api/value_iteration', methods=['POST'])
def value_iteration():
    """Run value iteration to find optimal policy and V(s)."""
    data = request.get_json()
    n = data['n']
    start = tuple(data['start'])
    end = tuple(data['end'])
    obstacles = [tuple(o) for o in data['obstacles']]

    # Initialize values
    V = [[0.0] * n for _ in range(n)]

    iteration = 0
    while True:
        delta = 0.0
        new_V = [[0.0] * n for _ in range(n)]
        for r in range(n):
            for c in range(n):
                cell = (r, c)
                if cell == end or cell in obstacles:
                    new_V[r][c] = 0.0
                    continue

                best_value = float('-inf')
                for action in ACTIONS:
                    nr, nc = get_next_state(r, c, action, n)
                    if (nr, nc) in obstacles:
                        nr, nc = r, c  # can't move into obstacle

                    reward = REWARD_GOAL if (nr, nc) == end else REWARD_STEP
                    value = reward + GAMMA * V[nr][nc]
                    if value > best_value:
                        best_value = value

                new_V[r][c] = best_value
                delta = max(delta, abs(new_V[r][c] - V[r][c]))

        V = new_V
        iteration += 1
        if delta < THETA:
            break

    # Extract optimal policy
    optimal_policy = {}
    values = {}
    for r in range(n):
        for c in range(n):
            cell = (r, c)
            values[f"{r},{c}"] = round(V[r][c], 2)

            if cell == end or cell in obstacles:
                optimal_policy[f"{r},{c}"] = -1
                continue

            best_action = 0
            best_value = float('-inf')
            for action in ACTIONS:
                nr, nc = get_next_state(r, c, action, n)
                if (nr, nc) in obstacles:
                    nr, nc = r, c

                reward = REWARD_GOAL if (nr, nc) == end else REWARD_STEP
                value = reward + GAMMA * V[nr][nc]
                if value > best_value:
                    best_value = value
                    best_action = action

            optimal_policy[f"{r},{c}"] = best_action

    return jsonify({
        'policy': optimal_policy,
        'values': values,
        'iterations': iteration
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
