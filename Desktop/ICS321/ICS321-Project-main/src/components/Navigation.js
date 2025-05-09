import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
     await logout();
     navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">Soccer@KFUPM</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li><Link className="nav-link" to="/">Home</Link></li>
            {!user ? (
               <>
                   <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
                   <li className="nav-item"><Link className="nav-link" to="/signup">Signup</Link></li>
               </>
            ) : (
               <>
                 {user.role === 'admin' && <li className="nav-item"><Link className="nav-link" to="/admin">Admin Dashboard</Link></li>}
                 {user.role === 'guest' && <li className="nav-item"><Link className="nav-link" to="/guest">Guest Dashboard</Link></li>}
                 <li className="nav-item">
                    <button className="btn btn-link nav-link" onClick={handleLogout}>
                        Logout ({user.username})
                    </button>
                 </li>
               </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;