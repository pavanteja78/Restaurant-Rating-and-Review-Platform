import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Alert, Field, Notice, Pager, useDebounced } from '../components/Common.jsx';
import { ratingText } from '../components/Stars.jsx';

const EMPTY = { name: '', location: '', cuisine: '', address: '', phone: '', openingHours: '', description: '', owner: '' };

export default function AdminRestaurants() {
  const [options, setOptions] = useState({ locations: [], cuisines: [] });
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [location, setLocation] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | restaurant id
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    api('/restaurants', { params: { search: debounced, location, cuisine, page, limit: 10 } }).then(setData).catch(setError);
    api('/restaurants/filters').then(setOptions).catch(() => {});
  }, [debounced, location, cuisine, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debounced, location, cuisine]);
  useEffect(() => { api('/admin/users', { params: { role: 'owner', limit: 100 } }).then((d) => setOwners(d.users)).catch(() => {}); }, []);

  const startNew = () => { setEditing('new'); setForm(EMPTY); setErrors({}); setError(null); setNotice(''); };
  const startEdit = (r) => {
    setEditing(r._id); setErrors({}); setError(null); setNotice('');
    setForm({ name: r.name, location: r.location, cuisine: r.cuisine, address: r.address || '', phone: r.phone || '', openingHours: r.openingHours || '', description: r.description || '', owner: r.owner?._id || '' });
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError(null); setErrors({}); setNotice('');
    const v = {};
    ['name', 'location', 'cuisine'].forEach((k) => { if (!form[k].trim()) v[k] = 'This field is required.'; });
    if (Object.keys(v).length) { setErrors(v); return; }
    const body = { ...form, owner: form.owner || null };
    try {
      if (editing === 'new') await api('/restaurants', { method: 'POST', body });
      else await api(`/restaurants/${editing}`, { method: 'PUT', body });
      setNotice(editing === 'new' ? 'Restaurant created.' : 'Restaurant updated.');
      setEditing(null); load();
    } catch (err) { setError(err); setErrors(err.errors || {}); }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete ${r.name}? All of its reviews will be deleted too.`)) return;
    setError(null); setNotice('');
    try { await api(`/restaurants/${r._id}`, { method: 'DELETE' }); setNotice(`${r.name} deleted.`); load(); } catch (err) { setError(err); }
  };

  return (
    <>
      <div className="head-row">
        <h1>Manage restaurants</h1>
        <button className="btn" onClick={editing ? () => setEditing(null) : startNew}>{editing ? 'Cancel' : 'Add restaurant'}</button>
      </div>
      <Alert error={error} /><Notice>{notice}</Notice>

      {editing && (
        <form className="panel" onSubmit={save} noValidate>
          <h2>{editing === 'new' ? 'New restaurant' : 'Edit restaurant'}</h2>
          <div className="grid-2">
            <Field label="Name" error={errors.name}><input value={form.name} onChange={set('name')} /></Field>
            <Field label="Location" error={errors.location}><input value={form.location} onChange={set('location')} /></Field>
            <Field label="Cuisine" error={errors.cuisine}><input value={form.cuisine} onChange={set('cuisine')} /></Field>
            <Field label="Phone" error={errors.phone}><input value={form.phone} onChange={set('phone')} /></Field>
            <Field label="Address" error={errors.address}><input value={form.address} onChange={set('address')} /></Field>
            <Field label="Opening hours" error={errors.openingHours}><input value={form.openingHours} onChange={set('openingHours')} /></Field>
            <Field label="Owner">
              <select value={form.owner} onChange={set('owner')}>
                <option value="">No owner assigned</option>
                {owners.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.email})</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description" error={errors.description}><textarea rows="3" value={form.description} onChange={set('description')} /></Field>
          <button className="btn">{editing === 'new' ? 'Create restaurant' : 'Save changes'}</button>
        </form>
      )}

      <div className="filters">
        <input type="search" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search restaurants" />
        <select value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Filter by location">
          <option value="">All locations</option>{options.locations.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} aria-label="Filter by cuisine">
          <option value="">All cuisines</option>{options.cuisines.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {data?.items.length === 0 && <p className="page-note">No restaurants match your filters.</p>}
      {data?.items.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Location</th><th>Cuisine</th><th>Rating</th><th>Reviews</th><th>Owner</th><th>Actions</th></tr></thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r._id}>
                  <td>{r.name}</td><td>{r.location}</td><td>{r.cuisine}</td>
                  <td>{ratingText(r.averageRating)}</td><td>{r.reviewCount}</td>
                  <td>{r.owner ? r.owner.name : <em>Unassigned</em>}</td>
                  <td className="row-actions">
                    <button className="btn btn-quiet btn-small" onClick={() => startEdit(r)}>Edit</button>
                    <button className="btn btn-danger btn-small" onClick={() => remove(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </>
  );
}
