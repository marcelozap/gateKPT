const encoder = new TextEncoder();
async function signature(value: string) {
  const secret = process.env.CALENDAR_SESSION_SECRET;
  if (!secret) throw new Error('Session unavailable');
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.sign('HMAC', key, encoder.encode(value)),
    ),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
}
export async function makeSession() {
  const expiry = String(Date.now() + 43200000);
  return expiry + '.' + (await signature(expiry));
}
export async function validSession(token?: string) {
  if (!token || !process.env.CALENDAR_SESSION_SECRET) return false;
  const [expiry, mac, ...rest] = token.split('.');
  if (
    rest.length ||
    !mac ||
    !/^\d+$/.test(expiry) ||
    Number(expiry) <= Date.now() ||
    Number(expiry) > Date.now() + 43200000
  )
    return false;
  const expected = await signature(expiry);
  if (mac.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < mac.length; i++)
    difference |= mac.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}
