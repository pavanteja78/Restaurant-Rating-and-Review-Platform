import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../auth.jsx';
import { Alert, Field } from '../components/Common.jsx';
import { EMAIL_RE } from '../validators.js';

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
    <section className="auth">
      <h1>Log in</h1>
      <form onSubmit={submit} noValidate>
        <Alert error={error} />
        <Field label="Email" error={errors.email}>
          <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button className="btn" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p className="aside">New here? <Link to="/register">Create a customer account</Link></p>
    </section>
  );
}
