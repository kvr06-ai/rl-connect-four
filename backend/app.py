from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import requests
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Configure CORS properly to allow requests from the frontend
CORS(app, origins=["http://localhost:3000"], supports_credentials=True, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "OPTIONS"])

# Configuration
RL_SERVICE_URL = os.getenv('RL_SERVICE_URL', 'http://localhost:5001')

# Game constants
ROWS = 6
COLS = 7
EMPTY = 0
PLAYER = 1
BOT = 2

class ConnectFourGame:
    def __init__(self):
        self.board = np.zeros((ROWS, COLS), dtype=int)
        self.current_player = PLAYER  # Player starts first
        self.game_over = False
        self.winner = None
        self.last_move = None

    def make_move(self, column):
        """
        Make a move in the specified column.
        Returns True if the move is valid, False otherwise.
        """
        if self.game_over or column < 0 or column >= COLS:
            return False

        # Find the first empty row in the specified column
        for row in range(ROWS-1, -1, -1):
            if self.board[row][column] == EMPTY:
                self.board[row][column] = self.current_player
                self.last_move = (row, column)
                
                # Check for win or draw
                if self._check_win(row, column):
                    self.game_over = True
                    self.winner = self.current_player
                elif self._check_draw():
                    self.game_over = True
                    self.winner = None  # Draw
                
                # Switch player
                self.current_player = BOT if self.current_player == PLAYER else PLAYER
                return True

        # Column is full
        return False

    def _check_win(self, row, col):
        """Check if the last move resulted in a win."""
        player = self.board[row][col]
        
        # Check horizontal
        for c in range(max(0, col - 3), min(col + 1, COLS - 3)):
            if all(self.board[row][c + i] == player for i in range(4)):
                return True
        
        # Check vertical
        for r in range(max(0, row - 3), min(row + 1, ROWS - 3)):
            if all(self.board[r + i][col] == player for i in range(4)):
                return True
        
        # Check diagonal (down-right)
        for i in range(-3, 1):
            r, c = row + i, col + i
            if 0 <= r < ROWS - 3 and 0 <= c < COLS - 3:
                if all(self.board[r + j][c + j] == player for j in range(4)):
                    return True
        
        # Check diagonal (up-right)
        for i in range(-3, 1):
            r, c = row - i, col + i
            if 3 <= r < ROWS and 0 <= c < COLS - 3:
                if all(self.board[r - j][c + j] == player for j in range(4)):
                    return True
        
        return False

    def _check_draw(self):
        """Check if the game is a draw (board is full)."""
        return np.all(self.board != EMPTY)

    def get_valid_moves(self):
        """Return a list of valid column indices."""
        if self.game_over:
            return []
        return [col for col in range(COLS) if self.board[0][col] == EMPTY]

    def to_dict(self):
        """Convert the game state to a dictionary."""
        return {
            'board': self.board.tolist(),
            'current_player': self.current_player,
            'game_over': self.game_over,
            'winner': self.winner,
            'last_move': self.last_move,
            'valid_moves': self.get_valid_moves()
        }

# Global game storage (for simplicity; in production, use a proper database)
games = {}

@app.route('/start', methods=['POST'])
def start_game():
    """Initialize a new game."""
    try:
        data = request.json
        if data is None:
            print("Warning: Received null request.json in /start endpoint")
            return jsonify({'error': 'No JSON data received'}), 400
            
        game_id = data.get('game_id', 'default')
        print(f"Starting new game with ID: {game_id}")
        
        games[game_id] = ConnectFourGame()
        return jsonify(games[game_id].to_dict())
    except Exception as e:
        print(f"Error in start_game: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/move', methods=['POST'])
def make_move():
    """Process a user move, update state, and get bot's move."""
    data = request.json
    game_id = data.get('game_id', 'default')
    column = data.get('column')
    
    if game_id not in games:
        return jsonify({'error': 'Game not found'}), 404
    
    game = games[game_id]
    
    # Process player's move
    if not game.make_move(column):
        return jsonify({'error': 'Invalid move'}), 400
    
    # If game is over or it's player's turn again, return current state
    if game.game_over or game.current_player == PLAYER:
        return jsonify(game.to_dict())
    
    # Get bot's move from RL service
    try:
        response = requests.post(
            f"{RL_SERVICE_URL}/get_move",
            json={'board': game.board.tolist(), 'valid_moves': game.get_valid_moves()}
        )
        response.raise_for_status()
        bot_move = response.json().get('column')
        
        # Process bot's move
        if not game.make_move(bot_move):
            # Fallback to random valid move if RL service returns invalid move
            valid_moves = game.get_valid_moves()
            if valid_moves:
                game.make_move(np.random.choice(valid_moves))
    except Exception as e:
        # Fallback to random move if RL service is unavailable
        valid_moves = game.get_valid_moves()
        if valid_moves:
            game.make_move(np.random.choice(valid_moves))
    
    return jsonify(game.to_dict())

@app.route('/state', methods=['GET'])
def get_state():
    """Retrieve the current game state."""
    game_id = request.args.get('game_id', 'default')
    
    if game_id not in games:
        return jsonify({'error': 'Game not found'}), 404
    
    return jsonify(games[game_id].to_dict())

if __name__ == '__main__':
    app.run(debug=True, port=5000) 