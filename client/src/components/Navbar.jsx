import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <Link to="/" className="brand">Tablemark</Link>
      <nav className="nav">
        <NavLink to="/" end>Restaurants</NavLink>
        {user?.role === 'owner' && <NavLink to="/owner">My restaurant</NavLink>}
        {user?.role === 'admin' && (
          <>
            <NavLink to="/admin" end>Dashboard</NavLink>
            <NavLink to="/admin/users">Users</NavLink>
            <NavLink to="/admin/restaurants">Manage restaurants</NavLink>
            <NavLink to="/admin/reviews">Reviews</NavLink>
          </>
        )}
      </nav>
      <div className="nav-user">
        {user ? (
          <>
            <span className="who">{user.name} <small>({user.role})</small></span>
            <button className="btn btn-quiet" onClick={() => { logout(); navigate('/'); }}>Log out</button>
          </>
        ) : (
          <>
            <Link className="btn btn-quiet" to="/login">Log in</Link>
            <Link className="btn" to="/register">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
