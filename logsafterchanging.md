[Omar_achraf@ip-172-31-44-98 voice_agent]$ docker logs -f agentic_portal_backend --tail 50
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:app.api.routes.calls:📊 Found 3 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 3 call responses with various data points
INFO:     172.22.0.4:57756 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.22.0.4:57748 - "GET /dashboard/kpis HTTP/1.1" 200 OK
INFO:app.services.voice.session_service:📞 Session Started: vs_e215585176babcb4 (Agent: support)
INFO:     172.22.0.4:49056 - "POST /voice/sessions HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_9701kch1f1wzfmy94v9h3tat545m
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='book_appointment', Phone='01254688688', RefID='', Recording URL: False, Transcript Entries: 9
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_9701kch1f1wzfmy94v9h3tat545m. Initiating Context Recovery...
INFO:app.services.voice.webhook_service:⚠️ No context found. Creating new customer in demo-tenant
INFO:app.services.voice.customer_service:🆕 Created Customer: وليد (+201254688688)
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='book_appointment'
INFO:app.services.voice.action_service:📅 Creating Booking for: وليد
INFO:app.services.voice.action_service:✅ Booking Created: bk_ca194f796a0ad09a @ 2025-12-16 15:00:00+03:00
INFO:app.services.voice.webhook_service:📝 Transcript entries processed: 9 entries for conversation conv_9701kch1f1wzfmy94v9h3tat545m
INFO:app.services.voice.webhook_service:🚀 SUCCESS: Webhook processed for وليد (Tenant: demo-tenant)
INFO:     172.22.0.4:41876 - "POST /voice/post_call HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_9701kch1f1wzfmy94v9h3tat545m
INFO:app.services.voice.webhook_service:ℹ️ Conversation conv_9701kch1f1wzfmy94v9h3tat545m already processed, skipping duplicate  webhook.
INFO:     172.22.0.4:41886 - "POST /voice/post_call HTTP/1.1" 200 OK
INFO:     172.22.0.4:49748 - "GET /customers HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:app.api.routes.calls:📊 Found 4 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 4 call responses with various data points
INFO:     172.22.0.4:49748 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.22.0.4:49748 - "GET /customers HTTP/1.1" 200 OK
INFO:     172.22.0.4:49748 - "GET /customers HTTP/1.1" 200 OK
INFO:     172.22.0.4:49748 - "GET /conversations HTTP/1.1" 200 OK
INFO:     172.22.0.4:49748 - "GET /conversations HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:app.api.routes.calls:📊 Found 4 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 4 call responses with various data points
INFO:     172.22.0.4:43504 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.22.0.4:43504 - "GET /customers HTTP/1.1" 200 OK
INFO:app.api.routes.transcripts:🔄 Transcript request received for conversation: conv_9701kch1f1wzfmy94v9h3tat545m
INFO:app.api.routes.transcripts:📋 Transcript data: Available=True, Entries=9 for conversation conv_9701kch1f1wzfmy94v9h3tat545m
INFO:app.api.routes.transcripts:✅ Transcript response prepared: 9 entries, available=True for conversation conv_9701kch1f1wzfmy94v9h3tat545m
INFO:     172.22.0.4:43504 - "GET /transcripts/conv_9701kch1f1wzfmy94v9h3tat545m HTTP/1.1" 200 OK
