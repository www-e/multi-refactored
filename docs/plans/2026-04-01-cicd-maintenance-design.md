# CI/CD Maintenance & Recovery Design

**Date:** 2026-04-01
**Author:** Claude Code
**Status:** Approved

## Overview

Enhance the GitHub Actions deployment workflow to include aggressive cleanup and health checks on every deployment to main branch. This prevents the "Service Unavailable" issue caused by disk space exhaustion and container crashes.

**Problem Solved:**
- Docker build cache accumulated to 1.4GB
- Disk usage reached 94% (only 1.4GB free)
- Containers crashed due to resource exhaustion
- No automated recovery between deployments

**Solution:**
- Add comprehensive cleanup to deploy workflow
- Add container health verification with auto-restart
- Add disk/memory monitoring with warnings
- Keep only necessary data, remove build artifacts

## Architecture

### Modified Workflow: `.github/workflows/deploy.yml`

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions Trigger                   │
│                    (push to main branch)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Pre-Deploy Checks (Existing)                    │
│  • Disk space check with emergency cleanup                  │
│  • Warn if <2GB, emergency cleanup if <512MB                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Database Backup (Existing)                      │
│  • Create SQL backup before changes                         │
│  • Keep only last 5 backups (ENHANCED)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Docker Deployment (Existing)                    │
│  • docker-compose down                                      │
│  • docker-compose up -d --build --force-recreate            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            AGGRESSIVE CLEANUP (NEW)                          │
│  • Remove ALL unused images (not just dangling)             │
│  • Clear entire build cache                                 │
│  • Remove old backups (keep last 3)                         │
│  • Clean old logs (>7 days)                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            Health Verification (ENHANCED)                    │
│  • PostgreSQL ready check (Existing)                        │
│  • Migrations (Existing)                                    │
│  • Container restart check (NEW)                            │
│  • Backend health check (Existing)                          │
│  • Frontend health check (Existing)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            Resource Monitoring (NEW)                         │
│  • Log final disk space                                     │
│  • Log available memory                                     │
│  • Warn if thresholds exceeded                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            Rollback on Failure (Existing)                    │
│  • Restore previous commit if deployment fails              │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Aggressive Cleanup Step

**Location:** After successful container start, before health checks

**Commands:**
```bash
# Remove all unused images (not just dangling)
docker image prune -a -f

# Clear entire build cache
docker builder prune -a -f

# Remove old backups (keep last 3)
ls -t backups/*.sql 2>/dev/null | tail -n +4 | xargs -r rm

# Clean old application logs
find . -name "*.log" -mtime +7 -delete 2>/dev/null

# Remove unused Docker volumes (EXCEPT database)
docker volume prune -f
```

**Expected Space Reclaimed:** 1-2GB per deployment

### 2. Container Health Verification

**Location:** After migrations, before application health checks

**What It Checks:**
```bash
# Verify all 3 containers are running
docker ps --filter "name=agentic_portal" --format "{{.Names}}" | wc -l

# Expected output: 3 (db, backend, frontend)

# If not 3, attempt restart
docker-compose up -d --force-recreate
```

### 3. Resource Monitoring

**Location:** Final step before success message

**What It Logs:**
```bash
# Disk space
FINAL_SPACE_MB=$(df / | tail -1 | awk '{printf "%.0f", $4/1024}')
echo "📊 Disk: ${FINAL_SPACE_MB}MB available"

# Memory
AVAILABLE_MEM_MB=$(free -m | awk '/^Mem:/{print $7}')
echo "💾 Memory: ${AVAILABLE_MEM_MB}MB available"

# Warnings
if [ "$FINAL_SPACE_MB" -lt 1024 ]; then
  echo "⚠️  WARNING: Low disk space"
fi
if [ "$AVAILABLE_MEM_MB" -lt 500 ]; then
  echo "⚠️  WARNING: Low memory"
fi
```

## Data Flow

### Safe to Delete (Build Artifacts)

| Category | Command | Protected |
|----------|---------|-----------|
| Build Cache | `docker builder prune -a -f` | ❌ No - regenerated on build |
| Unused Images | `docker image prune -a -f` | ❌ No - old app versions |
| Dangling Images | `docker image prune -f` | ❌ No - orphaned layers |
| Old Backups | Keep last 3 | ❌ No - replaced by new |
| Old Logs | `find . -name "*.log" -mtime +7 -delete` | ❌ No - recent kept |

### NEVER Deleted (Protected Data)

| Category | Protection Method |
|----------|-------------------|
| Database Data | Volume `agentic_pgdata` NOT in prune |
| Source Code | In git repo, never touched |
| SSL Certificates | In `/etc/letsencrypt`, not in Docker |
| Active Images | Needed by running containers |
| Recent Logs | `mtime +7` protects last 7 days |

## Error Handling

### Failure Scenarios

**1. Cleanup fails (non-critical)**
- Log warning
- Continue deployment
- Example: `rm` fails if no backups exist yet

**2. Container restart fails (critical)**
- Log container status
- Log container logs (last 100 lines)
- Rollback deployment
- Exit with error

**3. Health check fails (critical)**
- Existing behavior: log and rollback
- Enhanced: include container status in logs

**4. Disk space critical (<512MB)**
- Existing: Emergency cleanup in pre-deploy check
- Enhanced: Additional aggressive cleanup post-deploy

## Testing Strategy

### Manual Testing
1. Deploy to staging/development first
2. Verify cleanup actually frees space
3. Verify containers still running after cleanup
4. Verify old backups are removed (last 3 kept)

### Production Rollout
1. Deploy to main branch
2. Monitor GitHub Actions logs
3. SSH into server to verify:
   - `docker system df` shows reduced space
   - `docker ps` shows all containers up
   - `ls -la backups/` shows only 3 most recent

### Success Criteria
- Disk usage stays below 85% after each deployment
- No container crashes between deployments
- All backups present (last 3 retained)
- Application remains accessible

## Implementation Plan

See: `docs/plans/2026-04-01-cicd-maintenance-implementation.md`

## Related Issues

- Resolves: Container crashes due to disk exhaustion
- Prevents: Service Unavailable errors
- Improves: Deployment reliability
