import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { BLOCK_TYPES, emptyBlock } from '../components/blocks/BlockRenderer.jsx';

function HeadingEditor({ block, onChange }) {
  return (
    <>
      <div className="form-row">
        <label>Heading Text</label>
        <input value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
      </div>
      <div className="form-row">
        <label>Size</label>
        <select value={block.level} onChange={(e) => onChange({ ...block, level: e.target.value })}>
          <option value="h2">Large (H2)</option>
          <option value="h3">Medium (H3)</option>
        </select>
      </div>
    </>
  );
}

function TextEditor({ block, onChange }) {
  return (
    <div className="form-row">
      <label>Paragraph Text</label>
      <textarea rows="6" value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="Separate paragraphs with a blank line." />
    </div>
  );
}

function ImageEditor({ block, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload() {
    const file = fileRef.current.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = await api.uploadImage(file);
      onChange({ ...block, url: data.url });
      fileRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div className="upload-row">
        {block.url && <img className="photo-preview" style={{ borderRadius: 8 }} src={block.url} alt="" />}
        <div className="upload-controls">
          <input type="file" ref={fileRef} accept="image/png,image/jpeg,image/webp" />
          <button type="button" className="btn btn-outline" onClick={handleUpload} disabled={uploading}>{uploading ? 'Uploading…' : 'Upload Image'}</button>
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>
      <div className="form-row">
        <label>Caption (optional)</label>
        <input value={block.caption} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
      </div>
    </>
  );
}

function CardsEditor({ block, onChange }) {
  const items = block.items || [];
  const update = (idx, patch) => onChange({ ...block, items: items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
  const remove = (idx) => onChange({ ...block, items: items.filter((_, i) => i !== idx) });
  const add = () => onChange({ ...block, items: [...items, { title: '', description: '', url: '', imageUrl: '' }] });
  const loadMoreMode = block.loadMoreMode || 'none';

  return (
    <>
      <div className="card-list">
        {items.map((item, idx) => (
          <div className="entry-card" key={idx}>
            <div className="entry-card-header">
              <span>Card #{idx + 1}</span>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(idx)}>Remove</button>
            </div>
            <div className="field-grid">
              <div className="form-row"><label>Title</label><input value={item.title} onChange={(e) => update(idx, { title: e.target.value })} /></div>
              <div className="form-row"><label>Link URL</label><input value={item.url} onChange={(e) => update(idx, { url: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <label>Description</label>
              <textarea rows="2" value={item.description} onChange={(e) => update(idx, { description: e.target.value })} />
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-outline" onClick={add}>+ Add Card</button>
      </div>

      <div className="entry-card">
        <div className="entry-card-header"><span>Display Options</span></div>
        <div className="field-grid">
          <div className="form-row">
            <label>Show this many at first</label>
            <input
              type="number"
              min="1"
              max="60"
              value={block.initialCount ?? 6}
              onChange={(e) => onChange({ ...block, initialCount: parseInt(e.target.value, 10) || 1 })}
            />
          </div>
          <div className="form-row">
            <label>After that, show…</label>
            <select value={loadMoreMode} onChange={(e) => onChange({ ...block, loadMoreMode: e.target.value })}>
              <option value="none">Nothing — show all cards</option>
              <option value="loadMore">A "Load More" button</option>
              <option value="viewButton">A "View More" link (goes elsewhere)</option>
            </select>
          </div>
        </div>
        {loadMoreMode === 'viewButton' && (
          <div className="field-grid">
            <div className="form-row"><label>Link Button Label</label><input value={block.viewButtonLabel || ''} onChange={(e) => onChange({ ...block, viewButtonLabel: e.target.value })} placeholder="View More" /></div>
            <div className="form-row"><label>Link Button URL</label><input value={block.viewButtonUrl || ''} onChange={(e) => onChange({ ...block, viewButtonUrl: e.target.value })} placeholder="https://…" /></div>
          </div>
        )}
      </div>
    </>
  );
}

function CtaEditor({ block, onChange }) {
  return (
    <div className="field-grid">
      <div className="form-row"><label>Text</label><input value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} /></div>
      <div className="form-row"><label>Button Label</label><input value={block.buttonLabel} onChange={(e) => onChange({ ...block, buttonLabel: e.target.value })} /></div>
      <div className="form-row"><label>Button URL</label><input value={block.buttonUrl} onChange={(e) => onChange({ ...block, buttonUrl: e.target.value })} /></div>
    </div>
  );
}

function HtmlEditor({ block, onChange }) {
  return (
    <div className="form-row">
      <label>Custom HTML</label>
      <textarea rows="8" style={{ fontFamily: 'monospace' }} value={block.html} onChange={(e) => onChange({ ...block, html: e.target.value })} />
      <p className="hint">Rendered as-is on the page — only you can edit this, but double-check anything you paste in.</p>
    </div>
  );
}

const EDITORS = {
  heading: HeadingEditor,
  text: TextEditor,
  image: ImageEditor,
  cards: CardsEditor,
  cta: CtaEditor,
  html: HtmlEditor,
};

function BlockCard({ block, index, total, onChange, onRemove, onMove }) {
  const Editor = EDITORS[block.type];
  const label = BLOCK_TYPES.find((t) => t.type === block.type)?.label || block.type;
  return (
    <div className="entry-card">
      <div className="entry-card-header">
        <span>{label}</span>
        <div className="block-actions">
          <button type="button" className="btn btn-outline btn-sm" disabled={index === 0} onClick={() => onMove(-1)}>↑</button>
          <button type="button" className="btn btn-outline btn-sm" disabled={index === total - 1} onClick={() => onMove(1)}>↓</button>
          <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>Remove</button>
        </div>
      </div>
      {Editor && <Editor block={block} onChange={onChange} />}
    </div>
  );
}

export default function PageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [status, setStatus] = useState(null);
  const [addType, setAddType] = useState('heading');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.getAdminPages().then((pages) => {
      const found = pages.find((p) => p.id === id);
      if (!found) setNotFound(true);
      else setPage(found);
    });
  }, [id]);

  function flash(message, isError = false) {
    setStatus({ message, isError });
    setTimeout(() => setStatus(null), 3500);
  }

  if (notFound) {
    return (
      <div className="editor-body">
        <p className="hint">Page not found. <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/admin/pages')}>Back to Pages</button></p>
      </div>
    );
  }

  if (!page) return <div className="load-state"><p>Loading…</p></div>;

  function updateBlock(idx, next) {
    const blocks = page.blocks.map((b, i) => (i === idx ? next : b));
    setPage({ ...page, blocks });
  }

  function removeBlock(idx) {
    setPage({ ...page, blocks: page.blocks.filter((_, i) => i !== idx) });
  }

  function moveBlock(idx, dir) {
    const blocks = [...page.blocks];
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
    setPage({ ...page, blocks });
  }

  function addBlock() {
    setPage({ ...page, blocks: [...page.blocks, emptyBlock(addType)] });
  }

  async function handleSave(e) {
    e.preventDefault();
    flash('Saving…');
    try {
      const saved = await api.updatePage(page.id, page);
      setPage(saved);
      flash('Saved ✓');
    } catch (err) {
      flash(err.message, true);
    }
  }

  return (
    <form className="editor-body" onSubmit={handleSave}>
      <section className="panel">
        <h2>Page Settings</h2>
        <div className="field-grid">
          <div className="form-row">
            <label>Title</label>
            <input value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} required />
          </div>
          <div className="form-row">
            <label>Nav Label</label>
            <input value={page.navLabel} onChange={(e) => setPage({ ...page, navLabel: e.target.value })} placeholder="Shown in the sidebar menu" />
          </div>
        </div>
        <div className="form-row">
          <label>URL Slug</label>
          <input value={page.slug} onChange={(e) => setPage({ ...page, slug: e.target.value })} />
          <p className="hint">Page will be at /p/{page.slug}</p>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={Boolean(page.visible)} onChange={(e) => setPage({ ...page, visible: e.target.checked })} />
          <span>Show in site navigation</span>
        </label>
      </section>

      <section className="panel">
        <h2>Content Blocks</h2>
        <div className="card-list">
          {page.blocks.map((block, idx) => (
            <BlockCard
              key={block.id}
              block={block}
              index={idx}
              total={page.blocks.length}
              onChange={(next) => updateBlock(idx, next)}
              onRemove={() => removeBlock(idx)}
              onMove={(dir) => moveBlock(idx, dir)}
            />
          ))}
        </div>
        <div className="add-row">
          <select value={addType} onChange={(e) => setAddType(e.target.value)}>
            {BLOCK_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
          </select>
          <button type="button" className="btn btn-outline" onClick={addBlock}>+ Add Block</button>
        </div>
      </section>

      <div className="save-bar">
        <button type="submit" className="btn btn-primary">Save Page</button>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/pages')}>Back to Pages</button>
        {status && <span className={`save-status${status.isError ? ' error' : ''}`}>{status.message}</span>}
      </div>
    </form>
  );
}
