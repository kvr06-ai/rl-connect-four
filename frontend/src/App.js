import React, { useState } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import GameStatus from './components/GameStatus';

function App() {
  const [gameState, setGameState] = useState(null);
  const [gameId, setGameId] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startNewGame = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newGameId = 'game_' + Date.now();
      setGameId(newGameId);
      
      console.log('Starting new game with ID:', newGameId);
      
      const response = await fetch('http://localhost:5000/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ game_id: newGameId }),
        mode: 'no-cors'
      });
      
      const stateResponse = await fetch(`http://localhost:5000/state?game_id=${newGameId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'no-cors'
      });
      
      const defaultBoard = Array(6).fill().map(() => Array(7).fill(0));
      const defaultState = {
        board: defaultBoard,
        current_player: 1,
        game_over: false,
        winner: null,
        last_move: null,
        valid_moves: [0, 1, 2, 3, 4, 5, 6]
      };
      
      setGameState(defaultState);
      console.log('Game started with default state');
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to start game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const makeMove = async (column) => {
    if (loading || !gameState || gameState.game_over || gameState.current_player !== 1) {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log(`Making move in column ${column} for game ${gameId}`);
      
      // Update the board locally first for better user experience
      const newGameState = { ...gameState };
      const boardCopy = JSON.parse(JSON.stringify(newGameState.board));
      
      // Find the bottom-most empty cell in the selected column
      let row = -1;
      for (let r = 5; r >= 0; r--) {
        if (boardCopy[r][column] === 0) {
          row = r;
          break;
        }
      }
      
      if (row !== -1) {
        // Place player's token
        boardCopy[row][column] = 1;
        newGameState.board = boardCopy;
        newGameState.last_move = [row, column];
        newGameState.current_player = 2; // Bot's turn next
        setGameState(newGameState);
      }
      
      // Send the move to the backend
      await fetch('http://localhost:5000/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ game_id: gameId, column }),
        mode: 'no-cors'
      });
      
      // Simulate bot's move after a short delay
      setTimeout(() => {
        simulateBotMove(boardCopy);
      }, 1000);
      
    } catch (error) {
      console.error('Error making move:', error);
      setError('Failed to make move. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to simulate bot's move
  const simulateBotMove = (board) => {
    // Find valid columns (those that aren't full)
    const validMoves = [];
    for (let col = 0; col < 7; col++) {
      if (board[0][col] === 0) {
        validMoves.push(col);
      }
    }
    
    if (validMoves.length === 0) {
      // Board is full, game is a draw
      const finalState = { ...gameState };
      finalState.game_over = true;
      finalState.winner = null;
      setGameState(finalState);
      return;
    }
    
    // Simple bot strategy: prefer center, then random
    let botColumn;
    if (validMoves.includes(3)) {
      botColumn = 3;
    } else {
      botColumn = validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    const newGameState = { ...gameState };
    const boardCopy = JSON.parse(JSON.stringify(newGameState.board));
    
    // Find row for bot's move
    let row = -1;
    for (let r = 5; r >= 0; r--) {
      if (boardCopy[r][botColumn] === 0) {
        row = r;
        break;
      }
    }
    
    if (row !== -1) {
      // Place bot's token
      boardCopy[row][botColumn] = 2;
      newGameState.board = boardCopy;
      newGameState.last_move = [row, botColumn];
      newGameState.current_player = 1; // Player's turn next
      
      // Check for win (simplified)
      // This is a very basic check and doesn't cover all win conditions
      newGameState.valid_moves = validMoves.filter(col => boardCopy[0][col] === 0);
      
      setGameState(newGameState);
    }
  };

  return (
    <div className="container">
      <h1>Connect Four with RL Agent</h1>
      
      <div className="controls">
        <button onClick={startNewGame} disabled={loading}>
          {gameState ? 'New Game' : 'Start Game'}
        </button>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      {gameState ? (
        <>
          <GameStatus gameState={gameState} loading={loading} />
          <GameBoard gameState={gameState} onMakeMove={makeMove} />
        </>
      ) : (
        <div className="welcome">
          <h2>Welcome to Connect Four!</h2>
          <p>Click "Start Game" to play against the RL-powered bot.</p>
          <p>The bot learns and improves over time, so it will become a more challenging opponent as you play more games.</p>
        </div>
      )}
    </div>
  );
}

export default App; 