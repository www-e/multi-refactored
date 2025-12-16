[Omar_achraf@ip-172-31-44-98 ~]$ docker logs -f agentic_portal_backend --tail 100
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     172.22.0.4:56166 - "GET /dashboard/kpis HTTP/1.1" 200 OK
INFO:app.api.routes.calls:📞 Fetching calls for tenant demo-tenant, limit: 100
INFO:app.api.routes.calls:📊 Found 5 calls total, 0 with recording URLs, 0 with voice session data
INFO:app.api.routes.calls:✅ Returning 5 call responses with various data points
INFO:     172.22.0.4:56166 - "GET /calls HTTP/1.1" 200 OK
INFO:     172.22.0.4:56178 - "GET /customers HTTP/1.1" 200 OK
INFO:app.services.voice.session_service:📞 Session Started: vs_2fb35b30f1c39717 (Agent: support)
INFO:     172.22.0.4:57542 - "POST /voice/sessions HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_2301kch3yf38fycssnmydgwhybkd
INFO:app.services.voice.elevenlabs_service:🔍 No recording URL found in ElevenLabs response for conversation conv_2301kch3yf38fycssnmydgwhybkd
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688728', RefID='', Recording URL: False, Transcript Entries: 7
INFO:app.services.voice.webhook_service:🔍 ElevenLabs API response keys: ['agent_id', 'conversation_id', 'status', 'user_id', 'branch_id', 'transcript', 'metadata', 'analysis', 'conversation_initiation_client_data', 'has_audio', 'has_user_audio', 'has_response_audio']
INFO:app.services.voice.webhook_service:🔍 Analysis keys: ['evaluation_criteria_results', 'data_collection_results', 'call_successful', 'transcript_summary', 'call_summary_title']
INFO:app.services.voice.webhook_service:🔍 Metadata keys: ['start_time_unix_secs', 'accepted_time_unix_secs', 'call_duration_secs', 'cost', 'deletion_settings', 'feedback', 'authorization_method', 'charging', 'phone_call', 'batch_call', 'termination_reason', 'error', 'warnings', 'main_language', 'rag_usage', 'text_only', 'features_usage', 'eleven_assistant', 'initiator_id', 'conversation_initiation_source', 'conversation_initiation_source_version', 'timezone', 'initiation_trigger', 'async_metadata', 'whatsapp', 'agent_created_from', 'agent_last_updated_from']
INFO:app.services.voice.webhook_service:📊 Recording data: False, Transcript data: True
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_2301kch3yf38fycssnmydgwhybkd. Initiating Context Recovery...
INFO:app.services.voice.webhook_service:⚠️ No context found. Creating new customer in demo-tenant
INFO:app.services.voice.customer_service:🆕 Created Customer: مصطفى (+201154688728)
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: مصطفى
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_65464fe905583994 (Priority: high)
INFO:app.services.voice.webhook_service:📝 Transcript entries processed: 7 entries for conversation conv_2301kch3yf38fycssnmydgwhybkd
INFO:app.services.voice.webhook_service:🚀 SUCCESS: Webhook processed for مصطفى (Tenant: demo-tenant)
INFO:     172.22.0.4:38292 - "POST /voice/post_call HTTP/1.1" 200 OK
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_2301kch3yf38fycssnmydgwhybkd
INFO:app.services.voice.webhook_service:ℹ️ Conversation conv_2301kch3yf38fycssnmydgwhybkd already processed, skipping duplicate  webhook.
INFO:     172.22.0.4:38288 - "POST /voice/post_call HTTP/1.1" 200 OK
