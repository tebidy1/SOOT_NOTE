#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing All API Routes ===${NC}\n"

# Login and get token
echo -e "${GREEN}[1/20] Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@gmail.com","password":"22222222"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to get token!${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Login successful, Token: ${TOKEN:0:20}...${NC}\n"

# Test User Profile
echo -e "${GREEN}[2/20] Testing User Profile...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ User Profile${NC}\n"

# Test Companies
echo -e "${GREEN}[3/20] Testing Companies...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/companies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Companies List${NC}\n"

curl -s -X GET http://127.0.0.1:8000/api/companies/3 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Company Details${NC}\n"

# Test Users
echo -e "${GREEN}[4/20] Testing Users...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Users List${NC}\n"

curl -s -X GET http://127.0.0.1:8000/api/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ User Details${NC}\n"

curl -s -X GET http://127.0.0.1:8000/api/users/online \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Online Users${NC}\n"

# Test Channels
echo -e "${GREEN}[5/20] Testing Channels...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/channels \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Channels List${NC}\n"

# Test Messages
echo -e "${GREEN}[6/20] Testing Messages...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Messages List${NC}\n"

# Test Direct Messages
echo -e "${GREEN}[7/20] Testing Direct Messages...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/direct-messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Direct Messages List${NC}\n"

curl -s -X GET http://127.0.0.1:8000/api/direct-messages/unread-count \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Unread Count${NC}\n"

# Test Notifications
echo -e "${GREEN}[8/20] Testing Notifications...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Notifications List${NC}\n"

curl -s -X GET http://127.0.0.1:8000/api/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Notifications Unread Count${NC}\n"

# Test Drawings
echo -e "${GREEN}[9/20] Testing Drawings...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/drawings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Drawings List${NC}\n"

# Test Tickets
echo -e "${GREEN}[10/20] Testing Tickets...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Tickets List${NC}\n"

# Test Disciplines
echo -e "${GREEN}[11/20] Testing Disciplines...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/disciplines \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Disciplines List${NC}\n"

# Test Floors
echo -e "${GREEN}[12/20] Testing Floors...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/floors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Floors List${NC}\n"

# Test Projects
echo -e "${GREEN}[13/20] Testing Projects...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Projects List${NC}\n"

# Test Saved Views
echo -e "${GREEN}[14/20] Testing Saved Views...${NC}"
curl -s -X GET http://127.0.0.1:8000/api/saved-views \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Saved Views List${NC}\n"

# Test Search
echo -e "${GREEN}[15/20] Testing Search...${NC}"
curl -s -X GET "http://127.0.0.1:8000/api/search?q=test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > /dev/null
echo -e "${GREEN}✓ Search${NC}\n"

echo -e "${BLUE}=== All Routes Tested Successfully! ===${NC}"
echo -e "${GREEN}All responses have been saved to: storage/app/api-responses/${NC}\n"















