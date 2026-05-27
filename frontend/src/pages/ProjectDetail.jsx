import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './ProjectDetail.css';

const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    status: 'todo',
    dueDate: '',
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [addMemberIds, setAddMemberIds] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const projRes = await api.getProject(id);
      setProject(projRes.project);

      const taskRes = await api.getTasks(id);
      setTasks(taskRes.tasks);
      if (isAdmin) {
        const memRes = await api.getMembers();
        const projectMemberIds = new Set(
          (projRes.project.members || []).map((m) => (m._id || m).toString())
        );
        setMembers(
          (memRes.users || []).filter((m) => !projectMemberIds.has((m.id || m._id).toString()))
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, isAdmin]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.createTask(id, {
        ...taskForm,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined,
      });
      setTaskForm({ title: '', description: '', assignedTo: '', status: 'todo', dueDate: '' });
      setShowTaskForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.updateTask(taskId, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddMembers = async () => {
    if (!addMemberIds.length) return;
    try {
      await api.addMembers(id, addMemberIds);
      setAddMemberIds([]);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await api.removeMember(id, memberId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const teamOptions = () => {
    const list = [...(project?.members || [])];
    if (project?.createdBy && !list.find((m) => (m._id || m).toString() === project.createdBy._id?.toString())) {
      list.unshift(project.createdBy);
    }
    return list;
  };

  const canEditTask = (task) => {
    if (isAdmin) return true;
    const assigneeId = task.assignedTo?._id || task.assignedTo;
    return assigneeId && assigneeId.toString() === user.id;
  };

  const isOverdue = (task) =>
    task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();

  if (loading) {
    return (
      <Layout>
        <div className="loading-inline">Loading project...</div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="alert alert-error">{error || 'Project not found'}</div>
        <Link to="/projects">← Back to projects</Link>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <Link to="/projects" className="back-link">
            ← Projects
          </Link>
          <h1>{project.name}</h1>
          <p>{project.description || 'No description'}</p>
        </div>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
            {showTaskForm ? 'Cancel' : '+ Add Task'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-grid">
        <div className="card">
          <h2 className="section-title">Team</h2>
          <ul className="team-list">
            <li>
              <strong>{project.createdBy?.name || 'Admin'}</strong>
              <span className="badge badge-admin">Owner</span>
            </li>
            {(project.members || []).map((m) => (
              <li key={m._id}>
                <span>{m.name}</span>
                <span className="badge badge-member">member</span>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRemoveMember(m._id)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
          {isAdmin && (
            <div className="add-members">
              <p className="add-members-label">Add members to this project</p>
              {members.length > 0 ? (
                <>
                  <select
                    multiple
                    value={addMemberIds}
                    onChange={(e) =>
                      setAddMemberIds(Array.from(e.target.selectedOptions, (o) => o.value))
                    }
                    className="member-select"
                    title="Hold Ctrl (Windows) or Cmd (Mac) to select multiple"
                  >
                    {members.map((m) => (
                      <option key={m.id || m._id} value={m.id || m._id}>
                        {m.name} — {m.email}
                      </option>
                    ))}
                  </select>
                  <p className="empty-hint">Tip: hold Ctrl and click to select multiple people.</p>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddMembers}>
                    Add to team
                  </button>
                </>
              ) : (
                <p className="empty-hint">
                  Everyone is already on the team, or no other members exist. New users must sign up
                  with role <strong>Member</strong> first.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="card tasks-panel">
          <h2 className="section-title">Tasks ({tasks.length})</h2>

          {showTaskForm && isAdmin && (
            <form className="task-form" onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Title</label>
                <input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assign to</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm((f) => ({ ...f, assignedTo: e.target.value }))}
                  >
                    <option value="">Unassigned</option>
                    {teamOptions().map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                Create Task
              </button>
            </form>
          )}

          {tasks.length === 0 ? (
            <p className="empty-hint">No tasks in this project yet.</p>
          ) : (
            <ul className="task-cards">
              {tasks.map((t) => (
                <li key={t._id} className={`task-card-item ${isOverdue(t) ? 'overdue' : ''}`}>
                  <div className="task-card-head">
                    <strong>{t.title}</strong>
                    <div className="task-badges">
                      <span className={`badge badge-${t.status}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                      {isOverdue(t) && <span className="badge badge-overdue">Overdue</span>}
                    </div>
                  </div>
                  {t.description && <p className="task-desc">{t.description}</p>}
                  <div className="task-card-meta">
                    <span>Assignee: {t.assignedTo?.name || 'Unassigned'}</span>
                    <span>
                      Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div className="task-card-actions">
                    {canEditTask(t) && (
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t._id, e.target.value)}
                        className="status-select"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteTask(t._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
