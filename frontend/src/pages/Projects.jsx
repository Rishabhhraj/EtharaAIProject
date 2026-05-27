import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';

export default function Projects() {
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', memberIds: [] });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getProjects(),
      isAdmin ? api.getMembers().catch(() => ({ users: [] })) : Promise.resolve({ users: [] }),
    ])
      .then(([projRes, memRes]) => {
        setProjects(projRes.projects);
        setMembers(memRes.users || []);
      })
      .catch((err) => {
        setError(err.message);
        showError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [isAdmin]);

  const toggleMember = (id) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id)
        ? f.memberIds.filter((m) => m !== id)
        : [...f.memberIds, id],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createProject(form);
      setForm({ name: '', description: '', memberIds: [] });
      setShowForm(false);
      showSuccess('Project created');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.deleteProject(id);
      showSuccess('Project deleted');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>{isAdmin ? 'Create and manage team projects' : 'Projects you are assigned to'}</p>
        </div>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && isAdmin && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h2 className="section-title">Create project</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Project name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Team members</label>
              {members.length > 0 ? (
                <div className="member-checkboxes">
                  {members.map((m) => (
                    <label key={m.id || m._id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.memberIds.includes(m.id || m._id)}
                        onChange={() => toggleMember(m.id || m._id)}
                      />
                      {m.name} ({m.email})
                    </label>
                  ))}
                </div>
              ) : (
                <p className="empty-hint">
                  No members registered yet. Teammates must{' '}
                  <Link to="/signup">sign up</Link> and choose role <strong>Member</strong> — they
                  will appear here for you to add.
                </p>
              )}
            </div>
            <button type="submit" className="btn btn-primary">
              Create Project
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-inline">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="card empty-state">
          <p>No projects yet.{isAdmin && ' Create your first project above.'}</p>
        </div>
      ) : (
        <div className="grid-2 project-grid">
          {projects.map((p) => (
            <div key={p._id} className="card project-card">
              <div className="project-card-top">
                <h3>
                  <Link to={`/projects/${p._id}`}>{p.name}</Link>
                  {p.status === 'archived' && (
                    <span className="badge badge-archived"> Archived</span>
                  )}
                </h3>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(p._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="project-desc">{p.description || 'No description'}</p>
              <div className="project-meta">
                <span>{p.members?.length || 0} team member(s)</span>
                <Link to={`/projects/${p._id}`} className="btn btn-secondary btn-sm">
                  View tasks →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
