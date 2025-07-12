# Release Checklist for CAMS

This checklist ensures all necessary steps are completed before publishing a new release.

## Pre-Release Checklist

### Code Quality
- [ ] All tests are passing (`dotnet test`)
- [ ] No linting errors (`npm run lint` in frontend)
- [ ] Type checking passes (`npm run type-check` in frontend)
- [ ] Code coverage meets minimum threshold (80% for backend, 60% for frontend)
- [ ] No console.log statements in production code
- [ ] No TODO comments without issue references

### Security
- [ ] No hardcoded secrets or API keys
- [ ] All dependencies are up to date with no critical vulnerabilities
- [ ] Security scans pass (Trivy, CodeQL, etc.)
- [ ] OWASP dependency check passes
- [ ] No exposed sensitive information in logs

### Documentation
- [ ] README.md is up to date
- [ ] CHANGELOG.md updated with new changes
- [ ] API documentation is current (Swagger/OpenAPI)
- [ ] Environment variables documented in .env.example
- [ ] Deployment guide is accurate

### Configuration
- [ ] Production environment variables configured
- [ ] Database migrations tested
- [ ] CORS settings appropriate for production
- [ ] Rate limiting configured
- [ ] SSL/TLS certificates ready

### Docker & Deployment
- [ ] Docker images build successfully
- [ ] Docker Compose files tested
- [ ] Health check endpoints responding
- [ ] Container security scans pass
- [ ] Multi-platform builds working (amd64/arm64)

### Performance
- [ ] Load testing completed
- [ ] Response times within acceptable limits
- [ ] Database queries optimized
- [ ] Caching strategies implemented
- [ ] Bundle sizes optimized

### Backup & Recovery
- [ ] Database backup strategy documented
- [ ] Rollback procedure tested
- [ ] Disaster recovery plan in place
- [ ] Data migration scripts tested

## Release Process

1. **Version Bump**
   ```bash
   # Update version in Backend/cams.csproj
   # Update version in frontend/package.json
   ```

2. **Create Release Branch**
   ```bash
   git checkout -b release/v1.x.x
   git push origin release/v1.x.x
   ```

3. **Final Testing**
   ```bash
   # Run full test suite
   dotnet test
   cd frontend && npm test
   
   # Build production artifacts
   dotnet build -c Release
   cd frontend && npm run build
   ```

4. **Create GitHub Release**
   - Use GitHub Actions release workflow
   - Or manually create release with tag
   - Include release notes from CHANGELOG.md

5. **Deploy to Production**
   - Trigger deployment workflow
   - Monitor deployment progress
   - Verify health checks

6. **Post-Release**
   - Monitor error rates
   - Check performance metrics
   - Announce release to stakeholders
   - Update documentation site

## Rollback Procedure

If issues are discovered post-release:

1. **Immediate Actions**
   - Assess severity of issue
   - Communicate with stakeholders
   - Decide on rollback vs hotfix

2. **Rollback Steps**
   ```bash
   # Revert to previous Docker images
   docker pull ghcr.io/[repo]/backend:previous-version
   docker pull ghcr.io/[repo]/frontend:previous-version
   
   # Or trigger rollback workflow
   gh workflow run rollback.yml -f version=previous-version
   ```

3. **Database Rollback**
   - Only if schema changes were made
   - Use EF Core migration rollback
   ```bash
   dotnet ef database update [previous-migration]
   ```

## First-Time Setup for GitHub

Before your first release, ensure:

1. **Repository Settings**
   - [ ] GitHub Actions enabled
   - [ ] Secrets configured (see below)
   - [ ] Branch protection rules set
   - [ ] GitHub Pages enabled (if using)

2. **Required Secrets**
   ```
   GITHUB_TOKEN         (automatically provided)
   SONAR_TOKEN          (optional, for SonarCloud)
   SLACK_WEBHOOK_URL    (optional, for notifications)
   CODECOV_TOKEN        (optional, for coverage)
   ```

3. **Environment Variables**
   Configure in Settings > Environments:
   - production
   - staging
   - development

4. **Container Registry**
   - [ ] GitHub Container Registry enabled
   - [ ] Visibility settings configured
   - [ ] Retention policies set

## Monitoring Post-Release

### First Hour
- [ ] Check application logs for errors
- [ ] Monitor response times
- [ ] Verify all endpoints accessible
- [ ] Check database connection pool

### First Day
- [ ] Review error rates
- [ ] Check user feedback
- [ ] Monitor resource usage
- [ ] Verify backup jobs running

### First Week
- [ ] Analyze performance trends
- [ ] Review security alerts
- [ ] Check for memory leaks
- [ ] Plan next iteration

## Emergency Contacts

Document your team's emergency contacts and escalation procedures here:

- **On-Call Engineer**: [Contact]
- **Database Admin**: [Contact]
- **Security Team**: [Contact]
- **Product Owner**: [Contact]

---

Remember: A successful release is not just about deploying code, but ensuring the system remains stable, secure, and performant in production.