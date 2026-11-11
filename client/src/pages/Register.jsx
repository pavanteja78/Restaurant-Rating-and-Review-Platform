import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Alert, Field } from '../components/Common.jsx';
import { userErrors } from '../validators.js';

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
    <section className="auth">
      <h1>Create your account</h1>
      <form onSubmit={submit} noValidate>
        <Alert error={error} />
        <Field label="Name" error={errors.name}><input value={form.name} onChange={set('name')} autoComplete="name" /></Field>
        <Field label="Email" error={errors.email}><input type="email" value={form.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Password" error={errors.password}>
          <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
        </Field>
        <p className="hint">8 to 16 characters with an uppercase letter, a lowercase letter, a number and a special character.</p>
        <button className="btn" disabled={busy}>{busy ? 'Creating account...' : 'Sign up'}</button>
      </form>
      <p className="aside">Already registered? <Link to="/login">Log in</Link></p>
    </section>
  );
}
