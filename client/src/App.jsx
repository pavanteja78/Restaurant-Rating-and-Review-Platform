import { Routes, Route } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Restaurants from './pages/Restaurants.jsx';
import RestaurantDetail from './pages/RestaurantDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminRestaurants from './pages/AdminRestaurants.jsx';
import AdminReviews from './pages/AdminReviews.jsx';

export default function App() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="boot">
        <div className="spinner" aria-hidden="true" />
        <p>Setting the table…</p>
      </div>
    );
  }
  return (
    <div className="app">
      <Navbar />
      <main className="stage">
        <Routes>
          <Route path="/" element={<Restaurants />} />
          <Route path="/restaurants/:id" element={<RestaurantDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/owner" element={<ProtectedRoute roles={['owner']}><div className="page"><OwnerDashboard /></div></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><div className="page"><AdminDashboard /></div></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><div className="page"><AdminUsers /></div></ProtectedRoute>} />
          <Route path="/admin/restaurants" element={<ProtectedRoute roles={['admin']}><div className="page"><AdminRestaurants /></div></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute roles={['admin']}><div className="page"><AdminReviews /></div></ProtectedRoute>} />
          <Route path="*" element={
            <section className="lost">
              <p className="kicker">404</p>
              <h1>This table is empty.</h1>
              <p className="page-note">The page you wanted isn’t on the menu. <a href="/">Return to restaurants</a></p>
            </section>
          } />
        </Routes>
      </main>
      <footer className="site-footer">Tablemark · find a table · leave an honest mark</footer>
    </div>
  );
}
