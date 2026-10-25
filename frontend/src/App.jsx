import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, CirclePlus, Clock3, LayoutDashboard, RefreshCw, Search, Server, ShieldCheck, Trash2, X } from 'lucide-react';

const blank = { title: '', description: '', severity: 'MEDIUM', status: 'OPEN', assignedTo: '' };

function App() {
  const [incidents, setIncidents] = useState([]);
  const [health, setHealth] = useState('checking');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [items, ping] = await Promise.all([
        fetch('/api/incidents'),
        fetch('/api/health')
      ]);
      if (!items.ok) throw new Error('Could not load incidents');
      setIncidents(await items.json());
      setHealth(ping.ok ? 'online' : 'offline');
      setError('');
    } catch {
      setHealth('offline');
      setError('Unable to connect to the backend. Check that all Docker services are running.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => incidents.filter(item => {
    const matchesQuery = `${item.title} ${item.description || ''} ${item.assignedTo || ''}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === 'ALL' || item.status === statusFilter);
  }), [incidents, query, statusFilter]);

  const stats = [
    { label: 'Total incidents', value: incidents.length, icon: Activity, color: 'blue' },
    { label: 'Open incidents', value: incidents.filter(i => i.status === 'OPEN').length, icon: AlertTriangle, color: 'orange' },
    { label: 'Critical incidents', value: incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length, icon: ShieldCheck, color: 'red' },
    { label: 'Resolved', value: incidents.filter(i => i.status === 'RESOLVED').length, icon: CheckCircle2, color: 'green' }
  ];

  function openCreate() {
    setEditing(null);
    setForm(blank);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item.id);
    setForm({ title: item.title, description: item.description || '', severity: item.severity, status: item.status, assignedTo: item.assignedTo || '' });
    setShowForm(true);
  }

  async function saveIncident(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(editing ? `/api/incidents/${editing}` : '/api/incidents', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error('Save failed. Please check the fields and try again.');
      setShowForm(false);
      await loadData();
    } catch (e) {
      setError(e.message || 'Unable to save incident.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteIncident(id) {
    if (!window.confirm('Delete this incident? This cannot be undone.')) return;
    try {
      const response = await fetch(`/api/incidents/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      await loadData();
    } catch {
      setError('Could not delete this incident.');
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Activity size={22}/></div><div><strong>OpsDesk</strong><span>IT OPERATIONS</span></div></div>
        <div className="nav-label">WORKSPACE</div>
        <div className="nav-item active"><LayoutDashboard size={18}/> Incident overview</div>
        <div className="nav-item"><Server size={18}/> Service health <span className={`mini-dot ${health}`}/></div>
        <div className="sidebar-bottom"><div className="avatar">IT</div><div><strong>IT Operations</strong><span>Incident response team</span></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div><span className="eyebrow">OPERATIONS CENTER</span><h1>Incident overview</h1><p>Track issues, coordinate response, and keep services reliable.</p></div><button className="btn btn-primary" onClick={openCreate}><CirclePlus size={17}/> New incident</button></header>

        <div className="health-banner">
          <div className={`health-icon ${health}`}><Activity size={19}/></div>
          <div className="health-copy"><strong>Application backend</strong><span>{health === 'online' ? 'API is responding normally' : health === 'checking' ? 'Checking service availability…' : 'Backend is unreachable'}</span></div>
          <span className={`status-pill ${health}`}>{health === 'online' ? 'Operational' : health === 'checking' ? 'Checking' : 'Offline'}</span>
          <button className="icon-btn" title="Refresh data" onClick={loadData}><RefreshCw size={17}/></button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <section className="stats-grid">{stats.map(s => { const Icon = s.icon; return <div className="stat-card" key={s.label}><div className={`stat-icon ${s.color}`}><Icon size={20}/></div><span>{s.label}</span><strong>{s.value}</strong></div>; })}</section>

        <section className="panel">
          <div className="panel-heading"><div><h2>Incident register</h2><p>Review and manage reported service issues.</p></div><span className="count-pill">{filtered.length} records</span></div>
          <div className="toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search incidents or assignees…"/></div><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status"><option value="ALL">All statuses</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option></select></div>
          <div className="table-wrap"><table><thead><tr><th>INCIDENT</th><th>SEVERITY</th><th>STATUS</th><th>ASSIGNED TO</th><th>CREATED</th><th>ACTIONS</th></tr></thead><tbody>
            {loading ? <tr><td colSpan="6" className="empty-state">Loading incidents…</td></tr> : filtered.length === 0 ? <tr><td colSpan="6" className="empty-state"><div className="empty-icon"><Clock3 size={25}/></div><strong>No incidents found</strong><span>Create an incident to start tracking operational issues.</span></td></tr> : filtered.map(item => <tr key={item.id}><td><button className="incident-title" onClick={() => openEdit(item)}>INC-{String(item.id).padStart(4, '0')} · {item.title}</button><span className="description">{item.description || 'No description provided'}</span></td><td><span className={`severity ${item.severity.toLowerCase()}`}><i/> {item.severity}</span></td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status.replace('_', ' ')}</span></td><td>{item.assignedTo || <span className="muted">Unassigned</span>}</td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td><td><div className="actions"><button className="icon-btn" title="Edit incident" onClick={() => openEdit(item)}>Edit</button><button className="icon-btn danger" title="Delete incident" onClick={() => deleteIncident(item.id)}><Trash2 size={15}/></button></div></td></tr>)}
          </tbody></table></div>
          <div className="table-footer"><span>Showing {filtered.length} of {incidents.length} incidents</span><span><span className={`mini-dot ${health}`}/> API {health}</span></div>
        </section>
        <footer>OpsDesk Incident Management <span>•</span> DevOps learning project</footer>
      </main>

      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}><section className="modal"><div className="modal-header"><div><span className="eyebrow">{editing ? 'UPDATE RECORD' : 'NEW RECORD'}</span><h2>{editing ? 'Edit incident' : 'Create incident'}</h2></div><button className="icon-btn" onClick={() => setShowForm(false)} aria-label="Close"><X size={20}/></button></div><form onSubmit={saveIncident}><label>Incident title<input required maxLength="120" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Production API returning errors"/></label><label>Description<textarea maxLength="2000" rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the impact and symptoms…"/></label><div className="form-row"><label>Severity<select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label><label>Status<select value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN PROGRESS</option><option value="RESOLVED">RESOLVED</option></select></label></div><label>Assigned to<input maxLength="120" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} placeholder="e.g. Platform team"/></label><div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create incident'}</button></div></form></section></div>}
    </div>
  );
}

export default App;
