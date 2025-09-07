import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store/store';
import { fetchUserProfile } from './store/slices/authSlice';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Auth Route Component (redirect if already authenticated)
const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return !isAuthenticated ? children : <Navigate to="/" />;
};

// App Content Component
const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && isAuthenticated) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, token, isAuthenticated]);

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <LoginForm />
            </AuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRoute>
              <RegisterForm />
            </AuthRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<div className="p-6">Projects Page (Coming Soon)</div>} />
          <Route path="projects/new" element={<div className="p-6">New Project Page (Coming Soon)</div>} />
          <Route path="series" element={<div className="p-6">Series Page (Coming Soon)</div>} />
          <Route path="calendar" element={<div className="p-6">Calendar Page (Coming Soon)</div>} />
          <Route path="settings" element={<div className="p-6">Settings Page (Coming Soon)</div>} />
        </Route>

        {/* Catch all route route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
