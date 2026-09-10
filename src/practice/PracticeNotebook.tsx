'use client';

import {useEffect, useState} from 'react';
import {Button} from './controls';
import './notebook.css';

type Notes = {song:string;focus:string;lesson:string;reflection:string};
const initial:Notes = {song:'',focus:'',lesson:'',reflection:''};
const storageKey = 'gatekpt-practice-notebook-v1';

export default function PracticeNotebook(){
 const [notes,setNotes] = useState<Notes>(initial);
 const [loaded,setLoaded] = useState(false);
 const [status,setStatus] = useState('Loading your notebook...');
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>{
   try{
    const raw=localStorage.getItem(storageKey);
    if(raw){
     const value:unknown=JSON.parse(raw);
     if(!value || typeof value!=='object')throw new Error('Invalid notebook');
     const record=value as Record<string,unknown>;
     const text=(key:keyof Notes)=>typeof record[key]==='string' ? (record[key] as string).slice(0,6000):'';
     setNotes({song:text('song'),focus:text('focus'),lesson:text('lesson'),reflection:text('reflection')});
    }
    setStatus(raw?'Your saved notes are ready.':'Ready when you are.');
   }catch{setStatus('Saved notes could not be loaded. Download any new notes to keep them.');}
   setLoaded(true);
  });
  return()=>cancelAnimationFrame(frame);
 },[]);
 function update(key:keyof Notes,value:string){setNotes(old=>({...old,[key]:value}));setStatus('Unsaved changes. Save before leaving.');}
 function save(){
  try{localStorage.setItem(storageKey,JSON.stringify(notes));setStatus('Saved in this browser on this device.');}
  catch{setStatus('This browser cannot save right now. Download your notes instead.');}
 }
 function download(){
  const body=['MY SINGING NOTEBOOK',`Exported: ${new Date().toLocaleDateString()}`,'',`My song: ${notes.song}`,`Today\'s focus: ${notes.focus}`,'',`My teacher\'s guidance:\n${notes.lesson}`,'',`What I liked and what to try next:\n${notes.reflection}`,'','MY SIMPLE SESSION','Check readiness on gatekpt.ai. Follow my teacher\'s guidance for technique and session length. Choose one focus. Finish with one thing I liked.','Before singing: picture one person listening and choose the feeling I want to offer them.','Posting is optional. Returning to the music counts.'].join('\n');
  const url=URL.createObjectURL(new Blob([body],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='my-singing-notebook.txt';document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <section className="practice-today" id="today" aria-labelledby="today-title">
  <p className="eyebrow">TODAY / ONE SMALL STEP</p>
  <h2 id="today-title">Your voice comes first.</h2>
  <p>Choose one focus. Follow your teacher&apos;s guidance. Notice something you want to keep.</p>
  <nav className="today-path" aria-label="Today’s practice steps">
   <a href="#readiness"><span>01 / Check in</span><strong>How you feel today</strong></a>
   <a href="#exercise-library"><span>02 / Practice</span><strong>Choose one exercise</strong></a>
   <a href="#sing"><span>03 / Express</span><strong>Receive. Offer. Release.</strong></a>
  </nav>
  <p className="today-soft">Listening, writing, or resting can be today&apos;s choice. You do not have to post to make progress.</p>
  <details className="lesson-notebook" open>
   <summary>My lesson notebook</summary>
   <p>One song to return to. One useful reminder for next time.</p>
   <fieldset disabled={!loaded}>
    <legend className="notebook-sr-only">Private practice notes</legend>
    <div className="notebook-pair">
     <label>My song<input value={notes.song} maxLength={200} onChange={e=>update('song',e.target.value)} placeholder="A song that feels like me"/></label>
     <label>Today&apos;s focus<input value={notes.focus} maxLength={200} onChange={e=>update('focus',e.target.value)} placeholder="One phrase, one feeling, one detail"/></label>
    </div>
    <label>My teacher&apos;s guidance<textarea rows={3} maxLength={6000} value={notes.lesson} onChange={e=>update('lesson',e.target.value)} placeholder="The exercise or reminder from my lesson"/></label>
    <label>What I liked; what I want to try next<textarea rows={3} maxLength={6000} value={notes.reflection} onChange={e=>update('reflection',e.target.value)} placeholder="A moment I want to keep..."/></label>
    <div className="notebook-actions"><Button onClick={save}>Save my notes</Button><Button variant="outline" onClick={download}>Download notebook</Button></div>
   </fieldset>
   <p className="notebook-status" role="status">{status}</p>
   <p className="today-soft">Notes are saved only in this browser, not uploaded or published. They do not sync between devices. Download a copy before clearing browser data. No AI subscription needed.</p>
  </details>
  <a className="today-launch" href="#artist-launch">When you want to share: your 90-day artist plan</a>
 </section>;
}
