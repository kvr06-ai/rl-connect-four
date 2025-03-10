import React from 'react';
import './DifficultySelector.css';

const DifficultySelector = ({ difficulty, onChange, disabled }) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="difficulty-selector">
      <label htmlFor="difficulty">Difficulty:</label>
      <select 
        id="difficulty" 
        value={difficulty} 
        onChange={handleChange}
        disabled={disabled}
        className={disabled ? 'disabled' : ''}
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
      {disabled && (
        <div className="difficulty-tooltip">
          Cannot change difficulty during a game
        </div>
      )}
    </div>
  );
};

export default DifficultySelector; 