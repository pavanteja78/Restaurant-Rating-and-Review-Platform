import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Pager, useDebounced } from '../components/Common.jsx';
import { Stars, ratingText } from '../components/Stars.jsx';

export default function Restaurants() {
  const { user } = useAuth();
  const [options, setOptions] = useState({ locations: [], cuisines: [] });
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [query, setQuery] = useState({ search: '', location: '', cuisine: '', sort: 'name', page: 1 });
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api('/restaurants/filters').then(setOptions).catch(() => {}); }, []);
  useEffect(() => { setQuery((q) => (q.search === debounced ? q : { ...q, search: debounced, page: 1 })); }, [debounced]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api('/restaurants', { params: { ...query, limit: 8 } })
      .then((d) => { if (!cancelled) { setData(d); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, user]);

  const setFilter = (k) => (e) => setQuery({ ...query, [k]: e.target.value, page: 1 });
  const clear = () => { setSearch(''); setQuery({ search: '', location: '', cuisine: '', sort: 'name', page: 1 }); };
  const filtered = query.search || query.location || query.cuisine;

  return (
    <>
      <h1>Where are you eating next?</h1>
      <div className="filters">
        <input type="search" placeholder="Search by restaurant name" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search by name" />
        <select value={query.location} onChange={setFilter('location')} aria-label="Filter by location">
          <option value="">All locations</option>
          {options.locations.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={query.cuisine} onChange={setFilter('cuisine')} aria-label="Filter by cuisine">
          <option value="">All cuisines</option>
          {options.cuisines.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={query.sort} onChange={setFilter('sort')} aria-label="Sort">
          <option value="name">Sort by name</option>
          <option value="rating">Highest rated</option>
          <option value="reviews">Most reviewed</option>
        </select>
        {filtered && <button className="btn btn-quiet" onClick={clear}>Clear filters</button>}
      </div>

      <Alert error={error} />
      {loading && !data && <p className="page-note">Loading restaurants...</p>}
      {data && data.items.length === 0 && (
        <p className="page-note">No restaurants match these filters. Try a different name, location or cuisine.</p>
      )}

      <ul className="rows" aria-busy={loading}>
        {data?.items.map((r) => (
          <li key={r._id}>
            <Link to={`/restaurants/${r._id}`} className="row">
              <div className={`score ${r.averageRating === null ? 'none' : ''}`}>
                {r.averageRating === null ? <span>No ratings yet</span> : <strong>{ratingText(r.averageRating)}</strong>}
              </div>
              <div className="row-main">
                <h2>{r.name}</h2>
                <p><span>{r.cuisine}</span><span>{r.location}</span></p>
              </div>
              <div className="row-side">
                {r.averageRating !== null && <Stars value={r.averageRating} />}
                <span>{r.reviewCount} {r.reviewCount === 1 ? 'review' : 'reviews'}</span>
                {r.myRating && <span className="mine">Your rating: {r.myRating} of 5</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {data && <Pager page={data.page} pages={data.pages} onPage={(p) => setQuery({ ...query, page: p })} />}
    </>
  );
}
