[Omar_achraf@ip-172-31-44-98 ~]$ docker logs -f agentic_portal_backend --tail 150
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     172.23.0.1:59736 - "GET /healthz HTTP/1.1" 200 OK
INFO:     172.23.0.4:51406 - "POST /auth/refresh HTTP/1.1" 200 OK
INFO:     172.23.0.4:51406 - "POST /auth/refresh HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:app.api.routes.calls:📊 Found 5 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 5 call responses with various data points
INFO:     172.23.0.4:41044 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.23.0.4:51406 - "GET /dashboard/kpis HTTP/1.1" 200 OK
INFO:     172.23.0.4:51406 - "GET /conversations HTTP/1.1" 200 OK
INFO:     172.23.0.4:41044 - "GET /customers HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:app.api.routes.calls:📊 Found 5 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 5 call responses with various data points
INFO:     172.23.0.4:51406 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.23.0.4:41044 - "GET /customers HTTP/1.1" 200 OK
INFO:app.api.routes.transcripts:🔄 Transcript request received for conversation: conv_4801kcykmm1ef7fak1zq7r8y66xv
INFO:app.api.routes.transcripts:📋 Transcript data: Available=True, Entries=13 for conversation conv_4801kcykmm1ef7fak1zq7r8y66xv
INFO:app.api.routes.transcripts:✅ Transcript response prepared: 13 entries, available=True for conversation conv_4801kcykmm1ef7fak1zq7r8y66xv  
INFO:     172.23.0.4:51406 - "GET /transcripts/conv_4801kcykmm1ef7fak1zq7r8y66xv HTTP/1.1" 200 OK
INFO:app.services.voice.session_service:📞 Session Started: vs_3c16b08bf6a9336f (Agent: support)
INFO:     172.23.0.4:52094 - "POST /voice/sessions HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_handlers:🤖 Processing Webhook for ElevenLabs ID: conv_3901kd3bqf86f5nrx577xghx3b1k
INFO:app.services.voice.elevenlabs_service:🔍 No recording URL found in ElevenLabs response for conversation conv_3901kd3bqf86f5nrx577xghx3b1k
INFO:app.services.voice.webhook_handlers:🔍 No recording URL in webhook response, trying fallback method for conv_3901kd3bqf86f5nrx577xghx3b1k
WARNING:app.services.voice.elevenlabs_service:⚠️ Unexpected status from audio endpoint 405 for conv_3901kd3bqf86f5nrx577xghx3b1k
INFO:app.services.voice.elevenlabs_service:ℹ️ No recording found for conversation conv_3901kd3bqf86f5nrx577xghx3b1k at official audio endpoint
INFO:app.services.voice.webhook_handlers:🔍 Extracted: Intent='raise_ticket', Phone='01144688628', RefID='', Recording URL: False, Transcript Entries: 7
INFO:app.services.voice.webhook_handlers:🔍 ElevenLabs API response keys: ['agent_id', 'conversation_id', 'status', 'user_id', 'branch_id', 'transcript', 'metadata', 'analysis', 'conversation_initiation_client_data', 'has_audio', 'has_user_audio', 'has_response_audio']
INFO:app.services.voice.webhook_handlers:🔍 Analysis keys: ['evaluation_criteria_results', 'data_collection_results', 'call_successful', 'transcript_summary', 'call_summary_title']
INFO:app.services.voice.webhook_handlers:🔍 Metadata keys: ['start_time_unix_secs', 'accepted_time_unix_secs', 'call_duration_secs', 'cost', 'deletion_settings', 'feedback', 'authorization_method', 'charging', 'phone_call', 'batch_call', 'termination_reason', 'error', 'warnings', 'main_language', 'rag_usage', 'text_only', 'features_usage', 'eleven_assistant', 'initiator_id', 'conversation_initiation_source', 'conversation_initiation_source_version', 'timezone', 'initiation_trigger', 'async_metadata', 'whatsapp', 'agent_created_from', 'agent_last_updated_from']
INFO:app.services.voice.webhook_handlers:📊 Recording data: False, Transcript data: True
WARNING:app.services.voice.webhook_handlers:👻 Session not found for conv_3901kd3bqf86f5nrx577xghx3b1k. Initiating Context Recovery...
INFO:app.services.voice.webhook_handlers:⚠️ No context found. Creating new customer in demo-tenant
INFO:app.services.voice.customer_service:🆕 Created Customer: زكرية (+201144688628)
INFO:app.services.voice.webhook_handlers:📝 Transcript entries processed: 7 entries for conversation conv_3901kd3bqf86f5nrx577xghx3b1k
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: زكرية
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_8d33884117d29a4f (Priority: high)
INFO:app.services.voice.webhook_handlers:🚀 SUCCESS: Webhook processed for زكرية (Tenant: demo-tenant)
INFO:     172.23.0.4:49906 - "POST /voice/post_call HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_handlers:🤖 Processing Webhook for ElevenLabs ID: conv_3901kd3bqf86f5nrx577xghx3b1k
INFO:app.services.voice.webhook_handlers:ℹ️ Conversation conv_3901kd3bqf86f5nrx577xghx3b1k already processed, skipping duplicate webhook.       
INFO:     172.23.0.4:58200 - "POST /voice/post_call HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:app.api.routes.calls:📊 Found 6 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 6 call responses with various data points
INFO:     172.23.0.4:55598 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.23.0.4:55598 - "GET /customers HTTP/1.1" 200 OK
