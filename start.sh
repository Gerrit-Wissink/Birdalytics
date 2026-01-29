#!/bin/bash

echo "======================================"
echo "Building frontend..."
echo "======================================"
cd frontend/website
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
echo "Starting backend server..."
echo "======================================"
cd ../../backend
node .
