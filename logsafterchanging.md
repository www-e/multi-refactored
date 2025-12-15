[Omar_achraf@ip-172-31-44-98 voice_agent]$ docker logs -f agentic_portal_backend --tail 100
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     172.22.0.4:36616 - "GET /customers HTTP/1.1" 200 OK
INFO:     172.22.0.4:36606 - "GET /tickets/recent HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:     172.22.0.4:36616 - "GET /customers HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📊 Found 4 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 4 call responses with various data points
INFO:     172.22.0.4:36606 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.22.0.4:53276 - "GET /campaigns HTTP/1.1" 200 OK
INFO:     172.22.0.4:58388 - "GET /dashboard/kpis HTTP/1.1" 200 OK
INFO:app.services.voice.session_service:📞 Session Started: vs_380fc11aefb3505b (Agent: support)
INFO:     172.22.0.4:34896 - "POST /voice/sessions HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_3201kch2yphkf1js35abe0j8hebm
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688638', RefID='', Recording URL: False, Transcript Entries: 11
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_3201kch2yphkf1js35abe0j8hebm. Initiating Context Recovery...
INFO:app.services.voice.webhook_service:⚠️ No context found. Creating new customer in demo-tenant
INFO:app.services.voice.customer_service:🆕 Created Customer: مراد (+201154688638)
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: مراد
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_1b8e500117c3f638 (Priority: med)
INFO:app.services.voice.webhook_service:📝 Transcript entries processed: 11 entries for conversation conv_3201kch2yphkf1js35abe0j8hebm
INFO:app.services.voice.webhook_service:🚀 SUCCESS: Webhook processed for مراد (Tenant: demo-tenant)
INFO:     172.22.0.4:45580 - "POST /voice/post_call HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_3201kch2yphkf1js35abe0j8hebm
INFO:app.services.voice.webhook_service:ℹ️ Conversation conv_3201kch2yphkf1js35abe0j8hebm already processed, skipping duplicate webhook.
INFO:     172.22.0.4:45594 - "POST /voice/post_call HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:app.api.routes.calls:📊 Found 5 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 5 call responses with various data points
INFO:     172.22.0.4:45608 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.22.0.4:45608 - "GET /customers HTTP/1.1" 200 OK
INFO:app.api.routes.transcripts:🔄 Transcript request received for conversation: conv_3201kch2yphkf1js35abe0j8hebm
INFO:app.api.routes.transcripts:📋 Transcript data: Available=True, Entries=11 for conversation conv_3201kch2yphkf1js35abe0j8hebm
INFO:app.api.routes.transcripts:✅ Transcript response prepared: 11 entries, available=True for conversation conv_3201kch2yphkf1js35abe0j8hebm
INFO:     172.22.0.4:44414 - "GET /transcripts/conv_3201kch2yphkf1js35abe0j8hebm HTTP/1.1" 200 OK