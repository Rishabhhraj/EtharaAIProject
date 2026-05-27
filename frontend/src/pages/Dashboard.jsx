import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
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

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then((res) => setData(res.dashboard))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="loading-inline">Loading dashboard...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="alert alert-error">{error}</div>
      </Layout>
    );
  }

  const { projectCount, totalTasks, statusCounts, overdue, recentTasks } = data;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Hello, {user?.name} — {isAdmin ? 'manage projects and teams' : 'track your assigned tasks'}
          </p>
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
      </div>

      <div className="dashboard-grid">
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
        <h2 className="section-title">Recent tasks</h2>
        {recentTasks.length === 0 ? (
          <p className="empty-hint">No tasks yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
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
                      <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
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
