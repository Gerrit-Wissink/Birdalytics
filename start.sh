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
echo "Copying files to backend..."
echo "======================================"
cp -r frontend/website/dist/* backend/static/
echo ""
echo "======================================"
echo "Starting backend server..."
echo "======================================"
cd ../../backend
npm i
branch=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
echo "Current Git branch: $branch"
node .
