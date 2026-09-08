'use client';
import {useState} from 'react';
import {ArrowDownToLine,ArrowUpRight,Heart,Leaf,Sun} from 'lucide-react';

const intentions={
 Love:{thought:'Picture someone you care about, or a place where you feel welcome.',phrase:'This line is a gift, not an audition.'},
 Gratitude:{thought:'Choose one small, specific thing you appreciate today. There is no need to create a big emotion.',phrase:'Thank you for this moment.'},
 Presence:{thought:'Notice one color or sound around you. Neutral is enough; you do not have to feel happy.',phrase:'I can be here as I am.'},
};
const stages=[
 {name:'Receive',icon:ArrowDownToLine,heading:'Let a little air arrive.',image:'Imagine opening a window onto the garden.',cue:'Take an ordinary, comfortable breath. Nose if easy; mouth or both if needed. No sniffing harder through a blocked nostril, no full-lung target, and no hold.',expression:'Let your face be at rest. You do not need to look peaceful to begin.'},
 {name:'Offer',icon:Heart,heading:'Give the phrase to someone.',image:'Imagine your words reaching a person you love, rather than pushing sound across the room.',cue:'If the voice readiness checks are met, use one short phrase in your easy speaking-to-middle range. Let it ride the exhale; do not squeeze air out. Otherwise imagine or read the phrase silently.',expression:'A small smile may arrive naturally. Do not stretch your mouth, lift your chin or lock your teeth. For a trill or hum, keep the lips appropriate to that exercise.'},
 {name:'Release',icon:Leaf,heading:'Let the ending be enough.',image:'Imagine setting the phrase down gently, like a leaf on water.',cue:'Stop before you run out of comfortable air. Rest and let the next breath happen by itself. There is no need to empty your lungs or repeat the phrase immediately.',expression:'Let the smile go too. Neutral, tender or joyful can all be genuine.'},
];

export default function Visualization(){
 const [intention,setIntention]=useState<keyof typeof intentions>('Gratitude');
 const [step,setStep]=useState(0);
 const current=stages[step];
 return <section className="visualization" aria-labelledby="visualization-title">
  <div className="visualization-heading"><div><p className="eyebrow"><Sun size={14}/> INTENTION / OPTIONAL</p><h2 id="visualization-title">Receive. Offer. Release.</h2></div><div className="intentions" aria-label="Choose an intention">{(Object.keys(intentions) as (keyof typeof intentions)[]).map(name=><button key={name} onClick={()=>setIntention(name)} aria-pressed={name===intention}>{name}</button>)}</div></div>
  <p className="intention-thought">{intentions[intention].thought}</p>
  <nav className="breath-steps" aria-label="Visualization stages">{stages.map((stage,i)=><button key={stage.name} onClick={()=>setStep(i)} aria-pressed={i===step}><stage.icon size={22}/><span>{stage.name}</span>{i<2&&<ArrowUpRight className="step-arrow" size={15}/>}</button>)}</nav>
  <div className="imagery-cue" aria-live="polite"><p className="imagery-phrase">{current.heading}</p><p className="imagery-metaphor">{current.image}</p><p>{current.cue}</p><p><strong>Face & jaw:</strong> {current.expression}</p><blockquote>{intentions[intention].phrase}</blockquote></div>
  <p className="imagery-note">Move through these ideas at your own pace, not to a breathing count. This is a creative or spiritual metaphor, not an anatomy diagram or an injury treatment. Air enters the lungs, not the back, legs or an energy center. If inward focus increases anxiety, dizziness or air hunger, stop and look around the room instead. Love and gratitude are invitations, never requirements.</p>
 </section>;
}
