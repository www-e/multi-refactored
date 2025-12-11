INFO:     172.22.0.4:49826 - "POST /auth/refresh HTTP/1.1" 200 OK
INFO:app.services.voice.session_service:📞 Session Started: vs_ca7104c3195de781 (Agent: support)
INFO:     172.22.0.4:49826 - "POST /voice/sessions HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_4801kc4pdjsjf6qvkcmckmd8tdah
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688628', RefID=''
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_4801kc4pdjsjf6qvkcmckmd8tdah. Initiating Context Recovery...
INFO:app.services.voice.webhook_service:⚠️ No context found. Creating new customer in demo-tenant
INFO:app.services.voice.customer_service:🆕 Created Customer: عمر (+201154688628)
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: عمر
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_f196ef91aabc6d22 (Priority: high)
INFO:app.services.voice.webhook_service:🚀 SUCCESS: Webhook processed for عمر (Tenant: demo-tenant)
INFO:     172.22.0.4:60110 - "POST /voice/post_call HTTP/1.1" 200 OK
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_4801kc4pdjsjf6qvkcmckmd8tdah
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688628', RefID=''
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_4801kc4pdjsjf6qvkcmckmd8tdah. Initiating Context Recovery...
INFO:app.services.voice.webhook_service:⚠️ No context found. Creating new customer in demo-tenant
INFO:app.services.voice.action_service:ℹ️ Call record already exists for conversation conv_4801kc4pdjsjf6qvkcmckmdd8tdah
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: عمر
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_276d206a6c735cc0 (Priority: high)
INFO:app.services.voice.webhook_service:🚀 SUCCESS: Webhook processed for عمر (Tenant: demo-tenant)
INFO:     172.22.0.4:60118 - "POST /voice/post_call HTTP/1.1" 200 OK