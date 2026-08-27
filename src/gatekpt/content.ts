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
  body: Array<string | NoteBlock>;
  citation?: string;
  noteHref?: string;
  nextHref?: string;
  nextLabel?: string;
  artifacts?: { href: string; label: string }[];
  publishedTime?: string;
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
      "On the homepage, the browser maps 8 spectral bands from the analysis JSON into a moving body.",
      "Audio analysis, visual rendering, motion mapping, and model inference are all compute problems.",
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
      "XIV shows the chain: idea, system, machine, infrastructure, and human use.",
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
    brk: "XIV empieza aquí: <em>prompts, notas, archivos, límites e intención.</em>",
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
      "XIV trata el formato como ingeniería, no decoración.",
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
      "XIV separa notas públicas de trabajo privado.",
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
      "The public log is where I will keep turning scattered journal entries into structured entries. Some entries will be technical, some will be industry or career context, and some will be about how to use AI better in real work.",
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
      "XIV is a visual map of how work moves through models, tools, data, compute, and human judgment.",
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
      "XIV maps the system. MaloSound shows the audio signal work. Each lane stays separate on purpose.",
    endNote: "Open journal",
    backLayers: "View AI layers",
    startOver: "Start over",
    hint: "Space  -  next    Esc  -  layers",
    back: "Back",
    log: "Journal",
    forward: "Forward",
    load: "XIV ONLINE",
    switchLabel: "ES",
    switchHref: "/es",
    logHref: "/log",
    noteHref: "/log/the-geometry-of-attention",
  },
  es: {
    whereBoot: "ESCRITURA + CAPAS DE IA",
    whereEnd: "FIN DE LAS CAPAS",
    countBoot: "INICIO",
    homeTitle: "Escritura publicada para entender la IA como sistema.",
    homeBody:
      "XIV empieza con las notas de Marcelo y después abre cómo el trabajo pasa por modelos, herramientas, datos, cómputo y criterio humano.",
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
      "XIV mapea el sistema. MaloSound muestra el trabajo de señales de audio. Cada línea se mantiene separada por una razón.",
    endNote: "Abrir notas del proyecto",
    backLayers: "Ver capas de IA",
    startOver: "Empezar de nuevo",
    hint: "Espacio  -  avanzar    Esc  -  capas",
    back: "Atrás",
    log: "Escritura",
    forward: "Avanzar",
    load: "XIV EN LINEA",
    switchLabel: "EN",
    switchHref: "/",
    logHref: "/es/log",
    noteHref: "/es/log/the-geometry-of-attention",
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
    noteHref: "/log/wall-e",
    body: note001.body as NoteBlock[],
    citation: note001.citation,
    publishedTime: note001.publishedTime,
};

const fieldLogEntryEs: LogEntry = {
  slug: note001.slug,
  date: "2026-08-12",
  title: "Lo Único Que Está Prestando Atención",
  layer: "NOTA 001",
  summary:
    "Los pasajeros del Axiom no eran perezosos. Dejaron de mirar hacia arriba. Una nota sobre la comodidad, la agencia y la curiosidad.",
  body: [
    {
      text: "Todo el mundo publica el cuadro del Axiom para decir que la gente se volvió perezosa. No creo que la película trate de eso.",
    },
    {
      text: "Los pasajeros estaban bien. Cada uno tenía una pantalla a pocos centímetros de la cara y una piscina a bordo que ni siquiera sabía que existía. Nadie les quitó nada. Dejaron de mirar hacia arriba.",
    },
    {
      text: "Tres personas que conozco tienen tres relaciones distintas con la misma herramienta. En el trabajo, más o menos tengo que usarla. Mi hermana la usa como terapeuta. La mujer que me cobró en una tienda de deportes el fin de semana pasado tal vez nunca la haya abierto. La mayoría de las discusiones sobre si la IA importa son discusiones entre personas cuyos días no se parecen en nada.",
    },
    {
      text: "Eso sugiere que la herramienta no tiene una profundidad fija. Devuelve algo con la forma de lo que llevaste hasta ella: la pregunta que ya tenías, el problema donde ya estabas sentado. El techo se define fuera del modelo.",
    },
    {
      text: "Entonces el modo de falla no es la capacidad. Es la comodidad.",
    },
    {
      text: "Nadie te quita la agencia. La cambias, y el intercambio parece bueno cada vez. El borrador vuelve aceptable. La opción ya está seleccionada. La frase ya está formada. Ningún intercambio se siente como una pérdida, y por eso el total cuesta tanto verlo. Nada que se sintiera mal podría expandirse tan rápido.",
    },
    {
      text: "WALL-E le dio a la humanidad setecientos años para llegar a esa nave.",
      footnote: "1",
    },
    {
      text: "El capitán sale de eso, y la forma en que lo hace es la parte que vale guardar. Nadie lo advierte. Nadie le presenta evidencia. Le da curiosidad una planta, y una palabra que no conoce, y en una tarde el sistema lo pierde. La curiosidad es la única salida que ofrece la película, y no aparece como disciplina. Aparece como un accidente que una persona permitió.",
    },
    {
      text: "ENTONCES, EN VEZ DE PREGUNTAR SI LA IA ES IMPORTANTE:",
      kind: "turn",
    },
    {
      text: "Si esto es una herramienta, ¿cómo la estamos usando?",
    },
    {
      text: "¿La usamos para explorar nuestra curiosidad, o nos está explorando a nosotros?",
    },
  ],
  citation: note001.citation,
  noteHref: "/es/log/wall-e",
  publishedTime: note001.publishedTime,
};

export const note002 = {
  slug: "the-geometry-of-attention",
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
  noteHref: `/log/${note002.slug}`,
  body: note002.body as NoteBlock[],
  citation: note002.citation,
  publishedTime: note002.publishedTime,
};

const fieldLogEntryNote002Es: LogEntry = {
  slug: note002.slug,
  date: "2026-08-13",
  title: "La Trampa Del Tiempo",
  layer: "NOTA 002",
  summary:
    "Una etiqueta útil puede convertirse en una habitación que dejas de intentar abandonar. Una nota sobre tiempo, identidad y usar IA para probar tus límites.",
  noteHref: `/es/log/${note002.slug}`,
  publishedTime: note002.publishedTime,
  body: [
    { text: "El tiempo es peligroso cuando pasas demasiado dentro de la misma historia." },
    { text: "Al principio, una etiqueta es útil." },
    { text: "Gerente. Analista. Marketer. Operador. No técnico. Creativo. Persona de negocio." },
    { text: "Ayuda a que la gente entienda lo que haces." },
    { text: "Pero si te quedas dentro de esa etiqueta el tiempo suficiente, empieza a sentirse como quien eres." },
    { text: "Esa es la trampa del tiempo." },
    { text: "Haces algo durante años o décadas. Construyes una vida alrededor de eso. La gente te reconoce por eso. Te premian por mantenerte consistente. Entonces un día el mundo cambia, y la etiqueta que antes te daba estructura empieza a mantenerte en el mismo lugar." },
    { text: "Alguien que estudió marketing puede aprender a trabajar con datos de campañas. Alguien de finanzas puede construir una automatización pequeña. Alguien de diseño puede prototipar un flujo de trabajo. El título sigue siendo útil. Se vuelve contexto." },
    { text: "Eso es lo que pienso cuando veo a Carl en UP.", footnote: "1" },
    { text: "No era solo un anciano sentado en una casa. Era alguien congelado en el tiempo." },
    { text: "La casa era memoria. La rutina era seguridad. El sueño seguía ahí, pero enterrado bajo años de duelo, repetición e identidad." },
    { text: "Entonces llegó un empujón." },
    { text: "No un plan completo. No un mapa perfecto. No permiso." },
    { text: "Un empujón." },
    { text: "Eso es lo que la IA puede ser para la gente ahora mismo." },
    { text: "Un empujón fuera de la versión de ti mismo que aceptaste demasiado temprano." },
    { text: "No porque la IA te convierta en otra persona. No porque quite el trabajo. Sino porque te deja cuestionar las paredes alrededor de tu identidad actual." },
    { text: "No soy técnico. No soy bueno con datos. No puedo construir. Ese no es mi rol. Ya es demasiado tarde para aprender." },
    { text: "¿Cuántas de esas cosas son hechos, y cuántas son solo frases viejas envueltas en tiempo?" },
    { text: "El peligro no es ser malo en algo. El peligro es dejar que el tiempo te convenza de que no puedes convertirte en otra cosa." },
    { text: "La IA está reduciendo la distancia entre curiosidad y ejecución. Puedes preguntar. Puedes probar. Puedes construir. Puedes aprender en privado. Puedes entrar a lugares que antes parecían cerrados." },
    { text: "Pero solo si te mueves." },
    { text: "Porque la trampa es cómoda." },
    { text: "Parece estabilidad. Suena como experiencia. Se siente como ser realista." },
    { text: "Pero a veces ser realista es solo miedo con mejor ropa." },
    { text: "No te quedes dormido dentro de una etiqueta." },
    { text: "Las herramientas ya están aquí." },
    { text: "A veces todo lo que necesitas es un empujón." },
    { text: "EL ÚNICO CAMINO ES HACIA ARRIBA.", kind: "turn" },
  ],
  citation: note002.citation,
};


export const note003 = {
  slug: "the-signal-and-the-noise",
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
  noteHref: `/log/${note003.slug}`,
  publishedTime: note003.publishedTime,
  body: [
    { text: "A language model is made of language. It read what we wrote down and it predicts what comes next, which makes it very good at the thinking that is already settled. There is nothing under the words." },
    { text: "We talk about ourselves the same way. At the halfway point of the Miami Marathon the words in my head were clear: stop, you cannot do this, you are not a runner. The third one was not about the race." },
  ],
  citation: note003.citation,
};

const fieldLogEntryNote003Es: LogEntry = {
  slug: note003.slug,
  date: "2026-08-16",
  title: "No Eres Corredor",
  layer: "NOTA 003",
  summary:
    "Un modelo de lenguaje está hecho de lenguaje, y para él las palabras son todo lo que hay. Hablamos de nosotros mismos igual. Una nota sobre lo que te detiene y por qué no puedes discutirlo.",
  noteHref: `/es/log/${note003.slug}`,
  publishedTime: note003.publishedTime,
  body: [
    { text: "Un modelo de lenguaje está hecho de lenguaje. No es un insulto. Es la descripción completa." },
    { text: "Leyó lo que escribimos. Predice lo que sigue." },
    { text: "Es muy bueno en eso. Casi todo el pensamiento ya está escrito en algún lado." },
    { text: "Ha leído más de lo que yo leeré nunca. Responde en segundos lo que a mí me tomaría una semana." },
    { text: "Lo uso todos los días y no lo digo por modestia." },
    { text: "No hay nada debajo de las palabras. Pregúntale qué es y recibes más palabras." },
    { text: "Para un modelo las palabras no son un recipiente. Son todo lo que hay." },
    { text: "Hablamos de nosotros mismos igual." },
    { text: "En la mitad del Maratón de Miami el recorrido se divide." },
    { text: "A la izquierda hay una meta y una medalla. A la derecha hay trece millas más." },
    { text: "Mis piernas habían dejado de funcionar. Otras trece se sentían imposibles. En qué me metí." },
    { text: "Para. No puedes hacer esto. No eres corredor." },
    { text: "Las dos primeras eran sobre la carrera." },
    { text: "La tercera era sobre mí." },
    { text: "Esa frase llevaba años en mi cabeza. Nunca la revisé." },
    { text: "Con esa no se puede discutir. Lo que discute es lo mismo que la escribió." },
    { text: "A Einstein le preguntaron cómo pensaba realmente.", footnote: "1" },
    { text: "Dijo que las palabras no tenían nada que ver. Trabajaba con imágenes. Las palabras había que buscarlas después, laboriosamente." },
    { text: "Después." },
    { text: "Las palabras llegaron al final. Nunca fueron la cosa en sí." },
    { text: "Fui a la derecha." },
    { text: "Trece millas más con la frase todavía sonando." },
    { text: "Nunca se detuvo. Dejó de ser verdad." },
    { text: "Nada en mi cabeza hizo eso. Algo fuera de ella sí." },
    { text: "Meses después me senté a aprender esta tecnología desde cero." },
    { text: "Horas en un escritorio. Sin público, sin marcadores, sin nadie mirando si paraba." },
    { text: "La misma frase apareció. Esta vez supe lo que era." },
    { text: "A un modelo no se le puede contradecir desde fuera de su texto. A ti sí. Tú no eres solo texto." },
    { text: "Algunos días la frase todavía gana. Pero una que ya se demostró falsa nunca vuelve a sonar igual." },
    { text: "LAS PALABRAS SON RECIPIENTES PARA COMUNICAR. NO IDENTIDAD.", kind: "turn" },
  ],
  citation: note003.citation,
};

const codingBeatsStrudelHref =
  "https://strudel.cc/#Ly8gbWFsb3NvdW5kIOKAlCBWaWN0b3JpYSAvIFJhaW55IE5pZ2h0IFNsb3cgQmVhdAovLyBTbG93LCBkYXJrLCBjaW5lbWF0aWMgZHJ1bXMuIE5vIHJ1c2guCi8vIEN0cmwrRW50ZXIgdG8gcGxheS4gQ3RybCsuIHRvIHN0b3AuCgpzZXRjcG0oNzIvNCkgLy8gNzIgQlBNLCBvbmUgY3ljbGUgPSBvbmUgYmFyCnNhbXBsZXMoJ2dpdGh1Yjp0aWRhbGN5Y2xlcy9kaXJ0LXNhbXBsZXMnKQoKLy8gS0lDSyDigJQgc2xvdyBoZWFydGJlYXQsIG5vdCBob3VzZQokOiBzKCJiZCB%2BIH4gYmQgfiB%2BIH4gfiIpCi5iYW5rKCJSb2xhbmRUUjgwOCIpCi5nYWluKDAuOSkKLnJvb20oMC4xMikKCi8vIFNOQVJFIC8gUklNIOKAlCBsb25lbHkgaGl0IG9uIDMKJDogcygifiB%2BIHJpbSB%2BIikKLmdhaW4oMC41NSkKLnJvb20oMC4zNSkKLmRlbGF5KDAuMDgpCi5kZWxheWZlZWRiYWNrKDAuMjUpCgovLyBDTE9TRUQgSEFUIOKAlCB0aW55IHJhaW4gdGlja3MKJDogcygiaGgqOCIpCi5nYWluKDAuMTYpCi5zcGVlZCgwLjgpCi5wYW4oc2luZS5yYW5nZSgwLjM1LCAwLjY1KS5zbG93KDQpKQouZGVncmFkZUJ5KDAuMTgpCgovLyBMT1cgVE9NIOKAlCBkaXN0YW50IHRodW5kZXIgZXZlcnkgNCBiYXJzCiQ6IHMoIn4gfiB%2BIGx0IikKLmJhbmsoIlJvbGFuZFRSODA4IikKLmdhaW4oMC40NSkKLnJvb20oMC41KQoubHBmKDkwMCkKLm1hc2soIjwwIDAgMCAxPiIpCgovLyBURVhUVVJFIOKAlCBmYWtlIHJhaW4vbm9pc2UgYmVkIGZyb20gY3ltYmFsL3BlcmMKJDogcygicGVyYyoxNiIpCi5nYWluKDAuMDU1KQouc3BlZWQoMC40NSkKLnBhbihyYW5kKQouaHBmKDMwMDApCi5yb29tKDAuOCkKLmRlZ3JhZGVCeSgwLjQ1KQoKLy8gREFSSyBQVUxTRSDigJQgbG93IG5vdGUgc2hhZG93CiQ6IG5vdGUoIjAgfiB%2BIC0yIikKLnNvdW5kKCJzYXd0b290aCIpCi5nYWluKDAuMTgpCi5scGYoNDIwKQoucm9vbSgwLjI1KQouc2xvdygyKQoKLy8gU0lNUExFIE5JR0hUIENIT1JEIC8gRFJPTkUKJDogbm90ZSgiPDAgLTMgLTUgLTI%2BIikKLnNvdW5kKCJ0cmlhbmdsZSIpCi5nYWluKDAuMTMpCi5hdHRhY2soMC4yKQoucmVsZWFzZSgxLjgpCi5scGYoNjUwKQoucm9vbSgwLjc1KQouc2xvdyg0KQoKLy8gT1BUSU9OQUw6IHVuY29tbWVudCBmb3IgbW9yZSB0ZW5zaW9uCi8vICQ6IHMoIn4gfiB%2BIGNwIikKLy8gLmdhaW4oMC4yNSkKLy8gLnJvb20oMC43KQovLyAuZGVsYXkoMC4xMik%3D";

const fieldLogEntryNote004: LogEntry = {
  slug: "coding-beats",
  date: "2026-08-24",
  title: "Coding Beats",
  layer: "NOTE Nº 004",
  summary:
    "A public study of rhythm written as code: patterns, motion, and measured sound.",
  noteHref: "/log/coding-beats",
  publishedTime: "2026-08-24T09:00:00-04:00",
  body: [
    { text: "I want to study beats that are written as code." },
    { text: "Tools like Strudel make rhythm visible. A beat is not only an audio file. It is tempo, samples, rests, repetition, probability, filters, space, and timing written into a system." },
    { text: "That matters because coded music can be inspected. Change one line and the beat changes. Save the pattern and the idea becomes repeatable. Compare two versions and you can hear what the code did." },
    { text: "That is the research question: what happens when a beat is treated like software and sound at the same time?" },
    { text: "The study is simple. Build small coded sketches. Document the pattern. Listen to the result. Measure the audio. Map the signal into motion." },
    { text: "It is also a memory system. I can come back later and see the beat as code: the tempo, the rests, the drum choices, the filter shape, the space, and the pulse." },
    { text: "Someone else can open the same sketch in Strudel, press play, and change it. That is different from posting an audio clip." },
    { text: "The beat is not only something to hear. It is something to inspect." },
    { text: "This is not a claim that AI understands music. It is a public study of how coded rhythm becomes measurable sound and movement." },
    { text: "MaloSound is the public music proof for XIV. This note is the coded rhythm lane." },
    { text: "The first sketch is a slow coded beat in Strudel: readable, playable, and changeable." },
    { text: "Footnote: the linked sketch uses Strudel with public Dirt-Samples, not raw studio files." },
  ],
  artifacts: [
    {
      href: codingBeatsStrudelHref,
      label: "Open Strudel beat sketch",
    },
  ],
};

const fieldLogEntryNote004Es: LogEntry = {
  slug: "coding-beats",
  date: "2026-08-24",
  title: "Beats En Código",
  layer: "NOTA 004",
  summary:
    "Un estudio público de ritmo escrito como código: patrones, movimiento y sonido medido.",
  noteHref: "/es/log/coding-beats",
  publishedTime: "2026-08-24T09:00:00-04:00",
  body: [
    { text: "Quiero estudiar beats que están escritos como código." },
    { text: "Herramientas como Strudel hacen visible el ritmo. Un beat no es solo un archivo de audio. Es tempo, samples, silencios, repetición, probabilidad, filtros, espacio y timing escritos dentro de un sistema." },
    { text: "Eso importa porque la música en código se puede inspeccionar. Cambias una línea y cambia el beat. Guardas el patrón y la idea se vuelve repetible. Comparas dos versiones y puedes escuchar lo que hizo el código." },
    { text: "Esa es la pregunta de investigación: ¿qué pasa cuando un beat se trata como software y sonido al mismo tiempo?" },
    { text: "El estudio es simple. Construir pequeños sketches en código. Documentar el patrón. Escuchar el resultado. Medir el audio. Mapear la señal hacia movimiento." },
    { text: "También es un sistema de memoria. Puedo volver después y ver el beat como código: el tempo, los silencios, los drums, la forma del filtro, el espacio y el pulso." },
    { text: "Otra persona puede abrir el mismo sketch en Strudel, darle play y cambiarlo. Eso es diferente a publicar solo un clip de audio." },
    { text: "El beat no es solo algo para escuchar. Es algo para inspeccionar." },
    { text: "Esto no es una afirmación de que la IA entiende música. Es un estudio público de cómo el ritmo en código se convierte en sonido medible y movimiento." },
    { text: "MaloSound es la prueba musical pública para XIV. Esta nota es la línea de ritmo en código." },
    { text: "El primer sketch es un beat lento en Strudel: legible, reproducible y modificable." },
    { text: "Nota: el sketch enlazado usa Strudel con Dirt-Samples públicos, no archivos crudos del estudio." },
  ],
  artifacts: [
    {
      href: codingBeatsStrudelHref,
      label: "Abrir sketch de beat en Strudel",
    },
  ],
};

export const note005 = {
  slug: "fourteen",
  displayKicker: "NOTE Nº 005",
  title: "Fourteen",
  description:
    "Nobody hired a thousand people because the work needed a thousand people. Headcount was a measurement of friction. That is the thing collapsing.",
  publishedTime: "2026-08-27T09:00:00-04:00",
  citation:
    "Ronald H. Coase, The Nature of the Firm, Economica, vol. 4, no. 16, 1937.",
  body: [
    { text: "The layoff argument is about tasks. Which tasks a model can do. That is the wrong unit." },
    { text: "The unit is the company." },
    { text: "Nobody ever hired a thousand people because the work required a thousand people." },
    { text: "They hired because coordination was expensive." },
    { text: "Every layer, every handoff, every status meeting, every document written so somebody else could act." },
    { text: "All of it is the cost of moving a decision from one person to another." },
    { text: "Ronald Coase put a name on this in 1937.", footnote: "1" },
    { text: "A company exists wherever doing the work inside is cheaper than buying it outside." },
    { text: "The edge of a company is a price. It was never a headcount." },
    { text: "So the number of people was not a measurement of the work." },
    { text: "It was a measurement of the friction around the work." },
    { text: "That is the thing collapsing. Not labor. Coordination." },
    { text: "The work does not disappear. The distance between the pieces of it does." },
    { text: "Which is why the honest number is not twenty percent fewer." },
    { text: "Take a drop shipping company at a thousand people." },
    { text: "Catalog, merchandising, ad operations, tier one support, returns, supplier email, forecasting." },
    { text: "Every one of those is a queue between two people who never meet." },
    { text: "Rebuild it as agents doing the function and a human owning it." },
    { text: "Fourteen people." },
    { text: "Fourteen because that is roughly how many decisions still need a person on them." },
    { text: "I do not think that is obviously good and I do not think it is fast." },
    { text: "Most companies will do it badly first, and the badly will last years." },
    { text: "But notice where the difficulty actually sits." },
    { text: "The engineering is the easy half and it is close to finished." },
    { text: "The hard half is who decides. Who carries the accountability." },
    { text: "What the remaining people are actually for. What you owe the ones who leave." },
    { text: "None of that is an engineering problem." },
    { text: "It is economics. It is sociology. It is a question about people." },
    { text: "Which is the part almost nobody is working on, and the part that decides how this goes." },
    { text: "WE WERE NEVER PAYING FOR THE WORK. WE WERE PAYING FOR THE DISTANCE.", kind: "turn" },
  ],
};

const fieldLogEntryNote005: LogEntry = {
  slug: note005.slug,
  date: "2026-08-27",
  title: note005.title,
  layer: note005.displayKicker,
  summary: note005.description,
  noteHref: "/log/fourteen",
  body: note005.body as NoteBlock[],
  citation: note005.citation,
  publishedTime: note005.publishedTime,
};

const fieldLogEntryNote005Es: LogEntry = {
  slug: note005.slug,
  date: "2026-08-27",
  title: "Catorce",
  layer: "NOTA 005",
  summary:
    "Nadie contrató a mil personas porque el trabajo necesitara mil personas. La plantilla medía fricción. Eso es lo que está colapsando.",
  noteHref: "/es/log/fourteen",
  body: [
    { text: "El argumento sobre los despidos habla de tareas. Qué tareas puede hacer un modelo. Esa no es la unidad correcta." },
    { text: "La unidad es la empresa." },
    { text: "Nadie contrató a mil personas porque el trabajo requiriera mil personas." },
    { text: "Contrataron porque coordinar era caro." },
    { text: "Cada capa, cada traspaso, cada reunión de estado, cada documento escrito para que otra persona pudiera actuar." },
    { text: "Todo eso es el costo de mover una decisión de una persona a otra." },
    { text: "Ronald Coase le puso nombre a esto en 1937.", footnote: "1" },
    { text: "Una empresa existe cuando hacer el trabajo adentro es más barato que comprarlo afuera." },
    { text: "El borde de una empresa es un precio. Nunca fue una plantilla." },
    { text: "Entonces la cantidad de personas no medía el trabajo." },
    { text: "Medía la fricción alrededor del trabajo." },
    { text: "Eso es lo que está colapsando. No el trabajo. La coordinación." },
    { text: "El trabajo no desaparece. Desaparece la distancia entre sus partes." },
    { text: "Por eso el número honesto no es veinte por ciento menos." },
    { text: "Toma una empresa de dropshipping con mil personas." },
    { text: "Catálogo, merchandising, operaciones de anuncios, soporte nivel uno, devoluciones, correo con proveedores, pronósticos." },
    { text: "Cada una de esas cosas es una cola entre dos personas que nunca se conocen." },
    { text: "Reconstrúyelo como agentes haciendo la función y una persona haciéndose responsable." },
    { text: "Catorce personas." },
    { text: "Catorce porque más o menos esa es la cantidad de decisiones que todavía necesitan una persona." },
    { text: "No creo que eso sea obviamente bueno y no creo que sea rápido." },
    { text: "La mayoría de las empresas lo harán mal primero, y lo mal hecho durará años." },
    { text: "Pero mira dónde está realmente la dificultad." },
    { text: "La ingeniería es la mitad fácil y está cerca de estar resuelta." },
    { text: "La mitad difícil es quién decide. Quién carga con la responsabilidad." },
    { text: "Para qué quedan realmente las personas que se quedan. Qué les debes a las que se van." },
    { text: "Nada de eso es un problema de ingeniería." },
    { text: "Es economía. Es sociología. Es una pregunta sobre personas." },
    { text: "Esa es la parte en la que casi nadie está trabajando, y la parte que decide cómo sale esto." },
    { text: "NUNCA ESTÁBAMOS PAGANDO POR EL TRABAJO. ESTÁBAMOS PAGANDO POR LA DISTANCIA.", kind: "turn" },
  ],
  citation: note005.citation,
  publishedTime: note005.publishedTime,
};
export function getEntries(locale: Locale) {
  return locale === "es"
    ? [fieldLogEntryNote005Es, fieldLogEntryNote004Es, fieldLogEntryNote003Es, fieldLogEntryNote002Es, fieldLogEntryEs]
    : [fieldLogEntryNote005, fieldLogEntryNote004, fieldLogEntryNote003, fieldLogEntryNote002, fieldLogEntryEn];
}

export function getLayers(locale: Locale) {
  return locale === "es" ? layersEs : layersEn;
}

export function getEntry(locale: Locale, slug: string) {
  return getEntries(locale).find((entry) => entry.slug === slug);
}
