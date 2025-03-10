#!/bin/bash

echo "Starting Connect Four with AlphaZero AI"
echo "========================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not found"
    exit 1
fi

# Start the AI service in the background
echo "Starting AlphaZero AI service..."
cd ai_service
python3 -m venv venv 2>/dev/null || echo "Virtual environment already exists or couldn't be created"
source venv/bin/activate
pip install -r requirements.txt
python alpha_zero_api.py &
AI_PID=$!
cd ..

# Give the AI service time to start
echo "Waiting for AI service to initialize..."
sleep 3

# Start the frontend in the background
echo "Starting React frontend..."
cd frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "Connect Four is now running!"
echo "- Frontend: http://localhost:3000"
echo "- AI Service: http://localhost:5002"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user to press Ctrl+C
trap "echo 'Stopping services...'; kill $AI_PID; kill $FRONTEND_PID; exit" INT
wait 