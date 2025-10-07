#!/bin/bash
# Pre-commit security check to prevent credential leaks
# Place this in .git/hooks/pre-commit and make it executable

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 Running pre-commit security checks..."

# Patterns to check for sensitive data
PATTERNS=(
    "password\s*[:=]\s*['\"]?[^'\"\s,}]{6,}"
    "secret\s*[:=]\s*['\"]?[^'\"\s,}]{6,}"
    "api[_-]?key\s*[:=]\s*['\"]?[^'\"\s,}]{6,}"
    "private[_-]?key\s*[:=]\s*['\"]?[^'\"\s,}]{6,}"
    "access[_-]?token\s*[:=]\s*['\"]?[^'\"\s,}]{6,}"
    "client[_-]?secret\s*[:=]\s*['\"]?[^'\"\s,}]{6,}"
    "database[_-]?url\s*[:=]\s*['\"]?[^'\"\s,}]*password[^'\"\s,}]*"
    "smtp[_-]?password\s*[:=]\s*['\"]?[^'\"\s,}]{6,}"
    "jwt[_-]?secret\s*[:=]\s*['\"]?[^'\"\s,}]{6,}"
    "encryption[_-]?key\s*[:=]\s*['\"]?[^'\"\s,}]{6,}"
)

# Files to check (staged for commit)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Track if any issues were found
ISSUES_FOUND=0

# Function to check a file for sensitive patterns
check_file() {
    local file="$1"
    local file_issues=0
    
    # Skip binary files and specific extensions
    if [[ "$file" =~ \.(jpg|jpeg|png|gif|pdf|zip|tar|gz|exe|dll|so|dylib)$ ]]; then
        return 0
    fi
    
    # Skip files that should contain credentials (like .env files)
    if [[ "$file" =~ \.env$ ]] && [[ ! "$file" =~ \.env\.example$ ]]; then
        return 0
    fi
    
    for pattern in "${PATTERNS[@]}"; do
        if git show ":$file" | grep -iE "$pattern" > /dev/null 2>&1; then
            if [ $file_issues -eq 0 ]; then
                echo -e "${RED}⚠️  Potential sensitive data found in: $file${NC}"
                file_issues=1
                ISSUES_FOUND=1
            fi
            
            # Show the line (but mask the actual secret)
            git show ":$file" | grep -inE "$pattern" | sed 's/\([:=][[:space:]]*\)[^[:space:],}]\{6,\}/\1[REDACTED]/g' | head -3
        fi
    done
    
    return 0
}

# Check all staged files
if [ -z "$STAGED_FILES" ]; then
    echo -e "${YELLOW}No files staged for commit.${NC}"
    exit 0
fi

echo "Checking files: $STAGED_FILES"
echo ""

for file in $STAGED_FILES; do
    check_file "$file"
done

# Additional checks for common credential files
CREDENTIAL_FILES=(".env" ".env.local" ".env.production" "config/secrets.yml" "credentials.json")
for cred_file in "${CREDENTIAL_FILES[@]}"; do
    if echo "$STAGED_FILES" | grep -q "$cred_file" && [[ ! "$cred_file" =~ \.example$ ]]; then
        echo -e "${RED}⚠️  WARNING: Attempting to commit potential secrets file: $cred_file${NC}"
        ISSUES_FOUND=1
    fi
done

# Check for hardcoded IPs and URLs that might be internal
for file in $STAGED_FILES; do
    if git show ":$file" | grep -E "192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\." > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Private IP address found in: $file${NC}"
        git show ":$file" | grep -E "192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\." | head -2
    fi
done

# Final result
if [ $ISSUES_FOUND -eq 1 ]; then
    echo ""
    echo -e "${RED}❌ COMMIT BLOCKED: Potential sensitive data detected!${NC}"
    echo ""
    echo "To proceed:"
    echo "1. Remove or replace sensitive data with environment variables"
    echo "2. Use placeholder values in example files"
    echo "3. Add sensitive files to .gitignore"
    echo "4. Run: git add <fixed-files> && git commit"
    echo ""
    echo "To bypass this check (NOT RECOMMENDED):"
    echo "git commit --no-verify"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Security check passed! No sensitive data detected.${NC}"
    exit 0
fi