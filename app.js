const QUESTIONS = {
  nino: [
    {
      question: "¿De qué color es el cielo en un día despejado?",
      answers: ["Azul", "Verde", "Rojo", "Negro"],
      correct: 0,
    },
    {
      question: "¿Cuántas patas tiene un perro?",
      answers: ["2", "3", "4", "6"],
      correct: 2,
    },
  ],
  facil: [
    {
      question: "¿Cuál es la capital de España?",
      answers: ["Barcelona", "Madrid", "Valencia", "Sevilla"],
      correct: 1,
    },
    {
      question: "¿Cuántos días tiene una semana?",
      answers: ["5", "6", "7", "8"],
      correct: 2,
    },
  ],
  medio: [
    {
      question: "¿Qué planeta es conocido como el planeta rojo?",
      answers: ["Venus", "Marte", "Júpiter", "Saturno"],
      correct: 1,
    },
    {
      question: "¿En qué continente está Japón?",
      answers: ["Europa", "África", "Asia", "Oceanía"],
      correct: 2,
    },
  ],
  dificil: [
    {
      question: "¿En qué año llegó el ser humano a la Luna?",
      answers: ["1965", "1969", "1972", "1959"],
      correct: 1,
    },
    {
      question: "¿Quién escribió 'La Odisea'?",
      answers: ["Platón", "Sófocles", "Homero", "Virgilio"],
      correct: 2,
    },
  ],
};

const LEVEL_LABELS = {
  nino: "Niño",
  facil: "Fácil",
  medio: "Medio",
  dificil: "Difícil",
};

const state = {
  level: null,
  index: 0,
  score: 0,
  locked: false,
};

const screen = document.getElementById("screen");
const backToMenuBtn = document.getElementById("backToMenuBtn");

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function resetGame(level) {
  state.level = level;
  state.index = 0;
  state.score = 0;
  state.locked = false;
  QUESTIONS[level] = shuffle(QUESTIONS[level]);
}

function renderMenu() {
  backToMenuBtn.classList.add("hidden");
  screen.innerHTML = `
    <section class="panel">
      <h2 style="font-size:clamp(2rem,4vw,3rem);margin:0;">Elige dificultad</h2>
      <div class="menu-grid">
        <button class="level-btn" data-level="nino">Niño</button>
        <button class="level-btn" data-level="facil">Fácil</button>
        <button class="level-btn" data-level="medio">Medio</button>
        <button class="level-btn" data-level="dificil">Difícil</button>
      </div>
    </section>
  `;

  screen.querySelectorAll("[data-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      resetGame(btn.dataset.level);
      renderQuestion();
    });
  });
}

function renderQuestion() {
  backToMenuBtn.classList.remove("hidden");
  const list = QUESTIONS[state.level];
  const q = list[state.index];

  if (!q) {
    renderEnd();
    return;
  }

  screen.innerHTML = `
    <section class="panel">
      <div class="question-meta">
        <span>${LEVEL_LABELS[state.level]}</span>
        <span>Pregunta ${state.index + 1} / ${list.length}</span>
        <span>Puntos: ${state.score}</span>
      </div>
      <div class="question-text">${q.question}</div>
      <div class="answers-grid">
        ${q.answers
          .map(
            (answer, index) => `
              <button class="answer-btn" data-index="${index}">${answer}</button>
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

  const current = QUESTIONS[state.level][state.index];
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
    renderQuestion();
  }, 1400);
}

function renderEnd() {
  const total = QUESTIONS[state.level].length;
  screen.innerHTML = `
    <section class="panel result-box">
      <h2>¡Fin de la partida!</h2>
      <p>Has acertado ${state.score} de ${total}</p>
      <div class="actions-row">
        <button class="primary-btn" id="playAgainBtn">Jugar otra vez</button>
        <button class="ghost-btn" id="menuBtn">Cambiar dificultad</button>
      </div>
    </section>
  `;

  document.getElementById("playAgainBtn").addEventListener("click", () => {
    resetGame(state.level);
    renderQuestion();
  });
  document.getElementById("menuBtn").addEventListener("click", renderMenu);
}

backToMenuBtn.addEventListener("click", renderMenu);
renderMenu();
