const MF_API_URL = 'https://api.mfapi.in/mf/122639';

interface NavEntry {
  date: string; // "DD-MM-YYYY"
  nav: string;
}

interface MfApiResponse {
  data: NavEntry[];
}

let _cache: { data: NavEntry[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchAllNav(): Promise<NavEntry[]> {
  if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS) {
    return _cache.data;
  }
  const res = await fetch(MF_API_URL, { next: { revalidate: 3600 } });
  const json: MfApiResponse = await res.json();
  _cache = { data: json.data, fetchedAt: Date.now() };
  return json.data;
}

// Returns latest NAV { nav, date }
export async function getLatestNav(): Promise<{ nav: number; date: string }> {
  const data = await fetchAllNav();
  const entry = data[0];
  return { nav: parseFloat(entry.nav), date: entry.date };
}

// Returns NAV on or before targetDate. targetDate is a JS Date object.
export async function getNavOnOrBefore(
  targetDate: Date
): Promise<{ nav: number; date: string } | null> {
  const data = await fetchAllNav();

  // API dates are "DD-MM-YYYY", convert targetDate to same for comparison
  const target = new Date(targetDate);
  target.setHours(23, 59, 59, 999);

  for (const entry of data) {
    // Parse "DD-MM-YYYY"
    const [dd, mm, yyyy] = entry.date.split('-').map(Number);
    const entryDate = new Date(yyyy, mm - 1, dd);
    if (entryDate <= target) {
      return { nav: parseFloat(entry.nav), date: entry.date };
    }
  }
  return null;
}

// Returns last N NAV entries (oldest first) for chart
export async function getNavHistory(limit = 12): Promise<{ name: string; value: number }[]> {
  const data = await fetchAllNav();
  return data
    .slice(0, limit)
    .reverse()
    .map((entry) => ({ name: entry.date, value: parseFloat(entry.nav) }));
}
