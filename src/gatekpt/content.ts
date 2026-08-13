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
  noteHref?: string;
};

export type NoteBlock = {
  text: string;
  kind?: "paragraph" | "turn";
  footnote?: string;
};

export const layersEn: Layer[] = [
  {
    id: "L01",
    name: "Power",
    essence: "Before a model can answer, a physical system has to make it possible.",
    fig: "5+",
    unit: "yr",
    figcap: "Median wait to connect a new project to the US grid.",
    src: "Berkeley Lab, Queued Up 2026",
    srcUrl: "https://emp.lbl.gov/publications/queued-2026-edition-characteristics",
    brk: "The model looks digital. <em>The constraint is often a power connection.</em>",
  },
  {
    id: "L02",
    name: "Chips",
    essence: "A fast chip can still spend its time waiting.",
    fig: "3",
    unit: "TB/s",
    figcap: "Memory bandwidth on one NVIDIA H100 chip.",
    src: "NVIDIA, H100 overview",
    srcUrl: "https://www.nvidia.com/en-us/data-center/h100/",
    brk: "The math is not always the bottleneck. <em>Moving data can be.</em>",
  },
  {
    id: "L03",
    name: "Data",
    essence: "A model cannot reason its way past information nobody organized.",
    fig: "60",
    unit: "%",
    figcap: "AI projects Gartner expects to be dropped by 2026 without good data.",
    src: "Gartner, AI-ready data risk",
    srcUrl:
      "https://www.gartner.com/en/newsroom/press-releases/2025-02-26-lack-of-ai-ready-data-puts-ai-projects-at-risk",
    brk: "Data quality is not cleanup around AI. <em>It becomes model behavior.</em>",
  },
  {
    id: "L04",
    name: "Models",
    essence: "A model's answer is a prediction shaped by training and context.",
    fig: "40",
    unit: "GB",
    figcap: "Memory used by one long request to Llama 3 70B.",
    src: "NVIDIA, KV cache offload",
    srcUrl:
      "https://developer.nvidia.com/blog/accelerate-large-scale-llm-inference-and-kv-cache-offload-with-cpu-gpu-memory-sharing/",
    brk: "Capability is not the same as understanding. <em>Running the model is also a recurring cost.</em>",
  },
  {
    id: "L05",
    name: "Software",
    essence: "An AI product is the model plus the system around it.",
    fig: "1st",
    unit: "",
    figcap: "Search is the first thing to check when an answer comes back wrong.",
    src: "RAG systems review, 2025",
    srcUrl: "https://arxiv.org/html/2507.18910v1",
    brk: "Search, tools, memory, and limits shape the result. <em>The prompt is only one part.</em>",
  },
  {
    id: "L06",
    name: "Testing",
    essence: "A convincing answer is not evidence that the system worked.",
    fig: "4",
    unit: "steps",
    figcap: "NIST's four steps for AI risk: govern, map, measure, manage.",
    src: "NIST AI Risk Framework",
    srcUrl: "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
    brk: "Testing turns a demo into something measurable. <em>Without it, trust is only a feeling.</em>",
  },
  {
    id: "L07",
    name: "Business",
    essence: "AI creates value when it fits a real decision or workflow.",
    fig: "16",
    unit: "%",
    figcap: "AI projects IBM says have scaled across a whole company.",
    src: "IBM, AI data quality",
    srcUrl: "https://www.ibm.com/think/topics/ai-data-quality",
    brk: "The model is only part of the change. <em>People, incentives, and adoption decide what lasts.</em>",
  },
];

export const layersEs: Layer[] = [
  {
    id: "L01",
    name: "Energia",
    essence: "Antes de que un modelo pueda responder, un sistema fisico tiene que hacerlo posible.",
    fig: "5+",
    unit: "anos",
    figcap: "Espera mediana para conectar un nuevo proyecto a la red electrica de EE. UU.",
    src: "Berkeley Lab, Queued Up 2026",
    srcUrl: "https://emp.lbl.gov/publications/queued-2026-edition-characteristics",
    brk: "El modelo parece digital. <em>El limite suele ser una conexion electrica.</em>",
  },
  {
    id: "L02",
    name: "Chips",
    essence: "Un chip rapido todavia puede pasar su tiempo esperando.",
    fig: "3",
    unit: "TB/s",
    figcap: "Ancho de banda de memoria en un chip NVIDIA H100.",
    src: "NVIDIA, H100 overview",
    srcUrl: "https://www.nvidia.com/en-us/data-center/h100/",
    brk: "La matematica no siempre es el cuello de botella. <em>Mover datos puede serlo.</em>",
  },
  {
    id: "L03",
    name: "Datos",
    essence: "Un modelo no puede razonar mas alla de la informacion que nadie organizo.",
    fig: "60",
    unit: "%",
    figcap: "Proyectos de IA que Gartner espera que se abandonen para 2026 sin buenos datos.",
    src: "Gartner, AI-ready data risk",
    srcUrl:
      "https://www.gartner.com/en/newsroom/press-releases/2025-02-26-lack-of-ai-ready-data-puts-ai-projects-at-risk",
    brk: "La calidad de los datos no es limpieza alrededor de la IA. <em>Se convierte en comportamiento del modelo.</em>",
  },
  {
    id: "L04",
    name: "Modelos",
    essence: "La respuesta de un modelo es una prediccion guiada por su entrenamiento y su contexto.",
    fig: "40",
    unit: "GB",
    figcap: "Memoria usada por una solicitud larga a Llama 3 70B.",
    src: "NVIDIA, KV cache offload",
    srcUrl:
      "https://developer.nvidia.com/blog/accelerate-large-scale-llm-inference-and-kv-cache-offload-with-cpu-gpu-memory-sharing/",
    brk: "Capacidad no es lo mismo que comprension. <em>Usar el modelo tambien tiene un costo recurrente.</em>",
  },
  {
    id: "L05",
    name: "Software",
    essence: "Un producto de IA es el modelo mas el sistema que lo rodea.",
    fig: "1ro",
    unit: "",
    figcap: "La busqueda es lo primero que hay que revisar cuando una respuesta sale mal.",
    src: "RAG systems review, 2025",
    srcUrl: "https://arxiv.org/html/2507.18910v1",
    brk: "Busqueda, herramientas, memoria y limites cambian el resultado. <em>El prompt es solo una parte.</em>",
  },
  {
    id: "L06",
    name: "Pruebas",
    essence: "Una respuesta convincente no demuestra que el sistema funciono.",
    fig: "4",
    unit: "pasos",
    figcap: "Los cuatro pasos de NIST para riesgo de IA: gobernar, mapear, medir, manejar.",
    src: "NIST AI Risk Framework",
    srcUrl: "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
    brk: "Las pruebas convierten una demo en algo medible. <em>Sin ellas, la confianza es solo una sensacion.</em>",
  },
  {
    id: "L07",
    name: "Contexto",
    essence: "La IA crea valor cuando encaja en una decision o flujo de trabajo real.",
    fig: "16",
    unit: "%",
    figcap: "Proyectos de IA que IBM dice que escalaron en toda una empresa.",
    src: "IBM, AI data quality",
    srcUrl: "https://www.ibm.com/think/topics/ai-data-quality",
    brk: "El modelo es solo parte del cambio. <em>Las personas, los incentivos y la adopcion deciden que permanece.</em>",
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
    homeTitle: "A field log for understanding AI as a system.",
    homeBody:
      "GateKPT follows what sits underneath AI: power, chips, data, models, software, testing, and business context. Start with the latest writing or explore the stack.",
    openLog: "Read latest note",
    exploreMap: "Explore stack",
    layers: "Stack map",
    fieldLog: "Field log",
    viewAll: "View all",
    endKicker: "L01 - L07",
    endTitle: "The stack is physical, logical, and human.",
    endBody:
      "Each layer limits the ones above it. Power sets what chips can run, chips set what models cost, and human workflows decide whether any of it matters.",
    endNote: "New note: Note 002",
    backLayers: "View stack map",
    startOver: "Start over",
    hint: "Space  -  next    Esc  -  all layers",
    back: "Back",
    log: "Field log",
    forward: "Forward",
    load: "FIELD LOG ONLINE",
    switchLabel: "ES",
    switchHref: "/es",
    logHref: "/log",
    noteHref: "/notes/the-mental-time-trap",
  },
  es: {
    whereBoot: "SIETE CAPAS",
    whereEnd: "FIN DEL MAPA",
    countBoot: "INICIO",
    homeTitle: "Un diario para entender la IA como sistema.",
    homeBody:
      "GateKPT sigue lo que existe debajo de la IA: energia, chips, datos, modelos, software, pruebas y contexto de negocio. Empieza con la nota mas reciente o explora el stack.",
    openLog: "Leer la nota reciente",
    exploreMap: "Explorar el stack",
    layers: "Mapa del stack",
    fieldLog: "Diario",
    viewAll: "Ver todo",
    endKicker: "L01 - L07",
    endTitle: "El stack es fisico, logico y humano.",
    endBody:
      "Cada capa limita las capas de arriba. La energia define que chips pueden correr, los chips definen el costo de los modelos y los flujos humanos deciden si algo importa.",
    endNote: "Nueva nota: Nota 002",
    backLayers: "Ver el mapa del stack",
    startOver: "Empezar de nuevo",
    hint: "Espacio  -  avanzar    Esc  -  todas las capas",
    back: "Atras",
    log: "Diario",
    forward: "Avanzar",
    load: "DIARIO EN LINEA",
    switchLabel: "EN",
    switchHref: "/",
    logHref: "/es/log",
    noteHref: "/notes/the-mental-time-trap",
  },
} as const;

export const note001 = {
  slug: "wall-e",
  displayKicker: "NOTE Nº 001",
  title: "The Only Thing Paying Attention",
  description:
    "The Axiom passengers weren't lazy - they stopped looking up. A note on comfort as the mechanism of agency loss, and curiosity as the only exit.",
  publishedTime: "2026-08-12T09:00:00-04:00",
  citation: "WALL-E, dir. Andrew Stanton, Pixar, 2008.",
  body: [
    {
      text: "Everyone posts the Axiom frame to say people got lazy. That is not what the movie is about.",
    },
    {
      text: "The passengers were fine. Each had a screen a few inches from their face and a pool on board they never knew existed. Nothing was taken from them. They stopped looking up.",
    },
    {
      text: "Three people I know have three unrelated relationships to the same tool. At work I am more or less required to use it. My sister uses it as a therapist. The woman who rang me up at a sporting goods store last weekend may never have opened it once. Most arguments about whether AI matters are arguments between people whose days look nothing alike.",
    },
    {
      text: "Which suggests the tool has no fixed depth. It returns something shaped like whatever you walked up to it with - the question you already had, the problem you were already sitting on. The ceiling is set outside the model.",
    },
    {
      text: "So the failure mode isn't capability. It's comfort.",
    },
    {
      text: "Nobody takes your agency. You trade it, and the trade is good every single time. The draft comes back fine. The option is already selected. The sentence is already formed. No single exchange is a loss, which is exactly why the total is hard to see. Nothing that felt bad could spread this fast.",
    },
    {
      text: "WALL-E gave humanity seven hundred years to arrive at that ship.",
      footnote: "1",
    },
    {
      text: "The captain breaks out of it, and how he does it is the part worth keeping. Nobody warns him. Nobody presents evidence. He gets curious about a plant, and about a word he doesn't know, and the whole system loses him in an afternoon. Curiosity is the only exit the film offers - and it isn't offered as a discipline. It's offered as an accident a person allowed.",
    },
    {
      text: "SO INSTEAD OF ASKING WHETHER AI IS A BIG DEAL:",
      kind: "turn",
    },
    {
      text: "If this is a tool - how are we using it?",
    },
    {
      text: "Are we using it to explore our curiosity, or is it exploring us?",
    },
  ],
};

const fieldLogEntryEn: LogEntry = {
  slug: note001.slug,
    date: "2026-08-12",
    title: note001.title,
    layer: note001.displayKicker,
    summary: note001.description,
    noteHref: "/notes/wall-e",
    body: note001.body.map((block) => block.text),
};

const fieldLogEntryEs: LogEntry = {
  slug: note001.slug,
  date: "2026-08-12",
  title: note001.title,
  layer: "NOTA 001",
  summary: "Una nota en ingles sobre curiosidad, agencia y lo que la IA puede estar explorando en nosotros.",
  body: note001.body.map((block) => block.text),
};

export const note002 = {
  slug: "the-mental-time-trap",
  displayKicker: "NOTE Nº 002",
  title: "The Mental Time Trap",
  description:
    "A useful label can become a room you stop trying to leave. A note on time, identity, and using AI to test your limits.",
  publishedTime: "2026-08-13T09:00:00-04:00",
  citation: "Up, dir. Pete Docter, Pixar, 2009.",
  body: [
    {
      text: "Time is dangerous when you spend too much of it inside the same story.",
    },
    {
      text: "At first, a label is useful.",
    },
    {
      text: "Manager. Analyst. Marketer. Operator. Non-technical. Creative. Business person.",
    },
    {
      text: "It helps people understand what you do.",
    },
    {
      text: "But stay inside that label long enough, and it starts to feel like who you are.",
    },
    {
      text: "That is the mental time trap.",
    },
    {
      text: "You do something for years or decades. You build a life around it. People recognize you for it. You get rewarded for staying consistent. Then one day, the world changes, and the label that once gave you structure starts keeping you in place.",
    },
    {
      text: "Someone who studied marketing can learn to work with campaign data. Someone from finance can build a small automation. Someone from design can prototype a workflow. The degree remains useful. It becomes context.",
    },
    {
      text: "That is what I think about with Carl in UP.",
      footnote: "1",
    },
    {
      text: "He was not just an old man sitting in a house. He was someone frozen in time.",
    },
    {
      text: "The house was memory. The routine was safety. The dream was still there, but buried under years of grief, repetition, and identity.",
    },
    {
      text: "Then a push came.",
    },
    {
      text: "Not a full plan. Not a perfect roadmap. Not permission.",
    },
    {
      text: "A push.",
    },
    {
      text: "That is what AI can be for people right now.",
    },
    {
      text: "A push out of the version of yourself you accepted too early.",
    },
    {
      text: "Not because AI makes you someone else. Not because it removes the work. But because it lets you question the walls around your current identity.",
    },
    {
      text: "I'm not technical. I'm not good with data. I can't build. That is not my role. It is too late to learn.",
    },
    {
      text: "How many of those are facts, and how many are just old sentences with time wrapped around them?",
    },
    {
      text: "The danger is not being bad at something. The danger is letting time convince you that you cannot become anything else.",
    },
    {
      text: "AI is shrinking the distance between curiosity and execution. You can ask. You can test. You can build. You can learn in private. You can step into rooms that used to feel locked.",
    },
    {
      text: "But only if you move.",
    },
    {
      text: "Because the trap is comfortable.",
    },
    {
      text: "It looks like stability. It sounds like experience. It feels like being realistic.",
    },
    {
      text: "But sometimes being realistic is just fear with a better outfit.",
    },
    {
      text: "Do not get caught sleeping inside a label.",
    },
    {
      text: "The tools are already here.",
    },
    {
      text: "Sometimes all you need is a push.",
    },
    {
      text: "The only way is UP.",
      kind: "turn",
    },
  ],
};

const fieldLogEntryNote002: LogEntry = {
  slug: note002.slug,
  date: "2026-08-13",
  title: note002.title,
  layer: note002.displayKicker,
  summary: note002.description,
  noteHref: `/notes/${note002.slug}`,
  body: note002.body.map((block) => block.text),
};

export function getEntries(locale: Locale) {
  return locale === "es" ? [fieldLogEntryEs] : [fieldLogEntryNote002, fieldLogEntryEn];
}

export function getLayers(locale: Locale) {
  return locale === "es" ? layersEs : layersEn;
}

export function getEntry(locale: Locale, slug: string) {
  return getEntries(locale).find((entry) => entry.slug === slug);
}
