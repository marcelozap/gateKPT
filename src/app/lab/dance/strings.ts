export type DanceLocale = "en" | "es";

export type DanceCopy = {
  kicker: string;
  title: string;
  lede: string;
  privacy: string;
  guide: string;
  trackLabel: string;
  trackReady: string;
  trackOptional: string;
  loadAnalysis: string;
  loadAudio: string;
  trackPrivacy: string;
  start: string;
  startTrack: string;
  simulator: string;
  loading: string[];
  cameraDenied: string;
  cameraRetry: string;
  calibrate: string;
  calibrateHold: string;
  countdown: string;
  pause: string;
  resume: string;
  score: string;
  combo: string;
  best: string;
  perfect: string;
  good: string;
  late: string;
  miss: string;
  done: string;
  retry: string;
  backHome: string;
  magentaPhrase: string;
  labels: {
    audio: string;
    pose: string;
    lead: string;
    input: string;
    round: string;
  };
};

export const danceCopy: Record<DanceLocale, DanceCopy> = {
  en: {
    kicker: "LAB / EXPERIMENT 01",
    title: "Dance Lab",
    lede:
      "A lead dancer moves first. Follow the ghost’s body, then meet each hand cue on the beat.",
    privacy:
      "Pose tracking runs in your browser. No video leaves this device.",
    guide:
      "CYAN = LEAD DANCER · AMBER = YOU · RINGS = TIMING CUES",
    trackLabel: "MALO SOUND / AUDIOANALYSISV1",
    trackReady: "READY",
    trackOptional: "OPTIONAL",
    loadAnalysis: "LOAD BEAT GRID JSON",
    loadAudio: "LOAD AUDIO FILE",
    trackPrivacy: "LOCAL FILES STAY IN THIS BROWSER.",
    start: "START TRACKING",
    startTrack: "RUN TRACK + TRACKING",
    simulator: "no camera - run the pointer simulator",
    loading: [
      "loading vision runtime",
      "loading pose model",
      "starting camera",
    ],
    cameraDenied:
      "Camera blocked. The lab needs it to see your wrists - or run the pointer simulator instead.",
    cameraRetry: "RETRY CAMERA",
    calibrate: "Stand back until both wrists are in frame.",
    calibrateHold: "hold still",
    countdown: "on the next four counts",
    pause: "PAUSE",
    resume: "RESUME",
    score: "SCORE",
    combo: "COMBO",
    best: "BEST COMBO",
    perfect: "PERFECT",
    good: "ON TIME",
    late: "LATE",
    miss: "MISS",
    done: "Round complete.",
    retry: "RUN IT AGAIN",
    backHome: "back to the journal",
    magentaPhrase: "the body is the controller.",
    labels: {
      audio: "AUDIO.CLOCK",
      pose: "POSE.TRACK",
      lead: "LEAD.MODE",
      input: "INPUT",
      round: "ROUND",
    },
  },
  es: {
    kicker: "LAB / EXPERIMENTO 01",
    title: "Dance Lab",
    lede:
      "Un bailarin guia se mueve primero. Sigue su cuerpo y encuentra cada señal de manos en el beat.",
    privacy:
      "El tracking corre en tu navegador. Ningun video sale de este equipo.",
    guide:
      "CIAN = GUIA · AMBAR = TU · ANILLOS = SEÑALES DE TIEMPO",
    trackLabel: "MALO SOUND / AUDIOANALYSISV1",
    trackReady: "LISTO",
    trackOptional: "OPCIONAL",
    loadAnalysis: "CARGAR JSON DE BEATS",
    loadAudio: "CARGAR AUDIO",
    trackPrivacy: "LOS ARCHIVOS LOCALES SE QUEDAN EN ESTE NAVEGADOR.",
    start: "INICIAR TRACKING",
    startTrack: "EJECUTAR TRACK + TRACKING",
    simulator: "sin camara - usar el simulador de puntero",
    loading: [
      "cargando runtime de vision",
      "cargando modelo de pose",
      "iniciando camara",
    ],
    cameraDenied:
      "Camara bloqueada. El lab la necesita para ver tus munecas - o usa el simulador de puntero.",
    cameraRetry: "REINTENTAR CAMARA",
    calibrate: "Alejate hasta que las dos munecas entren en cuadro.",
    calibrateHold: "quieto",
    countdown: "en los proximos cuatro tiempos",
    pause: "PAUSA",
    resume: "CONTINUAR",
    score: "PUNTOS",
    combo: "COMBO",
    best: "MEJOR COMBO",
    perfect: "PERFECTO",
    good: "A TIEMPO",
    late: "TARDE",
    miss: "FALLO",
    done: "Ronda completa.",
    retry: "OTRA VEZ",
    backHome: "volver al diario",
    magentaPhrase: "el cuerpo es el controlador.",
    labels: {
      audio: "AUDIO.CLOCK",
      pose: "POSE.TRACK",
      lead: "MODO.GUIA",
      input: "INPUT",
      round: "RONDA",
    },
  },
};
