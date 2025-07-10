# Setting Up GitHub Protection Rules

This guide explains how to apply the branch and tag protection rules defined in this repository.

## Prerequisites

- Repository admin access
- GitHub CLI (`gh`) installed (optional but recommended)

## Branch Protection Rules

### Using GitHub Web Interface

1. Go to **Settings** → **Branches** in your repository
2. Click **Add rule** for each branch pattern:

#### Master Branch Protection
- **Branch name pattern**: `master`
- **Protect matching branches**:
  - ✅ Require a pull request before merging
    - ✅ Require approvals: 1
    - ✅ Dismiss stale pull request approvals when new commits are pushed
    - ✅ Require review from CODEOWNERS
    - ✅ Require approval of the most recent reviewable push
  - ✅ Require status checks to pass before merging
    - ✅ Require branches to be up to date before merging
    - **Required status checks**: 
      - Build and Test
      - Security Scanning
      - Code Quality Analysis
  - ✅ Require conversation resolution before merging
  - ✅ Require signed commits
  - ✅ Include administrators
  - ✅ Restrict who can push to matching branches

#### Develop Branch Protection
- **Branch name pattern**: `develop`
- Similar to master but with relaxed requirements (see branch-protection.json)

#### Release Branch Protection
- **Branch name pattern**: `release/*`
- Stricter requirements including 2 reviewers and linear history

### Using GitHub CLI

```bash
# Apply branch protection rules using the configuration
gh api repos/{owner}/{repo}/branches/master/protection \
  --method PUT \
  --input .github/branch-protection.json
```

## Tag Protection Rules

### Using GitHub Web Interface

1. Go to **Settings** → **Tags** → **Rulesets**
2. Click **New ruleset** → **New tag ruleset**

#### Release Tags Ruleset (v*)
- **Ruleset name**: Release Tags Protection
- **Enforcement status**: Active
- **Target tags**: `v*`
- **Rules**:
  - ✅ Restrict creations (only release-managers, senior-developers)
  - ✅ Restrict updates
  - ✅ Restrict deletions
  - ✅ Require status checks to pass
  - ✅ Require signed commits

#### Beta Tags Ruleset (v*-beta*)
- **Ruleset name**: Beta Release Tags
- **Target tags**: `v*-beta*`
- More relaxed rules for beta releases

### Using GitHub API

```bash
# Create tag protection ruleset
gh api repos/{owner}/{repo}/rulesets \
  --method POST \
  --field name="Release Tags Protection" \
  --field target=tag \
  --field enforcement=active \
  --input .github/tag-protection.json
```

## Team Setup

Create these teams in your organization:
- `release-managers` - Can create release tags and manage releases
- `senior-developers` - Senior developers with additional permissions
- `backend-team` - Backend developers
- `frontend-team` - Frontend developers
- `devops-team` - DevOps engineers
- `security-team` - Security reviewers
- `qa-team` - QA engineers

## Verification

After setup, verify:
1. Try pushing directly to master (should fail)
2. Create a PR without required checks (should show pending)
3. Try creating a tag without permission (should fail)
4. Check CODEOWNERS assignments on new PRs

## Troubleshooting

- **"Required status checks not found"**: Run the workflows at least once
- **"Team not found"**: Create the teams first or update CODEOWNERS
- **"Cannot push to protected branch"**: Working as intended, use PRs

## Additional Resources

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitHub Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)