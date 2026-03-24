#!/bin/bash

echo "======================================"
echo "Building frontend..."
echo "======================================"
cd frontend/website
npm i
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ Frontend build complete!"
echo "======================================"
echo ""
echo "======================================"
echo "Building backend Docker image..."
echo "======================================"
cd ../../
docker build -t birdalytics-backend ./backend

if [ $? -ne 0 ]; then
    echo "❌ Backend Docker build failed!"
    exit 1
fi

echo ""
echo "======================================"
echo "Building ai-model-test Docker image..."
echo "======================================"
docker build -t birdalytics-ai-model ./ai-model-test

if [ $? -ne 0 ]; then
    echo "❌ AI Model Docker build failed!"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ Docker images built successfully!"
echo "======================================"
echo ""
echo "======================================"
echo "Starting containers..."
echo "======================================"

# Run backend container
echo "Starting backend on port 8000..."
docker run -d --name birdalytics-backend -p 8000:8000 --env-file .env birdalytics-backend

# Run ai-model-test container
echo "Starting AI model worker..."
docker run -d --name birdalytics-ai-model --env-file .env birdalytics-ai-model

echo ""
echo "✅ Containers started!"
echo "Backend: http://localhost:8000"
echo ""
echo "To view logs:"
echo "  docker logs -f birdalytics-backend"
echo "  docker logs -f birdalytics-ai-model"
echo ""
echo "To stop containers:"
echo "  docker stop birdalytics-backend birdalytics-ai-model"
