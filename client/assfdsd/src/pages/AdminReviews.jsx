import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Alert, Notice, Pager, fmtDate, useDebounced } from '../components/Common.jsx';
import { Stars } from '../components/Stars.jsx';

export default function AdminReviews() {
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    api('/admin/reviews', { params: { search: debounced, rating, page, limit: 10 } }).then((d) => { setData(d); setError(null); }).catch(setError);
  }, [debounced, rating, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debounced, rating]);

  const remove = async (rv) => {
    if (!window.confirm('Remove this review permanently?')) return;
    setNotice('');
    try { await api(`/reviews/${rv._id}`, { method: 'DELETE' }); setNotice('Review removed.'); load(); } catch (e) { setError(e); }
  };

  return (
    <>
      <h1>Reviews</h1>
      <Alert error={error} /><Notice>{notice}</Notice>
      <div className="filters">
        <input type="search" placeholder="Search by review text, restaurant or customer" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search reviews" />
        <select value={rating} onChange={(e) => setRating(e.target.value)} aria-label="Filter by rating">
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'star' : 'stars'}</option>)}
        </select>
      </div>
      {data?.reviews.length === 0 && <p className="page-note">No reviews match your search.</p>}
      {data?.reviews.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Restaurant</th><th>Customer</th><th>Rating</th><th>Review</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {data.reviews.map((rv) => (
                <tr key={rv._id}>
                  <td>{rv.restaurant ? <Link to={`/restaurants/${rv.restaurant._id}`}>{rv.restaurant.name}</Link> : 'Deleted'}</td>
                  <td>{rv.customer ? `${rv.customer.name}` : 'Former user'}<small className="block">{rv.customer?.email}</small></td>
                  <td><Stars value={rv.rating} /></td>
                  <td className="wrap">{rv.comment}</td>
                  <td>{fmtDate(rv.createdAt)}</td>
                  <td><button className="btn btn-danger btn-small" onClick={() => remove(rv)}>Remove</button></td>
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
