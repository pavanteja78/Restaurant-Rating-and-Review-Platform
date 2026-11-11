import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Alert, Field } from '../components/Common.jsx';
import { userErrors } from '../validators.js';
import { AUTH_IMAGE } from '../cover.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const v = userErrors(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate('/', { replace: true });
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
          <p className="kicker">Join the guide</p>
          <h2>Write the review someone will trust next week.</h2>
          <p>Customer accounts can rate, revise, and keep a personal map of favourite tables.</p>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <p className="kicker" style={{ color: '#b8901a' }}>New guest</p>
          <h1>Create your account</h1>
          <p className="lead">Join as a customer to discover restaurants and share reviews.</p>
          <form onSubmit={submit} noValidate>
            <Alert error={error} />
            <Field label="Name" error={errors.name}><input value={form.name} onChange={set('name')} autoComplete="name" /></Field>
            <Field label="Email" error={errors.email}><input type="email" value={form.email} onChange={set('email')} autoComplete="email" /></Field>
            <Field label="Password" error={errors.password}>
              <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
            </Field>
            <p className="hint">8 to 16 characters with an uppercase letter, a lowercase letter, a number and a special character.</p>
            <button className="btn btn-gold" disabled={busy}>{busy ? 'Creating account...' : 'Take a seat'}</button>
          </form>
          <p className="aside">Already registered? <Link to="/login">Log in</Link></p>
        </div>
      </div>
    </section>
  );
}
