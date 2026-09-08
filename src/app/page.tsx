import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { validSession } from '@/lib/session';
import Calendar from '@/practice/Calendar';
import '@/practice/practice.css';
export const dynamic = 'force-dynamic';
export const metadata:Metadata={title:'Practice Day',description:'Private daily practice calendar.',robots:{index:false,follow:false},openGraph:{title:'Practice Day',description:'Private daily practice calendar.',images:[]},twitter:{title:'Practice Day',description:'Private daily practice calendar.',images:[]}};
export default async function Home({searchParams}:{searchParams:Promise<{incorrect?:string}>}) {
 const allowed=await validSession((await cookies()).get('practice_session')?.value);
 const params=await searchParams;
 return <div className="practice-root">{allowed?<Calendar/>:<section className="entry"><p>XIV / DAILY PRACTICE</p><h1>Room to practice.</h1><form action="/api/session" method="post"><label htmlFor="code">Entry code</label><input id="code" name="code" type="password" required autoComplete="current-password" maxLength={100}/><button type="submit">Open calendar</button></form>{params.incorrect&&<p role="alert">That code was not accepted. Try again.</p>}</section>}</div>;
}
