import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CONTACT_ICONS } from './Icons.jsx';
import { formatRange, locationString } from '../utils.js';
import { applyTheme } from '../theme.js';

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

export default function SitePreviewOverlay({ content, onClose }) {
  const { profile, roles, skills, experience, education, languages, portfolio, visibility } = content;

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const themeVars = applyTheme(content.theme);
  const years = parseInt(String(profile.yearsExperience || '').match(/\d+/)?.[0] || '0', 10);
  const yearsSuffix = String(profile.yearsExperience || '').replace(/^\d+/, '');
  const companies = new Set((experience || []).map((e) => e.company).filter(Boolean)).size;
  const roleList = (roles && roles.length ? roles : [profile.title]).filter(Boolean);

  return createPortal(
    <div className="preview-overlay">
      <div className="preview-overlay-bar">
        <span>Previewing your site — nothing is saved yet</span>
        <button type="button" className="btn btn-primary" onClick={onClose}>Close Preview</button>
      </div>
      <div className="preview-overlay-scroll">
        <div className="site-root preview-frame" style={themeVars}>
          <aside className="sidebar preview-sidebar">
            <div className="sidebar-inner">
              <div className="avatar" aria-hidden="true">
                {profile.photoUrl ? <img src={profile.photoUrl} alt={profile.name} /> : initials(profile.name)}
              </div>
              <h1 className="profile-name">{profile.name}</h1>
              <p className="profile-title">{profile.title}</p>
              <p className="profile-location">{locationString(profile)}</p>
            </div>
          </aside>

          <main className="content preview-main">
            <section className="section hero">
              <div className="hero-inner in-view">
                <p className="eyebrow">{profile.eyebrow}</p>
                <h2 className="hero-title">Hi, I'm {profile.name}</h2>
                <p className="lead">{profile.tagline}</p>
                <p className="role-rotator-wrap">Currently working as <span>{roleList[0] || ''}</span></p>
                <div className="hero-actions">
                  <span className="btn btn-primary">Get In Touch</span>
                  <span className="btn btn-outline">View Experience</span>
                </div>
              </div>
            </section>

            <section className="stats-banner parallax-bg">
              <div className="stats-overlay">
                <div className="stat"><span className="num">{years}{yearsSuffix}</span><span className="label">Years Experience</span></div>
                <div className="stat"><span className="num">{companies}</span><span className="label">Companies</span></div>
                <div className="stat"><span className="num">{(experience || []).length}</span><span className="label">Roles Held</span></div>
                <div className="stat"><span className="num">{(skills || []).length}</span><span className="label">Core Skills</span></div>
              </div>
            </section>

            <section className="section">
              <h2 className="section-title in-view">About Me</h2>
              <div className="about-grid">
                <p className="summary in-view">{profile.summary || 'Coming soon — a summary will be added shortly.'}</p>
                <ul className="info-list in-view">
                  <li><span className="info-label">Location</span><span>{locationString(profile) || 'Coming soon'}</span></li>
                  <li><span className="info-label">Email</span><span>{profile.email || 'Coming soon'}</span></li>
                  <li><span className="info-label">Phone</span><span>{profile.phone || 'Coming soon'}</span></li>
                  <li><span className="info-label">LinkedIn</span><span>{profile.linkedin ? 'View Profile' : 'Coming soon'}</span></li>
                  <li>
                    <span className="info-label">Languages</span>
                    <span>{languages && languages.length ? languages.map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(', ') : 'Coming soon'}</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="section alt-bg">
              <h2 className="section-title in-view">Skills</h2>
              <p className="section-subtitle in-view">Tools and practices I use to build production front-ends</p>
              <div className="skills-grid">
                {skills && skills.length ? (
                  skills.map((skill) => <span key={skill} className="skill-pill in-view">{skill}</span>)
                ) : (
                  <p className="section-subtitle">Coming soon — skills will be added shortly.</p>
                )}
              </div>
            </section>

            <section className="section">
              <h2 className="section-title in-view">Experience</h2>
              <div className="timeline">
                {experience && experience.length ? (
                  experience.map((exp, i) => {
                    const companyLabel = exp.formerlyKnownAs ? `${exp.company} (formerly ${exp.formerlyKnownAs})` : exp.company;
                    const meta = [companyLabel, exp.location, formatRange(exp.startDate, exp.endDate, exp.current)].filter(Boolean).join(' · ');
                    return (
                      <div key={i} className="timeline-item in-view">
                        <div className={`timeline-dot${exp.current ? ' current' : ''}`}></div>
                        <div className="timeline-content">
                          {exp.current && <span className="timeline-badge">Current</span>}
                          <h3>{exp.title}</h3>
                          <span className="timeline-meta">{meta}</span>
                          {exp.description && <p>{exp.description}</p>}
                          {exp.note && <p className="coming-soon-inline">{exp.note}</p>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="section-subtitle">Coming soon — experience will be added shortly.</p>
                )}
              </div>
            </section>

            {visibility.education && (
              <section className="section alt-bg">
                <h2 className="section-title in-view">Education</h2>
                <div className="timeline">
                  {education && education.length ? (
                    education.map((ed, i) => (
                      <div key={i} className="timeline-item in-view">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <h3>{ed.degree}</h3>
                          <span className="timeline-meta">{[ed.institution, formatRange(ed.startDate, ed.endDate, false)].filter(Boolean).join(' · ')}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="section-subtitle">Coming soon — education details will be added shortly.</p>
                  )}
                </div>
              </section>
            )}

            {visibility.portfolio && (
              <section className="section">
                <h2 className="section-title in-view">Portfolio</h2>
                {portfolio && portfolio.length ? (
                  <div className="skills-grid">
                    {portfolio.map((item, i) => (
                      <div key={i} className="contact-card in-view">
                        <span className="contact-card-label">{item.title}</span>
                        {item.description && <span>{item.description}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="coming-soon-panel in-view">
                    <h3>Coming Soon</h3>
                    <p>Project case studies aren't published yet.</p>
                  </div>
                )}
              </section>
            )}

            <section className="section alt-bg">
              <h2 className="section-title in-view">Get In Touch</h2>
              <p className="section-subtitle in-view">Open to new opportunities and collaborations — send a message any time</p>
              <div className="contact-grid">
                <div className="contact-cards in-view">
                  {[
                    ['email', 'Email', profile.email],
                    ['phone', 'Phone', profile.phone],
                    ['linkedin', 'LinkedIn', profile.linkedin ? 'View Profile' : ''],
                    ['location', 'Location', locationString(profile)],
                  ].map(([key, label, value]) => {
                    const Icon = CONTACT_ICONS[key];
                    return (
                      <div key={key} className="contact-card">
                        <Icon />
                        <span className="contact-card-label">{label}</span>
                        <span>{value || 'Coming soon'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <footer className="footer">
              <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
            </footer>
          </main>
        </div>
      </div>
    </div>,
    document.body
  );
}
