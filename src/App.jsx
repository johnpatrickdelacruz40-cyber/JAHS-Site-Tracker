import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SiteLocator from './pages/SiteLocator';

const ProtectedRoute = ({ children, user, isAuthLoading }) => {
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-blue-500 font-bold animate-pulse text-xl tracking-widest">VERIFYING SECURE CONNECTION...</div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        
        <Route path="/" element={<ProtectedRoute user={user} isAuthLoading={isAuthLoading}><Dashboard /></ProtectedRoute>} />
        <Route path="/locator" element={<ProtectedRoute user={user} isAuthLoading={isAuthLoading}><SiteLocator /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
  
}




