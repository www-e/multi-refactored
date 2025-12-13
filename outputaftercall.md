INFO:     172.22.0.4:56426 - "GET /campaigns HTTP/1.1" 200 OK
INFO:app.services.voice.session_service:📞 Session Started: vs_06aacbf50cf090f6 (Agent: support)
INFO:     172.22.0.4:56916 - "POST /voice/sessions HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_1001kccj6zz4egca84w2drtyprnp
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688028', RefID=''
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_1001kccj6zz4egca84w2drtyprnp. Initiating Context Recovery...
INFO:app.services.voice.webhook_service:⚠️ No context found. Creating new customer in demo-tenant
INFO:app.services.voice.customer_service:🆕 Created Customer: عمر (+201154688028)
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: عمر
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_6d875b189a64a3ec (Priority: high)
INFO:app.services.voice.webhook_service:🚀 SUCCESS: Webhook processed for عمر (Tenant: demo-tenant)
INFO:     172.22.0.4:53420 - "POST /voice/post_call HTTP/1.1" 200 OK
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_1001kccj6zz4egca84w2drtyprnp
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688028', RefID=''
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_1001kccj6zz4egca84w2drtyprnp. Initiating Context Recovery...
INFO:app.services.voice.webhook_service:⚠️ No context found. Creating new customer in demo-tenant
INFO:app.services.voice.action_service:ℹ️ Call record already exists for conversation conv_1001kccj6zz4egca84w2drtyprnp
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: عمر
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_16803c8b0aaad2df (Priority: high)
INFO:app.services.voice.webhook_service:🚀 SUCCESS: Webhook processed for عمر (Tenant: demo-tenant)
INFO:     172.22.0.4:53424 - "POST /voice/post_call HTTP/1.1" 200 OK
INFO:     172.22.0.4:52976 - "GET /dashboard/kpis HTTP/1.1" 200 OK
