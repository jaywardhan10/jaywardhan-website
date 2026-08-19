import { useEffect, useRef, useState } from 'react';

function buildLinks(email, subject) {
  const enc = encodeURIComponent;
  return [
    { label: 'Open in Gmail', href: `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(email)}&su=${enc(subject)}`, external: true },
    { label: 'Open in Outlook', href: `https://outlook.office.com/mail/deeplink/compose?to=${enc(email)}&subject=${enc(subject)}`, external: true },
    { label: 'Default Mail App', href: `mailto:${email}?subject=${enc(subject)}`, external: false },
  ];
}

export default function EmailMenu({ email, subject = 'Hello', className = '', triggerClassName = '', children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!email) {
    return <div className={className}>{children}</div>;
  }

  const links = buildLinks(email, subject);

  return (
    <div className={`email-menu ${className}`.trim()} ref={ref}>
      <button
        type="button"
        className={`email-menu-trigger ${triggerClassName}`.trim()}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        title="Email"
      >
        {children}
      </button>
      {open && (
        <div className="email-menu-dropdown" role="menu">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
