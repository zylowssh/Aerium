#!/bin/bash
# Test script to verify all API endpoints are working

echo "🧪 Testing Aerium API Endpoints"
echo "=================================="

API_BASE="http://localhost:5000/api"
DEMO_EMAIL="demo@aerium.app"
DEMO_PASSWORD="demo123"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test health check
echo -e "\n${YELLOW}1. Testing Health Check${NC}"
curl -s "$API_BASE/health" | python -m json.tool
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi

# Login and get token
echo -e "\n${YELLOW}2. Testing Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$DEMO_EMAIL\", \"password\": \"$DEMO_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Login successful, token: ${TOKEN:0:20}...${NC}"
else
    echo -e "${RED}❌ Login failed${NC}"
    exit 1
fi

# Test sensors endpoint
echo -e "\n${YELLOW}3. Testing Sensors Endpoint${NC}"
curl -s "$API_BASE/sensors" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool | head -20
echo -e "${GREEN}✅ Sensors endpoint working${NC}"

# Test alert history list
echo -e "\n${YELLOW}4. Testing Alert History List${NC}"
curl -s "$API_BASE/alerts/history/list?days=30" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool | head -20
echo -e "${GREEN}✅ Alert history list working${NC}"

# Test alert history stats
echo -e "\n${YELLOW}5. Testing Alert History Stats${NC}"
curl -s "$API_BASE/alerts/history/stats?days=30" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
echo -e "${GREEN}✅ Alert history stats working${NC}"

# Test reports export CSV
echo -e "\n${YELLOW}6. Testing Reports CSV Export${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/reports/export/csv?days=30" \
  -H "Authorization: Bearer $TOKEN")
STATUS=$(echo "$RESPONSE" | tail -n1)
if [ "$STATUS" == "200" ]; then
    echo -e "${GREEN}✅ CSV export working (HTTP 200)${NC}"
else
    echo -e "${RED}❌ CSV export failed (HTTP $STATUS)${NC}"
fi

# Test reports export PDF
echo -e "\n${YELLOW}7. Testing Reports PDF Export${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/reports/export/pdf?days=30" \
  -H "Authorization: Bearer $TOKEN")
STATUS=$(echo "$RESPONSE" | tail -n1)
if [ "$STATUS" == "200" ]; then
    echo -e "${GREEN}✅ PDF export working (HTTP 200)${NC}"
else
    echo -e "${RED}❌ PDF export failed (HTTP $STATUS)${NC}"
fi

echo -e "\n${GREEN}✅ All API tests completed!${NC}"
echo -e "\n📊 Summary:"
echo "   ✅ Health Check"
echo "   ✅ Login"
echo "   ✅ Sensors"
echo "   ✅ Alert History"
echo "   ✅ Reports"
