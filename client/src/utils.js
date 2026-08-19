export function formatMonthYear(value) {
  const v = String(value || '').trim();
  const monthMatch = v.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = parseInt(monthMatch[2], 10) - 1;
    return `${months[idx] || ''} ${monthMatch[1]}`.trim();
  }
  return v;
}

export function formatRange(startDate, endDate, current) {
  const start = formatMonthYear(startDate);
  const end = current ? 'Present' : formatMonthYear(endDate);
  if (start && end) return `${start} – ${end}`;
  return start || end || '';
}

export function locationString(profile) {
  return [profile.city, profile.state, profile.country].filter(Boolean).join(', ');
}
