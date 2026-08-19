import { getFontOption } from '../theme.js';

export default function ThemePreviewCard({ theme }) {
  const isDark = theme.mode === 'dark';
  const font = getFontOption(theme.fontFamily);
  const accent = theme.accentColor || '#4f46e5';

  const bg = isDark ? '#12141f' : '#ffffff';
  const bgAlt = isDark ? '#1a1d2b' : '#f6f7fb';
  const ink = isDark ? '#f1f5f9' : '#1e293b';
  const inkSoft = isDark ? '#a8b0c3' : '#64748b';
  const border = isDark ? '#2a2e42' : '#e6e8f0';

  return (
    <div
      className="theme-preview-card"
      style={{ background: bg, borderColor: border, fontFamily: font.stack }}
    >
      <div className="theme-preview-topbar" style={{ background: bgAlt, borderColor: border }}>
        <span style={{ background: '#f87171' }} />
        <span style={{ background: '#fbbf24' }} />
        <span style={{ background: '#34d399' }} />
      </div>
      <div className="theme-preview-body">
        <p className="theme-preview-eyebrow" style={{ color: accent }}>Frontend / UI Developer</p>
        <h3 style={{ color: ink }}>Hi, I'm Jaywardhan</h3>
        <p style={{ color: inkSoft }}>This is how your site's tone will look.</p>
        <div className="theme-preview-row">
          <span className="theme-preview-btn" style={{ background: accent }}>Get In Touch</span>
          <span className="theme-preview-pill" style={{ background: bgAlt, color: ink, borderColor: border }}>React.js</span>
          <span className="theme-preview-pill" style={{ background: bgAlt, color: ink, borderColor: border }}>UI Design</span>
        </div>
      </div>
    </div>
  );
}
