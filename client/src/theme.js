export const FONT_OPTIONS = [
  {
    id: 'system',
    label: 'System Default',
    stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    googleFont: null,
  },
  {
    id: 'inter',
    label: 'Inter (Modern Sans)',
    stack: '"Inter", -apple-system, sans-serif',
    googleFont: 'Inter:wght@400;500;600;700;800',
  },
  {
    id: 'poppins',
    label: 'Poppins (Rounded Sans)',
    stack: '"Poppins", -apple-system, sans-serif',
    googleFont: 'Poppins:wght@400;500;600;700;800',
  },
  {
    id: 'roboto',
    label: 'Roboto (Clean Sans)',
    stack: '"Roboto", -apple-system, sans-serif',
    googleFont: 'Roboto:wght@400;500;700;900',
  },
  {
    id: 'playfair',
    label: 'Playfair Display (Elegant Serif)',
    stack: '"Playfair Display", Georgia, serif',
    googleFont: 'Playfair+Display:wght@400;600;700;800',
  },
  {
    id: 'merriweather',
    label: 'Merriweather (Classic Serif)',
    stack: '"Merriweather", Georgia, serif',
    googleFont: 'Merriweather:wght@400;700;900',
  },
  {
    id: 'jetbrains',
    label: 'JetBrains Mono (Developer)',
    stack: '"JetBrains Mono", ui-monospace, monospace',
    googleFont: 'JetBrains+Mono:wght@400;600;700',
  },
];

export function getFontOption(id) {
  return FONT_OPTIONS.find((f) => f.id === id) || FONT_OPTIONS[0];
}

const loadedFonts = new Set();

function loadGoogleFont(query) {
  if (!query || loadedFonts.has(query)) return;
  loadedFonts.add(query);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
  document.head.appendChild(link);
}

export function applyTheme(theme) {
  if (!theme) return;
  document.documentElement.dataset.theme = theme.mode === 'dark' ? 'dark' : 'light';
  const font = getFontOption(theme.fontFamily);
  loadGoogleFont(font.googleFont);
  return {
    '--accent': theme.accentColor || '#4f46e5',
    '--font-family': font.stack,
  };
}
