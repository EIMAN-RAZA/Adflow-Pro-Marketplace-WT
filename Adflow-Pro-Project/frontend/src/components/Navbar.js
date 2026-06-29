import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = {
  client: '/client/dashboard',
  provider: '/provider/dashboard',
  moderator: '/moderator/dashboard',
  admin: '/admin/dashboard',
  super_admin: '/admin/dashboard'
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand brand-font">
          AdFlow<span>Pro</span>
        </Link>

        <div className="navbar-links">
          <Link to="/explore" className={`nav-link ${isActive('/explore') ? 'active' : ''}`}>Explore</Link>

          {user ? (
            <>
              <Link
                to={ROLE_HOME[user.role] || '/'}
                className={`nav-link ${isActive('/dashboard') || isActive('/provider') || isActive('/client') || isActive('/moderator') || isActive('/admin') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">Sign Out</button>
              <div className="avatar" style={{ marginLeft: 4 }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}