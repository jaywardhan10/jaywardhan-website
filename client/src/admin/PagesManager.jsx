import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export default function PagesManager() {
  const [pages, setPages] = useState(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    api.getAdminPages().then(setPages);
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    const slug = slugify(title);
    if (!slug) {
      setError('Enter a page title first.');
      return;
    }
    setError('');
    setCreating(true);
    try {
      await api.createPage({ title: title.trim(), slug, navLabel: title.trim(), visible: false, blocks: [] });
      setTitle('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleVisible(page) {
    await api.updatePage(page.id, { ...page, visible: !page.visible });
    load();
  }

  async function handleDelete(page) {
    if (!window.confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    await api.deletePage(page.id);
    load();
  }

  if (!pages) return <div className="load-state"><p>Loading…</p></div>;

  return (
    <div className="editor-body">
      <section className="panel">
        <h2>Add a New Page</h2>
        <p className="hint">Creates a page you can build with content blocks, then show or hide it in the site navigation.</p>
        <form className="add-row" onSubmit={handleCreate}>
          <input type="text" placeholder="Page title, e.g. Projects" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating…' : '+ Create Page'}</button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </section>

      <section className="panel">
        <h2>Your Pages</h2>
        {pages.length === 0 ? (
          <p className="hint">No custom pages yet. Create one above.</p>
        ) : (
          <div className="card-list">
            {pages.map((page) => (
              <div className="entry-card page-row" key={page.id}>
                <div className="page-row-info">
                  <span className="page-row-title">{page.title}</span>
                  <span className="page-row-meta">/p/{page.slug} · {page.blocks.length} block{page.blocks.length === 1 ? '' : 's'}</span>
                </div>
                <div className="page-row-actions">
                  <label className="toggle">
                    <input type="checkbox" checked={Boolean(page.visible)} onChange={() => toggleVisible(page)} />
                    <span>Show in nav</span>
                  </label>
                  <Link className="btn btn-outline btn-sm" to={`/admin/pages/${page.id}`}>Edit</Link>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(page)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
