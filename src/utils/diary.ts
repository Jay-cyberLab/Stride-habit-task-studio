import { DiaryEntry } from '../types';

export function validatePasswordSetup(password: string, confirmPassword: string): string | null {
  if (password.length < 4) {
    return 'Password must be at least 4 characters long.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}

export function validateDiaryEntryInput(input: { title: string; content: string }): string | null {
  if (!input.content.trim()) {
    return 'Please write your thoughts before saving.';
  }
  if (input.title.trim().length > 100) {
    return 'Entry title must be 100 characters or fewer.';
  }
  return null;
}

export async function hashDiaryPassword(password: string, salt: string): Promise<string> {
  const payload = `${salt}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const data = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic FNV-1a 64-bit style hex hash if subtle crypto is unavailable
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < payload.length; i += 1) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

export function filterAndSortDiaryEntries(entries: DiaryEntry[], search: string): DiaryEntry[] {
  const q = search.trim().toLowerCase();
  return [...entries]
    .filter((entry) => {
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.mood.toLowerCase().includes(q) ||
        entry.date.includes(q)
      );
    })
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}
