const fs = require('fs');
const path = require('path');

const FILES = {
  facil: 'questions/facil.json',
  medio: 'questions/medio.json',
  dificil: 'questions/dificil.json',
  nino: 'questions/nino.json',
};

const CATEGORY_CONFIG = {
  general: {
    facil: [{ id: 9, difficulty: 'easy' }],
    medio: [{ id: 9, difficulty: 'medium' }],
    dificil: [{ id: 9, difficulty: 'hard' }],
    nino: [{ id: 9, difficulty: 'easy' }],
  },
  geografia: {
    facil: [{ id: 22, difficulty: 'easy' }],
    medio: [{ id: 22, difficulty: 'medium' }],
    dificil: [{ id: 22, difficulty: 'hard' }],
    nino: [{ id: 22, difficulty: 'easy' }],
  },
  ciencia: {
    facil: [{ id: 17, difficulty: 'easy' }],
    medio: [{ id: 17, difficulty: 'medium' }],
    dificil: [{ id: 17, difficulty: 'hard' }],
    nino: [{ id: 17, difficulty: 'easy' }],
  },
  historia: {
    facil: [{ id: 23, difficulty: 'easy' }],
    medio: [{ id: 23, difficulty: 'medium' }],
    dificil: [{ id: 23, difficulty: 'hard' }],
    nino: [{ id: 23, difficulty: 'easy' }],
  },
  cine: {
    facil: [{ id: 11, difficulty: 'easy' }, { id: 14, difficulty: 'easy' }],
    medio: [{ id: 11, difficulty: 'medium' }, { id: 14, difficulty: 'medium' }],
    dificil: [{ id: 11, difficulty: 'hard' }, { id: 14, difficulty: 'hard' }],
    nino: [{ id: 11, difficulty: 'easy' }, { id: 14, difficulty: 'easy' }, { id: 32, difficulty: 'easy' }],
  },
  deporte: {
    facil: [{ id: 21, difficulty: 'easy' }],
    medio: [{ id: 21, difficulty: 'medium' }],
    dificil: [{ id: 21, difficulty: 'hard' }],
    nino: [{ id: 21, difficulty: 'easy' }],
  },
  musica: {
    facil: [{ id: 12, difficulty: 'easy' }],
    medio: [{ id: 12, difficulty: 'medium' }],
    dificil: [{ id: 12, difficulty: 'hard' }],
    nino: [{ id: 12, difficulty: 'easy' }],
  },
  ninos: {
    facil: [
      { id: 32, difficulty: 'easy' },
      { id: 11, difficulty: 'easy' },
      { id: 14, difficulty: 'easy' },
      { id: 12, difficulty: 'easy' },
      { id: 9, difficulty: 'easy' }
    ],
    medio: [
      { id: 32, difficulty: 'easy' },
      { id: 11, difficulty: 'medium' },
      { id: 14, difficulty: 'medium' },
      { id: 12, difficulty: 'medium' },
      { id: 9, difficulty: 'medium' }
    ],
    dificil: [
      { id: 32, difficulty: 'easy' },
      { id: 11, difficulty: 'hard' },
      { id: 14, difficulty: 'hard' },
      { id: 12, difficulty: 'hard' },
      { id: 9, difficulty: 'hard' }
    ],
    nino: [
      { id: 32, difficulty: 'easy' },
      { id: 11, difficulty: 'easy' },
      { id: 14, difficulty: 'easy' },
      { id: 12, difficulty: 'easy' },
      { id: 9, difficulty: 'easy' }
    ],
  },
};

const LEVEL_MAP = { facil: 'facil', medio: 'medio', dificil: 'dificil', nino: 'nino' };
const TARGET = 50;
const limitations = [];

function decodeHtml(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&uuml;/g, 'ü')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&ouml;/g, 'ö')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&hellip;/g, '…')
    .replace(/&deg;/g, '°')
    .replace(/&shy;/g, '')
    .trim();
}

function normalizeQuestion(str) {
  return decodeHtml(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchOpenTdb(categoryId, difficulty, amount = 10) {
  const url = `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&difficulty=${difficulty}&type=multiple`;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      await sleep(500);
      return data.results || [];
    }
    if (res.status !== 429 || attempt === 6) {
      throw new Error(`OpenTDB ${res.status} for ${categoryId}/${difficulty}`);
    }
    await sleep(1200 * attempt);
  }
  return [];
}

async function collectQuestions(categoryKey, levelKey) {
  const sources = CATEGORY_CONFIG[categoryKey][levelKey];
  const accepted = [];
  const seen = new Set();
  let exhausted = false;

  for (const source of sources) {
    let attempts = 0;
    while (accepted.length < TARGET && attempts < 8) {
      attempts += 1;
      const batch = await fetchOpenTdb(source.id, source.difficulty, 50);
      if (!batch.length) break;
      let addedThisBatch = 0;
      for (const q of batch) {
        const key = normalizeQuestion(q.question);
        if (seen.has(key)) continue;
        seen.add(key);
        accepted.push({ ...q, _source: source });
        addedThisBatch += 1;
        if (accepted.length >= TARGET) break;
      }
      if (addedThisBatch === 0) break;
    }
    if (accepted.length >= TARGET) break;
  }

  if (accepted.length < TARGET) {
    exhausted = true;
    const fallbackDifficulties = ['easy', 'medium', 'hard'];
    for (const source of sources) {
      for (const diff of fallbackDifficulties) {
        if (accepted.length >= TARGET) break;
        let attempts = 0;
        while (accepted.length < TARGET && attempts < 4) {
          attempts += 1;
          const batch = await fetchOpenTdb(source.id, diff, 50);
          if (!batch.length) break;
          let addedThisBatch = 0;
          for (const q of batch) {
            const key = normalizeQuestion(q.question);
            if (seen.has(key)) continue;
            seen.add(key);
            accepted.push({ ...q, _source: { ...source, difficulty: diff, fallback: true } });
            addedThisBatch += 1;
            if (accepted.length >= TARGET) break;
          }
          if (addedThisBatch === 0) break;
        }
      }
    }
  }

  if (accepted.length < TARGET) {
    throw new Error(`No se pudieron conseguir ${TARGET} preguntas únicas para ${levelKey}/${categoryKey}, solo ${accepted.length}`);
  }

  if (exhausted || accepted.some(q => q._source.fallback)) {
    limitations.push(`${levelKey}/${categoryKey}: se mezclaron dificultades para completar 50 preguntas únicas`);
  }

  return accepted.slice(0, TARGET);
}

async function translateBatch(lines) {
  const text = lines.join('\n');
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Translate ${res.status}`);
  const data = await res.json();
  const translated = (data[0] || []).map(chunk => chunk[0]).join('');
  return translated.split('\n');
}

async function translateStrings(strings) {
  const uniq = [...new Set(strings.map(s => decodeHtml(s)))];
  const map = new Map();
  const chunkSize = 30;
  for (let i = 0; i < uniq.length; i += chunkSize) {
    const chunk = uniq.slice(i, i + chunkSize);
    const translated = await translateBatch(chunk);
    for (let j = 0; j < chunk.length; j += 1) {
      map.set(chunk[j], (translated[j] || chunk[j]).trim());
    }
  }
  return strings.map(s => map.get(decodeHtml(s)) || decodeHtml(s));
}

function cleanSpanish(str) {
  return str
    .replace(/\s+/g, ' ')
    .replace(/ \?/g, '?')
    .replace(/ !/g, '!')
    .replace(/^¿\s+/g, '¿')
    .replace(/^¡\s+/g, '¡')
    .trim();
}

function shuffle(arr, seed) {
  let x = seed >>> 0;
  const rand = () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return ((x >>> 0) / 4294967296);
  };
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function buildBlock(categoryKey, levelKey) {
  const fetched = await collectQuestions(categoryKey, levelKey);
  const rawStrings = [];
  for (const item of fetched) {
    rawStrings.push(item.question, item.correct_answer, ...item.incorrect_answers);
  }
  const translated = await translateStrings(rawStrings);
  let idx = 0;
  const entries = fetched.map((item, i) => {
    const question = cleanSpanish(translated[idx++]);
    const correct = cleanSpanish(translated[idx++]);
    const incorrect = item.incorrect_answers.map(() => cleanSpanish(translated[idx++]));
    const answers = shuffle([correct, ...incorrect], (i + 1) * 7919 + categoryKey.length * 13 + levelKey.length * 17);
    return {
      question,
      answers,
      correct: answers.indexOf(correct),
      category: categoryKey,
      level: LEVEL_MAP[levelKey],
    };
  });
  return entries;
}

(async () => {
  const existingFacil = JSON.parse(fs.readFileSync(FILES.facil, 'utf8'));
  const output = {
    facil: { general: existingFacil.general },
    medio: {},
    dificil: {},
    nino: {},
  };

  const categories = ['general', 'geografia', 'ciencia', 'historia', 'cine', 'deporte', 'musica', 'ninos'];
  for (const levelKey of ['facil', 'medio', 'dificil', 'nino']) {
    if (!output[levelKey]) output[levelKey] = {};
    for (const categoryKey of categories) {
      if (levelKey === 'facil' && categoryKey === 'general') continue;
      process.stderr.write(`Generando ${levelKey}/${categoryKey}\n`);
      output[levelKey][categoryKey] = await buildBlock(categoryKey, levelKey);
    }
  }

  for (const levelKey of ['facil', 'medio', 'dificil', 'nino']) {
    const ordered = {};
    for (const key of categories) ordered[key] = output[levelKey][key];
    fs.writeFileSync(path.join(process.cwd(), FILES[levelKey]), JSON.stringify(ordered, null, 2) + '\n');
  }

  fs.writeFileSync(path.join(process.cwd(), 'questions', 'generation-limitations.json'), JSON.stringify({ limitations }, null, 2) + '\n');
})();
