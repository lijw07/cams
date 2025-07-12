# GitHub Actions Workflows

This directory contains the CI/CD workflows for the CAMS project.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)
**Triggers**: Push to master/develop, Pull requests, Manual dispatch

**Jobs**:
- **Backend Build & Test**: Builds .NET project, runs tests with coverage
- **Frontend Build & Test**: Lints, type-checks, and builds React app
- **Security Scanning**: Runs Trivy vulnerability scanner
- **Docker Build**: Builds and pushes multi-platform images to GitHub Container Registry
- **Integration Tests**: Tests the full stack with Docker Compose

### 2. Deployment (`deploy.yml`)
**Triggers**: Push tags (v*), Manual dispatch with environment selection

**Jobs**:
- **Prepare Release**: Determines version and generates release notes
- **Deploy Backend**: Deploys to Kubernetes/Swarm/VM (configurable)
- **Deploy Frontend**: Deploys to S3/Netlify/GitHub Pages (configurable)
- **Post Deployment**: Creates GitHub release, sends notifications

### 3. Security Scan (`security.yml`)
**Triggers**: Push to master/develop, PRs, Daily schedule, Manual dispatch

**Jobs**:
- **.NET Security**: Vulnerability scanning for .NET dependencies
- **Frontend Security**: NPM audit and Snyk scanning
- **Container Security**: Dockerfile security analysis
- **CodeQL Analysis**: Static code analysis for security issues
- **Secret Scanning**: Detects exposed secrets with TruffleHog and GitLeaks
- **License Check**: Ensures license compliance

### 4. Release Management (`release.yml`)
**Triggers**: Push to master, Manual dispatch with version input

**Jobs**:
- **Prepare**: Version determination and changelog generation
- **Build**: Updates version numbers and builds artifacts
- **Release**: Creates Git tags and GitHub releases
- **Docker**: Pushes versioned images to registry
- **Documentation**: Updates README and CHANGELOG
- **Notify**: Sends release notifications

## Required Secrets

Configure these in Settings > Secrets:

- `GITHUB_TOKEN`: Automatically provided by GitHub
- `SONAR_TOKEN`: (Optional) For SonarCloud integration
- `SLACK_WEBHOOK_URL`: (Optional) For Slack notifications
- `SNYK_TOKEN`: (Optional) For Snyk security scanning
- `CODECOV_TOKEN`: (Optional) For code coverage reporting

## Environment Variables

Configure these in Settings > Environments:

### Production
- `API_URL`: Production API endpoint
- `FRONTEND_DOMAIN`: Production frontend domain
- `DEPLOY_METHOD`: kubernetes/swarm/compose
- `FRONTEND_DEPLOY_METHOD`: s3/netlify/pages

### Staging
Same as production with staging-specific values

## Usage

### Manual Deployment
```bash
gh workflow run deploy.yml -f environment=production
```

### Manual Release
```bash
gh workflow run release.yml -f version=1.2.0 -f prerelease=false
```

### Manual Security Scan
```bash
gh workflow run security.yml
```

## Monitoring

All workflow runs can be monitored at:
- https://github.com/[owner]/cams/actions

## Troubleshooting

1. **Docker build fails**: Check Docker Hub rate limits
2. **Tests fail**: Review test logs in workflow artifacts
3. **Security scan fails**: Check for vulnerable dependencies
4. **Deployment fails**: Verify environment secrets and variables

For more details, see the main [README.md](../../README.md) and [RELEASE-CHECKLIST.md](../../RELEASE-CHECKLIST.md).