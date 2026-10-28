import { useEffect, useState } from "react";
import "./style.css";

const initialLocations = [
  { id: 0, name: "Main Gate", x: 20, y: 52 },
  { id: 1, name: "Main Block", x: 31, y: 28 },
  { id: 2, name: "Library", x: 31, y: 76 },
  { id: 3, name: "Department Block", x: 52, y: 28 },
  { id: 4, name: "Computer Lab", x: 52, y: 76 },
  { id: 5, name: "Cafeteria", x: 80, y: 52 },
  { id: 6, name: "Lecture Hall A", x: 72, y: 20 },
  { id: 7, name: "Lecture Hall B", x: 80, y: 22 },
  { id: 8, name: "Student Centre", x: 72, y: 76 },
  { id: 9, name: "Administration Office", x: 20, y: 24 },
  { id: 10, name: "Biology Lab", x: 80, y: 78 },
  { id: 11, name: "Workshop", x: 20, y: 80 },
];

const initialEdges = [
  [0, 1, 4], [0, 2, 3], [1, 2, 2], [1, 3, 3], [2, 4, 4],
  [3, 4, 2], [3, 5, 5], [4, 5, 3], [1, 6, 2], [6, 7, 2],
  [7, 5, 3], [2, 8, 3], [8, 5, 2], [1, 9, 2], [9, 3, 2],
  [3, 10, 2], [10, 11, 3], [11, 4, 2], [8, 11, 4], [6, 9, 3],
];

const taskStatuses = ["To do", "In progress", "Done"];
const taskPriorities = ["High", "Medium", "Low"];

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

const initialTasks = [
  { id: "task-1", title: "Inspect lecture hall projectors", description: "Check focus, HDMI inputs and remote batteries before the next lecture block.", area: "Lecture Hall A", priority: "High", status: "In progress", dueDate: dateOffset(0), owner: "Facilities" },
  { id: "task-2", title: "Prepare the electronics lab", description: "Verify bench power supplies and return shared test equipment to storage.", area: "Department Block", priority: "High", status: "To do", dueDate: dateOffset(1), owner: "Lab team" },
  { id: "task-3", title: "Refresh library study rooms", description: "Review room readiness and update availability after the morning checks.", area: "Library", priority: "Medium", status: "To do", dueDate: dateOffset(2), owner: "Library team" },
  { id: "task-4", title: "Restock workshop safety kits", description: "Count first-aid and safety supplies in the student workshop.", area: "Workshop", priority: "Medium", status: "In progress", dueDate: dateOffset(3), owner: "Safety team" },
  { id: "task-5", title: "Review seminar hall setup", description: "Confirm seating layout, display connection and room signage.", area: "Main Block", priority: "Low", status: "Done", dueDate: dateOffset(-1), owner: "Events team" },
  { id: "task-6", title: "Update campus equipment register", description: "Reconcile AV equipment counts with the latest inventory check.", area: "Campus-wide", priority: "Low", status: "To do", dueDate: dateOffset(5), owner: "Operations" },
];

function loadTasks() {
  try {
    const savedTasks = window.localStorage.getItem("smart-campus-tasks");
    if (!savedTasks) return initialTasks;
    const parsedTasks = JSON.parse(savedTasks);
    if (Array.isArray(parsedTasks)) return parsedTasks;
    throw new Error("Saved campus tasks are not in the expected format.");
  } catch (error) {
    console.error("Could not load saved campus tasks.", error);
    return initialTasks;
  }
}

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
      ["Tasks", "✓"],
      ["Students", "♙"],
      ["Resources", "▤"],
      ["Navigation", "⌖"],
      ["Student Queue", "⇄"],
      ["Reports", "▥"],
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
  return <CampusDashboard />;
}

function CampusDashboard() {
  const [page, setPage] = useState("Overview");
  const [resources, setResources] = useState([]);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState(loadTasks);
  const [queue, setQueue] = useState([]);
  const [queueHistory, setQueueHistory] = useState([]);
  const [locations, setLocations] = useState(initialLocations);
  const [edges, setEdges] = useState(initialEdges);
  const [search, setSearch] = useState("");
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState("All categories");
  const [queueSearch, setQueueSearch] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  const [notice, setNotice] = useState("");
  const [apiStatus, setApiStatus] = useState("Connecting…");
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(5);
  const [route, setRoute] = useState(null);
  const [algorithm, setAlgorithm] = useState("bfs");
  const [algorithmStart, setAlgorithmStart] = useState(0);
  const [traversal, setTraversal] = useState(null);
  const [newStudent, setNewStudent] = useState("");
  const [newService, setNewService] = useState("Library Help Desk");
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [newRollNumber, setNewRollNumber] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newStudentYear, setNewStudentYear] = useState("1");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newResource, setNewResource] = useState("");
  const [resourceCategory, setResourceCategory] = useState("Equipment");
  const [resourceLocation, setResourceLocation] = useState("");
  const [resourceTotal, setResourceTotal] = useState(1);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskArea, setNewTaskArea] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState(dateOffset(2));
  const [newTaskOwner, setNewTaskOwner] = useState("");
  const [logs, setLogs] = useState([
    "Campus dashboard initialized",
  ]);

  const available = resources.reduce((sum, item) => sum + item.available, 0);
  const total = resources.reduce((sum, item) => sum + item.total, 0);
  const departments = [...new Set(students.map((student) => student.department))];
  const filteredStudents = students.filter((student) =>
    `${student.rollNumber} ${student.name} ${student.department} ${student.email}`
      .toLowerCase()
      .includes(studentSearch.toLowerCase())
  );
  const openTasks = tasks.filter((task) => task.status !== "Done");
  const completedTasks = tasks.filter((task) => task.status === "Done");
  const activeTaskCount = tasks.filter((task) => task.status === "In progress").length;
  const categories = ["All categories", ...new Set(resources.map((item) => item.category))];

  const filteredResources = resources.filter((item) =>
    `${item.name} ${item.category} ${item.location}`
      .toLowerCase()
      .includes(search.toLowerCase()) &&
    (resourceCategoryFilter === "All categories" || item.category === resourceCategoryFilter)
  );
  const filteredTasks = tasks.filter((task) =>
    `${task.title} ${task.description} ${task.area} ${task.owner}`
      .toLowerCase()
      .includes(taskSearch.toLowerCase())
  );
  const upcomingTasks = [...openTasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4);
  const categoryTotals = resources.reduce((totals, item) => {
    totals[item.category] = (totals[item.category] || 0) + item.total;
    return totals;
  }, {});
  const maxCategoryTotal = Math.max(1, ...Object.values(categoryTotals));
  const filteredQueue = queue.filter((student) =>
    `${student.name} ${student.service}`.toLowerCase().includes(queueSearch.toLowerCase())
  );
  const lowStockResources = resources.filter((item) =>
    item.total > 0 && item.available / item.total <= 0.2
  );
  const filteredLogs = logs.filter((entry) =>
    entry.toLowerCase().includes(activitySearch.toLowerCase())
  );

  function logActivity(message) {
    setLogs((old) => [
      `${new Date().toLocaleString()} — ${message}`,
      ...old,
    ].slice(0, 12));
    setNotice(message);
  }

  useEffect(() => {
    try {
      window.localStorage.setItem("smart-campus-tasks", JSON.stringify(tasks));
    } catch (error) {
      console.error("Could not save campus tasks.", error);
      setNotice("Tasks changed, but this browser could not save them locally.");
    }
  }, [tasks]);

  async function checkBackend() {
    setApiStatus("Connecting…");
    try {
      const [health, resourceData, queueData, campusData, studentData] = await Promise.all([
        apiRequest("/api/health"),
        apiRequest("/api/resources"),
        apiRequest("/api/queue"),
        apiRequest("/api/locations"),
        apiRequest("/api/students"),
      ]);
      setResources(resourceData);
      setQueue(queueData);
      setStudents(studentData);
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
      setQueueHistory((old) => [
        { ...result.served, servedAt: new Date().toLocaleString() },
        ...old,
      ].slice(0, 50));
      logActivity(`${result.served.name} served at ${result.served.service}`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function addCampusStudent(event) {
    event.preventDefault();
    try {
      const student = await apiRequest("/api/students", {
        method: "POST",
        body: JSON.stringify({
          rollNumber: newRollNumber.trim(),
          name: newStudentName.trim(),
          department: newDepartment.trim(),
          year: Number(newStudentYear),
          email: newStudentEmail.trim(),
        }),
      });
      setStudents((old) => [...old, student]);
      setNewRollNumber("");
      setNewStudentName("");
      setNewDepartment("");
      setNewStudentYear("1");
      setNewStudentEmail("");
      setShowStudentForm(false);
      logActivity(`Student registered: ${student.name} (${student.rollNumber})`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function deleteCampusStudent(student) {
    if (!window.confirm(`Remove ${student.name} (${student.rollNumber}) from the student register?`)) return;
    try {
      await apiRequest(`/api/students/${student.id}`, { method: "DELETE" });
      setStudents((old) => old.filter((item) => item.id !== student.id));
      logActivity(`Student removed from register: ${student.name}`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  function openResourceForm(resource = null) {
    setEditingResourceId(resource?.id ?? null);
    setNewResource(resource?.name ?? "");
    setResourceCategory(resource?.category ?? "Equipment");
    setResourceLocation(resource?.location ?? "");
    setResourceTotal(resource?.total ?? 1);
    setShowResourceForm(true);
  }

  async function saveResource(event) {
    event.preventDefault();
    if (!newResource.trim()) return;
    try {
      const resourceData = {
        name: newResource.trim(),
        category: resourceCategory,
        location: resourceLocation.trim() || "Not assigned",
        total: Number(resourceTotal),
      };
      const isEditing = editingResourceId !== null;
      const entry = await apiRequest(
        isEditing ? `/api/resources/${editingResourceId}` : "/api/resources",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(resourceData),
        }
      );
      if (isEditing) {
        setResources((old) => old.map((item) => item.id === entry.id ? entry : item));
      } else {
        setResources((old) => [...old, entry]);
      }
      setNewResource("");
      setResourceLocation("");
      setResourceTotal(1);
      setEditingResourceId(null);
      setShowResourceForm(false);
      logActivity(`Resource ${isEditing ? "updated" : "added"}: ${entry.name}`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function deleteResource(resource) {
    if (!window.confirm(`Delete "${resource.name}" from the inventory?`)) return;
    try {
      await apiRequest(`/api/resources/${resource.id}`, { method: "DELETE" });
      setResources((old) => old.filter((item) => item.id !== resource.id));
      logActivity(`Resource deleted: ${resource.name}`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function runTraversal(event) {
    event.preventDefault();
    try {
      const result = await apiRequest(
        `/api/traverse?algorithm=${algorithm}&from=${algorithmStart}`
      );
      setTraversal(result);
      logActivity(`${algorithm.toUpperCase()} traversal run from ${locations[algorithmStart]?.name}`);
    } catch (error) {
      setTraversal(null);
      setNotice(error.message);
    }
  }

  function downloadReport() {
    const rows = [
      ["Report", "Campus operations"],
      ["Generated at", new Date().toLocaleString()],
      ["Data source", apiStatus === "Connected" ? "Local backend (sample seed data)" : "Backend unavailable"],
      [],
      ["Student register"],
      ["Roll number", "Name", "Department", "Year", "Email"],
      ...students.map((student) => [
        student.rollNumber, student.name, student.department, student.year, student.email,
      ]),
      [],
      ["Campus tasks (browser-local)"],
      ["Title", "Area", "Priority", "Status", "Due date", "Owner"],
      ...tasks.map((task) => [
        task.title, task.area, task.priority, task.status, task.dueDate, task.owner,
      ]),
      [],
      ["Resources"],
      ["ID", "Name", "Category", "Location", "Available", "Total", "Utilization"],
      ...resources.map((item) => [
        item.id,
        item.name,
        item.category,
        item.location,
        item.available,
        item.total,
        item.total ? `${Math.round((item.total - item.available) / item.total * 100)}%` : "0%",
      ]),
      [],
      ["Current queue"],
      ["Position", "Student", "Service"],
      ...queue.map((student, index) => [index + 1, student.name, student.service]),
      [],
      ["Recently served in this browser session"],
      ["Student", "Service", "Served at"],
      ...queueHistory.map((student) => [student.name, student.service, student.servedAt]),
    ];
    const csv = rows.map((row) => row.map((cell) => {
      const value = String(cell ?? "");
      const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
      return `"${safeValue.replaceAll('"', '""')}"`;
    }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "smart-campus-report.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    logActivity("CSV report exported");
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

  function addTask(event) {
    event.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || "New campus operations task.",
      area: newTaskArea.trim() || "Campus-wide",
      priority: newTaskPriority,
      status: "To do",
      dueDate: newTaskDueDate,
      owner: newTaskOwner.trim() || "Unassigned",
    };
    setTasks((old) => [task, ...old]);
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskArea("");
    setNewTaskOwner("");
    setNewTaskPriority("Medium");
    setNewTaskDueDate(dateOffset(2));
    setShowTaskForm(false);
    logActivity(`Task created: ${task.title}`);
  }

  function advanceTask(task) {
    const nextStatus = task.status === "Done"
      ? "To do"
      : taskStatuses[taskStatuses.indexOf(task.status) + 1];
    setTasks((old) => old.map((item) =>
      item.id === task.id ? { ...item, status: nextStatus } : item
    ));
    logActivity(`Task ${nextStatus === "Done" ? "completed" : "moved to " + nextStatus.toLowerCase()}: ${task.title}`);
  }

  function deleteTask(task) {
    setTasks((old) => old.filter((item) => item.id !== task.id));
    logActivity(`Task removed: ${task.title}`);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="presentation">
              <path d="M24 3 39 9v12c0 11-6 18-15 24C15 39 9 32 9 21V9z" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path d="M15 29V17h4l5 7 5-7h4v12h-4v-6l-5 6-5-6v6z" fill="currentColor" />
              <path d="M17 12h14" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </div>
          <div className="brand-copy">
            <div className="brand-name">MADRAS INSTITUTE OF TECHNOLOGY</div>
            <div className="brand-caption">ANNA UNIVERSITY <span>·</span> CHROMEPET</div>
          </div>
        </div>

        <div className="campus-label">CAMPUS PORTAL</div>

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
                {label === "Tasks" && (
                  <span className="nav-count">{openTasks.length}</span>
                )}
                {label === "Students" && (
                  <span className="nav-count">{students.length}</span>
                )}
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <div>
            <div className="sidebar-status">Campus portal</div>
            <div className="sidebar-small">{apiStatus}</div>
          </div>
          <button className="header-signin" onClick={() => { setPage("Overview"); setNotice(""); }}>
            Campus portal <span>↗</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <button onClick={() => setPage("Overview")}>Home</button>
            <span className="crumb-divider">/</span>
            <strong>{page === "Overview" ? "University" : page}</strong>
          </div>
          <div className="topbar-right">
            <span className="environment-pill">
              <span className="small-dot" />
              {apiStatus === "Connected" ? "Campus services online" : apiStatus}
            </span>
            <button className="button button-secondary button-small" onClick={checkBackend}>↻ Refresh</button>
          </div>
        </header>

        <section className={`page-body ${page === "Overview" ? "landing-page" : ""}`}>
          <div className={`page-heading ${page === "Overview" ? "overview-heading" : ""}`}>
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
              <section className="overview-hero">
                <div className="hero-copy">
                  <span className="hero-kicker">UNIVERSITY</span>
                  <h2>Madras Institute of Technology (MIT) Campus</h2>
                  <p>
                    Established in 1949, MIT is a constituent campus of Anna University,
                    bringing together engineering, technology, research and student life.
                  </p>
                  <p className="hero-description">
                    Explore campus services, discover locations and stay connected with
                    the MIT community.
                  </p>
                  <div className="hero-actions">
                    <button className="button hero-primary" onClick={() => setPage("Students")}>
                      Explore campus <span>→</span>
                    </button>
                    <a className="button hero-secondary" href="https://mitindia.edu/" target="_blank" rel="noreferrer">
                      Official MIT website <span>↗</span>
                    </a>
                  </div>
                  <div className="hero-highlights">
                    <div><strong>1949</strong><span>Year established</span></div>
                    <div><strong>Anna University</strong><span>Constituent campus</span></div>
                    <div><strong>Chromepet</strong><span>Chennai, Tamil Nadu</span></div>
                  </div>
                </div>
                <div className="hero-artwork">
                  <CampusGateArtwork />
                  <div className="hero-image-caption">
                    <span className="caption-pin">⌖</span>
                    <span><strong>MIT Campus</strong><small>Chromepet · Chennai</small></span>
                    <button onClick={() => setPage("Navigation")} aria-label="Explore campus locations">↗</button>
                  </div>
                </div>
              </section>
              <section className="announcement-strip">
                <div className="announcement-label"><span>✦</span> CAMPUS UPDATES</div>
                <p>Explore student services, campus locations and shared learning resources.</p>
                <button onClick={() => setPage("Student Queue")}>Student services <span>→</span></button>
              </section>
              <section className="institution-stats" aria-label="Campus overview statistics">
                {[
                  ["Students", students.length, "♙", "Students"],
                  ["Resources", resources.length, "▤", "Resources"],
                  ["Campus locations", locations.length, "⌖", "Navigation"],
                  ["Waiting requests", queue.length, "⇄", "Student Queue"],
                  ["Open tasks", openTasks.length, "✓", "Tasks"],
                  ["Available units", total ? `${Math.round(available / total * 100)}%` : "—", "↗", "Resources"],
                ].map(([label, value, icon, target]) => (
                  <button className="institution-stat" key={label} onClick={() => setPage(target)}>
                    <span className="stat-icon">{icon}</span>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </button>
                ))}
              </section>
              <div className="section-grid operations-grid">
                <section className="panel upcoming-panel">
                  <div className="panel-header">
                    <div>
                      <span className="section-overline">WORKSPACE</span>
                      <h2>Priority tasks</h2>
                      <p>{openTasks.length} open · {activeTaskCount} currently in progress</p>
                    </div>
                    <button className="text-button" onClick={() => setPage("Tasks")}>View task board ↗</button>
                  </div>
                  <div className="upcoming-list">
                    {upcomingTasks.map((task) => (
                      <TaskRow key={task.id} task={task} onAdvance={advanceTask} />
                    ))}
                    {!upcomingTasks.length && <Empty text="All tasks are complete. Nice work!" />}
                  </div>
                </section>
                <section className="panel inventory-overview-panel">
                  <div className="panel-header">
                    <div>
                      <span className="section-overline">INVENTORY</span>
                      <h2>Resource mix</h2>
                      <p>{resources.length} resource types · {total} tracked units</p>
                    </div>
                    <button className="text-button" onClick={() => setPage("Resources")}>View inventory ↗</button>
                  </div>
                  <div className="category-chart">
                    {Object.entries(categoryTotals).map(([category, count], index) => (
                      <div className="category-chart-row" key={category}>
                        <div className="category-chart-label"><span className={`category-dot category-dot-${index % 5}`} />{category}<strong>{count}</strong></div>
                        <div className="category-track"><span className={`category-fill category-fill-${index % 5}`} style={{ width: `${count / maxCategoryTotal * 100}%` }} /></div>
                      </div>
                    ))}
                    {!resources.length && <Empty text="Connect to the backend to load inventory." />}
                  </div>
                  <div className="inventory-foot"><span>Availability rate</span><strong>{total ? Math.round(available / total * 100) : 0}%</strong></div>
                </section>
              </div>
              {lowStockResources.length > 0 && (
                <section className="panel alert-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Inventory alerts</h2>
                      <p>Computed from current backend inventory; threshold is 20% available.</p>
                    </div>
                    <button className="text-button" onClick={() => setPage("Resources")}>Review inventory ↗</button>
                  </div>
                  <div className="alert-list">
                    {lowStockResources.map((resource) => (
                      <div className="alert-row" key={resource.id}>
                        <span className="alert-severity">LOW STOCK</span>
                        <strong>{resource.name}</strong>
                        <span>{resource.available} of {resource.total} available</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

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
                <ResourceTable
                  resources={resources.slice(0, 4)}
                  onToggle={toggleAvailability}
                  onEdit={(resource) => {
                    openResourceForm(resource);
                    setPage("Resources");
                  }}
                  onDelete={deleteResource}
                />
              </section>
            </>
          )}

          {page === "Tasks" && (
            <section className="panel task-board-panel">
              <div className="panel-header task-board-header">
                <div>
                  <span className="section-overline">CAMPUS WORKSPACE</span>
                  <h2>Operations task board</h2>
                  <p>Coordinate campus work and keep priorities moving. Tasks are saved in this browser.</p>
                </div>
                <button className="button button-primary" onClick={() => setShowTaskForm((visible) => !visible)}>
                  {showTaskForm ? "Cancel" : "＋ New task"}
                </button>
              </div>
              <div className="task-summary">
                <div><span className="task-summary-icon task-icon-open">◷</span><span>Open tasks<strong>{openTasks.length}</strong></span></div>
                <div><span className="task-summary-icon task-icon-progress">↗</span><span>In progress<strong>{activeTaskCount}</strong></span></div>
                <div><span className="task-summary-icon task-icon-done">✓</span><span>Completed<strong>{completedTasks.length}</strong></span></div>
              </div>
              {showTaskForm && (
                <form className="task-form" onSubmit={addTask}>
                  <label>Task title<input required maxLength={100} value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="e.g. Inspect classroom AV equipment" /></label>
                  <label>Details<input maxLength={160} value={newTaskDescription} onChange={(event) => setNewTaskDescription(event.target.value)} placeholder="What needs to be done?" /></label>
                  <label>Campus area<input maxLength={63} value={newTaskArea} onChange={(event) => setNewTaskArea(event.target.value)} placeholder="Building or location" /></label>
                  <label>Owner<input maxLength={63} value={newTaskOwner} onChange={(event) => setNewTaskOwner(event.target.value)} placeholder="Team or person" /></label>
                  <label>Priority<select value={newTaskPriority} onChange={(event) => setNewTaskPriority(event.target.value)}>{taskPriorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
                  <label>Due date<input type="date" value={newTaskDueDate} onChange={(event) => setNewTaskDueDate(event.target.value)} required /></label>
                  <button className="button button-primary" type="submit">Add to task board</button>
                </form>
              )}
              <div className="search-box task-search">
                <span>⌕</span>
                <input value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} placeholder="Search tasks, areas or owners..." aria-label="Search tasks" />
              </div>
              <div className="task-columns">
                {taskStatuses.map((status) => {
                  const columnTasks = filteredTasks.filter((task) => task.status === status);
                  return (
                    <section className={`task-column task-column-${status.toLowerCase().replace(" ", "-")}`} key={status}>
                      <div className="task-column-heading">
                        <span className="task-column-indicator" />
                        <h3>{status}</h3>
                        <span className="task-column-count">{columnTasks.length}</span>
                      </div>
                      <div className="task-column-list">
                        {columnTasks.map((task) => (
                          <TaskCard key={task.id} task={task} onAdvance={advanceTask} onDelete={deleteTask} />
                        ))}
                        {!columnTasks.length && <div className="task-column-empty">No tasks here</div>}
                      </div>
                    </section>
                  );
                })}
              </div>
              <p className="footnote">Tasks are stored locally in this browser and are not shared across devices or saved to the campus backend.</p>
            </section>
          )}

          {page === "Resources" && (
            <>
            <div className="resource-summary">
              <Metric label="Resource records" value={resources.length} detail="Across campus locations" icon="▤" />
              <Metric label="Total capacity" value={total} detail="Tracked units and spaces" icon="▦" />
              <Metric label="Available now" value={available} detail={`${total ? Math.round(available / total * 100) : 0}% of tracked capacity`} icon="✓" />
              <Metric label="Needs attention" value={lowStockResources.length} detail="At or below 20% available" icon="!" />
            </div>
            <section className="panel resource-inventory-panel">
              <div className="panel-header">
              <div>
                <span className="section-overline">CAMPUS ASSETS</span>
                <h2>Resource inventory</h2>
                <p>Monitor availability and manage equipment, spaces and facilities.</p>
              </div>
              <button className="button button-primary" onClick={() => {
                if (showResourceForm) {
                  setShowResourceForm(false);
                  setEditingResourceId(null);
                } else {
                  openResourceForm();
                }
              }}>
                {showResourceForm ? "Cancel" : "+ Add resource"}
              </button>
              </div>
              {showResourceForm && (
              <form className="inline-form resource-form" onSubmit={saveResource}>
                <label>Resource name
                  <input required maxLength={63} value={newResource} onChange={(e) => setNewResource(e.target.value)} placeholder="e.g. Projector" />
                </label>
                <label>Category
                  <select value={resourceCategory} onChange={(e) => setResourceCategory(e.target.value)}>
                    <option>Equipment</option>
                    <option>Laboratory</option>
                    <option>Classroom</option>
                    <option>Study Space</option>
                    <option>Facilities</option>
                    <option>IT &amp; Network</option>
                    <option>Safety</option>
                    <option>Furniture</option>
                  </select>
                </label>
                <label>Location
                  <input required maxLength={63} value={resourceLocation} onChange={(e) => setResourceLocation(e.target.value)} placeholder="Building or room" />
                </label>
                <label>Total units
                  <input type="number" min="1" max="10000" value={resourceTotal} onChange={(e) => setResourceTotal(e.target.value)} required />
                </label>
                <button className="button button-primary" type="submit">{editingResourceId ? "Update resource" : "Save resource"}</button>
              </form>
              )}
              <div className="search-box">
                <span>⌕</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources, categories or locations..." />
              </div>
              <div className="category-filters" aria-label="Filter by resource category">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-filter ${resourceCategoryFilter === category ? "active" : ""}`}
                    onClick={() => setResourceCategoryFilter(category)}
                  >
                    {category}
                    {category === "All categories" && <span>{resources.length}</span>}
                  </button>
                ))}
              </div>
              <ResourceTable
                resources={filteredResources}
                onToggle={toggleAvailability}
                onEdit={openResourceForm}
                onDelete={deleteResource}
              />
            </section>
            </>
          )}

          {page === "Students" && (
            <>
              <div className="student-summary">
                <Metric label="Registered students" value={students.length} detail="Campus directory records" icon="♙" />
                <Metric label="Departments" value={departments.length} detail="Represented in this register" icon="▦" />
                <Metric label="Currently queued" value={queue.length} detail="Waiting for student services" icon="⇄" />
                <Metric label="Campus locations" value={locations.length} detail="Available for campus routing" icon="⌖" />
              </div>
              <section className="panel student-directory-panel">
                <div className="panel-header">
                  <div>
                    <span className="section-overline">CAMPUS COMMUNITY</span>
                    <h2>Student directory</h2>
                    <p>Manage student records separately from the service queue. Records are stored by the local backend.</p>
                  </div>
                  <button className="button button-primary" onClick={() => setShowStudentForm((visible) => !visible)}>
                    {showStudentForm ? "Cancel" : "＋ Add student"}
                  </button>
                </div>
                {showStudentForm && (
                  <form className="student-form" onSubmit={addCampusStudent}>
                    <label>Roll number<input required maxLength={63} value={newRollNumber} onChange={(event) => setNewRollNumber(event.target.value)} placeholder="e.g. MIT2024010" /></label>
                    <label>Full name<input required maxLength={63} value={newStudentName} onChange={(event) => setNewStudentName(event.target.value)} placeholder="Student name" /></label>
                    <label>Department<input required maxLength={63} value={newDepartment} onChange={(event) => setNewDepartment(event.target.value)} placeholder="Academic department" /></label>
                    <label>Year of study<select value={newStudentYear} onChange={(event) => setNewStudentYear(event.target.value)}>{[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>Year {year}</option>)}</select></label>
                    <label>Email address<input type="email" required maxLength={63} value={newStudentEmail} onChange={(event) => setNewStudentEmail(event.target.value)} placeholder="student@example.edu" /></label>
                    <button className="button button-primary" type="submit">Register student</button>
                  </form>
                )}
                <div className="student-toolbar">
                  <div className="search-box">
                    <span>⌕</span>
                    <input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search by name, roll number, department..." aria-label="Search students" />
                  </div>
                  <span>{filteredStudents.length} of {students.length} students</span>
                </div>
                {filteredStudents.length ? (
                  <div className="table-wrap">
                    <table className="student-table">
                      <thead><tr><th>STUDENT</th><th>DEPARTMENT</th><th>YEAR</th><th>EMAIL</th><th>ACTION</th></tr></thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.id}>
                            <td><div className="student-name-cell"><span className="student-avatar">{student.name.slice(0, 1).toUpperCase()}</span><span><strong>{student.name}</strong><small>{student.rollNumber}</small></span></div></td>
                            <td>{student.department}</td>
                            <td><span className="year-chip">Year {student.year}</span></td>
                            <td>{student.email}</td>
                            <td><button className="table-action danger-action" onClick={() => deleteCampusStudent(student)}>Remove</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <Empty text={students.length ? "No students match your search." : "No student records yet. Add a student to start the register."} />}
              </section>
            </>
          )}

          {page === "Navigation" && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Campus route planner</h2>
                  <p>Dijkstra's shortest-path algorithm · {locations.length} campus destinations</p>
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
              <p className="footnote">Routes are calculated by the C backend using Dijkstra's algorithm across the illustrative 12-location campus network. This demonstration is not a verified MIT walking map.</p>
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
                <span>
                  {queue.length} waiting · Front: {queue[0]?.name || "—"} · Rear: {queue[queue.length - 1]?.name || "—"}
                </span>
                <button className="button button-secondary" onClick={serveNext} disabled={!queue.length}>Serve next student →</button>
              </div>
              <div className="search-box queue-search">
                <span>⌕</span>
                <input value={queueSearch} onChange={(e) => setQueueSearch(e.target.value)} placeholder="Search waiting requests..." aria-label="Search queue" />
              </div>
              {filteredQueue.length ? (
                <div className="queue-list">
                  {filteredQueue.map((student) => (
                    <div className="queue-row" key={student.id}>
                      <div className="queue-number">{queue.findIndex((item) => item.id === student.id) + 1}</div>
                      <div className="queue-info">
                        <strong>{student.name}</strong>
                        <span>{student.service}</span>
                      </div>
                      <span className="priority normal">Waiting</span>
                    </div>
                  ))}
                </div>
              ) : <Empty text={queue.length ? "No waiting requests match your search." : "The queue is empty. Add a student to begin."} />}
              <div className="queue-history">
                <h3>Recently served <span>this browser session</span></h3>
                {queueHistory.length
                  ? queueHistory.slice(0, 5).map((student) => (
                    <div className="history-row" key={`${student.id}-${student.servedAt}`}>
                      <strong>{student.name}</strong>
                      <span>{student.service}</span>
                      <time>{student.servedAt}</time>
                    </div>
                  ))
                  : <p className="muted-copy">No completed requests recorded in this session.</p>}
              </div>
            </section>
          )}

          {page === "DSA Explorer" && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Graph traversal explorer</h2>
                  <p>Runs the selected algorithm on the C backend's adjacency matrix.</p>
                </div>
                <span className="algorithm-tag">LIVE BACKEND</span>
              </div>
              <form className="traversal-form" onSubmit={runTraversal}>
                <label>Algorithm
                  <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}>
                    <option value="bfs">Breadth-first search (BFS)</option>
                    <option value="dfs">Depth-first search (DFS)</option>
                  </select>
                </label>
                <label>Starting vertex
                  <select value={algorithmStart} onChange={(event) => setAlgorithmStart(Number(event.target.value))}>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>{location.id} — {location.name}</option>
                    ))}
                  </select>
                </label>
                <button className="button button-primary" type="submit" disabled={apiStatus !== "Connected"}>Run traversal</button>
              </form>
              {traversal && (
                <div className="traversal-result" aria-live="polite">
                  <div className="route-result-title">{traversal.algorithm.toUpperCase()} traversal order</div>
                  <div className="route-steps">
                    {traversal.names.map((name, index) => (
                      <span key={`${traversal.order[index]}-${name}`}>
                        <strong>{traversal.order[index]} · {name}</strong>
                        {index < traversal.names.length - 1 && <i>→</i>}
                      </span>
                    ))}
                  </div>
                  <p className="footnote">
                    Representation: {traversal.representation}. Time: {traversal.complexity.time};
                    {" "}extra space: {traversal.complexity.space}. This illustrative graph is not a verified MIT walking map.
                  </p>
                </div>
              )}
              <div className="algorithm-grid dsa-reference">
                <article className="algorithm-card">
                  <span className="algorithm-tag">BFS · O(V²)</span>
                  <h3>Breadth-first search</h3>
                  <p>Visits graph neighbours level by level using a FIFO queue.</p>
                </article>
                <article className="algorithm-card">
                  <span className="algorithm-tag">DFS · O(V²)</span>
                  <h3>Depth-first search</h3>
                  <p>Explores a branch before backtracking, using an explicit stack.</p>
                </article>
                <article className="algorithm-card">
                  <span className="algorithm-tag">DIJKSTRA · O(V²)</span>
                  <h3>Shortest path</h3>
                  <p>Uses non-negative weighted graph edges. Choose source and destination in Navigation.</p>
                  <button className="text-button" onClick={() => setPage("Navigation")}>Open route planner ↗</button>
                </article>
              </div>
            </section>
          )}

          {page === "Reports" && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Campus operations report</h2>
                  <p>Export campus tasks, backend inventory, queue and session-local service history.</p>
                </div>
                <button className="button button-primary" onClick={downloadReport}>Download CSV</button>
              </div>
              <div className="report-summary">
                <Metric label="Inventory records" value={resources.length} detail="Current backend records" icon="▤" />
                <Metric label="Units in use" value={total - available} detail="Calculated as total minus available" icon="↗" />
                <Metric label="Queue requests" value={queue.length} detail="Currently waiting" icon="⇄" />
                <Metric label="Served this session" value={queueHistory.length} detail="Browser session only" icon="✓" />
                <Metric label="Open tasks" value={openTasks.length} detail="Saved in this browser" icon="◷" />
                <Metric label="Registered students" value={students.length} detail="Campus directory records" icon="♙" />
              </div>
              <p className="footnote">
                This report uses local backend demonstration data. Campus tasks are saved in this browser; served-request history lasts for this browser session only.
              </p>
            </section>
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
              <div className="search-box">
                <span>⌕</span>
                <input value={activitySearch} onChange={(e) => setActivitySearch(e.target.value)} placeholder="Search activity..." aria-label="Search activity history" />
              </div>
              {filteredLogs.length ? filteredLogs.map((log, i) => (
                <div className="activity-row" key={`${log}-${i}`}>
                  <span className="activity-dot" />
                  <span>{log}</span>
                </div>
              )) : <Empty text={logs.length ? "No activity matches your search." : "No activity recorded yet."} />}
            </section>
          )}

          <footer className="footer">
            <span>MADRAS INSTITUTE OF TECHNOLOGY · ANNA UNIVERSITY</span>
            <span>Independent academic demonstration · Not an official institutional service</span>
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

function CampusGateArtwork() {
  return (
    <svg
      className="campus-gate-art"
      viewBox="0 0 900 560"
      role="img"
      aria-label="Illustration of the entrance to a green university campus"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="campus-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c5e1ec" />
          <stop offset="1" stopColor="#f4ead7" />
        </linearGradient>
        <linearGradient id="campus-road" x1="0" x2="0.9" y1="0" y2="1">
          <stop offset="0" stopColor="#ddd4c3" />
          <stop offset="1" stopColor="#a9a696" />
        </linearGradient>
        <linearGradient id="campus-pillar" x1="0" x2="1">
          <stop offset="0" stopColor="#e9e5d9" />
          <stop offset=".5" stopColor="#fffdf5" />
          <stop offset="1" stopColor="#c8c3b5" />
        </linearGradient>
      </defs>
      <rect width="900" height="560" fill="url(#campus-sky)" />
      <circle cx="727" cy="96" r="44" fill="#f3d9a1" opacity=".77" />
      <path d="M0 308Q205 271 408 310T900 290V560H0Z" fill="#66865e" />
      <path d="M0 365Q173 318 366 359T900 336V560H0Z" fill="#87966b" />
      <g fill="#496d53">
        <path d="M40 339V159h15v180zm-37-23 45-151 45 151z" />
        <path d="M92 356V199h13v157zm-32-26 39-133 40 133z" />
        <path d="M769 338V155h16v183zm-39-25 47-160 48 160z" />
        <path d="M836 365V205h14v160zm-31-28 39-126 39 126z" />
      </g>
      <g fill="#73916a">
        <circle cx="88" cy="289" r="55" /><circle cx="139" cy="316" r="47" />
        <circle cx="784" cy="292" r="58" /><circle cx="835" cy="321" r="47" />
        <circle cx="719" cy="314" r="42" /><circle cx="192" cy="332" r="38" />
      </g>
      <g fill="#c6bda8" stroke="#958d7b" strokeWidth="4">
        <path d="M305 323V222h33v101zm13-104v-15h8v15zm22 104V206h32v117zm8-117v-17h11v17z" />
        <path d="M412 326V188h168v138z" />
      </g>
      <g fill="#eee7d7">
        <path d="M404 190 496 128l94 62z" />
        <path d="M438 220h18v48h-18zm38 0h18v48h-18zm38 0h18v48h-18z" />
      </g>
      <path d="M0 355h900v27H0z" fill="#6d3936" />
      <path d="M0 350h900v11H0z" fill="#ba7460" />
      <text x="450" y="346" textAnchor="middle" fill="#fff8eb" fontSize="18" fontFamily="Georgia, serif" letterSpacing="3">
        MADRAS INSTITUTE OF TECHNOLOGY
      </text>
      <g fill="url(#campus-pillar)" stroke="#a9a394" strokeWidth="2">
        <path d="M93 340h64v220H93zm-9-11h82v17H84zm10-11h62v11H94z" />
        <path d="M743 340h64v220h-64zm-9-11h82v17h-82zm10-11h62v11h-62z" />
      </g>
      <g stroke="#554c42" strokeWidth="8">
        <path d="M163 374v133m27-133v133m27-133v133m27-133v133m27-133v133m27-133v133" />
        <path d="M567 374v133m27-133v133m27-133v133m27-133v133m27-133v133m27-133v133" />
      </g>
      <path d="M0 509 294 475h312l294 34v51H0z" fill="url(#campus-road)" />
      <path d="m390 482-44 78h208l-43-78z" fill="#c4bca9" opacity=".8" />
      <path d="M0 538q181-45 334-20t566-4v46H0z" fill="#6c7f5a" opacity=".9" />
      <g fill="#f5f0df" opacity=".8">
        <circle cx="254" cy="454" r="4" /><circle cx="272" cy="446" r="3" /><circle cx="653" cy="448" r="4" />
        <circle cx="674" cy="458" r="3" /><circle cx="206" cy="463" r="3" /><circle cx="701" cy="442" r="3" />
      </g>
    </svg>
  );
}

function formatTaskDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function TaskRow({ task, onAdvance }) {
  return (
    <div className="upcoming-task">
      <button
        className={`task-check ${task.status === "Done" ? "checked" : ""}`}
        onClick={() => onAdvance(task)}
        aria-label={task.status === "Done" ? `Reopen ${task.title}` : `Advance ${task.title}`}
      >
        {task.status === "Done" ? "✓" : ""}
      </button>
      <div className="upcoming-task-copy">
        <strong>{task.title}</strong>
        <span>{task.area} <i>·</i> {task.owner}</span>
      </div>
      <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
      <time>{formatTaskDate(task.dueDate)}</time>
    </div>
  );
}

function TaskCard({ task, onAdvance, onDelete }) {
  const nextAction = task.status === "To do"
    ? "Start task"
    : task.status === "In progress" ? "Complete" : "Reopen";
  return (
    <article className="task-card">
      <div className="task-card-top">
        <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{task.priority} priority</span>
        <button className="task-delete" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>×</button>
      </div>
      <h4>{task.title}</h4>
      <p>{task.description}</p>
      <div className="task-card-meta">
        <span>⌖ {task.area}</span>
        <span>◉ {task.owner}</span>
      </div>
      <div className="task-card-bottom">
        <time>◷ &nbsp;{formatTaskDate(task.dueDate)}</time>
        <button onClick={() => onAdvance(task)}>{nextAction} <span>→</span></button>
      </div>
    </article>
  );
}

function ResourceTable({ resources, onToggle, onEdit, onDelete }) {
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
            <th>ACTIONS</th>
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
              <td className="resource-actions">
                <button className="table-action" onClick={() => onToggle(item.id)}>
                  {item.available > 0 ? "Mark used" : "Restock"}
                </button>
                <button className="table-action" onClick={() => onEdit(item)}>Edit</button>
                <button className="table-action danger-action" onClick={() => onDelete(item)}>Delete</button>
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
