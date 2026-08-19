import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Login from './Login.jsx';
import ContentEditor from './ContentEditor.jsx';
import PagesManager from './PagesManager.jsx';
import PageEditor from './PageEditor.jsx';

function AdminHeader({ onLogout }) {
  const location = useLocation();
  const isPages = location.pathname.startsWith('/admin/pages');
  return (
    <header className="editor-header">
      <div className="editor-header-left">
        <h1>Site Admin</h1>
        <nav className="admin-tabs">
          <Link className={!isPages ? 'active' : ''} to="/admin">Content</Link>
          <Link className={isPages ? 'active' : ''} to="/admin/pages">Pages</Link>
        </nav>
      </div>
      <div className="editor-header-actions">
        <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline">View Site</a>
        <button type="button" className="btn btn-outline" onClick={onLogout}>Log Out</button>
      </div>
    </header>
  );
}

export default function AdminApp() {
  const { authenticated, login, logout } = useAuth();
  const navigate = useNavigate();

  if (authenticated === null) {
    return <div className="admin-root load-state"><p>Loading…</p></div>;
  }

  if (!authenticated) {
    return <div className="admin-root"><Login onLogin={login} /></div>;
  }

  async function handleLogout() {
    await logout();
    navigate('/admin');
  }

  return (
    <div className="admin-root editor-screen">
      <AdminHeader onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<ContentEditor />} />
        <Route path="/pages" element={<PagesManager />} />
        <Route path="/pages/:id" element={<PageEditor />} />
      </Routes>
    </div>
  );
}
