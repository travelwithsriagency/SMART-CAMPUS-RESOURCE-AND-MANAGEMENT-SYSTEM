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

FIREBASE SETUP (REQUIRED FOR CAMPUS DATA)
1. In Firebase Console, add a Web app to your existing project and create
   or enable a Cloud Firestore database.
2. Enable Authentication > Sign-in method > Email/Password. Create user
   accounts in Authentication > Users; this app intentionally has no public
   sign-up form.
3. Copy the root .env.example file to .env and fill in the Web App values from
   Project settings > Your apps. Restart the Vite server after editing .env.
   The Web App config is intended for browser use; never use a service-account
   key in the frontend.
4. Publish the contents of the root firestore.rules file in Firestore
   Database > Rules. The checked-in rules allow access only to
   sridhar.govindan2008@gmail.com. Update the email allowlist in the rules
   before adding another campus account.
5. Sign in with an account created in the Firebase Console. Add resource,
   student, queue, and task records in the app; Firestore collections start
   empty and the old in-memory C demo data is not automatically migrated.

The app stores shared resources, students, queue entries, and tasks in
Firestore. The C backend is still used by the DSA Explorer for traversal;
the other campus data features no longer depend on its in-memory data.

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
GET    /api/students                list student directory records
POST   /api/students                register: {"rollNumber","name","department","year","email"}
DELETE /api/students/{id}           remove a student directory record
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
- Location ids are 0..11 (see /api/locations)

NOTES
- The C backend's data structures are in memory and reset when it restarts.
  The React app now uses Firestore for shared campus records.
- The frontend stores resources, students, queue entries, and tasks in
  Firebase Firestore. The C server remains necessary for DSA traversal.
- The Navigation page uses mapped campus places and OpenStreetMap tiles;
  pedestrian directions are requested from the public Valhalla routing
  service. This map works without the local C backend but requires internet
  access. OpenStreetMap coverage can be incomplete, so verify directions
  on campus.
- GitHub Pages can serve the site either from the built Actions artifact or
  from the repository root. If using the legacy main-branch source, run
  `npm run build:legacy` and commit the generated `dist` folder along with
  frontend changes so the root-page loader can find the compiled bundle.
- GET /api/route remains a Dijkstra example over the illustrative graph.
  It is not the Navigation page's walking route and its distances are not
  real campus walking distances.
- Seed inventory, queue records, and graph locations are illustrative
  demonstration data, not verified MIT operational data.
- Campus locations and resource/queue seed records in the C server are
  illustrative demonstration data. They are no longer used for shared
  inventory, student directory, queue, or task data in the Firebase-backed app.
- Resource names are unique without regard to case. Resource totals must be
  between 1 and 10000; edits cannot reduce stock below units currently in use.
