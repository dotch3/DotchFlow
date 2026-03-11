// src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import GoalsPage from './pages/GoalsPage';
import StorePage from './pages/StorePage';
import ProfilePage from './pages/ProfilePage';

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? <Navigate to="/" replace /> : children;
}

export default function App() {
  const { token, refreshUser } = useAuthStore();

  useEffect(() => {
    if (token) refreshUser();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="store" element={<StorePage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
