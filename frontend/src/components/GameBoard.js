import React, { useState, useEffect } from 'react';
import './GameBoard.css';

const GameBoard = ({ gameState, onMakeMove }) => {
  const [winningCells, setWinningCells] = useState([]);
  const [hoverColumn, setHoverColumn] = useState(null);
  
  useEffect(() => {
    // Find winning cells when game is over and a winner exists
    if (gameState && gameState.game_over && gameState.winner) {
      findWinningCells();
    } else {
      setWinningCells([]);
    }
  }, [gameState?.game_over, gameState?.winner]);
  
  if (!gameState || !gameState.board) {
    return <div>Loading board...</div>;
  }

  const handleColumnClick = (columnIndex) => {
    if (gameState.game_over || gameState.current_player !== 1 || !gameState.valid_moves.includes(columnIndex)) {
      return;
    }
    onMakeMove(columnIndex);
  };

  const handleColumnHover = (columnIndex) => {
    if (!gameState.game_over && gameState.current_player === 1 && gameState.valid_moves.includes(columnIndex)) {
      setHoverColumn(columnIndex);
    }
  };

  const handleColumnLeave = () => {
    setHoverColumn(null);
  };

  // Get last move coordinates for highlighting
  const lastRow = gameState.last_move ? gameState.last_move[0] : null;
  const lastCol = gameState.last_move ? gameState.last_move[1] : null;
  
  // Function to find the winning cells
  const findWinningCells = () => {
    const board = gameState.board;
    const player = gameState.winner;
    const winningPositions = [];
    
    // Check horizontal
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === player && board[r][c+1] === player && 
            board[r][c+2] === player && board[r][c+3] === player) {
          winningPositions.push([r, c], [r, c+1], [r, c+2], [r, c+3]);
          setWinningCells(winningPositions);
          return;
        }
      }
    }
    
    // Check vertical
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 7; c++) {
        if (board[r][c] === player && board[r+1][c] === player && 
            board[r+2][c] === player && board[r+3][c] === player) {
          winningPositions.push([r, c], [r+1, c], [r+2, c], [r+3, c]);
          setWinningCells(winningPositions);
          return;
        }
      }
    }
    
    // Check diagonal (down-right)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === player && board[r+1][c+1] === player && 
            board[r+2][c+2] === player && board[r+3][c+3] === player) {
          winningPositions.push([r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]);
          setWinningCells(winningPositions);
          return;
        }
      }
    }
    
    // Check diagonal (up-right)
    for (let r = 3; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === player && board[r-1][c+1] === player && 
            board[r-2][c+2] === player && board[r-3][c+3] === player) {
          winningPositions.push([r, c], [r-1, c+1], [r-2, c+2], [r-3, c+3]);
          setWinningCells(winningPositions);
          return;
        }
      }
    }
  };
  
  // Check if a cell is part of the winning line
  const isWinningCell = (row, col) => {
    return winningCells.some(cell => cell[0] === row && cell[1] === col);
  };

  return (
    <div className="game-board">
      {/* Column indicators for user interaction */}
      <div className="column-indicators">
        {Array(7).fill(null).map((_, colIndex) => (
          <div 
            key={`col-${colIndex}`}
            className={`column-indicator ${
              gameState.valid_moves.includes(colIndex) && gameState.current_player === 1 && !gameState.game_over 
                ? 'active' 
                : ''
            } ${hoverColumn === colIndex ? 'hover' : ''}`}
            onClick={() => handleColumnClick(colIndex)}
            onMouseEnter={() => handleColumnHover(colIndex)}
            onMouseLeave={handleColumnLeave}
          >
            {gameState.valid_moves.includes(colIndex) && gameState.current_player === 1 && !gameState.game_over ? '↓' : ''}
          </div>
        ))}
      </div>

      {/* Preview token for hover effect */}
      {hoverColumn !== null && gameState.current_player === 1 && !gameState.game_over && (
        <div className="token-preview" style={{ left: `${(hoverColumn * 60) + 30}px` }}>
          <div className="token player-preview"></div>
        </div>
      )}

      {/* The board itself */}
      <div className="board">
        {gameState.board.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div 
              key={`cell-${rowIndex}-${colIndex}`} 
              className={`cell ${
                cell === 1 ? 'player' : cell === 2 ? 'bot' : ''
              } ${
                rowIndex === lastRow && colIndex === lastCol ? 'last-move' : ''
              } ${
                isWinningCell(rowIndex, colIndex) ? 'winning-cell' : ''
              }`}
              onClick={() => handleColumnClick(colIndex)}
              data-column={colIndex}
              data-row={rowIndex}
              style={{
                gridRow: rowIndex + 1,
                gridColumn: colIndex + 1
              }}
            >
              {cell !== 0 && (
                <div className={`token ${isWinningCell(rowIndex, colIndex) ? 'winning' : ''}`}></div>
              )}
            </div>
          ))
        ))}
      </div>
    </div>
  );
};

export default GameBoard; 