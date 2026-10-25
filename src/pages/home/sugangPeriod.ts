export function getKoreaDate(now = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function getPeriodStatus(
  date: string,
  today: string
): 'past' | 'current' | 'upcoming' | 'unknown' {
  const matches = [...date.matchAll(/\d{4}-\d{1,2}-\d{1,2}/g)];
  if (matches.length === 0) return 'unknown';

  const dates = matches.map(([value]) => {
    const [year, month, day] = value.split('-');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  });
  if (
    dates.some((value) => {
      const parsed = new Date(`${value}T00:00:00Z`);
      return (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== value
      );
    })
  )
    return 'unknown';

  const start = dates[0];
  const end = dates[dates.length - 1];
  if (start > end) return 'unknown';
  if (end < today) return 'past';
  return start <= today ? 'current' : 'upcoming';
}
