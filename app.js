const LEVELS = {
  nino: { label: "Niño", rounds: 12 },
  facil: { label: "Fácil", rounds: 12 },
  medio: { label: "Medio", rounds: 14 },
  dificil: { label: "Difícil", rounds: 16 },
};

const CATEGORIES = [
  { id: "mix", label: "Mixto", icon: "✨" },
  { id: "general", label: "General", icon: "🧠" },
  { id: "geografia", label: "Geografía", icon: "🌍" },
  { id: "ciencia", label: "Ciencia", icon: "🔬" },
  { id: "historia", label: "Historia", icon: "🏛️" },
  { id: "cine", label: "Cine y TV", icon: "🎬" },
  { id: "deporte", label: "Deporte", icon: "⚽" },
  { id: "musica", label: "Música", icon: "🎵" },
  { id: "ninos", label: "Niños", icon: "🧸" },
];

const OPTIONS = {
  timerEnabled: true,
  timerSeconds: 20,
};

const state = {
  screen: "difficulty",
  level: null,
  category: "mix",
  questions: [],
  index: 0,
  score: 0,
  locked: false,
  timeLeft: OPTIONS.timerSeconds,
  timerId: null,
};

const QUESTION_BANK = buildQuestionBank();

const screen = document.getElementById("screen");
const backToMenuBtn = document.getElementById("backToMenuBtn");

function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}

function shuffle(arr, seed = Date.now()) {
  let a = seed >>> 0;
  const rand = () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startTimer() {
  stopTimer();
  if (!OPTIONS.timerEnabled) return;
  state.timeLeft = OPTIONS.timerSeconds;
  const timerFill = document.querySelector(".timebar__fill");
  const timerText = document.querySelector(".timebar__text");
  const total = OPTIONS.timerSeconds;

  const paint = () => {
    if (timerText) timerText.textContent = `${state.timeLeft}s`;
    if (timerFill) timerFill.style.width = `${(state.timeLeft / total) * 100}%`;
  };

  paint();
  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    paint();
    if (state.timeLeft <= 0) {
      stopTimer();
      handleAnswer(-1);
    }
  }, 1000);
}

function resetGame(level, category) {
  state.level = level;
  state.category = category;
  state.index = 0;
  state.score = 0;
  state.locked = false;

  const rounds = LEVELS[level].rounds;
  const pool = QUESTION_BANK.filter((q) => q.level === level && (category === "mix" || q.category === category));
  state.questions = shuffle(pool, Date.now()).slice(0, rounds);
}

function render() {
  backToMenuBtn.classList.toggle("hidden", state.screen === "difficulty");
  if (state.screen === "difficulty") return renderDifficultyScreen();
  if (state.screen === "category") return renderCategoryScreen();
  if (state.screen === "options") return renderOptionsScreen();
  if (state.screen === "question") return renderQuestionScreen();
  if (state.screen === "end") return renderEndScreen();
}

function renderDifficultyScreen() {
  stopTimer();
  screen.innerHTML = `
    <section class="panel stage-panel stage-panel--difficulty">
      <div class="stage-head">
        <div>
          <div class="section-title">FamilyQuiz</div>
          <h2>Elige dificultad</h2>
        </div>
        <button class="ghost-btn" id="openOptionsBtn">Opciones</button>
      </div>
      <div class="level-grid">
        ${Object.entries(LEVELS).map(([id, level]) => `
          <button class="level-btn level-btn--center" data-level="${id}">
            <span class="level-btn__title">${level.label}</span>
            <span class="level-btn__sub">${countByLevel(id)}+ preguntas</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;

  screen.querySelectorAll("[data-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.level = btn.dataset.level;
      state.screen = "category";
      render();
    });
  });
  document.getElementById("openOptionsBtn").addEventListener("click", () => {
    state.screen = "options";
    render();
  });
}

function renderCategoryScreen() {
  stopTimer();
  screen.innerHTML = `
    <section class="panel stage-panel stage-panel--category">
      <div class="stage-head compact">
        <div>
          <div class="section-title">${LEVELS[state.level].label}</div>
          <h2>Elige tema</h2>
        </div>
      </div>
      <div class="category-grid category-grid--full">
        ${CATEGORIES.map((category) => `
          <button class="category-chip category-chip--big ${state.category === category.id ? "active" : ""}" data-category="${category.id}">
            <span>${category.icon}</span>
            <span>${category.label}</span>
          </button>
        `).join("")}
      </div>
      <div class="actions-row actions-row--spread">
        <button class="ghost-btn" id="backDifficultyBtn">Atrás</button>
        <button class="primary-btn" id="startGameBtn">Empezar</button>
      </div>
    </section>
  `;

  screen.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.category = btn.dataset.category;
      render();
    });
  });
  document.getElementById("backDifficultyBtn").addEventListener("click", () => {
    state.screen = "difficulty";
    render();
  });
  document.getElementById("startGameBtn").addEventListener("click", () => {
    resetGame(state.level, state.category);
    state.screen = "question";
    render();
  });
}

function renderOptionsScreen() {
  stopTimer();
  screen.innerHTML = `
    <section class="panel stage-panel stage-panel--options">
      <div class="stage-head compact">
        <div>
          <div class="section-title">Configuración</div>
          <h2>Opciones</h2>
        </div>
      </div>
      <div class="options-grid">
        <label class="option-card">
          <span>Temporizador</span>
          <input type="checkbox" id="timerEnabled" ${OPTIONS.timerEnabled ? "checked" : ""} />
        </label>
        <label class="option-card">
          <span>Segundos por pregunta</span>
          <select id="timerSeconds">
            ${[10, 15, 20, 25, 30, 40].map((s) => `<option value="${s}" ${OPTIONS.timerSeconds === s ? "selected" : ""}>${s} segundos</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="actions-row actions-row--spread">
        <button class="ghost-btn" id="closeOptionsBtn">Volver</button>
        <button class="primary-btn" id="saveOptionsBtn">Guardar</button>
      </div>
    </section>
  `;

  document.getElementById("closeOptionsBtn").addEventListener("click", () => {
    state.screen = "difficulty";
    render();
  });
  document.getElementById("saveOptionsBtn").addEventListener("click", () => {
    OPTIONS.timerEnabled = document.getElementById("timerEnabled").checked;
    OPTIONS.timerSeconds = Number(document.getElementById("timerSeconds").value);
    state.screen = "difficulty";
    render();
  });
}

function renderQuestionScreen() {
  const q = state.questions[state.index];
  if (!q) {
    state.screen = "end";
    render();
    return;
  }

  const category = categoryById(q.category);
  screen.innerHTML = `
    <section class="panel question-panel">
      <div class="question-top">
        <div class="question-meta compact-meta">
          <span>${LEVELS[state.level].label}</span>
          <span>${category.icon} ${category.label}</span>
          <span>${state.index + 1} / ${state.questions.length}</span>
          <span>${state.score} pts</span>
        </div>
        <div class="timebar ${OPTIONS.timerEnabled ? "" : "hidden"}">
          <div class="timebar__track"><div class="timebar__fill"></div></div>
          <div class="timebar__text"></div>
        </div>
      </div>
      <div class="question-text fit-text">${q.question}</div>
      <div class="answers-grid answers-grid--fit">
        ${q.answers.map((answer, index) => `
          <button class="answer-btn" data-index="${index}">
            <span class="answer-key">${String.fromCharCode(65 + index)}</span>
            <span>${answer}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;

  screen.querySelectorAll(".answer-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleAnswer(Number(btn.dataset.index)));
  });
  startTimer();
}

function handleAnswer(index) {
  if (state.locked) return;
  state.locked = true;
  stopTimer();

  const current = state.questions[state.index];
  const buttons = [...screen.querySelectorAll(".answer-btn")];

  buttons.forEach((btn, i) => {
    if (i === current.correct) btn.classList.add("correct");
    else if (i === index) btn.classList.add("wrong");
    else btn.classList.add("dimmed");
  });

  if (index === current.correct) state.score += 1;

  setTimeout(() => {
    state.index += 1;
    state.locked = false;
    renderQuestionScreen();
  }, 1400);
}

function renderEndScreen() {
  stopTimer();
  const total = state.questions.length;
  const percent = Math.round((state.score / total) * 100);
  const category = categoryById(state.category);
  screen.innerHTML = `
    <section class="panel result-box">
      <div class="trophy">🏆</div>
      <h2>${percent >= 85 ? "¡Épico!" : percent >= 60 ? "¡Muy bien!" : "¡Buen intento!"}</h2>
      <p>Has acertado ${state.score} de ${total} (${percent}%)</p>
      <div class="summary-grid">
        <div class="summary-card"><strong>${LEVELS[state.level].label}</strong><span>Dificultad</span></div>
        <div class="summary-card"><strong>${category.label}</strong><span>Tema</span></div>
        <div class="summary-card"><strong>${OPTIONS.timerEnabled ? `${OPTIONS.timerSeconds}s` : "Sin tiempo"}</strong><span>Temporizador</span></div>
      </div>
      <div class="actions-row">
        <button class="primary-btn" id="playAgainBtn">Repetir</button>
        <button class="ghost-btn" id="changeThemeBtn">Cambiar tema</button>
        <button class="ghost-btn" id="homeBtn">Inicio</button>
      </div>
    </section>
  `;

  document.getElementById("playAgainBtn").addEventListener("click", () => {
    resetGame(state.level, state.category);
    state.screen = "question";
    render();
  });
  document.getElementById("changeThemeBtn").addEventListener("click", () => {
    state.screen = "category";
    render();
  });
  document.getElementById("homeBtn").addEventListener("click", () => {
    state.screen = "difficulty";
    render();
  });
}

function countByLevel(level) {
  return QUESTION_BANK.filter((q) => q.level === level).length;
}

function buildQuestionBank() {
  const bank = [];

  const datasets = {
    nino: buildKidsDataset(),
    facil: buildEasyDataset(),
    medio: buildMediumDataset(),
    dificil: buildHardDataset(),
  };

  Object.entries(datasets).forEach(([level, items]) => {
    items.forEach((item, idx) => {
      bank.push({
        level,
        category: item.category,
        question: item.question,
        answers: item.answers,
        correct: item.correct,
        id: `${level}-${idx}`,
      });
    });
  });

  return bank;
}

function buildKidsDataset() {
  const subjectSets = {
    ninos: [
      ["¿Qué animal hace 'miau'?", ["Gato", "Perro", "Vaca", "Caballo"], 0],
      ["¿Qué animal hace 'guau'?", ["Pato", "Perro", "Gallo", "Ratón"], 1],
      ["¿Qué usamos para dormir por la noche?", ["Cama", "Mesa", "Bañera", "Nevera"], 0],
      ["¿Qué llevamos en los pies?", ["Zapatos", "Gorros", "Guantes", "Bufandas"], 0],
      ["¿Qué vehículo vuela?", ["Coche", "Tren", "Avión", "Patinete"], 2],
      ["¿Qué usamos para cortar papel en clase?", ["Tijeras", "Cuchara", "Cepillo", "Pelota"], 0],
    ],
    general: [
      ["¿Cuántos dedos tienes en una mano?", ["3", "4", "5", "6"], 2],
      ["¿Qué estación suele ser calurosa?", ["Verano", "Invierno", "Otoño", "Ninguna"], 0],
      ["¿Qué color tiene un plátano maduro normalmente?", ["Azul", "Rojo", "Amarillo", "Negro"], 2],
      ["¿Qué parte del cuerpo usamos para ver?", ["Ojos", "Rodillas", "Tobillos", "Codos"], 0],
      ["¿Cuántos días tiene una semana?", ["5", "6", "7", "8"], 2],
      ["¿Qué sale del grifo para beber o lavarse?", ["Arena", "Agua", "Humo", "Leche"], 1],
    ],
    geografia: [
      ["¿En qué planeta vivimos?", ["Marte", "Tierra", "Venus", "Júpiter"], 1],
      ["¿Qué cae del cielo cuando llueve?", ["Piedras", "Agua", "Fuego", "Hojas"], 1],
      ["¿Qué vemos en el cielo por la noche?", ["Sol", "Estrellas", "Semáforos", "Montañas"], 1],
      ["¿Qué hay en la playa?", ["Arena", "Asfalto", "Nieve", "Ladrillos"], 0],
      ["¿Dónde viven los peces?", ["En el cielo", "En el agua", "En árboles", "En cuevas"], 1],
      ["¿Qué sale por la mañana?", ["La Luna", "El Sol", "La nieve", "Un tren"], 1],
    ],
  };
  return inflateQuestions(subjectSets, 18);
}

function buildEasyDataset() {
  const subjectSets = {
    general: [
      ["¿Cuántos meses tiene un año?", ["10", "11", "12", "13"], 2],
      ["¿Qué idioma se habla principalmente en España?", ["Portugués", "Catalán", "Español", "Italiano"], 2],
      ["¿Cuál de estos días suele formar parte del fin de semana?", ["Lunes", "Martes", "Sábado", "Jueves"], 2],
      ["¿Qué bebida sale normalmente de una vaca?", ["Leche", "Zumo", "Té", "Aceite"], 0],
      ["¿Qué aparato usamos para llamar por teléfono?", ["Nevera", "Móvil", "Tostadora", "Lámpara"], 1],
      ["¿Cuántas ruedas tiene normalmente una bicicleta?", ["1", "2", "3", "4"], 1],
    ],
    geografia: [
      ["¿Cuál es la capital de España?", ["Valencia", "Madrid", "Sevilla", "Bilbao"], 1],
      ["¿Cuál es la capital de Francia?", ["París", "Roma", "Berlín", "Lisboa"], 0],
      ["¿Qué país tiene forma de bota en Europa?", ["Portugal", "Grecia", "Italia", "Austria"], 2],
      ["¿En qué continente está Japón?", ["Europa", "África", "Asia", "América"], 2],
      ["¿Qué océano baña la costa oeste de América?", ["Índico", "Pacífico", "Ártico", "Mediterráneo"], 1],
      ["¿Qué ciudad es famosa por la Torre Eiffel?", ["Roma", "París", "Londres", "Atenas"], 1],
    ],
    ciencia: [
      ["¿Qué planeta es conocido como el planeta rojo?", ["Venus", "Marte", "Neptuno", "Mercurio"], 1],
      ["¿Qué necesitamos para respirar?", ["Oxígeno", "Arena", "Plástico", "Hierro"], 0],
      ["¿Cuál es el estado sólido del agua?", ["Humo", "Vapor", "Hielo", "Niebla"], 2],
      ["¿Qué parte de la planta suele estar bajo tierra?", ["Flor", "Raíz", "Hoja", "Fruto"], 1],
      ["¿Cuál es el astro que da luz y calor a la Tierra?", ["Luna", "Sol", "Marte", "Venus"], 1],
      ["¿Cuál de estos animales es mamífero?", ["Tiburón", "Delfín", "Pulpo", "Trucha"], 1],
    ],
    historia: [
      ["¿Qué construyeron los egipcios famosos por su tamaño?", ["Pirámides", "Rascacielos", "Túneles", "Puertos"], 0],
      ["¿Quién llegó a América en 1492?", ["Marco Polo", "Colón", "Napoleón", "Elcano"], 1],
      ["¿Qué civilización vivía en Roma antigua?", ["Romana", "Inca", "Maya", "Vikinga"], 0],
      ["¿Qué monumento está en China y es muy largo?", ["Muralla China", "Big Ben", "Coliseo", "Torre de Pisa"], 0],
      ["¿En qué país estaban los faraones?", ["Grecia", "Egipto", "China", "Perú"], 1],
      ["¿Qué navegante dio la primera vuelta al mundo completada por su expedición?", ["Colón", "Elcano", "Da Gama", "Amundsen"], 1],
    ],
    cine: [
      ["¿Cómo se llama el vaquero de Toy Story?", ["Woody", "Buzz", "Andy", "Rex"], 0],
      ["¿Qué princesa pierde un zapato de cristal?", ["Ariel", "Cenicienta", "Bella", "Elsa"], 1],
      ["¿Quién vive en una piña debajo del mar?", ["Mickey", "Bob Esponja", "Shrek", "Olaf"], 1],
      ["¿Qué superhéroe lleva escudo con estrella?", ["Batman", "Iron Man", "Capitán América", "Thor"], 2],
      ["¿Cuál de estos personajes es un ogro verde?", ["Shrek", "Sonic", "Simba", "Gru"], 0],
      ["¿Qué película tiene un pez llamado Nemo?", ["Coco", "Cars", "Buscando a Nemo", "Frozen"], 2],
    ],
    deporte: [
      ["¿En qué deporte se usa una pelota de baloncesto?", ["Tenis", "Golf", "Baloncesto", "Rugby"], 2],
      ["¿Qué deporte juega Rafa Nadal?", ["Fútbol", "Tenis", "Balonmano", "Ciclismo"], 1],
      ["¿Con qué se chuta normalmente en fútbol?", ["Con la mano", "Con el pie", "Con la cabeza solo", "Con un palo"], 1],
      ["¿Qué se necesita para nadar en una piscina?", ["Casco", "Bañador", "Botas", "Guantes"], 1],
      ["¿Qué deporte usa una bici?", ["Ciclismo", "Boxeo", "Judo", "Baloncesto"], 0],
      ["¿Dónde se marcan goles?", ["Tenis", "Fútbol", "Ajedrez", "Natación"], 1],
    ],
    musica: [
      ["¿Qué instrumento tiene teclas blancas y negras?", ["Piano", "Violín", "Tambor", "Flauta"], 0],
      ["¿Qué artista era conocido como el Rey del Pop?", ["Prince", "Michael Jackson", "Freddie Mercury", "Bowie"], 1],
      ["¿Qué instrumento tiene cuerdas y se toca con púa o dedos?", ["Guitarra", "Batería", "Trompeta", "Fagot"], 0],
      ["¿Qué se usa para escuchar música?", ["Auriculares", "Cinturón", "Martillo", "Calendario"], 0],
      ["¿Qué hace un cantante?", ["Pintar", "Cantar", "Nadar", "Coser"], 1],
      ["¿Qué grupo cantaba Bohemian Rhapsody?", ["Queen", "ABBA", "U2", "Coldplay"], 0],
    ],
  };
  return inflateQuestions(subjectSets, 18);
}

function buildMediumDataset() {
  const subjectSets = {
    general: [
      ["¿Cuántos lados tiene un hexágono?", ["5", "6", "7", "8"], 1],
      ["¿Qué idioma se habla principalmente en Brasil?", ["Español", "Portugués", "Francés", "Italiano"], 1],
      ["¿Qué moneda usa Estados Unidos?", ["Euro", "Libra", "Dólar", "Peso"], 2],
      ["¿Qué número romano representa el 10?", ["L", "X", "V", "C"], 1],
      ["¿Cuál es el resultado de 9 x 7?", ["56", "63", "72", "49"], 1],
      ["¿Cuántos continentes se suelen contar?", ["5", "6", "7", "8"], 2],
    ],
    geografia: [
      ["¿Qué río pasa por Londres?", ["Sena", "Támesis", "Danubio", "Rin"], 1],
      ["¿Cuál es la capital de Canadá?", ["Toronto", "Ottawa", "Montreal", "Vancouver"], 1],
      ["¿Qué cordillera está en Sudamérica?", ["Alpes", "Andes", "Apeninos", "Urales"], 1],
      ["¿Qué país tiene la forma más parecida a una península ibérica completa?", ["España y Portugal", "Italia", "Grecia", "Turquía"], 0],
      ["¿En qué océano está Hawái?", ["Atlántico", "Índico", "Pacífico", "Ártico"], 2],
      ["¿Cuál es la capital de Japón?", ["Kioto", "Osaka", "Tokio", "Nara"], 2],
    ],
    ciencia: [
      ["¿Cuál es el órgano que bombea la sangre?", ["Pulmón", "Corazón", "Hígado", "Riñón"], 1],
      ["¿Qué gas absorben las plantas?", ["Oxígeno", "Nitrógeno", "CO2", "Helio"], 2],
      ["¿Qué planeta tiene anillos muy visibles?", ["Marte", "Júpiter", "Saturno", "Mercurio"], 2],
      ["¿Qué tipo de animal es una rana?", ["Mamífero", "Anfibio", "Ave", "Reptil"], 1],
      ["¿Qué metal es líquido a temperatura ambiente?", ["Oro", "Mercurio", "Plata", "Hierro"], 1],
      ["¿Qué parte del cuerpo filtra la sangre y produce orina?", ["Pulmones", "Riñones", "Intestino", "Bazo"], 1],
    ],
    historia: [
      ["¿Qué imperio tenía su capital en Roma?", ["Romano", "Persa", "Bizantino", "Inca"], 0],
      ["¿Quién fue Napoleón?", ["Pintor", "Emperador francés", "Astrónomo", "Explorador"], 1],
      ["¿Qué civilización construyó Machu Picchu?", ["Maya", "Inca", "Azteca", "Olmeca"], 1],
      ["¿Qué país levantó el Muro de Berlín oriental?", ["Alemania del Este", "Francia", "URSS exclusivamente", "Polonia"], 0],
      ["¿Qué barco famoso se hundió en 1912?", ["Mayflower", "Titanic", "Bismarck", "Endeavour"], 1],
      ["¿Quién era la reina de Egipto más famosa de la Antigüedad?", ["Isabel I", "Cleopatra", "Victoria", "Nefertari"], 1],
    ],
    cine: [
      ["¿Quién dirigió Titanic?", ["Spielberg", "Cameron", "Nolan", "Scorsese"], 1],
      ["¿Cómo se llama el parque de dinosaurios de Spielberg?", ["Jurassic Park", "Dino Land", "Jurassic World", "Isla Dino"], 0],
      ["¿Quién interpreta a Jack Sparrow?", ["Orlando Bloom", "Johnny Depp", "Tom Cruise", "Brad Pitt"], 1],
      ["¿Qué saga tiene un personaje llamado Frodo?", ["Harry Potter", "Star Wars", "El Señor de los Anillos", "Matrix"], 2],
      ["¿Qué película trata de sueños dentro de sueños?", ["Origen", "Memento", "Avatar", "Gravity"], 0],
      ["¿Qué estudio creó a Mickey Mouse?", ["Pixar", "DreamWorks", "Disney", "Ghibli"], 2],
    ],
    deporte: [
      ["¿Qué color lleva el maillot del líder en el Tour?", ["Rojo", "Verde", "Amarillo", "Azul"], 2],
      ["¿Cuántos sets máximos tiene un Grand Slam masculino?", ["3", "4", "5", "6"], 2],
      ["¿En qué deporte se usa un volante?", ["Pádel", "Tenis", "Bádminton", "Squash"], 2],
      ["¿Qué país ganó el Mundial de fútbol 2010?", ["Brasil", "España", "Alemania", "Argentina"], 1],
      ["¿Cuántos jugadores hay por equipo en una pista de baloncesto?", ["4", "5", "6", "7"], 1],
      ["¿Qué deporte practican los pilotos de MotoGP?", ["Automovilismo", "Motociclismo", "Ciclismo", "Karting"], 1],
    ],
    musica: [
      ["¿Qué grupo cantaba Bohemian Rhapsody?", ["ABBA", "Queen", "U2", "Oasis"], 1],
      ["¿Qué instrumento toca un baterista?", ["Chelo", "Arpa", "Batería", "Clarinete"], 2],
      ["¿Cuál es la clave musical más usada para melodías agudas?", ["Fa", "Do", "Sol", "Re"], 2],
      ["¿Qué compositor escribió Las cuatro estaciones?", ["Mozart", "Vivaldi", "Bach", "Haydn"], 1],
      ["¿Qué cantante fue líder de Queen?", ["Freddie Mercury", "Bono", "Mick Jagger", "Sting"], 0],
      ["¿Qué instrumento tiene 88 teclas en su versión estándar?", ["Piano", "Sinte", "Acordeón", "Órgano"], 0],
    ],
  };
  return inflateQuestions(subjectSets, 18);
}

function buildHardDataset() {
  const subjectSets = {
    general: [
      ["¿Qué número romano representa el 50?", ["X", "L", "C", "V"], 1],
      ["¿Cuántos grados tiene un ángulo llano?", ["90", "120", "180", "360"], 2],
      ["¿Qué escritor creó a Sherlock Holmes?", ["Agatha Christie", "Arthur Conan Doyle", "Edgar Allan Poe", "Verne"], 1],
      ["¿En qué idioma se escribió originalmente Don Quijote?", ["Latín", "Portugués", "Castellano", "Catalán"], 2],
      ["¿Qué país tiene forma de hexágono en mapas simplificados de Europa occidental?", ["Francia", "Alemania", "Suiza", "Bélgica"], 0],
      ["¿Qué día va antes del domingo?", ["Viernes", "Sábado", "Jueves", "Lunes"], 1],
    ],
    geografia: [
      ["¿Cuál es el lago más profundo del mundo?", ["Baikal", "Victoria", "Superior", "Tanganica"], 0],
      ["¿Cuál es la capital de Australia?", ["Sydney", "Melbourne", "Canberra", "Perth"], 2],
      ["¿Qué desierto ocupa gran parte del norte de África?", ["Gobi", "Sahara", "Atacama", "Kalahari"], 1],
      ["¿Qué país tiene como capital Ottawa?", ["Australia", "Canadá", "Irlanda", "Nueva Zelanda"], 1],
      ["¿Qué país europeo tiene capital en Varsovia?", ["Hungría", "Polonia", "Rumanía", "Chequia"], 1],
      ["¿Qué océano se encuentra al este de África y al oeste de Australia?", ["Pacífico", "Ártico", "Índico", "Atlántico"], 2],
    ],
    ciencia: [
      ["¿Cuál es el símbolo químico del sodio?", ["So", "Na", "Sd", "Sn"], 1],
      ["¿Qué partícula tiene carga negativa?", ["Protón", "Neutrón", "Electrón", "Positrón"], 2],
      ["¿Qué científico formuló la teoría de la relatividad?", ["Newton", "Einstein", "Tesla", "Galileo"], 1],
      ["¿Qué planeta tarda más en dar una vuelta al Sol entre estos?", ["Júpiter", "Saturno", "Neptuno", "Marte"], 2],
      ["¿Qué vitamina se obtiene principalmente del sol?", ["A", "B12", "C", "D"], 3],
      ["¿Qué parte del átomo concentra casi toda su masa?", ["Órbita", "Núcleo", "Corteza", "Protón libre"], 1],
    ],
    historia: [
      ["¿En qué año cayó el Muro de Berlín?", ["1987", "1988", "1989", "1991"], 2],
      ["¿Quién fue el primer emperador romano?", ["César", "Augusto", "Trajano", "Nerón"], 1],
      ["¿En qué siglo comenzó la Revolución Francesa?", ["XVI", "XVII", "XVIII", "XIX"], 2],
      ["¿Qué reina gobernó el Reino Unido durante la época victoriana?", ["Isabel I", "Victoria", "Ana", "María"], 1],
      ["¿Qué explorador llegó primero al Polo Sur?", ["Cook", "Amundsen", "Scott", "Shackleton"], 1],
      ["¿En qué ciudad fue asesinado Julio César?", ["Atenas", "Roma", "Mileto", "Cartago"], 1],
    ],
    cine: [
      ["¿Qué película ganó el Oscar a mejor película en 1994?", ["Forrest Gump", "Pulp Fiction", "Cadena perpetua", "Cuatro bodas y un funeral"], 0],
      ["¿Qué director rodó Pulp Fiction?", ["Scorsese", "Tarantino", "Fincher", "Coppola"], 1],
      ["¿Qué actor interpretó al Joker en El caballero oscuro?", ["Joaquin Phoenix", "Jared Leto", "Heath Ledger", "Jack Nicholson"], 2],
      ["¿Qué saga incluye la frase 'Que la Fuerza te acompañe'?", ["Matrix", "Star Wars", "Star Trek", "Dune"], 1],
      ["¿Qué director hizo Origen y Dunkerque?", ["Cameron", "Nolan", "Villeneuve", "Scott"], 1],
      ["¿Qué película de animación transcurre en el Día de Muertos?", ["Encanto", "Coco", "Soul", "Up"], 1],
    ],
    deporte: [
      ["¿Cuántos jugadores hay en pista por equipo en balonmano?", ["5", "6", "7", "8"], 2],
      ["¿En qué deporte se utiliza la palabra birdie?", ["Golf", "Tenis", "Bádminton", "Rugby"], 0],
      ["¿Qué país organiza tradicionalmente el torneo de Wimbledon?", ["Francia", "EE.UU.", "Reino Unido", "Australia"], 2],
      ["¿Cuántos anillos olímpicos aparecen en el símbolo oficial?", ["4", "5", "6", "7"], 1],
      ["¿Qué piloto es conocido como 'Il Dottore' en MotoGP?", ["Stoner", "Rossi", "Márquez", "Lorenzo"], 1],
      ["¿En qué deporte se usa la posición de fuera de juego?", ["Baloncesto", "Hockey hielo", "Fútbol", "Natación"], 2],
    ],
    musica: [
      ["¿Qué compositor se quedó sordo en su madurez?", ["Mozart", "Chopin", "Beethoven", "Schubert"], 2],
      ["¿Quién compuso Las cuatro estaciones?", ["Vivaldi", "Bach", "Haydn", "Debussy"], 0],
      ["¿Qué grupo lideraba Freddie Mercury?", ["Queen", "Kiss", "Dire Straits", "Genesis"], 0],
      ["¿Qué cantante era apodado 'The Boss'?", ["Prince", "Springsteen", "Elton John", "Bowie"], 1],
      ["¿Cuál es la nota que sigue a fa en la escala natural?", ["Mi", "Sol", "La", "Do"], 1],
      ["¿Qué instrumento de cuerda suele tocarse con arco y es más pequeño que el violonchelo?", ["Arpa", "Viola", "Violín", "Laúd"], 2],
    ],
  };
  return inflateQuestions(subjectSets, 18);
}

function inflateQuestions(subjectSets, multiplier) {
  const out = [];
  Object.entries(subjectSets).forEach(([category, rows]) => {
    for (let i = 0; i < multiplier; i += 1) {
      rows.forEach((row, idx) => {
        const [question, answers, correct] = row;
        out.push({
          category,
          question: variantQuestion(question, i, idx),
          answers: answers.map((a, ai) => variantAnswer(a, i, ai, answers.length)),
          correct,
        });
      });
    }
  });
  return dedupeQuestions(out);
}

function variantQuestion(question, pass, idx) {
  const prefixes = ["", "", "", "", "", "", "", "", "", ""];
  const suffixes = ["", "", "", "", "", "", "", "", "", ""];
  return `${prefixes[(pass + idx) % prefixes.length]}${question}${suffixes[(pass * 2 + idx) % suffixes.length]}`;
}

function variantAnswer(answer, pass, idx) {
  const trims = [answer, answer, answer, answer];
  return trims[(pass + idx) % trims.length];
}

function dedupeQuestions(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.category}|${item.question}|${item.answers.join("|")}|${item.correct}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

backToMenuBtn.addEventListener("click", () => {
  if (state.screen === "question") {
    state.screen = "category";
  } else if (state.screen === "category" || state.screen === "options") {
    state.screen = "difficulty";
  } else if (state.screen === "end") {
    state.screen = "difficulty";
  }
  render();
});

render();
