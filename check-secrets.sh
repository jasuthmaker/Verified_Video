#!/bin/bash

# Security Check Script - Verify no secrets are exposed before pushing to GitHub
# Usage: bash check-secrets.sh

echo "🔍 Verified Video - Security Check"
echo "===================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FOUND_ISSUES=0

# Check 1: .env files should NOT be tracked
echo "1️⃣  Checking for .env files in git..."
if git ls-files | grep -E '\.env'; then
    echo -e "${RED}❌ ERROR: .env file is tracked in git!${NC}"
    echo "   Fix: git rm --cached .env && git commit -m 'Remove .env'"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo -e "${GREEN}✅ No .env files in git${NC}"
fi
echo ""

# Check 2: Verify .gitignore has .env
echo "2️⃣  Checking .gitignore for .env exclusion..."
if grep -q "^\.env" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ .env in .gitignore${NC}"
else
    echo -e "${RED}❌ WARNING: .env not in .gitignore${NC}"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
fi
echo ""

# Check 3: Look for exposed secrets in code
echo "3️⃣  Scanning code for exposed secrets..."
PATTERNS=(
    "SUPABASE_URL=https://"
    "SUPABASE_KEY=eyJ"
    "SECRET_KEY=[a-zA-Z0-9]"
    "api_key.*="
    "password.*="
)

for pattern in "${PATTERNS[@]}"; do
    if grep -r "$pattern" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" . 2>/dev/null | grep -v ".env.example" | grep -v "node_modules" | grep -v ".git"; then
        echo -e "${RED}❌ Found potential secret: $pattern${NC}"
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    fi
done

if [ $FOUND_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ No secrets found in code${NC}"
fi
echo ""

# Check 4: Files to be committed
echo "4️⃣  Files that will be pushed to GitHub:"
echo "---"
git diff --cached --name-only 2>/dev/null | head -20
echo "---"
echo ""

# Check 5: Verify .gitignore is complete
echo "5️⃣  Checking .gitignore completeness..."
IGNORED_PATTERNS=(
    "node_modules"
    "__pycache__"
    ".env"
    ".venv"
    "dist/"
    "build/"
    ".DS_Store"
    ".vscode"
    ".idea"
)

for pattern in "${IGNORED_PATTERNS[@]}"; do
    if grep -q "$pattern" .gitignore 2>/dev/null; then
        echo -e "${GREEN}✅ $pattern${NC}"
    else
        echo -e "${YELLOW}⚠️  Missing: $pattern${NC}"
    fi
done
echo ""

# Check 6: Git status
echo "6️⃣  Git Status:"
echo "---"
git status --short
echo "---"
echo ""

# Final verdict
echo "===================================="
if [ $FOUND_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ SAFE TO PUSH - No secrets detected!${NC}"
    echo ""
    echo "Next steps:"
    echo "  git add ."
    echo "  git commit -m 'Initial commit: Verified Video architecture'"
    echo "  git push origin main"
else
    echo -e "${RED}❌ ISSUES FOUND - Do NOT push yet!${NC}"
    echo ""
    echo "Fix the issues above before pushing:"
    echo "  1. Remove any .env files from git"
    echo "  2. Check .gitignore is complete"
    echo "  3. Remove hardcoded secrets from code"
fi
echo ""
