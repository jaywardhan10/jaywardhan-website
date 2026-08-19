import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import ParallaxBlobs from '../components/ParallaxBlobs.jsx';
import { api } from '../api.js';
import { applyTheme } from '../theme.js';

export default function SiteLayout() {
  const [content, setContent] = useState(null);
  const [navPages, setNavPages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.getContent(), api.getNavPages()])
      .then(([contentData, pagesData]) => {
        setContent(contentData);
        setNavPages(pagesData.filter((p) => p.visible));
        document.title = `${contentData.profile.name} — ${contentData.profile.title}`;
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="load-state error">
        <h2>Could not load content</h2>
        <p>The site could not reach its content API. If you are running this in development, make sure the server is running: <code>npm start</code> in the project folder.</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="load-state">
        <p>Loading…</p>
      </div>
    );
  }

  const themeVars = applyTheme(content.theme);

  return (
    <div className="site-root" style={themeVars}>
      <ParallaxBlobs />
      <Sidebar content={content} navPages={navPages} />
      <main className="content">
        <Outlet context={{ content, navPages, refreshContent: () => api.getContent().then(setContent) }} />
      </main>
    </div>
  );
}
