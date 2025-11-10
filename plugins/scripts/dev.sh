#!/usr/bin/env bash

echo "🔧 Building packages..."
bun turbo build --filter='./packages/*'

echo "🚀 Starting plugin server..."
bun turbo dev --filter='./plugins/*' &
PLUGIN_PID=$!

echo "⏳ Waiting for plugin server on port 3014..."
timeout=30
while ! lsof -i:3014 > /dev/null 2>&1; do
    sleep 1
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
        echo "❌ Timeout waiting for plugin server"
        kill $PLUGIN_PID 2>/dev/null
        exit 1
    fi
done

echo "✅ Plugin server is ready!"
echo "🚀 Starting apps..."
bun turbo dev --filter='./apps/*'

# Cleanup on exit
trap "kill $PLUGIN_PID 2>/dev/null" EXIT
