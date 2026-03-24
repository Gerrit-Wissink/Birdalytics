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
echo "Copying built files to backend..."
echo "======================================"
echo "Current directory: $(pwd)"
echo "Contents of dist:"
ls -la dist/ | head -20
echo ""
mkdir -p ../backend/static
rm -rf ../backend/static/*
cp -r dist/* ../backend/static/
echo "✅ Files copied successfully!"
echo ""
echo "Verifying copied files:"
ls -la ../backend/static/ | head -20
echo ""
echo "======================================"
echo "Starting backend server..."
echo "======================================"
cd ../../backend
npm i
branch=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
echo "Current Git branch: $branch"
node .
