import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Pager, useDebounced } from '../components/Common.jsx';
import { Stars } from '../components/Stars.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import { HERO_IMAGE, restaurantCover } from '../cover.js';

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
      <section className="hero">
        <div className="hero-media" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
        <div className="hero-copy">
          <p className="kicker">The independent dining guide</p>
          <h1>Tables worth remembering.</h1>
          <p className="lead">A curated atlas of restaurants, scored by people who actually sat down, ordered, and stayed for dessert.</p>
          <div className="hero-stats">
            <div><strong>{options.cuisines.length || '—'}</strong><span>Cuisines</span></div>
            <div><strong>{options.locations.length || '—'}</strong><span>Cities</span></div>
            <div><strong>{data?.total ?? '—'}</strong><span>Restaurants</span></div>
          </div>
        </div>
      </section>

      <div className="search-dock">
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
          {filtered && <button className="btn btn-quiet" onClick={clear}>Clear</button>}
        </div>
      </div>

      <div className="wrap">
        <Alert error={error} />
        {loading && !data && (
          <ul className="gallery" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => <li key={n} className="skeleton" />)}
          </ul>
        )}
        {data && data.items.length === 0 && (
          <p className="page-note">No restaurants match these filters. Try a different name, location or cuisine.</p>
        )}

        <ul className="gallery" aria-busy={loading}>
          {data?.items.map((r, i) => (
            <li key={r._id} style={{ animationDelay: `${i * 70}ms` }}>
              <Link to={`/restaurants/${r._id}`} className="place">
                <div className="place-cover" style={{ backgroundImage: `url(${restaurantCover(r.name, r.cuisine)})` }}>
                  <ScoreRing value={r.averageRating} />
                </div>
                <div className="place-body">
                  <p className="chips"><span className="chip chip-soft">{r.cuisine}</span><span className="chip">{r.location}</span></p>
                  <h2>{r.name}</h2>
                  <div className="place-meta">
                    {r.averageRating !== null && <Stars value={r.averageRating} />}
                    <span>{r.reviewCount} {r.reviewCount === 1 ? 'review' : 'reviews'}</span>
                    {r.myRating && <span className="mine">You rated {r.myRating}/5</span>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {data && <Pager page={data.page} pages={data.pages} onPage={(p) => setQuery({ ...query, page: p })} />}
      </div>
    </>
  );
}
