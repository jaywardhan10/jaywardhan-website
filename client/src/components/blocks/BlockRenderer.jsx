import { useState } from 'react';
import Reveal from '../Reveal.jsx';

function HeadingBlock({ block }) {
  const Tag = block.level === 'h3' ? 'h3' : 'h2';
  return <Reveal as={Tag} className="section-title">{block.text}</Reveal>;
}

function TextBlock({ block }) {
  const paragraphs = String(block.text || '').split(/\n{2,}/).filter(Boolean);
  return (
    <Reveal as="div" className="block-text">
      {paragraphs.length ? paragraphs.map((p, i) => <p key={i}>{p}</p>) : <p className="section-subtitle">Coming soon.</p>}
    </Reveal>
  );
}

function ImageBlock({ block }) {
  if (!block.url) {
    return (
      <Reveal className="coming-soon-panel">
        <h3>Coming Soon</h3>
        <p>No image has been uploaded for this block yet.</p>
      </Reveal>
    );
  }
  return (
    <Reveal as="figure" className="block-image">
      <img src={block.url} alt={block.caption || ''} />
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </Reveal>
  );
}

function CardsBlock({ block }) {
  const allItems = (block.items || []).filter((it) => it.title || it.description);
  const step = Math.max(1, block.initialCount || 6);
  const loadMoreMode = block.loadMoreMode || 'none';
  const [visibleCount, setVisibleCount] = useState(step);

  if (!allItems.length) {
    return (
      <Reveal className="coming-soon-panel">
        <h3>Coming Soon</h3>
        <p>Cards will be added to this section shortly.</p>
      </Reveal>
    );
  }

  const showPagination = loadMoreMode !== 'none' && allItems.length > step;
  const items = showPagination && loadMoreMode === 'loadMore' ? allItems.slice(0, visibleCount) : allItems.slice(0, showPagination ? step : allItems.length);
  const hasMore = loadMoreMode === 'loadMore' && visibleCount < allItems.length;

  return (
    <div className="block-cards-wrap">
      <div className="block-cards-grid">
        {items.map((item, i) => (
          <Reveal as="div" key={i} className="contact-card block-card">
            {item.imageUrl && <img className="block-card-image" src={item.imageUrl} alt="" />}
            {item.title && <span className="contact-card-label">{item.title}</span>}
            {item.description && <span>{item.description}</span>}
            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="block-card-link">Visit →</a>}
          </Reveal>
        ))}
      </div>

      {showPagination && loadMoreMode === 'loadMore' && hasMore && (
        <div className="block-cards-action">
          <button type="button" className="btn btn-outline" onClick={() => setVisibleCount((c) => c + step)}>
            Load More
          </button>
        </div>
      )}

      {showPagination && loadMoreMode === 'viewButton' && block.viewButtonUrl && (
        <div className="block-cards-action">
          <a className="btn btn-outline" href={block.viewButtonUrl} target="_blank" rel="noopener noreferrer">
            {block.viewButtonLabel || 'View More'}
          </a>
        </div>
      )}
    </div>
  );
}

function CtaBlock({ block }) {
  return (
    <Reveal as="div" className="block-cta">
      {block.text && <p>{block.text}</p>}
      {block.buttonLabel && (
        <a className="btn btn-primary" href={block.buttonUrl || '#'} target={block.buttonUrl ? '_blank' : undefined} rel="noopener noreferrer">
          {block.buttonLabel}
        </a>
      )}
    </Reveal>
  );
}

function HtmlBlock({ block }) {
  return <Reveal as="div" className="block-html" dangerouslySetInnerHTML={{ __html: block.html || '' }} />;
}

const REGISTRY = {
  heading: HeadingBlock,
  text: TextBlock,
  image: ImageBlock,
  cards: CardsBlock,
  cta: CtaBlock,
  html: HtmlBlock,
};

export default function BlockRenderer({ block }) {
  const Component = REGISTRY[block.type];
  if (!Component) return null;
  return <Component block={block} />;
}

export const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading' },
  { type: 'text', label: 'Paragraph Text' },
  { type: 'image', label: 'Image' },
  { type: 'cards', label: 'Card Grid' },
  { type: 'cta', label: 'Button / Call to Action' },
  { type: 'html', label: 'Custom HTML' },
];

export function emptyBlock(type) {
  const id = `b${Date.now()}${Math.floor(Math.random() * 1000)}`;
  switch (type) {
    case 'heading': return { id, type, text: '', level: 'h2' };
    case 'text': return { id, type, text: '' };
    case 'image': return { id, type, url: '', caption: '' };
    case 'cards': return { id, type, items: [], initialCount: 6, loadMoreMode: 'none', viewButtonLabel: 'View More', viewButtonUrl: '' };
    case 'cta': return { id, type, text: '', buttonLabel: '', buttonUrl: '' };
    case 'html': return { id, type, html: '' };
    default: return { id, type: 'text', text: '' };
  }
}
