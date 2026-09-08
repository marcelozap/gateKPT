import { Footprints, MoveUpRight } from 'lucide-react';

const options = [
  {
    title: 'Easy walk',
    amount: 'Optional trial: 2 to 5 minutes, once.',
    instructions: 'Use a flat, familiar route at an easy pace. Let your arms move naturally. Keep breathing comfortable; do not force nose-only breathing or pull your shoulders back. No singing while walking for this trial.',
    cue: 'An unhurried walk, not a fitness test.',
    stop: 'Stop if you feel breathless, dizzy, unsteady or develop pain. Skip when breathing is uncomfortable at rest.',
  },
  {
    title: 'Small neck turn',
    amount: 'Optional trial: 3 slow turns each way. No hold.',
    instructions: 'In a comfortable supported position, turn your head a little to one side and return to the middle. Keep within an easy, pain-free range. Do not pull with your hand, circle the neck or seek a crack.',
    cue: 'Look toward something nearby, without reaching the end of your range.',
    stop: 'Stop with pain, dizziness, headache, tingling, numbness or symptoms spreading into an arm. Follow existing movement restrictions.',
  },
  {
    title: 'Gentle chin retraction',
    amount: 'Only if already approved for you: 3 small repetitions, no sustained hold.',
    instructions: 'Keep your gaze level and glide your head slightly backward, then release. Do not tip your chin down, clench your teeth or press your head against resistance. This is not a jaw adjustment.',
    cue: 'A small backward glide, not a hard double-chin squeeze.',
    stop: 'Skip if it changes your swallowing or breathing, increases jaw or neck symptoms, or causes dizziness or arm symptoms.',
  },
  {
    title: 'Small glute bridge',
    amount: 'Only if cleared for your back: 3 slow repetitions, one set. Rest 30 to 60 seconds afterward.',
    instructions: 'Lie on your back with knees bent and feet flat, only if that position is comfortable. Keep your neck supported and back neutral. Gently lift your hips a small comfortable distance, then lower. Keep breathing normally. Do not arch high, push through your neck or squeeze your abdomen as hard as possible.',
    cue: 'Let the hips do a little work while the face stays relaxed.',
    stop: 'Skip if lying on your back is uncomfortable. Stop with back or leg pain, tingling, cramping, neck pressure or breath holding.',
  },
];

export default function PhysicalSupport() {
  return <section className="physical-support" aria-labelledby="physical-title">
    <p className="eyebrow"><Footprints size={16}/> MOVEMENT / PHYSICAL SUPPORT</p>
    <h2 id="physical-title">Support the body. Keep the voice easy.</h2>
    <p>General movement can support physical endurance. Stronger abs do not automatically make singing effortless, and these exercises do not diagnose or treat breathing, jaw or nerve problems.</p>
    <p><strong>Choose one, not a circuit.</strong> These reduced amounts are cautious examples, not a personalized rehabilitation prescription. With ongoing back, neck or breathing symptoms, confirm which strengthening exercises are appropriate before starting them. Do not sing during strength work.</p>
    {options.map(option => <details key={option.title}>
      <summary>{option.title}<span>{option.amount}</span></summary>
      <div className="physical-detail"><p>{option.instructions}</p><p><strong>Picture it:</strong> {option.cue}</p><p className="exercise-stop"><strong>Stop / skip:</strong> {option.stop}</p></div>
    </details>)}
    <p><strong>Planks: later, not harder.</strong> A modified plank is a general core option, but relief during a hold does not establish that it is suitable. Get the variation checked before adding it with persistent neck or breathing symptoms. No long holds, maximal bracing or training to failure.</p>
    <p><strong>Afterward:</strong> you should not feel worse later or the next morning. If you do, stop that exercise rather than adding repetitions. New severe breathing difficulty, chest pain, fainting or new weakness needs urgent medical help.</p>
    <nav aria-label="Illustrated movement references"><a href="https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/core-strength/art-20546851" target="_blank" rel="noopener noreferrer">Core exercise illustrations / Mayo Clinic <MoveUpRight size={14}/></a><a href="https://www.cuh.nhs.uk/patient-information/neck-exercises-and-advice/" target="_blank" rel="noopener noreferrer">Neck movement illustrations / CUH <MoveUpRight size={14}/></a></nav>
  </section>;
}
