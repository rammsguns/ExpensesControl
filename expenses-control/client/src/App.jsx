import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import GroupDetail from './pages/GroupDetail';
import AddExpense from './pages/AddExpense';
import SettleUp from './pages/SettleUp';
import Friends from './pages/Friends';
import Activity from './pages/Activity';
import Account from './pages/Account';
import TwoFALogin from './pages/TwoFALogin';
import TwoFASetup from './pages/TwoFASetup';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/2fa-login" element={<TwoFALogin />} />
      
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
      <Route path="/2fa-setup" element={<ProtectedRoute><TwoFASetup /></ProtectedRoute>} />
      
      <Route path="/group/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
      <Route path="/add-expense/:groupId" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
      <Route path="/settle/:groupId" element={<ProtectedRoute><SettleUp /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;