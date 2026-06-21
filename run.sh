#!/bin/bash

# Function to handle exit
cleanup() {
    echo "Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
}

# Register the cleanup function for termination signals
trap cleanup EXIT SIGINT SIGTERM

echo "Starting FastAPI backend..."
cd backend && uvicorn api.routes:app --host 127.0.0.1 --port 8000 &
cd ..

echo "Starting Streamlit frontend..."
streamlit run frontend/app.py &

echo "Servers are running."
wait
