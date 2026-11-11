import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Alert } from '../components/Common.jsx';
import RatingDistribution from '../components/RatingDistribution.jsx';
import { ratingText } from '../components/Stars.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { api('/admin/stats').then(setStats).catch(setError); }, []);

  if (!stats) return <><h1>Dashboard</h1><Alert error={error} />{!error && <p className="page-note">Loading...</p>}</>;
  const total = stats.distribution.reduce((s, d) => s + d.count, 0);
  return (
    <>
      <p className="kicker" style={{ color: '#b8901a' }}>Operations</p>
      <h1>Dashboard</h1>
      <div className="stat-strip">
        <div><strong>{stats.totalUsers}</strong><span>Total users</span></div>
        <div><strong>{stats.totalRestaurants}</strong><span>Total restaurants</span></div>
        <div><strong>{stats.totalReviews}</strong><span>Total reviews</span></div>
        <div><strong>{stats.averagePlatformRating === null ? 'No ratings yet' : ratingText(stats.averagePlatformRating)}</strong><span>Average platform rating</span></div>
      </div>
      <div className="two-col">
        <section>
          <h2>Platform rating distribution</h2>
          {total === 0 ? <p className="page-note">No ratings yet.</p> : <RatingDistribution distribution={stats.distribution} />}
        </section>
        <section>
          <h2>Users by role</h2>
          <ul className="plain">
            <li><span>Customers</span><strong>{stats.usersByRole.customer || 0}</strong></li>
            <li><span>Restaurant owners</span><strong>{stats.usersByRole.owner || 0}</strong></li>
            <li><span>Administrators</span><strong>{stats.usersByRole.admin || 0}</strong></li>
          </ul>
        </section>
      </div>
    </>
  );
}
