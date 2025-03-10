# Connect Four with RL Agent

This project implements a web-based Connect Four game where users can play against a bot powered by reinforcement learning. The AlphaZero algorithm is used for the "Hard" difficulty level, providing expert-level gameplay.

## Project Structure

```
connect-four/
├── frontend/       # React.js frontend application
├── ai_service/     # AlphaZero Python service
├── backend/        # Flask backend server (not needed for current version)
└── rl_service/     # TensorFlow RL service (legacy)
```

## Local Development Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Quick Start
The easiest way to run the application is using the provided script:

```bash
./start_game.sh
```

This script will:
1. Start the AlphaZero AI service
2. Start the React frontend
3. Stop both services when you press Ctrl+C

### Manual Setup

#### AI Service Setup
```bash
cd connect-four/ai_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python alpha_zero_api.py
```

#### Frontend Setup
```bash
cd connect-four/frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- AlphaZero AI Service: http://localhost:5002

## Features
- Interactive Connect Four game board
- Three difficulty levels:
  - **Easy**: Makes random moves
  - **Medium**: Can block winning moves and tries to win
  - **Hard**: Uses AlphaZero algorithm for expert-level play
- Statistics tracking (wins, losses, draws, and average moves)
- Visual highlights for winning combinations
- Choose who goes first - human or AI
- Responsive design for both desktop and mobile

## AI Implementation
The "Hard" difficulty level uses the AlphaZero algorithm, a powerful reinforcement learning approach that combines:
- Monte Carlo Tree Search (MCTS) for strategic exploration of game states
- A neural network trained through self-play to evaluate board positions
- This creates an AI that plays at a very high level without human guidance 