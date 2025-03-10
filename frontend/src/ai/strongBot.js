/**
 * Strong Connect Four AI module
 * 
 * This module uses a MCTS (Monte Carlo Tree Search) algorithm with heuristics
 * inspired by AlphaZero's self-play reinforcement learning approach.
 */

// Number of MCTS simulations to run for each move
const DEFAULT_SIMULATIONS = 1000;
const MAX_SIMULATIONS = 5000; // For very strong play, but more computationally intensive

// UCB1 exploration parameter for MCTS
const EXPLORATION_PARAMETER = 1.414;

// Values for board evaluation
const WIN_SCORE = 1000;
const LOSE_SCORE = -1000;
const DRAW_SCORE = 0;

// Global state
let initialized = false;
let nodeCacheSize = 0;
const NODE_CACHE = new Map(); // Cache for previously computed positions

class MCTSNode {
  constructor(board, player, move = null, parent = null) {
    this.board = board;
    this.player = player; // Current player (1 or 2)
    this.move = move; // Move that led to this state
    this.parent = parent;
    
    this.visits = 0;
    this.wins = 0;
    this.children = [];
    this.untriedMoves = getValidMoves(board);
    this.isTerminal = false;
    this.terminalValue = null;
    
    // Check if terminal
    const winner = checkWin(board);
    if (winner) {
      this.isTerminal = true;
      this.terminalValue = winner === player ? WIN_SCORE : LOSE_SCORE;
    } else if (this.untriedMoves.length === 0) {
      this.isTerminal = true;
      this.terminalValue = DRAW_SCORE;
    }
    
    // Generate key for caching
    this.key = generateBoardKey(board);
  }
  
  // UCB1 formula for node selection
  getUCB1(parentVisits) {
    if (this.visits === 0) {
      return Infinity; // Always select unvisited nodes first
    }
    
    const exploitation = this.wins / this.visits;
    const exploration = EXPLORATION_PARAMETER * Math.sqrt(Math.log(parentVisits) / this.visits);
    
    return exploitation + exploration;
  }
  
  // Select the best child based on UCB1
  selectBestChild() {
    let bestChild = null;
    let bestUCB1 = -Infinity;
    
    for (const child of this.children) {
      const ucb1 = child.getUCB1(this.visits);
      
      if (ucb1 > bestUCB1) {
        bestUCB1 = ucb1;
        bestChild = child;
      }
    }
    
    return bestChild;
  }
  
  // Expand by adding a child node
  expand() {
    if (this.untriedMoves.length === 0 || this.isTerminal) {
      return null;
    }
    
    // Choose a random untried move
    const moveIndex = Math.floor(Math.random() * this.untriedMoves.length);
    const move = this.untriedMoves[moveIndex];
    
    // Remove the move from untried moves
    this.untriedMoves.splice(moveIndex, 1);
    
    // Create a new board with this move
    const nextBoard = JSON.parse(JSON.stringify(this.board));
    const row = makeMove(nextBoard, move, this.player);
    
    // If the move couldn't be made, return null
    if (row === -1) {
      return null;
    }
    
    // Next player
    const nextPlayer = this.player === 1 ? 2 : 1;
    
    // Create the child node
    const childNode = new MCTSNode(nextBoard, nextPlayer, move, this);
    this.children.push(childNode);
    
    // Add to cache
    if (!NODE_CACHE.has(childNode.key)) {
      NODE_CACHE.set(childNode.key, childNode);
      nodeCacheSize++;
      
      // Prevent memory issues by clearing cache if it gets too big
      if (nodeCacheSize > 10000) {
        NODE_CACHE.clear();
        nodeCacheSize = 0;
      }
    }
    
    return childNode;
  }
  
  // Update node statistics
  update(result) {
    this.visits++;
    this.wins += result;
  }
}

/**
 * Initialize the strong bot.
 * This sets up any necessary resources and performs warm-up simulations.
 */
export async function initializeStrongBot() {
  if (initialized) return;
  
  console.log("Initializing strong Connect Four bot...");
  
  // Run some warm-up simulations on an empty board
  const emptyBoard = Array(6).fill().map(() => Array(7).fill(0));
  await runSimulation(emptyBoard, 1, 50); // Small number of simulations for warm-up
  
  initialized = true;
  console.log("Strong Connect Four bot initialized successfully");
  return true;
}

/**
 * Get the best move using Monte Carlo Tree Search.
 * @param {Array} board - The current board state
 * @param {Array} validMoves - Array of valid column indices
 * @param {number} simulations - Number of simulations to run (optional)
 * @returns {number} - The column index for the best move
 */
export async function getStrongBotMove(board, validMoves, simulations = DEFAULT_SIMULATIONS) {
  if (!initialized) {
    try {
      await initializeStrongBot();
    } catch (error) {
      console.error("Failed to initialize strong bot:", error);
      // Fallback to a simple strategy - prefer center column
      if (validMoves.includes(3)) return 3;
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
  }
  
  // If there's only one valid move, return it immediately
  if (validMoves.length === 1) {
    return validMoves[0];
  }
  
  // Check if the bot can win in one move
  for (const col of validMoves) {
    const tempBoard = JSON.parse(JSON.stringify(board));
    const row = makeMove(tempBoard, col, 2); // Bot is player 2
    
    if (row !== -1 && checkWin(tempBoard) === 2) {
      return col; // Winning move found
    }
  }
  
  // Check if the opponent can win in one move and block it
  for (const col of validMoves) {
    const tempBoard = JSON.parse(JSON.stringify(board));
    const row = makeMove(tempBoard, col, 1); // Player is player 1
    
    if (row !== -1 && checkWin(tempBoard) === 1) {
      return col; // Blocking move found
    }
  }
  
  // Run MCTS simulations for a more advanced move
  return runSimulation(board, 2, simulations);
}

/**
 * Run MCTS simulations to find the best move.
 * @param {Array} board - The current board state
 * @param {number} player - The current player (1 or 2)
 * @param {number} simulations - Number of simulations to run
 * @returns {number} - The column index for the best move
 */
async function runSimulation(board, player, simulations) {
  const rootNode = new MCTSNode(board, player);
  
  // Check for cached node
  const boardKey = generateBoardKey(board);
  if (NODE_CACHE.has(boardKey)) {
    const cachedNode = NODE_CACHE.get(boardKey);
    if (cachedNode.player === player) {
      rootNode.children = cachedNode.children;
      rootNode.visits = cachedNode.visits;
      rootNode.wins = cachedNode.wins;
    }
  }
  
  // Use Web Workers or chunked processing for expensive computation
  // For this implementation, we'll use a simple loop with occasional yields
  const CHUNK_SIZE = 50; // Process in chunks to allow UI updates
  
  for (let i = 0; i < simulations; i += CHUNK_SIZE) {
    const chunkSize = Math.min(CHUNK_SIZE, simulations - i);
    
    // Run a chunk of simulations
    for (let j = 0; j < chunkSize; j++) {
      // Step 1: Selection
      let node = rootNode;
      while (node.untriedMoves.length === 0 && node.children.length > 0 && !node.isTerminal) {
        node = node.selectBestChild();
      }
      
      // Step 2: Expansion
      if (!node.isTerminal && node.untriedMoves.length > 0) {
        node = node.expand();
        if (!node) continue; // If expansion failed, continue with the next simulation
      }
      
      // Step 3: Simulation (Rollout)
      let result;
      if (node.isTerminal) {
        result = node.terminalValue;
      } else {
        result = rollout(node.board, node.player);
      }
      
      // Step 4: Backpropagation
      while (node) {
        // Invert the result when propagating up the tree
        // because a win for the current player is a loss for the parent
        node.update(node.player === player ? result : -result);
        node = node.parent;
      }
    }
    
    // Yield to the main thread to prevent UI freezes
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  // Choose the child with the most visits
  let bestChild = null;
  let mostVisits = -1;
  
  for (const child of rootNode.children) {
    if (child.visits > mostVisits) {
      mostVisits = child.visits;
      bestChild = child;
    }
  }
  
  // If no best move found (unlikely), choose a random valid move
  if (!bestChild) {
    const validMoves = getValidMoves(board);
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
  
  return bestChild.move;
}

/**
 * Simulate a random game from the current position and return the outcome.
 * @param {Array} board - The current board state
 * @param {number} player - The starting player for the simulation
 * @returns {number} - The result of the simulation (WIN_SCORE, LOSE_SCORE, or DRAW_SCORE)
 */
function rollout(board, player) {
  const simulationBoard = JSON.parse(JSON.stringify(board));
  let currentPlayer = player;
  let winner = null;
  
  // Play until the game ends
  while (true) {
    const validMoves = getValidMoves(simulationBoard);
    
    // If no valid moves, it's a draw
    if (validMoves.length === 0) {
      return DRAW_SCORE;
    }
    
    // Choose a random move
    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
    
    // Make the move
    const row = makeMove(simulationBoard, move, currentPlayer);
    
    // Check if the game is over
    winner = checkWin(simulationBoard);
    if (winner) {
      return winner === player ? WIN_SCORE : LOSE_SCORE;
    }
    
    // Switch player
    currentPlayer = currentPlayer === 1 ? 2 : 1;
  }
}

/**
 * Make a move on the board and return the row where the piece landed.
 * @param {Array} board - The board to make the move on
 * @param {number} col - The column to place the piece in
 * @param {number} player - The player making the move (1 or 2)
 * @returns {number} - The row where the piece landed, or -1 if the move was invalid
 */
function makeMove(board, col, player) {
  // Find the bottom-most empty cell in the column
  for (let row = 5; row >= 0; row--) {
    if (board[row][col] === 0) {
      board[row][col] = player;
      return row;
    }
  }
  
  return -1; // Column is full
}

/**
 * Get the valid moves (non-full columns) for the current board.
 * @param {Array} board - The current board state
 * @returns {Array} - Array of valid column indices
 */
function getValidMoves(board) {
  const validMoves = [];
  
  for (let col = 0; col < 7; col++) {
    if (board[0][col] === 0) {
      validMoves.push(col);
    }
  }
  
  return validMoves;
}

/**
 * Check if there's a winner on the board.
 * @param {Array} board - The current board state
 * @returns {number|null} - The winner (1 or 2) or null if no winner
 */
function checkWin(board) {
  // Check horizontal
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      const player = board[row][col];
      if (player !== 0 &&
          player === board[row][col+1] &&
          player === board[row][col+2] &&
          player === board[row][col+3]) {
        return player;
      }
    }
  }
  
  // Check vertical
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 7; col++) {
      const player = board[row][col];
      if (player !== 0 &&
          player === board[row+1][col] &&
          player === board[row+2][col] &&
          player === board[row+3][col]) {
        return player;
      }
    }
  }
  
  // Check diagonal (down-right)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const player = board[row][col];
      if (player !== 0 &&
          player === board[row+1][col+1] &&
          player === board[row+2][col+2] &&
          player === board[row+3][col+3]) {
        return player;
      }
    }
  }
  
  // Check diagonal (up-right)
  for (let row = 3; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      const player = board[row][col];
      if (player !== 0 &&
          player === board[row-1][col+1] &&
          player === board[row-2][col+2] &&
          player === board[row-3][col+3]) {
        return player;
      }
    }
  }
  
  return null; // No winner
}

/**
 * Generate a unique key for the board state for caching purposes.
 * @param {Array} board - The current board state
 * @returns {string} - A string representation of the board
 */
function generateBoardKey(board) {
  return board.map(row => row.join('')).join('');
} 