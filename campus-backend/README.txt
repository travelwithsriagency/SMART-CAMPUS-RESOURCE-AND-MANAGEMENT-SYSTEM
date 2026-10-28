SMART CAMPUS C BACKEND (HTTP JSON API)

FILES
- server.c         : the backend server for the React frontend (port 8080)
- main_console.c   : your original console program, unchanged
- README.txt       : this guide

BUILD AND RUN
Windows (MinGW GCC):
    cd campus-backend
    gcc -std=c11 -Wall -Wextra server.c -o campus_server.exe -lws2_32
    campus_server.exe

Linux/macOS:
    cd campus-backend
    gcc -std=c11 -Wall -Wextra server.c -o campus_server
    ./campus_server

Leave the backend terminal open. In a second terminal, start the React
frontend from the project root:
    npm install
    npm run dev

Open http://localhost:5173. Vite forwards /api requests to the C backend at
http://localhost:8080, so the frontend and API work through one browser origin.

API ENDPOINTS
GET    /api/health                  server status and counts
GET    /api/locations               campus locations and weighted edges
GET    /api/route?from=0&to=5       shortest path (Dijkstra)
GET    /api/traverse?algorithm=bfs&from=0
                                     BFS or DFS traversal from a location id
GET    /api/resources               list resources
POST   /api/resources               add: {"name","category","location","total"}
PUT    /api/resources/{id}          edit resource fields
POST   /api/resources/{id}/use      mark one unit used (restocks when none left)
DELETE /api/resources/{id}          delete a resource
GET    /api/queue                   students waiting (FIFO order)
POST   /api/queue                   join queue: {"name","service"}
POST   /api/queue/serve             serve the next student

QUICK TEST (Windows PowerShell or Command Prompt)
    curl http://localhost:8080/api/health
    curl "http://localhost:8080/api/route?from=0&to=5"

DATA STRUCTURES USED
- Resources: array-based List ADT (add, search, delete by shifting)
- Student queue: circular array queue (FIFO)
- Campus network: adjacency matrix with Dijkstra shortest path
- Campus traversal: BFS queue and DFS stack over the adjacency matrix
- Location ids are 0..5 (see /api/locations)

NOTES
- Data is held in memory and resets when the server restarts. MongoDB
  or file-backed persistence is not implemented.
- The frontend loads inventory, queue, and location data from these API
  endpoints. Resource and queue actions are persisted in the backend's
  in-memory state, and route calculations use its Dijkstra implementation.
- Location ids and weights match the frontend's campus map.
- Seed inventory, queue records, and graph locations are illustrative
  demonstration data, not verified MIT operational data or walking routes.
- The task board starts with illustrative campus operations tasks and saves
  task changes in the current browser's local storage. Tasks are not shared
  with the backend or other browsers.
- Resource and queue seed records are sample data; backend changes reset
  when the server restarts.
- Resource names are unique without regard to case. Resource totals must be
  between 1 and 10000; edits cannot reduce stock below units currently in use.
