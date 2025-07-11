#!/bin/bash

# ============================================
# CAMS GitHub Repository Setup Script
# ============================================
# This script helps set up the CAMS repository on GitHub
# with all necessary configurations for CI/CD

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI (gh) is not installed. Repository creation will be manual."
        GITHUB_CLI_AVAILABLE=false
    else
        GITHUB_CLI_AVAILABLE=true
    fi
    
    log_success "Requirements check completed"
}

# Initialize git repository
init_git() {
    log_info "Initializing Git repository..."
    
    if [ ! -d ".git" ]; then
        git init
        log_success "Git repository initialized"
    else
        log_info "Git repository already exists"
    fi
    
    # Set up git configuration if not already set
    if [ -z "$(git config user.name)" ]; then
        read -p "Enter your Git username: " git_username
        git config user.name "$git_username"
    fi
    
    if [ -z "$(git config user.email)" ]; then
        read -p "Enter your Git email: " git_email
        git config user.email "$git_email"
    fi
    
    log_success "Git configuration completed"
}

# Create/update .gitignore if needed
setup_gitignore() {
    log_info "Setting up .gitignore..."
    
    if [ ! -f ".gitignore" ]; then
        log_warning ".gitignore not found. Basic file structure may not be optimal."
    else
        log_success ".gitignore already configured"
    fi
}

# Set up environment files
setup_environment() {
    log_info "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "Created .env from .env.example"
            log_warning "Please edit .env file with your actual configuration values"
        else
            log_warning ".env.example not found. Please create environment configuration manually."
        fi
    else
        log_info ".env file already exists"
    fi
    
    # Frontend environment
    if [ -f "frontend/.env.example" ]; then
        if [ ! -f "frontend/.env.local" ]; then
            cp frontend/.env.example frontend/.env.local
            log_success "Created frontend/.env.local from example"
        fi
    fi
}

# Stage files for commit
stage_files() {
    log_info "Staging files for commit..."
    
    # Add all files except sensitive ones
    git add .
    
    # Make sure sensitive files are not staged
    git reset HEAD .env 2>/dev/null || true
    git reset HEAD frontend/.env.local 2>/dev/null || true
    git reset HEAD "*.log" 2>/dev/null || true
    
    log_success "Files staged for commit"
}

# Create initial commit
create_initial_commit() {
    log_info "Creating initial commit..."
    
    if git diff --cached --quiet; then
        log_warning "No changes to commit"
        return
    fi
    
    commit_message="🚀 Initial commit: CAMS full-stack application

✨ Features:
- Full-stack application with .NET 8 backend and React 18 frontend
- Google Analytics integration with comprehensive tracking
- Docker containerization for development and production
- Complete CI/CD pipeline with GitHub Actions
- Comprehensive testing and security scanning
- Production-ready deployment configuration

🔧 Tech Stack:
- Backend: .NET 8, Entity Framework Core, SQL Server
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Infrastructure: Docker, GitHub Actions, Docker Compose

🛠️ Generated with Claude Code: https://claude.ai/code

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    git commit -m "$commit_message"
    log_success "Initial commit created"
}

# Create GitHub repository
create_github_repo() {
    if [ "$GITHUB_CLI_AVAILABLE" = true ]; then
        log_info "Creating GitHub repository..."
        
        read -p "Enter repository name (default: cams): " repo_name
        repo_name=${repo_name:-cams}
        
        read -p "Repository description: " repo_description
        repo_description=${repo_description:-"CAMS - Centralized Application Management System"}
        
        echo "Repository visibility:"
        echo "1) Public"
        echo "2) Private"
        read -p "Choose (1 or 2, default: 2): " visibility_choice
        
        if [ "$visibility_choice" = "1" ]; then
            visibility="--public"
        else
            visibility="--private"
        fi
        
        # Create repository
        if gh repo create "$repo_name" $visibility --description "$repo_description" --clone=false; then
            log_success "GitHub repository created: $repo_name"
            
            # Add remote
            git remote add origin "https://github.com/$(gh api user --jq .login)/$repo_name.git"
            log_success "Remote origin added"
            
            return 0
        else
            log_error "Failed to create GitHub repository"
            return 1
        fi
    else
        log_warning "GitHub CLI not available. Please create repository manually:"
        echo "1. Go to https://github.com/new"
        echo "2. Create a new repository named 'cams'"
        echo "3. Copy the repository URL and add it as remote:"
        echo "   git remote add origin <your-repo-url>"
        read -p "Press Enter when you've added the remote..."
        return 0
    fi
}

# Push to GitHub
push_to_github() {
    log_info "Pushing to GitHub..."
    
    # Check if remote exists
    if ! git remote get-url origin &> /dev/null; then
        log_error "No remote 'origin' found. Please add your GitHub repository as remote first."
        return 1
    fi
    
    # Set upstream and push
    git branch -M main
    git push -u origin main
    
    log_success "Code pushed to GitHub successfully!"
}

# Set up GitHub repository settings
setup_github_settings() {
    if [ "$GITHUB_CLI_AVAILABLE" = true ]; then
        log_info "Setting up GitHub repository settings..."
        
        # Enable branch protection
        log_info "Setting up branch protection rules..."
        gh api repos/:owner/:repo/branches/main/protection \
            --method PUT \
            --field required_status_checks='{"strict":true,"contexts":["Backend Tests & Build","Frontend Tests & Build"]}' \
            --field enforce_admins=true \
            --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
            --field restrictions=null &> /dev/null && log_success "Branch protection enabled" || log_warning "Could not set up branch protection"
        
        # Set up repository secrets (prompt user)
        log_info "GitHub repository secrets to set up:"
        echo "  - VITE_GA_MEASUREMENT_ID: Your Google Analytics measurement ID"
        echo "  - MAILTRAP_USERNAME: Your Mailtrap username"
        echo "  - MAILTRAP_PASSWORD: Your Mailtrap password"
        echo ""
        echo "Set these up manually in GitHub Settings > Secrets and variables > Actions"
        
        log_success "GitHub settings configured"
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    echo "============================================"
    log_success "CAMS Repository Setup Complete!"
    echo "============================================"
    echo ""
    echo "🔗 Repository URL: $(git remote get-url origin 2>/dev/null || echo 'Not set')"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Configure repository secrets in GitHub:"
    echo "   - VITE_GA_MEASUREMENT_ID"
    echo "   - MAILTRAP_USERNAME"
    echo "   - MAILTRAP_PASSWORD"
    echo ""
    echo "2. Edit .env files with your configuration:"
    echo "   - .env (backend configuration)"
    echo "   - frontend/.env.local (frontend configuration)"
    echo ""
    echo "3. Test the deployment:"
    echo "   docker-compose up --build"
    echo ""
    echo "4. For production deployment:"
    echo "   docker-compose -f docker-compose.prod.yml up -d"
    echo ""
    echo "📚 Documentation:"
    echo "   - README.md: Project overview and setup"
    echo "   - DEPLOYMENT.md: Detailed deployment guide"
    echo "   - ANALYTICS_README.md: Google Analytics integration"
    echo ""
    echo "🚀 GitHub Actions will automatically:"
    echo "   - Run tests on pull requests"
    echo "   - Build and deploy on main branch pushes"
    echo "   - Perform security scanning"
    echo "   - Generate coverage reports"
    echo ""
    log_success "Happy coding! 🎉"
}

# Main execution
main() {
    echo "============================================"
    echo "🚀 CAMS GitHub Repository Setup"
    echo "============================================"
    echo ""
    
    check_requirements
    init_git
    setup_gitignore
    setup_environment
    stage_files
    create_initial_commit
    
    if create_github_repo; then
        push_to_github
        setup_github_settings
    else
        log_warning "GitHub repository creation failed or skipped."
        log_info "You can manually create the repository and push later with:"
        echo "  git remote add origin <your-repo-url>"
        echo "  git push -u origin main"
    fi
    
    show_next_steps
}

# Run main function
main "$@"