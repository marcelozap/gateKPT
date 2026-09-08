'use client';
/* Local persistence is hydrated after mount to keep server rendering deterministic. */
/* eslint-disable react-hooks/set-state-in-effect -- hydrate browser-only progress after server render */
import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Music2,
  Sun,
  Check,
  Play,
  Pause,
  RotateCcw,
  Download,
} from 'lucide-react';
import { Button, Checkbox } from './controls';
const blocks = [
  [
    '07:30',
    'Arrive gently',
    'Reset',
    2,
    'Notice normal breathing, speech and jaw movement. Let breathing find its own rhythm. No deep-breath target or breath holds.',
    '2 minutes; no repetitions.',
  ],
  [
    '07:35',
    'Breakfast & a quiet start',
    'Rest',
    25,
    'Eat, drink normally and leave space before work.',
    '25 minutes, optional default.',
  ],
  [
    '08:30',
    'First work block',
    'Work',
    45,
    'Use your comfortable, clinician-advised position. Do not combine work with planks or singing. Change position when needed.',
    'Up to 45 minutes; break earlier whenever needed.',
  ],
  [
    '09:15',
    'Optional movement break',
    'Move',
    3,
    'If walking is already comfortable, take an easy walk around the room. Skip if it adds pain, dizziness or breathlessness.',
    '1 to 3 minutes, within your comfortable baseline.',
  ],
  [
    '10:30',
    'Listen like a musician',
    'Music',
    5,
    'Choose 20 seconds of your own song. Listen for rhythm, phrase endings, then breath spaces. Tap the rhythm without singing.',
    '3 listens with a pause between.',
  ],
  [
    '12:00',
    'Lunch & screen break',
    'Rest',
    45,
    'Step away from work. Eat, drink normally and choose a comfortable position. Do not stretch into tightness.',
    '45 minutes, optional default.',
  ],
  [
    '14:00',
    'Map one phrase',
    'Music',
    5,
    'Mark a phrase boundary in your own lyric. Example: Let the morning in / let the day begin. Tap the rhythm or play the notes on an instrument.',
    'One line; up to 3 rhythm repetitions.',
  ],
  [
    '15:00',
    'Optional voice trial',
    'Voice',
    2,
    'Only if normal speech, breathing at rest and jaw movement are comfortable. Try one short line in your easy middle range at conversational volume. Rest at least as long as each phrase. No forced smile, jaw stretching, belting or high-note testing. Stop with added strain, pain, air hunger or hoarseness.',
    'Up to 3 short phrases; at most 2 minutes of actual voicing. Monday, Wednesday or Friday only.',
  ],
  [
    '16:00',
    'Optional movement break',
    'Move',
    3,
    'Repeat only easy movement that felt comfortable earlier. No need to increase distance or effort.',
    '1 to 3 minutes, or skip.',
  ],
  [
    '18:30',
    'Dinner & time off',
    'Rest',
    45,
    'Leave a genuine gap from practice and work. Rest your voice if it feels tired.',
    '45 minutes, optional default.',
  ],
  [
    '20:30',
    'Close the day',
    'Reset',
    2,
    'Notice whether speaking or movement feels worse. If so, skip the next voice trial. Repeated symptoms need assessment; completing a calendar is not clearance to progress.',
    '2 minutes; no extra repetitions.',
  ],
  [
    '22:30',
    'Wind down',
    'Rest',
    30,
    'Leave a consistent window for sleep. Tomorrow is another small practice day, not a test of endurance.',
    '30 minutes, optional default.',
  ],
] as const;
const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export default function Calendar() {
  const [date, setDate] = useState(''),
    [done, setDone] = useState<Record<string, boolean>>({}),
    [loaded, setLoaded] = useState(false),
    [warning, setWarning] = useState(''),
    [ready, setReady] = useState([false, false, false]),
    [selected, setSelected] = useState(0),
    [remaining, setRemaining] = useState(120),
    [running, setRunning] = useState(false);
  useEffect(() => {
    setDate(key(new Date()));
    try {
      const p = JSON.parse(localStorage.getItem('practice-days-v1') || '{}');
      if (p && typeof p === 'object' && !Array.isArray(p))
        setDone(
          Object.fromEntries(
            Object.entries(p).filter(([, v]) => typeof v === 'boolean'),
          ) as Record<string, boolean>,
        );
    } catch {
      setWarning('Progress could not be loaded.');
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem('practice-days-v1', JSON.stringify(done));
      } catch {
        setWarning('Progress is not being saved. Export before leaving.');
      }
  }, [done, loaded]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () =>
        setRemaining((n) => {
          if (n <= 1) {
            setRunning(false);
            return 0;
          }
          return n - 1;
        }),
      1000,
    );
    return () => clearInterval(id);
  }, [running]);
  const picked = date ? new Date(date + 'T12:00:00') : new Date();
  const canVoice = ready.every(Boolean) && [1, 3, 5].includes(picked.getDay());
  const b = blocks[selected];
  function choose(i: number) {
    setSelected(i);
    setRunning(false);
    setRemaining(blocks[i][3] * 60);
  }
  function move(n: number) {
    const d = new Date(picked);
    d.setDate(d.getDate() + n);
    setDate(key(d));
    setReady([false, false, false]);
    setRunning(false);
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(done, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'practice-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <header>
        <strong>
          <Sun size={20} /> Practice Day
        </strong>
        <span>XIV / HEALTH</span>
      </header>
      <main className="workspace">
        <section className="heading">
          <div>
            <p className="eyebrow">SPACE FOR MUSIC. ROOM TO RECOVER.</p>
            <h1>Your daily rhythm</h1>
            <p>
              A gentle starting schedule, not an injury-rehabilitation
              prescription.
            </p>
          </div>
          <Button variant="outline" onClick={download}>
            <Download /> Export progress
          </Button>
        </section>
        <nav className="dates" aria-label="Calendar date">
          <Button
            variant="outline"
            onClick={() => move(-1)}
            aria-label="Previous day"
          >
            <ChevronLeft />
          </Button>
          <input
            aria-label="Practice date"
            type="date"
            value={date}
            onChange={(e) => {
              if (e.target.value) {
                setDate(e.target.value);
                setReady([false, false, false]);
                setRunning(false);
              }
            }}
          />
          <Button
            variant="outline"
            onClick={() => move(1)}
            aria-label="Next day"
          >
            <ChevronRight />
          </Button>
          <span>
            {blocks.filter((_, i) => done[date + ':' + i]).length} /{' '}
            {blocks.length} complete
          </span>
        </nav>
        {warning && <output>{warning}</output>}
        <section className="readiness">
          <h2>Before any voice practice</h2>
          {[
            'Breathing is comfortable at rest',
            'Normal speech is comfortable',
            'Jaw opens and closes comfortably, without locking',
          ].map((text, i) => (
            <label key={text}>
              <Checkbox
                checked={ready[i]}
                onCheckedChange={(v) => {
                  setReady((old) => old.map((x, j) => (j === i ? !!v : x)));
                  setRunning(false);
                }}
              />
              {text}
            </label>
          ))}
          <p>
            {canVoice
              ? 'Optional short trial today. These checks are not medical clearance.'
              : 'Today can be entirely non-vocal. Listening and phrasing still count.'}
          </p>
        </section>
        <div className="columns">
          <section className="timeline">
            <h2>
              Today’s schedule <small>Local time / optional defaults</small>
            </h2>
            {blocks.map((block, i) => (
              <article
                key={i}
                className={'row ' + (selected === i ? 'selected' : '')}
              >
                <time>{block[0]}</time>
                <button className="block" onClick={() => choose(i)}>
                  <span className={'tag ' + block[2]}>{block[2]}</span>
                  <strong>
                    {block[2] === 'Voice' && !canVoice
                      ? 'Silent phrasing practice'
                      : block[1]}
                  </strong>
                  <small>{block[3]} min</small>
                </button>
                <Checkbox
                  aria-label={'Complete ' + block[1]}
                  checked={!!done[date + ':' + i]}
                  onCheckedChange={(v) =>
                    setDone((old) => ({ ...old, [date + ':' + i]: !!v }))
                  }
                />
              </article>
            ))}
          </section>
          <aside>
            <section className="practice">
              <p className="eyebrow">
                {b[0]} / {b[2]}
              </p>
              <Music2 size={30} />
              <h2>
                {b[2] === 'Voice' && !canVoice
                  ? 'Silent phrasing practice'
                  : b[1]}
              </h2>
              <p>
                {b[2] === 'Voice' && !canVoice
                  ? 'Listen to one short phrase and mark rhythm and breath spaces on paper. Do not sing through discomfort.'
                  : b[4]}
              </p>
              <p className="dose">
                {b[2] === 'Voice' && !canVoice
                  ? 'One phrase. Two minutes of quiet listening.'
                  : b[5]}
              </p>
              <div className="timer">
                {Math.floor(remaining / 60)}:
                {String(remaining % 60).padStart(2, '0')}
              </div>
              <div className="actions">
                <Button
                  onClick={() => setRunning(!running)}
                  disabled={!remaining}
                  aria-label={running ? 'Pause timer' : 'Start timer'}
                  title={running ? 'Pause timer' : 'Start timer'}
                >
                  {running ? <Pause /> : <Play />}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRunning(false);
                    setRemaining(b[3] * 60);
                  }}
                  aria-label="Reset timer"
                  title="Reset timer"
                >
                  <RotateCcw />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDone((old) => ({
                      ...old,
                      [date + ':' + selected]: true,
                    }));
                    setRunning(false);
                  }}
                >
                  <Check /> Done
                </Button>
              </div>
            </section>
            <section className="guardrails">
              <h2>Keep it easy</h2>
              <p>
                Stop for added pain, strain, dizziness, air hunger or
                hoarseness. No breath holds, jaw manipulation, chest pressure or
                planks while singing.
              </p>
              <p>
                Persistent difficulty breathing or speaking and jaw dysfunction
                need a focused assessment before harder training. Severe or new
                breathing difficulty, chest pain or fainting needs urgent care.
              </p>
              <p>
                No swimming, running or strength progression is prescribed here.
              </p>
              <a href="https://www.nidcd.nih.gov/health/taking-care-your-voice">
                Voice care / NIDCD
              </a>
              <br />
              <a href="https://www.nidcr.nih.gov/health-info/tmd">
                Jaw symptoms / NIDCR
              </a>
            </section>
          </aside>
        </div>
      </main>
      <footer>
        Small sessions. No catching up. Progress stays in this browser.
      </footer>
    </>
  );
}
