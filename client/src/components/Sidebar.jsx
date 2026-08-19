import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NAV_ICONS, ContactIcon, PhoneIcon, LinkedinIcon, LocationIcon, PageIcon } from './Icons.jsx';
import EmailMenu from './EmailMenu.jsx';

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

const HOME_SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education', flag: 'education' },
  { id: 'portfolio', label: 'Portfolio', flag: 'portfolio' },
];

export default function Sidebar({ content, navPages }) {
  const [open, setOpen] = useState(false);
  const [cvNoteVisible, setCvNoteVisible] = useState(false);
  const [activeId, setActiveId] = useState('home');
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, visibility } = content;

  const onHome = location.pathname === '/';

  useEffect(() => {
    if (!onHome || !('IntersectionObserver' in window)) return;
    const ids = ['home', 'about', 'skills', 'experience', 'education', 'portfolio', 'contact'];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [onHome, content]);

  function goToSection(id) {
    setOpen(false);
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', id === 'home' ? '/' : `#${id}`);
      setActiveId(id);
    } else {
      navigate(`/#${id}`);
    }
  }

  function handleCvClick(e) {
    if (!profile.cvUrl) {
      e.preventDefault();
      setCvNoteVisible(true);
      setTimeout(() => setCvNoteVisible(false), 5000);
    }
  }

  const phoneHref = profile.phone ? `tel:${profile.phone.replace(/\s+/g, '')}` : '#';
  const locationText = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');

  return (
    <>
      <button
        className={`nav-toggle${open ? ' active' : ''}`}
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span></span><span></span><span></span>
      </button>

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-inner">
          <div className="avatar" aria-hidden="true">
            {profile.photoUrl ? <img src={profile.photoUrl} alt={profile.name} /> : initials(profile.name)}
          </div>
          <h1 className="profile-name">{profile.name}</h1>
          <p className="profile-title">{profile.title}</p>
          <p className="profile-location">
            <LocationIcon />
            <span>{locationText}</span>
          </p>

          <div className="social-row">
            <EmailMenu email={profile.email} subject={`Hello ${profile.name}`} className="social-icon" triggerClassName="social-icon-trigger">
              <ContactIcon />
            </EmailMenu>
            <a href={phoneHref} aria-label="Call" title="Call"><PhoneIcon /></a>
            <a href={profile.linkedin || '#'} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn"><LinkedinIcon /></a>
          </div>

          <div className="sidebar-actions">
            {profile.cvUrl ? (
              <a className="btn btn-primary" href={profile.cvUrl} download onClick={() => setOpen(false)}>Download CV</a>
            ) : (
              <button className="btn btn-primary" type="button" onClick={handleCvClick}>Download CV</button>
            )}
            <button className="btn btn-outline" type="button" onClick={() => goToSection('contact')}>Contact</button>
          </div>
          {cvNoteVisible && (
            <p className="sidebar-note">Coming soon — a downloadable CV isn't posted yet. Email me directly in the meantime.</p>
          )}

          <nav className="dot-nav" aria-label="Section navigation">
            {HOME_SECTIONS.filter((s) => !s.flag || visibility[s.flag]).map((s) => {
              const Icon = NAV_ICONS[s.id];
              const isActive = onHome && activeId === s.id;
              return (
                <a
                  key={s.id}
                  href={`/#${s.id}`}
                  data-tooltip={s.label}
                  className={isActive ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); goToSection(s.id); }}
                >
                  <Icon />
                </a>
              );
            })}

            {navPages.map((p) => {
              const isActive = location.pathname === `/p/${p.slug}`;
              return (
                <Link
                  key={p.id}
                  to={`/p/${p.slug}`}
                  data-tooltip={p.navLabel || p.title}
                  className={isActive ? 'active' : ''}
                  onClick={() => setOpen(false)}
                >
                  <PageIcon />
                </Link>
              );
            })}

            <a
              href="/#contact"
              data-tooltip="Contact"
              className={onHome && activeId === 'contact' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); goToSection('contact'); }}
            >
              <NAV_ICONS.contact />
            </a>
          </nav>

          <p className="rights">© {new Date().getFullYear()} {profile.name}</p>
        </div>
      </aside>
    </>
  );
}
