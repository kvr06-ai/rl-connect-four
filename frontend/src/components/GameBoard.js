import React from 'react';
import './GameBoard.css';

const GameBoard = ({ gameState, onMakeMove }) => {
  if (!gameState || !gameState.board) {
    return <div>Loading board...</div>;
  }

  const handleColumnClick = (columnIndex) => {
    if (gameState.game_over || gameState.current_player !== 1 || !gameState.valid_moves.includes(columnIndex)) {
      return;
    }
    onMakeMove(columnIndex);
  };

  // Get last move coordinates for highlighting
  const lastRow = gameState.last_move ? gameState.last_move[0] : null;
  const lastCol = gameState.last_move ? gameState.last_move[1] : null;

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
            }`}
            onClick={() => handleColumnClick(colIndex)}
          >
            ↓
          </div>
        ))}
      </div>

      {/* The board itself */}
      <div className="board">
        {gameState.board.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="row">
            {row.map((cell, colIndex) => (
              <div 
                key={`cell-${rowIndex}-${colIndex}`} 
                className={`cell ${
                  cell === 1 ? 'player' : cell === 2 ? 'bot' : ''
                } ${
                  rowIndex === lastRow && colIndex === lastCol ? 'last-move' : ''
                }`}
                onClick={() => handleColumnClick(colIndex)}
              >
                {cell !== 0 && (
                  <div className="token"></div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard; 