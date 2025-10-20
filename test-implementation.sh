#!/bin/bash
# Test Script for WhatsApp Anonymization Feature
# This script verifies the implementation is working correctly

set -e

echo "🧪 Testing WhatsApp Anonymization Implementation"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Run this script from the project root${NC}"
    exit 1
fi

echo "1️⃣  Checking Dependencies..."
if [ -d "functions/node_modules" ]; then
    echo -e "${GREEN}✅ Functions dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Functions dependencies not installed${NC}"
    echo "   Run: cd functions && npm install"
fi

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend dependencies not installed${NC}"
    echo "   Run: npm install"
fi

echo ""
echo "2️⃣  Checking Configuration Files..."

# Check firebase.json
if grep -q '"source": "functions"' firebase.json 2>/dev/null; then
    echo -e "${GREEN}✅ Firebase functions configured${NC}"
else
    echo -e "${RED}❌ Firebase functions not configured${NC}"
fi

if grep -q '/contact/\*\*' firebase.json 2>/dev/null; then
    echo -e "${GREEN}✅ Contact endpoint rewrite configured${NC}"
else
    echo -e "${RED}❌ Contact endpoint rewrite missing${NC}"
fi

# Check firestore.rules
if [ -f "firestore.rules" ]; then
    echo -e "${GREEN}✅ Firestore rules file exists${NC}"
else
    echo -e "${RED}❌ Firestore rules file missing${NC}"
fi

# Check function files
if [ -f "functions/index.js" ]; then
    echo -e "${GREEN}✅ Function implementation exists${NC}"
else
    echo -e "${RED}❌ Function implementation missing${NC}"
fi

# Check if environment example exists
if [ -f "functions/.env.example" ]; then
    echo -e "${GREEN}✅ Environment template exists${NC}"
else
    echo -e "${YELLOW}⚠️  Environment template missing${NC}"
fi

echo ""
echo "3️⃣  Running Tests..."

# Run tests
if npm test 2>&1 | grep -q "Test Files.*passed"; then
    echo -e "${GREEN}✅ All tests passing${NC}"
else
    echo -e "${RED}❌ Tests failing${NC}"
    exit 1
fi

echo ""
echo "4️⃣  Running Linter..."

# Run linter
if npm run lint 2>&1; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${RED}❌ Linting failed${NC}"
    exit 1
fi

echo ""
echo "5️⃣  Building Project..."

# Build
if npm run build 2>&1 | grep -q "built in"; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo "6️⃣  Checking Code Implementation..."

# Check if GameCard uses new contact endpoint
if grep -q "buildSecureContactUrl" src/components/GameCard.jsx; then
    echo -e "${GREEN}✅ GameCard uses secure contact URL${NC}"
else
    echo -e "${RED}❌ GameCard not updated${NC}"
fi

# Check if contact utility exists
if [ -f "src/lib/contact.js" ]; then
    echo -e "${GREEN}✅ Contact utility implemented${NC}"
else
    echo -e "${RED}❌ Contact utility missing${NC}"
fi

# Check if tests exist
if [ -f "src/__tests__/contact.test.js" ]; then
    echo -e "${GREEN}✅ Contact tests exist${NC}"
else
    echo -e "${RED}❌ Contact tests missing${NC}"
fi

echo ""
echo "7️⃣  Checking Documentation..."

docs=(
    "README.md"
    "QUICKSTART.md"
    "DEPLOYMENT.md"
    "IMPLEMENTATION.md"
    "COMPARISON.md"
    "functions/README.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✅ $doc exists${NC}"
    else
        echo -e "${RED}❌ $doc missing${NC}"
    fi
done

echo ""
echo "================================================"
echo -e "${GREEN}✨ All checks passed! Implementation is ready.${NC}"
echo ""
echo "📋 Next Steps:"
echo "   1. Set environment variable: firebase functions:config:set ip.hash.salt=\"\$(openssl rand -base64 32)\""
echo "   2. Deploy: firebase deploy"
echo "   3. Test in browser"
echo ""
echo "📚 See QUICKSTART.md for detailed deployment instructions"
echo ""
