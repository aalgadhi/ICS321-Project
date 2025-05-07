import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import GuestDashboard from './pages/GuestDashboard';
import Navigation from './components/Navigation';
import MatchResultsPage from './pages/MatchResultsPage';
import HighestScorerPage from './pages/HighestScorerPage';
import RedCardPage from './pages/RedCardPage';
import TeamMembersPage from './pages/TeamMembersPage';
import SignupPage from './pages/SignupPage';


const ProtectedRoute = ({ element, allowedRoles }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
         return <Navigate to="/" />;
    }

    return element;
};


function App() {
  return (
    <Router>
      <AuthProvider>
         <Navigation />
         <div className="container mt-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />


              <Route
                path="/admin"
                element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />}
              />

               <Route
                path="/guest"
                element={<ProtectedRoute element={<GuestDashboard />} allowedRoles={['guest']} />}
              />
               <Route
                path="/guest/match-results"
                element={<ProtectedRoute element={<MatchResultsPage />} allowedRoles={['guest']} />}
              />
               <Route
                path="/guest/highest-scorer"
                element={<ProtectedRoute element={<HighestScorerPage />} allowedRoles={['guest']} />}
              />
               <Route
                path="/guest/red-cards"
                element={<ProtectedRoute element={<RedCardPage />} allowedRoles={['guest']} />}
              />
                <Route
                path="/guest/team-members/:teamId/:trId"
                element={<ProtectedRoute element={<TeamMembersPage />} allowedRoles={['guest']} />}
              />


              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
         </div>
      </AuthProvider>
    </Router>
  );
}

export default App;