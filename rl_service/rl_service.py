from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
import random
from collections import deque
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Game constants
ROWS = 6
COLS = 7
EMPTY = 0
PLAYER = 1
BOT = 2

# Simple agent without TensorFlow dependency
class SimpleAgent:
    def __init__(self):
        self.name = "Simple Agent"
        # Keep track of games and win rate for logging
        self.games_played = 0
        self.games_won = 0
        print("Initialized Simple Agent")

    def get_move(self, board, valid_moves):
        """Choose a move based on simple heuristics."""
        if not valid_moves:
            return random.randint(0, COLS - 1)
        
        # Convert board to numpy array if it's not already
        board = np.array(board)
        
        # Check if any move would result in a win for the bot
        for col in valid_moves:
            # Simulate the move
            temp_board = board.copy()
            for row in range(ROWS-1, -1, -1):
                if temp_board[row][col] == EMPTY:
                    temp_board[row][col] = BOT
                    if self._check_win(temp_board, row, col, BOT):
                        return col
                    break
        
        # Check if any move would block a win for the player
        for col in valid_moves:
            # Simulate the player's move
            temp_board = board.copy()
            for row in range(ROWS-1, -1, -1):
                if temp_board[row][col] == EMPTY:
                    temp_board[row][col] = PLAYER
                    if self._check_win(temp_board, row, col, PLAYER):
                        return col
                    break
        
        # Prefer the center column
        if 3 in valid_moves:
            return 3
        
        # Otherwise choose randomly
        return random.choice(valid_moves)
    
    def _check_win(self, board, row, col, player):
        """Check if the last move resulted in a win."""
        # Check horizontal
        for c in range(max(0, col - 3), min(col + 1, COLS - 3)):
            if all(board[row][c + i] == player for i in range(4)):
                return True
        
        # Check vertical
        for r in range(max(0, row - 3), min(row + 1, ROWS - 3)):
            if all(board[r + i][col] == player for i in range(4)):
                return True
        
        # Check diagonal (down-right)
        for i in range(-3, 1):
            r, c = row + i, col + i
            if 0 <= r < ROWS - 3 and 0 <= c < COLS - 3:
                if all(board[r + j][c + j] == player for j in range(4)):
                    return True
        
        # Check diagonal (up-right)
        for i in range(-3, 1):
            r, c = row - i, col + i
            if 3 <= r < ROWS and 0 <= c < COLS - 3:
                if all(board[r - j][c + j] == player for j in range(4)):
                    return True
        
        return False

# Initialize the agent
agent = SimpleAgent()

@app.route('/get_move', methods=['POST'])
def get_move():
    """Get the bot's move for the current game state."""
    data = request.json
    board = data.get('board')
    valid_moves = data.get('valid_moves')
    
    # Get action from agent
    action = agent.get_move(board, valid_moves)
    
    return jsonify({'column': int(action)})

@app.route('/train', methods=['POST'])
def train():
    """
    Simplified training endpoint that just logs the game outcome.
    In a real implementation, this would update the agent's policy.
    """
    data = request.json
    reward = data.get('reward', 0)
    done = data.get('done', False)
    
    if done:
        agent.games_played += 1
        if reward > 0:
            agent.games_won += 1
        
        win_rate = agent.games_won / agent.games_played if agent.games_played > 0 else 0
        print(f"Games played: {agent.games_played}, Win rate: {win_rate:.2f}")
    
    return jsonify({'status': 'success'})

@app.route('/start_background_training', methods=['POST'])
def start_background_training():
    """
    Simplified background training that just reports success.
    In a real implementation, this would start a training session.
    """
    episodes = request.json.get('episodes', 10)
    print(f"Simulating background training for {episodes} episodes")
    
    return jsonify({'status': 'success', 'episodes_trained': episodes})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 