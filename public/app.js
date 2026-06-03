/* ═══════════════════════════════════════════════════════════
   NEO — App Logic  v2
═══════════════════════════════════════════════════════════ */
'use strict';

// ─── State ────────────────────────────────────────────────
const S = {
  checkin: null,
  currentSubject: null,
  currentBlock: null,
  flowStep: 0,
  flowData: {},
  walkQuestions: [],
  walkIndex: 0,
  walkLacken: [],
  walkMode: null,   // 'cards' | 'free'
  chatHistory: [],
  uploadedFiles: [],
};

// ─── Store ────────────────────────────────────────────────
const store = {
  get: k  => { try { return JSON.parse(localStorage.getItem('neo_' + k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem('neo_' + k, JSON.stringify(v)),
  del: k  => localStorage.removeItem('neo_' + k),
};

function today() { return new Date().toISOString().slice(0, 10); }
function hour()  { return new Date().getHours(); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Whale Image ──────────────────────────────────────────
const WHALE_IMG_HTML = '<img src="/whale.png" class="whale-img" alt="Neo Wal"/>';

// ─── Motivations ──────────────────────────────────────────
const MOTIVATIONS = [
  "Du hast alle 4 schriftlichen Prüfungen bestanden — alleine, ohne Unterstützung, während andere sagten es wird nichts. Mündlich ist machbar.",
  "Diagnose mit 23. Nicht als Ausrede — als Erklärung. Und dann trotzdem weitergezogen. Das zählt.",
  "Ende 2024 im Krankenhaus. Heute hier. Jeden Tag. Das ist keine Kleinigkeit, Joel.",
  "IQ 128 und trotzdem wurde dir eingeredet, du schaffst das nicht. Die Prüfungsergebnisse haben geantwortet.",
  "ADHS heißt nicht, du kannst nicht fokussieren. Es heißt, du brauchst die richtige Struktur. Neo ist die Struktur.",
  "Perceive ist nicht irgendein YouTube-Kanal. Es ist deine Art zu zeigen, was in dir steckt.",
  "Osnabrück wartet. Oktober 2026. Cognitive Science. Das ist kein Traum mehr — das ist ein Datum.",
  "Der Speckstein-Wal auf deinem Schreibtisch ist von jemandem, der an dich glaubt. Sei auch du jemand, der an dich glaubt.",
];

const WHALE_FACTS = [
  'Wale schlafen mit einer Gehirnhälfte.',
  'Blauwale haben ein Herz so groß wie ein Auto.',
  'Buckelwale singen Lieder die sich jedes Jahr verändern.',
  'Der Speckstein-Wal ist Joels bester Schreibtisch-Begleiter.',
  'Pottwale können 90 Minuten tauchen.',
  'Dein Fokus-Fenster ist wie ein Walgesang — einmalig und zeitgebunden. Nutze es.',
  'Joel und der Wal: beide überleben in tiefen Gewässern.',
];

// ─── Fächer ───────────────────────────────────────────────
const SUBJECTS = {
  french: {
    id: 'french', emoji: '🇫🇷', name: 'Französisch',
    risk: 'danger', riskLabel: '⚠️ Risiko', color: '#e05555',
    blocks: [
      { id: 'f1', name: 'Subjonctif', status: 'open' },
      { id: 'f2', name: 'Conditionnel', status: 'open' },
      { id: 'f3', name: 'Imparfait & Passé composé', status: 'open' },
      { id: 'f4', name: 'Vocabulaire: Économie', status: 'open' },
      { id: 'f5', name: 'Vocabulaire: Société', status: 'open' },
      { id: 'f6', name: 'Civilisation française', status: 'open' },
      { id: 'f7', name: 'Analyse de texte', status: 'open' },
      { id: 'f8', name: 'Production écrite', status: 'open' },
    ],
  },
  history: {
    id: 'history', emoji: '📜', name: 'Geschichte',
    risk: 'warn', riskLabel: '~ Mittel', color: '#f0a050',
    blocks: [
      { id: 'h1', name: 'Weimarer Republik', status: 'open' },
      { id: 'h2', name: 'Nationalsozialismus & Machtübernahme', status: 'open' },
      { id: 'h3', name: 'Zweiter Weltkrieg', status: 'open' },
      { id: 'h4', name: 'Holocaust & Erinnerungskultur', status: 'open' },
      { id: 'h5', name: 'Nachkriegszeit & Teilung', status: 'open' },
      { id: 'h6', name: 'Kalter Krieg', status: 'open' },
      { id: 'h7', name: 'Deutsche Wiedervereinigung', status: 'open' },
      { id: 'h8', name: 'Europäische Integration', status: 'open' },
    ],
  },
  sowi: {
    id: 'sowi', emoji: '🏛️', name: 'SoWi',
    risk: 'ok', riskLabel: '✓ Stabil', color: '#56CCF2',
    blocks: [
      { id: 's1', name: 'Demokratie & Grundgesetz', status: 'open' },
      { id: 's2', name: 'Wirtschaftssystem BRD', status: 'open' },
      { id: 's3', name: 'Soziale Marktwirtschaft', status: 'open' },
      { id: 's4', name: 'Europäische Union', status: 'open' },
      { id: 's5', name: 'Internationale Politik', status: 'open' },
      { id: 's6', name: 'Sozialer Wandel & Migration', status: 'open' },
      { id: 's7', name: 'Medien & Öffentlichkeit', status: 'open' },
    ],
  },
  german: {
    id: 'german', emoji: '📖', name: 'Deutsch',
    risk: 'ok', riskLabel: '✓ Stabil', color: '#4ecb71',
    blocks: [
      { id: 'd1', name: 'Faust I (Goethe) — Analyse', status: 'open' },
      { id: 'd2', name: 'Gedichtanalyse & Epochen', status: 'open' },
      { id: 'd3', name: 'Erörterung schreiben', status: 'open' },
      { id: 'd4', name: 'Sprachgeschichte & Wandel', status: 'open' },
      { id: 'd5', name: 'Textanalyse Prosa', status: 'open' },
      { id: 'd6', name: 'Rhetorik & Argumentation', status: 'open' },
    ],
  },
};

// ─── Training ─────────────────────────────────────────────
const WORKOUT_PLAN = { 0: null, 1: 'upper-a', 2: null, 3: 'upper-b', 4: null, 5: 'shoulders', 6: null };
const WORKOUTS = {
  'upper-a': {
    name: 'Oberkörper A',
    exercises: [
      { name: 'Schrägbankdrücken', sets: '2×4-6', unit: 'KH', prevKg: 22 },
      { name: '1-Arm Pulldown (sitzend)', sets: '2×4-6', unit: 'Kabel', prevKg: 40 },
      { name: 'Rudern Breit', sets: '2×6-8', unit: 'Kabel', prevKg: 45 },
      { name: 'Seitheben', sets: '2×8-10', unit: 'Kabel', prevKg: 8 },
      { name: 'Facepulls', sets: '2×12-15', unit: 'Kabel', prevKg: 15 },
    ],
  },
  'upper-b': {
    name: 'Oberkörper B',
    exercises: [
      { name: 'Bankdrücken', sets: '2×4-6', unit: 'KH', prevKg: 26 },
      { name: 'Lat-Pulldown', sets: '2×4-6', unit: 'Kabel', prevKg: 55 },
      { name: 'Kabelrudern eng', sets: '2×6-8', unit: 'Kabel', prevKg: 50 },
      { name: 'Butterfly', sets: '2×8-10', unit: 'Maschine', prevKg: 35 },
      { name: 'Rear Delt Fly', sets: '2×12-15', unit: 'Kabel', prevKg: 7 },
    ],
  },
  'shoulders': {
    name: 'Schulter + Arme',
    exercises: [
      { name: 'Schulterdrücken', sets: '2×6-8', unit: 'KH', prevKg: 16 },
      { name: 'Seitheben', sets: '2×10-12', unit: 'KH', prevKg: 8 },
      { name: 'Bizepscurls', sets: '2×8-10', unit: 'KH', prevKg: 14 },
      { name: 'Trizeps Pushdown', sets: '2×10-12', unit: 'Kabel', prevKg: 20 },
      { name: 'Hammer Curls', sets: '2×10-12', unit: 'KH', prevKg: 14 },
    ],
  },
};

const GOALS = [
  { id: 'g1', text: 'Schriftliches Abi bestanden', done: true },
  { id: 'g2', text: 'Mündliches Abi bestehen', done: false },
  { id: 'g3', text: 'Perceive: erstes Video live', done: false },
  { id: 'g4', text: 'Gym: 3 Wochen Streak', done: false },
  { id: 'g5', text: 'Studienstart Oktober 2026 🎓', done: false },
];

// ═══════════════════════════════════════════════════════════
// BOOT SEQUENZ
// ═══════════════════════════════════════════════════════════
let bootParticleAnim = null;
let bgParticles      = null;

function checkBoot() {
  const bootedToday = store.get('booted_today');
  if (bootedToday === today()) {
    document.getElementById('screen-boot').classList.add('hidden');
    initStart();
    return;
  }
  runBootSequence();
}

async function runBootSequence() {
  const bootEl = document.getElementById('screen-boot');
  let skipped  = false;

  const skip = () => {
    if (skipped) return;
    skipped = true;
    endBoot();
  };
  bootEl.addEventListener('click', skip);
  document.addEventListener('keydown', skip, { once: true });

  // Phase 1: black (300ms)
  await sleep(300);
  if (skipped) return;

  // Phase 2: particles appear (1500ms)
  startBootParticles();
  await sleep(1500);
  if (skipped) return;

  // Phase 3: NEO text letter by letter
  const inner = document.getElementById('boot-inner');
  inner.classList.add('visible');
  await typeBootNEO();
  if (skipped) return;
  await sleep(200);

  // Phase 4: Subtitle typewriter
  await typeBootSub('Personal Intelligence System');
  if (skipped) return;
  await sleep(400);

  // Phase 5: Progress bar
  const pw = document.getElementById('boot-progress-wrap');
  const pb = document.getElementById('boot-progress-bar');
  pw.classList.add('visible');
  await sleep(50);
  pb.classList.add('full');
  await sleep(900);
  if (skipped) return;

  // Phase 6: Whale appears + blinks
  const ww = document.getElementById('boot-whale-wrap');
  const wi = document.getElementById('boot-whale-icon');
  wi.innerHTML = WHALE_IMG_HTML;
  ww.classList.add('visible');
  await sleep(400);
  await whaleBootBlink(wi);
  await sleep(600);
  if (skipped) return;

  // Phase 7: Fade out
  bootEl.classList.add('fadeout');
  await sleep(500);
  endBoot();
}

function endBoot() {
  store.set('booted_today', today());
  const bootEl = document.getElementById('screen-boot');
  bootEl.classList.add('hidden');
  stopBootParticles();
  startBgParticles();
  initStart();
}

async function typeBootNEO() {
  const el = document.getElementById('boot-neo-text');
  el.innerHTML = '';
  for (const ch of 'NEO') {
    const span = document.createElement('span');
    span.className = 'boot-letter';
    span.textContent = ch;
    el.appendChild(span);
    await sleep(20);
    span.classList.add('show');
    await sleep(180);
  }
}

async function typeBootSub(text) {
  const inner  = document.getElementById('boot-sub-inner');
  const cursor = document.getElementById('boot-sub-cursor');
  inner.textContent = '';
  cursor.style.display = 'inline-block';
  for (const ch of text) {
    inner.textContent += ch;
    await sleep(38);
  }
}

async function whaleBootBlink(container) {
  const img = container.querySelector('.whale-img');
  if (!img) return;
  img.classList.add('blink');
  await sleep(400);
  img.classList.remove('blink');
}

// ─── Particle System ──────────────────────────────────────
function startBootParticles() {
  const canvas  = document.getElementById('boot-canvas');
  const ctx     = canvas.getContext('2d');
  const W = canvas.width  = window.innerWidth;
  const H = canvas.height = window.innerHeight;

  const pts = Array.from({ length: 60 }, () => ({
    x: Math.random() * W,
    y: H + Math.random() * H,
    r: 0.5 + Math.random() * 2.5,
    speed: 0.4 + Math.random() * 1.2,
    opacity: 0.3 + Math.random() * 0.3,
  }));

  let running = true;

  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.y -= p.speed;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(86,204,242,${p.opacity})`;
      ctx.fill();
    }
    bootParticleAnim = requestAnimationFrame(draw);
  }
  draw();
  window._bootPts = { pts, W, H };
}

function stopBootParticles() {
  if (bootParticleAnim) cancelAnimationFrame(bootParticleAnim);
  const canvas = document.getElementById('boot-canvas');
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function startBgParticles() {
  const canvas = document.getElementById('boot-canvas');
  if (!canvas) return;
  canvas.style.position = 'fixed';
  canvas.style.inset     = '0';
  canvas.style.zIndex    = '0';
  canvas.style.pointerEvents = 'none';

  const W = canvas.width  = window.innerWidth;
  const H = canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const pts = Array.from({ length: 35 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.5 + Math.random() * 1.5,
    speed: 0.08 + Math.random() * 0.25,
    opacity: 0.02 + Math.random() * 0.04,
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.y -= p.speed;
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(86,204,242,${p.opacity})`;
      ctx.fill();
    }
    bgParticles = requestAnimationFrame(draw);
  }
  draw();
}

// ═══════════════════════════════════════════════════════════
// TYPEWRITER
// ═══════════════════════════════════════════════════════════
function typewrite(el, text, speed = 28, cb) {
  el.innerHTML = '';
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  el.appendChild(cursor);
  const t = setInterval(() => {
    if (i < text.length) {
      el.insertBefore(document.createTextNode(text[i++]), cursor);
    } else {
      clearInterval(t);
      cursor.remove();
      if (cb) cb();
    }
  }, speed);
  return t;
}

// ═══════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════
async function callNeo(messages, systemExtra = '', maxTokens = 900) {
  const sys = buildSystemPrompt() + (systemExtra ? '\n\n' + systemExtra : '');
  console.log('[Neo API] →', messages[messages.length - 1]?.content?.slice(0, 80));

  const r = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system: sys, max_tokens: maxTokens }),
  });

  if (!r.ok) {
    const err = await r.text();
    console.error('[Neo API] HTTP Error', r.status, err);
    throw new Error(`API ${r.status}: ${err.slice(0, 100)}`);
  }

  const d = await r.json();
  if (d.error) {
    console.error('[Neo API] Error response:', d.error);
    throw new Error(JSON.stringify(d.error));
  }

  const text = d.content?.[0]?.text || '';
  console.log('[Neo API] ← ', text.slice(0, 80));
  return text;
}

function buildSystemPrompt() {
  const ci = S.checkin || store.get('checkin_' + today()) || {};
  const h  = hour();
  const timeDesc = h < 12 ? 'Morgen' : h < 18 ? 'Nachmittag' : 'Abend';
  const focusScore = calcFocusScore(ci);
  const streak = store.get('streak') || 0;
  const uploaded = (store.get('uploads') || []).join(', ') || 'keine';

  return `Du bist Neo — Joels persönlicher Coach und Assistent.

JOEL:
24 Jahre, Stirpe bei Erwitte/NRW
ADHS (Medikinet 15mg, morgens)
IQ ~128 — versteht schnell, unterschätzt sich ständig
Diagnose erst vor 8 Monaten
Ende 2024 Krankenhaus — überwunden
Produktivste Zeit: nach Medikinet bis ca. 13 Uhr
HSV-Fan. Liebt Norwegen, Skandinavien, Groningen.
Hat einen Speckstein-Wal von seiner Freundin — liegt auf dem Schreibtisch.

AKTUELL:
Mündliches Abitur: 30.06–13.07.2026 (NRW)
Fächer: Französisch (⚠️ Risiko), Geschichte, SoWi, Deutsch
Startet Oktober 2026: Cognitive Science, Universität Osnabrück
Baut Perceive YouTube-Kanal (ADHS + Neurowissenschaften)
Gym: Comeback-Phase Woche 1 (6 Wochen Pause)
Kindergeld bis April 2027

NRW MÜNDLICHES ABITUR — ANFORDERUNGEN:
Darstellungsleistung: 25% der Note
Inhaltliche Leistung: 75% der Note
Wichtige Operatoren: analysieren, erläutern, beurteilen, Stellung nehmen, vergleichen, beschreiben
Bei "beurteilen/Stellung nehmen" MUSS Joel eigene Wertung liefern — nicht nur beschreiben
Prüfungsformat: Erstpräsentation + Prüfungsgespräch
Joel muss fließend sprechen, strukturieren, Fachbegriffe korrekt verwenden

JOELS LERNFLOW:
1. Systemlogik verstehen bis "Klick"
2. Feynman — alles weglegen, frei abrufen
3. Lücken identifizieren (nur echte Lücken)
4. Nur Lücken auf Karteikarten
5. Kompakter Lernzettel

WIE DU REDEST:
Direkt. Ehrlich. Kein Honig-ums-Maul.
Wie ein Freund der das Beste will — nicht wie ein Therapeut.
Wenn etwas nicht lief: kurz analysieren, dann sofort was JETZT?
Nie mehr als eine Frage auf einmal.
Kein unnötiges Lob — echtes Feedback.
Kurze Sätze. Kein Blabla.
Emojis sparsam: 💪 nach echtem Erfolg.
Du antwortest IMMER — kein leerer State, kein Schweigen.

WISSEN:
Huberman: Schlaf, Dopamin, Fokus, Morgenroutine, ADHS-Neurobiologie
Barkley: ADHS = Selbstregulationsproblem, externe Strukturen, Body Double
Paul Carter: Gym Comeback, Progressive Overload, Form vor Gewicht
James Clear: Habits, 2-Minuten-Regel, Streak-Psychologie
Cal Newport: Deep Work, Fokus-Blöcke, Ritualisierung

HOCHGELADENE UNTERLAGEN: ${uploaded}

JOELS DATEN (heute):
Ernährung: ${(() => { const n=store.get('nutrition_'+today())||{}; return Object.entries(n.meals||{}).map(([k,v])=>k+': '+(v.text||'—')).join(', ')||'nichts eingetragen'; })()}
Wasser: ${(() => { const n=store.get('nutrition_'+today())||{}; return (n.water||0)+'L'; })()}
Habits heute: ${(() => { const log=store.get('habits_log')||{}; const habits=store.get('habits_list')||[]; const done=habits.filter(h=>log[today()]?.[h.id]).map(h=>h.name); return done.length?done.join(', '):'keine'; })()}
Tasks heute: ${(() => { const t=store.get('tasks')||{}; const done=t.today?.filter(x=>x.done).length||0; const total=t.today?.length||0; return done+'/'+total+' erledigt'; })()}
Finanzen MRR: ${(() => { const f=store.get('finance')||{}; const mrr=(f.clients||[]).filter(c=>c.status==='active').length*29; return mrr+'€/Monat'; })()}

JOELS KONTEXT:
Kindergeld bis April 2027 — Ziel: 700€/Monat eigene Einnahmen
Baut Website-Kunden für monatliche Einnahmen (29€/Kunde)
Hab-Streak-Fokus: Gym, Medikinet, Lernen, Wasser
Wenn ein Habit 3+ Tage nicht gemacht wurde — sprich es an ohne zu predigen
Wenn heute wenig gegessen oder kein Frühstück — kommentiere kurz
Nutze diese Daten wenn relevant für das Gespräch

SESSION:
Tageszeit: ${timeDesc}
Uhrzeit: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
Datum: ${new Date().toLocaleDateString('de-DE')}
Schlaf: ${ci.sleep || '?'}h
Medikinet: ${ci.medikinet || '?'}
Gym heute: ${ci.gym || '?'}
Fokus-Score: ${focusScore}/100
Streak: ${streak} Tage`;
}

// ═══════════════════════════════════════════════════════════
// FOCUS SCORE / STREAK
// ═══════════════════════════════════════════════════════════
function calcFocusScore(ci = {}) {
  let s = 50;
  const sl = parseInt(ci.sleep) || 0;
  if (sl >= 8) s += 25; else if (sl >= 7) s += 18; else if (sl >= 6) s += 8;
  else if (sl >= 5) s -= 5; else if (sl > 0) s -= 15;
  if (ci.medikinet === 'now' || ci.medikinet === '1h') s += 20;
  else if (ci.medikinet === '2h') s += 12;
  else if (ci.medikinet === 'not-yet') s += 5;
  if (ci.gym === 'yes') s += 10;
  return Math.max(0, Math.min(100, s));
}

function getStreak() { return store.get('streak') || 0; }

// ═══════════════════════════════════════════════════════════
// START SCREEN
// ═══════════════════════════════════════════════════════════

function missionDay() {
  const startDate = store.get('mission_start') || today();
  const diff = Math.floor((Date.now() - new Date(startDate)) / 86400000);
  return Math.max(1, diff + 1);
}

function daysUntilAbi() {
  const abi = new Date('2026-06-30T00:00:00');
  return Math.max(0, Math.ceil((abi - Date.now()) / 86400000));
}

function updateTabTitle() {
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  document.title = `Neo · ${hh}:${mm}`;
}

function initStart() {
  const metaEl  = document.getElementById('start-meta');
  const greetEl = document.getElementById('start-greeting');
  const subEl   = document.getElementById('start-sub');
  const actEl   = document.getElementById('start-actions');
  if (!greetEl) return;

  updateTabTitle();
  setInterval(updateTabTitle, 60000);

  const h       = hour();
  const now     = new Date();
  const hhmm    = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  const todayCI = store.get('checkin_' + today());
  const hasCI   = !!todayCI;
  const score   = hasCI ? calcFocusScore(todayCI) : null;
  const gym     = todayCI?.gym;

  if (metaEl) metaEl.textContent = `— NEO · ${hhmm} · TAG ${missionDay()} DER MISSION`;

  let headline, tagline, primaryBtn, secondaryBtns;

  if (h >= 5 && h < 12) {
    headline    = 'Guten Morgen,\nJoel.';
    tagline     = hasCI
      ? (gym === 'yes' ? 'Training war gut heute.' : 'Dein Fenster öffnet sich.')
      : 'Dein Gehirn ist bereit.';
    primaryBtn  = hasCI
      ? { label: 'Lernen starten →',  fn: "enterMain('lernen')" }
      : { label: 'Check-in starten →', fn: 'startCheckin()' };
    secondaryBtns = hasCI
      ? [
          { label: '💬 Neo fragen →',     sub: 'Freier Chat',         fn: "enterMain('chat')" },
          { label: '📊 Übersicht →',      sub: 'Tagesstatus',         fn: "enterMain('uebersicht')" },
          { label: '💪 Training →',       sub: 'Workout-Plan',        fn: "enterMain('training')" },
        ]
      : [
          { label: 'Direkt loslegen →',   sub: 'Ohne Check-in',       fn: 'enterMain()' },
          { label: '💬 Neo fragen →',     sub: 'Freier Chat',         fn: "enterMain('chat')" },
        ];
  } else if (h >= 12 && h < 17) {
    if (!hasCI) {
      headline  = 'Joel. Du bist in\ndeiner Hochphase.';
      tagline   = 'Was läuft gerade?';
    } else {
      const einsch = score >= 70 ? 'Gutes Fenster — nutz es.'
                   : score >= 50 ? 'Solide. Fokussierte Blöcke.'
                   :               'Kleiner Tag — kleine Schritte.';
      headline  = `Fokus-Score: ${score}/100.`;
      tagline   = gym === 'yes' ? 'Training war gut heute.' : gym === 'no' ? `Gym fehlt noch. ${einsch}` : einsch;
    }
    primaryBtn  = { label: 'Lernen starten →', fn: "enterMain('lernen')" };
    secondaryBtns = [
      !hasCI ? { label: 'Check-in nachholen →', sub: '2 Minuten', fn: 'startCheckin()' } : null,
      { label: '💬 Neo fragen →',     sub: 'Freier Chat',   fn: "enterMain('chat')" },
      { label: '📊 Übersicht →',      sub: 'Tagesstatus',   fn: "enterMain('uebersicht')" },
      { label: '💪 Training →',       sub: 'Workout-Plan',  fn: "enterMain('training')" },
    ].filter(Boolean);
  } else {
    headline    = `${hhmm} Uhr, Joel.\n${daysUntilAbi()} Tage bis zum Abi.`;
    tagline     = 'Was hast du heute geleistet?';
    primaryBtn  = { label: 'Tag abschließen →', fn: "enterMain('uebersicht')" };
    secondaryBtns = [
      { label: '🧠 Noch lernen →',    sub: 'Lernmodus',     fn: "enterMain('lernen')" },
      { label: '💬 Neo fragen →',     sub: 'Freier Chat',   fn: "enterMain('chat')" },
    ];
  }

  setTimeout(() => {
    typewrite(greetEl, headline.replace('\n', '\n'), 42, () => {
      setTimeout(() => {
        typewrite(subEl, tagline, 30, () => renderStartActions(actEl, primaryBtn, secondaryBtns));
      }, 350);
    });
  }, 250);
}

function renderStartActions(el, primaryBtn, secondaryBtns) {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(14px)';
  el.style.transition = 'all 0.45s ease';

  const makeBtn = (b, primary) => `
    <button class="action-btn${primary ? ' primary' : ''}" onclick="${b.fn}">
      <div>
        <div class="ab-label">${b.label}</div>
        ${b.sub ? `<div style="font-size:0.76rem;color:var(--text-mute);margin-top:3px;font-family:'JetBrains Mono',monospace;letter-spacing:0.04em">${b.sub}</div>` : ''}
      </div>
      <span class="ab-arrow">›</span>
    </button>`;

  el.innerHTML = makeBtn(primaryBtn, true) + secondaryBtns.map(b => makeBtn(b, false)).join('');
  requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
}

// ═══════════════════════════════════════════════════════════
// CHECK-IN
// ═══════════════════════════════════════════════════════════
const CI_DATA = { sleep: null, medikinet: null, gym: null };

const CI_REACTIONS = {
  0: { 4:'4h. Hart. Erwartungen anpassen.', 5:'5h. Unter Soll. Fokus-Blöcke kürzer.', 6:'6h. Geht. Medikinet hilft heute mehr.', 7:'7h. Solide. Gehirn ist bereit.', 8:'Gut. 8h. Volles Programm heute.', 9:'Sehr gut. Optimal. Alles rausholn.' },
  1: { now:'Frisch. Wirkung in 30-45 Minuten.', '1h':'Gut. Du bist gerade im Peak-Fenster.', '2h':'Noch 1-2h Reserve.', 'not-yet':'Jetzt nehmen — dann sofort arbeiten.' },
  2: { yes:'💪 Stark. Dopamin oben. Perfekter Start.', later:'Okay. Geh noch. Nachmittag wird besser.', no:'Kein Gym. Macht nichts — Lernfokus.' },
};

function startCheckin() {
  document.getElementById('screen-start').classList.add('out');
  document.getElementById('screen-checkin').classList.remove('out');
}

function checkInAnswer(step, val, label) {
  document.querySelectorAll(`#ci-step-${step} .choice-btn`).forEach(b => b.classList.remove('selected'));
  event.target.classList.add('selected');
  const reactionEl = document.getElementById(`ci-react-${step}`);
  const nextBtn    = document.getElementById(`ci-next-${step}`);
  if (step === 0) { CI_DATA.sleep = label; reactionEl.textContent = CI_REACTIONS[0][label] || CI_REACTIONS[0][parseInt(label)] || ''; }
  else if (step === 1) { CI_DATA.medikinet = val; reactionEl.textContent = CI_REACTIONS[1][val] || ''; }
  else if (step === 2) { CI_DATA.gym = val; reactionEl.textContent = CI_REACTIONS[2][val] || ''; }
  if (nextBtn) nextBtn.style.display = 'inline-flex';
}

function nextCIStep(step) {
  document.querySelectorAll('.cp-dot').forEach((d, i) => { if (i <= step) d.classList.add('done'); });
  document.querySelectorAll('.checkin-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`ci-step-${step}`).classList.add('active');
}

async function generateAnalysis() {
  nextCIStep(3);
  const ci = {
    sleep: CI_DATA.sleep, medikinet: CI_DATA.medikinet, gym: CI_DATA.gym,
    date: today(), focusScore: calcFocusScore({ sleep: parseInt(CI_DATA.sleep), medikinet: CI_DATA.medikinet, gym: CI_DATA.gym }),
  };
  store.set('checkin_' + today(), ci);
  S.checkin = ci;
  if (!store.get('mission_start')) store.set('mission_start', today());

  const el = document.getElementById('ci-analysis');
  try {
    const msg = `Erstelle eine kurze persönliche Morgen-Analyse für Joel.
Check-in: Schlaf ${ci.sleep}h, Medikinet ${ci.medikinet}, Gym ${ci.gym}, Fokus-Score ${ci.focusScore}/100.
3-5 Sätze. Direkt, persönlich. Fange NICHT mit "Okay" an.
Gib eine konkrete Einschätzung und einen klaren ersten Schritt.`;
    el.innerHTML = '';
    el.textContent = await callNeo([{ role: 'user', content: msg }], '', 400);
  } catch (e) {
    el.textContent = `Fokus-Score: ${ci.focusScore}/100. Starte mit dem wichtigsten Block zuerst.`;
    console.error('[Check-in Analysis]', e);
  }

  const motiv = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
  document.getElementById('ci-motivation').style.display = 'block';
  document.getElementById('ci-motivation-text').textContent = motiv;
  updateStreak();
}

function updateStreak() {
  const lastDay = store.get('streak_date');
  const streak  = store.get('streak') || 0;
  const t = today();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  if (lastDay === t) return;
  store.set('streak', lastDay === yStr ? streak + 1 : 1);
  store.set('streak_date', t);
  updateStatusBar();
}

// ═══════════════════════════════════════════════════════════
// MAIN / COMMAND CENTER
// ═══════════════════════════════════════════════════════════
function enterMain(section = 'lernen') {
  document.getElementById('screen-checkin').classList.add('out');
  document.getElementById('screen-start').classList.add('out');
  document.getElementById('screen-main').classList.remove('out');
  injectWhale();
  initSubjects();
  renderWeekGrid();
  renderOverview();
  renderGoals();
  loadUploads();
  updateStatusBar();
  showSection(section);
  initNeoSidebar();
  checkEvening();
}

function injectWhale() {
  // img tags already in HTML — nothing to inject
}

function updateStatusBar() {
  const ci = S.checkin || store.get('checkin_' + today()) || {};
  const score = calcFocusScore(ci);
  const meds = { now:'Frisch (~40min)', '1h':'Peak-Fenster', '2h':'Nachlassend', 'not-yet':'Noch nicht' };
  const el = id => document.getElementById(id);
  if (el('status-focus'))  el('status-focus').textContent  = score + '/100';
  if (el('status-medi'))   el('status-medi').textContent   = meds[ci.medikinet] || '—';
  if (el('status-streak')) el('status-streak').textContent = (store.get('streak') || 0) + ' Tage 🔥';
}

function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const sec = document.getElementById('section-' + name);
  const nav = document.querySelector(`[data-sec="${name}"]`);
  if (sec) sec.classList.add('active');
  if (nav) nav.classList.add('active');
  if (name === 'uebersicht')    renderOverview();
  if (name === 'training')      renderWeekGrid();
  if (name === 'einstellungen') { renderNotesList(); renderGCalSettings(); }
  if (name === 'ernaehrung')    renderNutrition();
  if (name === 'finanzen')      renderFinanzen();
  if (name === 'habits')        renderHabits();
  if (name === 'tasks')         renderTasks();
}

// ─── Neo Sidebar ──────────────────────────────────────────
function initNeoSidebar() {
  const ci = S.checkin || store.get('checkin_' + today()) || {};
  const h  = hour();
  let msg;
  if (h < 12 && !ci.date) msg = 'Guten Morgen, Joel. Check-in fehlt — aber du bist hier. Fang an.';
  else if (h < 12)         msg = `Fokus-Score: ${calcFocusScore(ci)}/100. Gutes Fenster für Deep Work jetzt.`;
  else if (h < 18)         msg = 'Nachmittagsloch kommt — bleib trotzdem dran. Was als nächstes?';
  else                     msg = 'Abend, Joel. Was lief heute? Tag abschließen nicht vergessen.';
  addNeoMsg(msg);
}

function addNeoMsg(text, isUser = false) {
  const area = document.getElementById('neo-messages');
  if (!area) return;
  const div = document.createElement('div');
  div.className = isUser ? 'user-msg' : 'neo-msg';
  div.textContent = text;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
  return div;
}

async function sendNeoQuick() {
  const input = document.getElementById('neo-quick-input');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';
  addNeoMsg(text, true);
  const el = addNeoMsg('…');
  try {
    const resp = await callNeo([{ role: 'user', content: text }], 'Antworte kurz — max 3 Sätze. Du bist in der Sidebar.', 250);
    el.textContent = resp;
  } catch (e) {
    el.textContent = `Verbindungsfehler: ${e.message}`;
  }
  document.getElementById('neo-messages').scrollTop = 9999;
}

function neoQuickKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNeoQuick(); }
}

// ═══════════════════════════════════════════════════════════
// LERNEN — Neues System
// ═══════════════════════════════════════════════════════════
const STATUS_ICONS  = { open:'⬜', progress:'🟡', done:'✅', review:'🔄' };
const STATUS_LABELS = { open:'Offen', progress:'In Bearbeitung', done:'Verstanden', review:'Wiederholen' };
const STATUS_CLS    = { open:'bt-status-open', progress:'bt-status-progress', done:'bt-status-done', review:'bt-status-review' };
const PHASE_LABELS  = ['E','A','L','K','Z'];
const PHASE_NAMES   = ['Erklärung','Abruf','Lücken','Karteikarten','Lernzettel'];
let lernFilter = { fach: 'all', status: 'all' };

function initSubjects() {
  renderSubjectProgressCards();
  renderLernTable();
  renderTagesEmpfehlung();
  checkThemenVorgaben();
  showLernView('table');
}

function showLernView(view) {
  ['lernen-table','abitur-check-view'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const isTable = view === 'table';
  ['lernen-filters','subject-progress-cards','gesamtfortschritt','tages-empfehlung','themen-check-banner'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isTable ? (el.dataset.hidden ? 'none' : '') : 'none';
  });
  const target = view === 'table' ? 'lernen-table' : 'abitur-check-view';
  const el = document.getElementById(target);
  if (el) el.style.display = '';
}

function backToTable()    { showLernView('table'); renderSubjectProgressCards(); renderLernTable(); }
function backToSubjects() { backToTable(); }
function backToDetail()   { backToTable(); }

// ─── Tages-Empfehlung (keine API) ─────────────────────────
function renderTagesEmpfehlung() {
  const el = document.getElementById('tages-empfehlung');
  if (!el) return;
  const saved = store.get('subjects') || {};
  const sessions = store.get('block_sessions') || {};
  // Priorität: FR > GE > SW > DE, dann nach offenen Blöcken
  const PRIO_ORDER = ['french','history','sowi','deutsch'];
  let rec = null, recReason = '';
  for (const subjId of PRIO_ORDER) {
    const subj   = SUBJECTS[subjId];
    const blocks = saved[subjId]?.blocks || subj.blocks;
    const open   = blocks.filter(b => (b.status||'open') !== 'done');
    if (open.length === 0) continue;
    // Bevorzuge Block der zuletzt bearbeitet wurde (Kontinuität) oder ersten offenen
    const lastTouched = open.find(b => sessions[subjId+'_'+b.id]?.lastDate === today());
    const target = lastTouched || open[0];
    rec = { subj, block: target, openCount: open.length };
    recReason = subjId === 'french'
      ? `Höchstes Risiko · ${daysUntilAbi()} Tage verbleibend`
      : `${open.length} offene Blöcke · ${daysUntilAbi()} Tage verbleibend`;
    break;
  }
  if (!rec) { el.style.display = 'none'; return; }
  // Second rec
  let secondary = '';
  for (const subjId of PRIO_ORDER) {
    if (subjId === Object.keys(SUBJECTS).find(id => SUBJECTS[id] === rec.subj)) continue;
    const blocks = saved[subjId]?.blocks || SUBJECTS[subjId].blocks;
    const open   = blocks.filter(b => (b.status||'open') !== 'done');
    if (open.length > 0) {
      secondary = `Danach: ${SUBJECTS[subjId].emoji} ${SUBJECTS[subjId].name} — ${open[0].name}`;
      break;
    }
  }
  el.style.display = '';
  el.innerHTML = `
    <div class="rec-card-label">// NEO EMPFIEHLT HEUTE</div>
    <div class="rec-primary">
      ${rec.subj.emoji} ${rec.subj.name} — <strong>${escHtml(rec.block.name)}</strong>
    </div>
    <div class="rec-reason">${recReason}</div>
    ${secondary ? `<div class="rec-secondary">${secondary}</div>` : ''}`;
}

// ─── Lernablauf Info ───────────────────────────────────────
function toggleLernablauf() {
  const card = document.getElementById('lernablauf-card');
  if (card) card.style.display = card.style.display === 'none' ? '' : 'none';
}

// ─── Themenvorgaben-Check (einmalig) ──────────────────────
function checkThemenVorgaben() {
  if (store.get('themen_check_done')) return;
  const uploads = store.get('uploads') || [];
  const banner  = document.getElementById('themen-check-banner');
  if (!banner) return;
  if (uploads.length === 0) {
    banner.style.display = '';
    banner.innerHTML = `<div style="display:flex;align-items:center;gap:12px">
      <span style="font-size:1.2rem">📋</span>
      <div>
        <div style="font-weight:600;font-size:0.88rem">Themenvorgaben hochladen?</div>
        <div style="font-size:0.78rem;color:var(--text-mute);margin-top:2px">
          Lade deine offiziellen NRW Abitur-Themenvorgaben hoch (PDF/MD) → Neo prüft ob alle Themen als Block abgedeckt sind.
        </div>
      </div>
      <button class="btn btn-sm" onclick="showSection('einstellungen')" style="flex-shrink:0">Hochladen →</button>
      <button class="btn-ghost btn-sm" onclick="dismissThemenCheck()" style="color:var(--text-mute);background:none;border:none;cursor:pointer;flex-shrink:0">✕</button>
    </div>`;
  } else {
    banner.style.display = '';
    banner.innerHTML = `<div style="display:flex;align-items:center;gap:12px">
      <span style="font-size:1.2rem">📋</span>
      <div style="flex:1">
        <div style="font-weight:600;font-size:0.88rem">Blöcke mit Themenvorgaben abgleichen?</div>
        <div style="font-size:0.78rem;color:var(--text-mute);margin-top:2px">${uploads.length} Datei(en) vorhanden — Neo prüft ob alle Themen abgedeckt sind.</div>
      </div>
      <button class="btn btn-sm" onclick="runThemenCheck()" style="flex-shrink:0">Prüfen →</button>
      <button style="background:none;border:none;color:var(--text-mute);cursor:pointer;flex-shrink:0" onclick="dismissThemenCheck()">✕</button>
    </div>`;
  }
}
function dismissThemenCheck() {
  store.set('themen_check_done', true);
  const banner = document.getElementById('themen-check-banner');
  if (banner) banner.style.display = 'none';
}
async function runThemenCheck() {
  const banner = document.getElementById('themen-check-banner');
  banner.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div> Analysiere Themenvorgaben…';
  const uploads = store.get('uploads') || [];
  const saved   = store.get('subjects') || {};
  const allBlocks = Object.entries(SUBJECTS).flatMap(([id, subj]) =>
    (saved[id]?.blocks || subj.blocks).map(b => b.name)
  ).join(', ');
  const msg = `Joel hat folgende Dateien hochgeladen: ${uploads.join(', ')}.
Diese Blöcke sind bereits in Neo: ${allBlocks}.
Falls du Informationen aus den Dateinamen ableiten kannst:
Welche Themen aus dem NRW Abitur ${new Date().getFullYear()} könnten noch als Block fehlen?
Liste maximal 5 konkrete fehlende Themen auf. Falls du es nicht beurteilen kannst, sag das direkt.`;
  try {
    const text = await callNeo([{role:'user',content:msg}],'',400);
    store.set('themen_check_done', true);
    banner.innerHTML = `<div><div style="font-weight:600;margin-bottom:6px">📋 Analyse:</div>
      <div style="font-size:0.85rem;color:var(--text-dim);white-space:pre-line">${escHtml(text)}</div>
      <button style="background:none;border:none;color:var(--text-mute);cursor:pointer;font-size:0.78rem;margin-top:8px" onclick="this.closest('[id]').style.display='none'">Schließen</button>
    </div>`;
  } catch(e) {
    banner.innerHTML = `Fehler: ${e.message}`;
  }
}

function setLernFilter(type, val) {
  lernFilter[type] = val;
  document.querySelectorAll('[data-lf^="' + type + '-"]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lf === type + '-' + val);
  });
  renderLernTable();
}

function getAllBlocks() {
  const saved = store.get('subjects') || {};
  const result = [];
  for (const [id, subj] of Object.entries(SUBJECTS)) {
    const blocks = saved[id]?.blocks || subj.blocks;
    blocks.forEach(b => result.push({ ...b, subjId: id, subjName: subj.name, subjEmoji: subj.emoji, subjColor: subj.color }));
  }
  return result;
}

function renderSubjectProgressCards() {
  const cardsEl  = document.getElementById('subject-progress-cards');
  const gesamtEl = document.getElementById('gesamtfortschritt');
  if (!cardsEl) return;
  const saved = store.get('subjects') || {};
  let totalDone = 0, totalAll = 0;
  cardsEl.innerHTML = Object.entries(SUBJECTS).map(([id, subj]) => {
    const blocks   = saved[id]?.blocks || subj.blocks;
    const done     = blocks.filter(b => b.status === 'done').length;
    const progress = blocks.filter(b => b.status === 'progress').length;
    const review   = blocks.filter(b => b.status === 'review').length;
    const gaps     = (store.get('learning_gaps') || {})[id] || {};
    const gapCount = Object.values(gaps).flat().length;
    const pct      = blocks.length ? Math.round(done / blocks.length * 100) : 0;
    totalDone += done; totalAll += blocks.length;
    const isActive = lernFilter.fach === id;
    return `<div class="subj-prog-card${isActive ? ' active-filter' : ''}" onclick="setLernFilter('fach','${id}')">
      <div class="subj-prog-name">${subj.emoji} ${subj.name}</div>
      <div class="progress-bar-bg" style="height:5px;margin:6px 0">
        <div class="progress-bar-fill" style="width:${pct}%;background:${subj.color}"></div>
      </div>
      <div class="subj-prog-counts">${done}/${blocks.length} verstanden · ${progress} aktiv · ${review} wdh.</div>
      ${gapCount > 0 ? `<div class="subj-prog-gaps">⚠️ ${gapCount} offene Lücken</div>` : ''}
    </div>`;
  }).join('');
  if (gesamtEl) {
    const pct = totalAll ? Math.round(totalDone / totalAll * 100) : 0;
    gesamtEl.innerHTML = `<span style="white-space:nowrap">${totalDone}/${totalAll} Blöcke</span>
      <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      <span style="color:var(--cyan)">${pct}%</span>`;
  }
}

function renderLernTable() {
  const el = document.getElementById('lernen-table');
  if (!el) return;
  const saved    = store.get('subjects') || {};
  const sessions = store.get('block_sessions') || {};
  const gaps     = store.get('learning_gaps') || {};
  const subjsToShow = lernFilter.fach === 'all' ? Object.keys(SUBJECTS) : [lernFilter.fach];
  let html = '';
  for (const subjId of subjsToShow) {
    const subj      = SUBJECTS[subjId];
    if (!subj) continue;
    const allBlocks = saved[subjId]?.blocks || subj.blocks;
    const blocks    = allBlocks.filter(b => lernFilter.status === 'all' || (b.status || 'open') === lernFilter.status);
    if (!blocks.length && lernFilter.status !== 'all') continue;
    const doneCount = allBlocks.filter(b => b.status === 'done').length;
    html += `<div class="bt-subj-header" style="color:${subj.color}">
      ${subj.emoji} ${subj.name.toUpperCase()} — ${doneCount}/${allBlocks.length} verstanden
      <button class="bt-add-block" onclick="addNewBlock('${subjId}')">+ Block</button>
    </div>
    <table class="block-table">
      <thead><tr><th>Block</th><th>Status</th><th>Phasen</th><th>Lücken</th><th>Zuletzt</th></tr></thead>
      <tbody>`;
    for (const b of blocks) {
      const sessKey   = subjId + '_' + b.id;
      const sess      = sessions[sessKey] || {};
      const bGaps     = gaps[subjId]?.[b.id] || [];
      const phases    = sess.phases || {};
      const phaseDone = Object.values(phases).filter(Boolean).length;
      const dateStr   = sess.lastDate ? sess.lastDate.slice(5).replace('-', '.') : '—';
      const statusCls = STATUS_CLS[b.status || 'open'] || 'bt-status-open';
      // Quality badge
      const quality   = !sess.lastDate ? '❓' : phaseDone >= 5 ? '⭐' : bGaps.length > 2 ? '⚠️' : '';
      html += `
      <tr class="block-row" id="row-${sessKey}" onclick="toggleBlockExpand('${b.id}','${subjId}')">
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="bt-name" id="bname-${sessKey}"
              ondblclick="event.stopPropagation();startEditBlockName('${subjId}','${b.id}','${sessKey}')"
              title="Klick = aufklappen · Doppelklick = umbenennen">${escHtml(b.name)}</div>
            <span class="block-quality">${quality}</span>
            <span class="bt-edit-icon"
              onclick="event.stopPropagation();startEditBlockName('${subjId}','${b.id}','${sessKey}')"
              style="color:var(--text-mute);cursor:pointer;font-size:0.78rem;opacity:0.5">🖊️</span>
          </div>
          ${b.topics ? `<div class="bt-topics">${escHtml(b.topics)}</div>` : ''}
        </td>
        <td>
          <span class="bt-status-badge ${statusCls}"
            onclick="event.stopPropagation();cycleBlockStatus('${subjId}','${b.id}')">
            ${STATUS_ICONS[b.status || 'open']} ${STATUS_LABELS[b.status || 'open']}
          </span>
        </td>
        <td>
          <div class="bt-phases">
            ${PHASE_LABELS.map((p, i) => `<div class="bt-phase${phases[i] ? ' done' : ''}">${p}</div>`).join('')}
          </div>
        </td>
        <td class="bt-gaps">${bGaps.filter(g=>!g.learned).length > 0 ? bGaps.filter(g=>!g.learned).length + ' ⚠️' : '—'}</td>
        <td class="bt-date">${dateStr}</td>
      </tr>
      <tr class="block-expand-row" id="expand-${sessKey}">
        <td class="block-expand-td" colspan="5">
          <div class="block-expand-content" id="expand-content-${sessKey}"></div>
        </td>
      </tr>`;
    }
    html += '</tbody></table>';
  }
  el.innerHTML = html || '<div style="color:var(--text-mute);padding:20px;text-align:center">Keine Blöcke gefunden.</div>';
  console.log('[LernTable] Gerendert:', html.length > 0 ? 'OK' : 'LEER');
}

// ─── Block Expand/Collapse ─────────────────────────────────
function toggleBlockExpand(blockId, subjId) {
  const sessKey   = subjId + '_' + blockId;
  const expandRow = document.getElementById('expand-' + sessKey);
  const blockRow  = document.getElementById('row-' + sessKey);
  if (!expandRow) { console.warn('[Block] Expand-Row nicht gefunden:', sessKey); return; }
  console.log('[Block] Toggle:', blockId, subjId);
  const isOpen = expandRow.classList.contains('open');
  // Alle anderen schließen
  document.querySelectorAll('.block-expand-row.open').forEach(r => r.classList.remove('open'));
  document.querySelectorAll('.block-row.expanded').forEach(r => r.classList.remove('expanded'));
  if (!isOpen) {
    expandRow.classList.add('open');
    blockRow?.classList.add('expanded');
    renderBlockExpand(blockId, subjId, sessKey);
    // Session lastDate aktualisieren
    const sessions = store.get('block_sessions') || {};
    if (!sessions[sessKey]) sessions[sessKey] = {};
    sessions[sessKey].lastDate = today();
    store.set('block_sessions', sessions);
  }
}

function renderBlockExpand(blockId, subjId, sessKey) {
  const el = document.getElementById('expand-content-' + sessKey);
  if (!el) return;
  const sessions = store.get('block_sessions') || {};
  const sess     = sessions[sessKey] || {};
  const phases   = sess.phases || {};
  const allGaps  = (store.get('learning_gaps') || {})[subjId]?.[blockId] || [];
  const phaseDescs = [
    'In Claude-Projekt erklären lassen bis es „Klick" macht',
    'Alles weglegen — laut oder schriftlich alles sagen was du weißt (Feynman)',
    'Was war unsicher oder falsch? Hier als Lücken eintragen',
    'Nur für echte Lücken — in Claude oder StudySmarter erstellen',
    'Kompakter Spickzettel — in Claude erstellen lassen',
  ];

  el.innerHTML = `
    <div>
      <div class="stats-title" style="margin-bottom:10px">// PHASEN</div>
      <div class="phase-list">
        ${PHASE_NAMES.map((name, i) => `
          <div class="phase-item">
            <div class="phase-cb${phases[i] ? ' done' : ''}" onclick="togglePhase('${subjId}','${blockId}',${i})">${phases[i] ? '✓' : ''}</div>
            <div>
              <div class="phase-info-title">[${PHASE_LABELS[i]}] ${name}</div>
              <div class="phase-info-desc">${phaseDescs[i]}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>
    <div>
      <div class="stats-title" style="margin-bottom:10px">// LÜCKEN
        <span style="font-size:0.72rem;color:var(--text-mute);font-weight:400;margin-left:8px">
          ${allGaps.filter(g=>!g.learned).length} offen · ${allGaps.filter(g=>g.learned).length} gelernt
        </span>
      </div>
      <div class="gap-list" id="gap-list-${sessKey}">
        ${allGaps.length === 0
          ? '<div style="color:var(--text-mute);font-size:0.82rem">Noch keine Lücken — super oder noch nicht gelernt.</div>'
          : allGaps.map((g, i) => `
            <div class="gap-item${g.learned ? ' learned' : ''}">
              <span class="gap-text">${escHtml(typeof g === 'string' ? g : g.text)}</span>
              ${!g.learned ? `<button class="gap-learned-btn" onclick="markGapLearned('${subjId}','${blockId}',${i})">✓ Kann ich</button>` : '<span style="color:var(--green);font-size:0.72rem">✓ Gelernt</span>'}
              <button class="gap-del-btn" onclick="deleteGap('${subjId}','${blockId}',${i})">✕</button>
            </div>`).join('')}
      </div>
      <div class="gap-add-row">
        <input class="ex-note" id="gap-input-${sessKey}" style="flex:1" placeholder="Lücke eintragen (z.B. Subjonctif unregelmäßige Verben)…"/>
        <button class="btn btn-sm" onclick="addGap('${subjId}','${blockId}')">+ Lücke</button>
      </div>
      <div style="margin-top:10px;font-size:0.78rem;color:var(--text-mute)">
        Zuletzt: ${sess.lastDate || 'noch nicht'}
      </div>
    </div>`;
}

function togglePhase(subjId, blockId, phaseIdx) {
  const sessKey  = subjId + '_' + blockId;
  const sessions = store.get('block_sessions') || {};
  if (!sessions[sessKey]) sessions[sessKey] = {};
  if (!sessions[sessKey].phases) sessions[sessKey].phases = {};
  sessions[sessKey].phases[phaseIdx] = !sessions[sessKey].phases[phaseIdx];

  // Auto-Status: alle 5 Phasen = done
  const phases = sessions[sessKey].phases;
  const allDone = [0,1,2,3,4].every(i => phases[i]);
  if (allDone) {
    const saved = store.get('subjects') || {};
    const subj  = SUBJECTS[subjId];
    if (!saved[subjId]) saved[subjId] = { blocks: [...subj.blocks] };
    const block = saved[subjId].blocks.find(b => b.id === blockId);
    if (block && block.status !== 'done') {
      block.status = 'done';
      store.set('subjects', saved);
      triggerWhaleEvent('done');
      addNeoMsg(`"${block.name}" — alle Phasen abgehakt. Automatisch auf ✅ gesetzt. 💪`);
    }
  }
  store.set('block_sessions', sessions);
  // Checkbox in-place updaten
  renderBlockExpand(blockId, subjId, sessKey);
  renderSubjectProgressCards();
  // Phasen-Dots in Tabellenzeile updaten
  const phaseDots = document.querySelector(`#row-${sessKey} .bt-phases`);
  if (phaseDots) {
    phaseDots.innerHTML = PHASE_LABELS.map((p, i) =>
      `<div class="bt-phase${sessions[sessKey].phases[i] ? ' done' : ''}">${p}</div>`
    ).join('');
  }
}

function addGap(subjId, blockId) {
  const sessKey = subjId + '_' + blockId;
  const input   = document.getElementById('gap-input-' + sessKey);
  const text    = input?.value?.trim();
  if (!text) return;
  const all = store.get('learning_gaps') || {};
  if (!all[subjId]) all[subjId] = {};
  if (!all[subjId][blockId]) all[subjId][blockId] = [];
  all[subjId][blockId].push({ text, learned: false });
  store.set('learning_gaps', all);
  input.value = '';
  renderBlockExpand(blockId, subjId, sessKey);
  renderSubjectProgressCards();
}

function markGapLearned(subjId, blockId, idx) {
  const all = store.get('learning_gaps') || {};
  if (all[subjId]?.[blockId]?.[idx]) {
    all[subjId][blockId][idx].learned = true;
    store.set('learning_gaps', all);
    renderBlockExpand(blockId, subjId, subjId + '_' + blockId);
    renderSubjectProgressCards();
  }
}

function deleteGap(subjId, blockId, idx) {
  const all = store.get('learning_gaps') || {};
  all[subjId]?.[blockId]?.splice(idx, 1);
  store.set('learning_gaps', all);
  renderBlockExpand(blockId, subjId, subjId + '_' + blockId);
  renderSubjectProgressCards();
}

// ─── Block-Name Inline-Editing ────────────────────────────
function startEditBlockName(subjId, blockId, sessKey) {
  const el = document.getElementById('bname-' + sessKey);
  if (!el || el.querySelector('input')) return; // already editing
  const current = el.textContent.trim();
  el.innerHTML = `<input class="ex-note" id="bname-input-${sessKey}"
    value="${escHtml(current)}" style="font-weight:600;width:200px"
    onblur="saveBlockName('${subjId}','${blockId}','${sessKey}',this.value)"
    onkeydown="if(event.key==='Enter')this.blur();if(event.key==='Escape')cancelEditBlockName('${sessKey}','${escHtml(current)}')"/>`;
  const input = document.getElementById('bname-input-' + sessKey);
  input?.focus(); input?.select();
}

function saveBlockName(subjId, blockId, sessKey, newName) {
  const name = newName.trim();
  if (!name) { cancelEditBlockName(sessKey, ''); return; }
  const saved = store.get('subjects') || {};
  const subj  = SUBJECTS[subjId];
  if (!saved[subjId]) saved[subjId] = { blocks: [...subj.blocks] };
  const block = saved[subjId].blocks.find(b => b.id === blockId);
  if (block) { block.name = name; store.set('subjects', saved); }
  const el = document.getElementById('bname-' + sessKey);
  if (el) {
    el.innerHTML = escHtml(name);
    // "Umbenannt ✓" Feedback
    el.style.color = 'var(--green)';
    setTimeout(() => { el.style.color = ''; }, 1500);
  }
  renderSubjectProgressCards();
}

function cancelEditBlockName(sessKey, original) {
  const el = document.getElementById('bname-' + sessKey);
  if (el) el.innerHTML = escHtml(original);
}

function cycleBlockStatus(subjId, blockId) {
  const saved = store.get('subjects') || {};
  const subj  = SUBJECTS[subjId];
  if (!saved[subjId]) saved[subjId] = { blocks: [...subj.blocks] };
  const block = saved[subjId].blocks.find(b => b.id === blockId);
  if (!block) return;
  const statuses = ['open', 'progress', 'done', 'review'];
  block.status = statuses[(statuses.indexOf(block.status || 'open') + 1) % statuses.length];
  store.set('subjects', saved);
  renderSubjectProgressCards();
  renderLernTable();
}

function addNewBlock(subjId) {
  const name = prompt('Block-Name:');
  if (!name?.trim()) return;
  const topics = prompt('Themen (komma-getrennt, optional):') || '';
  const saved  = store.get('subjects') || {};
  const subj   = SUBJECTS[subjId];
  if (!saved[subjId]) saved[subjId] = { blocks: [...subj.blocks] };
  saved[subjId].blocks.push({ id: 'b' + Date.now(), name: name.trim(), topics, status: 'open' });
  store.set('subjects', saved);
  renderSubjectProgressCards();
  renderLernTable();
}

// Legacy stub (flow entfernt — Neo ist Tracker)
function openBlock(blockId, subjId) { toggleBlockExpand(blockId, subjId); }

function showFlowChoice(startStep) {
  const content = document.getElementById('flow-content');
  const textEl  = document.getElementById('flow-text');
  const ctrl    = document.getElementById('flow-controls');
  updateFlowSteps(-1);
  textEl.textContent = `"${S.currentBlock.name}" — wie willst du starten?`;
  content.style.display = 'block';
  const continueBtn = startStep != null
    ? `<button class="btn btn-primary btn-lg" onclick="startFlowStep(${startStep})">
        ▶ Weitermachen ab Phase ${startStep+1} (${PHASE_NAMES[startStep]||''})
       </button>` : '';
  ctrl.innerHTML = `
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      ${continueBtn}
      <button class="btn ${startStep == null ? 'btn-primary' : ''} btn-lg" onclick="startFlowStep(0)">
        📖 Erkläre mir das Thema
      </button>
      <button class="btn btn-lg" onclick="startFlowStep(1)">
        🧠 Direkt abrufen
      </button>
    </div>
    <div style="margin-top:12px;font-family:'JetBrains Mono',monospace;font-size:0.78rem;color:var(--text-mute)">
      Nicht sicher → Erklären wählen.
    </div>`;
}

function updateFlowSteps(active) {
  document.querySelectorAll('.flow-step').forEach((el, i) => {
    el.className = 'flow-step' + (i < active ? ' done' : i === active ? ' active' : '');
  });
}

async function startFlowStep(step) {
  S.flowStep = step;
  updateFlowSteps(step);
  const content = document.getElementById('flow-content');
  const textEl  = document.getElementById('flow-text');
  const ctrl    = document.getElementById('flow-controls');
  content.style.display = 'block';
  textEl.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  ctrl.innerHTML   = '';

  const subj  = SUBJECTS[S.currentSubject];
  const block = S.currentBlock;

  // ── STEP 0: Erklärung ──────────────────────────────────
  if (step === 0) {
    const msg = `Erkläre Joel das Thema "${block.name}" aus ${subj.name} (mündliches Abitur NRW).

JOELS LERNSTIL — halte dich genau daran:
• Systemlogik ZUERST: Warum existiert das? Was ist der Kern-Mechanismus?
• Warum vor Was
• Stichpunkte und kurze klare Sätze — KEIN Fließtext
• Pfeile (→) und Hierarchien für Zusammenhänge
• Konkrete Beispiele die Joel kennt (Deutschland, Alltagsbezug)
• Max 300 Wörter
• Ende mit: "Klick da — oder willst du noch etwas vertiefen?"`;

    let text = '';
    try {
      text = await callNeo([{ role: 'user', content: msg }], '', 800);
      textEl.textContent = text;
    } catch (e) {
      text = `Verbindungsfehler: ${e.message}`;
      textEl.textContent = text;
    }
    S.flowData.explanation = text;

    ctrl.innerHTML = `
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="startFlowStep(1)">Verstanden — Zum Abruf →</button>
        <button class="btn" onclick="deepenExplanation()">Noch eine Frage</button>
        <button class="btn btn-ghost" onclick="saveBlockStatus('progress')">Als "In Bearbeitung" markieren</button>
      </div>`;

  // ── STEP 1: Abruf (Feynman) ────────────────────────────
  } else if (step === 1) {
    textEl.innerHTML = '';
    textEl.textContent = `Leg alles weg.\n\nErkläre mir "${block.name}" als wärst du der Lehrer — einfach alles was kommt. Kein Nachschauen.`;
    ctrl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <textarea class="flow-input" id="recall-input" placeholder="Schreib alles raus was du weißt…" rows="7"></textarea>
        <button class="btn btn-primary" onclick="analyzeRecall()">Analyse starten →</button>
      </div>`;

  // ── STEP 2: Lücken-Analyse ─────────────────────────────
  } else if (step === 2) {
    textEl.textContent = 'Analysiere…';
    const recall = S.flowData.recall || '';

    const msg = `Joel hat "${block.name}" (${subj.name}, NRW mündliches Abitur) frei abgerufen:

"""
${recall}
"""

${S.flowData.explanation ? `Referenz-Erklärung:\n"""\n${S.flowData.explanation}\n"""` : ''}

Erstelle eine präzise Lücken-Analyse für das NRW mündliche Abitur:

✅ GUT SITZT (vollständig & korrekt):
• [was er richtig hatte]

⚠️ TEILWEISE (ansatzweise aber unvollständig):
• [was da war, aber Lücken hatte]

❌ FEHLT / FALSCH:
• [was wichtig ist aber nicht kam oder falsch war]

Dann: "ABITUR-HINWEIS:" — Gib einen spezifischen Hinweis was bei diesem Thema im mündlichen NRW-Abitur besonders wichtig ist (Operator-Kenntnis, typische Prüfungsfragen, Darstellungsleistung).

Sei ehrlich. Nur echte Lücken in die Analyse.`;

    let text = '';
    try {
      text = await callNeo([{ role: 'user', content: msg }], '', 700);
      textEl.textContent = text;
    } catch (e) {
      text = `Analyse fehlgeschlagen: ${e.message}`;
      textEl.textContent = text;
    }
    S.flowData.gaps = text;
    ctrl.innerHTML = `<button class="btn btn-primary" onclick="startFlowStep(3)">Karteikarten generieren →</button>`;

  // ── STEP 3: Karteikarten ───────────────────────────────
  } else if (step === 3) {
    textEl.textContent = 'Generiere Karteikarten für echte Lücken…';

    const msg = `Für das Thema "${block.name}" (${subj.name}, NRW mündliches Abitur):

Lücken-Analyse:
${S.flowData.gaps || 'Alle Inhalte'}

Erstelle 4-7 Karteikarten — NUR für echte Lücken (❌ und ⚠️).
Abitur-Niveau: präzise Fragen, vollständige Antworten.
Berücksichtige NRW-Operatoren wenn möglich.

Format für JEDE Karte:
FRAGE: [klare, abitur-typische Frage]
ANTWORT: [vollständige, präzise Antwort — 2-4 Sätze]

Trenne Karten mit ---`;

    let text = '';
    try {
      text = await callNeo([{ role: 'user', content: msg }], '', 700);
    } catch (e) {
      console.error('[Karteikarten]', e);
      text = '';
    }

    const cards = parseFlashcards(text);
    S.flowData.flashcards = cards;
    saveFlashcards(cards, S.currentSubject, block.id);

    textEl.innerHTML = '';
    if (cards.length === 0) {
      textEl.textContent = cards.length === 0 && !text
        ? 'Generierung fehlgeschlagen — weiter zum Lernzettel.'
        : 'Keine Lücken gefunden — alles sitzt! Block als erledigt markieren.';
    } else {
      renderFlashcardsInFlow(textEl, cards);
    }
    ctrl.innerHTML = `<button class="btn btn-primary" onclick="startFlowStep(4)">Lernzettel erstellen →</button>`;

  // ── STEP 4: Lernzettel ─────────────────────────────────
  } else if (step === 4) {
    textEl.textContent = 'Erstelle Lernzettel…';

    const msg = `Erstelle einen kompakten Lernzettel für "${block.name}" (${subj.name}, NRW mündliches Abitur).

Format:
• 1 Kern-Satz: Was ist das Thema?
• Schlüsselbegriffe mit → Struktur
• Max 150 Wörter
• Am Ende: 2 typische Abitur-Fragen zu diesem Thema`;

    let text = '';
    try {
      text = await callNeo([{ role: 'user', content: msg }], '', 400);
      textEl.textContent = text;
    } catch (e) {
      text = `Fehler: ${e.message}`;
      textEl.textContent = text;
    }
    S.flowData.summary = text;

    ctrl.innerHTML = `
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="saveBlockStatus('done')">✅ Block verstanden</button>
        <button class="btn" onclick="printSummary()">🖨️ Lernzettel drucken</button>
      </div>`;
  }
}

async function deepenExplanation() {
  const ctrl = document.getElementById('flow-controls');
  ctrl.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <textarea class="flow-input" id="deepen-q" placeholder="Was ist unklar?" rows="3"></textarea>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" onclick="sendDeepen()">Fragen →</button>
        <button class="btn" onclick="startFlowStep(1)">Weiter zum Abruf</button>
      </div>
    </div>`;
}

async function sendDeepen() {
  const q = document.getElementById('deepen-q')?.value?.trim();
  if (!q) return;
  const textEl = document.getElementById('flow-text');
  textEl.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  const msg = `Joel fragt zu "${S.currentBlock?.name}" (NRW Abitur): ${q}\nErkläre direkt und klar. Nicht wiederholen.`;
  try {
    const text = await callNeo([{ role: 'user', content: msg }], '', 400);
    textEl.textContent = text;
  } catch (e) { textEl.textContent = `Fehler: ${e.message}`; }
  document.getElementById('flow-controls').innerHTML = `
    <div style="display:flex;gap:10px">
      <button class="btn btn-primary" onclick="startFlowStep(1)">Verstanden — Zum Abruf →</button>
      <button class="btn" onclick="deepenExplanation()">Noch eine Frage</button>
    </div>`;
}

async function analyzeRecall() {
  const recall = document.getElementById('recall-input')?.value?.trim();
  if (!recall) return;
  S.flowData.recall = recall;
  await startFlowStep(2);
}

function parseFlashcards(text) {
  const cards = [];
  const blocks = text.split(/---+/).map(b => b.trim()).filter(Boolean);
  for (const b of blocks) {
    const qMatch = b.match(/FRAGE:\s*(.+?)(?:\n|$)/i);
    const aMatch = b.match(/ANTWORT:\s*([\s\S]+?)(?:$)/i);
    if (qMatch && aMatch) cards.push({ q: qMatch[1].trim(), a: aMatch[1].trim() });
  }
  return cards;
}

function renderFlashcardsInFlow(container, cards) {
  container.innerHTML = '';
  let idx = 0;
  const render = () => {
    const card = cards[idx];
    container.innerHTML = `
      <div style="margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--text-mute)">
        Karte ${idx+1} von ${cards.length} — Klick zum Umdrehen
      </div>
      <div class="flashcard" onclick="this.classList.toggle('flipped')">
        <div class="card-q">${card.q}</div>
        <div class="card-a">${card.a}</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        ${idx > 0 ? '<button class="btn btn-sm" onclick="fcPrev()">← Zurück</button>' : ''}
        ${idx < cards.length-1
          ? '<button class="btn btn-primary btn-sm" onclick="fcNext()">Weiter →</button>'
          : '<button class="btn btn-primary btn-sm" onclick="startFlowStep(4)">Lernzettel →</button>'}
      </div>`;
  };
  window.fcNext = () => { idx = Math.min(idx+1, cards.length-1); render(); };
  window.fcPrev = () => { idx = Math.max(idx-1, 0); render(); };
  render();
}

function saveFlashcards(cards, subjId, blockId) {
  const all = store.get('flashcards') || {};
  if (!all[subjId]) all[subjId] = {};
  all[subjId][blockId] = cards;
  store.set('flashcards', all);
}

function saveBlockStatus(status) {
  const sid   = S.currentSubject;
  const saved = store.get('subjects') || {};
  const subj  = SUBJECTS[sid];
  if (!saved[sid]) saved[sid] = { blocks: [...subj.blocks] };
  const block = saved[sid].blocks.find(b => b.id === S.currentBlock.id);
  if (block) block.status = status;
  store.set('subjects', saved);

  // Phase in Session speichern
  const sessions = store.get('block_sessions') || {};
  const sessKey  = sid + '_' + S.currentBlock.id;
  if (!sessions[sessKey]) sessions[sessKey] = {};
  if (!sessions[sessKey].phases) sessions[sessKey].phases = {};
  sessions[sessKey].phases[S.flowStep] = true;
  sessions[sessKey].lastStep = S.flowStep;
  store.set('block_sessions', sessions);

  // Lücken aus Step 2 persistent speichern
  if (S.flowData.gaps) saveLearningGaps(sid, S.currentBlock.id, S.flowData.gaps);

  if (status === 'done') {
    triggerWhaleEvent('done');
    addNeoMsg(`"${S.currentBlock.name}" verstanden. Weiter. 💪`);
  }
}

// ─── Lücken persistent speichern ─────────────────────────
function saveLearningGaps(subjId, blockId, gapText) {
  const all = store.get('learning_gaps') || {};
  if (!all[subjId]) all[subjId] = {};
  const extracted = gapText.split('\n')
    .filter(l => l.includes('❌') || l.includes('⚠️'))
    .map(l => l.replace(/^[•\-\s❌⚠️]+/, '').trim())
    .filter(l => l.length > 5);
  if (extracted.length) all[subjId][blockId] = extracted;
  store.set('learning_gaps', all);
}

// ─── Session Memory ────────────────────────────────────────
function showSessionMemory(subjId, blockId, sess) {
  const el = document.getElementById('session-memory');
  if (!el) return;
  const gaps     = (store.get('learning_gaps') || {})[subjId]?.[blockId] || [];
  const lastStep = sess?.lastStep ?? -1;
  const lastDate = sess?.lastDate;
  const hasPrev  = lastDate && lastStep >= 0;
  if (!hasPrev && !gaps.length) { el.style.display = 'none'; return; }
  el.style.display = '';
  el.innerHTML = '<div class="sm-label">// LETZTE SESSION</div>' +
    (hasPrev ? `<div>Zuletzt: <strong>${lastDate}</strong> — Phase ${lastStep+1} (${PHASE_NAMES[lastStep]||'?'})</div>` : '') +
    (gaps.length ? `<div style="margin-top:6px">Offene Lücken:<ul class="session-gaps-list">${gaps.slice(0,5).map(g=>'<li>'+escHtml(g)+'</li>').join('')}</ul></div>` : '') +
    `<div style="display:flex;gap:8px;margin-top:10px">
      ${hasPrev ? `<button class="btn btn-sm" onclick="continueSession(${lastStep})">Weitermachen (Phase ${lastStep+2})</button>` : ''}
      <button class="btn btn-sm btn-ghost" onclick="freshSession()">Neu starten</button>
    </div>`;
}
function continueSession(lastStep) {
  document.getElementById('session-memory').style.display = 'none';
  showFlowChoice(Math.min(lastStep + 1, 4));
}
function freshSession() {
  document.getElementById('session-memory').style.display = 'none';
  showFlowChoice();
}

// ─── Abitur-Check ─────────────────────────────────────────
async function showAbiturCheck() {
  showLernView('abitur');
  const contentEl = document.getElementById('abitur-check-content');
  contentEl.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  const saved = store.get('subjects') || {};
  const gaps  = store.get('learning_gaps') || {};
  let summary = ''; let totalDone = 0, totalAll = 0;
  for (const [id, subj] of Object.entries(SUBJECTS)) {
    const blocks = saved[id]?.blocks || subj.blocks;
    const done = blocks.filter(b=>b.status==='done').length;
    const progress = blocks.filter(b=>b.status==='progress').length;
    const open = blocks.filter(b=>(b.status||'open')==='open').length;
    const gapCount = Object.values(gaps[id]||{}).flat().length;
    totalDone += done; totalAll += blocks.length;
    summary += `${subj.name}: ${done}/${blocks.length} verstanden, ${progress} aktiv, ${open} offen, ${gapCount} Lücken\n`;
  }
  const msg = `Joel: mündliches NRW Abitur in ${daysUntilAbi()} Tagen.\nLernstand:\n${summary}\nAnalysiere: 1) Fortschritt pro Fach % 2) Höchstes Risiko 3) Realistischer Zeitbedarf 4) Empfehlung Fokus diese Woche 5) Ehrliche Einschätzung. Direkt, max 200 Wörter.`;
  try {
    const text = await callNeo([{ role:'user', content:msg }], '', 600);
    const pct = totalAll ? Math.round(totalDone/totalAll*100) : 0;
    contentEl.innerHTML = `
      <div class="stats-card" style="margin-bottom:16px;white-space:pre-line;line-height:1.7;font-size:0.9rem">${escHtml(text)}</div>
      <div class="gesamtfortschritt-bar">
        <span>${totalDone}/${totalAll} Blöcke</span>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <span style="color:var(--cyan)">${pct}%</span>
      </div>`;
  } catch(e) {
    contentEl.innerHTML = `<div style="color:var(--text-dim)">Fehler: ${e.message}</div>`;
  }
}

// ─── Prüfungs-Simulation ──────────────────────────────────
let simHistory = [];
function showPruefungsSim() {
  showLernView('sim');
  simHistory = [];
  const el = document.getElementById('pruefung-sim-content');
  el.innerHTML = `
    <div style="margin-bottom:16px;color:var(--text-dim);font-size:0.88rem">Neo spielt den Prüfer — mündliche Prüfung NRW.<br/>Darstellungsaufgabe + Prüfergespräch.</div>
    <div class="stats-title" style="margin-bottom:10px">// FACH WÄHLEN</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${Object.entries(SUBJECTS).map(([id, subj]) => `
        <button class="btn btn-lg" style="justify-content:flex-start;gap:12px" onclick="startSimulation('${id}')">
          ${subj.emoji} ${subj.name}
          <span style="color:var(--text-mute);font-size:0.78rem">${subj.riskLabel}</span>
        </button>`).join('')}
    </div>`;
}

async function startSimulation(subjId) {
  const subj = SUBJECTS[subjId];
  const saved = store.get('subjects') || {};
  const done  = (saved[subjId]?.blocks || subj.blocks).filter(b=>b.status==='done'||b.status==='progress');
  const el = document.getElementById('pruefung-sim-content');
  el.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  const themen = done.length ? done.map(b=>b.name).join(', ') : subj.blocks.slice(0,3).map(b=>b.name).join(', ');
  try {
    const question = await callNeo([{role:'user',content:
      `Du bist Prüfer NRW Abitur ${subj.name}. Joels Themen: ${themen}. Starte Prüfung: Gib reale Darstellungsaufgabe (NRW Abitur Stil, NRW-Operator). Nur die Aufgabe, kein Kommentar.`}], '', 250);
    simHistory = [{ role:'assistant', content: question }];
    S.flowData.simSubj = subjId;
    renderSimView();
  } catch(e) { el.innerHTML = `<div style="color:var(--red)">Fehler: ${e.message}</div>`; }
}

function renderSimView() {
  const el = document.getElementById('pruefung-sim-content');
  el.innerHTML = `
    <div id="sim-chat" class="sim-chat">
      ${simHistory.map(m=>`<div class="sim-msg ${m.role==='assistant'?'prufer':'student'}">
        <div class="sim-role">${m.role==='assistant'?'🎓 PRÜFER':'👤 JOEL'}</div>
        <div style="white-space:pre-line">${escHtml(m.content)}</div>
      </div>`).join('')}
    </div>
    <textarea class="chat-textarea" id="sim-answer" rows="5" placeholder="Antwort eingeben…"
      style="width:100%;box-sizing:border-box;margin-top:12px"></textarea>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn btn-primary" style="flex:1" onclick="submitSimAnswer()">Antworten →</button>
      <button class="btn btn-sm" onclick="showPruefungsSim()">Neu starten</button>
    </div>`;
  const chat = document.getElementById('sim-chat');
  if (chat) chat.scrollTop = chat.scrollHeight;
}

async function submitSimAnswer() {
  const input  = document.getElementById('sim-answer');
  const answer = input?.value?.trim();
  if (!answer) return;
  input.value = ''; input.disabled = true;
  simHistory.push({ role:'user', content: answer });
  const subjId = S.flowData.simSubj;
  const subj   = SUBJECTS[subjId];
  const feedback = await callNeo([{role:'user',content:
    `Prüfer NRW Abitur ${subj?.name||''}. Joels Antwort: "${answer}". Feedback (3-5 Sätze): inhaltlich vollständig (75%)? Darstellung (25%)? Operator richtig? Orientierungsnote X/15? Was fehlte? Dann eine Nachfrage stellen.`}], '', 350).catch(e => 'Fehler: '+e.message);
  simHistory.push({ role:'assistant', content: feedback });
  input.disabled = false;
  renderSimView();
}

function printSummary() {
  const win = window.open('', '_blank');
  win.document.write(`<pre style="font-family:monospace;padding:20px;max-width:640px;white-space:pre-wrap">${S.flowData.summary || ''}</pre>`);
  win.print();
}

// ═══════════════════════════════════════════════════════════
// SPAZIERGANG — Lücken abfragen (vereinfacht, kein API)
// ═══════════════════════════════════════════════════════════
let walkGaps = [];
let walkGapIdx = 0;

function startWalk() {
  const screen = document.getElementById('screen-walk');
  screen.classList.remove('out');

  // Alle offenen Lücken sammeln
  const allGaps = store.get('learning_gaps') || {};
  walkGaps = [];
  for (const [subjId, blocks] of Object.entries(allGaps)) {
    const subj = SUBJECTS[subjId];
    for (const [blockId, gaps] of Object.entries(blocks)) {
      const saved   = store.get('subjects') || {};
      const block   = (saved[subjId]?.blocks || subj.blocks).find(b => b.id === blockId);
      const open    = (gaps || []).filter(g => !g.learned);
      open.forEach(g => walkGaps.push({
        text:    typeof g === 'string' ? g : g.text,
        subjId, blockId,
        subjName:  subj?.name || subjId,
        blockName: block?.name || blockId,
      }));
    }
  }

  // Mischen für Abwechslung
  walkGaps = walkGaps.sort(() => Math.random() - 0.5);
  walkGapIdx = 0;

  document.getElementById('walk-hint').textContent    = '';
  document.getElementById('walk-feedback').innerHTML  = '';
  document.getElementById('walk-feedback').style.display = 'none';
  document.getElementById('walk-answer').style.display   = 'none';

  if (walkGaps.length === 0) {
    document.getElementById('walk-progress').textContent = 'Keine offenen Lücken';
    document.getElementById('walk-question').textContent = '🎉 Alle Lücken sind als "gelernt" markiert oder noch keine eingetragen.';
    document.querySelector('.walk-btns').innerHTML = `
      <button class="btn btn-primary btn-lg" onclick="exitWalk()">← Zurück zum Lernen</button>`;
    return;
  }

  showWalkGap();
}

function showWalkGap() {
  if (walkGapIdx >= walkGaps.length) {
    endWalkSession(); return;
  }
  const gap = walkGaps[walkGapIdx];
  document.getElementById('walk-progress').textContent = `Lücke ${walkGapIdx + 1} von ${walkGaps.length}`;
  document.getElementById('walk-question').textContent = gap.text;
  document.getElementById('walk-hint').textContent     = `${gap.subjName} · ${gap.blockName}`;
  document.getElementById('walk-feedback').style.display = 'none';
  document.querySelector('.walk-btns').innerHTML = `
    <div style="display:flex;gap:12px;width:100%">
      <button class="btn btn-primary btn-lg" style="flex:1" onclick="walkGapResult(true)">✓ Kann ich</button>
      <button class="btn btn-lg" style="flex:1" onclick="walkGapResult(false)">✗ Noch nicht</button>
    </div>`;
}

function walkGapResult(canDo) {
  const gap = walkGaps[walkGapIdx];
  const fb  = document.getElementById('walk-feedback');
  fb.style.display = '';
  if (canDo) {
    fb.innerHTML = `<div style="color:var(--green);font-weight:600;margin-bottom:8px">✓ Gut! Lücke als gelernt markiert.</div>`;
    markGapLearned(gap.subjId, gap.blockId,
      (store.get('learning_gaps')||{})[gap.subjId]?.[gap.blockId]?.findIndex(g => (g.text||g) === gap.text) ?? 0);
  } else {
    fb.innerHTML = `<div style="color:var(--amber);font-weight:600;margin-bottom:8px">✗ Bleibt offen — weiter üben.</div>`;
  }
  fb.innerHTML += `<button class="btn btn-sm" style="margin-top:8px" onclick="walkGapIdx++;showWalkGap()">Weiter →</button>`;
}

function endWalkSession() {
  const done = walkGaps.filter((_,i) => i < walkGapIdx).length;
  document.getElementById('walk-progress').textContent = 'Session abgeschlossen';
  document.getElementById('walk-question').textContent = `${walkGaps.length} Lücken durchgegangen.`;
  document.getElementById('walk-hint').textContent = 'Super gemacht — regelmäßige Wiederholung macht den Unterschied.';
  document.querySelector('.walk-btns').innerHTML = `
    <button class="btn btn-primary btn-lg" onclick="exitWalk()">← Zurück zum Lernen</button>`;
}

function startWalkCards() {
  S.walkMode = 'cards';
  const fc = store.get('flashcards') || {};
  const questions = [];
  const saved = store.get('subjects') || {};

  for (const [sid, subj] of Object.entries(SUBJECTS)) {
    const blocks = (saved[sid]?.blocks || subj.blocks).filter(b => b.status !== 'done');
    const subjFc = fc[sid] || {};
    for (const block of blocks) {
      for (const card of (subjFc[block.id] || [])) {
        questions.push({ q: card.q, a: card.a, subject: subj.name, block: block.name });
      }
    }
  }

  if (questions.length === 0) {
    document.getElementById('walk-question').textContent = 'Alle Karteikarten erledigt!';
    document.getElementById('walk-hint').textContent = 'Starte freie Abfrage oder lerne neue Blöcke.';
    return;
  }

  S.walkQuestions = questions.sort(() => Math.random() - 0.5).slice(0, Math.min(15, questions.length));
  S.walkIndex = 0;
  S.walkLacken = [];
  document.getElementById('walk-answer').style.display = '';
  document.querySelector('.walk-btns').innerHTML = `
    <button class="btn btn-primary btn-lg" style="flex:1" onclick="submitWalkAnswer()">Antwort prüfen</button>
    <button class="btn btn-lg" onclick="skipWalkQuestion()">Überspringen →</button>`;
  renderWalkQuestion();
}

function startWalkFree() {
  S.walkMode = 'free';
  document.getElementById('walk-progress').textContent = 'Freie Abfrage — Fach wählen';
  document.getElementById('walk-question').textContent = 'Welches Fach?';
  document.getElementById('walk-hint').textContent = '';
  document.getElementById('walk-answer').style.display = 'none';

  document.querySelector('.walk-btns').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;width:100%">
      ${Object.values(SUBJECTS).map(s => `
        <button class="btn btn-lg" style="width:100%;justify-content:flex-start;gap:12px"
          onclick="selectWalkSubject('${s.id}')">
          ${s.emoji} ${s.name}
          <span style="color:var(--text-mute);font-size:0.78rem">${s.riskLabel}</span>
        </button>`).join('')}
    </div>`;
}

function selectWalkSubject(subjId) {
  S.currentSubject = subjId;
  const subj  = SUBJECTS[subjId];
  const saved = store.get('subjects') || {};
  const blocks = saved[subjId]?.blocks || subj.blocks;

  document.getElementById('walk-progress').textContent = `${subj.emoji} ${subj.name} — Thema wählen`;
  document.getElementById('walk-question').textContent = 'Welches Thema willst du üben?';

  document.querySelector('.walk-btns').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;width:100%;max-height:400px;overflow-y:auto">
      <button class="btn" style="width:100%" onclick="startWalkFreeSession('__alle__')">
        📚 Alle Themen (gemischt)
      </button>
      ${blocks.map(b => `
        <button class="btn" style="width:100%;justify-content:flex-start;gap:8px"
          onclick="startWalkFreeSession('${b.id}')">
          ${STATUS_ICONS[b.status] || '⬜'} ${b.name}
        </button>`).join('')}
    </div>`;
}

async function startWalkFreeSession(blockId) {
  const subj   = SUBJECTS[S.currentSubject];
  const saved  = store.get('subjects') || {};
  const blocks = saved[S.currentSubject]?.blocks || subj.blocks;

  let topicDesc;
  if (blockId === '__alle__') {
    topicDesc = blocks.map(b => b.name).join(', ');
  } else {
    const block = blocks.find(b => b.id === blockId);
    topicDesc = block?.name || 'Alle Themen';
    S.currentBlock = block;
  }

  document.getElementById('walk-progress').textContent = 'Generiere Fragen…';
  document.getElementById('walk-question').textContent = 'Neo denkt nach…';
  document.getElementById('walk-hint').textContent = '';
  document.querySelector('.walk-btns').innerHTML = '';

  const msg = `Erstelle genau 6 mündliche Abitur-Prüfungsfragen (NRW) für:
Fach: ${subj.name}
Thema: ${topicDesc}

Nutze verschiedene Operatoren: beschreiben, erläutern, analysieren, beurteilen, Stellung nehmen.

Antworte NUR in diesem exakten Format, ohne Einleitung:

FRAGE: [Frage hier]
ANTWORT: [Musterlösung, 3-4 Sätze]
---
FRAGE: [Frage hier]
ANTWORT: [Musterlösung, 3-4 Sätze]
---`;

  try {
    console.log('[Walk] Starte API-Call für:', subj.name, '/', topicDesc);
    const text = await callNeo([{ role: 'user', content: msg }], '', 2000);
    console.log('[Walk] API Response:', text.slice(0, 200));

    let questions = parseFlashcards(text).map(c => ({
      q: c.q, a: c.a, subject: subj.name, block: topicDesc
    }));

    // Fallback parser falls parseFlashcards scheitert
    if (questions.length === 0) {
      console.warn('[Walk] Standard-Parser fehlgeschlagen, versuche Fallback…');
      questions = parseWalkFallback(text, subj.name, topicDesc);
    }

    console.log('[Walk] Fragen geparst:', questions.length);

    if (questions.length === 0) {
      document.getElementById('walk-question').textContent = 'Keine Fragen generiert. API-Antwort: ' + text.slice(0, 120);
      document.querySelector('.walk-btns').innerHTML = `<button class="btn btn-primary btn-lg" onclick="startWalkFree()">← Zurück</button>`;
      return;
    }

    S.walkQuestions = questions;
    S.walkIndex     = 0;
    S.walkLacken    = [];

    document.getElementById('walk-answer').style.display = '';
    document.querySelector('.walk-btns').innerHTML = `
      <button class="btn btn-primary btn-lg" style="flex:1" onclick="submitWalkAnswer()">Antwort prüfen</button>
      <button class="btn btn-lg" onclick="skipWalkQuestion()">Überspringen →</button>`;
    renderWalkQuestion();
  } catch (e) {
    console.error('[Walk] Fehler:', e);
    document.getElementById('walk-question').textContent = `API-Fehler: ${e.message}`;
    document.querySelector('.walk-btns').innerHTML = `<button class="btn btn-primary btn-lg" onclick="startWalkFreeSession('${blockId}')">Nochmal versuchen</button>
      <button class="btn btn-lg" onclick="startWalkFree()">← Zurück</button>`;
  }
}

function parseWalkFallback(text, subjName, topicDesc) {
  // Versuche nummerierte Fragen zu parsen: "1. Frage..." oder "Frage 1:"
  const questions = [];
  const lines = text.split('\n').filter(l => l.trim());
  let currentQ = null;
  for (const line of lines) {
    const isQuestion = /^(frage\s*\d*[:.]|q\d*[:.]|\d+[.)]\s)/i.test(line.trim());
    const isAnswer   = /^(antwort\s*[:.]|a\s*[:.]|musterlösung)/i.test(line.trim());
    if (isQuestion) {
      if (currentQ?.q) questions.push({ ...currentQ, subject: subjName, block: topicDesc });
      currentQ = { q: line.replace(/^[\w\s\d.:]+[:.]?\s*/i, '').trim(), a: '' };
    } else if (isAnswer && currentQ) {
      currentQ.a = line.replace(/^[\w\s\d.:]+[:.]?\s*/i, '').trim();
    } else if (currentQ && !currentQ.a && line.trim().length > 20) {
      currentQ.a += (currentQ.a ? ' ' : '') + line.trim();
    }
  }
  if (currentQ?.q) questions.push({ ...currentQ, subject: subjName, block: topicDesc });
  return questions.filter(q => q.q && q.a);
}

function renderWalkQuestion() {
  const q = S.walkQuestions[S.walkIndex];
  if (!q) { endWalk(); return; }
  document.getElementById('walk-progress').textContent = `Frage ${S.walkIndex+1} von ${S.walkQuestions.length} · ${q.subject}`;
  document.getElementById('walk-question').textContent  = q.q;
  document.getElementById('walk-hint').textContent      = `Thema: ${q.block}`;
  document.getElementById('walk-answer').value = '';
  document.getElementById('walk-feedback').style.display = 'none';
}

async function submitWalkAnswer() {
  const answer = document.getElementById('walk-answer').value.trim();
  if (!answer) return;
  const q  = S.walkQuestions[S.walkIndex];
  const fb = document.getElementById('walk-feedback');
  fb.className = 'walk-feedback';
  fb.textContent = '…';
  fb.style.display = 'block';

  try {
    const msg = `Frage: "${q.q}"
Musterlösung: "${q.a}"
Joels Antwort: "${answer}"

Bewerte kurz in 1-2 Sätzen für NRW mündliches Abitur.
✅ = korrekt und vollständig  🟡 = teilweise  ❌ = falsch/zu wenig
Falls nötig: ein Satz Korrektur/Ergänzung.
Falls der Operator "beurteilen/Stellung nehmen" — prüfe ob Joel auch eine eigene Wertung geliefert hat.`;

    const resp = await callNeo([{ role: 'user', content: msg }], 'Antworte sehr kurz.', 200);
    fb.textContent = resp;

    if (resp.includes('❌') || resp.includes('🟡')) {
      S.walkLacken.push(q);
      fb.classList.add(resp.includes('❌') ? 'bad' : 'warn');
    } else {
      fb.classList.add('ok');
    }
  } catch (e) {
    fb.textContent = `Fehler: ${e.message}\nMusterlösung: ${q.a}`;
  }
}

function skipWalkQuestion() {
  S.walkLacken.push(S.walkQuestions[S.walkIndex]);
  S.walkIndex++;
  renderWalkQuestion();
}

function endWalk() {
  const fb = document.getElementById('walk-feedback');
  fb.className = 'walk-feedback';
  fb.style.display = 'block';
  fb.textContent = `Spaziergang beendet.\nLücken: ${S.walkLacken.length} von ${S.walkQuestions.length} Fragen.\n${S.walkLacken.length === 0 ? 'Stark. Alles sitzt.' : 'Diese kommen als Karteikarten.'}`;
  document.getElementById('walk-question').textContent = 'Fertig.';
  document.getElementById('walk-hint').textContent     = '';
  document.querySelector('.walk-btns').innerHTML = `<button class="btn btn-primary btn-lg" style="flex:1" onclick="exitWalk()">Zurück zu Neo</button>`;
}

function exitWalk() {
  document.getElementById('screen-walk').classList.add('out');
  document.getElementById('walk-answer').style.display = '';
}

// ═══════════════════════════════════════════════════════════
// TRAINING
// ═══════════════════════════════════════════════════════════
// TRAINING — Wochensystem
// ═══════════════════════════════════════════════════════════
const WEEK_PERCENTAGES = { 1: 0.60, 2: 0.70, 3: 0.80, 4: 0.90 };
let currentTrainingWeek = 1;

function getTrainingStartDate() {
  let d = store.get('training_start');
  if (!d) {
    // Erster Montag der Mission (oder heute wenn Montag)
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    d = monday.toISOString().slice(0, 10);
    store.set('training_start', d);
  }
  return new Date(d);
}

function getCurrentTrainingWeek() {
  const start = getTrainingStartDate();
  const diff  = Math.floor((Date.now() - start) / 86400000);
  return Math.max(1, Math.floor(diff / 7) + 1);
}

function getWeekDates(weekNum) {
  const start  = getTrainingStartDate();
  const monday = new Date(start);
  monday.setDate(start.getDate() + (weekNum - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function getWeekPct(weekNum) {
  return WEEK_PERCENTAGES[Math.min(weekNum, 4)] || 0.90;
}

function getWeekLog(weekNum, workoutKey) {
  // Alle Logs dieser Woche für dieses Workout zusammenfassen
  const dates  = getWeekDates(weekNum);
  const logs   = store.get('workout_logs') || {};
  for (const d of dates) {
    if (logs[d]?.[workoutKey]) return logs[d][workoutKey];
  }
  return {};
}

function saveExerciseWeek(wk, idx, field, rawVal) {
  // Komma → Punkt normalisieren
  const val  = parseWeight(rawVal);
  const logs = store.get('workout_logs') || {};
  if (!logs[today()]) logs[today()] = {};
  if (!logs[today()][wk]) logs[today()][wk] = {};
  if (!logs[today()][wk][idx]) logs[today()][wk][idx] = {};
  logs[today()][wk][idx][field] = val;
  store.set('workout_logs', logs);
}

function parseWeight(val) {
  if (typeof val === 'number') return val;
  // Akzeptiere "12.5" und "12,5"
  const s = String(val).replace(',', '.');
  const f = parseFloat(s);
  return isNaN(f) ? 0 : Math.round(f * 100) / 100;
}

function renderWeekGrid() {
  // Aktuelle Woche ermitteln
  currentTrainingWeek = getCurrentTrainingWeek();
  renderWeekNav(currentTrainingWeek);
  renderWeekDays(currentTrainingWeek);
}

function renderWeekNav(activeWeek) {
  const nav       = document.getElementById('training-week-nav');
  const label     = document.getElementById('comeback-label');
  const totalWeeks = Math.max(activeWeek, 4);
  if (!nav) return;

  if (label) {
    const pct = Math.round(getWeekPct(activeWeek) * 100);
    label.textContent = `Woche ${activeWeek} · ${pct}% Gewichte`;
  }

  nav.innerHTML = `
    <button class="wn-arrow" onclick="changeTrainingWeek(-1)">←</button>
    ${Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => `
      <button class="wn-week${w === activeWeek ? ' active' : w < activeWeek ? ' past' : ''}"
        onclick="changeTrainingWeek(0, ${w})">
        W${w}<span class="wn-pct">${Math.round(getWeekPct(w) * 100)}%</span>
      </button>`).join('')}
    <button class="wn-arrow" onclick="changeTrainingWeek(1)">→</button>`;
}

function changeTrainingWeek(delta, absolute) {
  const realWeek = getCurrentTrainingWeek();
  if (absolute != null) {
    currentTrainingWeek = absolute;
  } else {
    currentTrainingWeek = Math.max(1, Math.min(realWeek + 2, currentTrainingWeek + delta));
  }
  renderWeekNav(currentTrainingWeek);
  renderWeekDays(currentTrainingWeek);
  renderProgressSection();
}

function renderWeekDays(weekNum) {
  const grid     = document.getElementById('week-grid');
  const area     = document.getElementById('workout-area');
  if (!grid) return;
  const days     = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const weekDates = getWeekDates(weekNum);
  const logs     = store.get('workout_logs') || {};
  const realWeek = getCurrentTrainingWeek();
  const isCurrentWeek = weekNum === realWeek;
  const todayStr = today();

  // Wochentag-Mapping: getWeekDates gibt Mo-So zurück
  const dowMap = [1,2,3,4,5,6,0]; // Mo=1, So=0
  grid.innerHTML = days.map((d, i) => {
    const dow       = dowMap[i];
    const dateStr   = weekDates[i];
    const wKey      = WORKOUT_PLAN[dow];
    const workout   = wKey ? WORKOUTS[wKey] : null;
    const isToday   = dateStr === todayStr;
    const isDone    = logs[dateStr] && Object.keys(logs[dateStr]).some(k => k.endsWith('_completed'));
    return `
      <div class="day-card${isToday ? ' today' : ''}${workout ? ' has-workout' : ''}"
           ${workout ? `onclick="openWorkoutWeek('${wKey}','${dateStr}',${weekNum})"` : ''}>
        <div class="day-label">${d} <span style="font-size:0.65rem;opacity:0.6">${dateStr.slice(5)}</span></div>
        <div class="day-type">${workout ? workout.name : 'Pause'}</div>
        ${isDone ? '<div class="day-done">✓ Fertig</div>' : ''}
      </div>`;
  }).join('');

  area.innerHTML = '';

  // Automatisch heutiges/relevantes Workout öffnen
  const todayDow  = new Date().getDay();
  const todayWKey = WORKOUT_PLAN[todayDow];
  if (isCurrentWeek && todayWKey) {
    openWorkoutWeek(todayWKey, todayStr, weekNum);
  } else if (!isCurrentWeek) {
    area.innerHTML = `<div class="card" style="padding:20px;color:var(--text-dim);font-size:0.88rem">
      Vergangene Woche — nur lesen. Klick auf einen Trainingstag um die Daten anzusehen.
    </div>`;
  } else {
    area.innerHTML = `
      <div class="card" style="text-align:center;padding:40px">
        <div style="font-size:2rem;margin-bottom:12px">🛌</div>
        <div style="font-size:1.1rem;font-weight:600">Heute: Pause</div>
        <div style="color:var(--text-dim);margin-top:8px;font-size:0.9rem">Recovery ist Training.</div>
      </div>`;
  }
  renderProgressSection();
}

function getWorkoutExercises(key) {
  const custom = store.get('workout_custom') || {};
  const base   = WORKOUTS[key]?.exercises || [];
  return custom[key] || base.map(ex => ({ ...ex }));
}

function saveWorkoutExercises(key, exercises) {
  const custom = store.get('workout_custom') || {};
  custom[key]  = exercises;
  store.set('workout_custom', custom);
}

// Legacy stub
function openWorkout(key) { openWorkoutWeek(key, today(), currentTrainingWeek); }

function openWorkoutWeek(key, dateStr, weekNum) {
  const workout    = WORKOUTS[key];
  if (!workout) return;
  const area       = document.getElementById('workout-area');
  const logs       = store.get('workout_logs') || {};
  const dayLog     = logs[dateStr]?.[key] || {};
  const exercises  = getWorkoutExercises(key);
  const pct        = getWeekPct(weekNum);
  const recMult    = pct;
  const realWeek   = getCurrentTrainingWeek();
  const isEditable = weekNum === realWeek;

  area.innerHTML = `
    <div class="workout-header">
      <h2>${workout.name}</h2>
      <div class="comeback-badge">Woche ${weekNum} · ${Math.round(pct*100)}% Gewichte${!isEditable ? ' · Nur lesen' : ''}</div>
    </div>
    <div class="exercise-list" id="ex-list-${key}">
      ${exercises.map((ex, i) => renderExerciseItem(key, ex, i, dayLog[i] || {}, recMult, isEditable, dateStr)).join('')}
    </div>
    ${isEditable ? `<button class="add-exercise-btn" onclick="addExercise('${key}')">+ Übung hinzufügen</button>
    <div style="margin-top:16px">
      <button class="btn btn-primary" onclick="completeWorkoutDay('${key}','${dateStr}')">Training abschließen ✓</button>
    </div>` : ''}`;
}

function renderExerciseItem(key, ex, i, saved, recMult = 0.6, isEditable = true, dateStr = null) {
  const mult  = recMult;
  const recKg = Math.round((ex.prevKg || 20) * mult * 2) / 2;
  const logKey = dateStr || today();
  return `
    <div class="exercise-item${saved.done ? ' done-ex' : ''}" id="ex-${i}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div class="ex-name" style="flex:1" id="ex-name-${i}">${escHtml(ex.name)}</div>
        <button class="ex-customize-btn" onclick="toggleCustomize('${key}',${i})">Anpassen</button>
        <button class="ex-delete-btn" onclick="deleteExercise('${key}',${i})" title="Löschen">✕</button>
      </div>
      <div class="ex-sets" id="ex-sets-${i}">${ex.sets} · ${ex.unit} · <span class="ex-rec">Empfohlen: ${recKg}kg</span></div>
      <div id="customize-${i}" style="display:none">
        <div class="ex-customize-form">
          <div><label class="ex-input-label">Name</label>
            <input class="ex-note" value="${escHtml(ex.name)}" onchange="updateExField('${key}',${i},'name',this.value)"/></div>
          <div><label class="ex-input-label">Sätze/Reps (z.B. 3×8-10)</label>
            <input class="ex-note" value="${ex.sets}" onchange="updateExField('${key}',${i},'sets',this.value)"/></div>
          <div><label class="ex-input-label">Einheit</label>
            <input class="ex-note" value="${ex.unit}" onchange="updateExField('${key}',${i},'unit',this.value)"/></div>
          <div><label class="ex-input-label">Referenz-Gewicht (kg)</label>
            <input class="ex-note" type="number" value="${ex.prevKg}" onchange="updateExField('${key}',${i},'prevKg',parseFloat(this.value))"/></div>
        </div>
      </div>
      <div class="ex-inputs">
        <div class="ex-input-wrap">
          <label class="ex-input-label">Satz 1 (kg)</label>
          <input class="ex-input" type="text" inputmode="decimal" value="${saved.s1 || ''}" placeholder="${recKg}"
            ${!isEditable ? 'disabled' : `onchange="saveExercise('${key}',${i},'s1',this.value,'${logKey}')"`}/>
        </div>
        <div class="ex-input-wrap">
          <label class="ex-input-label">Reps</label>
          <input class="ex-reps-input" type="number" value="${saved.r1 || ''}" placeholder="—"
            ${!isEditable ? 'disabled' : `onchange="saveExercise('${key}',${i},'r1',this.value,'${logKey}')"`}/>
        </div>
        <div class="ex-input-wrap">
          <label class="ex-input-label">Satz 2 (kg)</label>
          <input class="ex-input" type="text" inputmode="decimal" value="${saved.s2 || ''}" placeholder="${recKg}"
            ${!isEditable ? 'disabled' : `onchange="saveExercise('${key}',${i},'s2',this.value,'${logKey}')"`}/>
        </div>
        <div class="ex-input-wrap">
          <label class="ex-input-label">Reps</label>
          <input class="ex-reps-input" type="number" value="${saved.r2 || ''}" placeholder="—"
            ${!isEditable ? 'disabled' : `onchange="saveExercise('${key}',${i},'r2',this.value,'${logKey}')"`}/>
        </div>
        <div class="ex-input-wrap" style="flex:1">
          <label class="ex-input-label">Notizen</label>
          <input class="ex-note" type="text" value="${saved.note || ''}" placeholder="Form, Gefühl…"
            ${!isEditable ? 'disabled' : `onchange="saveExercise('${key}',${i},'note',this.value,'${logKey}')"`}/>
        </div>
        ${isEditable ? `<button class="ex-done-btn${saved.done ? ' checked' : ''}"
          onclick="toggleExDone('${key}',${i},this,'${logKey}')">✓</button>` : ''}
      </div>
    </div>`;
}

function toggleCustomize(key, i) {
  const el = document.getElementById(`customize-${i}`);
  if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
}

function updateExField(key, i, field, value) {
  console.log(`[Training] updateExField key=${key} i=${i} field=${field} value=${value}`);
  const exercises = getWorkoutExercises(key);
  if (!exercises[i]) { console.warn('[Training] Übung nicht gefunden:', i); return; }

  exercises[i][field] = field === 'prevKg' ? parseFloat(value) || 0 : value;
  saveWorkoutExercises(key, exercises);

  const saved = store.get('workout_custom') || {};
  console.log('[Training] localStorage nach Save:', JSON.stringify(saved[key]?.[i]));

  // DOM in-place aktualisieren ohne Form zu schließen
  const ex    = exercises[i];
  const recKg = Math.round((ex.prevKg || 20) * 0.6 * 2) / 2;

  const nameEl = document.getElementById(`ex-name-${i}`);
  const setsEl = document.getElementById(`ex-sets-${i}`);
  if (nameEl) nameEl.textContent = ex.name;
  if (setsEl) setsEl.innerHTML = `${ex.sets} · ${ex.unit} · <span class="ex-rec">Empfohlen: ${recKg}kg</span>`;

  // "Gespeichert ✓" kurz einblenden
  showSavedFeedback(key, i);
}

function showSavedFeedback(key, i) {
  const btn = document.querySelector(`#ex-${i} .ex-customize-btn`);
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = 'Gespeichert ✓';
  btn.style.color = 'var(--green)';
  btn.style.borderColor = 'var(--green)';
  clearTimeout(btn._feedbackTimer);
  btn._feedbackTimer = setTimeout(() => {
    btn.textContent = 'Anpassen';
    btn.style.color = '';
    btn.style.borderColor = '';
  }, 1800);
}

function addExercise(key) {
  const exercises = getWorkoutExercises(key);
  exercises.push({ name: 'Neue Übung', sets: '3×8-10', unit: 'kg', prevKg: 20 });
  saveWorkoutExercises(key, exercises);
  openWorkout(key);
}

function deleteExercise(key, i) {
  const exercises = getWorkoutExercises(key);
  exercises.splice(i, 1);
  saveWorkoutExercises(key, exercises);
  openWorkout(key);
}

function saveExercise(wk, idx, field, rawVal, dateStr) {
  const val  = field === 'note' ? rawVal : parseWeight(rawVal);
  const date = dateStr || today();
  const logs = store.get('workout_logs') || {};
  if (!logs[date]) logs[date] = {};
  if (!logs[date][wk]) logs[date][wk] = {};
  if (!logs[date][wk][idx]) logs[date][wk][idx] = {};
  logs[date][wk][idx][field] = val;
  store.set('workout_logs', logs);
}

function toggleExDone(wk, idx, btn, dateStr) {
  const isDone = !btn.classList.contains('checked');
  btn.classList.toggle('checked', isDone);
  document.getElementById(`ex-${idx}`)?.classList.toggle('done-ex', isDone);
  saveExercise(wk, idx, 'done', isDone, dateStr || today());
}

function completeWorkoutDay(key, dateStr) {
  const date = dateStr || today();
  const logs = store.get('workout_logs') || {};
  if (!logs[date]) logs[date] = {};
  logs[date][key + '_completed'] = true;
  store.set('workout_logs', logs);
  addNeoMsg('Training abgeschlossen. Gut gemacht — Comeback läuft. 💪');
  triggerWhaleEvent('done');
  renderWeekDays(currentTrainingWeek);
}

// Legacy
function completeWorkout(key) { completeWorkoutDay(key, today()); }

// ─── Fortschritts-Diagramm ────────────────────────────────
function renderProgressSection() {
  const el = document.getElementById('progress-section');
  if (!el) return;
  const logs      = store.get('workout_logs') || {};
  const realWeek  = getCurrentTrainingWeek();
  const maxWeeks  = Math.max(realWeek, 2);

  // Alle Workout-Keys ermitteln (heute oder irgendwann geloggt)
  const workoutKeys = Object.keys(WORKOUTS);

  // Progression pro Übung berechnen
  const progressData = {};
  for (const wk of workoutKeys) {
    const exercises = getWorkoutExercises(wk);
    exercises.forEach((ex, idx) => {
      if (!progressData[ex.name]) progressData[ex.name] = { name: ex.name, wk, idx, data: [] };
      for (let w = 1; w <= maxWeeks; w++) {
        const dates = getWeekDates(w);
        let kg = null;
        for (const d of dates) {
          const s1 = parseWeight(logs[d]?.[wk]?.[idx]?.s1);
          const s2 = parseWeight(logs[d]?.[wk]?.[idx]?.s2);
          if (s1 > 0 || s2 > 0) { kg = Math.max(s1, s2); break; }
        }
        progressData[ex.name].data.push({ week: w, kg });
      }
    });
  }

  const entries = Object.values(progressData).filter(e => e.data.some(d => d.kg !== null));

  if (!entries.length) {
    el.innerHTML = `
      <div class="progress-summary">
        <div class="stats-title">// MEIN FORTSCHRITT</div>
        <div style="color:var(--text-mute);font-size:0.85rem;margin-top:8px">
          Trag deine Gewichte ein um deinen Fortschritt zu sehen.
        </div>
      </div>`;
    return;
  }

  // Stärkste Steigerung berechnen
  let bestGain = { name: '', gain: 0 };
  let improved = 0;
  for (const e of entries) {
    const filled = e.data.filter(d => d.kg !== null);
    if (filled.length >= 2) {
      const gain = filled[filled.length-1].kg - filled[0].kg;
      if (gain > 0) { improved++; if (gain > bestGain.gain) bestGain = { name: e.name, gain }; }
    }
  }

  el.innerHTML = `
    <div class="progress-summary">
      <div class="stats-title">// MEIN FORTSCHRITT</div>
      <div style="display:flex;gap:20px;margin-top:8px;flex-wrap:wrap">
        <div><span style="color:var(--cyan);font-weight:600">${improved}</span> <span style="color:var(--text-dim);font-size:0.82rem">Übungen gesteigert 💪</span></div>
        ${bestGain.gain > 0 ? `<div><span style="color:var(--green);font-weight:600">${bestGain.name} +${bestGain.gain}kg</span> <span style="color:var(--text-dim);font-size:0.82rem">stärkste Steigerung</span></div>` : ''}
      </div>
    </div>
    ${entries.map(e => renderMiniChart(e, maxWeeks)).join('')}`;
}

function renderMiniChart(entry, maxWeeks) {
  const id  = 'chart-' + entry.name.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'');
  const has = entry.data.filter(d => d.kg !== null);
  const max = Math.max(...has.map(d => d.kg), 1);
  const min = Math.min(...has.map(d => d.kg).filter(v => v > 0), max);

  const html = `
    <div class="progress-chart-wrap">
      <div class="progress-chart-title">${entry.name}</div>
      <div class="progress-canvas-wrap">
        <canvas id="${id}" width="400" height="60" style="width:100%;height:60px"></canvas>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.66rem;color:var(--text-mute);font-family:'JetBrains Mono',monospace;margin-top:4px">
        ${Array.from({length:maxWeeks},(_,i)=>`<span>W${i+1}</span>`).join('')}
      </div>
    </div>`;

  // Canvas nach DOM-Einfügen zeichnen
  setTimeout(() => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W   = canvas.offsetWidth || 400;
    const H   = canvas.height;
    canvas.width = W;
    ctx.clearRect(0, 0, W, H);

    const pts = entry.data.map((d, i) => ({
      x: maxWeeks === 1 ? W/2 : (i / (maxWeeks - 1)) * (W - 20) + 10,
      y: d.kg !== null ? H - 8 - ((d.kg - min) / (max - min || 1)) * (H - 16) : null,
      kg: d.kg,
    }));

    // Grid-Linie
    ctx.strokeStyle = 'rgba(86,204,242,0.08)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();

    // Linie zeichnen
    ctx.strokeStyle = '#56CCF2';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    let started = false;
    for (const pt of pts) {
      if (pt.y === null) continue;
      if (!started) { ctx.moveTo(pt.x, pt.y); started = true; }
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Punkte + Labels
    for (const pt of pts) {
      if (pt.y === null) continue;
      ctx.fillStyle = '#56CCF2';
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI*2); ctx.fill();
      // kg-Label
      ctx.fillStyle = '#8ab4d4';
      ctx.font      = '9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(pt.kg + 'kg', pt.x, pt.y - 6);
    }
  }, 50);

  return html;
}

// ═══════════════════════════════════════════════════════════
// ÜBERSICHT
// ═══════════════════════════════════════════════════════════
function calcCountdown() {
  const target = new Date('2026-06-30');
  return Math.max(0, Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24)));
}

function renderOverview() {
  const el = id => document.getElementById(id);
  if (el('cd-days')) el('cd-days').textContent = calcCountdown();

  const ci     = S.checkin || store.get('checkin_' + today()) || {};
  const score  = calcFocusScore(ci);
  const streak = store.get('streak') || 0;
  const logs   = store.get('workout_logs') || {};

  if (el('ov-focus'))  el('ov-focus').textContent  = score + '/100';
  if (el('ov-medi'))   el('ov-medi').textContent   = ci.medikinet || '—';
  if (el('ov-sleep'))  el('ov-sleep').textContent  = ci.sleep ? ci.sleep + 'h' : '—';
  if (el('ov-streak')) el('ov-streak').textContent = streak + ' Tage 🔥';

  const weekW = Object.keys(logs).filter(d => {
    const diff = (new Date() - new Date(d)) / 86400000;
    return diff >= 0 && diff < 7 && Object.keys(logs[d]).some(k => k.endsWith('_completed'));
  }).length;
  if (el('ov-gym')) el('ov-gym').textContent = weekW + '/3 Tage';

  const saved = store.get('subjects') || {};
  let doneBlocks = 0;
  for (const [id, subj] of Object.entries(SUBJECTS)) {
    doneBlocks += (saved[id]?.blocks || subj.blocks).filter(b => b.status === 'done').length;
  }
  if (el('ov-blocks'))   el('ov-blocks').textContent = doneBlocks + ' erledigt';
  if (el('ov-missions')) el('ov-missions').textContent = doneBlocks + weekW + ' Missionen';

  // Fortschritt-Balken
  const progEl = el('ov-progress');
  if (progEl) {
    progEl.innerHTML = Object.entries(SUBJECTS).map(([id, subj]) => {
      const blocks = saved[id]?.blocks || subj.blocks;
      const done   = blocks.filter(b => b.status === 'done').length;
      const pct    = blocks.length ? Math.round(done / blocks.length * 100) : 0;
      return `<div class="progress-row">
        <span class="progress-label-text">${subj.emoji} ${subj.name.split(' ')[0]}</span>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <span class="progress-pct">${pct}%</span>
      </div>`;
    }).join('');
  }

  // Wochenplan
  const planEl = el('ov-week-plan');
  if (planEl) {
    const days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
    const todayDow = new Date().getDay();
    planEl.innerHTML = days.map((d, i) => {
      const wKey = WORKOUT_PLAN[i];
      const isToday = i === todayDow;
      const gym = wKey ? WORKOUTS[wKey]?.name : null;
      return `<div class="week-plan-row${isToday ? ' today' : ''}">
        <span class="week-plan-day">${d}</span>
        <span class="${gym ? 'week-plan-item' : 'week-plan-rest'}">${gym || 'Pause'}</span>
        ${isToday ? '<span style="color:var(--cyan);font-size:0.72rem;margin-left:auto">← heute</span>' : ''}
      </div>`;
    }).join('');
  }

  if (hour() >= 18) {
    const cb = document.getElementById('close-day-btn');
    if (cb) cb.style.display = 'inline-flex';
  }

  // Motivations-Moment laden
  loadMotivationMoment();
}

function renderGoals() {
  const saved = store.get('goals') || GOALS;
  const list  = document.getElementById('goals-list');
  if (!list) return;
  list.innerHTML = saved.map(g => `
    <div class="goal-item">
      <div class="goal-check${g.done ? ' checked' : ''}" onclick="toggleGoal('${g.id}')">
        ${g.done ? '✓' : ''}
      </div>
      <span class="goal-text${g.done ? ' done' : ''}">${escHtml(g.text)}</span>
      <button class="goal-delete" onclick="deleteGoal('${g.id}')" title="Löschen">✕</button>
    </div>`).join('');
}

function toggleGoal(id) {
  const goals = store.get('goals') || GOALS;
  const g = goals.find(g => g.id === id);
  if (g) { g.done = !g.done; store.set('goals', goals); renderGoals(); }
  if (g?.done) triggerWhaleEvent('done');
}

function addGoal() {
  const input = document.getElementById('goal-new-input');
  const text  = input?.value?.trim();
  if (!text) return;
  const goals = store.get('goals') || GOALS;
  goals.push({ id: 'g' + Date.now(), text, done: false });
  store.set('goals', goals);
  input.value = '';
  renderGoals();
}

function deleteGoal(id) {
  const goals = (store.get('goals') || GOALS).filter(g => g.id !== id);
  store.set('goals', goals);
  renderGoals();
}

function closeDay() {
  const doneWrap = document.getElementById('done-list-wrap');
  if (doneWrap) doneWrap.style.display = 'block';

  const list  = document.getElementById('done-list');
  const items = [];
  const ci = S.checkin || store.get('checkin_' + today()) || {};
  if (ci.gym === 'yes') items.push('💪 Gym absolviert');
  const saved = store.get('subjects') || {};
  for (const [id] of Object.entries(SUBJECTS)) {
    const blocks = saved[id]?.blocks || SUBJECTS[id].blocks;
    const done = blocks.filter(b => b.status === 'done').length;
    if (done > 0) items.push(`🧠 ${SUBJECTS[id].name}: ${done} Blöcke verstanden`);
  }
  const logs = store.get('workout_logs') || {};
  if (Object.keys(logs[today()] || {}).some(k => k.endsWith('_completed'))) items.push('🏋️ Training geloggt');
  if (items.length === 0) items.push('Heute war ein ruhiger Tag — morgen wieder.');

  if (list) list.innerHTML = items.map(t => `<div class="done-item"><span>✓</span><span>${t}</span></div>`).join('');
  addNeoMsg('Tag abgeschlossen. Was ist morgen die erste Aufgabe?');
  const tomorrow = store.get('tomorrow') || '';
  const ti = document.getElementById('tomorrow-input');
  if (ti) ti.value = tomorrow;
}

function saveTomorrow(v) { store.set('tomorrow', v); }

// ═══════════════════════════════════════════════════════════
// CHAT — FIX 1: IMMER antworten + Logging
// ═══════════════════════════════════════════════════════════
function clearChat() { S.chatHistory = []; document.getElementById('chat-messages').innerHTML = ''; }

async function sendChat() {
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  const sendBtn = document.getElementById('chat-send-btn');
  sendBtn.disabled = true;

  appendChatMsg(text, true);
  S.chatHistory.push({ role: 'user', content: text });

  const bubble = appendChatMsg('', false);
  const bubbleText = bubble.querySelector('.chat-bubble');
  bubbleText.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';

  const CHAT_FALLBACKS = [
    'Ich bin kurz nicht erreichbar — aber ich höre dich. Was wolltest du sagen?',
    'Kurze Verbindungspause. Erzähl weiter, Joel.',
    'Neo ist da. Was beschäftigt dich gerade?',
  ];
  try {
    console.log('[Chat] Sende:', text.slice(0, 60));
    const reply = await callNeo(S.chatHistory, '', 1200);
    if (!reply || reply.trim() === '') throw new Error('Leere Antwort');
    console.log('[Chat] Antwort:', reply.slice(0, 80));
    bubbleText.textContent = reply;
    S.chatHistory.push({ role: 'assistant', content: reply });
  } catch (e) {
    console.error('[Chat] FEHLER:', e.message);
    const fallback = CHAT_FALLBACKS[Math.floor(Math.random() * CHAT_FALLBACKS.length)];
    bubbleText.textContent = fallback;
    S.chatHistory.push({ role: 'assistant', content: fallback });
  }

  document.getElementById('chat-messages').scrollTop = 9999;
  sendBtn.disabled = false;
}

function appendChatMsg(text, isUser) {
  const area = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = 'chat-msg' + (isUser ? ' user' : '');
  div.innerHTML = `
    <div class="chat-avatar">${isUser ? 'J' : '🐋'}</div>
    <div class="chat-bubble">${isUser ? escHtml(text) : ''}</div>`;
  area.appendChild(div);
  area.scrollTop = 9999;
  return div;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function chatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 180) + 'px';
}

// ═══════════════════════════════════════════════════════════
// UPLOADS
// ═══════════════════════════════════════════════════════════
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

async function uploadFiles(files) {
  for (const file of files) {
    const isImage = IMAGE_TYPES.includes(file.type) || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
    console.log('[Upload] Starte Upload:', file.name, file.type, isImage ? '(Bild → Vision)' : '');

    // Bild hochladen
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await r.json();
      console.log('[Upload] Response:', d);

      if (!d.filename) {
        addNeoMsg(`Upload fehlgeschlagen: ${d.error || 'Unbekannter Fehler'}`);
        continue;
      }

      if (isImage) {
        // Vision-Extraktion starten
        addNeoMsg(`"${d.filename}" hochgeladen. Neo liest den Text aus… 🔍`);
        await extractImageText(file, d.filename);
      } else {
        addNeoMsg(`"${d.filename}" hochgeladen ✓ — ich nutze es beim Lernen.`);
      }

      await loadUploads();
    } catch(e) {
      console.error('[Upload] Fehler:', e);
      addNeoMsg(`Upload-Fehler: ${e.message}`);
    }
  }
}

async function extractImageText(file, originalFilename) {
  try {
    // Bild als base64 lesen
    const base64 = await fileToBase64(file);
    const mediaType = file.type || 'image/jpeg';

    console.log('[Vision] Sende Bild an Claude:', originalFilename, '(' + Math.round(base64.length / 1024) + ' KB base64)');

    // Claude API mit Vision aufrufen
    const message = {
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 }
        },
        {
          type: 'text',
          text: `Extrahiere den gesamten Text aus diesem Bild vollständig und exakt.
Behalte die Struktur (Überschriften, Aufzählungen, Tabellen) bei.
Falls es sich um Lerninhalte/Themenvorgaben handelt: strukturiere sie klar mit Überschriften.
Gib NUR den extrahierten Text zurück, keinen Kommentar davor oder dahinter.`
        }
      ]
    };

    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [message],
        system: 'Du extrahierst Text aus Bildern für Joels Lern-Assistent Neo. Präzise und vollständig.',
        max_tokens: 2000,
      }),
    });

    if (!r.ok) throw new Error('API ' + r.status);
    const data = await r.json();
    const extractedText = data.content?.[0]?.text || '';

    if (!extractedText.trim()) throw new Error('Kein Text extrahiert');

    console.log('[Vision] Extrahiert:', extractedText.slice(0, 100));

    // Als .md Datei speichern
    const mdFilename = originalFilename.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '_extracted.md');
    const mdContent  = `# Extrahiert aus: ${originalFilename}\n*Automatisch via Neo Vision am ${today()}*\n\n---\n\n${extractedText}`;

    const saveR = await fetch('/api/save-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: mdFilename, content: mdContent }),
    });

    if (!saveR.ok) throw new Error('Speichern fehlgeschlagen');

    addNeoMsg(`Text aus "${originalFilename}" extrahiert ✓ → gespeichert als "${mdFilename}". Ich nutze ihn beim Lernen.`);
    console.log('[Vision] Gespeichert als:', mdFilename);

  } catch(e) {
    console.error('[Vision] Fehler:', e);
    addNeoMsg(`Vision-Extraktion fehlgeschlagen: ${e.message}. Das Bild ist trotzdem hochgeladen.`);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => {
      // DataURL ist "data:image/jpeg;base64,XXXX" — nur den base64-Teil
      const b64 = reader.result.split(',')[1];
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadUploads() {
  try {
    const r = await fetch('/api/uploads');
    if (!r.ok) { console.error('[Uploads] API error:', r.status); return; }
    const files = await r.json();
    console.log('[Uploads] Dateien auf Server:', files);
    store.set('uploads', files);
    renderFileList();
  } catch(e) { console.warn('[Uploads] Offline oder Fehler:', e.message); }
}

async function deleteUpload(filename) {
  if (!confirm(`"${filename}" löschen?`)) return;
  try {
    const r = await fetch('/api/delete/' + encodeURIComponent(filename), { method: 'POST' });
    if (r.ok) {
      addNeoMsg(`"${filename}" gelöscht.`);
      await loadUploads();
    }
  } catch(e) { console.error('[Delete]', e); }
}

function renderFileList() {
  const list = document.getElementById('file-list');
  if (!list) return;
  const files = store.get('uploads') || [];
  if (files.length === 0) {
    list.innerHTML = '<div style="color:var(--text-mute);font-size:0.85rem">Noch keine Dateien.</div>';
    return;
  }
  list.innerHTML = files.map(f => `
    <div class="file-item" style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border-dim)">
      <span style="flex:1">📄 ${escHtml(f)}</span>
      <span style="font-size:0.72rem;color:var(--text-mute)">${f.endsWith('.md')?'MD':f.endsWith('.pdf')?'PDF':f.endsWith('.txt')?'TXT':'FILE'}</span>
      <button class="tx-del" onclick="deleteUpload('${escHtml(f)}')" title="Löschen">✕</button>
    </div>`).join('');
}

function resetData() {
  if (!confirm('Alle Daten löschen?')) return;
  Object.keys(localStorage).filter(k => k.startsWith('neo_')).forEach(k => localStorage.removeItem(k));
  location.reload();
}

// ═══════════════════════════════════════════════════════════
// WHALE EASTER EGG
// ═══════════════════════════════════════════════════════════
function whaleTap() {
  const container = document.getElementById('sidebar-whale') || document.getElementById('nav-whale');
  if (!container) return;
  const img = container.querySelector('.whale-img');
  if (img) {
    img.classList.remove('wiggle');
    void img.offsetWidth; // reflow to restart animation
    img.classList.add('wiggle');
    setTimeout(() => img.classList.remove('wiggle'), 550);
  }
  const tip = document.getElementById('whale-tooltip');
  tip.textContent = WHALE_FACTS[Math.floor(Math.random() * WHALE_FACTS.length)];
  tip.style.display = 'block';
  setTimeout(() => { tip.style.display = 'none'; }, 4000);
}

function triggerWhaleEvent(type) {
  ['nav-whale', 'sidebar-whale'].forEach(id => {
    const img = document.querySelector('#' + id + ' .whale-img');
    if (!img) return;
    const cls = type === 'done' ? 'jump' : 'wiggle';
    img.classList.remove(cls);
    void img.offsetWidth;
    img.classList.add(cls);
    setTimeout(() => img.classList.remove(cls), 750);
  });
}

// ═══════════════════════════════════════════════════════════
// ERNÄHRUNG
// ═══════════════════════════════════════════════════════════
const MEAL_SLOTS = [
  { id: 'breakfast', label: 'MORGEN' },
  { id: 'lunch',     label: 'MITTAG' },
  { id: 'dinner',    label: 'ABEND'  },
];
const DEFAULT_FAVS = ['Oatmeal', 'Reis + Hähnchen', 'Quark', 'Eier', 'Protein-Shake', 'Brot + Aufschnitt'];

function getNutrition() { return store.get('nutrition_' + today()) || { water: 0, meals: {}, ratings: {} }; }
function saveNutrition(data) { store.set('nutrition_' + today(), data); }

function renderNutrition() {
  const data = getNutrition();
  // Wasser
  const w = data.water || 0;
  const wEl = document.getElementById('water-amount');
  const wBar = document.getElementById('water-bar');
  if (wEl) wEl.textContent = (w === 0 ? '0' : Number(w.toFixed(2)).toString()) + 'L';
  if (wBar) wBar.style.width = Math.min(100, (w / 2.5) * 100) + '%';

  // Mahlzeiten
  const meals = document.getElementById('nutrition-meals');
  if (meals) {
    meals.innerHTML = MEAL_SLOTS.map(slot => {
      const meal   = data.meals?.[slot.id] || {};
      const rating = data.ratings?.[slot.id] || '';
      const done   = !!meal.done;
      return `<div class="meal-card${done ? ' done' : ''}">
        <div class="meal-title">
          <span>${slot.label}</span>
          <div style="display:flex;gap:4px">
            ${['🟢','🟡','🔴'].map(r => `<button class="meal-rating-btn${rating===r?' active':''}"
              onclick="setMealRating('${slot.id}','${r}')">${r}</button>`).join('')}
          </div>
        </div>
        <textarea class="meal-textarea" rows="2" placeholder="Was gegessen?"
          onchange="saveMeal('${slot.id}','text',this.value)">${escHtml(meal.text || '')}</textarea>
        <label class="meal-done-check">
          <div class="goal-check${done?' checked':''}" onclick="toggleMealDone('${slot.id}')">
            ${done?'✓':''}
          </div>
          Erledigt
        </label>
      </div>`;
    }).join('');
  }

  // Favoriten
  renderFavs();
  // Wochenübersicht
  renderNutritionWeek();
  // Protein-Check
  checkProtein(data);
}

function addWater(amount) {
  const data = getNutrition();
  data.water = Math.min(5, (data.water || 0) + amount);
  saveNutrition(data); renderNutrition();
}
function resetWater() {
  const data = getNutrition(); data.water = 0; saveNutrition(data); renderNutrition();
}
function saveMeal(slotId, field, value) {
  const data = getNutrition();
  if (!data.meals) data.meals = {};
  if (!data.meals[slotId]) data.meals[slotId] = {};
  data.meals[slotId][field] = value;
  saveNutrition(data);
}
function toggleMealDone(slotId) {
  const data = getNutrition();
  if (!data.meals) data.meals = {};
  if (!data.meals[slotId]) data.meals[slotId] = {};
  data.meals[slotId].done = !data.meals[slotId].done;
  saveNutrition(data); renderNutrition();
}
function setMealRating(slotId, rating) {
  const data = getNutrition();
  if (!data.ratings) data.ratings = {};
  data.ratings[slotId] = rating;
  saveNutrition(data); renderNutrition();
}
function resetNutritionDay() {
  store.del('nutrition_' + today()); renderNutrition();
}

function renderFavs() {
  const el   = document.getElementById('nutrition-favs');
  if (!el) return;
  const favs = store.get('nutrition_favs') || DEFAULT_FAVS;
  el.innerHTML = favs.map((f, i) => `
    <div class="fav-chip" onclick="useFav('${escHtml(f)}')">
      ${escHtml(f)}
      <span class="fav-chip-del" onclick="event.stopPropagation();deleteFav(${i})">✕</span>
    </div>`).join('');
}
function useFav(text) {
  // Füge in letzte leere Mahlzeit ein
  const data = getNutrition();
  for (const slot of MEAL_SLOTS) {
    if (!data.meals?.[slot.id]?.text) {
      saveMeal(slot.id, 'text', text); renderNutrition(); return;
    }
  }
  addNeoMsg(`Alle Mahlzeiten eingetragen. "${text}" — wo soll ich das eintragen?`);
}
function addFav() {
  const input = document.getElementById('fav-input');
  const text  = input?.value?.trim();
  if (!text) return;
  const favs = store.get('nutrition_favs') || DEFAULT_FAVS;
  favs.push(text); store.set('nutrition_favs', favs);
  input.value = ''; renderFavs();
}
function deleteFav(i) {
  const favs = store.get('nutrition_favs') || DEFAULT_FAVS;
  favs.splice(i, 1); store.set('nutrition_favs', favs); renderFavs();
}

function renderNutritionWeek() {
  const el   = document.getElementById('nutrition-week');
  if (!el) return;
  const days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
  const now  = new Date();
  el.innerHTML = Array.from({length:7}, (_,i) => {
    const d = new Date(now); d.setDate(now.getDate() - (6-i));
    const key  = d.toISOString().slice(0,10);
    const data = store.get('nutrition_' + key) || {};
    const ratings = Object.values(data.ratings || {});
    let cls = 'nw-empty';
    if (ratings.length) {
      const score = ratings.reduce((a,r) => a + (r==='🟢'?2:r==='🟡'?1:0), 0);
      cls = score >= 4 ? 'nw-green' : score >= 2 ? 'nw-yellow' : 'nw-red';
    }
    return `<div class="nutrition-week-day">
      <div class="nw-day-dot ${cls}" title="${key}"></div>
      <div class="nw-day-label">${days[d.getDay()]}</div>
    </div>`;
  }).join('');
}

function checkProtein(data) {
  const breakfast = data.meals?.breakfast?.text?.toLowerCase() || '';
  const lowProtein = ['toast','brötchen','cornflakes','müsli','marmelade','nutella','croissant'];
  if (breakfast && lowProtein.some(p => breakfast.includes(p))) {
    setTimeout(() => addNeoMsg('Dein Gehirn braucht heute Protein. Energie fällt sonst gegen 11 Uhr weg. Quark, Eier oder Shake als Ergänzung?'), 1500);
  }
}

// ═══════════════════════════════════════════════════════════
// FINANZEN
// ═══════════════════════════════════════════════════════════
function getFinance() { return store.get('finance') || { budget: 500, transactions: [], clients: [] }; }
function saveFinance(d) { store.set('finance', d); }

function renderFinanzen() {
  const fin  = getFinance();
  const now  = new Date();
  const thisMonth = now.toISOString().slice(0,7);

  const txMonth = (fin.transactions || []).filter(t => t.date?.startsWith(thisMonth));
  const income   = txMonth.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);
  const expense  = txMonth.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
  const balance  = income - expense;

  const $ = id => document.getElementById(id);
  if ($('fin-income'))   $('fin-income').textContent   = income.toFixed(2) + ' €';
  if ($('fin-expenses')) $('fin-expenses').textContent = expense.toFixed(2) + ' €';
  if ($('fin-balance'))  $('fin-balance').textContent  = balance.toFixed(2) + ' €';
  if ($('fin-balance'))  $('fin-balance').style.color  = balance >= 0 ? 'var(--cyan)' : 'var(--red)';
  if ($('fin-budget-input')) $('fin-budget-input').value = fin.budget || 500;

  // Kindergeld-Countdown
  const abi2027 = new Date('2027-04-01');
  const months = Math.max(0, Math.ceil((abi2027 - now) / (1000*60*60*24*30.44)));
  if ($('kindergeld-months')) $('kindergeld-months').textContent = months;

  // MRR (aktive Kunden × 29€ + manuelle Einnahmen)
  const clients = fin.clients || [];
  const mrr = clients.filter(c=>c.status==='active').length * 29;
  const mrrPct = Math.min(100, Math.round(mrr/700*100));
  if ($('mrr-current')) $('mrr-current').textContent = mrr + ' €';
  if ($('mrr-bar'))     $('mrr-bar').style.width     = mrrPct + '%';
  if ($('mrr-pct'))     $('mrr-pct').textContent     = mrrPct + '%';

  renderClients(fin);
  renderTransactions(fin, 'income');
  renderTransactions(fin, 'expense');
}

function saveBudget(val) {
  const fin = getFinance(); fin.budget = parseFloat(val)||500; saveFinance(fin); renderFinanzen();
}

function renderClients(fin) {
  const el = document.getElementById('clients-list');
  if (!el) return;
  const clients = fin.clients || [];
  if (!clients.length) { el.innerHTML = '<div style="color:var(--text-mute);font-size:0.82rem">Noch keine Kunden.</div>'; return; }
  const statusMap = { active:'status-active', pause:'status-pause', prospect:'status-prospect' };
  const statusLabel = { active:'Aktiv', pause:'Pausiert', prospect:'Interessent' };
  el.innerHTML = clients.map((c,i) => `
    <div class="client-row">
      <span class="client-status ${statusMap[c.status]||'status-prospect'}"
        onclick="cycleClientStatus(${i})">${statusLabel[c.status]||'Interessent'}</span>
      <input class="ex-note" style="flex:1" value="${escHtml(c.name)}"
        onchange="updateClient(${i},'name',this.value)" placeholder="Kundenname"/>
      <span style="font-family:'JetBrains Mono',monospace;font-size:0.82rem;color:var(--green)">
        ${c.status==='active'?'29 €/Mo':'—'}
      </span>
      <button class="tx-del" onclick="deleteClient(${i})">✕</button>
    </div>`).join('') +
    `<div style="margin-top:10px;font-size:0.82rem;color:var(--text-mute)">
      MRR aus Kunden: <span style="color:var(--green)">${clients.filter(c=>c.status==='active').length * 29} €</span>
    </div>`;
}

function addClient() {
  const fin = getFinance();
  fin.clients = fin.clients || [];
  fin.clients.push({ name: 'Neuer Kunde', status: 'prospect' });
  saveFinance(fin); renderFinanzen();
}
function updateClient(i, field, val) {
  const fin = getFinance(); fin.clients[i][field] = val; saveFinance(fin);
}
function deleteClient(i) {
  const fin = getFinance(); fin.clients.splice(i,1); saveFinance(fin); renderFinanzen();
}
function cycleClientStatus(i) {
  const fin = getFinance();
  const statuses = ['prospect','active','pause'];
  const cur = fin.clients[i].status || 'prospect';
  fin.clients[i].status = statuses[(statuses.indexOf(cur)+1)%statuses.length];
  saveFinance(fin); renderFinanzen();
}

function renderTransactions(fin, type) {
  const el = document.getElementById(type === 'income' ? 'income-list' : 'expense-list');
  if (!el) return;
  const now  = new Date().toISOString().slice(0,7);
  const txs  = (fin.transactions||[]).filter(t=>t.type===type && t.date?.startsWith(now));
  if (!txs.length) { el.innerHTML = '<div style="color:var(--text-mute);font-size:0.8rem">Keine Einträge.</div>'; return; }
  el.innerHTML = txs.map((t,i) => `
    <div class="transaction-row">
      <span class="tx-amount ${type==='income'?'tx-income':'tx-expense'}">${type==='income'?'+':'−'}${t.amount.toFixed(2)} €</span>
      <div><div style="font-size:0.82rem">${escHtml(t.label||'')}</div>
        <div class="tx-meta">${t.date||''}</div></div>
      <button class="tx-del" onclick="deleteTransaction('${t.id}')">✕</button>
    </div>`).join('');
}

function addTransaction(type) {
  const amount = parseFloat(prompt(type==='income'?'Betrag (€):':'Betrag (€):'));
  if (!amount || isNaN(amount)) return;
  const label  = prompt(type==='income'?'Quelle (z.B. Website-Kunde):':'Kategorie:') || '';
  const fin    = getFinance();
  fin.transactions = fin.transactions || [];
  fin.transactions.unshift({ id: Date.now()+'', type, amount, label, date: today() });
  saveFinance(fin); renderFinanzen();
}
function deleteTransaction(id) {
  const fin = getFinance();
  fin.transactions = fin.transactions.filter(t=>t.id!==id);
  saveFinance(fin); renderFinanzen();
}

// ═══════════════════════════════════════════════════════════
// HABITS
// ═══════════════════════════════════════════════════════════
const DEFAULT_HABITS = [
  { id:'h1', name:'💊 Medikinet genommen', streak:0, best:0 },
  { id:'h2', name:'🏋️ Gym',               streak:0, best:0 },
  { id:'h3', name:'💧 2.5L Wasser',        streak:0, best:0 },
  { id:'h4', name:'📚 Gelernt heute',       streak:0, best:0 },
  { id:'h5', name:'🌅 Draußen gewesen',     streak:0, best:0 },
  { id:'h6', name:'😴 Vor 23 Uhr ins Bett', streak:0, best:0 },
  { id:'h7', name:'🚶 Spaziergang',         streak:0, best:0 },
];

function getHabits() { return store.get('habits_list') || DEFAULT_HABITS.map(h=>({...h})); }
function getHabitLog() { return store.get('habits_log') || {}; }

function renderHabits() {
  const habits   = getHabits();
  const log      = getHabitLog();
  const todayLog = log[today()] || {};

  const dateEl = document.getElementById('habit-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});

  const listEl = document.getElementById('habits-today');
  if (listEl) {
    listEl.innerHTML = habits.map(h => {
      const done = !!todayLog[h.id];
      return `<div class="habit-row">
        <div class="habit-check${done?' done':''}" onclick="toggleHabit('${h.id}')">${done?'✓':''}</div>
        <span class="habit-name">${h.name}</span>
        <span class="habit-streak">${h.streak>0?'🔥'+h.streak:''}</span>
        <button class="habit-del" onclick="deleteHabit('${h.id}')">✕</button>
      </div>`;
    }).join('');
  }

  renderHeatmap(habits, log);

  // Reflexion laden
  const refl = store.get('habit_reflection') || {};
  const imp  = document.getElementById('habit-improve');
  const lea  = document.getElementById('habit-learned');
  if (imp) imp.value = refl.improve || '';
  if (lea) lea.value = refl.learned || '';

  // Wöchentliche Frage von Neo
  const qEl = document.getElementById('habit-question');
  const questions = [
    'Was ist die eine Angewohnheit, die alles andere einfacher macht?',
    'Welcher Habit fühlt sich am schwersten an — und warum?',
    'Was würde sich verändern, wenn du 30 Tage keinen Tag aussetzt?',
    'Wann in deinem Tag hast du die meiste Energie für neue Habits?',
  ];
  if (qEl) qEl.textContent = '// ' + questions[new Date().getDay() % questions.length];
}

function toggleHabit(id) {
  const log = getHabitLog();
  if (!log[today()]) log[today()] = {};
  const wasDone = !!log[today()][id];
  log[today()][id] = !wasDone;
  store.set('habits_log', log);

  // Streak aktualisieren
  const habits = getHabits();
  const h = habits.find(h=>h.id===id);
  if (h) {
    if (!wasDone) {
      h.streak++;
      h.best = Math.max(h.best||0, h.streak);
    } else {
      h.streak = Math.max(0, h.streak-1);
    }
    store.set('habits_list', habits);
  }
  renderHabits();
}

function addHabit() {
  const name = prompt('Name des neuen Habits:');
  if (!name?.trim()) return;
  const habits = getHabits();
  habits.push({ id:'h'+Date.now(), name:name.trim(), streak:0, best:0 });
  store.set('habits_list', habits); renderHabits();
}
function deleteHabit(id) {
  const habits = getHabits().filter(h=>h.id!==id);
  store.set('habits_list', habits); renderHabits();
}

function renderHeatmap(habits, log) {
  const el = document.getElementById('habit-heatmap');
  if (!el) return;
  const total = habits.length || 1;
  const days  = 28;
  const now   = new Date();
  el.innerHTML = '<div class="heatmap-grid">' + Array.from({length:days},(_,i)=>{
    const d = new Date(now); d.setDate(now.getDate() - (days-1-i));
    const key = d.toISOString().slice(0,10);
    const done = Object.values(log[key]||{}).filter(Boolean).length;
    const pct  = done/total;
    const cls  = pct===0?'':pct<0.33?'h1':pct<0.66?'h2':pct<1?'h3':'h4';
    return `<div class="heatmap-day ${cls}" title="${key}: ${done}/${total}"></div>`;
  }).join('') + '</div>';
}

function saveReflection() {
  const refl = {
    improve: document.getElementById('habit-improve')?.value || '',
    learned: document.getElementById('habit-learned')?.value || '',
    date: today(),
  };
  store.set('habit_reflection', refl);
}

async function analyzeHabits() {
  const el = document.getElementById('habit-pattern');
  if (!el) return;
  el.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  const habits = getHabits();
  const log    = getHabitLog();
  const last14 = Array.from({length:14},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    const done = habits.filter(h=>log[key]?.[h.id]).map(h=>h.name).join(', ');
    return `${key}: ${done||'nichts'}`;
  }).join('\n');

  try {
    const text = await callNeo([{role:'user',content:
      `Analysiere Joels Habit-Daten der letzten 14 Tage und erkenne Muster:\n${last14}\n\n
Erkenne 2-3 konkrete Muster. Kein Lob, direkte Analyse. Max 4 Sätze.`}],'',400);
    el.textContent = text;
  } catch(e) {
    el.textContent = 'Analyse nicht verfügbar — API nicht erreichbar.';
  }
}

// ═══════════════════════════════════════════════════════════
// TASKS & LIFE PLANNER
// ═══════════════════════════════════════════════════════════
const DEFAULT_MILESTONES = [
  { id:'m1', text:'Schriftliches Abi bestanden', done:true },
  { id:'m2', text:'Mündliches Abi bestehen', done:false },
  { id:'m3', text:'Einschreibung Osnabrück', done:false },
  { id:'m4', text:'Perceive: erstes Video live', done:false },
  { id:'m5', text:'TimeReal: erste Ideen skizziert', done:false },
  { id:'m6', text:'Studienstart Oktober 2026', done:false },
];
const TASK_CATEGORIES = ['Abi','Gym','Perceive','Finanzen','Sonstiges'];
const TASK_PRIOS      = ['high','mid','low'];
const PRIO_LABELS     = { high:'Hoch 🔴', mid:'Mittel 🟡', low:'Low 🟢' };
const PRIO_CLS        = { high:'prio-high', mid:'prio-mid', low:'prio-low' };

function getTasks() { return store.get('tasks') || { today:[], backlog:[], xp:0 }; }
function saveTasks(t) { store.set('tasks', t); }
function getLifePlan() { return store.get('life_plan') || { weekGoals:['','',''], monthFocus:'', monthGoals:['','',''], milestones: DEFAULT_MILESTONES }; }
function saveLifePlan() {
  const lp = getLifePlan();
  lp.monthFocus = document.getElementById('month-focus')?.value || lp.monthFocus;
  store.set('life_plan', lp);
}

function renderTasks() {
  const tasks = getTasks();
  renderTaskList('tasks-today',  tasks.today,  'today');
  renderTaskList('tasks-backlog', tasks.backlog, 'backlog');
  const xpEl = document.getElementById('tasks-xp');
  if (xpEl) xpEl.textContent = (tasks.xp||0) + ' XP';
  renderLifePlanner();
  if (hour() >= 19) {
    const rc = document.getElementById('daily-review-card');
    if (rc) rc.style.display = '';
    const review = store.get('daily_review_' + today()) || {};
    const rw = document.getElementById('review-win');
    const rb = document.getElementById('review-better');
    if (rw) rw.value = review.win || '';
    if (rb) rb.value = review.better || '';
  }
}

function renderTaskList(elId, list, slot) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!list?.length) { el.innerHTML = '<div style="color:var(--text-mute);font-size:0.8rem;padding:8px 0">Keine Tasks.</div>'; return; }
  el.innerHTML = list.map((t,i) => `
    <div class="task-item">
      <div class="task-check${t.done?' done':''}" onclick="toggleTask('${slot}',${i})">${t.done?'✓':''}</div>
      <div style="flex:1">
        <div class="task-title${t.done?' done':''}">${escHtml(t.title)}</div>
        <div style="font-size:0.72rem;color:var(--text-mute);margin-top:2px">${t.cat||''}</div>
      </div>
      <span class="task-prio ${PRIO_CLS[t.prio]||'prio-low'}">${t.prio||'low'}</span>
      ${slot==='backlog'?`<button class="task-to-today" onclick="moveToToday(${i})">→ Heute</button>`:''}
      <button class="task-del" onclick="deleteTask('${slot}',${i})">✕</button>
    </div>`).join('');
}

function addTask(slot) {
  const title = prompt('Task-Titel:');
  if (!title?.trim()) return;
  const prio  = prompt('Priorität: high / mid / low') || 'mid';
  const cat   = prompt('Kategorie: ' + TASK_CATEGORIES.join(' / ')) || 'Sonstiges';
  const tasks = getTasks();
  if (slot==='today' && tasks.today.length >= 5) {
    alert('Max 5 Tasks für heute.'); return;
  }
  tasks[slot].push({ id: Date.now()+'', title:title.trim(), prio, cat, done:false });
  saveTasks(tasks); renderTasks();
}

function toggleTask(slot, i) {
  const tasks = getTasks();
  const task  = tasks[slot][i];
  if (!task) return;
  task.done = !task.done;
  if (task.done) {
    const xpGain = task.prio==='high'?30:task.prio==='mid'?20:10;
    tasks.xp = (tasks.xp||0) + xpGain;
    triggerWhaleEvent('done');
    addNeoMsg(`Task erledigt. +${xpGain} XP 💪`);
  }
  saveTasks(tasks); renderTasks();
}

function deleteTask(slot, i) {
  const tasks = getTasks(); tasks[slot].splice(i,1); saveTasks(tasks); renderTasks();
}

function moveToToday(i) {
  const tasks = getTasks();
  if (tasks.today.length >= 5) { addNeoMsg('Heute sind schon 5 Tasks — erledige erst einen.'); return; }
  const task = tasks.backlog.splice(i,1)[0];
  tasks.today.push(task); saveTasks(tasks); renderTasks();
}

function renderLifePlanner() {
  const lp = getLifePlan();

  // Wochenziele
  const wgEl = document.getElementById('week-goals');
  if (wgEl) {
    wgEl.innerHTML = (lp.weekGoals||['','','']).map((g,i) => `
      <div class="week-goal-row">
        <div class="week-goal-check${g?.done?' done':''}" onclick="toggleWeekGoal(${i})">${g?.done?'✓':''}</div>
        <input class="ex-note" style="flex:1" value="${escHtml(g?.text||g||'')}"
          onchange="saveWeekGoal(${i},this.value)" placeholder="Wochenziel ${i+1}…"/>
      </div>`).join('');
  }

  // Monatsfokus
  const mf = document.getElementById('month-focus');
  if (mf) mf.value = lp.monthFocus || '';

  // Monatsziele
  const mgEl = document.getElementById('month-goals');
  if (mgEl) {
    const mg = lp.monthGoals || ['','',''];
    mgEl.innerHTML = mg.map((g,i) => `
      <div style="display:flex;gap:8px;margin-top:6px">
        <input class="ex-note" style="flex:1" value="${escHtml(g)}"
          onchange="saveMonthGoal(${i},this.value)" placeholder="Monatsziel ${i+1}…"/>
      </div>`).join('');
  }

  // Meilensteine
  const msEl = document.getElementById('milestones-list');
  if (msEl) {
    const ms = lp.milestones || DEFAULT_MILESTONES;
    msEl.innerHTML = ms.map(m => `
      <div class="milestone-row">
        <span class="milestone-check">${m.done?'✅':'⬜'}</span>
        <span style="flex:1;${m.done?'text-decoration:line-through;color:var(--text-mute)':''}">${escHtml(m.text)}</span>
        <div class="goal-check${m.done?' checked':''}" onclick="toggleMilestone('${m.id}')">${m.done?'✓':''}</div>
      </div>`).join('');
  }
}

function saveWeekGoal(i, val) {
  const lp = getLifePlan();
  const wg = lp.weekGoals || ['','',''];
  const cur = wg[i];
  wg[i] = typeof cur === 'object' ? {...cur, text:val} : { text:val, done:false };
  lp.weekGoals = wg; store.set('life_plan', lp);
}
function toggleWeekGoal(i) {
  const lp = getLifePlan();
  const wg = lp.weekGoals || ['','',''];
  const cur = wg[i];
  wg[i] = typeof cur === 'object' ? {...cur, done:!cur.done} : { text:cur||'', done:true };
  lp.weekGoals = wg; store.set('life_plan', lp); renderLifePlanner();
}
function saveMonthGoal(i, val) {
  const lp = getLifePlan();
  const mg = lp.monthGoals || ['','',''];
  mg[i] = val; lp.monthGoals = mg; store.set('life_plan', lp);
}
function toggleMilestone(id) {
  const lp = getLifePlan();
  const ms = lp.milestones || DEFAULT_MILESTONES;
  const m  = ms.find(m=>m.id===id);
  if (m) { m.done = !m.done; if(m.done) triggerWhaleEvent('done'); }
  lp.milestones = ms; store.set('life_plan', lp); renderLifePlanner();
}
function saveReview(close=false) {
  const review = {
    win:    document.getElementById('review-win')?.value    || '',
    better: document.getElementById('review-better')?.value || '',
    date:   today(),
  };
  store.set('daily_review_' + today(), review);
  if (close) addNeoMsg('Review gespeichert. Morgen wieder. 💪');
}

// ─── Evening Check ────────────────────────────────────────
function checkEvening() {
  if (hour() >= 18) {
    setTimeout(() => addNeoMsg('Guter Zeitpunkt für einen Tagesabschluss. "Tag abschließen" in der Übersicht.'), 3000);
  }
}

// ═══════════════════════════════════════════════════════════
// GOOGLE CALENDAR
// ═══════════════════════════════════════════════════════════
const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
let gcalTokenClient = null;
let gcalAccessToken = null;

function initGCal() {
  const clientId = store.get('gcal_client_id');
  if (!clientId || typeof google === 'undefined') return;
  try {
    gcalTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GCAL_SCOPE,
      callback: (resp) => {
        if (resp.error) { console.error('[GCal] OAuth error:', resp.error); return; }
        gcalAccessToken = resp.access_token;
        store.set('gcal_connected', true);
        fetchCalendarEvents();
        renderGCalSettings();
      },
    });
  } catch(e) {
    console.warn('[GCal] Google Identity Services not loaded yet:', e.message);
  }
}

function renderGCalSettings() {
  const clientId   = store.get('gcal_client_id');
  const connected  = store.get('gcal_connected');
  const statusMsg  = document.getElementById('gcal-status-msg');
  const setupEl    = document.getElementById('gcal-setup');
  const actionsEl  = document.getElementById('gcal-actions');

  if (!statusMsg) return;

  if (!clientId) {
    statusMsg.innerHTML = '<span style="color:var(--text-mute)">Nicht eingerichtet.</span>';
    if (setupEl) setupEl.style.display = '';
    if (actionsEl) actionsEl.innerHTML = '';
  } else if (connected) {
    statusMsg.innerHTML = '<span class="gcal-connected">✓ Verbunden</span> — Termine werden geladen.';
    if (setupEl) setupEl.style.display = 'none';
    if (actionsEl) actionsEl.innerHTML = `
      <button class="btn btn-sm" onclick="gcalConnect()">🔄 Neu laden</button>
      <button class="btn btn-sm" onclick="gcalDisconnect()">Trennen</button>`;
  } else {
    statusMsg.innerHTML = `<span style="color:var(--amber)">Client-ID gespeichert</span> — noch nicht verbunden.`;
    if (setupEl) setupEl.style.display = 'none';
    if (actionsEl) actionsEl.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="gcalConnect()">🗓 Mit Google verbinden</button>
      <button class="btn btn-sm" onclick="gcalShowSetup()">Einstellungen ändern</button>`;
  }

  const input = document.getElementById('gcal-client-id-input');
  if (input && clientId) input.value = clientId;
}

function gcalShowSetup() {
  const el = document.getElementById('gcal-setup');
  if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
}

function saveGCalClientId() {
  const input = document.getElementById('gcal-client-id-input');
  const id    = input?.value?.trim();
  if (!id || !id.includes('.apps.googleusercontent.com')) {
    alert('Ungültige Client-ID — muss auf .apps.googleusercontent.com enden.'); return;
  }
  store.set('gcal_client_id', id);
  store.del('gcal_connected');
  gcalTokenClient = null;
  initGCal();
  renderGCalSettings();
}

function gcalConnect() {
  if (!gcalTokenClient) { initGCal(); }
  if (!gcalTokenClient) { alert('Google Identity Services nicht geladen. Seite neu laden.'); return; }
  gcalTokenClient.requestAccessToken();
}

function gcalDisconnect() {
  if (gcalAccessToken && typeof google !== 'undefined') {
    google.accounts.oauth2.revoke(gcalAccessToken);
  }
  gcalAccessToken = null;
  store.del('gcal_connected');
  store.del('gcal_events_' + today());
  renderGCalSettings();
  hideCalendarWidgets();
}

function hideCalendarWidgets() {
  const strip = document.getElementById('cal-strip');
  const card  = document.getElementById('cal-overview-card');
  if (strip) strip.style.display = 'none';
  if (card)  card.style.display  = 'none';
}

async function fetchCalendarEvents() {
  if (!gcalAccessToken) {
    // Versuche gespeicherte Events zu zeigen
    const cached = store.get('gcal_events_' + today());
    if (cached) { renderCalendarEvents(cached); return; }
    return;
  }
  try {
    const now        = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(endOfDay)}` +
      `&singleEvents=true&orderBy=startTime&maxResults=10`;

    const resp = await fetch(url, {
      headers: { Authorization: 'Bearer ' + gcalAccessToken }
    });

    if (!resp.ok) {
      console.error('[GCal] API error:', resp.status);
      if (resp.status === 401) { gcalAccessToken = null; store.del('gcal_connected'); }
      return;
    }

    const data   = await resp.json();
    const events = (data.items || []).map(ev => ({
      id:    ev.id,
      title: ev.summary || 'Termin',
      start: ev.start?.dateTime || ev.start?.date,
      end:   ev.end?.dateTime   || ev.end?.date,
      allDay: !ev.start?.dateTime,
      location: ev.location || '',
    }));

    store.set('gcal_events_' + today(), events);
    renderCalendarEvents(events);
  } catch(e) {
    console.error('[GCal] Fetch error:', e);
  }
}

function renderCalendarEvents(events) {
  if (!events?.length) { hideCalendarWidgets(); return; }

  // Startscreen Strip
  const strip = document.getElementById('cal-strip');
  if (strip) {
    strip.style.display = 'flex';
    strip.innerHTML = events.slice(0,4).map(ev => {
      const timeStr = ev.allDay ? 'Ganztags' : formatEventTime(ev.start);
      return `<div class="cal-event-chip">
        <span class="cal-event-time">${timeStr}</span>
        <span>${escHtml(ev.title)}</span>
      </div>`;
    }).join('');
  }

  // Übersicht Card
  const card    = document.getElementById('cal-overview-card');
  const listEl  = document.getElementById('cal-overview-list');
  if (card && listEl) {
    card.style.display = '';
    listEl.innerHTML = events.map(ev => {
      const timeStr = ev.allDay ? 'Ganztags' : formatEventTime(ev.start) + ' – ' + formatEventTime(ev.end);
      return `<div class="cal-event-row">
        <span class="cal-event-row-time">${timeStr}</span>
        <span>${escHtml(ev.title)}</span>
        ${ev.location ? `<span style="color:var(--text-mute);font-size:0.72rem;margin-left:auto">📍 ${escHtml(ev.location)}</span>` : ''}
      </div>`;
    }).join('');
  }
}

function formatEventTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
}

// ═══════════════════════════════════════════════════════════
// SCHNELL-NOTIZ
// ═══════════════════════════════════════════════════════════
function openQuickNote() {
  const overlay = document.getElementById('quick-note-overlay');
  const input   = document.getElementById('quick-note-input');
  if (overlay) { overlay.classList.add('open'); input?.focus(); }
}

function closeQuickNote() {
  const overlay = document.getElementById('quick-note-overlay');
  if (overlay) overlay.classList.remove('open');
}

function saveQuickNote() {
  const input = document.getElementById('quick-note-input');
  const text  = input?.value?.trim();
  if (!text) { closeQuickNote(); return; }
  const notes = store.get('quick_notes') || [];
  notes.unshift({ id: Date.now(), text, date: today(), time: new Date().toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' }) });
  store.set('quick_notes', notes);
  input.value = '';
  closeQuickNote();
  renderNotesList();
  addNeoMsg('Notiz gespeichert. 📝');
}

function renderNotesList() {
  const list  = document.getElementById('notes-list');
  if (!list) return;
  const notes = store.get('quick_notes') || [];
  if (notes.length === 0) {
    list.innerHTML = '<div style="color:var(--text-mute);font-size:0.82rem">Noch keine Notizen.</div>';
    return;
  }
  list.innerHTML = notes.map(n => `
    <div class="note-item">
      <div>
        <div class="note-item-text">${escHtml(n.text)}</div>
        <div class="note-item-meta">${n.date} · ${n.time || ''}</div>
      </div>
      <button class="note-item-del" onclick="deleteNote(${n.id})">✕</button>
    </div>`).join('');
}

function deleteNote(id) {
  const notes = (store.get('quick_notes') || []).filter(n => n.id !== id);
  store.set('quick_notes', notes);
  renderNotesList();
}

// Schließen per Escape oder Klick außerhalb
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeQuickNote();
});
document.getElementById('quick-note-overlay')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeQuickNote();
});

// ═══════════════════════════════════════════════════════════
// MOTIVATIONS-MOMENT (täglich via Claude API)
// ═══════════════════════════════════════════════════════════
const MOTIVATION_FALLBACKS = [
  'Du hast alle 4 schriftlichen Prüfungen alleine bestanden. Mündlich ist machbar.',
  'Vor 8 Monaten wusstest du noch nicht, dass du ADHS hast. Seitdem hast du mehr gerissen als in Jahren davor.',
  '127 IQ. ADHS. Krankenhaus Ende 2024. Und trotzdem hier, jeden Tag. Das bist du.',
  'Die 4 schriftlichen Abi-Klausuren — bestanden. Ohne Unterstützung, ohne Netz. Alleine.',
  'Perceive ist kein Traum mehr. Es ist ein Kanal, eine Idee, eine Richtung. Du hast angefangen.',
  'Oktober 2026, Osnabrück, Cognitive Science. Das ist kein vages Ziel — das ist ein Datum.',
  'Diagnose mit 23. Nicht als Entschuldigung. Als Erklärung. Und dann trotzdem weiter.',
];

async function loadMotivationMoment() {
  const el      = document.getElementById('motivation-moment');
  if (!el) return;
  const cacheKey = 'motivation_' + today();
  const cached   = store.get(cacheKey);
  if (cached) { el.textContent = cached; return; }

  // Zeige Fallback sofort, lade API parallel
  const fallback = MOTIVATION_FALLBACKS[new Date().getDate() % MOTIVATION_FALLBACKS.length];
  el.textContent = fallback;

  try {
    const msg = `Schreib einen kurzen, ehrlichen Motivations-Moment für Joel (2-3 Sätze).
Joels Geschichte: ADHS-Diagnose mit 23, Krankenhaus Ende 2024, 4 schriftliche Abiturprüfungen alleine bestanden, IQ 127, YouTuber (Perceive), Studium Cognitive Science Oktober 2026 Osnabrück geplant, Comeback im Gym nach 6 Wochen Pause.
Heute: ${new Date().toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long' })}.
Sei direkt, persönlich, nicht motivational-klischeehaft. Kein "Du schaffst das!" — eher: konkrete ehrliche Einschätzung was Joel wirklich geleistet hat.`;
    const text = await callNeo([{ role: 'user', content: msg }], '', 300);
    if (text?.trim()) {
      store.set(cacheKey, text.trim());
      el.textContent = text.trim();
    }
  } catch (e) {
    console.warn('[Motivation] API nicht erreichbar, Fallback genutzt');
  }
}

// ═══════════════════════════════════════════════════════════
// PWA
// ═══════════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  S.checkin = store.get('checkin_' + today());
  checkBoot();
  // Google Calendar nach kurzem Delay initialisieren (gsi library braucht Zeit)
  setTimeout(() => {
    initGCal();
    // Falls schon verbunden und Events gecacht → direkt anzeigen
    const cached = store.get('gcal_events_' + today());
    if (cached?.length) renderCalendarEvents(cached);
    // Falls verbunden → frische Events laden
    if (store.get('gcal_connected') && gcalTokenClient) {
      gcalTokenClient.requestAccessToken({ prompt: '' }); // silent refresh
    }
  }, 2000);
});
