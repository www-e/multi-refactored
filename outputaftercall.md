INFO:     172.22.0.4:46452 - "GET /calls HTTP/1.1" 200 OK
INFO:app.services.voice.session_service:📞 Session Started: vs_1bc285e4517c80d1 (Agent: support)
INFO:     172.22.0.4:43824 - "POST /voice/sessions HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_9101kccx1z8repdv0we9ey1rnwp6
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688628', RefID=''
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_9101kccx1z8repdv0we9ey1rnwp6. Initiating Context Recovery...
INFO:app.services.voice.webhook_service:⚠️ No context found. Creating new customer in demo-tenant
INFO:app.services.voice.customer_service:🆕 Created Customer: عمر المحمدي (+201154688628)
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: عمر المحمدي
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_dfa815ce61cedeb4 (Priority: high)
INFO:app.services.voice.webhook_service:🚀 SUCCESS: Webhook processed for عمر المحمدي (Tenant: demo-tenant)
INFO:     172.22.0.4:51052 - "POST /voice/post_call HTTP/1.1" 200 OK
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_9101kccx1z8repdv0we9ey1rnwp6
INFO:app.services.voice.webhook_service:ℹ️ Conversation conv_9101kccx1z8repdv0we9ey1rnwp6 already processed,  skipping duplicate webhook.
INFO:     172.22.0.4:51054 - "POST /voice/post_call HTTP/1.1" 200 OK



front end 
[Omar_achraf@ip-172-31-44-98 voice_agent]$ docker logs -f agentic_portal_frontend --tail 100
    at async NextNodeServer.renderToResponseWithComponentsImpl (/app/node_modules/next/dist/server/base-server.js:1496:28)
    at async NextNodeServer.renderPageComponent (/app/node_modules/next/dist/server/base-server.js:1924:24)
    at async NextNodeServer.renderToResponseImpl (/app/node_modules/next/dist/server/base-server.js:1962:32)
Error: Failed to find Server Action "x". This request might be from an older or newer deployment. Original error: Cannot read properties of undefined (reading 'workers')
    at rT (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:1766)
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:303
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async rE (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:15:8146)
    at async r7 (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:18:1144)
    at async doRender (/app/node_modules/next/dist/server/base-server.js:1427:30)
    at async cacheEntry.responseCache.get.routeKind (/app/node_modules/next/dist/server/base-server.js:1588:28)
    at async NextNodeServer.renderToResponseWithComponentsImpl (/app/node_modules/next/dist/server/base-server.js:1496:28)
    at async NextNodeServer.renderPageComponent (/app/node_modules/next/dist/server/base-server.js:1924:24)
    at async NextNodeServer.renderToResponseImpl (/app/node_modules/next/dist/server/base-server.js:1962:32)
Error: Failed to find Server Action "x". This request might be from an older or newer deployment. Original error: Cannot read properties of undefined (reading 'workers')
    at rT (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:1766)
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:303
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async rE (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:15:8146)
    at async r7 (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:18:1144)
    at async doRender (/app/node_modules/next/dist/server/base-server.js:1427:30)
    at async cacheEntry.responseCache.get.routeKind (/app/node_modules/next/dist/server/base-server.js:1588:28)
    at async NextNodeServer.renderToResponseWithComponentsImpl (/app/node_modules/next/dist/server/base-server.js:1496:28)      
    at async NextNodeServer.renderPageComponent (/app/node_modules/next/dist/server/base-server.js:1924:24)
    at async NextNodeServer.renderToResponseImpl (/app/node_modules/next/dist/server/base-server.js:1962:32)
Error: Failed to find Server Action "x". This request might be from an older or newer deployment. Original error: Cannot read properties of undefined (reading 'workers')
    at rT (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:1766)
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:303
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async rE (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:15:8146)
    at async r7 (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:18:1144)
    at async doRender (/app/node_modules/next/dist/server/base-server.js:1427:30)
    at async cacheEntry.responseCache.get.routeKind (/app/node_modules/next/dist/server/base-server.js:1588:28)
    at async NextNodeServer.renderToResponseWithComponentsImpl (/app/node_modules/next/dist/server/base-server.js:1496:28)      
    at async NextNodeServer.renderPageComponent (/app/node_modules/next/dist/server/base-server.js:1924:24)
    at async NextNodeServer.renderToResponseImpl (/app/node_modules/next/dist/server/base-server.js:1962:32)
Error: Failed to find Server Action "x". This request might be from an older or newer deployment. Original error: Cannot read properties of undefined (reading 'workers')
    at rT (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:1766)
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:303
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async rE (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:15:8146)
    at async r7 (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:18:1144)
    at async doRender (/app/node_modules/next/dist/server/base-server.js:1427:30)
    at async cacheEntry.responseCache.get.routeKind (/app/node_modules/next/dist/server/base-server.js:1588:28)
    at async NextNodeServer.renderToResponseWithComponentsImpl (/app/node_modules/next/dist/server/base-server.js:1496:28)      
    at async NextNodeServer.renderPageComponent (/app/node_modules/next/dist/server/base-server.js:1924:24)
    at async NextNodeServer.renderToResponseImpl (/app/node_modules/next/dist/server/base-server.js:1962:32)
TypeError: Cannot read properties of null (reading 'digest')
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:13:19722
    at AsyncLocalStorage.run (node:async_hooks:338:14)
    at e_ (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:141421)
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138763
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
TypeError: Cannot read properties of null (reading 'digest')
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:13:19722
    at AsyncLocalStorage.run (node:async_hooks:338:14)
    at e_ (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:141421)
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138763
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
Error: Failed to find Server Action "x". This request might be from an older or newer deployment. Original error: Cannot read properties of undefined (reading 'workers')
    at rT (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:1766)
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:303
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async rE (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:15:8146)
    at async r7 (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:18:1144)
    at async doRender (/app/node_modules/next/dist/server/base-server.js:1427:30)
    at async cacheEntry.responseCache.get.routeKind (/app/node_modules/next/dist/server/base-server.js:1588:28)
    at async NextNodeServer.renderToResponseWithComponentsImpl (/app/node_modules/next/dist/server/base-server.js:1496:28)      
    at async NextNodeServer.renderPageComponent (/app/node_modules/next/dist/server/base-server.js:1924:24)
    at async NextNodeServer.renderToResponseImpl (/app/node_modules/next/dist/server/base-server.js:1962:32)
TypeError: Cannot read properties of null (reading 'digest')
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:13:19722
    at AsyncLocalStorage.run (node:async_hooks:338:14)
    at e_ (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:141421)
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138763
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
TypeError: Cannot read properties of null (reading 'digest')
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:13:19722
    at AsyncLocalStorage.run (node:async_hooks:338:14)
    at e_ (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:141421)
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138763
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
TypeError: Cannot read properties of null (reading 'digest')
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:13:19722
    at AsyncLocalStorage.run (node:async_hooks:338:14)
    at e_ (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:141421)
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138763
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
TypeError: Cannot read properties of null (reading 'digest')
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:13:19722
    at AsyncLocalStorage.run (node:async_hooks:338:14)
    at e_ (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:141421)
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138763
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
TypeError: Cannot read properties of null (reading 'digest')
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:13:19722
    at AsyncLocalStorage.run (node:async_hooks:338:14)
    at e_ (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:141421)
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138763
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)



backend logs

INFO:     172.22.0.4:57002 - "GET /campaigns HTTP/1.1" 200 OK
INFO:app.services.voice.session_service:📞 Session Started: vs_94a364b93ebd8585 (Agent: support)
INFO:     172.22.0.4:57002 - "POST /voice/sessions HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_1201kcgvwzfbepzvpn7faf1c5raw
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688629', RefID=''
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_1201kcgvwzfbepzvpn7faf1c5raw. Initiating Context Recovery...
INFO:app.services.voice.webhook_service:⚠️ No context found. Creating new customer in demo-tenant
INFO:app.services.voice.customer_service:🆕 Created Customer: علاء (+201154688629)
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: علاء
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_24f2c7a86ee95479 (Priority: high)
INFO:app.services.voice.webhook_service:🚀 SUCCESS: Webhook processed for علاء (Tenant: demo-tenant)
INFO:     172.22.0.4:51816 - "POST /voice/post_call HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_1201kcgvwzfbepzvpn7faf1c5raw
INFO:app.services.voice.webhook_service:ℹ️ Conversation conv_1201kcgvwzfbepzvpn7faf1c5raw already processed, skipping duplicate  webhook.
INFO:     172.22.0.4:51822 - "POST /voice/post_call HTTP/1.1" 200 OK
INFO:     172.22.0.4:38502 - "GET /conversations HTTP/1.1" 200 OK
INFO:     172.22.0.4:38510 - "GET /customers HTTP/1.1" 200 OK
INFO:     172.22.0.4:38502 - "GET /voice/sessions HTTP/1.1" 200 OK
INFO:     172.22.0.4:38510 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.22.0.4:38502 - "GET /customers HTTP/1.1" 200 OK
INFO:     172.22.0.4:38502 - "GET /transcripts/conv_1201kcgvwzfbepzvpn7faf1c5raw HTTP/1.1" 200 OK
INFO:     172.22.0.4:38502 - "GET /tickets/recent HTTP/1.1" 200 OK
INFO:     172.22.0.4:42656 - "GET /customers HTTP/1.1" 200 OK
INFO:     172.22.0.4:47378 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.22.0.4:47388 - "GET /customers HTTP/1.1" 200 OK
INFO:     172.22.0.4:47378 - "GET /voice/sessions HTTP/1.1" 200 OK
INFO:     172.22.0.4:47378 - "GET /transcripts/conv_1201kcgvwzfbepzvpn7faf1c5raw HTTP/1.1" 200 OK
INFO:     172.22.0.4:58506 - "GET /transcripts/conv_1201kcgvwzfbepzvpn7faf1c5raw HTTP/1.1" 200 OK




//////////////////////////////////////////////
[Omar_achraf@ip-172-31-44-98 voice_agent]$ docker logs -f agentic_portal_backend --tail 50
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     172.22.0.4:33442 - "POST /auth/refresh HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:app.api.routes.calls:📊 Found 2 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 2 call responses with various data points
INFO:     172.22.0.4:33450 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.22.0.4:33442 - "GET /dashboard/kpis HTTP/1.1" 200 OK
INFO:     172.22.0.4:33442 - "GET /dashboard/kpis HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:app.api.routes.calls:📊 Found 2 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 2 call responses with various data points
INFO:     172.22.0.4:33442 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.22.0.4:33450 - "GET /customers HTTP/1.1" 200 OK
INFO:     172.22.0.4:33442 - "GET /conversations HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:app.api.routes.calls:📊 Found 2 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 2 call responses with various data points
INFO:     172.22.0.4:33442 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.22.0.4:33450 - "GET /customers HTTP/1.1" 200 OK
INFO:app.services.voice.session_service:📞 Session Started: vs_63ae55a143fe3a71 (Agent: support)
INFO:     172.22.0.4:33442 - "POST /voice/sessions HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_8601kcgzh3g6f5jr01x5r2424t50
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688620', RefID='', Recording URL: False, Transcript Entries: 0
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_8601kcgzh3g6f5jr01x5r2424t50. Initiating Context Recovery...
INFO:app.services.voice.webhook_service:⚠️ No context found. Creating new customer in demo-tenant
INFO:app.services.voice.customer_service:🆕 Created Customer: زاكي (+201154688620)
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: زاكي
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_653de41f02ea26d7 (Priority: high)
INFO:app.services.voice.webhook_service:📝 Transcript entries processed: 0 entries for conversation conv_8601kcgzh3g6f5jr01x5r2424t50
INFO:app.services.voice.webhook_service:🚀 SUCCESS: Webhook processed for زاكي (Tenant: demo-tenant)
INFO:     172.22.0.4:45008 - "POST /voice/post_call HTTP/1.1" 200 OK
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_8601kcgzh3g6f5jr01x5r2424t50
INFO:app.services.voice.webhook_service:ℹ️ Conversation conv_8601kcgzh3g6f5jr01x5r2424t50 already processed, skipping duplicate  webhook.
INFO:     172.22.0.4:45018 - "POST /voice/post_call HTTP/1.1" 200 OK
INFO:     172.22.0.4:34084 - "GET /conversations HTTP/1.1" 200 OK
INFO:     172.22.0.4:34084 - "GET /customers HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:app.api.routes.calls:📊 Found 3 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 3 call responses with various data points
INFO:     172.22.0.4:34084 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.22.0.4:34084 - "GET /customers HTTP/1.1" 200 OK
INFO:app.api.routes.transcripts:🔄 Transcript request received for conversation: conv_8601kcgzh3g6f5jr01x5r2424t50
INFO:app.api.routes.transcripts:📋 Transcript data: Available=False, Entries=0 for conversation conv_8601kcgzh3g6f5jr01x5r2424t50
INFO:app.api.routes.transcripts:✅ Transcript response prepared: 0 entries, available=False for conversation conv_8601kcgzh3g6f5jr01x5r2424t50
INFO:     172.22.0.4:34084 - "GET /transcripts/conv_8601kcgzh3g6f5jr01x5r2424t50 HTTP/1.1" 200 OK
