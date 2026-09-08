import { cookies } from 'next/headers';
import { validSession } from '@/lib/session';
import Calendar from './calendar';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const allowed = await validSession(
    (await cookies()).get('practice_session')?.value,
  );
  if (!allowed)
    return (
      <main className="entry">
        <p>XIV / DAILY PRACTICE</p>
        <h1>Room to practice.</h1>
        <form action="/api/session" method="post">
          <label htmlFor="code">Entry code</label>
          <input
            id="code"
            name="code"
            type="password"
            required
            autoComplete="current-password"
            maxLength={100}
          />
          <button type="submit">Open calendar</button>
        </form>
        <p>Incorrect codes return to this screen.</p>
      </main>
    );
  return <Calendar />;
}
