import React, { useState, useEffect } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import GameStatus from './components/GameStatus';
import DifficultySelector from './components/DifficultySelector';
import FirstPlayerSelector from './components/FirstPlayerSelector';
import StatsDisplay from './components/StatsDisplay';
import { initializeStrongBot, getStrongBotMove } from './ai/strongBot';

function App() {
  const [gameState, setGameState] = useState(null);
  const [gameId, setGameId] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [difficulty, setDifficulty] = useState('medium'); // Default difficulty
  const [firstPlayer, setFirstPlayer] = useState('player'); // Default first player
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    botWins: 0,
    playerWins: 0,
    draws: 0,
    averageMoves: 0,
    totalMoves: 0
  });
  const [moveCount, setMoveCount] = useState(0);
  const [aiInitialized, setAiInitialized] = useState(false);
  
  // Initialize the strong bot on first render
  useEffect(() => {
    async function loadAI() {
      try {
        await initializeStrongBot();
        setAiInitialized(true);
        console.log("Strong bot AI initialized successfully");
      } catch (error) {
        console.error("Failed to initialize strong bot:", error);
        setError("Failed to initialize AI. Falling back to basic bot.");
      }
    }
    
    loadAI();
  }, []);
  
  // Load stats from localStorage on component mount
  useEffect(() => {
    const savedStats = localStorage.getItem('connectFourStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);
  
  // Save stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('connectFourStats', JSON.stringify(stats));
  }, [stats]);

  const startNewGame = async () => {
    setLoading(true);
    setError(null);
    setMoveCount(0);
    
    try {
      const newGameId = 'game_' + Date.now();
      setGameId(newGameId);
      
      console.log('Starting new game with ID:', newGameId, 'Difficulty:', difficulty, 'First Player:', firstPlayer);
      
      // Create a default empty board
      const defaultBoard = Array(6).fill().map(() => Array(7).fill(0));
      const defaultState = {
        board: defaultBoard,
        current_player: firstPlayer === 'player' ? 1 : 2, // Set the first player based on selection
        game_over: false,
        winner: null,
        last_move: null,
        valid_moves: [0, 1, 2, 3, 4, 5, 6]
      };
      
      setGameState(defaultState);
      console.log('Game started with default state');
      
      // If bot goes first, trigger its move
      if (firstPlayer === 'bot') {
        setTimeout(() => {
          simulateBotMove(defaultBoard, difficulty, 0);
        }, 500);
      }
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
      
      // Increment move counter
      const newMoveCount = moveCount + 1;
      setMoveCount(newMoveCount);
      
      // Update the board locally for better user experience
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
        console.log(`Player placing token at row ${row}, column ${column}`);
        
        // Place player's token
        boardCopy[row][column] = 1;
        newGameState.board = boardCopy;
        newGameState.last_move = [row, column];
        
        // Check if player won
        if (checkWin(boardCopy, row, column, 1)) {
          newGameState.game_over = true;
          newGameState.winner = 1;
          newGameState.current_player = 1;
          console.log("Player wins!");
          
          // Update stats
          updateStats('player', newMoveCount);
          
          setGameState(newGameState);
          setLoading(false);
          return;
        }
        
        // Update valid moves
        const validMoves = [];
        for (let col = 0; col < 7; col++) {
          if (boardCopy[0][col] === 0) {
            validMoves.push(col);
          }
        }
        
        // Check for draw
        if (validMoves.length === 0) {
          newGameState.game_over = true;
          newGameState.winner = null;
          console.log("Game is a draw!");
          
          // Update stats
          updateStats('draw', newMoveCount);
          
          setGameState(newGameState);
          setLoading(false);
          return;
        }
        
        newGameState.valid_moves = validMoves;
        newGameState.current_player = 2; // Bot's turn next
        setGameState(newGameState);
        
        // Simulate bot's move after a short delay
        setTimeout(() => {
          simulateBotMove(boardCopy, difficulty, newMoveCount);
        }, 1000);
      } else {
        console.error("Invalid move: column is full");
        setError("That column is full. Please choose another.");
        setLoading(false);
      }
    } catch (error) {
      console.error('Error making move:', error);
      setError('Failed to make move. Please try again.');
      setLoading(false);
    }
  };
  
  // Update game statistics
  const updateStats = (outcome, moves) => {
    setStats(prevStats => {
      const newGamesPlayed = prevStats.gamesPlayed + 1;
      const newTotalMoves = prevStats.totalMoves + moves;
      const newAvgMoves = newGamesPlayed > 0 ? Math.round((newTotalMoves / newGamesPlayed) * 10) / 10 : moves;
      
      // Update the appropriate win counter
      let newPlayerWins = prevStats.playerWins;
      let newBotWins = prevStats.botWins;
      let newDraws = prevStats.draws;
      
      if (outcome === 'player') {
        newPlayerWins++;
      } else if (outcome === 'bot') {
        newBotWins++;
      } else if (outcome === 'draw') {
        newDraws++;
      }
      
      return {
        gamesPlayed: newGamesPlayed,
        playerWins: newPlayerWins,
        botWins: newBotWins,
        draws: newDraws,
        totalMoves: newTotalMoves,
        averageMoves: newAvgMoves
      };
    });
  };
  
  const simulateBotMove = async (board, difficulty, moveNumber) => {
    try {
      // Make a fresh copy of the board
      const currentBoard = JSON.parse(JSON.stringify(board));
      
      // Find valid columns
      const validMoves = [];
      for (let col = 0; col < 7; col++) {
        if (currentBoard[0][col] === 0) {
          validMoves.push(col);
        }
      }
      
      if (validMoves.length === 0) {
        // Board is full, game is a draw
        const finalState = { ...gameState };
        finalState.game_over = true;
        finalState.winner = null;
        finalState.current_player = 1; // Allow player to start a new game
        
        // Update stats for a draw
        updateStats('draw', moveCount);
        
        setGameState(finalState);
        setLoading(false);
        return;
      }
      
      // Get bot's move based on difficulty and AI availability
      let botColumn;
      
      if (difficulty === 'hard' && aiInitialized) {
        try {
          // Use the strong pre-trained bot for hard difficulty
          console.log("Using strong bot for move");
          botColumn = await getStrongBotMove(currentBoard, validMoves);
        } catch (error) {
          console.error("Error using strong bot:", error);
          // Fallback to basic bot if there's an error
          botColumn = getBotMove(currentBoard, validMoves, 'hard');
        }
      } else {
        // Use basic bot for easy and medium difficulties
        botColumn = getBotMove(currentBoard, validMoves, difficulty);
      }
      
      console.log(`Bot (${difficulty}) selected column:`, botColumn);
      
      // Find the lowest empty row in the selected column
      let row = -1;
      for (let r = 5; r >= 0; r--) {
        if (currentBoard[r][botColumn] === 0) {
          row = r;
          break;
        }
      }
      
      if (row !== -1) {
        console.log(`Bot placing token at row ${row}, column ${botColumn}`);
        
        // Place bot's token
        currentBoard[row][botColumn] = 2;
        
        // Update game state with the new board
        const newGameState = { ...gameState };
        newGameState.board = currentBoard;
        newGameState.last_move = [row, botColumn];
        newGameState.current_player = 1; // Player's turn next
        
        // Update valid moves for next turn
        const nextValidMoves = [];
        for (let col = 0; col < 7; col++) {
          if (currentBoard[0][col] === 0) {
            nextValidMoves.push(col);
          }
        }
        newGameState.valid_moves = nextValidMoves;
        
        // Check if bot won
        if (checkWin(currentBoard, row, botColumn, 2)) {
          newGameState.game_over = true;
          newGameState.winner = 2;
          console.log("Bot wins!");
          
          // Update stats for bot win
          updateStats('bot', moveCount + 1);
        } else if (nextValidMoves.length === 0) {
          // Check for draw
          newGameState.game_over = true;
          newGameState.winner = null;
          console.log("Game is a draw!");
          
          // Update stats for draw
          updateStats('draw', moveCount + 1);
        }
        
        setGameState(newGameState);
      } else {
        console.error("Bot couldn't find a valid row in column", botColumn);
        // Fallback to ensure the game doesn't get stuck
        const newGameState = { ...gameState };
        newGameState.current_player = 1; // Give control back to player
        setGameState(newGameState);
      }
    } catch (error) {
      console.error("Error in bot move:", error);
    } finally {
      setLoading(false);
    }
  };

  // Different bot strategies based on difficulty
  const getBotMove = (board, validMoves, difficulty) => {
    // Easy: Random moves
    if (difficulty === 'easy') {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    // Hard: Check for winning moves and block opponent's winning moves
    // Plus some strategy (center control, pattern recognition)
    if (difficulty === 'hard') {
      // First check if bot can win in one move
      for (let col of validMoves) {
        let tempBoard = JSON.parse(JSON.stringify(board));
        let row = -1;
        
        // Find where token would land
        for (let r = 5; r >= 0; r--) {
          if (tempBoard[r][col] === 0) {
            row = r;
            break;
          }
        }
        
        if (row !== -1) {
          tempBoard[row][col] = 2; // Place bot token
          if (checkWin(tempBoard, row, col, 2)) {
            return col; // Winning move found
          }
        }
      }
      
      // Then check if need to block player from winning
      for (let col of validMoves) {
        let tempBoard = JSON.parse(JSON.stringify(board));
        let row = -1;
        
        // Find where token would land
        for (let r = 5; r >= 0; r--) {
          if (tempBoard[r][col] === 0) {
            row = r;
            break;
          }
        }
        
        if (row !== -1) {
          tempBoard[row][col] = 1; // Place player token
          if (checkWin(tempBoard, row, col, 1)) {
            return col; // Blocking move found
          }
        }
      }
      
      // Try to create threats (3 in a row)
      for (let col of validMoves) {
        let tempBoard = JSON.parse(JSON.stringify(board));
        let row = -1;
        
        // Find where token would land
        for (let r = 5; r >= 0; r--) {
          if (tempBoard[r][col] === 0) {
            row = r;
            break;
          }
        }
        
        if (row !== -1) {
          tempBoard[row][col] = 2; // Place bot token
          
          // Check if this creates a potential win on next move
          for (let c = 0; c < 7; c++) {
            // Skip if column is full
            if (tempBoard[0][c] !== 0) continue;
            
            // Find where next token would land
            let nextRow = -1;
            for (let r = 5; r >= 0; r--) {
              if (tempBoard[r][c] === 0) {
                nextRow = r;
                break;
              }
            }
            
            if (nextRow !== -1) {
              let futureTempBoard = JSON.parse(JSON.stringify(tempBoard));
              futureTempBoard[nextRow][c] = 2;
              if (checkWin(futureTempBoard, nextRow, c, 2)) {
                return col; // This creates a future winning threat
              }
            }
          }
        }
      }
      
      // If no immediate win/block/threat, use strategy
      
      // Prefer center column
      if (validMoves.includes(3)) {
        return 3;
      }
      
      // Prefer columns adjacent to center
      const preferred = [2, 4, 1, 5, 0, 6];
      for (let col of preferred) {
        if (validMoves.includes(col)) {
          return col;
        }
      }
    }
    
    // Medium: Check for winning moves and block opponent's winning moves
    // First check if bot can win in one move
    for (let col of validMoves) {
      let tempBoard = JSON.parse(JSON.stringify(board));
      let row = -1;
      
      // Find where token would land
      for (let r = 5; r >= 0; r--) {
        if (tempBoard[r][col] === 0) {
          row = r;
          break;
        }
      }
      
      if (row !== -1) {
        tempBoard[row][col] = 2; // Place bot token
        if (checkWin(tempBoard, row, col, 2)) {
          return col; // Winning move found
        }
      }
    }
    
    // Then check if need to block player from winning
    for (let col of validMoves) {
      let tempBoard = JSON.parse(JSON.stringify(board));
      let row = -1;
      
      // Find where token would land
      for (let r = 5; r >= 0; r--) {
        if (tempBoard[r][col] === 0) {
          row = r;
          break;
        }
      }
      
      if (row !== -1) {
        tempBoard[row][col] = 1; // Place player token
        if (checkWin(tempBoard, row, col, 1)) {
          return col; // Blocking move found
        }
      }
    }
    
    // If no immediate win/block, just prefer center
    if (validMoves.includes(3)) {
      return 3;
    }
    
    // Otherwise random
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  };

  // Check for win
  const checkWin = (board, row, col, player) => {
    // Check horizontal
    let count = 0;
    for (let c = Math.max(0, col - 3); c <= Math.min(6, col + 3); c++) {
      if (board[row][c] === player) {
        count++;
        if (count >= 4) return true;
      } else {
        count = 0;
      }
    }
    
    // Check vertical
    count = 0;
    for (let r = Math.max(0, row - 3); r <= Math.min(5, row + 3); r++) {
      if (board[r][col] === player) {
        count++;
        if (count >= 4) return true;
      } else {
        count = 0;
      }
    }
    
    // Check diagonal (down-right)
    count = 0;
    for (let i = -3; i <= 3; i++) {
      const r = row + i;
      const c = col + i;
      if (r >= 0 && r < 6 && c >= 0 && c < 7) {
        if (board[r][c] === player) {
          count++;
          if (count >= 4) return true;
        } else {
          count = 0;
        }
      }
    }
    
    // Check diagonal (up-right)
    count = 0;
    for (let i = -3; i <= 3; i++) {
      const r = row - i;
      const c = col + i;
      if (r >= 0 && r < 6 && c >= 0 && c < 7) {
        if (board[r][c] === player) {
          count++;
          if (count >= 4) return true;
        } else {
          count = 0;
        }
      }
    }
    
    return false;
  };

  // Handle difficulty change
  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    console.log(`Difficulty changed to: ${newDifficulty}`);
  };
  
  // Handle first player change
  const handleFirstPlayerChange = (newFirstPlayer) => {
    setFirstPlayer(newFirstPlayer);
    console.log(`First player changed to: ${newFirstPlayer}`);
  };

  return (
    <div className="container">
      <h1>Connect Four with RL Agent</h1>
      
      <div className="game-controls">
        <button 
          onClick={startNewGame} 
          disabled={loading} 
          className="start-button"
        >
          {gameState ? 'New Game' : 'Start Game'}
        </button>
        
        <DifficultySelector
          difficulty={difficulty}
          onChange={handleDifficultyChange}
          disabled={gameState && !gameState.game_over}
        />
        
        <FirstPlayerSelector
          firstPlayer={firstPlayer}
          onChange={handleFirstPlayerChange}
          disabled={gameState && !gameState.game_over}
        />
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <StatsDisplay stats={stats} />
      
      {gameState ? (
        <>
          <GameStatus 
            gameState={gameState} 
            loading={loading} 
            moveCount={moveCount}
          />
          <GameBoard 
            gameState={gameState} 
            onMakeMove={makeMove} 
          />
        </>
      ) : (
        <div className="welcome">
          <h2>Welcome to Connect Four!</h2>
          <p>Select a difficulty level and who goes first, then click "Start Game" to play.</p>
          <p>The AI uses different strategies based on the difficulty level:</p>
          <ul>
            <li><strong>Easy:</strong> Makes random moves</li>
            <li><strong>Medium:</strong> Can block your winning moves and try to win</li>
            <li><strong>Hard:</strong> Uses a pre-trained reinforcement learning model similar to AlphaZero</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default App; 