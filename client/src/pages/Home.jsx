import { useEffect, useRef, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import Reveal from '../components/Reveal.jsx';
import Counter from '../components/Counter.jsx';
import EmailMenu from '../components/EmailMenu.jsx';
import { CONTACT_ICONS } from '../components/Icons.jsx';
import { formatRange, locationString } from '../utils.js';
import { api } from '../api.js';

function RoleRotator({ roles }) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const reducedMotion = useRef(matchMedia('(prefers-reduced-motion: reduce)').matches).current;

  useEffect(() => {
    if (reducedMotion || roles.length < 2) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % roles.length);
        setFading(false);
      }, 350);
    }, 2800);
    return () => clearInterval(timer);
  }, [roles, reducedMotion]);

  return <span className={fading ? 'fade-out' : ''}>{roles[index] || ''}</span>;
}

export default function Home() {
  const { content } = useOutletContext();
  const location = useLocation();
  const { profile, roles, skills, experience, education, languages, portfolio, visibility } = content;

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [location.hash]);

  const years = parseInt(String(profile.yearsExperience || '').match(/\d+/)?.[0] || '0', 10);
  const yearsSuffix = String(profile.yearsExperience || '').replace(/^\d+/, '');
  const companies = new Set((experience || []).map((e) => e.company).filter(Boolean)).size;
  const roleList = (roles && roles.length ? roles : [profile.title]).filter(Boolean);

  const contactItems = [
    ['phone', 'Phone', profile.phone, profile.phone ? `tel:${profile.phone.replace(/\s+/g, '')}` : '#'],
    ['linkedin', 'LinkedIn', profile.linkedin ? 'View Profile' : 'Coming soon', profile.linkedin || '#'],
    ['location', 'Location', locationString(profile) || 'Coming soon', '#'],
  ];

  const [contactStatus, setContactStatus] = useState({ state: 'idle', message: '' });

  async function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form.subject.value.trim();
    const message = form.message.value.trim();

    setContactStatus({ state: 'sending', message: 'Sending…' });
    try {
      await api.sendContact({ name, email, subject, message });
      setContactStatus({ state: 'success', message: "Message sent — I'll get back to you soon." });
      form.reset();
    } catch (err) {
      setContactStatus({ state: 'error', message: err.message || 'Could not send the message.' });
    }
  }

  return (
    <>
      <section id="home" className="section hero">
        <div className="hero-inner reveal in-view">
          <p className="eyebrow">{profile.eyebrow}</p>
          <h2 className="hero-title">Hi, I'm {profile.name}</h2>
          <p className="lead">{profile.tagline}</p>
          <p className="role-rotator-wrap">Currently working as <RoleRotator roles={roleList} /></p>
          <div className="hero-actions">
            <a href="#contact" className="btn btn-primary" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>Get In Touch</a>
            <a href="#experience" className="btn btn-outline" onClick={(e) => { e.preventDefault(); document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' }); }}>View Experience</a>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true"><span></span></div>
      </section>

      <Reveal as="section" className="stats-banner parallax-bg">
        <div className="stats-overlay">
          <div className="stat"><Counter target={years} suffix={yearsSuffix} /><span className="label">Years Experience</span></div>
          <div className="stat"><Counter target={companies} /><span className="label">Companies</span></div>
          <div className="stat"><Counter target={(experience || []).length} /><span className="label">Roles Held</span></div>
          <div className="stat"><Counter target={(skills || []).length} /><span className="label">Core Skills</span></div>
        </div>
      </Reveal>

      <section id="about" className="section">
        <Reveal as="h2" className="section-title">About Me</Reveal>
        <div className="about-grid">
          <Reveal as="p" className="summary">{profile.summary || 'Coming soon — a summary will be added shortly.'}</Reveal>
          <Reveal as="ul" className="info-list">
            <li><span className="info-label">Location</span><span>{locationString(profile) || 'Coming soon'}</span></li>
            <li><span className="info-label">Email</span>{profile.email ? <a href={`mailto:${profile.email}`}>{profile.email}</a> : <span>Coming soon</span>}</li>
            <li><span className="info-label">Phone</span>{profile.phone ? <a href={`tel:${profile.phone.replace(/\s+/g, '')}`}>{profile.phone}</a> : <span>Coming soon</span>}</li>
            <li><span className="info-label">LinkedIn</span>{profile.linkedin ? <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">View Profile</a> : <span>Coming soon</span>}</li>
            <li>
              <span className="info-label">Languages</span>
              <span>{languages && languages.length ? languages.map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(', ') : 'Coming soon'}</span>
            </li>
          </Reveal>
        </div>
      </section>

      <section id="skills" className="section alt-bg">
        <Reveal as="h2" className="section-title">Skills</Reveal>
        <Reveal as="p" className="section-subtitle">Tools and practices I use to build production front-ends</Reveal>
        <div className="skills-grid">
          {skills && skills.length ? (
            skills.map((skill) => <Reveal as="span" key={skill} className="skill-pill">{skill}</Reveal>)
          ) : (
            <p className="section-subtitle">Coming soon — skills will be added shortly.</p>
          )}
        </div>
      </section>

      <section id="experience" className="section">
        <Reveal as="h2" className="section-title">Experience</Reveal>
        <div className="timeline">
          {experience && experience.length ? (
            experience.map((exp, i) => {
              const companyLabel = exp.formerlyKnownAs ? `${exp.company} (formerly ${exp.formerlyKnownAs})` : exp.company;
              const meta = [companyLabel, exp.location, formatRange(exp.startDate, exp.endDate, exp.current)].filter(Boolean).join(' · ');
              return (
                <Reveal as="div" key={i} className="timeline-item">
                  <div className={`timeline-dot${exp.current ? ' current' : ''}`}></div>
                  <div className="timeline-content">
                    {exp.current && <span className="timeline-badge">Current</span>}
                    <h3>{exp.title}</h3>
                    <span className="timeline-meta">{meta}</span>
                    {exp.description && <p>{exp.description}</p>}
                    {exp.note && <p className="coming-soon-inline">{exp.note}</p>}
                  </div>
                </Reveal>
              );
            })
          ) : (
            <p className="section-subtitle">Coming soon — experience will be added shortly.</p>
          )}
        </div>
      </section>

      {visibility.education && (
        <section id="education" className="section alt-bg">
          <Reveal as="h2" className="section-title">Education</Reveal>
          <div className="timeline">
            {education && education.length ? (
              education.map((ed, i) => (
                <Reveal as="div" key={i} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h3>{ed.degree}</h3>
                    <span className="timeline-meta">{[ed.institution, formatRange(ed.startDate, ed.endDate, false)].filter(Boolean).join(' · ')}</span>
                  </div>
                </Reveal>
              ))
            ) : (
              <p className="section-subtitle">Coming soon — education details will be added shortly.</p>
            )}
          </div>
        </section>
      )}

      {visibility.portfolio && (
        <section id="portfolio" className="section">
          <Reveal as="h2" className="section-title">Portfolio</Reveal>
          {portfolio && portfolio.length ? (
            <div className="skills-grid">
              {portfolio.map((item, i) => (
                <Reveal as="div" key={i} className="contact-card">
                  <span className="contact-card-label">{item.title}</span>
                  {item.description && <span>{item.description}</span>}
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="coming-soon-panel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              <h3>Coming Soon</h3>
              <p>Project case studies aren't published yet. Reach out directly if you'd like to see recent work in the meantime.</p>
              <a href="#contact" className="btn btn-outline" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>Get In Touch</a>
            </Reveal>
          )}
        </section>
      )}

      <section id="contact" className="section alt-bg">
        <Reveal as="h2" className="section-title">Get In Touch</Reveal>
        <Reveal as="p" className="section-subtitle">Open to new opportunities and collaborations — send a message any time</Reveal>

        <div className="contact-grid">
          <Reveal as="div" className="contact-cards">
            <EmailMenu email={profile.email} subject={`Hello ${profile.name}`} className="contact-card" triggerClassName="contact-card-trigger">
              <CONTACT_ICONS.email />
              <span className="contact-card-label">Email</span>
              <span>{profile.email || 'Coming soon'}</span>
            </EmailMenu>
            {contactItems.map(([key, label, value, href]) => {
              const Icon = CONTACT_ICONS[key];
              return (
                <a key={key} className="contact-card" href={href} target={key === 'linkedin' && profile.linkedin ? '_blank' : undefined} rel={key === 'linkedin' && profile.linkedin ? 'noopener noreferrer' : undefined}>
                  <Icon />
                  <span className="contact-card-label">{label}</span>
                  <span>{value || 'Coming soon'}</span>
                </a>
              );
            })}
          </Reveal>

          <Reveal as="form" className="contact-form" onSubmit={handleContactSubmit}>
            <div className="form-row"><label htmlFor="cf-name">Full Name</label><input type="text" id="cf-name" name="name" required /></div>
            <div className="form-row"><label htmlFor="cf-email">Email Address</label><input type="email" id="cf-email" name="email" required /></div>
            <div className="form-row"><label htmlFor="cf-subject">Subject</label><input type="text" id="cf-subject" name="subject" /></div>
            <div className="form-row"><label htmlFor="cf-message">Message</label><textarea id="cf-message" name="message" rows="5" required></textarea></div>
            <button type="submit" className="btn btn-primary" disabled={contactStatus.state === 'sending'}>
              {contactStatus.state === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
            {contactStatus.state !== 'idle' && (
              <p className={`form-status form-status-${contactStatus.state}`}>{contactStatus.message}</p>
            )}
            <p className="form-note">Sent straight to my inbox — I'll reply directly to the email address you enter above.</p>
          </Reveal>
        </div>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
      </footer>
    </>
  );
}
