import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import './NotificationBell.css';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const load = () => {
    api
      .getNotifications()
      .then((res) => {
        setUnreadCount(res.unreadCount || 0);
        setNotifications(res.notifications || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id) => {
    await api.markNotificationRead(id);
    load();
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead();
    load();
  };

  return (
    <div className="notification-bell">
      <button
        type="button"
        className="btn btn-secondary btn-sm bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        🔔
        {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-dropdown card">
          <div className="notification-dropdown-head">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="empty-hint">No notifications yet.</p>
          ) : (
            <ul className="notification-list">
              {notifications.map((n) => (
                <li key={n._id} className={n.read ? 'read' : ''}>
                  <p>{n.message}</p>
                  <span className="notification-time">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                  {!n.read && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => markRead(n._id)}>
                      Mark read
                    </button>
                  )}
                  {n.relatedProject && (
                    <Link
                      to={`/projects/${n.relatedProject}`}
                      className="notification-link"
                      onClick={() => setOpen(false)}
                    >
                      View project
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
