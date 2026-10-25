import { useEffect, useState } from "react";
import "./style.css";

const initialLocations = [
  { id: 0, name: "Main Gate", x: 10, y: 49 },
  { id: 1, name: "Main Block", x: 34, y: 27 },
  { id: 2, name: "Library", x: 34, y: 73 },
  { id: 3, name: "Department Block", x: 60, y: 27 },
  { id: 4, name: "Computer Lab", x: 60, y: 73 },
  { id: 5, name: "Cafeteria", x: 87, y: 49 },
];

const initialEdges = [
  [0, 1, 4], [0, 2, 3], [1, 2, 2], [1, 3, 3],
  [2, 4, 4], [3, 4, 2], [3, 5, 5], [4, 5, 3],
];

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: options.body
        ? { "Content-Type": "application/json", ...options.headers }
        : options.headers,
    });
  } catch {
    throw new Error("Cannot reach the backend. Start the C server and try again.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The backend returned an invalid response.");
  }
  if (!response.ok) {
    throw new Error(data.error || `Backend request failed (${response.status}).`);
  }
  return data;
}

const navGroups = [
  {
    title: "CAMPUS",
    items: [
      ["Overview", "▦"],
      ["Resources", "▤"],
      ["Navigation", "⌖"],
      ["Student Queue", "⇄"],
    ],
  },
  {
    title: "ALGORITHMS",
    items: [
      ["DSA Explorer", "⌘"],
      ["Activity Log", "◷"],
    ],
  },
];

export default function App() {
  const [page, setPage] = useState("Overview");
  const [resources, setResources] = useState([]);
  const [queue, setQueue] = useState([]);
  const [locations, setLocations] = useState(initialLocations);
  const [edges, setEdges] = useState(initialEdges);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [apiStatus, setApiStatus] = useState("Connecting…");
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(5);
  const [route, setRoute] = useState(null);
  const [newStudent, setNewStudent] = useState("");
  const [newService, setNewService] = useState("Library Help Desk");
  const [newResource, setNewResource] = useState("");
  const [resourceCategory, setResourceCategory] = useState("Equipment");
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [logs, setLogs] = useState([
    "Campus dashboard initialized",
  ]);

  const available = resources.reduce((sum, item) => sum + item.available, 0);
  const total = resources.reduce((sum, item) => sum + item.total, 0);

  const filteredResources = resources.filter((item) =>
    `${item.name} ${item.category} ${item.location}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function logActivity(message) {
    setLogs((old) => [
      `${new Date().toLocaleTimeString()} — ${message}`,
      ...old,
    ].slice(0, 12));
    setNotice(message);
  }

  async function checkBackend() {
    setApiStatus("Connecting…");
    try {
      const [health, resourceData, queueData, campusData] = await Promise.all([
        apiRequest("/api/health"),
        apiRequest("/api/resources"),
        apiRequest("/api/queue"),
        apiRequest("/api/locations"),
      ]);
      setResources(resourceData);
      setQueue(queueData);
      setLocations(campusData.locations.map((location, index) => ({
        ...location,
        x: initialLocations[index]?.x ?? 50,
        y: initialLocations[index]?.y ?? 50,
      })));
      setEdges(campusData.edges.map(({ from: start, to: end, weight }) => [start, end, weight]));
      setApiStatus(health.status || "Connected");
      logActivity("Backend health check successful");
    } catch (error) {
      setApiStatus("Unavailable");
      setNotice(error.message);
    }
  }

  useEffect(() => {
    checkBackend();
  }, []);

  useEffect(() => {
    if (apiStatus !== "Connected") return undefined;
    let cancelled = false;

    apiRequest(`/api/route?from=${from}&to=${to}`)
      .then((data) => {
        if (!cancelled) setRoute(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setRoute(null);
          setNotice(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiStatus, from, to]);

  async function addStudent(event) {
    event.preventDefault();
    if (!newStudent.trim()) return;
    try {
      const entry = await apiRequest("/api/queue", {
        method: "POST",
        body: JSON.stringify({ name: newStudent.trim(), service: newService }),
      });
      setQueue((old) => [...old, entry]);
      setNewStudent("");
      logActivity(`${entry.name} added to the service queue`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function serveNext() {
    if (!queue.length) {
      setNotice("The queue is already empty.");
      return;
    }
    try {
      const result = await apiRequest("/api/queue/serve", { method: "POST" });
      setQueue((old) => old.filter((student) => student.id !== result.served.id));
      logActivity(`${result.served.name} served at ${result.served.service}`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function addResource(event) {
    event.preventDefault();
    if (!newResource.trim()) return;
    try {
      const entry = await apiRequest("/api/resources", {
        method: "POST",
        body: JSON.stringify({
          name: newResource.trim(),
          category: resourceCategory,
          location: "Not assigned",
          total: 1,
        }),
      });
      setResources((old) => [...old, entry]);
      setNewResource("");
      setShowResourceForm(false);
      logActivity(`Resource added: ${entry.name}`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function toggleAvailability(id) {
    try {
      const updated = await apiRequest(`/api/resources/${id}/use`, { method: "POST" });
      setResources((old) => old.map((item) => item.id === id ? updated : item));
      logActivity(`Resource availability updated: ${updated.name}`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="brand-name">MIT CAMPUS</div>
            <div className="brand-caption">OPERATIONS PORTAL</div>
          </div>
        </div>

        <div className="campus-label">UNIVERSITY MANAGEMENT</div>

        {navGroups.map((group) => (
          <div className="nav-group" key={group.title}>
            <div className="nav-heading">{group.title}</div>
            {group.items.map(([label, icon]) => (
              <button
                key={label}
                className={`nav-item ${page === label ? "active" : ""}`}
                onClick={() => {
                  setPage(label);
                  setNotice("");
                }}
              >
                <span className="nav-icon">{icon}</span>
                <span>{label}</span>
                {label === "Student Queue" && (
                  <span className="nav-count">{queue.length}</span>
                )}
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <div>
            <div className="sidebar-status">Local workspace</div>
            <div className="sidebar-small">No cloud account required</div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>MIT Smart Campus</span>
            <span className="crumb-divider">/</span>
            <strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="environment-pill">
              <span className="small-dot" />
              {apiStatus}
            </span>
            <button className="button button-secondary button-small" onClick={checkBackend}>
              ↻ Check backend
            </button>
            <div className="avatar">MC</div>
          </div>
        </header>

        <section className="page-body">
          <div className="page-heading">
            <div>
              <div className="eyebrow">MIT · ANNA UNIVERSITY · CHENNAI</div>
              <h1>{page === "Overview" ? "Campus overview" : page}</h1>
              <p>
                {page === "Overview"
                  ? "A unified view of campus resources, student services and operations."
                  : `Manage and explore ${page.toLowerCase()} in the campus system.`}
              </p>
            </div>
            <div className="date-label">
              <span>LOCAL WORKSPACE</span>
              <strong>{new Date().toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric"
              })}</strong>
            </div>
          </div>

          {notice && (
            <div className="notice">
              <span>{notice}</span>
              <button onClick={() => setNotice("")} aria-label="Dismiss">×</button>
            </div>
          )}

          {page === "Overview" && (
            <>
              <div className="metric-grid">
                <Metric label="Registered resources" value={resources.length} detail="Tracked records" icon="▤" />
                <Metric label="Available units" value={`${available}/${total}`} detail="Across all resource types" icon="✓" />
                <Metric label="Waiting students" value={queue.length} detail="Active service queue" icon="⇄" />
                <Metric label="Campus locations" value={locations.length} detail="Illustrative network nodes" icon="⌖" />
              </div>

              <div className="section-grid overview-grid">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Campus network</h2>
                      <p>Connected locations · Weighted graph</p>
                    </div>
                    <button className="text-button" onClick={() => setPage("Navigation")}>Explore routes ↗</button>
                  </div>
                  <CampusMap locations={locations} edges={edges} />
                  <div className="map-legend">
                    <span><i className="legend-node" /> Campus location</span>
                    <span><i className="legend-line" /> Connected path</span>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Service queue</h2>
                      <p>First-in, first-out processing</p>
                    </div>
                    <button className="text-button" onClick={() => setPage("Student Queue")}>View all ↗</button>
                  </div>
                  {queue.length ? (
                    <div className="queue-preview">
                      {queue.slice(0, 4).map((student, index) => (
                        <div className="queue-row" key={student.id}>
                          <div className="queue-number">{index + 1}</div>
                          <div className="queue-info">
                            <strong>{student.name}</strong>
                            <span>{student.service}</span>
                          </div>
                          <span className="priority normal">Waiting</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty text="No students waiting." />
                  )}
                  <button className="button button-primary full-button" onClick={() => setPage("Student Queue")}>
                    Manage service queue
                  </button>
                </section>
              </div>

              <section className="panel resource-panel">
                <div className="panel-header">
                  <div>
                    <h2>Resource availability</h2>
                    <p>Campus inventory from the backend</p>
                  </div>
                  <button className="text-button" onClick={() => setPage("Resources")}>Manage resources ↗</button>
                </div>
                <ResourceTable resources={resources.slice(0, 4)} onToggle={toggleAvailability} />
              </section>
            </>
          )}

          {page === "Resources" && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Resource inventory</h2>
                  <p>Review, search and update demonstration records.</p>
                </div>
                <button className="button button-primary" onClick={() => setShowResourceForm(!showResourceForm)}>
                  + Add resource
                </button>
              </div>
              {showResourceForm && (
                <form className="inline-form" onSubmit={addResource}>
                  <input required value={newResource} onChange={(e) => setNewResource(e.target.value)} placeholder="Resource name" />
                  <select value={resourceCategory} onChange={(e) => setResourceCategory(e.target.value)}>
                    <option>Equipment</option>
                    <option>Laboratory</option>
                    <option>Classroom</option>
                    <option>Study Space</option>
                  </select>
                  <button className="button button-primary" type="submit">Save resource</button>
                </form>
              )}
              <div className="search-box">
                <span>⌕</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources, categories or locations..." />
              </div>
              <ResourceTable resources={filteredResources} onToggle={toggleAvailability} />
            </section>
          )}

          {page === "Navigation" && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Campus route planner</h2>
                  <p>Dijkstra's shortest-path algorithm · Non-negative edge weights</p>
                </div>
                <span className="algorithm-tag">DIJKSTRA</span>
              </div>
              <CampusMap locations={locations} edges={edges} activePath={route?.path || []} />
              <div className="route-controls">
                <label>
                  Starting location
                  <select value={from} onChange={(e) => setFrom(Number(e.target.value))}>
                    {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </label>
                <label>
                  Destination
                  <select value={to} onChange={(e) => setTo(Number(e.target.value))}>
                    {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </label>
              </div>
              {route ? (
                <div className="route-result">
                  <div className="route-result-title">Shortest route calculated</div>
                  <div className="route-steps">
                    {route.path.map((id, index) => (
                      <span key={id}>
                        <strong>{locations[id].name}</strong>
                        {index < route.path.length - 1 && <i>→</i>}
                      </span>
                    ))}
                  </div>
                  <div className="route-distance">
                    <span>Total edge weight</span>
                    <strong>{route.distance} units</strong>
                  </div>
                </div>
              ) : <Empty text={apiStatus === "Connected" ? "No route found between these locations." : "Connect to the backend to calculate a route."} />}
              <p className="footnote">Routes are calculated by the C backend using Dijkstra's algorithm. The campus map is illustrative and may not reflect official MIT campus paths.</p>
            </section>
          )}

          {page === "Student Queue" && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Student service queue</h2>
                  <p>FIFO queue · The first student added is served first.</p>
                </div>
                <span className="algorithm-tag">QUEUE / FIFO</span>
              </div>
              <form className="queue-form" onSubmit={addStudent}>
                <label>
                  Student name or ID
                  <input value={newStudent} onChange={(e) => setNewStudent(e.target.value)} placeholder="e.g. Student 004" required />
                </label>
                <label>
                  Service desk
                  <select value={newService} onChange={(e) => setNewService(e.target.value)}>
                    <option>Library Help Desk</option>
                    <option>Administrative Office</option>
                    <option>Laboratory Support</option>
                    <option>Student Services</option>
                  </select>
                </label>
                <button className="button button-primary" type="submit">+ Join queue</button>
              </form>
              <div className="queue-toolbar">
                <span>{queue.length} student{queue.length !== 1 ? "s" : ""} waiting</span>
                <button className="button button-secondary" onClick={serveNext} disabled={!queue.length}>Serve next student →</button>
              </div>
              {queue.length ? (
                <div className="queue-list">
                  {queue.map((student, index) => (
                    <div className="queue-row" key={student.id}>
                      <div className="queue-number">{index + 1}</div>
                      <div className="queue-info">
                        <strong>{student.name}</strong>
                        <span>{student.service}</span>
                      </div>
                      <span className="priority normal">Waiting</span>
                    </div>
                  ))}
                </div>
              ) : <Empty text="The queue is empty. Add a student to begin." />}
            </section>
          )}

          {page === "DSA Explorer" && (
            <div className="algorithm-grid">
              {[
                ["Dijkstra's algorithm", "Weighted graphs", "Find a minimum-cost path between campus locations.", "Navigation"],
                ["Breadth-first search", "Queue + graph", "Explore connected locations level by level.", "Navigation"],
                ["First-in, first-out", "Queue", "Process student service requests in arrival order.", "Student Queue"],
                ["Linear search", "Array / list", "Find a resource by its name or category.", "Resources"],
                ["Resource status", "Array of records", "Inspect resource availability and update units.", "Resources"],
                ["Activity history", "List", "Review the most recent actions in this session.", "Activity Log"],
              ].map(([title, type, desc, target]) => (
                <button className="algorithm-card" key={title} onClick={() => setPage(target)}>
                  <span className="algorithm-tag">{type}</span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <span className="card-link">Open demonstration ↗</span>
                </button>
              ))}
            </div>
          )}

          {page === "Activity Log" && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Recent activity</h2>
                  <p>Actions recorded during this browser session.</p>
                </div>
                <button className="button button-secondary" onClick={() => setLogs([])}>Clear log</button>
              </div>
              {logs.length ? logs.map((log, i) => (
                <div className="activity-row" key={`${log}-${i}`}>
                  <span className="activity-dot" />
                  <span>{log}</span>
                </div>
              )) : <Empty text="No activity recorded yet." />}
            </section>
          )}

          <footer className="footer">
            <span>MIT SMART CAMPUS</span>
            <span>Academic demonstration · Sample data only</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, detail, icon }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}

function ResourceTable({ resources, onToggle }) {
  if (!resources.length) return <Empty text="No matching resources found." />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>RESOURCE</th>
            <th>CATEGORY</th>
            <th>LOCATION</th>
            <th>AVAILABILITY</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="resource-name">{item.name}</div>
                <div className="resource-id">ID: {item.id}</div>
              </td>
              <td>{item.category}</td>
              <td>{item.location}</td>
              <td>
                <div className="availability-cell">
                  <div className="availability-track">
                    <div style={{ width: `${item.total ? item.available / item.total * 100 : 0}%` }} />
                  </div>
                  <span>{item.available}/{item.total}</span>
                </div>
              </td>
              <td>
                <button className="table-action" onClick={() => onToggle(item.id)}>
                  {item.available > 0 ? "Mark used" : "Restock"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CampusMap({ locations, edges, activePath = [] }) {
  const isActive = (id) => activePath.includes(id);
  return (
    <div className="campus-map">
      <div className="map-watermark">ILLUSTRATIVE CAMPUS NETWORK</div>
      <svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Campus network connections">
        {edges.map(([a, b, weight]) => {
          const p1 = locations[a];
          const p2 = locations[b];
          const highlighted = activePath.includes(a) && activePath.includes(b) &&
            Math.abs(activePath.indexOf(a) - activePath.indexOf(b)) === 1;
          return (
            <g key={`${a}-${b}`}>
              <line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={highlighted ? "#0c9488" : "#cbd5e1"}
                strokeWidth={highlighted ? "0.7" : "0.35"}
                strokeDasharray={highlighted ? "0" : "1.5 1.5"}
              />
              <text
                x={(p1.x + p2.x) / 2}
                y={(p1.y + p2.y) / 2 - 2}
                fontSize="3"
                fill="#64748b"
                textAnchor="middle"
              >{weight}</text>
            </g>
          );
        })}
      </svg>
      {locations.map((loc) => (
        <div
          className={`map-node ${isActive(loc.id) ? "selected" : ""}`}
          key={loc.id}
          style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
        >
          <span className="node-point" />
          <span className="node-label">{loc.name}</span>
        </div>
      ))}
    </div>
  );
}

function Empty({ text }) {
  return <div className="empty-state"><span>—</span><p>{text}</p></div>;
}
