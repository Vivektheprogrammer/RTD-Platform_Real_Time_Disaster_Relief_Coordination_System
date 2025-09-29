import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RegisterVictim from './pages/auth/RegisterVictim';
import RegisterNGO from './pages/auth/RegisterNGO';
import RegisterVolunteer from './pages/auth/RegisterVolunteer';
import RegisterGovernment from './pages/auth/RegisterGovernment';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

// Victim Pages
import VictimDashboard from './pages/victim/VictimDashboard';
import CreateRequest from './pages/victim/CreateRequest';
import RequestDetail from './pages/victim/RequestDetail';
import EditRequest from './pages/victim/EditRequest';

// NGO Pages
import NgoDashboard from './pages/ngo/NgoDashboard';
import CreateOffer from './pages/ngo/CreateOffer';
import OfferDetail from './pages/ngo/OfferDetail';
import EditOffer from './pages/ngo/EditOffer';
import RequestsList from './pages/ngo/RequestsList';
import NgoRequestDetail from './pages/ngo/NgoRequestDetail';
import GovDashboard from './pages/government/GovDashboard';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminSetup from './pages/admin/AdminSetup';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import PendingApprovals from './pages/admin/PendingApprovals';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import ContentManagement from './pages/admin/ContentManagement';

// Map Page
import MapPage from './pages/map/MapPage';

// Protected Route
import ProtectedRoute, { RoleRoute } from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
        </Route>
        
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/victim" element={<RegisterVictim />} />
          <Route path="/register/ngo" element={<RegisterNGO />} />
          <Route path="/register/volunteer" element={<RegisterVolunteer />} />
          <Route path="/register/government" element={<RegisterGovernment />} />
        </Route>
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Government routes (no approvals in UI) */}
            <Route element={<RoleRoute roles={["government"]} />}>
              <Route path="/government/dashboard" element={<GovDashboard />} />
            </Route>

            {/* Victim routes */}
            <Route element={<RoleRoute roles={["victim"]} />}>
              <Route path="/victim/dashboard" element={<VictimDashboard />} />
              <Route path="/victim/requests/create" element={<CreateRequest />} />
              <Route path="/victim/requests/:requestId" element={<RequestDetail />} />
              <Route path="/victim/requests/:requestId/edit" element={<EditRequest />} />
            </Route>

            {/* NGO routes */}
            <Route element={<RoleRoute roles={["ngo"]} />}>
              <Route path="/ngo/dashboard" element={<NgoDashboard />} />
              <Route path="/ngo/requests" element={<RequestsList />} />
              <Route path="/ngo/requests/:requestId" element={<NgoRequestDetail />} />
              <Route path="/ngo/offers/create" element={<CreateOffer />} />
              <Route path="/ngo/offers/:offerId" element={<OfferDetail />} />
              <Route path="/ngo/offers/:offerId/edit" element={<EditOffer />} />
            </Route>

            {/* Map route */}
            <Route path="/map" element={<MapPage />} />
          </Route>
        </Route>
        
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/setup" element={<AdminSetup />} />
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="approvals" element={<PendingApprovals />} />
          <Route path="content" element={<ContentManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
}

export default App;