import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../api/client';

function AuthFrame({ mode, children }) {
  return <main className="auth-page"><section className="auth-panel"><div className="auth-panel-inner"><Link to="/login" className="brand auth-brand"><span className="brand-mark">d</span><span>DevShelf</span></Link>{children}<div className="auth-footer">{mode === 'login' ? <Link to="/register">Create an account</Link> : <Link to="/login">Sign in</Link>}</div></div></section></main>;
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (isAuthenticated) return <Navigate to="/resources" replace />;
  const submit = async (event) => { event.preventDefault(); setError(''); setLoading(true); try { await login(form.email, form.password); navigate('/resources', { replace: true }); } catch (err) { setError(err.message && !err.response ? err.message : getApiError(err, 'Sign in failed. Check your details and try again.')); } finally { setLoading(false); } };
  return <AuthFrame mode="login"><h1 className="auth-title">Sign in</h1>{location.state?.registered && <div className="success-note" role="status">Account created. Sign in to continue.</div>}{error && <div className="inline-error auth-error" role="alert">{error}</div>}<form className="form-stack auth-form" onSubmit={submit}><label className="field"><span>Email</span><input autoFocus type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="field"><span>Password</span><input type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><button type="submit" className="button button-primary auth-submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button></form></AuthFrame>;
}

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ userName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (isAuthenticated) return <Navigate to="/resources" replace />;
  const submit = async (event) => { event.preventDefault(); setError(''); setLoading(true); try { await register(form.userName, form.email, form.password); navigate('/login', { replace: true, state: { registered: true } }); } catch (err) { setError(getApiError(err, 'Registration failed. Please check your details.')); } finally { setLoading(false); } };
  return <AuthFrame mode="register"><h1 className="auth-title">Create account</h1>{error && <div className="inline-error auth-error" role="alert">{error}</div>}<form className="form-stack auth-form" onSubmit={submit}><label className="field"><span>Username</span><input autoFocus autoComplete="username" required maxLength="80" value={form.userName} onChange={(event) => setForm({ ...form, userName: event.target.value })} /></label><label className="field"><span>Email</span><input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="field"><span>Password</span><input type="password" autoComplete="new-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><button type="submit" className="button button-primary auth-submit" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</button></form></AuthFrame>;
}
