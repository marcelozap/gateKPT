export type DanceLocale = "en" | "es";

export type DanceCopy = {
  kicker: string;
  title: string;
  lede: string;
  privacy: string;
  start: string;
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
    input: string;
    round: string;
  };
};

export const danceCopy: Record<DanceLocale, DanceCopy> = {
  en: {
    kicker: "LAB / EXPERIMENT 01",
    title: "Dance Lab",
    lede:
      "A timing instrument. The camera tracks your wrists; the clock plays a house pattern. Hit the rings on the beat.",
    privacy:
      "Pose tracking runs in your browser. No video leaves this device.",
    start: "START TRACKING",
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
      input: "INPUT",
      round: "ROUND",
    },
  },
  es: {
    kicker: "LAB / EXPERIMENTO 01",
    title: "Dance Lab",
    lede:
      "Un instrumento de timing. La camara sigue tus munecas; el reloj toca un patron house. Toca los anillos en el beat.",
    privacy:
      "El tracking corre en tu navegador. Ningun video sale de este equipo.",
    start: "INICIAR TRACKING",
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
      input: "INPUT",
      round: "RONDA",
    },
  },
};
