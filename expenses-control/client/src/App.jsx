import React from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PageTransition from './components/PageTransition';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import GroupDetail from './pages/GroupDetail';
import AddExpense from './pages/AddExpense';
import EditExpense from './pages/EditExpense';
import SettleUp from './pages/SettleUp';
import Friends from './pages/Friends';
import Activity from './pages/Activity';
import Account from './pages/Account';
import TwoFALogin from './pages/TwoFALogin';
import TwoFASetup from './pages/TwoFASetup';
import SearchExpenses from './pages/SearchExpenses';
import { SkeletonGroupGrid } from './components/SkeletonLoaders';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-slate-50 pt-6 px-4">
      <div className="max-w-lg mx-auto">
        <SkeletonGroupGrid count={4} />
      </div>
    </div>
  );
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const location = useLocation();

  return (
    <PageTransition key={location.pathname}>
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/2fa-login" element={<TwoFALogin />} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchExpenses /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/2fa-setup" element={<ProtectedRoute><TwoFASetup /></ProtectedRoute>} />
        
        <Route path="/group/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
        <Route path="/add-expense" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/add-expense/:groupId" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
        <Route path="/edit-expense/:groupId/:expenseId" element={<ProtectedRoute><EditExpense /></ProtectedRoute>} />
        <Route path="/settle/:groupId" element={<ProtectedRoute><SettleUp /></ProtectedRoute>} />
      </Routes>
    </PageTransition>
  );
}

export default App;