import { ArrowDown, Footprints, Music2, Play, Sun } from 'lucide-react';

export default function GardenEntrance() {
  return <section className="garden-entrance" aria-labelledby="garden-title">
    <div className="garden-caption"><Sun size={18}/><span>XIV / THE PRACTICE GARDEN</span></div>
    <div className="garden-copy"><p>Room to move. Room to make music.</p><h1 id="garden-title">Singing Practice</h1><a href="#today">Today&apos;s practice <ArrowDown size={18}/></a></div>
    <nav aria-label="Practice areas"><a href="#movement-title"><Play size={18}/> Watch <span>01</span></a><a href="#move"><Footprints size={18}/> Move <span>02</span></a><a href="#sing"><Music2 size={18}/> Sing <span>03</span></a></nav>
  </section>;
}
