INFO:     172.22.0.4:41200 - "GET /voice/sessions HTTP/1.1" 405 Method Not Allowed
ERROR:app.error_handlers:HTTP Exception: status=405, detail=Method Not Allowed
INFO:     172.22.0.4:41200 - "GET /tickets/recent HTTP/1.1" 200 OK
INFO:     172.22.0.4:41200 - "GET /customers HTTP/1.1" 200 OK
INFO:     172.22.0.4:41200 - "GET /bookings/recent HTTP/1.1" 200 OK
INFO:     172.22.0.4:41200 - "GET /customers HTTP/1.1" 200 OK
INFO:     172.22.0.4:41200 - "GET /bookings/recent HTTP/1.1" 200 OK
INFO:     172.22.0.4:41206 - "GET /tickets/recent HTTP/1.1" 200 OK
INFO:     172.22.0.4:41200 - "GET /campaigns HTTP/1.1" 200 OK
INFO:     172.22.0.4:41200 - "GET /campaigns HTTP/1.1" 200 OK
INFO:     172.22.0.4:41200 - "GET /dashboard/kpis HTTP/1.1" 200 OK
INFO:app.services.voice.session_service:📞 Session Started: vs_b4bcc1ea7fc16c5c (Agent: support)
INFO:     172.22.0.4:41200 - "POST /voice/sessions HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_5901kc4k6b5zekks303g0cf1sw03
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688628', RefID='None'
INFO:app.services.voice.customer_service:🆕 Created Customer: خالد (+201154688628)
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_5901kc4k6b5zekks303g0cf1sw03. Processing as Ghost Call.
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: خالد
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_a625e619619012f5 (Priority: med)
ERROR:app.services.voice.webhook_service:💥 Critical Failure in Action Service: (psycopg2.errors.ForeignKeyViolation) insert or update on table "calls" violates foreign key constraint "calls_conversation_id_fkey"
DETAIL:  Key (conversation_id)=(conv_5901kc4k6b5zekks303g0cf1sw03) is not present in table "conversations".

[SQL: INSERT INTO calls (id, tenant_id, conversation_id, direction, status, handle_sec, outcome, ai_or_human, recording_url, retention_expires_at, created_at) VALUES (%(id)s, %(tenant_id)s, %(conversation_id)s, %(direction)s, %(status)s, %(handle_sec)s, %(outcome)s, %(ai_or_human)s, %(recording_url)s, %(retention_expires_at)s, %(created_at)s)]
[parameters: {'id': 'call_ef92a9bb54659d77', 'tenant_id': 'demo-tenant', 'conversation_id': 'conv_5901kc4k6b5zekks303g0cf1sw03', 'direction': 'inbound', 'status': 'connected', 'handle_sec': None, 'outcome': 'info', 'ai_or_human': 'AI', 'recording_url': None, 'retention_expires_at': None, 'created_at': datetime.datetime(2025, 12, 10, 16, 59, 44, 634492)}]
(Background on this error at: https://sqlalche.me/e/20/gkpj)
Traceback (most recent call last):
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1967, in _exec_single_context
    self.dialect.do_execute(
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 924, in do_execute
    cursor.execute(statement, parameters)
psycopg2.errors.ForeignKeyViolation: insert or update on table "calls" violates foreign key constraint "calls_conversation_id_fkey"
DETAIL:  Key (conversation_id)=(conv_5901kc4k6b5zekks303g0cf1sw03) is not present in table "conversations".


The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/app/app/services/voice/webhook_service.py", line 98, in process_webhook_payload
    db.commit() # Commits the Customer, Booking, Ticket
    ^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 2017, in commit
    trans.commit(_to_root=True)
  File "<string>", line 2, in commit
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/state_changes.py", line 139, in _go
    ret_value = fn(self, *arg, **kw)
                ^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 1302, in commit
    self._prepare_impl()
  File "<string>", line 2, in _prepare_impl
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/state_changes.py", line 139, in _go
    ret_value = fn(self, *arg, **kw)
                ^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 1277, in _prepare_impl
    self.session.flush()
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 4341, in flush
    self._flush(objects)
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 4476, in _flush
    with util.safe_reraise():
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/util/langhelpers.py", line 146, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 4437, in _flush
    flush_context.execute()
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/unitofwork.py", line 466, in execute
    rec.execute(self)
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/unitofwork.py", line 642, in execute
    util.preloaded.orm_persistence.save_obj(
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/persistence.py", line 93, in save_obj
    _emit_insert_statements(
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/persistence.py", line 1048, in _emit_insert_statements
    result = connection.execute(
             ^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1418, in execute
    return meth(
           ^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/sql/elements.py", line 515, in _execute_on_connection
    return connection._execute_clauseelement(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1640, in _execute_clauseelement
    ret = self._execute_context(
          ^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1846, in _execute_context
    return self._exec_single_context(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1986, in _exec_single_context
    self._handle_dbapi_exception(
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 2353, in _handle_dbapi_exception
    raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1967, in _exec_single_context
    self.dialect.do_execute(
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 924, in do_execute
    cursor.execute(statement, parameters)
sqlalchemy.exc.IntegrityError: (psycopg2.errors.ForeignKeyViolation) insert or update on table "calls" violates foreign key constraint "calls_conversation_id_fkey"
DETAIL:  Key (conversation_id)=(conv_5901kc4k6b5zekks303g0cf1sw03) is not present in table "conversations".

[SQL: INSERT INTO calls (id, tenant_id, conversation_id, direction, status, handle_sec, outcome, ai_or_human, recording_url, retention_expires_at, created_at) VALUES (%(id)s, %(tenant_id)s, %(conversation_id)s, %(direction)s, %(status)s, %(handle_sec)s, %(outcome)s, %(ai_or_human)s, %(recording_url)s, %(retention_expires_at)s, %(created_at)s)]
[parameters: {'id': 'call_ef92a9bb54659d77', 'tenant_id': 'demo-tenant', 'conversation_id': 'conv_5901kc4k6b5zekks303g0cf1sw03', 'direction': 'inbound', 'status': 'connected', 'handle_sec': None, 'outcome': 'info', 'ai_or_human': 'AI', 'recording_url': None, 'retention_expires_at': None, 'created_at': datetime.datetime(2025, 12, 10, 16, 59, 44, 634492)}]
(Background on this error at: https://sqlalche.me/e/20/gkpj)
WARNING:app.api.routes.voice:⚠️ Webhook Warning: {'status': 'error', 'message': 'Action logic failed'}
INFO:     172.22.0.4:43850 - "POST /voice/post_call HTTP/1.1" 200 OK
WARNING:app.api.routes.voice:⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_5901kc4k6b5zekks303g0cf1sw03
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688628', RefID='None'
INFO:app.services.voice.customer_service:🆕 Created Customer: خالد (+201154688628)
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_5901kc4k6b5zekks303g0cf1sw03. Processing as Ghost Call.
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: خالد
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_80f97c4dd18a6d63 (Priority: med)
ERROR:app.services.voice.webhook_service:💥 Critical Failure in Action Service: (psycopg2.errors.ForeignKeyViolation) insert or update on table "calls" violates foreign key constraint "calls_conversation_id_fkey"
DETAIL:  Key (conversation_id)=(conv_5901kc4k6b5zekks303g0cf1sw03) is not present in table "conversations".

[SQL: INSERT INTO calls (id, tenant_id, conversation_id, direction, status, handle_sec, outcome, ai_or_human, recording_url, retention_expires_at, created_at) VALUES (%(id)s, %(tenant_id)s, %(conversation_id)s, %(direction)s, %(status)s, %(handle_sec)s, %(outcome)s, %(ai_or_human)s, %(recording_url)s, %(retention_expires_at)s, %(created_at)s)]
[parameters: {'id': 'call_2dcccb687eb57186', 'tenant_id': 'demo-tenant', 'conversation_id': 'conv_5901kc4k6b5zekks303g0cf1sw03', 'direction': 'inbound', 'status': 'connected', 'handle_sec': None, 'outcome': 'info', 'ai_or_human': 'AI', 'recording_url': None, 'retention_expires_at': None, 'created_at': datetime.datetime(2025, 12, 10, 16, 59, 45, 468478)}]
(Background on this error at: https://sqlalche.me/e/20/gkpj)
Traceback (most recent call last):
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1967, in _exec_single_context
    self.dialect.do_execute(
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 924, in do_execute
    cursor.execute(statement, parameters)
psycopg2.errors.ForeignKeyViolation: insert or update on table "calls" violates foreign key constraint "calls_conversation_id_fkey"
DETAIL:  Key (conversation_id)=(conv_5901kc4k6b5zekks303g0cf1sw03) is not present in table "conversations".


The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/app/app/services/voice/webhook_service.py", line 98, in process_webhook_payload
    db.commit() # Commits the Customer, Booking, Ticket
    ^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 2017, in commit
    trans.commit(_to_root=True)
  File "<string>", line 2, in commit
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/state_changes.py", line 139, in _go
    ret_value = fn(self, *arg, **kw)
                ^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 1302, in commit
    self._prepare_impl()
  File "<string>", line 2, in _prepare_impl
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/state_changes.py", line 139, in _go
    ret_value = fn(self, *arg, **kw)
                ^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 1277, in _prepare_impl
    self.session.flush()
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 4341, in flush
    self._flush(objects)
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 4476, in _flush
    with util.safe_reraise():
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/util/langhelpers.py", line 146, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 4437, in _flush
    flush_context.execute()
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/unitofwork.py", line 466, in execute
    rec.execute(self)
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/unitofwork.py", line 642, in execute
    util.preloaded.orm_persistence.save_obj(
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/persistence.py", line 93, in save_obj
    _emit_insert_statements(
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/orm/persistence.py", line 1048, in _emit_insert_statements
    result = connection.execute(
             ^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1418, in execute
    return meth(
           ^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/sql/elements.py", line 515, in _execute_on_connection
    return connection._execute_clauseelement(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1640, in _execute_clauseelement
    ret = self._execute_context(
          ^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1846, in _execute_context
    return self._exec_single_context(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1986, in _exec_single_context
    self._handle_dbapi_exception(
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 2353, in _handle_dbapi_exception
    raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1967, in _exec_single_context
    self.dialect.do_execute(
  File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 924, in do_execute
    cursor.execute(statement, parameters)
sqlalchemy.exc.IntegrityError: (psycopg2.errors.ForeignKeyViolation) insert or update on table "calls" violates foreign key constraint "calls_conversation_id_fkey"
DETAIL:  Key (conversation_id)=(conv_5901kc4k6b5zekks303g0cf1sw03) is not present in table "conversations".

[SQL: INSERT INTO calls (id, tenant_id, conversation_id, direction, status, handle_sec, outcome, ai_or_human, recording_url, retention_expires_at, created_at) VALUES (%(id)s, %(tenant_id)s, %(conversation_id)s, %(direction)s, %(status)s, %(handle_sec)s, %(outcome)s, %(ai_or_human)s, %(recording_url)s, %(retention_expires_at)s, %(created_at)s)]
[parameters: {'id': 'call_2dcccb687eb57186', 'tenant_id': 'demo-tenant', 'conversation_id': 'conv_5901kc4k6b5zekks303g0cf1sw03', 'direction': 'inbound', 'status': 'connected', 'handle_sec': None, 'outcome': 'info', 'ai_or_human': 'AI', 'recording_url': None, 'retention_expires_at': None, 'created_at': datetime.datetime(2025, 12, 10, 16, 59, 45, 468478)}]
(Background on this error at: https://sqlalche.me/e/20/gkpj)
WARNING:app.api.routes.voice:⚠️ Webhook Warning: {'status': 'error', 'message': 'Action logic failed'}
INFO:     172.22.0.4:43864 - "POST /voice/post_call HTTP/1.1" 200 OK


-------------------------------------------------------------------
after edit
INFO:     172.22.0.4:52970 - "GET /dashboard/kpis HTTP/1.1" 200 OK
INFO:app.services.voice.session_service:📞 Session Started: vs_5237ecf4e661cfea (Agent: support)
INFO:     172.22.0.4:60974 - "POST /voice/sessions HTTP/1.1" 200 OK
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_3301kc4mtb5ve6sbppja6v6anfq5
INFO:app.api.routes.voice:📡 WEBHOOK RECEIVED: /voice/post_call
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688628', RefID='None'
INFO:app.services.voice.customer_service:🆕 Created Customer: عمر (+201154688628)
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_3301kc4mtb5ve6sbppja6v6anfq5. Processing as Ghost Call.
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: عمر
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_1db11c94eb2db444 (Priority: high)
INFO:app.services.voice.webhook_service:🚀 SUCCESS: Webhook processed for عمر
INFO:     172.22.0.4:41276 - "POST /voice/post_call HTTP/1.1" 200 OK
INFO:app.services.voice.webhook_service:🤖 Processing Webhook for ElevenLabs ID: conv_3301kc4mtb5ve6sbppja6v6anfq5
INFO:app.services.voice.webhook_service:🔍 Extracted: Intent='raise_ticket', Phone='01154688628', RefID='None'
WARNING:app.services.voice.webhook_service:👻 Session not found for conv_3301kc4mtb5ve6sbppja6v6anfq5. Processing as Ghost Call.
INFO:app.services.voice.action_service:🧠 Action Routing: Intent='raise_ticket'
INFO:app.services.voice.action_service:🎫 Creating Ticket for: عمر
INFO:app.services.voice.action_service:✅ Ticket Created: tkt_b4fdd0bc8039332a (Priority: high)
INFO:app.services.voice.webhook_service:🚀 SUCCESS: Webhook processed for عمر
INFO:     172.22.0.4:41288 - "POST /voice/post_call HTTP/1.1" 200 OK