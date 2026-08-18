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
    essence: "AI starts when you give the system something to work with.",
    fig: "1",
    unit: "ask",
    figcap: "Your words, files, images, and constraints become the request.",
    src: "OpenAI Help, Tokens",
    srcUrl: "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them",
    brk: "The first layer is not magic. <em>It is the instruction you put into the system.</em>",
    details: [
      "The app packages your message, files, images, and constraints into a request.",
      "Better inputs reduce guessing because the system has more structure.",
      "This is where business users have immediate leverage.",
    ],
  },
  {
    id: "L02",
    name: "Tokens",
    essence: "The system breaks your request into pieces a model can process.",
    fig: "4",
    unit: "chars",
    figcap: "OpenAI's rough rule of thumb: one token is about four English characters.",
    src: "OpenAI Help, Tokens",
    srcUrl: "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them",
    brk: "You write sentences. <em>The model sees chunks of text called tokens.</em>",
    details: [
      "Models process pieces of text, not full human sentences.",
      "Longer context costs more memory and compute.",
      "Token limits decide how much the model can keep in view.",
    ],
  },
  {
    id: "L03",
    name: "Context",
    essence: "The app decides what else the model should see before it answers.",
    fig: "RAG",
    unit: "",
    figcap: "Retrieval can add relevant outside context to a generation request.",
    src: "OpenAI API, Prompt engineering",
    srcUrl: "https://developers.openai.com/api/docs/guides/prompt-engineering",
    brk: "Your prompt is only part of the moment. <em>Files, memory, search, and instructions shape the answer.</em>",
    details: [
      "The app may add system instructions, uploaded files, search results, or saved memory.",
      "Bad context can make a strong model answer poorly.",
      "This is why formatting, retrieval, and source quality matter.",
    ],
  },
  {
    id: "L04",
    name: "Models",
    essence: "The model generates an answer from the input and context it was given.",
    fig: "next",
    unit: "",
    figcap: "Text models process text in tokens and generate text from that context.",
    src: "OpenAI API, Key concepts",
    srcUrl: "https://developers.openai.com/api/docs/concepts",
    brk: "The model is not reading your mind. <em>It is producing the next useful text from the context.</em>",
    details: [
      "The model generates likely next tokens from the context it received.",
      "It can sound confident without being correct.",
      "Testing decides whether the answer is useful enough to trust.",
    ],
  },
  {
    id: "L05",
    name: "Tools",
    essence: "Useful AI often reaches outside the model to search, calculate, read, or act.",
    fig: "call",
    unit: "",
    figcap: "Tool calling lets a model request external functions when a task needs them.",
    src: "OpenAI API, Function calling",
    srcUrl: "https://developers.openai.com/api/docs/guides/function-calling",
    brk: "A chatbot talks. <em>An AI system can use tools, data, and workflows.</em>",
    details: [
      "Tools let AI search, calculate, read files, or trigger workflows.",
      "This is where a chatbot becomes an operating layer for work.",
      "Permissions, logs, and review matter once the system can act.",
    ],
  },
  {
    id: "L06",
    name: "Chips",
    essence: "All of that thinking still has to run on hardware.",
    fig: "3",
    unit: "TB/s",
    figcap: "Memory bandwidth on one NVIDIA H100 chip.",
    src: "NVIDIA, H100 overview",
    srcUrl: "https://www.nvidia.com/en-us/data-center/h100/",
    brk: "The answer feels instant. <em>Underneath it, chips are moving data at physical speed.</em>",
    details: [
      "GPUs run many math operations in parallel.",
      "Moving data through memory can be the bottleneck.",
      "Hardware choices shape speed, cost, and availability.",
    ],
  },
  {
    id: "L07",
    name: "Power",
    essence: "The final layer is physical: electricity, cooling, buildings, and grid access.",
    fig: "5+",
    unit: "yr",
    figcap: "Median wait to connect a new project to the US grid.",
    src: "Berkeley Lab, Queued Up 2026",
    srcUrl: "https://emp.lbl.gov/publications/queued-2026-edition-characteristics",
    brk: "The experience starts with text. <em>The limit can end at a power connection.</em>",
    details: [
      "Data centers need electricity, cooling, land, and grid access.",
      "Local communities feel the buildout through taxes, bills, zoning, and noise.",
      "The cloud has a physical address.",
    ],
  },
];

export const layersEs: Layer[] = [
  {
    id: "L01",
    name: "Entrada",
    essence: "La IA empieza cuando le das al sistema algo con que trabajar.",
    fig: "1",
    unit: "pedido",
    figcap: "Tus palabras, archivos, imagenes y limites se convierten en la solicitud.",
    src: "OpenAI Help, Tokens",
    srcUrl: "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them",
    brk: "La primera capa no es magia. <em>Es la instruccion que pones en el sistema.</em>",
    details: [
      "La app convierte tu mensaje, archivos, imagenes y limites en una solicitud.",
      "Mejores entradas reducen adivinanza porque el sistema recibe mas estructura.",
      "Aqui una persona de negocio puede mejorar resultados de inmediato.",
    ],
  },
  {
    id: "L02",
    name: "Tokens",
    essence: "El sistema divide tu solicitud en piezas que el modelo puede procesar.",
    fig: "4",
    unit: "car.",
    figcap: "Regla aproximada de OpenAI: un token equivale a unos cuatro caracteres en ingles.",
    src: "OpenAI Help, Tokens",
    srcUrl: "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them",
    brk: "Tu escribes frases. <em>El modelo ve partes de texto llamadas tokens.</em>",
    details: [
      "Los modelos procesan piezas de texto, no frases humanas completas.",
      "Mas contexto cuesta mas memoria y computo.",
      "Los limites de tokens deciden cuanto puede mantener el modelo a la vista.",
    ],
  },
  {
    id: "L03",
    name: "Contexto",
    essence: "La app decide que mas debe ver el modelo antes de responder.",
    fig: "RAG",
    unit: "",
    figcap: "La recuperacion puede agregar contexto externo relevante a una solicitud.",
    src: "OpenAI API, Prompt engineering",
    srcUrl: "https://developers.openai.com/api/docs/guides/prompt-engineering",
    brk: "Tu prompt es solo una parte. <em>Archivos, memoria, busqueda e instrucciones forman la respuesta.</em>",
    details: [
      "La app puede agregar instrucciones, archivos, busqueda o memoria guardada.",
      "Mal contexto puede hacer que un modelo fuerte responda mal.",
      "Por eso importan el formato, la recuperacion y la calidad de fuentes.",
    ],
  },
  {
    id: "L04",
    name: "Modelos",
    essence: "El modelo genera una respuesta desde la entrada y el contexto que recibio.",
    fig: "next",
    unit: "",
    figcap: "Los modelos de texto procesan texto en tokens y generan texto desde ese contexto.",
    src: "OpenAI API, Key concepts",
    srcUrl: "https://developers.openai.com/api/docs/concepts",
    brk: "El modelo no lee tu mente. <em>Produce el siguiente texto util desde el contexto.</em>",
    details: [
      "El modelo genera tokens probables desde el contexto que recibio.",
      "Puede sonar seguro sin estar correcto.",
      "Las pruebas deciden si la respuesta es suficientemente util para confiar.",
    ],
  },
  {
    id: "L05",
    name: "Herramientas",
    essence: "La IA util muchas veces sale del modelo para buscar, calcular, leer o actuar.",
    fig: "call",
    unit: "",
    figcap: "Tool calling permite que un modelo pida funciones externas cuando la tarea lo necesita.",
    src: "OpenAI API, Function calling",
    srcUrl: "https://developers.openai.com/api/docs/guides/function-calling",
    brk: "Un chatbot conversa. <em>Un sistema de IA puede usar herramientas, datos y flujos de trabajo.</em>",
    details: [
      "Las herramientas dejan que la IA busque, calcule, lea archivos o active flujos.",
      "Aqui un chatbot se vuelve una capa operativa para el trabajo.",
      "Permisos, registros y revision importan cuando el sistema puede actuar.",
    ],
  },
  {
    id: "L06",
    name: "Chips",
    essence: "Todo ese pensamiento todavia tiene que correr en hardware.",
    fig: "3",
    unit: "TB/s",
    figcap: "Ancho de banda de memoria en un chip NVIDIA H100.",
    src: "NVIDIA, H100 overview",
    srcUrl: "https://www.nvidia.com/en-us/data-center/h100/",
    brk: "La respuesta parece instantanea. <em>Debajo, los chips mueven datos a velocidad fisica.</em>",
    details: [
      "Los GPU corren muchas operaciones matematicas en paralelo.",
      "Mover datos por memoria puede ser el cuello de botella.",
      "El hardware cambia velocidad, costo y disponibilidad.",
    ],
  },
  {
    id: "L07",
    name: "Energia",
    essence: "La ultima capa es fisica: electricidad, enfriamiento, edificios y acceso a la red.",
    fig: "5+",
    unit: "anos",
    figcap: "Espera mediana para conectar un nuevo proyecto a la red electrica de EE. UU.",
    src: "Berkeley Lab, Queued Up 2026",
    srcUrl: "https://emp.lbl.gov/publications/queued-2026-edition-characteristics",
    brk: "La experiencia empieza con texto. <em>El limite puede terminar en una conexion electrica.</em>",
    details: [
      "Los centros de datos necesitan electricidad, enfriamiento, terreno y acceso a la red.",
      "Las comunidades sienten la expansion en impuestos, facturas, permisos y ruido.",
      "La nube tiene direccion fisica.",
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
      "Un formato recurrente para seguir que cambio, por que importa y que capa de IA toca.",
    body: [
      "Un resumen semanal de IA no debe ser solo una lista de titulares. Debe mapear cada evento a la capa que cambia: energia, chips, datos, modelos, software, pruebas, contexto de negocio o flujo humano.",
      "La meta es hacer que las noticias sean utiles: que cambio, por que importa, que sigue incierto y que debo seguir observando.",
    ],
  },
];

export const localeCopy = {
  en: {
    whereBoot: "WRITING + AI LAYERS",
    whereEnd: "END OF LAYERS",
    countBoot: "START",
    homeTitle: "Published writing for understanding AI as a system.",
    homeBody:
      "GateKPT starts with Marcelo's notes, then opens what happens after you type: input, tokens, context, models, tools, chips, and power.",
    openLog: "Read latest note",
    exploreMap: "Learn the layers",
    layers: "AI layers",
    writingBadge: "Original published writing",
    moreLabel: "Hover for more signal",
    fieldLog: "Published writing",
    viewAll: "All writing",
    endKicker: "L01 - L07",
    endTitle: "AI is physical, logical, and human.",
    endBody:
      "The experience starts close to you, then moves outward. A sentence becomes tokens, context, model work, tool use, chip movement, and physical power.",
    endNote: "New note: Note 002",
    backLayers: "View AI layers",
    startOver: "Start over",
    hint: "Space  -  next    Esc  -  layers",
    back: "Back",
    log: "Writing",
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
      "GateKPT empieza con las notas de Marcelo y despues abre lo que pasa cuando escribes: entrada, tokens, contexto, modelos, herramientas, chips y energia.",
    openLog: "Leer la nota reciente",
    exploreMap: "Aprender las capas",
    layers: "Capas de IA",
    writingBadge: "Escritura original publicada",
    moreLabel: "Pasa el cursor para mas senal",
    fieldLog: "Escritura publicada",
    viewAll: "Toda la escritura",
    endKicker: "L01 - L07",
    endTitle: "La IA es fisica, logica y humana.",
    endBody:
      "La experiencia empieza cerca de ti y se mueve hacia afuera. Una frase se vuelve tokens, contexto, modelo, herramientas, chips y energia fisica.",
    endNote: "Nueva nota: Nota 002",
    backLayers: "Ver capas de IA",
    startOver: "Empezar de nuevo",
    hint: "Espacio  -  avanzar    Esc  -  capas",
    back: "Atras",
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
  summary: "Una nota en ingles sobre curiosidad, agencia y lo que la IA puede estar explorando en nosotros.",
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
    "Una etiqueta util puede convertirse en una habitacion que dejas de intentar abandonar. Una nota sobre tiempo, identidad y usar IA para probar tus limites.",
  noteHref: `/es/notes/${note002.slug}`,
  body: [
    "El tiempo es peligroso cuando pasas demasiado dentro de la misma historia.",
    "Al principio, una etiqueta es util.",
    "Gerente. Analista. Marketer. Operador. No tecnico. Creativo. Persona de negocio.",
    "Ayuda a que la gente entienda lo que haces.",
    "Pero si te quedas dentro de esa etiqueta el tiempo suficiente, empieza a sentirse como quien eres.",
    "Esa es la trampa del tiempo.",
    "Haces algo durante anos o decadas. Construyes una vida alrededor de eso. La gente te reconoce por eso. Te premian por mantenerte consistente. Entonces un dia el mundo cambia, y la etiqueta que antes te daba estructura empieza a mantenerte en el mismo lugar.",
    "Alguien que estudio marketing puede aprender a trabajar con datos de campanas. Alguien de finanzas puede construir una automatizacion pequena. Alguien de diseno puede prototipar un flujo de trabajo. El titulo sigue siendo util. Se vuelve contexto.",
    "Eso es lo que pienso cuando veo a Carl en UP.",
    "No era solo un anciano sentado en una casa. Era alguien congelado en el tiempo.",
    "La casa era memoria. La rutina era seguridad. El sueno seguia ahi, pero enterrado bajo anos de duelo, repeticion e identidad.",
    "Entonces llego un empujon.",
    "No un plan completo. No un mapa perfecto. No permiso.",
    "Un empujon.",
    "Eso es lo que la IA puede ser para la gente ahora mismo.",
    "Un empujon fuera de la version de ti mismo que aceptaste demasiado temprano.",
    "No porque la IA te convierta en otra persona. No porque quite el trabajo. Sino porque te deja cuestionar las paredes alrededor de tu identidad actual.",
    "No soy tecnico. No soy bueno con datos. No puedo construir. Ese no es mi rol. Ya es demasiado tarde para aprender.",
    "Cuantas de esas cosas son hechos, y cuantas son solo frases viejas envueltas en tiempo?",
    "El peligro no es ser malo en algo. El peligro es dejar que el tiempo te convenza de que no puedes convertirte en otra cosa.",
    "La IA esta reduciendo la distancia entre curiosidad y ejecucion. Puedes preguntar. Puedes probar. Puedes construir. Puedes aprender en privado. Puedes entrar a lugares que antes parecian cerrados.",
    "Pero solo si te mueves.",
    "Porque la trampa es comoda.",
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
    "Un modelo de lenguaje está hecho de lenguaje. Leyó lo que ya escribimos y predice lo que sigue, y por eso es muy bueno con el pensamiento que ya está resuelto. No hay nada debajo de las palabras.",
    "Hablamos de nosotros mismos igual. En la mitad del Maratón de Miami las palabras en mi cabeza eran claras: para, no puedes hacer esto, no eres corredor. Las dos primeras eran sobre la carrera. La tercera era sobre mí.",
  ],
};
export function getEntries(locale: Locale) {
  return locale === "es" ? [fieldLogEntryNote003Es, fieldLogEntryNote002Es, fieldLogEntryEs] : [fieldLogEntryNote003, fieldLogEntryNote002, fieldLogEntryEn];
}

export function getLayers(locale: Locale) {
  return locale === "es" ? layersEs : layersEn;
}

export function getEntry(locale: Locale, slug: string) {
  return getEntries(locale).find((entry) => entry.slug === slug);
}
