name: Agentic Auto-Deploy

on:
  push:
    branches: [ "main" ]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy_and_verify:
    name: Build, Deploy & Health Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Detect Changes
        id: changes
        run: |
          # Get list of changed files with error handling
          CHANGED_FILES=$(git diff --name-only HEAD^ HEAD 2>/dev/null || echo "")
          echo "Changed files: $CHANGED_FILES"
          
          # Default to full deployment if no changes detected or git diff fails
          if [ -z "$CHANGED_FILES" ]; then
            echo "deployment_type=full" >> $GITHUB_OUTPUT
            echo "reason=No changes detected or git diff failed - defaulting to full deployment" >> $GITHUB_OUTPUT
            exit 0
          fi
          
          # Check if ANY backend/database/infrastructure file changed
          BACKEND_CHANGED=false
          for file in $CHANGED_FILES; do
            if [[ $file =~ ^backend/ ]] || \
               [[ $file =~ ^alembic/ ]] || \
               [[ $file =~ ^scripts/ ]] || \
               [[ $file =~ ^Dockerfile ]] || \
               [[ $file =~ ^docker-compose\.yml$ ]] || \
               [[ $file =~ requirements\.txt$ ]] || \
               [[ $file =~ package\.json$ ]] || \
               [[ $file =~ ^\.dockerignore$ ]] || \
               [[ $file =~ \.(py|sql|env|ini)$ ]]; then
              BACKEND_CHANGED=true
              echo "Backend/infrastructure file detected: $file"
              break
            fi
          done
          
          if [ "$BACKEND_CHANGED" = true ]; then
            echo "deployment_type=full" >> $GITHUB_OUTPUT
            echo "reason=Backend, database, or infrastructure changes detected" >> $GITHUB_OUTPUT
          else
            echo "deployment_type=frontend_only" >> $GITHUB_OUTPUT
            echo "reason=Frontend/UI-only changes detected" >> $GITHUB_OUTPUT
          fi

      - name: Executing remote SSH commands
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script_stop: true
          script: |
            # --- CONFIGURATION ---
            PROJECT_DIR="/var/www/voice_agent"
            
            # Container Names (matching docker-compose.yml container_name)
            DB_CONTAINER="agentic_portal_db"
            BACKEND_CONTAINER="agentic_portal_backend"
            FRONTEND_CONTAINER="agentic_portal_frontend"
            
            # Service names for docker-compose (must match docker-compose.yml)
            FRONTEND_SERVICE="agentic_portal_frontend"

            echo "🔓 Force-cleaning any stale lock files..."
            rm -f "/tmp/agentic_portal_deploy.lock" "/tmp/agentic_portal_deploy.info"

            echo "🧹 Pre-deployment cleanup..."
            docker system prune -f 2>/dev/null || true

            # Check disk space (1GB threshold)
            AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
            if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then
                echo "⚠️  WARNING: Low disk space! Pruning images..."
                docker image prune -a -f
            fi

            # 1. Navigate to Project
            cd $PROJECT_DIR || { echo "❌ Project directory not found!"; exit 1; }
            echo "📁 Changed directory to $PROJECT_DIR"

            PREVIOUS_COMMIT=$(git rev-parse HEAD)

            # 2. Sync Code
            echo "📥 Pulling latest code..."
            git fetch --all
            git reset --hard origin/main
            CURRENT_COMMIT=$(git rev-parse HEAD)
            echo "📊 Deploying: $PREVIOUS_COMMIT → $CURRENT_COMMIT"

            # 3. Get deployment type from GitHub Action output
            DEPLOYMENT_TYPE="${{ steps.changes.outputs.deployment_type }}"
            REASON="${{ steps.changes.outputs.reason }}"
            
            # Validate deployment type
            if [[ ! "$DEPLOYMENT_TYPE" =~ ^(frontend_only|full)$ ]]; then
              echo "❌ Invalid deployment_type: '$DEPLOYMENT_TYPE'. Defaulting to full deployment."
              DEPLOYMENT_TYPE="full"
            fi
            
            echo "🎯 Deployment Type: $DEPLOYMENT_TYPE"
            echo "💡 Reason: $REASON"

            # Define health check function (must be defined before usage)
            check_health() {
              local url=$1
              local name=$2
              local max_retries=12
              local wait_time=5

              echo "🏥 Checking $name at $url..."

              for i in $(seq 1 $max_retries); do
                STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

                if [ "$STATUS" -ge 200 ] && [ "$STATUS" -lt 400 ]; then
                  echo "✅ $name is HEALTHY! (Status: $STATUS)"
                  return 0
                fi

                echo "⏳ $name not ready (Status: $STATUS)... waiting ${wait_time}s ($i/$max_retries)"
                sleep $wait_time
              done

              echo "❌ $name failed to start after $((max_retries * wait_time))s."
              return 1
            }

            if [ "$DEPLOYMENT_TYPE" = "frontend_only" ]; then
              echo "🎨 Frontend-only deployment - skipping backend/database operations"

              # Validate frontend service exists in docker-compose.yml
              if ! docker-compose config --services 2>/dev/null | grep -q "^${FRONTEND_SERVICE}$"; then
                echo "⚠️  Service '$FRONTEND_SERVICE' not found in docker-compose.yml. Falling back to full deployment."
                DEPLOYMENT_TYPE="full"
              else
                # Frontend-only deployment
                echo "🏗️ Building and starting Frontend service: $FRONTEND_SERVICE"
                if ! docker-compose build $FRONTEND_SERVICE; then
                  echo "❌ Frontend build failed!"
                  exit 1
                fi

                if ! docker-compose up -d $FRONTEND_SERVICE; then
                  echo "❌ Frontend start failed!"
                  exit 1
                fi

                # Quick warmup for frontend
                echo "💤 Warming up frontend service (waiting 5s)..."
                sleep 5

                # Frontend health check only
                if ! check_health "http://127.0.0.1:3001" "Frontend"; then
                  echo "🔍 DUMPING FRONTEND LOGS:"
                  docker logs $FRONTEND_CONTAINER --tail 50
                  exit 1
                fi

                echo "🚀 Frontend-only deployment COMPLETE!"
                echo "⏱️  Estimated time saved: ~90 seconds"
                echo "🎉 All health checks passed! Deployment successful."
                echo "📈 Deployed commit: $CURRENT_COMMIT"
                exit 0
              fi
            fi
            
            # Full deployment (either explicitly requested or fallback)
            if [ "$DEPLOYMENT_TYPE" = "full" ] || [ "$DEPLOYMENT_TYPE" != "frontend_only" ]; then
              echo "⚙️ Full deployment - running complete process"

              # 4. Backup Database (full deployment only)
              echo "💾 Creating database backup..."
              mkdir -p backups
              BACKUP_FILE="backups/agentic_portal_$(date +%Y%m%d_%H%M%S).sql"
              
              # Suppress stderr to avoid leaking connection details in CI logs
              if docker exec $DB_CONTAINER pg_dump -U navaia navaia > "$BACKUP_FILE" 2>/dev/null; then
                echo "✅ Backup created: $BACKUP_FILE"
              else
                echo "⚠️  Backup skipped (DB may not exist yet)"
              fi
              
              # Keep only last 3 backups
              ls -t backups/*.sql 2>/dev/null | tail -n +4 | xargs -r rm -f

              # 5. Full Rebuild and Restart
              echo "🏗️ Full rebuild of all containers..."
              if ! docker-compose up -d --build --force-recreate --remove-orphans; then
                echo "❌ Docker build failed! Rolling back..."
                git reset --hard $PREVIOUS_COMMIT
                docker-compose up -d
                exit 1
              fi

              # 6. Wait for PostgreSQL
              echo "⏳ Waiting for PostgreSQL (max 30s)..."
              for i in {1..30}; do
                if docker exec $DB_CONTAINER pg_isready -U navaia > /dev/null 2>&1; then
                  echo "✅ PostgreSQL ready!"
                  break
                fi
                [ $i -eq 30 ] && { echo "❌ PostgreSQL failed to start!"; exit 1; }
                sleep 1
              done

              # 7. Database Migrations
              echo "🔄 Running smart database migrations..."
              if ! docker exec $BACKEND_CONTAINER python /app/scripts/smart_migrate.py; then
                echo "❌ Smart Migration Failed!"
                docker logs $BACKEND_CONTAINER --tail 50
                exit 1
              fi
              echo "✅ Migrations completed!"

              # 8. Post-cleanup
              docker image prune -f

              # 9. Full Health Checks
              echo "💤 Warming up services (waiting 10s)..."
              sleep 10

              # Backend health check
              if ! check_health "http://127.0.0.1:8000/healthz" "Backend"; then
                echo "🔍 DUMPING BACKEND LOGS:"
                docker logs $BACKEND_CONTAINER --tail 50
                exit 1
              fi

              # Frontend health check
              if ! check_health "http://127.0.0.1:3001" "Frontend"; then
                echo "🔍 DUMPING FRONTEND LOGS:"
                docker logs $FRONTEND_CONTAINER --tail 50
                exit 1
              fi

              echo "🚀 Full deployment COMPLETE!"
              echo "📦 Backup created: $BACKUP_FILE"
            fi

            echo "🎉 All health checks passed! Deployment successful."
            echo "📈 Deployed commit: $CURRENT_COMMIT"
