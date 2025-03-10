import React from 'react';
import './StatsDisplay.css';

const StatsDisplay = ({ stats }) => {
  // Calculate win rates
  const playerWinRate = stats.gamesPlayed > 0 
    ? Math.round((stats.playerWins / stats.gamesPlayed) * 100) 
    : 0;
  
  const botWinRate = stats.gamesPlayed > 0 
    ? Math.round((stats.botWins / stats.gamesPlayed) * 100) 
    : 0;
  
  const drawRate = stats.gamesPlayed > 0 
    ? Math.round((stats.draws / stats.gamesPlayed) * 100) 
    : 0;

  return (
    <div className="stats-display">
      <h3>Game Statistics</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{stats.gamesPlayed}</div>
          <div className="stat-label">Games Played</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">{stats.playerWins}</div>
          <div className="stat-label">Player Wins</div>
          <div className="stat-percentage">{playerWinRate}%</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">{stats.botWins}</div>
          <div className="stat-label">Bot Wins</div>
          <div className="stat-percentage">{botWinRate}%</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">{stats.draws}</div>
          <div className="stat-label">Draws</div>
          <div className="stat-percentage">{drawRate}%</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">{Math.round(stats.averageMoves * 10) / 10}</div>
          <div className="stat-label">Avg. Moves</div>
        </div>
      </div>
    </div>
  );
};

export default StatsDisplay; 