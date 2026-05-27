import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import DashboardSkeleton from '../components/DashboardSkeleton';
import './Dashboard.css';

function StatusBar({ label, count, total, color }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="status-bar-item">
      <div className="status-bar-header">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="status-bar-track">
        <div className="status-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function daysUntil(dueDate) {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { showError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then((res) => setData(res.dashboard))
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <p className="empty-hint">Unable to load dashboard.</p>
      </Layout>
    );
  }

  const {
    projectCount,
    totalTasks,
    statusCounts,
    overdue,
    dueSoon = [],
    recentTasks,
    memberViewNote,
  } = data;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Hello, {user?.name} —{' '}
            {isAdmin
              ? 'manage projects and teams'
              : 'tasks assigned to you only'}
          </p>
          {memberViewNote && <p className="dashboard-note">{memberViewNote}</p>}
        </div>
        {isAdmin && (
          <Link to="/projects" className="btn btn-primary">
            Manage Projects
          </Link>
        )}
      </div>

      <div className="grid-3 stats-row">
        <div className="card stat-card">
          <span className="stat-label">Projects</span>
          <span className="stat-value">{projectCount}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total tasks</span>
          <span className="stat-value">{totalTasks}</span>
        </div>
        <div className="card stat-card stat-danger">
          <span className="stat-label">Overdue</span>
          <span className="stat-value">{overdue.length}</span>
        </div>
        <div className="card stat-card stat-warning">
          <span className="stat-label">Due in 3 days</span>
          <span className="stat-value">{dueSoon.length}</span>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-3">
        <div className="card">
          <h2 className="section-title">Task status overview</h2>
          <StatusBar label="To Do" count={statusCounts.todo} total={totalTasks} color="#8b9cb3" />
          <StatusBar
            label="In Progress"
            count={statusCounts.in_progress}
            total={totalTasks}
            color="#f59e0b"
          />
          <StatusBar label="Done" count={statusCounts.done} total={totalTasks} color="#22c55e" />
        </div>

        <div className="card">
          <h2 className="section-title">Due soon (3 days)</h2>
          {dueSoon.length === 0 ? (
            <p className="empty-hint">Nothing due in the next 3 days.</p>
          ) : (
            <ul className="task-list compact">
              {dueSoon.map((t) => (
                <li key={t._id}>
                  <Link to={`/projects/${t.project._id || t.project}`}>
                    <strong>{t.title}</strong>
                  </Link>
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                  <span className="task-meta">
                    Due in {daysUntil(t.dueDate)} day(s) —{' '}
                    {new Date(t.dueDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="section-title">Overdue tasks</h2>
          {overdue.length === 0 ? (
            <p className="empty-hint">No overdue tasks — great work!</p>
          ) : (
            <ul className="task-list compact">
              {overdue.map((t) => (
                <li key={t._id}>
                  <Link to={`/projects/${t.project._id || t.project}`}>
                    <strong>{t.title}</strong>
                  </Link>
                  <span className="badge badge-overdue">Overdue</span>
                  <span className="task-meta">
                    Due {new Date(t.dueDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <h2 className="section-title">Tasks by priority</h2>
        {recentTasks.length === 0 ? (
          <p className="empty-hint">No tasks yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <Link to={`/projects/${t.project._id || t.project}`}>{t.title}</Link>
                    </td>
                    <td>{t.project?.name || '—'}</td>
                    <td>
                      <span className={`badge badge-${t.priority || 'medium'}`}>
                        {t.priority || 'medium'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${t.status}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{t.assignedTo?.name || 'Unassigned'}</td>
                    <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
