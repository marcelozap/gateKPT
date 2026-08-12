export type Locale = "en" | "es";

export type Layer = {
  id: string;
  name: string;
  essence: string;
  fig: string;
  unit: string;
  figcap: string;
  src: string;
  srcUrl: string;
  brk: string;
};

export type LogEntry = {
  slug: string;
  date: string;
  title: string;
  layer: string;
  summary: string;
  body: string[];
};

export const layersEn: Layer[] = [
  {
    id: "L01",
    name: "Power",
    essence: "AI runs on electricity. Getting it takes years.",
    fig: "5+",
    unit: "yr",
    figcap: "Median wait to connect a new project to the US grid.",
    src: "Berkeley Lab, Queued Up 2026",
    srcUrl: "https://emp.lbl.gov/publications/queued-2026-edition-characteristics",
    brk: "A data center takes about 18 months to build. <em>The power connection takes longer.</em>",
  },
  {
    id: "L02",
    name: "Chips",
    essence: "Chips are fast. Getting data to them is slow.",
    fig: "3",
    unit: "TB/s",
    figcap: "Memory bandwidth on one NVIDIA H100 chip.",
    src: "NVIDIA, H100 overview",
    srcUrl: "https://www.nvidia.com/en-us/data-center/h100/",
    brk: "The chip finishes its math early <em>and waits on memory.</em>",
  },
  {
    id: "L03",
    name: "Data",
    essence: "A model can only learn what its data contains.",
    fig: "60",
    unit: "%",
    figcap: "AI projects Gartner expects to be dropped by 2026 without good data.",
    src: "Gartner, AI-ready data risk",
    srcUrl:
      "https://www.gartner.com/en/newsroom/press-releases/2025-02-26-lack-of-ai-ready-data-puts-ai-projects-at-risk",
    brk: "Collecting data is cheap. <em>Deciding what is correct is not.</em>",
  },
  {
    id: "L04",
    name: "Models",
    essence: "Building the model is one cost. Running it is the recurring one.",
    fig: "40",
    unit: "GB",
    figcap: "Memory used by one long request to Llama 3 70B.",
    src: "NVIDIA, KV cache offload",
    srcUrl:
      "https://developer.nvidia.com/blog/accelerate-large-scale-llm-inference-and-kv-cache-offload-with-cpu-gpu-memory-sharing/",
    brk: "Everyone quotes the build cost. <em>The bill comes from running it.</em>",
  },
  {
    id: "L05",
    name: "Software",
    essence: "The model is one part. The software around it decides if it works.",
    fig: "1st",
    unit: "",
    figcap: "Search is the first thing to check when an answer comes back wrong.",
    src: "RAG systems review, 2025",
    srcUrl: "https://arxiv.org/html/2507.18910v1",
    brk: "If the right page was never found, <em>no prompt can fix it.</em>",
  },
  {
    id: "L06",
    name: "Testing",
    essence: "If you cannot test it, you cannot trust it.",
    fig: "4",
    unit: "steps",
    figcap: "NIST's four steps for AI risk: govern, map, measure, manage.",
    src: "NIST AI Risk Framework",
    srcUrl: "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
    brk: "It worked last week, the model updated, <em>and nobody can prove either part.</em>",
  },
  {
    id: "L07",
    name: "Business",
    essence: "A tool nobody uses has no value.",
    fig: "16",
    unit: "%",
    figcap: "AI projects IBM says have scaled across a whole company.",
    src: "IBM, AI data quality",
    srcUrl: "https://www.ibm.com/think/topics/ai-data-quality",
    brk: "The tech worked. <em>Then it changed hands and the goal changed.</em>",
  },
];

export const layersEs: Layer[] = [
  {
    id: "L01",
    name: "Energia",
    essence: "La IA funciona con electricidad. Conseguirla toma anos.",
    fig: "5+",
    unit: "anos",
    figcap: "Espera mediana para conectar un nuevo proyecto a la red electrica de EE. UU.",
    src: "Berkeley Lab, Queued Up 2026",
    srcUrl: "https://emp.lbl.gov/publications/queued-2026-edition-characteristics",
    brk: "Un centro de datos puede tardar unos 18 meses en construirse. <em>La conexion electrica tarda mas.</em>",
  },
  {
    id: "L02",
    name: "Chips",
    essence: "Los chips son rapidos. Llevarles datos es lo lento.",
    fig: "3",
    unit: "TB/s",
    figcap: "Ancho de banda de memoria en un chip NVIDIA H100.",
    src: "NVIDIA, H100 overview",
    srcUrl: "https://www.nvidia.com/en-us/data-center/h100/",
    brk: "El chip termina su matematica temprano <em>y espera a la memoria.</em>",
  },
  {
    id: "L03",
    name: "Datos",
    essence: "Un modelo solo aprende lo que contienen sus datos.",
    fig: "60",
    unit: "%",
    figcap: "Proyectos de IA que Gartner espera que se abandonen para 2026 sin buenos datos.",
    src: "Gartner, AI-ready data risk",
    srcUrl:
      "https://www.gartner.com/en/newsroom/press-releases/2025-02-26-lack-of-ai-ready-data-puts-ai-projects-at-risk",
    brk: "Recolectar datos es barato. <em>Decidir que es correcto no lo es.</em>",
  },
  {
    id: "L04",
    name: "Modelos",
    essence: "Crear el modelo es un costo. Usarlo es el costo recurrente.",
    fig: "40",
    unit: "GB",
    figcap: "Memoria usada por una solicitud larga a Llama 3 70B.",
    src: "NVIDIA, KV cache offload",
    srcUrl:
      "https://developer.nvidia.com/blog/accelerate-large-scale-llm-inference-and-kv-cache-offload-with-cpu-gpu-memory-sharing/",
    brk: "Todos citan el costo de construirlo. <em>La cuenta viene de usarlo.</em>",
  },
  {
    id: "L05",
    name: "Software",
    essence: "El modelo es una parte. El software alrededor decide si funciona.",
    fig: "1ro",
    unit: "",
    figcap: "La busqueda es lo primero que hay que revisar cuando una respuesta sale mal.",
    src: "RAG systems review, 2025",
    srcUrl: "https://arxiv.org/html/2507.18910v1",
    brk: "Si la pagina correcta nunca se encontro, <em>ningun prompt lo arregla.</em>",
  },
  {
    id: "L06",
    name: "Pruebas",
    essence: "Si no puedes probarlo, no puedes confiar en el.",
    fig: "4",
    unit: "pasos",
    figcap: "Los cuatro pasos de NIST para riesgo de IA: gobernar, mapear, medir, manejar.",
    src: "NIST AI Risk Framework",
    srcUrl: "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
    brk: "Funciono la semana pasada, el modelo cambio, <em>y nadie puede probar que paso.</em>",
  },
  {
    id: "L07",
    name: "Contexto",
    essence: "Una herramienta que nadie usa no tiene valor.",
    fig: "16",
    unit: "%",
    figcap: "Proyectos de IA que IBM dice que escalaron en toda una empresa.",
    src: "IBM, AI data quality",
    srcUrl: "https://www.ibm.com/think/topics/ai-data-quality",
    brk: "La tecnologia funciono. <em>Luego cambio de manos y cambio la meta.</em>",
  },
];

export const logEntriesEn: LogEntry[] = [
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

export const logEntriesEs: LogEntry[] = [
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

export const localeCopy = {
  en: {
    whereBoot: "SEVEN LAYERS",
    whereEnd: "END OF MAP",
    countBoot: "START",
    homeTitle: "AI from the physical layer up.",
    homeBody:
      "A research log for understanding what actually runs modern AI: power, chips, data, models, software, testing, and business. Each layer has a number and a source.",
    openLog: "Open field log",
    exploreMap: "Explore map",
    layers: "Layers",
    fieldLog: "Field log",
    viewAll: "View all",
    endKicker: "L01 - L07",
    endTitle: "The stack is physical, logical, and human.",
    endBody:
      "Each layer limits the ones above it. Power sets what chips can run, chips set what models cost, and human workflows decide whether any of it matters.",
    endNote: "New note: WALL-E",
    backLayers: "Back to the layers",
    startOver: "Start over",
    hint: "Space  -  next    Esc  -  all layers",
    back: "Back",
    log: "Log",
    forward: "Forward",
    load: "FIELD LOG ONLINE",
    switchLabel: "ES",
    switchHref: "/es",
    logHref: "/log",
    noteHref: "/notes/wall-e",
  },
  es: {
    whereBoot: "SIETE CAPAS",
    whereEnd: "FIN DEL MAPA",
    countBoot: "INICIO",
    homeTitle: "IA desde la capa fisica hacia arriba.",
    homeBody:
      "Un diario de investigacion para entender que hace funcionar la IA moderna: energia, chips, datos, modelos, software, pruebas y contexto. Cada capa tiene un numero y una fuente.",
    openLog: "Abrir diario",
    exploreMap: "Explorar mapa",
    layers: "Capas",
    fieldLog: "Diario",
    viewAll: "Ver todo",
    endKicker: "L01 - L07",
    endTitle: "El stack es fisico, logico y humano.",
    endBody:
      "Cada capa limita las capas de arriba. La energia define que chips pueden correr, los chips definen el costo de los modelos y los flujos humanos deciden si algo importa.",
    endNote: "Nueva nota: WALL-E",
    backLayers: "Volver a las capas",
    startOver: "Empezar de nuevo",
    hint: "Espacio  -  avanzar    Esc  -  todas las capas",
    back: "Atras",
    log: "Diario",
    forward: "Avanzar",
    load: "DIARIO EN LINEA",
    switchLabel: "EN",
    switchHref: "/",
    logHref: "/es/log",
    noteHref: "/notes/wall-e",
  },
} as const;

export const note001 = {
  slug: "wall-e",
  displayKicker: "NOTE Nº 001",
  title: "WALL-E",
  description:
    "The most human character in WALL-E is a robot. A note on curiosity, agency, and what AI may be exploring in us.",
  publishedTime: "2026-08-12T09:00:00-04:00",
  citation: "WALL-E, dir. Andrew Stanton, Pixar, 2008.",
  body: [
    "The most human character in WALL-E is a robot.",
    "Not because he feels things. Because he wants something nobody sold him.",
    "That is the part of the film I keep coming back to. WALL-E is surrounded by a world designed to make wanting unnecessary, but he keeps wanting anyway. He collects small objects. He watches an old musical. He reaches toward a life he cannot explain yet.",
    "Everyone posts the Axiom frame to say people got lazy. That is not quite what the movie is about. The passengers were given everything they needed: screens a few inches from their faces, food that arrived without effort, entertainment that never stopped. Nothing was taken from them. They stopped looking up.",
    "The difference matters because comfort does not feel like a loss while it is happening. The draft comes back fine. The option is already selected. The sentence is already formed. No single exchange feels like surrender, which is exactly why the total is hard to see.",
    "That is where AI makes the question current. The tool can help you explore a question you already have, or it can make questions unnecessary by giving you something smooth before you have decided what you want to know.",
    "The convenience is real. So is the risk. If every answer arrives before your curiosity has had time to develop, you may start mistaking friction for a problem and wanting for inefficiency.",
    "WALL-E does not escape the Axiom because someone gives him a better explanation. He escapes because he remains interested. Curiosity opens a door the system did not plan to offer.",
    "So when you open AI: are you using it to explore your curiosity, or is it exploring you?",
  ],
};

export function getEntries(locale: Locale) {
  return locale === "es" ? logEntriesEs : logEntriesEn;
}

export function getLayers(locale: Locale) {
  return locale === "es" ? layersEs : layersEn;
}

export function getEntry(locale: Locale, slug: string) {
  return getEntries(locale).find((entry) => entry.slug === slug);
}
