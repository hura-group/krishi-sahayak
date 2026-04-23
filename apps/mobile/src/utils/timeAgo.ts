/**
 * Returns a short, human-readable relative time string.
 * Examples: "just now", "5 min ago", "3 hrs ago", "2 days ago", "Apr 20"
 */
export function timeAgo(isoString: string): string {
  const now  = Date.now();
  const then = new Date(isoString).getTime();
  const sec  = Math.floor((now - then) / 1000);

  if (sec < 60)                        return 'just now';
  if (sec < 3600)  return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr${Math.floor(sec / 3600) !== 1 ? 's' : ''} ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} day${Math.floor(sec / 86400) !== 1 ? 's' : ''} ago`;

  return new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Returns a full formatted date for detailed display
 * Example: "Mon, 21 Apr · 3:45 PM"
 */
export function formatAlertDate(isoString: string): string {
  return new Date(isoString).toLocaleString('en-IN', {
    weekday: 'short',
    day:     'numeric',
    month:   'short',
    hour:    'numeric',
    minute:  '2-digit',
    hour12:  true,
  });
}
