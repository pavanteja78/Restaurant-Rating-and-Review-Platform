import { Routes, Route, Navigate } from 'react-router-dom';
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
  if (loading) return <p className="page-note">Loading...</p>;
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Restaurants />} />
          <Route path="/restaurants/:id" element={<RestaurantDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/owner" element={<ProtectedRoute roles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/restaurants" element={<ProtectedRoute roles={['admin']}><AdminRestaurants /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute roles={['admin']}><AdminReviews /></ProtectedRoute>} />
          <Route path="*" element={<p className="page-note">Page not found. <a href="/">Back to restaurants</a></p>} />
        </Routes>
      </main>
    </>
  );
}
