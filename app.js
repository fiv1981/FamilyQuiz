const LEVELS = {
  nino: { label: "Niño", rounds: 12 },
  facil: { label: "Fácil", rounds: 12 },
  medio: { label: "Medio", rounds: 14 },
  dificil: { label: "Difícil", rounds: 16 },
};

const CATEGORIES = [
  { id: "general", label: "General", icon: "🧠" },
  { id: "geografia", label: "Geografía", icon: "🌍" },
  { id: "ciencia", label: "Ciencia", icon: "🔬" },
  { id: "historia", label: "Historia", icon: "🏛️" },
  { id: "cine", label: "Cine y TV", icon: "🎬" },
  { id: "deporte", label: "Deporte", icon: "⚽" },
  { id: "musica", label: "Música", icon: "🎵" },
  { id: "ninos", label: "Niños", icon: "🧸" },
];

const QUESTION_BANK = buildQuestionBank();

const state = {
  level: null,
  category: null,
  questions: [],
  index: 0,
  score: 0,
  locked: false,
  streak: 0,
};

const screen = document.getElementById("screen");
const backToMenuBtn = document.getElementById("backToMenuBtn");

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, seed = Date.now()) {
  const random = mulberry32(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function resetGame(level, category) {
  state.level = level;
  state.category = category;
  state.index = 0;
  state.score = 0;
  state.locked = false;
  state.streak = 0;

  const rounds = LEVELS[level].rounds;
  const pool = QUESTION_BANK.filter((q) => q.level === level && (category === "mix" || q.category === category));
  state.questions = shuffle(pool, Date.now()).slice(0, rounds);
}

function renderMenu() {
  backToMenuBtn.classList.add("hidden");
  screen.innerHTML = `
    <section class="panel menu-panel">
      <div class="section-title">Dificultad</div>
      <div class="menu-grid levels-grid">
        ${Object.entries(LEVELS)
          .map(
            ([id, level]) => `
              <button class="level-btn" data-level="${id}">
                <span class="level-btn__title">${level.label}</span>
                <span class="level-btn__sub">${level.rounds} preguntas</span>
              </button>
            `
          )
          .join("")}
      </div>

      <div class="section-title">Categoría</div>
      <div class="category-grid">
        <button class="category-chip active" data-category="mix">✨ Mixto</button>
        ${CATEGORIES.map(
          (category) => `
            <button class="category-chip" data-category="${category.id}">${category.icon} ${category.label}</button>
          `
        ).join("")}
      </div>
    </section>
  `;

  let selectedCategory = "mix";

  screen.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedCategory = btn.dataset.category;
      screen.querySelectorAll("[data-category]").forEach((node) => node.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  screen.querySelectorAll("[data-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      resetGame(btn.dataset.level, selectedCategory);
      renderQuestion();
    });
  });
}

function renderQuestion() {
  backToMenuBtn.classList.remove("hidden");
  const q = state.questions[state.index];
  if (!q) {
    renderEnd();
    return;
  }

  const category = CATEGORIES.find((item) => item.id === q.category);

  screen.innerHTML = `
    <section class="panel question-panel">
      <div class="question-meta">
        <span>${LEVELS[state.level].label}</span>
        <span>${category ? `${category.icon} ${category.label}` : "✨ Mixto"}</span>
        <span>Pregunta ${state.index + 1} / ${state.questions.length}</span>
        <span>Puntos: ${state.score}</span>
      </div>

      <div class="progress-bar">
        <div class="progress-bar__fill" style="width:${((state.index) / state.questions.length) * 100}%"></div>
      </div>

      <div class="question-text">${q.question}</div>
      <div class="answers-grid">
        ${q.answers
          .map(
            (answer, index) => `
              <button class="answer-btn" data-index="${index}">
                <span class="answer-key">${String.fromCharCode(65 + index)}</span>
                <span>${answer}</span>
              </button>
            `
          )
          .join("")}
      </div>
    </section>
  `;

  screen.querySelectorAll(".answer-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleAnswer(Number(btn.dataset.index)));
  });
}

function handleAnswer(index) {
  if (state.locked) return;
  state.locked = true;

  const current = state.questions[state.index];
  const buttons = [...screen.querySelectorAll(".answer-btn")];

  buttons.forEach((btn, i) => {
    if (i === current.correct) btn.classList.add("correct");
    else if (i === index) btn.classList.add("wrong");
    else btn.classList.add("dimmed");
  });

  if (index === current.correct) {
    state.score += 1;
    state.streak += 1;
  } else {
    state.streak = 0;
  }

  setTimeout(() => {
    state.index += 1;
    state.locked = false;
    renderQuestion();
  }, 1500);
}

function renderEnd() {
  const total = state.questions.length;
  const percent = Math.round((state.score / total) * 100);
  let title = "¡Muy bien!";
  if (percent >= 90) title = "¡Épico!";
  else if (percent < 50) title = "¡Buen intento!";

  screen.innerHTML = `
    <section class="panel result-box">
      <div class="trophy">🏆</div>
      <h2>${title}</h2>
      <p>Has acertado ${state.score} de ${total} (${percent}%)</p>
      <div class="summary-grid">
        <div class="summary-card"><strong>${LEVELS[state.level].label}</strong><span>Dificultad</span></div>
        <div class="summary-card"><strong>${state.category === "mix" ? "Mixto" : (CATEGORIES.find((c) => c.id === state.category)?.label || "Mixto")}</strong><span>Categoría</span></div>
        <div class="summary-card"><strong>${total}</strong><span>Preguntas</span></div>
      </div>
      <div class="actions-row">
        <button class="primary-btn" id="playAgainBtn">Jugar otra vez</button>
        <button class="ghost-btn" id="menuBtn">Cambiar ajustes</button>
      </div>
    </section>
  `;

  document.getElementById("playAgainBtn").addEventListener("click", () => {
    resetGame(state.level, state.category);
    renderQuestion();
  });
  document.getElementById("menuBtn").addEventListener("click", renderMenu);
}

function buildQuestionBank() {
  const bank = [];

  const templates = {
    nino: [
      ["ninos", "¿Cuál de estos animales dice 'miau'?", ["Gato", "Perro", "Vaca", "Pájaro"], 0],
      ["ninos", "¿Qué usamos para ver mejor cuando está oscuro?", ["Linterna", "Cuchara", "Zapato", "Peine"], 0],
      ["general", "¿Qué estación del año suele ser más calurosa?", ["Verano", "Invierno", "Otoño", "Ninguna"], 0],
      ["general", "¿Cuántos dedos hay en una mano normal?", ["3", "5", "7", "10"], 1],
    ],
    facil: [
      ["geografia", "¿Cuál es la capital de Francia?", ["Roma", "París", "Lisboa", "Berlín"], 1],
      ["deporte", "¿Cuántos jugadores tiene un equipo de fútbol en el campo?", ["9", "10", "11", "12"], 2],
      ["ciencia", "¿Qué animal es el mamífero más grande del mundo?", ["Elefante", "Ballena azul", "Jirafa", "Tiburón"], 1],
      ["cine", "¿Cómo se llama el vaquero de Toy Story?", ["Buzz", "Andy", "Woody", "Forky"], 2],
      ["musica", "¿Cuántas cuerdas tiene una guitarra clásica?", ["4", "5", "6", "8"], 2],
    ],
    medio: [
      ["historia", "¿Qué civilización construyó Machu Picchu?", ["Azteca", "Maya", "Inca", "Romana"], 2],
      ["geografia", "¿Qué río pasa por Londres?", ["Támesis", "Danubio", "Sena", "Tíber"], 0],
      ["ciencia", "¿Qué gas respiramos principalmente para vivir?", ["Helio", "Oxígeno", "Nitrógeno", "Hidrógeno"], 1],
      ["cine", "¿Quién dirigió Titanic?", ["Spielberg", "James Cameron", "Nolan", "Ridley Scott"], 1],
      ["deporte", "¿En qué deporte se usa una raqueta y un volante?", ["Tenis", "Bádminton", "Pádel", "Squash"], 1],
    ],
    dificil: [
      ["historia", "¿En qué año cayó el Muro de Berlín?", ["1987", "1988", "1989", "1991"], 2],
      ["ciencia", "¿Cuál es el símbolo químico del sodio?", ["So", "Sd", "Na", "S"], 2],
      ["geografia", "¿Cuál es el lago más profundo del mundo?", ["Victoria", "Baikal", "Tanganica", "Superior"], 1],
      ["musica", "¿Quién compuso Las cuatro estaciones?", ["Mozart", "Beethoven", "Vivaldi", "Bach"], 2],
      ["cine", "¿Qué película ganó el Oscar a mejor película en 1994?", ["Forrest Gump", "Pulp Fiction", "Cadena perpetua", "El rey león"], 0],
    ],
  };

  const generators = {
    geografia: buildGeographyQuestions,
    ciencia: buildScienceQuestions,
    historia: buildHistoryQuestions,
    cine: buildCinemaQuestions,
    deporte: buildSportsQuestions,
    musica: buildMusicQuestions,
    ninos: buildKidsQuestions,
    general: buildGeneralQuestions,
  };

  Object.entries(templates).forEach(([level, entries]) => {
    entries.forEach(([category, question, answers, correct]) => {
      bank.push({ level, category, question, answers, correct });
    });
  });

  Object.entries(generators).forEach(([category, fn]) => {
    fn().forEach((item) => bank.push(item));
  });

  return bank;
}

function buildGeneralQuestions() {
  const data = [
    ["facil", "¿Cuántos meses tiene un año?", ["10", "11", "12", "13"], 2],
    ["facil", "¿Qué bebida sale normalmente de una vaca?", ["Leche", "Zumo", "Té", "Aceite"], 0],
    ["medio", "¿Cuántos lados tiene un hexágono?", ["5", "6", "7", "8"], 1],
    ["medio", "¿Qué idioma se habla principalmente en Brasil?", ["Español", "Francés", "Portugués", "Italiano"], 2],
    ["dificil", "¿Qué número romano representa el 50?", ["L", "C", "V", "X"], 0],
  ];
  return data.map(makeQuestion("general"));
}

function buildGeographyQuestions() {
  const capitals = [
    ["España", "Madrid", ["Madrid", "Barcelona", "Sevilla", "Bilbao"], "facil"],
    ["Italia", "Roma", ["Milán", "Roma", "Nápoles", "Venecia"], "facil"],
    ["Portugal", "Lisboa", ["Oporto", "Lisboa", "Coímbra", "Braga"], "facil"],
    ["Japón", "Tokio", ["Osaka", "Kioto", "Tokio", "Sapporo"], "medio"],
    ["Canadá", "Ottawa", ["Toronto", "Ottawa", "Montreal", "Vancouver"], "medio"],
    ["Australia", "Canberra", ["Sydney", "Melbourne", "Canberra", "Perth"], "dificil"],
  ];
  return capitals.map(([country, correct, answers, level]) => ({
    level,
    category: "geografia",
    question: `¿Cuál es la capital de ${country}?`,
    answers,
    correct: answers.indexOf(correct),
  }));
}

function buildScienceQuestions() {
  const list = [
    ["facil", "¿Qué planeta está más cerca del Sol?", ["Venus", "Marte", "Mercurio", "Tierra"], 2],
    ["facil", "¿Qué necesitamos para respirar?", ["Oxígeno", "Arena", "Plástico", "Hierro"], 0],
    ["medio", "¿Cuál es el órgano que bombea la sangre?", ["Pulmón", "Hígado", "Corazón", "Riñón"], 2],
    ["medio", "¿Cuál es el estado sólido del agua?", ["Nube", "Hielo", "Vapor", "Lluvia"], 1],
    ["dificil", "¿Qué partícula tiene carga negativa?", ["Protón", "Electrón", "Neutrón", "Fotón"], 1],
    ["dificil", "¿Qué planeta tiene los anillos más famosos?", ["Saturno", "Urano", "Neptuno", "Júpiter"], 0],
  ];
  return list.map(makeQuestion("ciencia"));
}

function buildHistoryQuestions() {
  const list = [
    ["facil", "¿Qué construyeron los egipcios famosos por su tamaño?", ["Castillos", "Pirámides", "Acueductos", "Murallas"], 1],
    ["medio", "¿Qué navegante llegó a América en 1492?", ["Magallanes", "Colón", "Elcano", "Cook"], 1],
    ["medio", "¿Qué imperio tenía su capital en Roma?", ["Persa", "Romano", "Inca", "Otomano"], 1],
    ["dificil", "¿En qué siglo comenzó la Revolución Francesa?", ["XVII", "XVIII", "XIX", "XVI"], 1],
    ["dificil", "¿Quién fue el primer emperador romano?", ["Nerón", "Julio César", "Augusto", "Trajano"], 2],
  ];
  return list.map(makeQuestion("historia"));
}

function buildCinemaQuestions() {
  const list = [
    ["facil", "¿De qué color es el sable de luz típico de Luke Skywalker?", ["Rojo", "Azul", "Verde", "Morado"], 2],
    ["facil", "¿Qué princesa pierde un zapato de cristal?", ["Ariel", "Cenicienta", "Bella", "Jasmín"], 1],
    ["medio", "¿Cómo se llama el parque de dinosaurios de Spielberg?", ["Jurassic World", "Jurassic Park", "Dino Land", "Lost World"], 1],
    ["medio", "¿Quién interpreta a Jack Sparrow?", ["Brad Pitt", "Johnny Depp", "Orlando Bloom", "Tom Cruise"], 1],
    ["dificil", "¿Qué película de Nolan juega con sueños dentro de sueños?", ["Memento", "Tenet", "Origen", "Dunkerque"], 2],
  ];
  return list.map(makeQuestion("cine"));
}

function buildSportsQuestions() {
  const list = [
    ["facil", "¿En qué deporte se encesta un balón?", ["Rugby", "Baloncesto", "Béisbol", "Golf"], 1],
    ["facil", "¿Qué deporte juega Rafa Nadal?", ["Fútbol", "Tenis", "Baloncesto", "Ciclismo"], 1],
    ["medio", "¿Cuántos sets suele tener un partido masculino de Grand Slam?", ["3", "5", "7", "9"], 1],
    ["medio", "¿Qué color lleva el maillot del líder en el Tour de Francia?", ["Rojo", "Verde", "Amarillo", "Azul"], 2],
    ["dificil", "¿Cuántos jugadores hay en pista por equipo en balonmano?", ["5", "6", "7", "8"], 2],
  ];
  return list.map(makeQuestion("deporte"));
}

function buildMusicQuestions() {
  const list = [
    ["facil", "¿Qué instrumento tiene teclas blancas y negras?", ["Piano", "Violín", "Trompeta", "Flauta"], 0],
    ["facil", "¿Qué cantante es conocido como el Rey del Pop?", ["Elvis", "Prince", "Michael Jackson", "Freddie Mercury"], 2],
    ["medio", "¿Qué grupo cantaba Bohemian Rhapsody?", ["Queen", "ABBA", "U2", "Coldplay"], 0],
    ["medio", "¿Qué instrumento toca normalmente un baterista?", ["Saxo", "Batería", "Arpa", "Chelo"], 1],
    ["dificil", "¿Qué compositor se quedó sordo en su madurez?", ["Chopin", "Mozart", "Beethoven", "Haydn"], 2],
  ];
  return list.map(makeQuestion("musica"));
}

function buildKidsQuestions() {
  const list = [
    ["nino", "¿Qué animal pone huevos y dice 'cacarear'?", ["Gallo", "Gallina", "Pato", "Oveja"], 1],
    ["nino", "¿Qué usamos para escribir en una pizarra?", ["Tiza", "Tenedor", "Cepillo", "Globo"], 0],
    ["nino", "¿Qué vehículo vuela por el cielo?", ["Barco", "Avión", "Bicicleta", "Tren"], 1],
    ["facil", "¿Qué parte del cuerpo usamos para escuchar?", ["Orejas", "Rodillas", "Dedos", "Codos"], 0],
    ["facil", "¿Qué llevamos en los pies para caminar?", ["Gorros", "Zapatos", "Guantes", "Bufandas"], 1],
  ];
  return list.map(makeQuestion("ninos"));
}

function makeQuestion(category) {
  return ([level, question, answers, correct]) => ({
    level,
    category,
    question,
    answers,
    correct,
  });
}

backToMenuBtn.addEventListener("click", renderMenu);
renderMenu();
