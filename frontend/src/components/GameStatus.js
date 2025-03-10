import React from 'react';
import './GameStatus.css';

const GameStatus = ({ gameState, loading, moveCount }) => {
  if (!gameState) {
    return <div className="status">Start a new game to play!</div>;
  }

  let statusMessage = '';
  let statusIcon = null;

  if (loading) {
    statusMessage = 'Thinking...';
    statusIcon = <div className="loading-spinner"></div>;
  } else if (gameState.game_over) {
    if (gameState.winner === 1) {
      statusMessage = 'You won! Congratulations!';
      statusIcon = <span className="status-icon">🏆</span>;
    } else if (gameState.winner === 2) {
      statusMessage = 'Bot won! Better luck next time.';
      statusIcon = <span className="status-icon">🤖</span>;
    } else {
      statusMessage = 'Game ended in a draw!';
      statusIcon = <span className="status-icon">🤝</span>;
    }
  } else {
    if (gameState.current_player === 1) {
      statusMessage = 'Your turn! Click a column to drop your token.';
      statusIcon = <span className="status-icon player-token"></span>;
    } else {
      statusMessage = 'Bot is thinking...';
      statusIcon = <span className="status-icon bot-token pulse"></span>;
    }
  }

  return (
    <div className={`status ${gameState.game_over ? (gameState.winner === 1 ? 'win' : gameState.winner === 2 ? 'lose' : 'draw') : ''}`}>
      <div className="status-header">
        {statusIcon}
        <h3>{statusMessage}</h3>
      </div>
      
      <div className="status-details">
        <div className="move-counter">
          Move: {moveCount}
        </div>
        
        {gameState.last_move && (
          <div className="last-move">
            Last move: Column {gameState.last_move[1] + 1}
          </div>
        )}
      </div>
      
      {gameState.game_over && (
        <p className="play-again-hint">Click "New Game" to play again.</p>
      )}
    </div>
  );
};

export default GameStatus; 