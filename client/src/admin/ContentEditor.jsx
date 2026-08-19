import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { FONT_OPTIONS } from '../theme.js';
import ThemePreviewCard from '../components/ThemePreviewCard.jsx';
import SitePreviewOverlay from '../components/SitePreviewOverlay.jsx';

function Field({ label, ...props }) {
  return (
    <div className="form-row">
      <label htmlFor={props.id}>{label}</label>
      <input {...props} />
    </div>
  );
}

function TagList({ items, onChange, placeholder }) {
  const [draft, setDraft] = useState('');

  function add() {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft('');
  }

  function remove(idx) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <>
      <div className="tag-list">
        {items.map((item, idx) => (
          <span className="tag-pill" key={`${item}-${idx}`}>
            {item}
            <button type="button" aria-label={`Remove ${item}`} onClick={() => remove(idx)}>×</button>
          </span>
        ))}
      </div>
      <div className="add-row">
        <input
          type="text"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" className="btn btn-outline" onClick={add}>Add</button>
      </div>
    </>
  );
}

function ExperienceCard({ exp, onChange, onRemove, index }) {
  const set = (key) => (e) => onChange({ ...exp, [key]: e.target.value });
  return (
    <div className="entry-card">
      <div className="entry-card-header">
        <span>Experience #{index + 1}</span>
        <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>Remove</button>
      </div>
      <div className="field-grid">
        <Field label="Company" value={exp.company} onChange={set('company')} />
        <Field label="Formerly Known As" value={exp.formerlyKnownAs} onChange={set('formerlyKnownAs')} />
        <Field label="Job Title" value={exp.title} onChange={set('title')} />
        <Field label="Location" value={exp.location} onChange={set('location')} />
        <Field label="Start Date" placeholder="YYYY-MM or YYYY" value={exp.startDate} onChange={set('startDate')} />
        <Field label="End Date" placeholder="YYYY-MM or YYYY" value={exp.endDate} onChange={set('endDate')} />
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={Boolean(exp.current)} onChange={(e) => onChange({ ...exp, current: e.target.checked })} />
        This is my current role
      </label>
      <div className="form-row">
        <label>Description</label>
        <textarea rows="3" value={exp.description} onChange={set('description')} />
      </div>
      <div className="form-row">
        <label>Coming-soon note (optional)</label>
        <textarea rows="2" value={exp.note} onChange={set('note')} />
      </div>
    </div>
  );
}

function EducationCard({ item, onChange, onRemove, index }) {
  const set = (key) => (e) => onChange({ ...item, [key]: e.target.value });
  return (
    <div className="entry-card">
      <div className="entry-card-header">
        <span>Education #{index + 1}</span>
        <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>Remove</button>
      </div>
      <div className="field-grid">
        <Field label="Institution" value={item.institution} onChange={set('institution')} />
        <Field label="Degree" value={item.degree} onChange={set('degree')} />
        <Field label="Start Date" placeholder="YYYY" value={item.startDate} onChange={set('startDate')} />
        <Field label="End Date" placeholder="YYYY" value={item.endDate} onChange={set('endDate')} />
      </div>
    </div>
  );
}

function LanguageCard({ item, onChange, onRemove, index }) {
  const set = (key) => (e) => onChange({ ...item, [key]: e.target.value });
  return (
    <div className="entry-card">
      <div className="entry-card-header">
        <span>Language #{index + 1}</span>
        <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>Remove</button>
      </div>
      <div className="field-grid">
        <Field label="Language" value={item.language} onChange={set('language')} />
        <Field label="Proficiency" value={item.proficiency} onChange={set('proficiency')} />
      </div>
    </div>
  );
}

function PortfolioCard({ item, onChange, onRemove, index }) {
  const set = (key) => (e) => onChange({ ...item, [key]: e.target.value });
  return (
    <div className="entry-card">
      <div className="entry-card-header">
        <span>Project #{index + 1}</span>
        <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>Remove</button>
      </div>
      <div className="field-grid">
        <Field label="Title" value={item.title} onChange={set('title')} />
        <Field label="Project URL" value={item.url} onChange={set('url')} />
      </div>
      <div className="form-row">
        <label>Description</label>
        <textarea rows="2" value={item.description} onChange={set('description')} />
      </div>
    </div>
  );
}

function listOps(list, setList) {
  return {
    update: (idx, next) => setList(list.map((it, i) => (i === idx ? next : it))),
    remove: (idx) => setList(list.filter((_, i) => i !== idx)),
    add: (empty) => setList([...list, empty]),
  };
}

export default function ContentEditor() {
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const photoInputRef = useRef(null);
  const cvInputRef = useRef(null);

  useEffect(() => {
    api.getContent().then(setContent);
  }, []);

  function flash(message, isError = false) {
    setStatus({ message, isError });
    setTimeout(() => setStatus(null), 3500);
  }

  if (!content) return <div className="load-state"><p>Loading…</p></div>;

  const { profile, roles, skills, experience, education, languages, portfolio, visibility } = content;
  const theme = content.theme || { mode: 'light', accentColor: '#4f46e5', fontFamily: 'system' };
  const setProfile = (patch) => setContent({ ...content, profile: { ...profile, ...patch } });
  const setTheme = (patch) => setContent({ ...content, theme: { ...theme, ...patch } });
  const expOps = listOps(experience, (v) => setContent({ ...content, experience: v }));
  const eduOps = listOps(education, (v) => setContent({ ...content, education: v }));
  const langOps = listOps(languages, (v) => setContent({ ...content, languages: v }));
  const pfOps = listOps(portfolio, (v) => setContent({ ...content, portfolio: v }));

  async function handlePhotoUpload() {
    const file = photoInputRef.current.files[0];
    if (!file) return;
    try {
      const data = await api.uploadPhoto(file);
      setProfile({ photoUrl: data.photoUrl });
      photoInputRef.current.value = '';
      flash('Photo uploaded ✓');
    } catch (err) {
      flash(err.message, true);
    }
  }

  async function handleCvUpload() {
    const file = cvInputRef.current.files[0];
    if (!file) return;
    try {
      const data = await api.uploadCv(file);
      setProfile({ cvUrl: data.cvUrl });
      cvInputRef.current.value = '';
      flash('CV uploaded ✓');
    } catch (err) {
      flash(err.message, true);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    flash('Saving…');
    try {
      const saved = await api.saveContent(content);
      setContent(saved);
      flash('Saved ✓');
    } catch (err) {
      flash(err.message, true);
    }
  }

  return (
    <form className="editor-body" onSubmit={handleSave}>
      {status && <div className={`save-status-banner${status.isError ? ' error' : ''}`}>{status.message}</div>}

      <section className="panel">
        <h2>Profile</h2>
        <div className="field-grid">
          <Field label="Full Name" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} required />
          <Field label="Job Title" value={profile.title} onChange={(e) => setProfile({ title: e.target.value })} required />
          <Field label="Hero Eyebrow" value={profile.eyebrow} onChange={(e) => setProfile({ eyebrow: e.target.value })} />
          <Field label="Years Experience" placeholder="e.g. 12+" value={profile.yearsExperience} onChange={(e) => setProfile({ yearsExperience: e.target.value })} />
          <Field label="City" value={profile.city} onChange={(e) => setProfile({ city: e.target.value })} />
          <Field label="State" value={profile.state} onChange={(e) => setProfile({ state: e.target.value })} />
          <Field label="Country" value={profile.country} onChange={(e) => setProfile({ country: e.target.value })} />
          <Field label="Email" type="email" value={profile.email} onChange={(e) => setProfile({ email: e.target.value })} />
          <Field label="Phone" value={profile.phone} onChange={(e) => setProfile({ phone: e.target.value })} />
          <Field label="LinkedIn URL" type="url" value={profile.linkedin} onChange={(e) => setProfile({ linkedin: e.target.value })} />
        </div>
        <div className="form-row">
          <label>Hero Tagline</label>
          <input value={profile.tagline} onChange={(e) => setProfile({ tagline: e.target.value })} />
        </div>
        <div className="form-row">
          <label>About Summary</label>
          <textarea rows="5" value={profile.summary} onChange={(e) => setProfile({ summary: e.target.value })} />
        </div>
      </section>

      <section className="panel">
        <h2>Appearance</h2>
        <p className="hint">Controls how the public site looks — the admin panel itself always stays the same.</p>
        <div className="field-grid">
          <div className="form-row">
            <label>Site Theme</label>
            <select value={theme.mode} onChange={(e) => setTheme({ mode: e.target.value })}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="form-row">
            <label>Accent Color</label>
            <div className="color-field">
              <input type="color" value={theme.accentColor} onChange={(e) => setTheme({ accentColor: e.target.value })} />
              <input type="text" value={theme.accentColor} onChange={(e) => setTheme({ accentColor: e.target.value })} maxLength={7} />
            </div>
          </div>
        </div>
        <div className="form-row">
          <label>Font Family</label>
          <select value={theme.fontFamily} onChange={(e) => setTheme({ fontFamily: e.target.value })}>
            {FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>
        <ThemePreviewCard theme={theme} />
      </section>

      <section className="panel">
        <h2>Photo</h2>
        <div className="upload-row">
          {profile.photoUrl && <img className="photo-preview" src={profile.photoUrl} alt="Profile preview" />}
          <div className="upload-controls">
            <input type="file" ref={photoInputRef} accept="image/png,image/jpeg,image/webp" />
            <button type="button" className="btn btn-outline" onClick={handlePhotoUpload}>Upload Photo</button>
            <p className="hint">JPG, PNG, or WEBP — up to 3MB. Leave empty to keep the initials avatar.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Resume / CV File</h2>
        <div className="upload-row">
          <div className="upload-controls">
            <p className="hint">
              {profile.cvUrl ? <>CV uploaded — <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer">view current file</a></> : 'No CV uploaded yet — the site shows "Coming soon."'}
            </p>
            <input type="file" ref={cvInputRef} accept="application/pdf" />
            <button type="button" className="btn btn-outline" onClick={handleCvUpload}>Upload CV (PDF)</button>
            <p className="hint">PDF only — up to 5MB.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Rotating Hero Roles</h2>
        <p className="hint">Shown one at a time under "Currently working as…" on the homepage.</p>
        <TagList items={roles} onChange={(v) => setContent({ ...content, roles: v })} placeholder="Add a role, e.g. React.js Engineer" />
      </section>

      <section className="panel">
        <h2>Skills</h2>
        <TagList items={skills} onChange={(v) => setContent({ ...content, skills: v })} placeholder="Add a skill, e.g. TypeScript" />
      </section>

      <section className="panel">
        <h2>Experience</h2>
        <div className="card-list">
          {experience.map((exp, i) => (
            <ExperienceCard key={i} exp={exp} index={i} onChange={(v) => expOps.update(i, v)} onRemove={() => expOps.remove(i)} />
          ))}
        </div>
        <button type="button" className="btn btn-outline" onClick={() => expOps.add({ company: '', formerlyKnownAs: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '', note: '' })}>+ Add Experience</button>
      </section>

      <section className="panel">
        <div className="panel-heading-row">
          <h2>Education</h2>
          <label className="toggle">
            <input type="checkbox" checked={Boolean(visibility.education)} onChange={(e) => setContent({ ...content, visibility: { ...visibility, education: e.target.checked } })} />
            <span>Show on site</span>
          </label>
        </div>
        <div className="card-list">
          {education.map((item, i) => (
            <EducationCard key={i} item={item} index={i} onChange={(v) => eduOps.update(i, v)} onRemove={() => eduOps.remove(i)} />
          ))}
        </div>
        <button type="button" className="btn btn-outline" onClick={() => eduOps.add({ institution: '', degree: '', startDate: '', endDate: '' })}>+ Add Education</button>
      </section>

      <section className="panel">
        <h2>Languages</h2>
        <div className="card-list">
          {languages.map((item, i) => (
            <LanguageCard key={i} item={item} index={i} onChange={(v) => langOps.update(i, v)} onRemove={() => langOps.remove(i)} />
          ))}
        </div>
        <button type="button" className="btn btn-outline" onClick={() => langOps.add({ language: '', proficiency: '' })}>+ Add Language</button>
      </section>

      <section className="panel">
        <div className="panel-heading-row">
          <h2>Portfolio</h2>
          <label className="toggle">
            <input type="checkbox" checked={Boolean(visibility.portfolio)} onChange={(e) => setContent({ ...content, visibility: { ...visibility, portfolio: e.target.checked } })} />
            <span>Show on site</span>
          </label>
        </div>
        <p className="hint">Leave empty to show a "Coming soon" panel even when visible.</p>
        <div className="card-list">
          {portfolio.map((item, i) => (
            <PortfolioCard key={i} item={item} index={i} onChange={(v) => pfOps.update(i, v)} onRemove={() => pfOps.remove(i)} />
          ))}
        </div>
        <button type="button" className="btn btn-outline" onClick={() => pfOps.add({ title: '', description: '', url: '', imageUrl: '' })}>+ Add Project</button>
      </section>

      <div className="save-bar">
        <button type="submit" className="btn btn-primary">Save All Changes</button>
        <button type="button" className="btn btn-outline" onClick={() => setPreviewOpen(true)}>Preview Site</button>
        {status && <span className={`save-status${status.isError ? ' error' : ''}`}>{status.message}</span>}
      </div>

      {previewOpen && <SitePreviewOverlay content={content} onClose={() => setPreviewOpen(false)} />}
    </form>
  );
}
