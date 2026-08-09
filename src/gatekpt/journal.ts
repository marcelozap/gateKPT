export type JournalEntry = {
  slug: string;
  date: string;
  title: string;
  layer: string;
  summary: string;
  body: string[];
};

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    slug: "ai-stack-ground-map",
    date: "2026-08-09",
    title: "AI stack ground map",
    layer: "L01-L07",
    summary:
      "A first public version of the system map: power, chips, data, models, software, testing, and business context.",
    body: [
      "The first thing I wanted to make public was the map itself. AI is usually explained from the model outward, but that skips the system underneath it.",
      "Power, chips, data, models, software, testing, and business context all shape what AI can actually do. If one layer is weak, everything above it bends around that limit.",
      "This log is where I will keep turning scattered notes into structured entries. Some entries will be technical, some will be industry or career context, and some will be about how to use AI better in real work.",
    ],
  },
  {
    slug: "why-power-comes-first",
    date: "2026-08-09",
    title: "Why power comes first",
    layer: "L01 Power",
    summary:
      "AI is not only software. Compute depends on electricity, cooling, sites, interconnect, and physical buildout timelines.",
    body: [
      "The physical layer matters because models do not run in the abstract. They run in buildings full of chips, cooling systems, networking, and power contracts.",
      "A company can order hardware faster than it can always connect a new site to the grid. That makes power a real constraint, not a background detail.",
      "When AI news talks about model capability, I want to keep asking what physical layer had to exist before that capability could show up.",
    ],
  },
  {
    slug: "data-before-model-behavior",
    date: "2026-08-09",
    title: "Data before model behavior",
    layer: "L03 Data",
    summary:
      "A model can only reason over what has been structured, linked, governed, retrieved, and trusted enough to use.",
    body: [
      "A lot of AI discussions jump straight to the model, but practical systems usually fail earlier. The data is messy, split across tools, missing identifiers, or not trusted enough to automate against.",
      "Before an AI system can answer a question, someone has to decide what the records mean, how they connect, where they came from, and what confidence is acceptable.",
      "That is why formatting, schema design, traceability, and validation are not boring prep work. They are the foundation that makes the model useful.",
    ],
  },
  {
    slug: "prompting-as-work-design",
    date: "Planned",
    title: "Instructions as work design",
    layer: "Practice lab",
    summary:
      "A practical guide for turning loose requests into context, constraints, examples, output formats, and verification steps.",
    body: [
      "A good model instruction is not magic phrasing. It is work design: context, objective, constraints, examples, output shape, and a way to check the result.",
      "I want this entry to become a reusable guide for people who are learning how to ask better questions of language models without turning it into hype.",
    ],
  },
  {
    slug: "weekly-ai-brief-format",
    date: "Planned",
    title: "Weekly AI brief format",
    layer: "Briefs",
    summary:
      "A recurring note format for tracking what changed, why it matters, and which layer of the stack it touches.",
    body: [
      "A weekly AI brief should not just collect headlines. It should map each event to the layer it changes: power, chips, data, models, software, testing, business context, or human workflow.",
      "The goal is to make the news usable: what changed, why it matters, what is uncertain, and what I should keep watching.",
    ],
  },
];

export const JOURNAL_ENTRIES_ES: JournalEntry[] = [
  {
    slug: "ai-stack-ground-map",
    date: "2026-08-09",
    title: "Mapa base del stack de IA",
    layer: "L01-L07",
    summary:
      "Primera version publica del mapa: energia, chips, datos, modelos, software, pruebas y contexto de negocio.",
    body: [
      "Lo primero que queria hacer publico era el mapa. Muchas veces la IA se explica desde el modelo hacia afuera, pero eso salta el sistema que esta debajo.",
      "Energia, chips, datos, modelos, software, pruebas y contexto de negocio forman lo que la IA puede hacer en la vida real. Si una capa es debil, todo lo de arriba se dobla alrededor de ese limite.",
      "Este diario es donde voy a convertir notas sueltas en entradas organizadas. Algunas seran tecnicas, otras seran de contexto, carrera o formas practicas de usar IA en trabajo real.",
    ],
  },
  {
    slug: "why-power-comes-first",
    date: "2026-08-09",
    title: "Por que la energia viene primero",
    layer: "L01 Energia",
    summary:
      "La IA no es solo software. Depende de electricidad, enfriamiento, edificios, conexiones y tiempo fisico de construccion.",
    body: [
      "La capa fisica importa porque los modelos no corren en el aire. Corren en edificios llenos de chips, sistemas de enfriamiento, redes y contratos de energia.",
      "Una empresa puede ordenar hardware mas rapido de lo que siempre puede conectar un sitio nuevo a la red electrica. Por eso la energia es un limite real, no un detalle de fondo.",
      "Cuando una noticia habla de la capacidad de un modelo, quiero seguir preguntando que capa fisica tuvo que existir antes para que esa capacidad apareciera.",
    ],
  },
  {
    slug: "data-before-model-behavior",
    date: "2026-08-09",
    title: "Datos antes del comportamiento del modelo",
    layer: "L03 Datos",
    summary:
      "Un modelo solo puede razonar sobre datos que fueron organizados, conectados, gobernados, encontrados y confiados.",
    body: [
      "Muchas conversaciones de IA saltan directo al modelo, pero los sistemas practicos fallan antes. Los datos estan desordenados, divididos entre herramientas, sin identificadores comunes o sin confianza suficiente para automatizar.",
      "Antes de que un sistema de IA pueda contestar una pregunta, alguien tiene que decidir que significan los registros, como se conectan, de donde vinieron y que nivel de confianza es aceptable.",
      "Por eso el formato, el diseno de esquemas, la trazabilidad y la validacion no son trabajo aburrido. Son la base que hace util al modelo.",
    ],
  },
  {
    slug: "prompting-as-work-design",
    date: "Planeado",
    title: "Instrucciones como diseno de trabajo",
    layer: "Laboratorio",
    summary:
      "Una guia practica para convertir preguntas sueltas en contexto, limites, ejemplos, formato de salida y pasos de verificacion.",
    body: [
      "Una buena instruccion para un modelo no es una frase magica. Es diseno de trabajo: contexto, objetivo, limites, ejemplos, forma de salida y una manera de revisar el resultado.",
      "Quiero que esta entrada sea una guia reusable para personas que estan aprendiendo a pedir mejores resultados a modelos de lenguaje sin convertirlo en humo.",
    ],
  },
  {
    slug: "weekly-ai-brief-format",
    date: "Planeado",
    title: "Formato semanal de IA",
    layer: "Briefs",
    summary:
      "Un formato recurrente para seguir que cambio, por que importa y que capa del stack toca.",
    body: [
      "Un resumen semanal de IA no debe ser solo una lista de titulares. Debe mapear cada evento a la capa que cambia: energia, chips, datos, modelos, software, pruebas, contexto de negocio o flujo humano.",
      "La meta es hacer que las noticias sean utiles: que cambio, por que importa, que sigue incierto y que debo seguir observando.",
    ],
  },
];

export type Locale = "en" | "es";

export function getJournalEntries(locale: Locale = "en") {
  return locale === "es" ? JOURNAL_ENTRIES_ES : JOURNAL_ENTRIES;
}

export function getJournalEntry(slug: string, locale: Locale = "en") {
  return getJournalEntries(locale).find((entry) => entry.slug === slug);
}
