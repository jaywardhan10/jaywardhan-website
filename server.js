const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const SESSION_SECRET = process.env.SESSION_SECRET;
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH || !SESSION_SECRET) {
  console.error('Missing ADMIN_USERNAME, ADMIN_PASSWORD_HASH, or SESSION_SECRET in .env — see .env for instructions.');
  process.exit(1);
}

const DIST_DIR = path.join(__dirname, 'dist');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const CONTENT_PATH = path.join(__dirname, 'data', 'content.json');
const PAGES_PATH = path.join(__dirname, 'data', 'pages.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.json({ limit: '2mb' }));
app.use(
  session({
    name: 'admin.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    },
  })
);

/* ---------- JSON file store (atomic read/write) ---------- */

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

const readContent = () => readJson(CONTENT_PATH, {});
const writeContent = (data) => writeJson(CONTENT_PATH, data);
const readPages = () => readJson(PAGES_PATH, []);
const writePages = (data) => writeJson(PAGES_PATH, data);

/* ---------- Auth ---------- */

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;

function isRateLimited(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= LOGIN_MAX_ATTEMPTS;
}

function recordLoginFailure(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry || Date.now() - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: Date.now() });
  } else {
    entry.count += 1;
  }
}

function clearLoginFailures(ip) {
  loginAttempts.delete(ip);
}

app.get('/api/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session && req.session.isAdmin) });
});

app.post('/api/login', (req, res) => {
  const ip = req.ip;
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  }

  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const usernameOk = username.length === ADMIN_USERNAME.length
    ? crypto.timingSafeEqual(Buffer.from(username), Buffer.from(ADMIN_USERNAME))
    : false;
  const passwordOk = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);

  if (!usernameOk || !passwordOk) {
    recordLoginFailure(ip);
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  clearLoginFailures(ip);
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Login failed, try again.' });
    req.session.isAdmin = true;
    res.json({ authenticated: true });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('admin.sid');
    res.json({ authenticated: false });
  });
});

/* ---------- Content (home/profile) ---------- */

app.get('/api/content', (req, res) => {
  res.json(readContent());
});

function isNonEmptyString(v) {
  return typeof v === 'string';
}

function sanitizeContent(input) {
  if (!input || typeof input !== 'object') throw new Error('Invalid content payload.');

  const p = input.profile || {};
  const profile = {
    name: String(p.name || '').trim().slice(0, 120),
    title: String(p.title || '').trim().slice(0, 120),
    eyebrow: String(p.eyebrow || '').trim().slice(0, 120),
    tagline: String(p.tagline || '').trim().slice(0, 300),
    yearsExperience: String(p.yearsExperience || '').trim().slice(0, 20),
    city: String(p.city || '').trim().slice(0, 80),
    state: String(p.state || '').trim().slice(0, 80),
    country: String(p.country || '').trim().slice(0, 80),
    email: String(p.email || '').trim().slice(0, 200),
    phone: String(p.phone || '').trim().slice(0, 40),
    linkedin: String(p.linkedin || '').trim().slice(0, 300),
    summary: String(p.summary || '').trim().slice(0, 3000),
    photoUrl: p.photoUrl ? String(p.photoUrl).slice(0, 300) : null,
    cvUrl: p.cvUrl ? String(p.cvUrl).slice(0, 300) : null,
  };

  const roles = Array.isArray(input.roles)
    ? input.roles.filter(isNonEmptyString).map((s) => s.trim().slice(0, 80)).filter(Boolean).slice(0, 10)
    : [];

  const skills = Array.isArray(input.skills)
    ? input.skills.filter(isNonEmptyString).map((s) => s.trim().slice(0, 60)).filter(Boolean).slice(0, 60)
    : [];

  const experience = Array.isArray(input.experience)
    ? input.experience.slice(0, 40).map((e) => ({
        company: String((e && e.company) || '').trim().slice(0, 120),
        formerlyKnownAs: String((e && e.formerlyKnownAs) || '').trim().slice(0, 120),
        title: String((e && e.title) || '').trim().slice(0, 120),
        location: String((e && e.location) || '').trim().slice(0, 120),
        startDate: String((e && e.startDate) || '').trim().slice(0, 20),
        endDate: String((e && e.endDate) || '').trim().slice(0, 20),
        current: Boolean(e && e.current),
        description: String((e && e.description) || '').trim().slice(0, 2000),
        note: String((e && e.note) || '').trim().slice(0, 500),
      }))
    : [];

  const education = Array.isArray(input.education)
    ? input.education.slice(0, 20).map((e) => ({
        institution: String((e && e.institution) || '').trim().slice(0, 160),
        degree: String((e && e.degree) || '').trim().slice(0, 160),
        startDate: String((e && e.startDate) || '').trim().slice(0, 20),
        endDate: String((e && e.endDate) || '').trim().slice(0, 20),
      }))
    : [];

  const languages = Array.isArray(input.languages)
    ? input.languages.slice(0, 20).map((l) => ({
        language: String((l && l.language) || '').trim().slice(0, 60),
        proficiency: String((l && l.proficiency) || '').trim().slice(0, 60),
      }))
    : [];

  const portfolio = Array.isArray(input.portfolio)
    ? input.portfolio.slice(0, 40).map((item) => ({
        title: String((item && item.title) || '').trim().slice(0, 160),
        description: String((item && item.description) || '').trim().slice(0, 1000),
        url: String((item && item.url) || '').trim().slice(0, 300),
        imageUrl: String((item && item.imageUrl) || '').trim().slice(0, 300),
      }))
    : [];

  const v = input.visibility || {};
  const visibility = {
    education: Boolean(v.education),
    portfolio: Boolean(v.portfolio),
  };

  const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
  const FONT_IDS = new Set(['system', 'inter', 'poppins', 'roboto', 'playfair', 'merriweather', 'jetbrains']);
  const t = input.theme || {};
  const theme = {
    mode: t.mode === 'dark' ? 'dark' : 'light',
    accentColor: HEX_COLOR_RE.test(t.accentColor) ? t.accentColor : '#4f46e5',
    fontFamily: FONT_IDS.has(t.fontFamily) ? t.fontFamily : 'system',
  };

  return { profile, roles, skills, experience, education, languages, portfolio, visibility, theme };
}

app.put('/api/content', requireAuth, (req, res) => {
  try {
    const sanitized = sanitizeContent(req.body);
    writeContent(sanitized);
    res.json(sanitized);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Invalid content.' });
  }
});

/* ---------- Contact form email ---------- */

const mailTransporter = GMAIL_USER && GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD.replace(/\s+/g, '') },
    })
  : null;

const contactAttempts = new Map();
const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_MAX_ATTEMPTS = 5;

function isContactRateLimited(ip) {
  const entry = contactAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAttempt > CONTACT_WINDOW_MS) {
    contactAttempts.delete(ip);
    return false;
  }
  return entry.count >= CONTACT_MAX_ATTEMPTS;
}

function recordContactAttempt(ip) {
  const entry = contactAttempts.get(ip);
  if (!entry || Date.now() - entry.firstAttempt > CONTACT_WINDOW_MS) {
    contactAttempts.set(ip, { count: 1, firstAttempt: Date.now() });
  } else {
    entry.count += 1;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/contact', async (req, res) => {
  if (!mailTransporter) {
    return res.status(503).json({ error: 'Email sending isn\'t configured yet. Please email directly instead.' });
  }

  const ip = req.ip;
  if (isContactRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many messages sent. Please try again later.' });
  }

  const { name, email, subject, message } = req.body || {};
  const cleanName = String(name || '').trim().slice(0, 120);
  const cleanEmail = String(email || '').trim().slice(0, 200);
  const cleanSubject = String(subject || '').trim().slice(0, 200);
  const cleanMessage = String(message || '').trim().slice(0, 5000);

  if (!cleanName || !cleanEmail || !cleanMessage) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  if (!EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  const content = readContent();
  const toAddress = (content.profile && content.profile.email) || GMAIL_USER;

  try {
    recordContactAttempt(ip);
    await mailTransporter.sendMail({
      from: `"${cleanName} via Portfolio Site" <${GMAIL_USER}>`,
      to: toAddress,
      replyTo: cleanEmail,
      subject: cleanSubject ? `[Portfolio] ${cleanSubject}` : `[Portfolio] New message from ${cleanName}`,
      text: `From: ${cleanName} <${cleanEmail}>\n\n${cleanMessage}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Contact email failed:', err.message);
    res.status(500).json({ error: 'Could not send the message. Please try again or email directly.' });
  }
});

/* ---------- Custom pages ---------- */

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function sanitizeBlock(input) {
  const type = String((input && input.type) || '');
  const id = String((input && input.id) || crypto.randomUUID()).slice(0, 60);

  switch (type) {
    case 'heading':
      return { id, type, text: String(input.text || '').trim().slice(0, 200), level: input.level === 'h3' ? 'h3' : 'h2' };
    case 'text':
      return { id, type, text: String(input.text || '').trim().slice(0, 5000) };
    case 'image':
      return {
        id, type,
        url: String(input.url || '').trim().slice(0, 300),
        caption: String(input.caption || '').trim().slice(0, 300),
      };
    case 'cards': {
      const loadMoreMode = ['loadMore', 'viewButton'].includes(input.loadMoreMode) ? input.loadMoreMode : 'none';
      const initialCountRaw = parseInt(input.initialCount, 10);
      const initialCount = Number.isFinite(initialCountRaw) ? Math.min(Math.max(initialCountRaw, 1), 60) : 6;
      return {
        id, type,
        items: Array.isArray(input.items)
          ? input.items.slice(0, 60).map((it) => ({
              title: String((it && it.title) || '').trim().slice(0, 160),
              description: String((it && it.description) || '').trim().slice(0, 800),
              url: String((it && it.url) || '').trim().slice(0, 300),
              imageUrl: String((it && it.imageUrl) || '').trim().slice(0, 300),
            }))
          : [],
        initialCount,
        loadMoreMode,
        viewButtonLabel: String(input.viewButtonLabel || '').trim().slice(0, 60),
        viewButtonUrl: String(input.viewButtonUrl || '').trim().slice(0, 300),
      };
    }
    case 'cta':
      return {
        id, type,
        text: String(input.text || '').trim().slice(0, 300),
        buttonLabel: String(input.buttonLabel || '').trim().slice(0, 60),
        buttonUrl: String(input.buttonUrl || '').trim().slice(0, 300),
      };
    case 'html':
      return { id, type, html: String(input.html || '').slice(0, 20000) };
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
}

function sanitizePage(input, existingPages, currentId) {
  if (!input || typeof input !== 'object') throw new Error('Invalid page payload.');

  const title = String(input.title || '').trim().slice(0, 120);
  if (!title) throw new Error('Page title is required.');

  const slug = slugify(input.slug || title);
  if (!slug) throw new Error('Could not generate a valid slug from the title.');

  const RESERVED = new Set(['admin', 'api', 'uploads', 'p']);
  if (RESERVED.has(slug)) throw new Error(`"${slug}" is a reserved word — choose a different slug.`);

  const collision = existingPages.find((p) => p.slug === slug && p.id !== currentId);
  if (collision) throw new Error(`A page with the slug "${slug}" already exists.`);

  const blocks = Array.isArray(input.blocks) ? input.blocks.slice(0, 60).map(sanitizeBlock) : [];

  return {
    id: currentId || crypto.randomUUID(),
    title,
    slug,
    navLabel: String(input.navLabel || title).trim().slice(0, 60),
    visible: Boolean(input.visible),
    blocks,
  };
}

app.get('/api/pages', (req, res) => {
  const pages = readPages().filter((p) => p.visible);
  res.json(pages.map(({ id, slug, title, navLabel }) => ({ id, slug, title, navLabel, visible: true })));
});

app.get('/api/pages/:slug', (req, res) => {
  const page = readPages().find((p) => p.slug === req.params.slug && p.visible);
  if (!page) return res.status(404).json({ error: 'Page not found.' });
  res.json(page);
});

app.get('/api/admin/pages', requireAuth, (req, res) => {
  res.json(readPages());
});

app.post('/api/admin/pages', requireAuth, (req, res) => {
  try {
    const pages = readPages();
    const page = sanitizePage(req.body, pages, null);
    pages.push(page);
    writePages(pages);
    res.status(201).json(page);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Invalid page.' });
  }
});

app.put('/api/admin/pages/:id', requireAuth, (req, res) => {
  try {
    const pages = readPages();
    const idx = pages.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Page not found.' });
    const page = sanitizePage(req.body, pages, req.params.id);
    pages[idx] = page;
    writePages(pages);
    res.json(page);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Invalid page.' });
  }
});

app.delete('/api/admin/pages/:id', requireAuth, (req, res) => {
  const pages = readPages();
  const next = pages.filter((p) => p.id !== req.params.id);
  if (next.length === pages.length) return res.status(404).json({ error: 'Page not found.' });
  writePages(next);
  res.json({ ok: true });
});

/* ---------- File uploads ---------- */

function uniqueFilename(prefix, originalName) {
  const ext = path.extname(originalName) || '';
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
}

const cvUpload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => cb(null, `cv${path.extname(file.originalname) || '.pdf'}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF files are allowed.'));
    cb(null, true);
  },
});

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => cb(null, `photo${path.extname(file.originalname) || '.jpg'}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
    }
    cb(null, true);
  },
});

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => cb(null, uniqueFilename('img', file.originalname)),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, GIF, or WEBP images are allowed.'));
    }
    cb(null, true);
  },
});

function handleUploadErrors(fn) {
  return (req, res, next) => {
    fn(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'Upload failed.' });
      next();
    });
  };
}

app.post('/api/upload/cv', requireAuth, handleUploadErrors(cvUpload.single('cv')), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const content = readContent();
  content.profile.cvUrl = `/uploads/${req.file.filename}?v=${Date.now()}`;
  writeContent(content);
  res.json({ cvUrl: content.profile.cvUrl });
});

app.post('/api/upload/photo', requireAuth, handleUploadErrors(photoUpload.single('photo')), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const content = readContent();
  content.profile.photoUrl = `/uploads/${req.file.filename}?v=${Date.now()}`;
  writeContent(content);
  res.json({ photoUrl: content.profile.photoUrl });
});

app.post('/api/upload/image', requireAuth, handleUploadErrors(imageUpload.single('image')), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

/* ---------- Static files & SPA fallback ---------- */

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '1h' }));

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.type('text/plain').send(
      'The React app has not been built yet.\n\n' +
      'For development: run "npm run dev" (starts the API + Vite dev server together).\n' +
      'For production: run "npm run build" then "npm start".'
    );
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
