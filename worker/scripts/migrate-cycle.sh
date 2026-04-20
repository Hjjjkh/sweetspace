#!/bin/bash
# Cycle Health Module Database Migration Script
# Usage: ./migrate-cycle.sh

echo "🩸 Migrating Cycle Health Module to D1..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler not found. Installing..."
    npm install -g wrangler
fi

# Run migration
echo "📝 Running migration..."
wrangler d1 execute love-space-db --file=./migrations/cycle-health.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi
