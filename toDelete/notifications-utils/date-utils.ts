/**
 * Formatiert ein Datum als relative Zeit (z.B. "vor 2 Stunden")
 * 
 * @param date Das zu formatierende Datum
 * @returns Formatierte relative Zeit
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSecs < 60) {
    return 'Gerade eben';
  } else if (diffInMins < 60) {
    return `vor ${diffInMins} ${diffInMins === 1 ? 'Minute' : 'Minuten'}`;
  } else if (diffInHours < 24) {
    return `vor ${diffInHours} ${diffInHours === 1 ? 'Stunde' : 'Stunden'}`;
  } else if (diffInDays < 7) {
    return `vor ${diffInDays} ${diffInDays === 1 ? 'Tag' : 'Tagen'}`;
  } else if (diffInWeeks < 5) {
    return `vor ${diffInWeeks} ${diffInWeeks === 1 ? 'Woche' : 'Wochen'}`;
  } else if (diffInMonths < 12) {
    return `vor ${diffInMonths} ${diffInMonths === 1 ? 'Monat' : 'Monaten'}`;
  } else {
    return `vor ${diffInYears} ${diffInYears === 1 ? 'Jahr' : 'Jahren'}`;
  }
}

/**
 * Formatiert ein Datum in lesbarem Format
 * 
 * @param date Das zu formatierende Datum oder String
 * @param format Optional: Formatierungsoption
 * @returns Formatiertes Datum
 */
export function formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch(format) {
    case 'short':
      return dateObj.toLocaleDateString('de-DE');
    case 'long':
      return dateObj.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'medium':
    default:
      return dateObj.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
}