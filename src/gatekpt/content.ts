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
  details: string[];
};

export type LogEntry = {
  slug: string;
  date: string;
  title: string;
  layer: string;
  summary: string;
  body: string[];
  noteHref?: string;
  nextHref?: string;
  nextLabel?: string;
  artifacts?: { href: string; label: string }[];
};

export type NoteBlock = {
  text: string;
  kind?: "paragraph" | "turn";
  footnote?: string;
};

export const layersEn: Layer[] = [
  {
    id: "L01",
    name: "Input",
    essence: "AI starts with what you give it.",
    fig: "1",
    unit: "ask",
    figcap: "Your question, file, image, goal, or limit becomes the request.",
    src: "OpenAI Help, Tokens",
    srcUrl: "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them",
    brk: "Before a model can help, the work has to be stated. <em>Better input gives the system less room to guess.</em>",
    details: [
      "Input is not just a prompt. It can be a document, a screenshot, a song analysis file, a rule, or a goal.",
      "A vague request makes the system invent missing context.",
      "A clear request tells the system what success looks like before any model runs.",
    ],
  },
  {
    id: "L02",
    name: "Tokens",
    essence: "The computer breaks language into pieces.",
    fig: "4",
    unit: "chars",
    figcap: "OpenAI's rough rule of thumb: one token is about four English characters.",
    src: "OpenAI Help, Tokens",
    srcUrl: "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them",
    brk: "A model does not read a sentence the way a person does. <em>It reads pieces it can calculate with.</em>",
    details: [
      "Tokens are the small chunks of text the model actually processes.",
      "Token limits decide how much the model can keep in view at once.",
      "This is why formatting, filenames, examples, and clean structure matter.",
    ],
  },
  {
    id: "L03",
    name: "Context",
    essence: "The answer depends on what the system can see.",
    fig: "RAG",
    unit: "",
    figcap: "Retrieval can add relevant outside context to a generation request.",
    src: "OpenAI API, Prompt engineering",
    srcUrl: "https://developers.openai.com/api/docs/guides/prompt-engineering",
    brk: "A model may sound confident even when it is missing the right information. <em>Context is how you give it the right room to work in.</em>",
    details: [
      "Context can be files, memory, retrieved documents, previous decisions, or boundaries.",
      "Retrieval means the system can look up relevant source material before answering.",
      "Good context keeps private work private and gives public work only what it needs.",
    ],
  },
  {
    id: "L04",
    name: "Models",
    essence: "The model predicts the next useful step.",
    fig: "next",
    unit: "",
    figcap: "Text models process text in tokens and generate text from that context.",
    src: "OpenAI API, Key concepts",
    srcUrl: "https://developers.openai.com/api/docs/concepts",
    brk: "The model is the reasoning engine, not the whole product. <em>The surrounding system decides whether the output is useful.</em>",
    details: [
      "A language model can draft, compare, summarize, debug, classify, and explain.",
      "A model can still be wrong, incomplete, or overconfident.",
      "The real work is pairing the model with checks, sources, tools, and judgment.",
    ],
  },
  {
    id: "L05",
    name: "Tools",
    essence: "Tools let AI do work outside the chat box.",
    fig: "call",
    unit: "",
    figcap: "Tool calling lets a model request external functions when a task needs them.",
    src: "OpenAI API, Function calling",
    srcUrl: "https://developers.openai.com/api/docs/guides/function-calling",
    brk: "A chatbot can answer. <em>A system can read files, run checks, call APIs, create artifacts, and ship changes.</em>",
    details: [
      "Tools connect the model to code, browsers, calendars, files, APIs, builds, and tests.",
      "Once tools can act, permissions and logs matter.",
      "This is where AI starts becoming workflow, not just text.",
    ],
  },
  {
    id: "L06",
    name: "Chips",
    essence: "All of this still runs on physical hardware.",
    fig: "3",
    unit: "TB/s",
    figcap: "Memory bandwidth on one NVIDIA H100 chip.",
    src: "NVIDIA, H100 overview",
    srcUrl: "https://www.nvidia.com/en-us/data-center/h100/",
    brk: "AI can feel invisible because it arrives through a screen. <em>Underneath it are chips, memory, heat, cost, and time.</em>",
    details: [
      "Training and running models require large amounts of computation.",
      "Audio analysis, visual rendering, and model inference are all compute problems.",
      "Hardware shapes speed, cost, access, and what is practical to build.",
    ],
  },
  {
    id: "L07",
    name: "Power",
    essence: "The stack ends in the real world.",
    fig: "5+",
    unit: "yr",
    figcap: "Median wait to connect a new project to the US grid.",
    src: "Berkeley Lab, Queued Up 2026",
    srcUrl: "https://emp.lbl.gov/publications/queued-2026-edition-characteristics",
    brk: "The experience may start with one prompt. <em>At scale, it depends on electricity, cooling, land, deployment, and money.</em>",
    details: [
      "Data centers need electricity, cooling, land, networking, and grid access.",
      "Deployment turns an experiment into something other people can actually open.",
      "GateKPT shows the whole chain: idea, system, machine, infrastructure, and human use.",
    ],
  },
];

export const layersEs: Layer[] = [
  {
    id: "L01",
    name: "Entrada",
    essence: "Un sistema empieza con lo que le entregas.",
    fig: "1",
    unit: "pedido",
    figcap: "Tus palabras, archivos, imágenes y límites se convierten en la solicitud.",
    src: "OpenAI Help, Tokens",
    srcUrl: "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them",
    brk: "GateKPT empieza aquí: <em>prompts, notas, archivos, límites e intención.</em>",
    details: [
      "El trabajo empieza convirtiendo ideas sueltas en instrucciones útiles.",
      "Buenas entradas reducen adivinanza antes de correr un modelo.",
      "La misma disciplina vive en notas, briefs de audio y specs de producto.",
    ],
  },
  {
    id: "L02",
    name: "Tokens",
    essence: "El texto se vuelve estructura legible para el modelo.",
    fig: "4",
    unit: "car.",
    figcap: "Regla aproximada de OpenAI: un token equivale a unos cuatro caracteres en inglés.",
    src: "OpenAI Help, Tokens",
    srcUrl: "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them",
    brk: "La frase se parte. <em>Ahí la escritura empieza a volverse cómputo.</em>",
    details: [
      "Los modelos procesan piezas de texto, no significado humano completo.",
      "Los límites de tokens cambian lo que el sistema puede mantener a la vista.",
      "GateKPT trata el formato como ingeniería, no decoración.",
    ],
  },
  {
    id: "L03",
    name: "Contexto",
    essence: "La respuesta útil depende de lo que el modelo puede ver.",
    fig: "RAG",
    unit: "",
    figcap: "La recuperación puede agregar contexto externo relevante a una solicitud.",
    src: "OpenAI API, Prompt engineering",
    srcUrl: "https://developers.openai.com/api/docs/guides/prompt-engineering",
    brk: "Tu prompt es solo la entrada. <em>Archivos, memoria, fuentes y límites forman la respuesta.</em>",
    details: [
      "GateKPT separa notas públicas de trabajo privado.",
      "MaloSound y GreenMachine se enlazan; no se copian dentro de este sitio.",
      "Buen contexto es un contrato de datos con el modelo.",
    ],
  },
  {
    id: "L04",
    name: "Modelos",
    essence: "El modelo trabaja dentro del contexto que recibe.",
    fig: "next",
    unit: "",
    figcap: "Los modelos de texto procesan texto en tokens y generan texto desde ese contexto.",
    src: "OpenAI API, Key concepts",
    srcUrl: "https://developers.openai.com/api/docs/concepts",
    brk: "El modelo no es la afirmación completa. <em>El sistema alrededor decide si el resultado sirve.</em>",
    details: [
      "Los LLM ayudan a planear, escribir, depurar, comparar y explicar.",
      "La parte honesta es verificar: qué pasó, qué falló y qué falta saber.",
      "Un sistema útil puede decir no cuando la señal es débil.",
    ],
  },
  {
    id: "L05",
    name: "Herramientas",
    essence: "El trabajo real usa herramientas, archivos, builds y pruebas.",
    fig: "call",
    unit: "",
    figcap: "Tool calling permite que un modelo pida funciones externas cuando la tarea lo necesita.",
    src: "OpenAI API, Function calling",
    srcUrl: "https://developers.openai.com/api/docs/guides/function-calling",
    brk: "Un chatbot conversa. <em>Un sistema real lee, construye, prueba, enlaza y publica.</em>",
    details: [
      "Codex, Claude, GitHub, archivos locales, builds y QA en navegador son parte del flujo.",
      "Las herramientas hacen el trabajo inspeccionable, no solo conversacional.",
      "Permisos y registros importan cuando el sistema puede actuar.",
    ],
  },
  {
    id: "L06",
    name: "Chips",
    essence: "Visuales, audio y modelos todavía corren en hardware.",
    fig: "3",
    unit: "TB/s",
    figcap: "Ancho de banda de memoria en un chip NVIDIA H100.",
    src: "NVIDIA, H100 overview",
    srcUrl: "https://www.nvidia.com/en-us/data-center/h100/",
    brk: "La página se siente fluida. <em>Debajo hay matemáticas, render, memoria y chips trabajando.</em>",
    details: [
      "El cuerpo que baila es geometría generada y mapeo de señales.",
      "El análisis de audio y el render visual son problemas de cómputo.",
      "El hardware cambia velocidad, costo y disponibilidad.",
    ],
  },
  {
    id: "L07",
    name: "Energía",
    essence: "Todo sistema digital toca infraestructura física.",
    fig: "5+",
    unit: "años",
    figcap: "Espera mediana para conectar un nuevo proyecto a la red eléctrica de EE. UU.",
    src: "Berkeley Lab, Queued Up 2026",
    srcUrl: "https://emp.lbl.gov/publications/queued-2026-edition-characteristics",
    brk: "La experiencia empieza con texto. <em>El límite puede terminar en despliegue, energía, enfriamiento o costo.</em>",
    details: [
      "Los centros de datos necesitan electricidad, enfriamiento, terreno y acceso a la red.",
      "El despliegue convierte experimentos en algo que otras personas pueden abrir.",
      "La nube tiene dirección física.",
    ],
  },
];

export const logEntriesEn: LogEntry[] = [
  {
    slug: "ai-layers-ground-map",
    date: "2026-08-09",
    title: "AI layers ground map",
    layer: "L01-L07",
    summary:
      "A first public version of the system map: power, chips, data, models, software, testing, and business context.",
    body: [
      "The first thing I wanted to make public was the map itself. AI is usually explained from the model outward, but that skips the system underneath it.",
      "Power, chips, data, models, software, testing, and business context all shape what AI can actually do. If one layer is weak, everything above it bends around that limit.",
      "The Record is where I will keep turning scattered journal entries into structured entries. Some entries will be technical, some will be industry or career context, and some will be about how to use AI better in real work.",
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
      "A recurring note format for tracking what changed, why it matters, and which AI layer it touches.",
    body: [
      "A weekly AI brief should not just collect headlines. It should map each event to the layer it changes: power, chips, data, models, software, testing, business context, or human workflow.",
      "The goal is to make the news usable: what changed, why it matters, what is uncertain, and what I should keep watching.",
    ],
  },
];

export const logEntriesEs: LogEntry[] = [
  {
    slug: "ai-layers-ground-map",
    date: "2026-08-09",
    title: "Mapa base de las capas de IA",
    layer: "L01-L07",
    summary:
      "Primera versión pública del mapa: energía, chips, datos, modelos, software, pruebas y contexto de negocio.",
    body: [
      "Lo primero que quería hacer público era el mapa. Muchas veces la IA se explica desde el modelo hacia afuera, pero eso salta el sistema que está debajo.",
      "Energía, chips, datos, modelos, software, pruebas y contexto de negocio forman lo que la IA puede hacer en la vida real. Si una capa es débil, todo lo de arriba se dobla alrededor de ese límite.",
      "Este diario es donde voy a convertir notas sueltas en entradas organizadas. Algunas serán técnicas, otras serán de contexto, carrera o formas prácticas de usar IA en trabajo real.",
    ],
  },
  {
    slug: "why-power-comes-first",
    date: "2026-08-09",
    title: "Por qué la energía viene primero",
    layer: "L01 Energía",
    summary:
      "La IA no es solo software. Depende de electricidad, enfriamiento, edificios, conexiones y tiempo físico de construcción.",
    body: [
      "La capa física importa porque los modelos no corren en el aire. Corren en edificios llenos de chips, sistemas de enfriamiento, redes y contratos de energía.",
      "Una empresa puede ordenar hardware más rápido de lo que siempre puede conectar un sitio nuevo a la red eléctrica. Por eso la energía es un límite real, no un detalle de fondo.",
      "Cuando una noticia habla de la capacidad de un modelo, quiero seguir preguntando qué capa física tuvo que existir antes para que esa capacidad apareciera.",
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
      "Muchas conversaciones de IA saltan directo al modelo, pero los sistemas prácticos fallan antes. Los datos están desordenados, divididos entre herramientas, sin identificadores comunes o sin confianza suficiente para automatizar.",
      "Antes de que un sistema de IA pueda contestar una pregunta, alguien tiene que decidir qué significan los registros, cómo se conectan, de dónde vinieron y qué nivel de confianza es aceptable.",
      "Por eso el formato, el diseño de esquemas, la trazabilidad y la validación no son trabajo aburrido. Son la base que hace útil al modelo.",
    ],
  },
  {
    slug: "prompting-as-work-design",
    date: "Planeado",
    title: "Instrucciones como diseño de trabajo",
    layer: "Laboratorio",
    summary:
      "Una guía práctica para convertir preguntas sueltas en contexto, límites, ejemplos, formato de salida y pasos de verificación.",
    body: [
      "Una buena instrucción para un modelo no es una frase mágica. Es diseño de trabajo: contexto, objetivo, límites, ejemplos, forma de salida y una manera de revisar el resultado.",
      "Quiero que esta entrada sea una guía reusable para personas que están aprendiendo a pedir mejores resultados a modelos de lenguaje sin convertirlo en humo.",
    ],
  },
  {
    slug: "weekly-ai-brief-format",
    date: "Planeado",
    title: "Formato semanal de IA",
    layer: "Briefs",
    summary:
      "Un formato recurrente para seguir qué cambió, por qué importa y qué capa de IA toca.",
    body: [
      "Un resumen semanal de IA no debe ser solo una lista de titulares. Debe mapear cada evento a la capa que cambia: energía, chips, datos, modelos, software, pruebas, contexto de negocio o flujo humano.",
      "La meta es hacer que las noticias sean útiles: qué cambió, por qué importa, qué sigue incierto y qué debo seguir observando.",
    ],
  },
];

export const localeCopy = {
  en: {
    whereBoot: "AI LAYERS",
    whereEnd: "END OF LAYERS",
    countBoot: "START",
    homeTitle: "AI explained from the ground up.",
    homeBody:
      "GateKPT is a visual map of what happens after you type: input, tokens, context, models, tools, chips, and power.",
    openLog: "Read journal",
    exploreMap: "Learn the layers",
    layers: "AI layers",
    writingBadge: "Journal",
    moreLabel: "Hover for more signal",
    fieldLog: "Journal entries",
    viewAll: "Open journal",
    endKicker: "L01 - L07",
    endTitle: "The stack becomes work.",
    endBody:
      "GateKPT maps the system. Music, measured shows the audio signal work. GreenMachine is the product surface that comes next.",
    endNote: "Open journal",
    backLayers: "View AI layers",
    startOver: "Start over",
    hint: "Space  -  next    Esc  -  layers",
    back: "Back",
    log: "Journal",
    forward: "Forward",
    load: "GATEKPT ONLINE",
    switchLabel: "ES",
    switchHref: "/es",
    logHref: "/log",
    noteHref: "/notes/the-trap-of-time",
  },
  es: {
    whereBoot: "ESCRITURA + CAPAS DE IA",
    whereEnd: "FIN DE LAS CAPAS",
    countBoot: "INICIO",
    homeTitle: "Escritura publicada para entender la IA como sistema.",
    homeBody:
      "GateKPT empieza con las notas de Marcelo y después abre lo que pasa cuando escribes: entrada, tokens, contexto, modelos, herramientas, chips y energía.",
    openLog: "Leer la nota reciente",
    exploreMap: "Aprender las capas",
    layers: "Inteligencia Artificial",
    writingBadge: "Escritura original publicada",
    moreLabel: "Pasa el cursor para más señal",
    fieldLog: "Escritura publicada",
    viewAll: "Toda la escritura",
    endKicker: "L01 - L07",
    endTitle: "La pila se vuelve trabajo.",
    endBody:
      "GateKPT mapea el sistema. Music, measured muestra el trabajo de señales de audio. GreenMachine es la próxima superficie de producto.",
    endNote: "Abrir notas del proyecto",
    backLayers: "Ver capas de IA",
    startOver: "Empezar de nuevo",
    hint: "Espacio  -  avanzar    Esc  -  capas",
    back: "Atrás",
    log: "Escritura",
    forward: "Avanzar",
    load: "GATEKPT EN LINEA",
    switchLabel: "EN",
    switchHref: "/",
    logHref: "/es/log",
    noteHref: "/es/notes/the-trap-of-time",
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
  summary: "Una nota en inglés sobre curiosidad, agencia y lo que la IA puede estar explorando en nosotros.",
  body: note001.body.map((block) => block.text),
};

export const note002 = {
  slug: "the-trap-of-time",
  displayKicker: "NOTE Nº 002",
  title: "The Trap of Time",
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
      text: "That is the trap of time.",
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

const fieldLogEntryNote002Es: LogEntry = {
  slug: note002.slug,
  date: "2026-08-13",
  title: "La Trampa Del Tiempo",
  layer: "NOTA 002",
  summary:
    "Una etiqueta útil puede convertirse en una habitación que dejas de intentar abandonar. Una nota sobre tiempo, identidad y usar IA para probar tus límites.",
  noteHref: `/es/notes/${note002.slug}`,
  body: [
    "El tiempo es peligroso cuando pasas demasiado dentro de la misma historia.",
    "Al principio, una etiqueta es útil.",
    "Gerente. Analista. Marketer. Operador. No técnico. Creativo. Persona de negocio.",
    "Ayuda a que la gente entienda lo que haces.",
    "Pero si te quedas dentro de esa etiqueta el tiempo suficiente, empieza a sentirse como quien eres.",
    "Esa es la trampa del tiempo.",
    "Haces algo durante años o décadas. Construyes una vida alrededor de eso. La gente te reconoce por eso. Te premian por mantenerte consistente. Entonces un día el mundo cambia, y la etiqueta que antes te daba estructura empieza a mantenerte en el mismo lugar.",
    "Alguien que estudió marketing puede aprender a trabajar con datos de campañas. Alguien de finanzas puede construir una automatización pequeña. Alguien de diseño puede prototipar un flujo de trabajo. El título sigue siendo útil. Se vuelve contexto.",
    "Eso es lo que pienso cuando veo a Carl en UP.",
    "No era solo un anciano sentado en una casa. Era alguien congelado en el tiempo.",
    "La casa era memoria. La rutina era seguridad. El sueño seguía ahí, pero enterrado bajo años de duelo, repetición e identidad.",
    "Entonces llegó un empujón.",
    "No un plan completo. No un mapa perfecto. No permiso.",
    "Un empujón.",
    "Eso es lo que la IA puede ser para la gente ahora mismo.",
    "Un empujón fuera de la versión de ti mismo que aceptaste demasiado temprano.",
    "No porque la IA te convierta en otra persona. No porque quite el trabajo. Sino porque te deja cuestionar las paredes alrededor de tu identidad actual.",
    "No soy técnico. No soy bueno con datos. No puedo construir. Ese no es mi rol. Ya es demasiado tarde para aprender.",
    "¿Cuántas de esas cosas son hechos, y cuántas son solo frases viejas envueltas en tiempo?",
    "El peligro no es ser malo en algo. El peligro es dejar que el tiempo te convenza de que no puedes convertirte en otra cosa.",
    "La IA está reduciendo la distancia entre curiosidad y ejecución. Puedes preguntar. Puedes probar. Puedes construir. Puedes aprender en privado. Puedes entrar a lugares que antes parecían cerrados.",
    "Pero solo si te mueves.",
    "Porque la trampa es cómoda.",
    "Parece estabilidad. Suena como experiencia. Se siente como ser realista.",
    "Pero a veces ser realista es solo miedo con mejor ropa.",
    "No te quedes dormido dentro de una etiqueta.",
    "Las herramientas ya estan aqui.",
    "A veces todo lo que necesitas es un empujon.",
    "The only way is UP.",
  ],
};


export const note003 = {
  slug: "you-are-not-a-runner",
  displayKicker: "NOTE Nº 003",
  title: "You Are Not a Runner",
  description:
    "A language model is made of language, and for it the words are the whole thing. We talk about ourselves the same way. A note on what stops you learning something, and why you cannot argue it away.",
  publishedTime: "2026-08-16T09:00:00-04:00",
  citation:
    "Jacques Hadamard, An Essay on the Psychology of Invention in the Mathematical Field, Princeton University Press, 1945.",
  body: [
    { text: "A language model is made of language. That is not an insult. It is the whole description." },
    { text: "It read what we wrote down. It predicts what comes next." },
    { text: "It is very good at that. Most thinking is already written down somewhere." },
    { text: "It has read more than I ever will. It answers in seconds what would take me a week." },
    { text: "I use it every day and I am not being modest about that." },
    { text: "There is nothing under the words. Ask it what it is and you get more words." },
    { text: "For a model the words are not a container. They are the whole thing." },
    { text: "We talk about ourselves the same way." },
    { text: "At the halfway point of the Miami Marathon the course splits." },
    { text: "Left is a finish line and a medal. Right is thirteen more miles." },
    { text: "My legs had stopped working. Another thirteen felt impossible. What have I gotten myself into." },
    { text: "Stop. You cannot do this. You are not a runner." },
    { text: "The first two were about the race." },
    { text: "The third one was about me." },
    { text: "That sentence had been in my head for years. I never once checked it." },
    { text: "You cannot argue with that one. The thing you argue with is the thing that wrote it." },
    { text: "Einstein was asked how he actually thought.", footnote: "1" },
    { text: "He said words had nothing to do with it. He worked in images. The words had to be found afterwards, laboriously." },
    { text: "Afterwards." },
    { text: "The words came last. They were never the thing." },
    { text: "I went right." },
    { text: "Thirteen more miles with the sentence still going." },
    { text: "It never stopped. It stopped being true." },
    { text: "Nothing in my head did that. Something outside it did." },
    { text: "Months later I sat down to learn this technology from nothing." },
    { text: "Hours at a desk. No crowd, no mile markers, nobody watching if I stopped." },
    { text: "The same sentence showed up. This time I knew what it was." },
    { text: "A model cannot be contradicted from outside its text. You can. You are not only text." },
    { text: "Some days the sentence still wins. But one that has been proven wrong once never sounds the same." },
    { text: "WORDS ARE CONTAINERS FOR COMMUNICATION. NOT IDENTITY.", kind: "turn" },
  ],
};

const fieldLogEntryNote003: LogEntry = {
  slug: note003.slug,
  date: "2026-08-16",
  title: note003.title,
  layer: note003.displayKicker,
  summary: note003.description,
  noteHref: "/notes/you-are-not-a-runner",
  body: [
    "A language model is made of language. It read what we wrote down and it predicts what comes next, which makes it very good at the thinking that is already settled. There is nothing under the words.",
    "We talk about ourselves the same way. At the halfway point of the Miami Marathon the words in my head were clear: stop, you cannot do this, you are not a runner. The third one was not about the race.",
  ],
};

const fieldLogEntryNote003Es: LogEntry = {
  slug: note003.slug,
  date: "2026-08-16",
  title: "No Eres Corredor",
  layer: "NOTA 003",
  summary:
    "Un modelo de lenguaje está hecho de lenguaje, y para él las palabras son todo lo que hay. Hablamos de nosotros mismos igual. Una nota sobre lo que te detiene y por qué no puedes discutirlo.",
  noteHref: `/es/notes/${note003.slug}`,
  body: [
    "Un modelo de lenguaje está hecho de lenguaje. No es un insulto. Es la descripción completa.",
    "Leyó lo que escribimos. Predice lo que sigue.",
    "Es muy bueno en eso. Casi todo el pensamiento ya está escrito en algún lado.",
    "Ha leído más de lo que yo leeré nunca. Responde en segundos lo que a mí me tomaría una semana.",
    "Lo uso todos los días y no lo digo por modestia.",
    "No hay nada debajo de las palabras. Pregúntale qué es y recibes más palabras.",
    "Para un modelo las palabras no son un recipiente. Son todo lo que hay.",
    "Hablamos de nosotros mismos igual.",
    "En la mitad del Maratón de Miami el recorrido se divide.",
    "A la izquierda hay una meta y una medalla. A la derecha hay trece millas más.",
    "Mis piernas habían dejado de funcionar. Otras trece se sentían imposibles. En qué me metí.",
    "Para. No puedes hacer esto. No eres corredor.",
    "Las dos primeras eran sobre la carrera.",
    "La tercera era sobre mí.",
    "Esa frase llevaba años en mi cabeza. Nunca la revisé.",
    "Con esa no se puede discutir. Lo que discute es lo mismo que la escribió.",
    "A Einstein le preguntaron cómo pensaba realmente.",
    "Dijo que las palabras no tenían nada que ver. Trabajaba con imágenes. Las palabras había que buscarlas después, laboriosamente.",
    "Después.",
    "Las palabras llegaron al final. Nunca fueron la cosa en sí.",
    "Fui a la derecha.",
    "Trece millas más con la frase todavía sonando.",
    "Nunca se detuvo. Dejó de ser verdad.",
    "Nada en mi cabeza hizo eso. Algo fuera de ella sí.",
    "Meses después me senté a aprender esta tecnología desde cero.",
    "Horas en un escritorio. Sin público, sin marcadores, sin nadie mirando si paraba.",
    "La misma frase apareció. Esta vez supe lo que era.",
    "A un modelo no se le puede contradecir desde fuera de su texto. A ti sí. Tú no eres solo texto.",
    "Algunos días la frase todavía gana. Pero una que ya se demostró falsa nunca vuelve a sonar igual.",
    "LAS PALABRAS SON RECIPIENTES PARA COMUNICAR. NO IDENTIDAD.",
    "Jacques Hadamard, An Essay on the Psychology of Invention in the Mathematical Field, Princeton University Press, 1945.",
  ],
};

const fieldLogEntryMusicMeasured: LogEntry = {
  slug: "music-measured",
  date: "2026-08-23",
  title: "Music, measured",
  layer: "Journal",
  summary: "Technology keeps moving faster. Music gives me somewhere honest to use it.",
  noteHref: "/notes/music-measured",
  body: [
    "The world feels like it is in a crazy place right now.",
    "Technology has advanced so quickly in the 25 years I have been alive that any kind of discovery or devotion to innovation can feel wasteful to me unless it helps people somehow, especially in medicine.",
    "I paid $30k for an MRI. With the resources and technology we have, I do not understand why something like that should be that expensive.",
    "That is part of why GateKPT matters to me. Technology feels gated inside specific industries. I can guess why, but I do not want to pretend I know for sure.",
    "Music is something I feel passionate about. It gives me a chance to use this technology and all of my skills to the max without pretending the work is bigger than it is.",
    "Einstein said he would have been a musician. I think I see why.",
    "I do not know what the point is sometimes. But it feels nice to finally use the technology and make something cool.",
  ],
};
export function getEntries(locale: Locale) {
  return locale === "es"
    ? [fieldLogEntryNote003Es, fieldLogEntryNote002Es, fieldLogEntryEs]
    : [fieldLogEntryMusicMeasured, fieldLogEntryNote003, fieldLogEntryNote002, fieldLogEntryEn];
}

export function getLayers(locale: Locale) {
  return locale === "es" ? layersEs : layersEn;
}

export function getEntry(locale: Locale, slug: string) {
  return getEntries(locale).find((entry) => entry.slug === slug);
}
