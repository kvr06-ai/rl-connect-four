# Connect Four with RL Agent

This project implements a web-based Connect Four game where users can play against a bot powered by reinforcement learning. The bot improves its gameplay over time by learning from interactions.

## Project Structure

```
connect-four/
├── frontend/       # React.js frontend application
├── backend/        # Flask backend server
└── rl_service/     # TensorFlow RL service
```

## Local Development Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup
```bash
cd connect-four/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### RL Service Setup
```bash
cd connect-four/rl_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python rl_service.py
```

### Frontend Setup
```bash
cd connect-four/frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- RL Service: http://localhost:5001

## Features
- Interactive Connect Four game board
- RL-powered bot that improves over time
- Real-time feedback on game state
- Optional difficulty levels
- Visualization of bot's learning progress 