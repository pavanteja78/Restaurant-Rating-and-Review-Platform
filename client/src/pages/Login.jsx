import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../auth.jsx';
import { Alert, Field } from '../components/Common.jsx';
import { EMAIL_RE } from '../validators.js';
import { AUTH_IMAGE } from '../cover.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const v = {};
    if (!EMAIL_RE.test(form.email.trim())) v.email = 'Enter a valid email address.';
    if (!form.password) v.password = 'Password is required.';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const user = await login(form.email.trim(), form.password);
      navigate(location.state?.from || homeFor(user), { replace: true });
    } catch (err) {
      setError(err);
      setErrors(err.errors || {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-split">
      <div className="auth-visual" style={{ backgroundImage: `url(${AUTH_IMAGE})` }}>
        <div>
          <p className="kicker">Members’ lounge</p>
          <h2>Come back to the tables you loved.</h2>
          <p>Your ratings travel with you — every honest mark helps the next diner choose well.</p>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <p className="kicker" style={{ color: '#b8901a' }}>Welcome back</p>
          <h1>Log in</h1>
          <p className="lead">Sign in to rate restaurants and keep your reviews.</p>
          <form onSubmit={submit} noValidate>
            <Alert error={error} />
            <Field label="Email" error={errors.email}>
              <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Password" error={errors.password}>
              <input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <button className="btn btn-gold" disabled={busy}>{busy ? 'Logging in...' : 'Enter Tablemark'}</button>
          </form>
          <p className="aside">New here? <Link to="/register">Create a customer account</Link></p>
        </div>
      </div>
    </section>
  );
}
