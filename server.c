/*
 SMART CAMPUS BACKEND - C HTTP JSON API
 Data Structures Project in C

 Serves the React frontend on http://localhost:8080
 Reuses the project's data structures:
   - Resources: array-based List ADT
   - Student queue: circular array queue (FIFO)
   - Campus navigation: adjacency matrix + Dijkstra shortest path

 Windows (MinGW):  gcc -std=c11 -Wall -Wextra server.c -o campus_server.exe -lws2_32
                   campus_server.exe
 Linux/macOS:      gcc -std=c11 -Wall -Wextra server.c -o campus_server
                   ./campus_server
*/

#ifdef _WIN32
  #define _CRT_SECURE_NO_WARNINGS
  #include <winsock2.h>
  #include <ws2tcpip.h>
  typedef SOCKET sock_t;
  #define CLOSESOCK closesocket
#else
  #include <sys/types.h>
  #include <sys/socket.h>
  #include <netinet/in.h>
  #include <unistd.h>
  typedef int sock_t;
  #define CLOSESOCK close
  #ifndef INVALID_SOCKET
    #define INVALID_SOCKET (-1)
  #endif
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdarg.h>

#define PORT           8080
#define MAX_RESOURCES  100
#define MAX_QUEUE      100
#define MAX_LOCATIONS  6
#define NAME_LEN       64
#define REQ_SIZE       16384
#define OUT_SIZE       65536
#define INF            1000000000

/* ---------- Data types ---------- */

typedef struct {
    int id;
    char name[NAME_LEN];
    char category[NAME_LEN];
    char location[NAME_LEN];
    int total;
    int available;
} Resource;

typedef struct {
    int id;
    char name[NAME_LEN];
    char service[NAME_LEN];
} Student;

typedef struct {
    char method[16];
    char path[256];
    char query[256];
    char body[REQ_SIZE];
} Request;

typedef struct {
    char data[OUT_SIZE];
    size_t len;
} Out;

/* ---------- Global state (kept in memory) ---------- */

/* List ADT: array of resource records */
static Resource resources[MAX_RESOURCES];
static int resourceCount = 0;
static int nextResourceId = 101;

/* Circular queue: students waiting for campus services */
static Student studentQueue[MAX_QUEUE];
static int queueHead = 0;
static int queueCount = 0;
static int nextStudentId = 1;

/* Campus network: weighted undirected graph as adjacency matrix (0 = no edge) */
static const char *locationNames[MAX_LOCATIONS] = {
    "Main Gate", "Main Block", "Library", "Department Block", "Computer Lab", "Cafeteria"
};
static const int edgeList[][3] = {
    {0, 1, 4}, {0, 2, 3}, {1, 2, 2}, {1, 3, 3},
    {2, 4, 4}, {3, 4, 2}, {3, 5, 5}, {4, 5, 3}
};
#define EDGE_COUNT (int)(sizeof(edgeList) / sizeof(edgeList[0]))
static int graph[MAX_LOCATIONS][MAX_LOCATIONS];

/* ---------- Small helpers ---------- */

static void copyStr(char *dst, const char *src, size_t cap) {
    size_t n = strlen(src);
    if (n >= cap) n = cap - 1;
    memcpy(dst, src, n);
    dst[n] = '\0';
}

static int startsWithIgnoreCase(const char *s, const char *prefix) {
    while (*prefix) {
        if (tolower((unsigned char)*s) != tolower((unsigned char)*prefix)) return 0;
        s++;
        prefix++;
    }
    return 1;
}

static void outChar(Out *o, char c) {
    if (o->len < OUT_SIZE - 1) {
        o->data[o->len++] = c;
        o->data[o->len] = '\0';
    }
}

static void outStr(Out *o, const char *s) {
    while (*s) outChar(o, *s++);
}

static void outFmt(Out *o, const char *fmt, ...) {
    char tmp[512];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(tmp, sizeof tmp, fmt, ap);
    va_end(ap);
    outStr(o, tmp);
}

/* Writes a JSON string literal, escaping quotes and backslashes */
static void outJsonString(Out *o, const char *s) {
    outChar(o, '"');
    for (; *s; s++) {
        unsigned char c = (unsigned char)*s;
        if (c == '"' || c == '\\') {
            outChar(o, '\\');
            outChar(o, (char)c);
        } else if (c < 0x20) {
            outChar(o, ' ');
        } else {
            outChar(o, (char)c);
        }
    }
    outChar(o, '"');
}

static void writeError(Out *o, const char *message) {
    outStr(o, "{\"error\":");
    outJsonString(o, message);
    outChar(o, '}');
}

/* ---------- Minimal JSON field readers (flat objects only) ---------- */

static int jsonString(const char *json, const char *key, char *out, size_t cap) {
    char pattern[80];
    snprintf(pattern, sizeof pattern, "\"%s\"", key);
    const char *p = strstr(json, pattern);
    if (!p) return 0;
    p += strlen(pattern);
    while (isspace((unsigned char)*p)) p++;
    if (*p != ':') return 0;
    p++;
    while (isspace((unsigned char)*p)) p++;
    if (*p != '"') return 0;
    p++;
    size_t n = 0;
    while (*p && *p != '"') {
        char c = *p;
        if (c == '\\' && p[1]) {
            p++;
            c = *p;
        }
        if (n + 1 < cap) out[n++] = c;
        p++;
    }
    out[n] = '\0';
    return 1;
}

static int jsonInt(const char *json, const char *key, int *value) {
    char pattern[80];
    snprintf(pattern, sizeof pattern, "\"%s\"", key);
    const char *p = strstr(json, pattern);
    if (!p) return 0;
    p += strlen(pattern);
    while (isspace((unsigned char)*p)) p++;
    if (*p != ':') return 0;
    p++;
    while (isspace((unsigned char)*p)) p++;
    char *end;
    long v = strtol(p, &end, 10);
    if (end == p) return 0;
    *value = (int)v;
    return 1;
}

/* Reads an integer from a query string such as "from=0&to=5" */
static int queryInt(const char *query, const char *key, int *value) {
    size_t klen = strlen(key);
    const char *p = query;
    while (*p) {
        if (strncmp(p, key, klen) == 0 && p[klen] == '=') {
            char *end;
            long v = strtol(p + klen + 1, &end, 10);
            if (end == p + klen + 1) return 0;
            *value = (int)v;
            return 1;
        }
        const char *amp = strchr(p, '&');
        if (!amp) break;
        p = amp + 1;
    }
    return 0;
}

/* ---------- HTTP request reading and response writing ---------- */

static int findContentLength(const char *raw) {
    const char *p = strstr(raw, "\r\n");
    while (p && p[0] == '\r' && p[1] == '\n') {
        const char *line = p + 2;
        if (line[0] == '\0' || (line[0] == '\r' && line[1] == '\n')) break; /* end of headers */
        if (startsWithIgnoreCase(line, "content-length:")) return atoi(line + 15);
        p = strstr(line, "\r\n");
    }
    return 0;
}

static int readRequest(sock_t s, Request *req) {
    static char raw[REQ_SIZE];
    int total = 0, headerEnd = -1, contentLength = 0;

    while (total < REQ_SIZE - 1) {
        int n = recv(s, raw + total, REQ_SIZE - 1 - total, 0);
        if (n <= 0) break;
        total += n;
        raw[total] = '\0';
        if (headerEnd < 0) {
            char *p = strstr(raw, "\r\n\r\n");
            if (p) {
                headerEnd = (int)(p - raw) + 4;
                contentLength = findContentLength(raw);
            }
        }
        if (headerEnd >= 0 && total >= headerEnd + contentLength) break;
    }
    if (headerEnd < 0) return 0;

    char target[512] = "";
    if (sscanf(raw, "%15s %511s", req->method, target) != 2) return 0;

    char *q = strchr(target, '?');
    if (q) {
        copyStr(req->query, q + 1, sizeof req->query);
        *q = '\0';
    } else {
        req->query[0] = '\0';
    }
    copyStr(req->path, target, sizeof req->path);

    int available = total - headerEnd;
    if (available < 0) available = 0;
    if (contentLength < available) available = contentLength;
    if (available > REQ_SIZE - 1) available = REQ_SIZE - 1;
    memcpy(req->body, raw + headerEnd, (size_t)available);
    req->body[available] = '\0';
    return 1;
}

static const char *statusText(int status) {
    switch (status) {
        case 200: return "OK";
        case 201: return "Created";
        case 204: return "No Content";
        case 400: return "Bad Request";
        case 404: return "Not Found";
        case 405: return "Method Not Allowed";
        case 409: return "Conflict";
        default:  return "Internal Server Error";
    }
}

static void sendAll(sock_t s, const char *data, size_t len) {
#ifdef MSG_NOSIGNAL
    int flags = MSG_NOSIGNAL;
#else
    int flags = 0;
#endif
    while (len > 0) {
        int n = send(s, data, (int)len, flags);
        if (n <= 0) return;
        data += n;
        len -= (size_t)n;
    }
}

static void sendResponse(sock_t s, int status, const char *body, size_t bodyLen) {
    char header[512];
    int hl = snprintf(header, sizeof header,
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: application/json; charset=utf-8\r\n"
        "Content-Length: %lu\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
        "Connection: close\r\n"
        "\r\n",
        status, statusText(status), (unsigned long)bodyLen);
    sendAll(s, header, (size_t)hl);
    sendAll(s, body, bodyLen);
}

/* ---------- JSON writers for records ---------- */

static void writeResource(Out *o, const Resource *r) {
    outFmt(o, "{\"id\":%d,\"name\":", r->id);
    outJsonString(o, r->name);
    outStr(o, ",\"category\":");
    outJsonString(o, r->category);
    outStr(o, ",\"location\":");
    outJsonString(o, r->location);
    outFmt(o, ",\"total\":%d,\"available\":%d}", r->total, r->available);
}

static void writeStudent(Out *o, const Student *s, int position) {
    outChar(o, '{');
    if (position > 0) outFmt(o, "\"position\":%d,", position);
    outFmt(o, "\"id\":%d,\"name\":", s->id);
    outJsonString(o, s->name);
    outStr(o, ",\"service\":");
    outJsonString(o, s->service);
    outChar(o, '}');
}

/* ---------- Resource endpoints (List ADT) ---------- */

static int findResource(int id) {
    for (int i = 0; i < resourceCount; i++) {
        if (resources[i].id == id) return i;
    }
    return -1;
}

static void addSeedResource(const char *name, const char *category, const char *location,
                            int total, int available) {
    Resource *r = &resources[resourceCount++];
    r->id = nextResourceId++;
    copyStr(r->name, name, NAME_LEN);
    copyStr(r->category, category, NAME_LEN);
    copyStr(r->location, location, NAME_LEN);
    r->total = total;
    r->available = available;
}

static int handleListResources(Out *o) {
    outChar(o, '[');
    for (int i = 0; i < resourceCount; i++) {
        if (i) outChar(o, ',');
        writeResource(o, &resources[i]);
    }
    outChar(o, ']');
    return 200;
}

static int handleAddResource(const char *body, Out *o) {
    char name[NAME_LEN] = "";
    char category[NAME_LEN] = "Equipment";
    char location[NAME_LEN] = "Not assigned";
    int total = 1;

    if (!jsonString(body, "name", name, sizeof name) || name[0] == '\0') {
        writeError(o, "Resource name is required");
        return 400;
    }
    jsonString(body, "category", category, sizeof category);
    jsonString(body, "location", location, sizeof location);
    if (!jsonInt(body, "total", &total) || total < 1) total = 1;
    if (category[0] == '\0') copyStr(category, "Equipment", sizeof category);
    if (location[0] == '\0') copyStr(location, "Not assigned", sizeof location);

    if (resourceCount >= MAX_RESOURCES) {
        writeError(o, "Resource list is full");
        return 409;
    }

    Resource *r = &resources[resourceCount++];
    r->id = nextResourceId++;
    copyStr(r->name, name, NAME_LEN);
    copyStr(r->category, category, NAME_LEN);
    copyStr(r->location, location, NAME_LEN);
    r->total = total;
    r->available = total;
    writeResource(o, r);
    return 201;
}

/* Mirrors the frontend's "Mark used" / "Restock" button */
static int handleUseResource(int id, Out *o) {
    int idx = findResource(id);
    if (idx < 0) {
        writeError(o, "Resource not found");
        return 404;
    }
    Resource *r = &resources[idx];
    if (r->available > 0) r->available--;
    else r->available = r->total;
    writeResource(o, r);
    return 200;
}

/* List ADT deletion: shift the remaining records left */
static int handleDeleteResource(int id, Out *o) {
    int idx = findResource(id);
    if (idx < 0) {
        writeError(o, "Resource not found");
        return 404;
    }
    for (int i = idx; i < resourceCount - 1; i++) resources[i] = resources[i + 1];
    resourceCount--;
    outFmt(o, "{\"deleted\":%d}", id);
    return 200;
}

/* ---------- Student queue endpoints (circular FIFO queue) ---------- */

static int handleListQueue(Out *o) {
    outChar(o, '[');
    for (int i = 0; i < queueCount; i++) {
        if (i) outChar(o, ',');
        writeStudent(o, &studentQueue[(queueHead + i) % MAX_QUEUE], i + 1);
    }
    outChar(o, ']');
    return 200;
}

static int handleEnqueue(const char *body, Out *o) {
    char name[NAME_LEN] = "";
    char service[NAME_LEN] = "Library Help Desk";

    if (!jsonString(body, "name", name, sizeof name) || name[0] == '\0') {
        writeError(o, "Student name is required");
        return 400;
    }
    jsonString(body, "service", service, sizeof service);
    if (service[0] == '\0') copyStr(service, "Library Help Desk", sizeof service);

    if (queueCount >= MAX_QUEUE) {
        writeError(o, "The queue is full");
        return 409;
    }

    Student *s = &studentQueue[(queueHead + queueCount) % MAX_QUEUE];
    s->id = nextStudentId++;
    copyStr(s->name, name, NAME_LEN);
    copyStr(s->service, service, NAME_LEN);
    queueCount++;
    writeStudent(o, s, queueCount);
    return 201;
}

static int handleServe(Out *o) {
    if (queueCount == 0) {
        writeError(o, "The queue is already empty");
        return 409;
    }
    Student served = studentQueue[queueHead];
    queueHead = (queueHead + 1) % MAX_QUEUE;
    queueCount--;
    outStr(o, "{\"served\":");
    writeStudent(o, &served, 0);
    outChar(o, '}');
    return 200;
}

/* ---------- Campus navigation (Dijkstra) ---------- */

static void buildGraph(void) {
    for (int i = 0; i < EDGE_COUNT; i++) {
        int a = edgeList[i][0], b = edgeList[i][1], w = edgeList[i][2];
        graph[a][b] = w;
        graph[b][a] = w;
    }
}

/* Returns the shortest distance, or -1 if unreachable. Fills path[] with vertex ids. */
static int shortestPath(int src, int dest, int path[], int *pathLen) {
    int dist[MAX_LOCATIONS], prev[MAX_LOCATIONS], used[MAX_LOCATIONS];
    for (int i = 0; i < MAX_LOCATIONS; i++) {
        dist[i] = INF;
        prev[i] = -1;
        used[i] = 0;
    }
    dist[src] = 0;

    for (int step = 0; step < MAX_LOCATIONS; step++) {
        int u = -1;
        for (int i = 0; i < MAX_LOCATIONS; i++) {
            if (!used[i] && dist[i] < INF && (u < 0 || dist[i] < dist[u])) u = i;
        }
        if (u < 0) break;
        used[u] = 1;
        for (int v = 0; v < MAX_LOCATIONS; v++) {
            if (graph[u][v] > 0 && dist[u] + graph[u][v] < dist[v]) {
                dist[v] = dist[u] + graph[u][v];
                prev[v] = u;
            }
        }
    }

    if (dist[dest] >= INF) return -1;

    int tmp[MAX_LOCATIONS], n = 0;
    for (int x = dest; x != -1; x = prev[x]) tmp[n++] = x;
    for (int i = 0; i < n; i++) path[i] = tmp[n - 1 - i];
    *pathLen = n;
    return dist[dest];
}

static int handleLocations(Out *o) {
    outStr(o, "{\"locations\":[");
    for (int i = 0; i < MAX_LOCATIONS; i++) {
        if (i) outChar(o, ',');
        outFmt(o, "{\"id\":%d,\"name\":", i);
        outJsonString(o, locationNames[i]);
        outChar(o, '}');
    }
    outStr(o, "],\"edges\":[");
    for (int i = 0; i < EDGE_COUNT; i++) {
        if (i) outChar(o, ',');
        outFmt(o, "{\"from\":%d,\"to\":%d,\"weight\":%d}",
               edgeList[i][0], edgeList[i][1], edgeList[i][2]);
    }
    outStr(o, "]}");
    return 200;
}

static int handleRoutePlan(const char *query, Out *o) {
    int from = -1, to = -1, path[MAX_LOCATIONS], pathLen = 0;
    if (!queryInt(query, "from", &from) || !queryInt(query, "to", &to) ||
        from < 0 || from >= MAX_LOCATIONS || to < 0 || to >= MAX_LOCATIONS) {
        writeError(o, "Provide from and to as location ids from 0 to 5");
        return 400;
    }

    int distance = shortestPath(from, to, path, &pathLen);
    if (distance < 0) {
        writeError(o, "No route found between these locations");
        return 404;
    }

    outFmt(o, "{\"from\":%d,\"to\":%d,\"distance\":%d,\"path\":[", from, to, distance);
    for (int i = 0; i < pathLen; i++) {
        if (i) outChar(o, ',');
        outFmt(o, "%d", path[i]);
    }
    outStr(o, "],\"names\":[");
    for (int i = 0; i < pathLen; i++) {
        if (i) outChar(o, ',');
        outJsonString(o, locationNames[path[i]]);
    }
    outStr(o, "]}");
    return 200;
}

/* ---------- Health and routing ---------- */

static int handleHealth(Out *o) {
    outFmt(o, "{\"status\":\"Connected\",\"service\":\"smart-campus-c-backend\","
              "\"resources\":%d,\"queueLength\":%d}", resourceCount, queueCount);
    return 200;
}

static int dispatch(const Request *req, Out *o) {
    const char *m = req->method;
    const char *p = req->path;

    if (strcmp(p, "/api/health") == 0 && strcmp(m, "GET") == 0) return handleHealth(o);
    if (strcmp(p, "/api/locations") == 0 && strcmp(m, "GET") == 0) return handleLocations(o);
    if (strcmp(p, "/api/route") == 0 && strcmp(m, "GET") == 0) return handleRoutePlan(req->query, o);

    if (strcmp(p, "/api/resources") == 0) {
        if (strcmp(m, "GET") == 0) return handleListResources(o);
        if (strcmp(m, "POST") == 0) return handleAddResource(req->body, o);
        writeError(o, "Method not allowed");
        return 405;
    }

    if (strncmp(p, "/api/resources/", 15) == 0) {
        char *end;
        long id = strtol(p + 15, &end, 10);
        if (end == p + 15) {
            writeError(o, "Invalid resource id");
            return 404;
        }
        if (*end == '\0' && strcmp(m, "DELETE") == 0) return handleDeleteResource((int)id, o);
        if (strcmp(end, "/use") == 0 && strcmp(m, "POST") == 0) return handleUseResource((int)id, o);
        writeError(o, "Not found");
        return 404;
    }

    if (strcmp(p, "/api/queue") == 0) {
        if (strcmp(m, "GET") == 0) return handleListQueue(o);
        if (strcmp(m, "POST") == 0) return handleEnqueue(req->body, o);
        writeError(o, "Method not allowed");
        return 405;
    }

    if (strcmp(p, "/api/queue/serve") == 0 && strcmp(m, "POST") == 0) return handleServe(o);

    writeError(o, "Not found");
    return 404;
}

static void handleClient(sock_t client) {
    static Request req;
    static Out out;
    int status;

    out.len = 0;
    out.data[0] = '\0';

    if (!readRequest(client, &req)) {
        writeError(&out, "Bad request");
        status = 400;
    } else if (strcmp(req.method, "OPTIONS") == 0) {
        /* CORS preflight from the browser */
        sendResponse(client, 204, "", 0);
        return;
    } else {
        status = dispatch(&req, &out);
    }
    sendResponse(client, status, out.data, out.len);
}

/* ---------- Startup ---------- */

static void seedData(void) {
    addSeedResource("Computer Laboratory", "Laboratory", "Academic Block", 4, 3);
    addSeedResource("Projector", "Equipment", "Lecture Hall A", 12, 8);
    addSeedResource("Seminar Hall", "Classroom", "Main Block", 3, 2);
    addSeedResource("Library Study Room", "Study Space", "Library", 8, 6);
    addSeedResource("Electronics Lab", "Laboratory", "Department Block", 2, 1);

    const char *students[][2] = {
        {"Student 001", "Library Help Desk"},
        {"Student 002", "Administrative Office"},
        {"Student 003", "Library Help Desk"},
    };
    for (int i = 0; i < 3; i++) {
        Student *s = &studentQueue[queueCount];
        s->id = nextStudentId++;
        copyStr(s->name, students[i][0], NAME_LEN);
        copyStr(s->service, students[i][1], NAME_LEN);
        queueCount++;
    }
}

int main(void) {
#ifdef _WIN32
    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) {
        fprintf(stderr, "WSAStartup failed.\n");
        return 1;
    }
#endif

    buildGraph();
    seedData();

    sock_t server = socket(AF_INET, SOCK_STREAM, 0);
    if (server == INVALID_SOCKET) {
        fprintf(stderr, "Could not create socket.\n");
        return 1;
    }

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof addr);
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(PORT);

    if (bind(server, (struct sockaddr *)&addr, sizeof addr) != 0) {
        fprintf(stderr, "Could not bind to port %d. Is another program using it?\n", PORT);
        CLOSESOCK(server);
        return 1;
    }
    if (listen(server, 10) != 0) {
        fprintf(stderr, "Could not listen on port %d.\n", PORT);
        CLOSESOCK(server);
        return 1;
    }

    printf("============================================\n");
    printf(" SMART CAMPUS C BACKEND\n");
    printf(" Listening on http://localhost:%d\n", PORT);
    printf(" Press Ctrl+C to stop.\n");
    printf("============================================\n");
    fflush(stdout);

    for (;;) {
        sock_t client = accept(server, NULL, NULL);
        if (client == INVALID_SOCKET) continue;
        handleClient(client);
        CLOSESOCK(client);
    }

    CLOSESOCK(server);
#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}
