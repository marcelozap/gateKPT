'use client';

import {useEffect, useState} from 'react';
import {Camera, CalendarDays} from 'lucide-react';

const weeks = [
 ['Set the identity', 'Choose one artist photo, a short bio and a consistent name for your website and TikTok. Write one sentence about the music you make.'],
 ['Make the path clear', 'Add your real TikTok link, latest uploads and a contact link to your artist website. Check the links on your phone. Choose a repeatable capture time.'],
 ['Capture one moment', 'Prepare three posts: one comfortable vocal excerpt or archive clip, one rehearsal glimpse and one original idea. Open with the strongest moment.'],
 ['Find the format', 'Use a short opening, a 5 to 20 second musical moment and one invitation to follow or listen. Review which opening held attention.'],
 ['Share the process', 'Show a lyric decision, an arrangement or a recording detail. Aim for three posts this week; a fourth is optional.'],
 ['Give the music a home', 'Add a current release or next performance to your artist website when you have one. Include listening links only when available.'],
 ['Review the evidence', 'Compare watch time, saves, follows and comments from your own posts. Record one observation and one experiment for next week.'],
 ['Repeat a strong idea', 'Revisit a format that connected with people using a different musical moment. Keep the sample size in mind before abandoning a format.'],
 ['Invite a collaborator', 'Reach out to one compatible musician with a specific, small idea. A duet, instrumental contribution or shared clip all count.'],
 ['Prepare a live moment', 'Outline an optional short live session: introduction, one musical moment and conversation. Use recorded music if live singing is uncomfortable.'],
 ['Connect the pieces', 'Make your strongest recent clip easy to find on your artist website. Check your bio, listening links and contact path again.'],
 ['Choose what continues', 'Review the three months. Keep the formats you can sustain and the music you want to develop. Schedule the next small release or session.'],
];
const daily = [
 ['intention', '2 minutes / Choose one feeling', 'Who are you singing or creating for today? Write one word: tenderness, joy, longing, gratitude.'],
 ['make', 'One small creative session', 'Capture a comfortable phrase, edit an existing take, write a lyric or arrange a few bars. Finish one useful piece.'],
 ['share', 'On a posting day / Publish one clip', 'Use your strongest opening and one clear invitation. Three posts per week is the starting rhythm.'],
 ['close', '2 minutes / Close the session', 'Note what felt expressive and what to try next. Picture the next small action: opening the session, choosing the take, sharing it.'],
];
const key = 'xiv-artist-launch-v1';
function today(){const d = new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
type Saved = {start:string; checks:Record<string,boolean>};

export default function ArtistLaunch(){
 const [saved,setSaved] = useState<Saved>({start:'',checks:{}});
 const [loaded,setLoaded] = useState(false);
 const [storageError,setStorageError] = useState(false);
 const [date,setDate] = useState('');
 useEffect(()=>{
  let initial:Saved = {start:today(),checks:{}};
  let unavailable=false;
  try {
   const raw = localStorage.getItem(key);
   if(raw){const value = JSON.parse(raw);if(typeof value.start==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value.start) && Number.isFinite(Date.parse(value.start)) && value.checks && typeof value.checks==='object' && !Array.isArray(value.checks)) initial={start:value.start,checks:Object.fromEntries(Object.entries(value.checks).filter(([,v])=>typeof v==='boolean')) as Record<string,boolean>};}
  } catch {unavailable=true;}
  // Restore the browser's saved calendar after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setSaved(initial);
  setStorageError(unavailable);setDate(today());setLoaded(true);
 },[]);
 function update(next:Saved){setSaved(next);try{localStorage.setItem(key,JSON.stringify(next));setStorageError(false);}catch{setStorageError(true);}}
 const elapsed = loaded ? Math.floor((Date.parse(date)-Date.parse(saved.start))/86400000) : 0;
 return <section className="artist-launch" id="artist-launch" aria-labelledby="artist-launch-title">
  <p className="eyebrow"><Camera size={15}/> CREATE / SHARE / REPEAT</p>
  <h2 id="artist-launch-title">90 days of making music public.</h2>
  <p>One feeling. One musical moment. A small body of work that grows each week.</p>
  <div className="launch-date"><label><CalendarDays size={18}/> Start date <input type="date" value={saved.start} disabled={!loaded} onChange={e=>{if(e.target.value)update({...saved,start:e.target.value});}}/></label><span>{loaded ? elapsed<0 ? 'Your first day is ahead' : elapsed>=90 ? '90 days complete. Choose your next chapter.' : `Day ${elapsed+1} of 90` : 'Loading calendar...'}</span><a href="#launch-weeks">Weekly plan</a></div>
  {storageError && <p role="status">Browser storage is unavailable. Changes will last only while this page stays open.</p>}
  <div className="launch-daily"><h3>Today&apos;s small steps</h3>{daily.map(([id,title,body])=><label key={id}><input type="checkbox" disabled={!loaded} checked={saved.checks[`${date}:${id}`]===true} onChange={e=>update({...saved,checks:{...saved.checks,[`${date}:${id}`]:e.target.checked}})}/><span><strong>{title}</strong><span>{body}</span></span></label>)}</div>
  <p className="launch-note">Recording is optional when your voice feels strained, hoarse or uncomfortable. Editing, listening and writing move the project forward too. A posting schedule is not a vocal exercise dose.</p>
  <div id="launch-weeks">{weeks.map(([title,body],index)=>{
   const active=elapsed>=index*7 && elapsed<(index+1)*7;
   return <details key={title} open={active || undefined}><summary>Week {index+1} / {title}{active && loaded && <small>Current week</small>}</summary><p>{body}</p></details>;
  })}<details open={elapsed>=84 && elapsed<90 || undefined}><summary>Days 85 to 90 / Finish and reset</summary><p>Gather your best clips, update the website and choose one next step. Save a short note on what you learned so the next cycle starts with context.</p></details></div>
  <div className="launch-bottom"><div><h3>Keep the setup small</h3><p>Start with your phone, a quiet room and tools you already have. Curtains and soft furnishings can reduce room reflections. Buy equipment when a specific limitation becomes clear.</p></div><div><h3>Before you share</h3><p>Does this express the feeling? Would it connect with one person? Is the next action clear? Let those questions guide the edit.</p></div><div><h3>At night</h3><p>Picture sharing something honest with someone who welcomes it. Let gratitude be an intention, without making views or saves a condition of a good day.</p></div></div>
 </section>;
}
