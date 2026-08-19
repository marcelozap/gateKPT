export type AudioSourceType = "track" | "live" | "query";

export type AudioAnalysisV1 = {
  schema_version: "1.0.0";
  source_id: string;
  source_type: AudioSourceType;
  source_name?: string;
  duration_s: number;
  sample_rate: number;
  bpm: number;
  beat_times: number[];
  downbeat_times: number[];
  onset_times: number[];
  energy_curve: {
    hop_s: number;
    rms: number[];
  };
  confidence: {
    bpm: number;
    beats: number;
    downbeats: number;
    onsets: number;
  };
  model_versions: Record<string, string>;
  provenance: {
    owner: string;
    license: string;
    consent: string;
  };
  created_at: string;
  spectral_features_ref?: string;
  clap_embedding_ref?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readNumberArray(value: unknown, field: string, allowEmpty = false): number[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || !value.every(isNumber)) {
    throw new Error(`${field} must be an ${allowEmpty ? "array" : "non-empty array"} of numbers`);
  }
  if (value.some((item, index) => index > 0 && item <= value[index - 1])) {
    throw new Error(`${field} must be strictly increasing`);
  }
  return value;
}

function readConfidence(value: unknown): AudioAnalysisV1["confidence"] {
  if (!isRecord(value)) throw new Error("confidence is missing");
  const keys = ["bpm", "beats", "downbeats", "onsets"] as const;
  if (!keys.every((key) => isNumber(value[key]) && value[key] >= 0 && value[key] <= 1)) {
    throw new Error("confidence values must be between 0 and 1");
  }
  const bpm = value.bpm;
  const beats = value.beats;
  const downbeats = value.downbeats;
  const onsets = value.onsets;
  if (!isNumber(bpm) || !isNumber(beats) || !isNumber(downbeats) || !isNumber(onsets)) {
    throw new Error("confidence values must be numbers");
  }
  return {
    bpm,
    beats,
    downbeats,
    onsets,
  };
}

export function parseAudioAnalysisV1(text: string): AudioAnalysisV1 {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("analysis file is not valid JSON");
  }
  if (!isRecord(value)) throw new Error("analysis file must contain an object");
  if (value.schema_version !== "1.0.0") throw new Error("unsupported AudioAnalysisV1 version");

  const sourceType = value.source_type;
  if (sourceType !== "track" && sourceType !== "live" && sourceType !== "query") {
    throw new Error("source_type must be track, live, or query");
  }
  if (typeof value.source_id !== "string" || value.source_id.length === 0) {
    throw new Error("source_id is missing");
  }
  const duration = value.duration_s;
  if (!isNumber(duration) || duration <= 0) {
    throw new Error("duration_s must be positive");
  }
  const sampleRate = value.sample_rate;
  if (!isNumber(sampleRate) || sampleRate <= 0) {
    throw new Error("sample_rate must be positive");
  }
  const bpm = value.bpm;
  if (!isNumber(bpm) || bpm < 20 || bpm > 300) {
    throw new Error("bpm must be between 20 and 300");
  }

  const beatTimes = readNumberArray(value.beat_times, "beat_times");
  const downbeatTimes = readNumberArray(value.downbeat_times, "downbeat_times", true);
  const onsetTimes = readNumberArray(value.onset_times, "onset_times", true);
  if (beatTimes.length < 4) throw new Error("analysis needs at least four beats");
  if (beatTimes.some((time) => time > duration + 0.05)) {
    throw new Error("beat_times contains a timestamp outside the track");
  }
  if (downbeatTimes.some((time) => !beatTimes.includes(time))) {
    throw new Error("downbeat_times must be a subset of beat_times");
  }

  const energy = value.energy_curve;
  if (!isRecord(energy) || !isNumber(energy.hop_s) || !Array.isArray(energy.rms) || !energy.rms.every(isNumber)) {
    throw new Error("energy_curve must contain hop_s and rms[]");
  }
  if (!isRecord(value.model_versions) || typeof value.model_versions.analysis !== "string") {
    throw new Error("model_versions.analysis is missing");
  }
  const provenance = value.provenance;
  if (!isRecord(provenance) || typeof provenance.owner !== "string" || typeof provenance.license !== "string" || typeof provenance.consent !== "string") {
    throw new Error("provenance is incomplete");
  }
  if (typeof value.created_at !== "string") throw new Error("created_at is missing");

  return {
    schema_version: "1.0.0",
    source_id: value.source_id,
    source_type: sourceType,
    source_name: typeof value.source_name === "string" ? value.source_name : undefined,
    duration_s: duration,
    sample_rate: sampleRate,
    bpm,
    beat_times: beatTimes,
    downbeat_times: downbeatTimes,
    onset_times: onsetTimes,
    energy_curve: { hop_s: energy.hop_s, rms: energy.rms },
    confidence: readConfidence(value.confidence),
    model_versions: Object.fromEntries(
      Object.entries(value.model_versions).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    ),
    provenance: {
      owner: provenance.owner,
      license: provenance.license,
      consent: provenance.consent,
    },
    created_at: value.created_at,
    spectral_features_ref: typeof value.spectral_features_ref === "string" ? value.spectral_features_ref : undefined,
    clap_embedding_ref: typeof value.clap_embedding_ref === "string" ? value.clap_embedding_ref : undefined,
  };
}

export function audioAnalysisLabel(analysis: AudioAnalysisV1): string {
  return analysis.source_name?.trim() || analysis.source_id;
}
