import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import PasswordInput from '../components/PasswordInput';
import { useToast } from '../context/ToastContext';
import './Auth.css';

export default function Signup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    adminInviteCode: '',
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const { showSuccess, showError: toastError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
      };
      if (form.adminInviteCode.trim()) {
        payload.adminInviteCode = form.adminInviteCode.trim();
      }
      const registered = await register(payload);
      if (registered.role === 'admin') {
        showSuccess('Admin account created. You can manage projects and teams.');
      } else {
        showSuccess('Member account created.');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <Logo size="lg" className="auth-logo" />
        <h1>Create account</h1>
        <p className="auth-subtitle">
          New accounts join as <strong>team members</strong>. The first signup becomes the
          project admin.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        {info && <div className="alert alert-success">{info}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              showStrength
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="adminInviteCode">Admin invite code (optional)</label>
            <input
              id="adminInviteCode"
              name="adminInviteCode"
              type="password"
              value={form.adminInviteCode}
              onChange={handleChange}
              placeholder="Only if provided by your organization"
              autoComplete="off"
            />
            <p className="field-hint">Leave blank for a standard member account.</p>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
