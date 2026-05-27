import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import './Profile.css';

export default function Profile() {
  const { showError } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProfile()
      .then((res) => setProfile(res.profile))
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return (
      <Layout>
        <div className="loading-inline">Loading profile...</div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <p className="empty-hint">Could not load profile.</p>
      </Layout>
    );
  }

  const { user: u, stats, projects } = profile;
  const isAdmin = u.role === 'admin';

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>My profile</h1>
          <p>Account details and activity summary</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="card profile-card">
          <h2 className="section-title">Account</h2>
          <dl className="profile-dl">
            <div>
              <dt>Name</dt>
              <dd>{u.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{u.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>
                <span className={`badge badge-${u.role}`}>{u.role}</span>
              </dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd className="profile-mono">{u.id}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>{new Date(u.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{new Date(u.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        <div className="card profile-card">
          <h2 className="section-title">Statistics</h2>
          <div className="stats-row profile-stats">
            <div className="stat-card">
              <span className="stat-label">Projects</span>
              <span className="stat-value">{stats.projectCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Assigned tasks</span>
              <span className="stat-value">{stats.assignedTaskCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Unread alerts</span>
              <span className="stat-value">{stats.unreadNotifications}</span>
            </div>
            {isAdmin && stats.totalTasksInProjects != null && (
              <div className="stat-card">
                <span className="stat-label">Tasks in my projects</span>
                <span className="stat-value">{stats.totalTasksInProjects}</span>
              </div>
            )}
          </div>

          <h3 className="profile-subtitle">Assigned tasks by status</h3>
          <ul className="profile-breakdown">
            <li>
              To do: <strong>{stats.statusCounts.todo}</strong>
            </li>
            <li>
              In progress: <strong>{stats.statusCounts.in_progress}</strong>
            </li>
            <li>
              Done: <strong>{stats.statusCounts.done}</strong>
            </li>
          </ul>

          <h3 className="profile-subtitle">Assigned tasks by priority</h3>
          <ul className="profile-breakdown">
            <li>
              High: <strong>{stats.priorityCounts.high}</strong>
            </li>
            <li>
              Medium: <strong>{stats.priorityCounts.medium}</strong>
            </li>
            <li>
              Low: <strong>{stats.priorityCounts.low}</strong>
            </li>
          </ul>

          {isAdmin && (
            <p className="empty-hint profile-hint">
              As admin, you manage {stats.activeProjects} active and {stats.archivedProjects}{' '}
              archived project(s).
            </p>
          )}
          {!isAdmin && (
            <p className="empty-hint profile-hint">
              Members see dashboard stats only for tasks assigned to them.
            </p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <h2 className="section-title">Your projects ({projects.length})</h2>
        {projects.length === 0 ? (
          <p className="empty-hint">No projects yet.</p>
        ) : (
          <ul className="profile-project-list">
            {projects.map((p) => (
              <li key={p.id}>
                <Link to={`/projects/${p.id}`}>{p.name}</Link>
                {p.status === 'archived' && (
                  <span className="badge badge-archived">Archived</span>
                )}
                <span className="profile-project-date">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
