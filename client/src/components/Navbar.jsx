import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/resources', label: 'Resources' },
  { to: '/snippets', label: 'Snippets' },
  { to: '/tasks', label: 'Tasks' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };
  return <aside className="sidebar">
    <NavLink to="/resources" className="brand" aria-label="DevShelf home"><span className="brand-mark">d</span><span>DevShelf</span></NavLink>
    <nav className="side-nav" aria-label="Main navigation">{links.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => 'side-link' + (isActive ? ' active' : '')}>{link.label}</NavLink>)}</nav>
    <div className="profile-row"><strong>{user?.userName || 'Developer'}</strong><button className="button button-quiet logout-button" onClick={handleLogout}>Log out</button></div>
  </aside>;
}
