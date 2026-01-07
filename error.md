/api/admin/users:1  Failed to load resource: the server responded with a status of 404 (Not Found)
117-64672ff83c30bf20.js:1 Client API Error on /admin/users: 404 Object
window.console.error @ 117-64672ff83c30bf20.js:1
o @ 698-a28b7a55355bc7a5.js:1
117-64672ff83c30bf20.js:1 Error fetching users: ApiError: Failed to GET /admin/users
    at o (698-a28b7a55355bc7a5.js:1:8592)
    at async page-9918b804e68c9eef.js:1:8102
window.console.error @ 117-64672ff83c30bf20.js:1
(anonymous) @ page-9918b804e68c9eef.js:1
/api/admin/users:1  Failed to load resource: the server responded with a status of 404 (Not Found)
117-64672ff83c30bf20.js:1 Client API Error on /admin/users: 404 Object
window.console.error @ 117-64672ff83c30bf20.js:1
117-64672ff83c30bf20.js:1 Error creating user: ApiError: Failed to POST /admin/users
    at o (698-a28b7a55355bc7a5.js:1:8592)
    at async B (page-9918b804e68c9eef.js:1:8733)
window.console.error @ 117-64672ff83c30bf20.js:1




the logs from the live website
INFO:     172.23.0.4:44040 - "GET /dashboard/kpis HTTP/1.1" 200 OK
INFO:     172.23.0.4:44040 - "GET /bookings/recent HTTP/1.1" 200 OK
INFO:     172.23.0.4:44050 - "GET /tickets/recent HTTP/1.1" 200 OK
ERROR:app.error_handlers:HTTP Exception: status=404, detail=Not Found
INFO:     172.23.0.4:44040 - "GET /admin/users HTTP/1.1" 404 Not Found
ERROR:app.error_handlers:HTTP Exception: status=404, detail=Not Found
INFO:     172.23.0.4:36100 - "GET /admin/users HTTP/1.1" 404 Not Found
^C
[Omar_achraf@ip-172-31-44-98 ~]$ docker logs -f agentic_portal_frontend --tail 100
  ▲ Next.js 14.2.33
  - Local:        http://localhost:3001
  - Network:      http://0.0.0.0:3001

 ✓ Starting...
 ✓ Ready in 196ms
^C
[Omar_achraf@ip-172-31-44-98 ~]$