import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Field, Notice, Pager, fmtDate, useDebounced } from '../components/Common.jsx';
import { userErrors } from '../validators.js';

const EMPTY = { name: '', email: '', password: '', role: 'owner' };
const ROLE_LABEL = { admin: 'Administrator', owner: 'Restaurant owner', customer: 'Customer' };

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    api('/admin/users', { params: { search: debounced, role, page, limit: 10 } }).then(setData).catch(setError);
  }, [debounced, role, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debounced, role]);

  const run = async (fn, msg) => {
    setError(null); setNotice('');
    try { await fn(); setNotice(msg); load(); } catch (e) { setError(e); }
  };

  const create = async (e) => {
    e.preventDefault();
    setError(null); setNotice('');
    const v = userErrors(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    try {
      await api('/admin/users', { method: 'POST', body: { ...form, name: form.name.trim(), email: form.email.trim() } });
      setNotice(`${ROLE_LABEL[form.role]} account created.`);
      setForm(EMPTY); setShowForm(false); load();
    } catch (err) { setError(err); setErrors(err.errors || {}); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="head-row">
        <h1>Users</h1>
        <button className="btn" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : 'Create user'}</button>
      </div>
      <Alert error={error} /><Notice>{notice}</Notice>

      {showForm && (
        <form className="panel" onSubmit={create} noValidate>
          <h2>New account</h2>
          <div className="grid-2">
            <Field label="Name" error={errors.name}><input value={form.name} onChange={set('name')} /></Field>
            <Field label="Email" error={errors.email}><input type="email" value={form.email} onChange={set('email')} /></Field>
            <Field label="Password" error={errors.password}><input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
            <Field label="Role" error={errors.role}>
              <select value={form.role} onChange={set('role')}>
                <option value="owner">Restaurant owner</option>
                <option value="customer">Customer</option>
                <option value="admin">Administrator</option>
              </select>
            </Field>
          </div>
          <button className="btn">Create account</button>
        </form>
      )}

      <div className="filters">
        <input type="search" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="owner">Restaurant owners</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {data?.users.length === 0 && <p className="page-note">No users match your search.</p>}
      {data?.users.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {data.users.map((u) => {
                const self = u.id === me.id;
                return (
                  <tr key={u.id}>
                    <td>{u.name}{self && <small> (you)</small>}</td>
                    <td>{u.email}</td>
                    <td>
                      <select value={u.role} disabled={self} aria-label={`Role for ${u.name}`}
                        onChange={(e) => run(() => api(`/admin/users/${u.id}`, { method: 'PUT', body: { role: e.target.value } }), `Role updated for ${u.name}.`)}>
                        <option value="customer">Customer</option>
                        <option value="owner">Restaurant owner</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td>{u.isActive ? 'Active' : 'Deactivated'}</td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td className="row-actions">
                      <button className="btn btn-quiet btn-small" disabled={self}
                        onClick={() => run(() => api(`/admin/users/${u.id}`, { method: 'PUT', body: { isActive: !u.isActive } }), u.isActive ? `${u.name} deactivated.` : `${u.name} reactivated.`)}>
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                      <button className="btn btn-danger btn-small" disabled={self}
                        onClick={() => window.confirm(`Delete ${u.name}? Their reviews will be deleted too.`) && run(() => api(`/admin/users/${u.id}`, { method: 'DELETE' }), `${u.name} deleted.`)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </>
  );
}
