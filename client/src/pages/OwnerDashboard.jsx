import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Alert, Field, Notice, fmtDate } from '../components/Common.jsx';
import { Stars, ratingText } from '../components/Stars.jsx';
import RatingDistribution from '../components/RatingDistribution.jsx';

const FIELDS = [
  ['location', 'Location'], ['cuisine', 'Cuisine'], ['address', 'Address'],
  ['phone', 'Phone'], ['openingHours', 'Opening hours'],
];

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [d, r] = await Promise.all([api('/owner/restaurant'), api('/owner/reviews')]);
      setData(d); setReviews(r.reviews);
      const x = d.restaurant;
      setForm({ location: x.location, cuisine: x.cuisine, address: x.address, phone: x.phone, openingHours: x.openingHours, description: x.description });
      setError(null);
    } catch (e) { setError(e); }
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setError(null); setNotice(''); setErrors({});
    if (!form.location?.trim() || !form.cuisine?.trim()) {
      setErrors({ location: !form.location?.trim() ? 'Location is required.' : undefined, cuisine: !form.cuisine?.trim() ? 'Cuisine is required.' : undefined });
      return;
    }
    setBusy(true);
    try {
      await api(`/restaurants/${data.restaurant._id}`, { method: 'PUT', body: form });
      setNotice('Restaurant details saved.');
      load();
    } catch (err) { setError(err); setErrors(err.errors || {}); } finally { setBusy(false); }
  };

  if (!data) return <><h1>My restaurant</h1><Alert error={error} />{!error && <p className="page-note">Loading...</p>}</>;
  const r = data.restaurant;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <p className="kicker" style={{ color: '#b8901a' }}>Owner studio</p>
      <h1>{r.name}</h1>
      <div className="stat-strip">
        <div><strong>{r.averageRating === null ? 'No ratings yet' : ratingText(r.averageRating)}</strong><span>Average rating</span></div>
        <div><strong>{r.reviewCount}</strong><span>Reviews</span></div>
      </div>

      <div className="two-col">
        <section>
          <h2>Rating breakdown</h2>
          {data.totalRatings === 0 ? <p className="page-note">No ratings yet.</p> : <RatingDistribution distribution={data.distribution} />}
        </section>
        <section>
          <h2>Restaurant details</h2>
          <form onSubmit={save} noValidate>
            <Alert error={error} /><Notice>{notice}</Notice>
            {FIELDS.map(([k, label]) => (
              <Field key={k} label={label} error={errors[k]}><input value={form[k] || ''} onChange={set(k)} /></Field>
            ))}
            <Field label="Description" error={errors.description}><textarea rows="4" value={form.description || ''} onChange={set('description')} /></Field>
            <p className="hint">The name and owner can only be changed by an administrator.</p>
            <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save details'}</button>
          </form>
        </section>
      </div>

      <section className="card-block">
        <h2>Customer reviews</h2>
        {reviews.length === 0 ? <p className="page-note">No customer has reviewed your restaurant yet.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Customer</th><th>Email</th><th>Rating</th><th>Review</th><th>Date</th></tr></thead>
              <tbody>
                {reviews.map((rv) => (
                  <tr key={rv._id}>
                    <td>{rv.customer?.name || 'Former user'}</td>
                    <td>{rv.customer?.email || ''}</td>
                    <td><Stars value={rv.rating} /></td>
                    <td className="wrap">{rv.comment}</td>
                    <td>{fmtDate(rv.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
