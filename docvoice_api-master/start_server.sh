#!/bin/bash
# Script to start Laravel server accessible from Android Emulator

echo "🚀 Starting Laravel server on 0.0.0.0:8000..."
echo "📱 This allows Android Emulator to connect via 10.0.2.2:8000"
echo ""

cd "$(dirname "$0")"

# Kill any existing server
pkill -f "php artisan serve" 2>/dev/null || true

# Start server on all interfaces
php artisan serve --host=0.0.0.0 --port=8000

echo ""
echo "✅ Server started successfully!"
echo "🌐 Accessible from:"
echo "   - Localhost: http://localhost:8000"
echo "   - Emulator: http://localhost:8000"
echo "   - Network: http://$(hostname -I | awk '{print $1}'):8000"

