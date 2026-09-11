'use client';

import './notebook.css';
import ReleaseVideos from './ReleaseVideos';

export default function PracticeNotebook() {
  return (
    <section className="practice-today" id="today" aria-labelledby="today-title">
      <p className="eyebrow">TODAY / ONE SMALL STEP</p>
      <h2 id="today-title">Your voice comes first.</h2>
      <p>Check in. Choose one exercise. Give one phrase meaning.</p>
      <nav className="today-path" aria-label="Today's practice steps">
        <a href="#readiness"><span>01 / Check in</span><strong>How you feel today</strong></a>
        <a href="#exercise-library"><span>02 / Practice</span><strong>Choose one exercise</strong></a>
        <a href="#sing"><span>03 / Express</span><strong>Receive. Offer. Release.</strong></a>
      </nav>
      <div className="lesson-notebook" role="region" aria-labelledby="practice-cues-title">
        <h3 id="practice-cues-title">Something to try today</h3>
        <p><strong>Picture one person.</strong><br />Imagine someone you feel comfortable singing to. Let the camera stand in for them.</p>
        <p><strong>Give one phrase a feeling.</strong><br />Choose a familiar song phrase. Imagine offering gratitude, comfort, or hope, rather than trying to impress.</p>
        <p><strong>Keep one small moment.</strong><br />When you feel ready, record a short clip. Listen once for a moment that feels honest. Keeping it private counts.</p>
        <p className="today-soft">Before a take: &ldquo;I can share this without making it perfect.&rdquo;</p>
      </div>
      <p className="today-soft">Listening or resting can be today's choice. Follow the check-in and exercise safety guidance below.</p>
      <a className="today-launch" href="#artist-launch">When you want to share: your 90-day artist plan</a>
      <section className="lesson-notebook" aria-labelledby="recording-recipe-title" style={{ marginTop: '2rem' }}>
        <p className="eyebrow">YOUR FIRST CLIP / KEEP IT SIMPLE</p>
        <h3 id="recording-recipe-title">One phrase. One person. One take.</h3>
        <ol style={{ paddingLeft: '1.5rem', lineHeight: 1.8 }}>
          <li><strong>Wear what you have.</strong> An off-white tee if you like. Your current hair and stubble are fine.</li>
          <li><strong>Face a window.</strong> Choose soft daylight and a simple background.</li>
          <li><strong>Phone at eye level.</strong> Prop it securely, film vertically, and keep your face and shoulders in frame.</li>
          <li><strong>Sing one familiar phrase.</strong> Imagine sharing it with someone you feel comfortable with, not an audience to impress.</li>
          <li><strong>Listen once.</strong> Notice one moment you like. Keep the clip private or share when you want.</li>
        </ol>
        <p className="today-soft">No new gear. No perfect look required. Posting is optional.</p>
      </section>
      <ReleaseVideos />
    </section>
  );
}
