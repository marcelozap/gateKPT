import { makeSession } from '@/lib/session';
export async function POST(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get('origin') !== url.origin)
    return new Response('Invalid origin', { status: 403 });
  if (!process.env.CALENDAR_CODE || !process.env.CALENDAR_SESSION_SECRET)
    return new Response('Access is not configured yet.', { status: 503 });
  const form = await request.formData();
  const logout = form.get('logout') === 'yes';
  if (!logout && form.get('code') !== process.env.CALENDAR_CODE)
    return Response.redirect(new URL('/?incorrect=1', url), 303);
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/',
      'Cache-Control': 'no-store',
      'Set-Cookie': `practice_session=${logout ? '' : await makeSession()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${logout ? 0 : 43200}${url.protocol === 'https:' ? '; Secure' : ''}`,
    },
  });
}
