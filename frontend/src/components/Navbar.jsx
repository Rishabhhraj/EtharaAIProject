import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <Logo size="md" />
        </Link>
        <nav className="navbar-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/profile">Profile</Link>
        </nav>
        <div className="navbar-user">
          <NotificationBell />
          <Link to="/profile" className="user-name hide-mobile" title="View profile">
            {user?.name}
          </Link>
          <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          {isAdmin && <span className="role-hint hide-mobile">Admin access</span>}
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
