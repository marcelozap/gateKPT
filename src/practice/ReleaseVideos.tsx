const videos = [
  {
    area: 'Jaw',
    title: 'Jaw relaxation',
    id: '8wFSeYB9pN8',
    provider: 'Cleveland Clinic',
    source: 'https://www.youtube.com/watch?v=8wFSeYB9pN8',
    note: 'A jaw exercise demonstration, not a diagnosis or a required singing warm-up. Do not force your mouth open.',
  },
  {
    area: 'Neck',
    title: 'Head and neck relaxation',
    id: 'TOFWfjty4OA',
    provider: 'East Sussex Healthcare NHS Trust',
    source: 'https://www.esht.nhs.uk/service/speech-and-language-therapy/video-exercises/',
    note: 'Watch as a reference. This NHS therapy routine is for use only when recommended by your speech and language therapist.',
  },
  {
    area: 'Shoulders / collarbone area',
    title: 'Upper back and chest stretches',
    id: 'GcPujVayIbI',
    provider: 'Cambridge University Hospitals NHS',
    source: 'https://www.cuh.nhs.uk/our-services/physiotherapy-outpatients/outpatient-physio-resources/resources/shoulder/seated-stretches/',
    note: 'Seated shoulder and upper-chest movement, not direct pressure on the collarbone or throat.',
  },
  {
    area: 'Throat / voice',
    title: 'Understand and care for your voice',
    id: 'G1NdAp6IJ8Y',
    provider: 'Surrey and Sussex Healthcare NHS Trust',
    source: 'https://www.surreyandsussex.nhs.uk/our-services/therapies/voice-therapy',
    note: 'Voice anatomy and care education, not a throat-release exercise. Leave hands-on laryngeal massage to a qualified voice clinician.',
  },
];

export default function ReleaseVideos() {
  return (
    <section id="release-videos" aria-labelledby="release-videos-title" style={{ marginTop: '2rem', scrollMarginTop: '2rem' }}>
      <p className="eyebrow">WATCH / EASE / REST</p>
      <h3 id="release-videos-title">Jaw, neck &amp; shoulder release</h3>
      <p>Watch first. These are reference videos, not a routine you need to complete.</p>
      <p className="today-soft"><strong>Keep it comfortable.</strong> Stop for pain, dizziness, jaw locking, or worsening voice symptoms. Do not press into the front or sides of your throat. Ask a clinician before exercising an injured or painful area.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.25rem' }}>
        {videos.map((video) => (
          <article key={video.id} className="lesson-notebook" style={{ minWidth: 0, margin: 0, padding: '1rem' }}>
            <p className="eyebrow">{video.area}</p>
            <h4 style={{ fontSize: '1.125rem', margin: '0 0 0.75rem' }}>{video.title}</h4>
            <p className="today-soft">{video.note}</p>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.id}`}
              title={`${video.title} - ${video.provider}`}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              style={{ width: '100%', aspectRatio: '16 / 9', border: 0, display: 'block', borderRadius: '8px' }}
            />
            <p style={{ fontSize: '0.875rem', marginBottom: 0 }}>
              <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
              {' / '}
              <a href={video.source} target="_blank" rel="noopener noreferrer">{video.provider}</a>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
