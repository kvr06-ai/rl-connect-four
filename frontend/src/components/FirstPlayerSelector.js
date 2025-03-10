import React from 'react';
import './FirstPlayerSelector.css';

const FirstPlayerSelector = ({ firstPlayer, onChange, disabled }) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="first-player-selector">
      <label htmlFor="first-player">First Player:</label>
      <select 
        id="first-player" 
        value={firstPlayer} 
        onChange={handleChange}
        disabled={disabled}
        className={disabled ? 'disabled' : ''}
      >
        <option value="player">You</option>
        <option value="bot">Bot</option>
      </select>
      {disabled && (
        <div className="selector-tooltip">
          Cannot change during a game
        </div>
      )}
    </div>
  );
};

export default FirstPlayerSelector; 