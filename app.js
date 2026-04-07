const LEVELS = {
  nino: { label: "Niño", defaultRounds: 12 },
  facil: { label: "Fácil", defaultRounds: 12 },
  medio: { label: "Medio", defaultRounds: 14 },
  dificil: { label: "Difícil", defaultRounds: 16 },
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
  questionCount: 12,
};

const state = {
  screen: "loading",
  level: null,
  category: "mix",
  questions: [],
  bank: [],
  index: 0,
  score: 0,
  locked: false,
  timeLeft: OPTIONS.timerSeconds,
  timerId: null,
};

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
  const rounds = Number(OPTIONS.questionCount) || LEVELS[level].defaultRounds;
  const pool = state.bank.filter((q) => q.level === level && (category === "mix" || q.category === category));
  state.questions = shuffle(pool, Date.now()).slice(0, rounds);
}

function render() {
  backToMenuBtn.classList.toggle("hidden", state.screen === "difficulty" || state.screen === "loading");
  if (state.screen === "loading") return renderLoading();
  if (state.screen === "difficulty") return renderDifficultyScreen();
  if (state.screen === "category") return renderCategoryScreen();
  if (state.screen === "options") return renderOptionsScreen();
  if (state.screen === "question") return renderQuestionScreen();
  if (state.screen === "end") return renderEndScreen();
}

function renderLoading() {
  stopTimer();
  screen.innerHTML = `
    <section class="panel result-box">
      <h2>Cargando preguntas…</h2>
      <p>Preparando la base de datos del juego.</p>
    </section>
  `;
}

function renderDifficultyScreen() {
  stopTimer();
  screen.innerHTML = `
    <section class="panel stage-panel stage-panel--difficulty">
      <div class="stage-head">
        <div>
          <h2>Elige dificultad</h2>
        </div>
        <button class="ghost-btn" id="openOptionsBtn">Opciones</button>
      </div>
      <div class="level-grid">
        ${Object.entries(LEVELS).map(([id, level]) => `
          <button class="level-btn level-btn--center" data-level="${id}">
            <span class="level-btn__title">${level.label}</span>
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
          <h2>Opciones</h2>
        </div>
      </div>
      <div class="options-grid">
        <label class="option-card option-card--stacked">
          <span>Temporizador</span>
          <input type="checkbox" id="timerEnabled" ${OPTIONS.timerEnabled ? "checked" : ""} />
          <select id="timerSeconds">
            ${[10, 15, 20, 25, 30, 40].map((s) => `<option value="${s}" ${OPTIONS.timerSeconds === s ? "selected" : ""}>${s} segundos</option>`).join("")}
          </select>
        </label>
        <label class="option-card option-card--stacked">
          <span>Preguntas por partida</span>
          <select id="questionCount">
            ${[8, 10, 12, 14, 16, 20].map((n) => `<option value="${n}" ${OPTIONS.questionCount === n ? "selected" : ""}>${n} preguntas</option>`).join("")}
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
    OPTIONS.questionCount = Number(document.getElementById("questionCount").value);
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

  screen.innerHTML = `
    <section class="panel question-panel">
      <div class="question-top">
        <div class="question-meta compact-meta">
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
        <div class="summary-card"><strong>${OPTIONS.questionCount}</strong><span>Preguntas</span></div>
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
  return state.bank.filter((q) => q.level === level).length;
}

async function loadQuestions() {
  const levels = Object.keys(LEVELS);
  const responses = await Promise.all(levels.map((level) => fetch(`./questions/${level}.json`).then((r) => r.json())));
  const merged = [];
  responses.forEach((payload) => {
    Object.values(payload).forEach((list) => {
      merged.push(...list);
    });
  });
  state.bank = merged;
}

backToMenuBtn.addEventListener("click", () => {
  if (state.screen === "question") state.screen = "category";
  else if (state.screen === "category" || state.screen === "options") state.screen = "difficulty";
  else if (state.screen === "end") state.screen = "difficulty";
  render();
});

(async () => {
  render();
  await loadQuestions();
  state.screen = "difficulty";
  render();
})();
