first deployment :
out: #25 62.00 369:6  Warning: React Hook useCallback has a missing dependency: 'updateLoadingState'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
out: #25 62.00 
out: #25 62.00 info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
out: #25 69.19    Collecting page data ...
out: #25 72.94    Generating static pages (0/34) ...
out: #25 73.61    Generating static pages (8/34) 
out: #25 73.68    Generating static pages (16/34) 
out: #25 77.60    Generating static pages (25/34) 
out: #25 78.87  ✓ Generating static pages (34/34)
out: #25 80.02    Finalizing page optimization ...
out: #25 80.02    Collecting build traces ...
out: #25 98.93 
out: #25 98.95 Route (app)                              Size     First Load JS
out: #25 98.95 ┌ ○ /                                    3.2 kB          118 kB
out: #25 98.95 ├ ○ /_not-found                          873 B          88.2 kB
out: #25 98.95 ├ ○ /analytics                           3.55 kB         115 kB
out: #25 98.95 ├ ƒ /api/auth/[...nextauth]              0 B                0 B
out: #25 98.95 ├ ƒ /api/auth/register                   0 B                0 B
out: #25 98.95 ├ ƒ /api/bookings                        0 B                0 B
out: #25 98.95 ├ ƒ /api/bookings/[id]                   0 B                0 B
out: #25 98.95 ├ ƒ /api/bookings/[id]/general           0 B                0 B
out: #25 98.95 ├ ƒ /api/bookings/recent                 0 B                0 B
out: #25 98.95 ├ ƒ /api/calls                           0 B                0 B
out: #25 98.95 ├ ƒ /api/calls/bulk                      0 B                0 B
out: #25 98.95 ├ ƒ /api/campaigns                       0 B                0 B
out: #25 98.95 ├ ƒ /api/campaigns/[id]                  0 B                0 B
out: #25 98.95 ├ ƒ /api/chat                            0 B                0 B
out: #25 98.95 ├ ƒ /api/chat/customer                   0 B                0 B
out: #25 98.95 ├ ƒ /api/conversations                   0 B                0 B
out: #25 98.95 ├ ƒ /api/customers                       0 B                0 B
out: #25 98.95 ├ ƒ /api/customers/[id]                  0 B                0 B
out: #25 98.95 ├ ƒ /api/dashboard                       0 B                0 B
out: #25 98.95 ├ ƒ /api/elevenlabs                      0 B                0 B
out: #25 98.95 ├ ƒ /api/logs                            0 B                0 B
out: #25 98.95 ├ ƒ /api/tickets                         0 B                0 B
out: #25 98.95 ├ ƒ /api/tickets/[id]                    0 B                0 B
out: #25 98.95 ├ ƒ /api/tickets/[id]/general            0 B                0 B
out: #25 98.95 ├ ƒ /api/tickets/recent                  0 B                0 B
out: #25 98.95 ├ ƒ /api/voice/sessions                  0 B                0 B
out: #25 98.95 ├ ƒ /api/voice/sync                      0 B                0 B
out: #25 98.95 ├ ○ /auth/login                          3.69 kB         118 kB
out: #25 98.95 ├ ○ /auth/register                       4.65 kB         119 kB
out: #25 98.95 ├ ○ /bookings                            4.47 kB         122 kB
out: #25 98.95 ├ ○ /calls                               4.51 kB         116 kB
out: #25 98.95 ├ ○ /campaigns                           3.17 kB         120 kB
out: #25 98.95 ├ ○ /conversations                       3.63 kB         115 kB
out: #25 98.95 ├ ○ /customers                           6.76 kB         124 kB
out: #25 98.95 ├ ○ /dashboard                           5.77 kB         117 kB
out: #25 98.95 ├ ○ /playground                          3.79 kB         228 kB
out: #25 98.95 ├ ○ /settings                            3.32 kB        99.3 kB
out: #25 98.95 ├ ○ /support-agent                       3.77 kB         228 kB
out: #25 98.95 └ ○ /tickets                             3.91 kB         121 kB
out: #25 98.95 + First Load JS shared by all            87.3 kB
out: #25 98.95   ├ chunks/117-e48247db46e8930f.js       31.7 kB
out: #25 98.95   ├ chunks/fd9d1056-e5cd615aeb3cd3b8.js  53.6 kB
out: #25 98.95   └ other shared chunks (total)          1.95 kB
out: #25 98.95 
out: #25 98.95 
out: #25 98.95 ƒ Middleware                             49.4 kB
out: #25 98.95 
out: #25 98.95 ○  (Static)   prerendered as static content
out: #25 98.95 ƒ  (Dynamic)  server-rendered on demand
out: #25 98.95 
out: #25 99.47 npm notice
out: #25 99.47 npm notice New major version of npm available! 10.8.2 -> 11.7.0
out: #25 99.47 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
out: #25 99.47 npm notice To update run: npm install -g npm@11.7.0
out: #25 99.47 npm notice
out: #25 DONE 99.7s
out: #26 [agentic_frontend runner 2/6] RUN addgroup --system --gid 1001 nodejs
out: #26 CACHED
out: #27 [agentic_frontend runner 3/6] RUN adduser --system --uid 1001 nextjs
out: #27 CACHED
out: #28 [agentic_frontend runner 4/6] COPY --from=builder /app/public ./public
out: #28 CACHED
out: #29 [agentic_frontend runner 5/6] COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
out: #29 DONE 0.4s
out: #30 [agentic_frontend runner 6/6] COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
out: #30 DONE 0.1s
out: #31 [agentic_frontend] exporting to image
out: #31 exporting layers
out: #31 exporting layers 1.7s done
out: #31 writing image sha256:ef0e3c28ab53beb119f6a7c4dee008c8ba287cd02c97df670bb98de07e8c5e75 done
out: #31 naming to docker.io/library/voice_agent-agentic_frontend done
out: #31 DONE 1.7s
err:  Container agentic_portal_db  Recreate
err:  Container agentic_portal_db  Recreated
err:  Container agentic_portal_backend  Recreate
err:  Container agentic_portal_backend  Recreated
err:  Container agentic_portal_frontend  Recreate
err:  Container agentic_portal_frontend  Recreated
err:  Container agentic_portal_db  Starting
err:  Container agentic_portal_db  Started
err:  Container agentic_portal_db  Waiting
err:  Container agentic_portal_db  Healthy
err:  Container agentic_portal_backend  Starting
err:  Container agentic_portal_backend  Started
err:  Container agentic_portal_frontend  Starting
err:  Container agentic_portal_frontend  Started
out: ⏳ Waiting for PostgreSQL...
out: ✅ PostgreSQL is ready!
out: 🔄 Running Database Migrations...
err: INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
err: INFO  [alembic.runtime.migration] Will assume transactional DDL.
err: ERROR [alembic.util.messaging] Multiple head revisions are present for given argument 'head'; please specify a specific target revision, '<branchname>@head' to narrow to a specific head, or 'heads' for all heads
out: FAILED: Multiple head revisions are present for given argument 'head'; please specify a specific target revision, '<branchname>@head' to narrow to a specific head, or 'heads' for all heads
out: ❌ Migration Failed!
2025/12/11 16:36:50 Process exited with status 1

second deployment:

out: #25 100.1 ├ ○ /settings                            3.32 kB        99.3 kB
out: #25 100.1 ├ ○ /support-agent                       3.77 kB         228 kB
out: #25 100.1 └ ○ /tickets                             3.92 kB         122 kB
out: #25 100.1 + First Load JS shared by all            87.3 kB
out: #25 100.1   ├ chunks/117-e48247db46e8930f.js       31.7 kB
out: #25 100.1   ├ chunks/fd9d1056-e5cd615aeb3cd3b8.js  53.6 kB
out: #25 100.1   └ other shared chunks (total)          1.95 kB
out: #25 100.1 
out: #25 100.1 
out: #25 100.1 ƒ Middleware                             49.4 kB
out: #25 100.1 
out: #25 100.1 ○  (Static)   prerendered as static content
out: #25 100.1 ƒ  (Dynamic)  server-rendered on demand
out: #25 100.1 
out: #25 100.4 npm notice
out: #25 100.4 npm notice New major version of npm available! 10.8.2 -> 11.7.0
out: #25 100.4 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
out: #25 100.4 npm notice To update run: npm install -g npm@11.7.0
out: #25 100.4 npm notice
out: #25 DONE 100.8s
out: #26 [agentic_frontend runner 3/6] RUN adduser --system --uid 1001 nextjs
out: #26 CACHED
out: #27 [agentic_frontend runner 2/6] RUN addgroup --system --gid 1001 nodejs
out: #27 CACHED
out: #28 [agentic_frontend runner 4/6] COPY --from=builder /app/public ./public
out: #28 CACHED
out: #29 [agentic_frontend runner 5/6] COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
out: #29 DONE 0.3s
out: #30 [agentic_frontend runner 6/6] COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
out: #30 DONE 0.1s
out: #31 [agentic_frontend] exporting to image
out: #31 exporting layers
out: #31 exporting layers 1.7s done
out: #31 writing image sha256:4783bd0c04d96912e97b6762bd87331a22ef15e4244e7e7e598b29073caa19d0 done
out: #31 naming to docker.io/library/voice_agent-agentic_frontend done
out: #31 DONE 1.7s
err:  Container agentic_portal_db  Recreate
err:  Container agentic_portal_db  Recreated
err:  Container agentic_portal_backend  Recreate
err:  Container agentic_portal_backend  Recreated
err:  Container agentic_portal_frontend  Recreate
err:  Container agentic_portal_frontend  Recreated
err:  Container agentic_portal_db  Starting
err:  Container agentic_portal_db  Started
err:  Container agentic_portal_db  Waiting
err:  Container agentic_portal_db  Healthy
err:  Container agentic_portal_backend  Starting
err:  Container agentic_portal_backend  Started
err:  Container agentic_portal_frontend  Starting
err:  Container agentic_portal_frontend  Started
out: ⏳ Waiting for PostgreSQL...
out: ✅ PostgreSQL is ready!
out: 🔄 Running Database Migrations...
err: INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
err: INFO  [alembic.runtime.migration] Will assume transactional DDL.
out: FAILED: Multiple head revisions are present for given argument 'head'; please specify a specific target revision, '<branchname>@head' to narrow to a specific head, or 'heads' for all heads
err: ERROR [alembic.util.messaging] Multiple head revisions are present for given argument 'head'; please specify a specific target revision, '<branchname>@head' to narrow to a specific head, or 'heads' for all heads
out: ❌ Migration Failed!
err:     return ctx.invoke(self.callback, **ctx.params)
err:            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
err:   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 824, in invoke
err:     return callback(*args, **kwargs)
err:            ^^^^^^^^^^^^^^^^^^^^^^^^^
err:   File "/usr/local/lib/python3.11/site-packages/uvicorn/main.py", line 410, in main
err:     run(
err:   File "/usr/local/lib/python3.11/site-packages/uvicorn/main.py", line 577, in run
err:     server.run()
err:   File "/usr/local/lib/python3.11/site-packages/uvicorn/server.py", line 65, in run
err:     return asyncio.run(self.serve(sockets=sockets))
err:            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
err:   File "/usr/local/lib/python3.11/asyncio/runners.py", line 190, in run
err:     return runner.run(main)
err:            ^^^^^^^^^^^^^^^^
err:   File "/usr/local/lib/python3.11/asyncio/runners.py", line 118, in run
err:     return self._loop.run_until_complete(task)
err:            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
err:   File "uvloop/loop.pyx", line 1518, in uvloop.loop.Loop.run_until_complete
err:   File "/usr/local/lib/python3.11/site-packages/uvicorn/server.py", line 69, in serve
err:     await self._serve(sockets)
err:   File "/usr/local/lib/python3.11/site-packages/uvicorn/server.py", line 76, in _serve
err:     config.load()
err:   File "/usr/local/lib/python3.11/site-packages/uvicorn/config.py", line 434, in load
err:     self.loaded_app = import_from_string(self.app)
err:                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
err:   File "/usr/local/lib/python3.11/site-packages/uvicorn/importer.py", line 19, in import_from_string
err:     module = importlib.import_module(module_str)
err:              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
err:   File "/usr/local/lib/python3.11/importlib/__init__.py", line 126, in import_module
err:     return _bootstrap._gcd_import(name[level:], package, level)
err:            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
err:   File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
err:   File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
err:   File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
err:   File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
err:   File "<frozen importlib._bootstrap_external>", line 940, in exec_module
err:   File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
err:   File "/app/app/main.py", line 9, in <module>
err:     from app.api.api import api_router
err:   File "/app/app/api/api.py", line 3, in <module>
err:     from app.api.routes import auth, dashboard, bookings, tickets, voice, customers, campaigns, calls, conversations, voice_sessions, transcripts
err:   File "/app/app/api/routes/voice.py", line 10, in <module>
err:     from app.services.voice import (
err:   File "/app/app/services/voice/__init__.py", line 21, in <module>
2025/12/11 18:01:39 Process exited with status 1
err:     from .elevenlabs_service import (
err:   File "/app/app/services/voice/elevenlabs_service.py", line 118, in <module>
err:     def extract_transcript_from_conversation(data: Dict[str, Any]) -> List[Dict[str, Any]]:
err:                                                                       ^^^^
err: NameError: name 'List' is not defined. Did you mean: 'list'?