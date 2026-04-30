#!/bin/bash
# Brain App API Test Runner
# Runs comprehensive endpoint tests and generates report

set -e

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$TEST_DIR")"
REPO_ROOT="$(dirname "$(dirname "$BACKEND_DIR")")"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Brain App API Test Suite"
echo "=========================================="
echo "Test directory: $TEST_DIR"
echo "Backend directory: $BACKEND_DIR"
echo "Timestamp: $(date)"
echo

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo -e "${YELLOW}Installing pytest...${NC}"
    pip install pytest requests -q
fi

# Check if backend server is running
echo "Checking if backend server is running on http://localhost:8000..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ Backend server is running${NC}"
else
    echo -e "${RED}✗ Backend server is NOT running${NC}"
    echo "Start the backend with: cd $BACKEND_DIR && python main.py"
    exit 1
fi

echo

# Run pytest
echo "Running test suite..."
cd "$BACKEND_DIR"

pytest tests/test_endpoints.py -v --tb=short --color=yes 2>&1 | tee tests/latest_test_run.log

# Extract results
PASSED=$(grep "passed" tests/latest_test_run.log | grep -oE "[0-9]+ passed" | grep -oE "[0-9]+")
FAILED=$(grep "failed" tests/latest_test_run.log | grep -oE "[0-9]+ failed" | grep -oE "[0-9]+" || echo "0")

echo
echo "=========================================="
echo "Test Results Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Timestamp: $(date)"
echo "=========================================="

# Generate summary
if [ "$FAILED" -eq "0" ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. See log above for details.${NC}"
    exit 1
fi
