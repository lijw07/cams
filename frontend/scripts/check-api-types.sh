#!/bin/bash

# Script to check if API types are up-to-date
# Usage: ./scripts/check-api-types.sh

set -e

echo "🔄 Checking if OpenAPI types are up-to-date..."

# Check if the API is running
if ! curl -s http://localhost:8080/health > /dev/null; then
  echo "❌ Backend API is not running on http://localhost:8080"
  echo "   Please start the backend with: dotnet run"
  exit 1
fi

# Backup current generated types
if [ -f "src/types/api.generated.ts" ]; then
  cp src/types/api.generated.ts src/types/api.generated.ts.backup
fi

# Generate fresh types
echo "🔄 Generating fresh OpenAPI types..."
npm run generate-types-from-url

# Check for differences
if [ -f "src/types/api.generated.ts.backup" ]; then
  if ! diff -q src/types/api.generated.ts src/types/api.generated.ts.backup > /dev/null; then
    echo "⚠️  API types have been updated!"
    echo "   The following changes were detected:"
    diff src/types/api.generated.ts src/types/api.generated.ts.backup || true
    rm -f src/types/api.generated.ts.backup
    echo ""
    echo "✅ Updated types have been saved to src/types/api.generated.ts"
    echo "   Please review the changes and commit them if needed."
    exit 0
  else
    echo "✅ API types are up-to-date"
    rm -f src/types/api.generated.ts.backup
  fi
else
  echo "✅ Generated fresh API types"
fi

echo "🎉 OpenAPI types check completed successfully!"