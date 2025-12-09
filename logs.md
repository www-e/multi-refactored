[Omar_achraf@ip-172-31-44-98 voice_agent]$ docker ps -a | grep navaia
2118f2c98021   voice_agent-frontend   "docker-entrypoint.s…"   3 days ago   Up 3 days   0.0.0.0:3001->3001/tcp, :::3001->3001/tcp   navaia_frontend
f9da4f1483c3   voice_agent-backend    "uvicorn app.main:ap…"   3 days ago   Up 3 days   0.0.0.0:8000->8000/tcp, :::8000->8000/tcp   navaia_backend
96d7c5f73a3a   postgres:15-alpine     "docker-entrypoint.s…"   3 days ago   Up 3 days   5432/tcp                   
                 navaia_db
[Omar_achraf@ip-172-31-44-98 voice_agent]$ 
-----------------------------------------------------------------------------------------------------------

[Omar_achraf@ip-172-31-44-98 voice_agent]$ docker logs navaia_backend --tail 100
    await app(scope, receive, sender)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 756, in __call__
    await self.middleware_stack(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 776, in app
    await route.handle(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 297, in handle
    await self.app(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 77, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 64, in wrapped_app
    raise exc
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
    await app(scope, receive, sender)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 72, in app
    response = await func(request)
               ^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 278, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 193, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/starlette/concurrency.py", line 42, in run_in_threadpool
    return await anyio.to_thread.run_sync(func, *args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/anyio/to_thread.py", line 61, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/anyio/_backends/_asyncio.py", line 2525, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/anyio/_backends/_asyncio.py", line 986, in run
    result = context.run(func, *args)
             ^^^^^^^^^^^^^^^^^^^^^^^^
  File "/app/app/api/routes/dashboard.py", line 67, in get_dashboard_kpis
    duration_seconds = (datetime.utcnow() - call.created_at.replace(tzinfo=None)).total_seconds()
                        ^^^^^^^^
UnboundLocalError: cannot access local variable 'datetime' where it is not associated with a value
INFO:     172.21.0.4:51864 - "GET /dashboard/kpis HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
Traceback (most recent call last):
  File "/usr/local/lib/python3.11/site-packages/uvicorn/protocols/http/httptools_impl.py", line 399, in run_asgi   
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/uvicorn/middleware/proxy_headers.py", line 70, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/fastapi/applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/applications.py", line 123, in __call__
    await self.middleware_stack(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 186, in __call__
    raise exc
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 164, in __call__
    await self.app(scope, receive, _send)
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/exceptions.py", line 65, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 64, in wrapped_app
    raise exc
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
    await app(scope, receive, sender)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 756, in __call__
    await self.middleware_stack(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 776, in app
    await route.handle(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 297, in handle
    await self.app(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 77, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 64, in wrapped_app
    raise exc
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
    await app(scope, receive, sender)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 72, in app
    response = await func(request)
               ^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 278, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 193, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/starlette/concurrency.py", line 42, in run_in_threadpool
    return await anyio.to_thread.run_sync(func, *args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/anyio/to_thread.py", line 61, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/anyio/_backends/_asyncio.py", line 2525, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/anyio/_backends/_asyncio.py", line 986, in run
    result = context.run(func, *args)
             ^^^^^^^^^^^^^^^^^^^^^^^^
  File "/app/app/api/routes/dashboard.py", line 67, in get_dashboard_kpis
    duration_seconds = (datetime.utcnow() - call.created_at.replace(tzinfo=None)).total_seconds()
                        ^^^^^^^^
UnboundLocalError: cannot access local variable 'datetime' where it is not associated with a value
[Omar_achraf@ip-172-31-44-98 voice_agent]$



------------------------------------------------------------------------------------------------------------------
[Omar_achraf@ip-172-31-44-98 voice_agent]$ docker logs navaia_frontend --tail 100
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
Error fetching dashboard KPIs from backend: {
  error: {
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    status_code: 500
  }
}
Error fetching dashboard KPIs from backend: {
  error: {
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    status_code: 500
  }
}
Error fetching dashboard KPIs from backend: {
  error: {
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    status_code: 500
  }
}
[Omar_achraf@ip-172-31-44-98 voice_agent]$

