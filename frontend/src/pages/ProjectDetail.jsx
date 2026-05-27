import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import TaskComments from '../components/TaskComments';
import './ProjectDetail.css';

const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
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
    priority: 'medium',
    dueDate: '',
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [addMemberIds, setAddMemberIds] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myPendingByTask, setMyPendingByTask] = useState({});
  const [requestStatusByTask, setRequestStatusByTask] = useState({});

  const isArchived = project?.status === 'archived';
  const readOnly = isArchived;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const projRes = await api.getProject(id);
      setProject(projRes.project);

      const taskRes = await api.getTasks(id);
      setTasks(taskRes.tasks);

      if (isAdmin) {
        const [memRes, reqRes] = await Promise.all([
          api.getMembers(),
          api.getPendingStatusRequests(id),
        ]);
        const projectMemberIds = new Set(
          (projRes.project.members || []).map((m) => (m._id || m).toString())
        );
        setMembers(
          (memRes.users || []).filter((m) => !projectMemberIds.has((m.id || m._id).toString()))
        );
        setPendingRequests(reqRes.requests || []);
      } else {
        const reqRes = await api.getMyStatusRequests(id);
        const byTask = {};
        for (const r of reqRes.requests || []) {
          const taskId = r.task?._id || r.task;
          byTask[taskId] = r;
        }
        setMyPendingByTask(byTask);
      }
    } catch (err) {
      setError(err.message);
      showError(err.message);
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
      setTaskForm({
        title: '',
        description: '',
        assignedTo: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
      });
      setShowTaskForm(false);
      showSuccess('Task created');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.updateTask(taskId, { status });
      showSuccess('Task status updated');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handlePriorityChange = async (taskId, priority) => {
    try {
      await api.updateTask(taskId, { priority });
      showSuccess('Task priority updated');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleRequestStatusChange = async (taskId) => {
    const requestedStatus = requestStatusByTask[taskId];
    if (!requestedStatus) {
      showError('Select a status to request');
      return;
    }
    try {
      await api.submitStatusRequest(taskId, requestedStatus);
      showSuccess('Status change request sent to admin');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await api.approveStatusRequest(requestId);
      showSuccess('Request approved');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm('Reject this status change request?')) return;
    try {
      await api.rejectStatusRequest(requestId);
      showSuccess('Request rejected');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleToggleArchive = async () => {
    const next = isArchived ? 'active' : 'archived';
    const label = next === 'archived' ? 'archive' : 'restore';
    if (!window.confirm(`${label} this project?`)) return;
    try {
      await api.updateProject(id, { status: next });
      showSuccess(next === 'archived' ? 'Project archived (read-only)' : 'Project restored');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const statusLabel = (s) => STATUSES.find((x) => x.value === s)?.label || s;

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      showSuccess('Task deleted');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleAddMembers = async () => {
    if (!addMemberIds.length) return;
    try {
      await api.addMembers(id, addMemberIds);
      setAddMemberIds([]);
      showSuccess('Members added');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await api.removeMember(id, memberId);
      showSuccess('Member removed');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const teamOptions = () => {
    const list = [...(project?.members || [])];
    if (
      project?.createdBy &&
      !list.find((m) => (m._id || m).toString() === project.createdBy._id?.toString())
    ) {
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
          <h1>
            {project.name}{' '}
            {isArchived && <span className="badge badge-archived">Archived</span>}
          </h1>
          <p>{project.description || 'No description'}</p>
        </div>
        <div className="page-header-actions">
          {isAdmin && (
            <>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleToggleArchive}>
                {isArchived ? 'Restore project' : 'Archive project'}
              </button>
              {!readOnly && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowTaskForm(!showTaskForm)}
                >
                  {showTaskForm ? 'Cancel' : '+ Add Task'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isArchived && (
        <div className="alert alert-error archived-banner">
          This project is archived and read-only. Restore it to make changes.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {isAdmin && pendingRequests.length > 0 && !readOnly && (
        <div className="card pending-requests-card">
          <h2 className="section-title">Pending status requests ({pendingRequests.length})</h2>
          <ul className="pending-requests-list">
            {pendingRequests.map((r) => (
              <li key={r._id} className="pending-request-item">
                <div>
                  <strong>{r.task?.title || 'Task'}</strong>
                  <span className="request-flow">
                    {statusLabel(r.currentStatus)} → {statusLabel(r.requestedStatus)}
                  </span>
                  <span className="request-meta">
                    by {r.requestedBy?.name} · {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="request-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleApproveRequest(r._id)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRejectRequest(r._id)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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
                {isAdmin && !readOnly && (
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
          {isAdmin && !readOnly && (
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
                  Everyone is already on the team, or no other members exist.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="card tasks-panel">
          <h2 className="section-title">Tasks ({tasks.length})</h2>

          {showTaskForm && isAdmin && !readOnly && (
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
                  <label>Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
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
                      <span className={`badge badge-${t.priority || 'medium'}`}>
                        {t.priority || 'medium'}
                      </span>
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
                    {isAdmin && !readOnly && (
                      <>
                        <select
                          value={t.priority || 'medium'}
                          onChange={(e) => handlePriorityChange(t._id, e.target.value)}
                          className="status-select priority-select"
                          title="Change task priority"
                          aria-label={`Priority for ${t.title}`}
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t._id, e.target.value)}
                          className="status-select"
                          title="Admin: update status directly"
                          aria-label={`Status for ${t.title}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                    {!isAdmin && canEditTask(t) && !readOnly && (
                      <div className="member-status-request">
                        {myPendingByTask[t._id] ? (
                          <span className="badge badge-pending">
                            Pending approval: {statusLabel(myPendingByTask[t._id].requestedStatus)}
                          </span>
                        ) : (
                          <>
                            <select
                              value={requestStatusByTask[t._id] || t.status}
                              onChange={(e) =>
                                setRequestStatusByTask((prev) => ({
                                  ...prev,
                                  [t._id]: e.target.value,
                                }))
                              }
                              className="status-select"
                            >
                              {STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={(requestStatusByTask[t._id] || t.status) === t.status}
                              onClick={() => handleRequestStatusChange(t._id)}
                            >
                              Request change
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {isAdmin && !readOnly && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteTask(t._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <TaskComments taskId={t._id} readOnly={readOnly} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
