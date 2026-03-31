import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import API from '../api.js';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import Dashboard from './pages/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCheckingSession(false);
      return;
    }

    try {
      const res = await API.get('/users/me');
      setCurrentUser(res.data.user);
      setIsLoggedIn(true);
    } catch (error) {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setCurrentUser(null);
    } finally {
      setCheckingSession(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleLoginSuccess = async () => {
    await fetchCurrentUser();
  };

  const handleLogout = async () => {
    try {
      await API.post('/users/logout');
    } catch (error) {
      console.warn('Logout API error', error);
    }
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  if (checkingSession) {
    return <div className="loading">Checking session...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              <Dashboard currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/"
          element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;