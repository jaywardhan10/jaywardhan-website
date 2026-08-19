import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BlockRenderer from '../components/blocks/BlockRenderer.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api.js';

export default function CustomPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPage(null);
    setError(null);
    api.getPage(slug)
      .then((data) => {
        setPage(data);
        document.title = data.title;
      })
      .catch(() => setError('not-found'));
  }, [slug]);

  if (error) {
    return (
      <section className="section">
        <h2 className="section-title">Page not found</h2>
        <p className="section-subtitle">This page doesn't exist or isn't published yet.</p>
      </section>
    );
  }

  if (!page) {
    return (
      <section className="section">
        <p className="section-subtitle">Loading…</p>
      </section>
    );
  }

  return (
    <>
      <section className="section">
        <Reveal as="h1" className="hero-title page-title">{page.title}</Reveal>
        <div className="block-stack">
          {page.blocks && page.blocks.length ? (
            page.blocks.map((block) => <BlockRenderer key={block.id} block={block} />)
          ) : (
            <p className="section-subtitle">Coming soon — this page doesn't have any content yet.</p>
          )}
        </div>
      </section>
      <footer className="footer">
        <p>© {new Date().getFullYear()}. All rights reserved.</p>
      </footer>
    </>
  );
}
