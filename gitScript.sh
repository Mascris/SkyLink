#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  print_error "Not a git repository!"
  exit 1
fi

# Get commit message from argument or prompt user
if [ -z "$1" ]; then
  print_info "Enter commit message (or press Enter for default): "
  read -r COMMIT_MSG
  if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update: $(date '+%Y-%m-%d %H:%M:%S')"
  fi
else
  COMMIT_MSG="$1"
fi

# Show status before adding
print_info "Current git status:"
git status --short

# Add files
print_info "Staging all changes..."
if git add .; then
  print_success "Files staged successfully"
else
  print_error "Failed to stage files"
  exit 1
fi

# Check if there are changes to commit
if git diff --cached --quiet; then
  print_info "No changes to commit"
  exit 0
fi

# Commit changes
print_info "Committing with message: '$COMMIT_MSG'"
if git commit -m "$COMMIT_MSG"; then
  print_success "Committed successfully"
else
  print_error "Commit failed"
  exit 1
fi

# Get current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Ask for confirmation before force push
print_info "About to push to branch: $BRANCH"
echo -n "Use force push? (y/N): "
read -r FORCE_PUSH

if [[ $FORCE_PUSH =~ ^[Yy]$ ]]; then
  print_info "Force pushing to $BRANCH..."
  if git push -f origin "$BRANCH"; then
    print_success "Force pushed successfully to $BRANCH"
  else
    print_error "Force push failed"
    exit 1
  fi
else
  print_info "Normal pushing to $BRANCH..."
  if git push origin "$BRANCH"; then
    print_success "Pushed successfully to $BRANCH"
  else
    print_error "Push failed. Try pulling first or use force push."
    exit 1
  fi
fi

print_success "All done! 🎉"
