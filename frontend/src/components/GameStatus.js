import React from 'react';
import './GameStatus.css';

const GameStatus = ({ gameState, loading }) => {
  if (!gameState) {
    return <div className="status">Start a new game to play!</div>;
  }

  let statusMessage = '';

  if (loading) {
    statusMessage = 'Thinking...';
  } else if (gameState.game_over) {
    if (gameState.winner === 1) {
      statusMessage = 'You won! Congratulations!';
    } else if (gameState.winner === 2) {
      statusMessage = 'Bot won! Better luck next time.';
    } else {
      statusMessage = 'Game ended in a draw!';
    }
  } else {
    if (gameState.current_player === 1) {
      statusMessage = 'Your turn! Click a column to drop your token.';
    } else {
      statusMessage = 'Bot is thinking...';
    }
  }

  return (
    <div className={`status ${gameState.game_over ? (gameState.winner === 1 ? 'win' : gameState.winner === 2 ? 'lose' : 'draw') : ''}`}>
      <h3>{statusMessage}</h3>
      
      {gameState.game_over && (
        <p className="play-again-hint">Click "New Game" to play again.</p>
      )}
    </div>
  );
};

export default GameStatus; 