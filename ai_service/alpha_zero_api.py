from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import numpy as np
import os
import sys
import traceback

# Import the AlphaZero code
from ResNet import ResNet
from Game_bitboard import Game
from MCTS_NN import MCTS_NN
import config

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Global model and MCTS objects
model = None
mcts = None

@app.route('/health', methods=['GET'])
def health_check():
    """Check if the API is running and ready to serve requests"""
    return jsonify({"status": "ok", "model_loaded": model is not None})

@app.route('/initialize', methods=['POST'])
def initialize():
    """Initialize the AlphaZero model"""
    global model, mcts
    
    try:
        # Initialize model if not already loaded
        if model is None:
            print("Loading AlphaZero model...")
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            print(f"Using device: {device}")
            
            # Set up the model
            model = ResNet(game=Game(), 
                          res_layer_number=config.res_layer_number, 
                          device=device)
            model.load_state_dict(torch.load('best_model_resnet.pth', 
                                            map_location=device))
            model.eval()
            
            # Initialize MCTS
            mcts = MCTS_NN(game=Game(), model=model, 
                          exploration_weight=config.exploration_weight, 
                          random_simulation=False, 
                          simulation_number=1500)  # Increase simulations for stronger play
            
            print("AlphaZero model loaded successfully")
            
        return jsonify({"status": "success", "message": "Model initialized"})
        
    except Exception as e:
        error_msg = f"Error initializing model: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return jsonify({"status": "error", "message": error_msg}), 500

@app.route('/get_move', methods=['POST'])
def get_move():
    """
    Get the best move for the current board state using AlphaZero
    
    Expects a JSON payload with:
    {
        "board": [[0,0,0,0,0,0,0], 
                  [0,0,0,0,0,0,0],
                  ...],  # 6x7 board with 0=empty, 1=player, 2=bot
    }
    
    Returns:
    {
        "move": 3,  # column index (0-6)
        "status": "success"
    }
    """
    global model, mcts
    
    if model is None or mcts is None:
        return jsonify({
            "status": "error", 
            "message": "Model not initialized. Call /initialize first."
        }), 400
    
    try:
        # Get board state from request
        data = request.json
        if not data or 'board' not in data:
            return jsonify({
                "status": "error", 
                "message": "No board data provided"
            }), 400
        
        board = data['board']
        
        # Validate board
        if len(board) != 6 or any(len(row) != 7 for row in board):
            return jsonify({
                "status": "error", 
                "message": "Invalid board dimensions. Must be 6x7."
            }), 400
            
        # Count pieces to determine current player
        player_pieces = sum(row.count(1) for row in board)
        bot_pieces = sum(row.count(2) for row in board)
        
        # Determine current player
        # In Connect Four, player 1 always goes first
        # If player_pieces == bot_pieces, it's player 1's turn
        # If player_pieces > bot_pieces, it's player 2's turn
        current_player = 1 if player_pieces == bot_pieces else 2
        
        # Create a Game object
        game = Game()
        
        # Construct the board state by replaying the moves
        # First, find all moves that have been made so far
        moves_so_far = []
        
        # Build a sequence of moves that led to this position
        for col in range(7):
            # For each column, identify the pieces from bottom to top
            for row in range(5, -1, -1):
                if board[row][col] != 0:
                    # Add this move to our list
                    player_id = board[row][col]
                    moves_so_far.append((col, player_id))
                    
                    # Stop when we hit the first empty space
                    if row > 0 and board[row-1][col] == 0:
                        break
        
        # Sort moves by vertical position to reconstruct the game
        moves_so_far.sort(key=lambda move: (move[0], -sum(1 for r in range(6) if board[r][move[0]] != 0)))
        
        # Reset game to initial state
        game.reset()
        
        # Replay each move to reconstruct the current game state
        for col, player_id in moves_so_far:
            # if the move is valid
            if col in game.get_valid_moves():
                # make the move
                game.play_action(col)
            else:
                # This shouldn't happen with valid input
                print(f"Warning: Invalid move detected during reconstruction: col={col}, player={player_id}")
                
        # Check if the game is already over
        if game.check_game_over()[0]:
            # Game is already over, return a message
            return jsonify({
                "status": "game_over",
                "message": "Game is already over"
            })

        # Verify it's the bot's turn (player 2)
        if current_player != 2:
            return jsonify({
                "status": "error",
                "message": "It's not the bot's turn"
            }), 400
        
        # Use MCTS to get the best move
        mcts.simulation_number = 1500  # Set simulation count
        action, action_probs = mcts.get_action(game, temperature=0.1)
        
        # If MCTS returned an invalid move (shouldn't happen, but just in case)
        valid_moves = game.get_valid_moves()
        if action not in valid_moves:
            print(f"Warning: MCTS returned invalid move {action}. Valid moves: {valid_moves}")
            
            # Fall back to highest probability valid move
            valid_probs = [(a, action_probs[a]) for a in valid_moves]
            if valid_probs:
                action = max(valid_probs, key=lambda x: x[1])[0]
            else:
                # If no valid moves (shouldn't happen)
                return jsonify({
                    "status": "error",
                    "message": "No valid moves available"
                }), 400
        
        return jsonify({
            "status": "success",
            "move": int(action)
        })
        
    except Exception as e:
        error_msg = f"Error getting move: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return jsonify({"status": "error", "message": error_msg}), 500

if __name__ == '__main__':
    print("Starting AlphaZero API server...")
    app.run(host='0.0.0.0', port=5002, debug=False) 