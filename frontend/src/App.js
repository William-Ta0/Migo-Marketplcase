import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RoleSelection from './pages/RoleSelection';
import Profile from './pages/Profile';
import CreateItem from './pages/CreateItem';
import ItemDetails from './pages/ItemDetails';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/select-role" element={<RoleSelection />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            
            {/* Profile route - accessible to all authenticated users */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            
            {/* Customer routes */}
            <Route
              path="/items/:id"
              element={
                <PrivateRoute requiredRole="customer">
                  <ItemDetails />
                </PrivateRoute>
              }
            />
            
            {/* Vendor routes */}
            <Route
              path="/create-item"
              element={
                <PrivateRoute requiredRole="vendor">
                  <CreateItem />
                </PrivateRoute>
              }
            />
            
            {/* Admin routes */}
            <Route
              path="/admin/*"
              element={
                <PrivateRoute requiredRole="admin">
                  <div>Admin Dashboard (To be implemented)</div>
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
