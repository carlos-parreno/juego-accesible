/* ============================================================
   MemorIA — Juego de Memoria Accesible
   JavaScript Principal (Lógica Modular)
   ============================================================ */

'use strict';

// ── Utilidades Globales ──────────────────────────────────────

function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickRandom(arr, n) {
  const shuffled = shuffle(arr);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function launchConfetti() {
  const colors = ['#16A34A', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444'];
  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.top = '-10px';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (1 + Math.random() * 1.5) + 's';
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.width = (8 + Math.random() * 10) + 'px';
    piece.style.height = piece.style.width;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3000);
  }
}

// ── Motores de Audio y Voz (Accesibilidad) ───────────────────

const SoundEngine = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  playTone(freq, type, duration, vol, delay = 0) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + delay + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration);
  },
  playSuccess() { // Perfecto
    this.playTone(440, 'sine', 0.3, 0.5, 0);   // A4
    this.playTone(554.37, 'sine', 0.3, 0.5, 0.15); // C#5
    this.playTone(659.25, 'sine', 0.6, 0.5, 0.3);  // E5
  },
  playPartial() { // Acierto parcial
    this.playTone(440, 'triangle', 0.5, 0.4, 0); // Solo una nota suave
  },
  playError() { // Fallo
    this.playTone(220, 'square', 0.4, 0.2, 0); // A3 grave y suave
    this.playTone(207.65, 'square', 0.5, 0.2, 0.2); // G#3
  }
};

const TTSManager = {
  synth: window.speechSynthesis,
  isPlaying: false,
  text: "",
  sentences: [],
  currentSentenceIndex: 0,
  currentUtterance: null,

  prepare(text) {
    this.stop();
    this.text = text;
    if (text) {
      this.sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
      this.sentences = this.sentences.map(s => s.trim()).filter(Boolean);
    } else {
      this.sentences = [];
    }
    this.currentSentenceIndex = 0;
    this.updateUI();
  },

  speakCurrentSentence() {
    if (this.currentSentenceIndex >= this.sentences.length) {
      this.isPlaying = false;
      this.currentSentenceIndex = 0;
      this.updateUI();
      return;
    }

    const sentenceText = this.sentences[this.currentSentenceIndex];
    this.currentUtterance = new SpeechSynthesisUtterance(sentenceText);
    this.currentUtterance.lang = 'es-ES';
    this.currentUtterance.rate = 0.9;

    this.currentUtterance.onend = () => {
      if (this.isPlaying) {
        this.currentSentenceIndex++;
        this.speakCurrentSentence();
      }
    };

    this.currentUtterance.onerror = (e) => {
      console.error("TTS error:", e);
      this.isPlaying = false;
      this.updateUI();
    };

    if (this.synth) {
      this.synth.resume(); // Workaround for Chrome speech freeze
      this.synth.speak(this.currentUtterance);
    }
  },

  togglePlayPause() {
    if (this.isPlaying) {
      this.isPlaying = false;
      if (this.synth) {
        this.synth.resume(); // Workaround for Chrome speech freeze
        this.synth.cancel();
      }
      this.updateUI();
    } else {
      if (this.sentences.length > 0) {
        this.isPlaying = true;
        this.updateUI();
        this.speakCurrentSentence();
      }
    }
  },

  replay() {
    this.stop();
    if (this.sentences.length > 0) {
      this.isPlaying = true;
      this.updateUI();
      this.speakCurrentSentence();
    }
  },

  stop() {
    this.isPlaying = false;
    if (this.synth) {
      this.synth.resume(); // Workaround for Chrome speech freeze
      this.synth.cancel();
    }
    this.currentSentenceIndex = 0;
    this.updateUI();
  },

  updateUI() {
    const iconHistoria = document.getElementById('icon-tts-play');
    const iconEntrenador = document.getElementById('icon-tts-play-entrenador');
    if (iconHistoria) {
      iconHistoria.textContent = this.isPlaying ? '⏸️' : '▶️';
    }
    if (iconEntrenador) {
      iconEntrenador.textContent = this.isPlaying ? '⏸️' : '▶️';
    }
  }
};

// ── Sistema de Pantallas ─────────────────────────────────────

const ScreenManager = {
  show(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    if (target) {
      requestAnimationFrame(() => {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        target.focus({ preventScroll: true });
      });
    }
  }
};

// ── Controlador de Temporizador ──────────────────────────────

class GameTimer {
  constructor(displayEl, barEl, onTick, onComplete) {
    this.displayEl = displayEl;
    this.barEl = barEl;
    this.onTick = onTick || (() => {});
    this.onComplete = onComplete || (() => {});
    this.intervalId = null;
    this.remaining = 0;
    this.total = 0;
  }

  start(seconds) {
    this.stop();
    this.total = seconds;
    this.remaining = seconds;
    this.render();

    this.intervalId = setInterval(() => {
      this.remaining--;
      this.render();
      this.onTick(this.remaining);

      if (this.remaining <= 0) {
        this.stop();
        this.onComplete();
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  render() {
    if (this.displayEl) {
      this.displayEl.textContent = this.remaining;
      if (this.remaining <= 5) {
        this.displayEl.classList.add('warning');
      } else {
        this.displayEl.classList.remove('warning');
      }
    }
    if (this.barEl) {
      const pct = (this.remaining / this.total) * 100;
      this.barEl.style.width = pct + '%';
      if (this.remaining <= 5) {
        this.barEl.classList.add('warning');
      } else {
        this.barEl.classList.remove('warning');
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════
// 📌 DATOS DE PRUEBA
// ══════════════════════════════════════════════════════════════

const SHOPPING_DATA = {
  items: [
    { baseName: 'Manzanas', emoji: '🍎', units: ['2', '3', '5'], measures: ['2 libras de', '1 bolsa de'] },
    { baseName: 'Leche',    emoji: '🥛', units: ['2', '1', '3'], measures: ['1 galón de', '2 litros de'] },
    { baseName: 'Pan',      emoji: '🍞', units: ['1', '2', '4'], measures: ['2 barras de', '1 paquete de'] },
    { baseName: 'Huevos',   emoji: '🥚', units: ['6', '12', '24'], measures: ['1 docena de', 'Medio cartón de'] },
    { baseName: 'Queso',    emoji: '🧀', units: ['1', '2', '3'], measures: ['1 libra de', 'Media libra de'] },
    { baseName: 'Plátanos', emoji: '🍌', units: ['4', '5', '6'], measures: ['1 racimo de', '3 libras de'] },
    { baseName: 'Tomates',  emoji: '🍅', units: ['3', '5', '8'], measures: ['2 libras de', '1 kilo de'] },
    { baseName: 'Arroz',    emoji: '🍚', units: ['1', '2', '3'], measures: ['1 saco de', '2 libras de'] },
    { baseName: 'Pollo',    emoji: '🍗', units: ['1', '2', '4'], measures: ['1 kilo de', '2 pechugas de'] },
    { baseName: 'Yogur',    emoji: '🥣', units: ['2', '4', '6'], measures: ['1 litro de', '4 potes de'] },
  ],
  distractors: [
    { baseName: 'Pescado',   emoji: '🐟' }, { baseName: 'Cerezas',   emoji: '🍒' },
    { baseName: 'Helado',    emoji: '🍦' }, { baseName: 'Pizza',     emoji: '🍕' },
    { baseName: 'Galletas',  emoji: '🍪' }, { baseName: 'Zanahoria', emoji: '🥕' },
    { baseName: 'Sandía',    emoji: '🍉' }, { baseName: 'Café',      emoji: '☕' },
    { baseName: 'Chocolate', emoji: '🍫' }, { baseName: 'Uvas',      emoji: '🍇' },
  ],
  listSize: 5,
  gridDistractors: 7,
  presentationTime: 20,
  waitTime: 10,
};

const GAME_ITEMS = [
  { name: 'Gato Vinitzzie', emoji: '🐱', category: 'mascota' },
  { name: 'Perrita Paca',   emoji: '🐶', category: 'mascota' },
  { name: 'Gato Miel',      emoji: '🐈', category: 'mascota' },
  { name: 'Perrito Max',    emoji: '🐕', category: 'mascota' },
  { name: 'Conejita Luna',  emoji: '🐰', category: 'mascota' },
  { name: 'Casa',           emoji: '🏠', category: 'objeto' },
  { name: 'Flor',           emoji: '🌸', category: 'objeto' },
  { name: 'Estrella',       emoji: '⭐', category: 'objeto' },
  { name: 'Corazón',        emoji: '❤️', category: 'objeto' },
  { name: 'Sol',            emoji: '☀️', category: 'objeto' },
  { name: 'Luna',           emoji: '🌙', category: 'objeto' },
  { name: 'Árbol',          emoji: '🌳', category: 'objeto' },
  { name: 'Mariposa',       emoji: '🦋', category: 'objeto' },
  { name: 'Pájaro',         emoji: '🐦', category: 'objeto' },
  { name: 'Campana',        emoji: '🔔', category: 'objeto' },
  { name: 'Libro',          emoji: '📖', category: 'objeto' },
  { name: 'Pelota',         emoji: '⚽', category: 'objeto' },
  { name: 'Sombrero',       emoji: '🎩', category: 'objeto' },
  { name: 'Taza',           emoji: '☕', category: 'objeto' },
  { name: 'Pastel',         emoji: '🎂', category: 'objeto' },
];

const LEVEL_CONFIG = {
  1: { boxCount: 5, memorizeTime: 15 },
  2: { originalCount: 4, memorizeTime: 15 },
  3: { sequenceLength: 4, displayTime: 1500 },
  4: { pairsCount: 3, memorizeTime: 15 },
};

// ══════════════════════════════════════════════════════════════
// MODO HISTORIA — La Lista del Supermercado
// ══════════════════════════════════════════════════════════════

const ModoHistoria = {
  currentList: [],
  selectedItems: [],
  allGridItems: [],
  timer: null,
  level: 'facil',

  startLevel(nivel) {
    this.level = nivel;
    this.currentList = [];
    
    // Generar lista según dificultad: 3 para medio, 5 para difícil (y 5 para fácil)
    const listSize = nivel === 'medio' ? 3 : 5;
    const baseItems = pickRandom(SHOPPING_DATA.items, listSize);
    
    baseItems.forEach(item => {
      let displayName = item.baseName;
      let selectedVal = "";
      if (nivel === 'medio') {
        const amt = item.units[Math.floor(Math.random() * item.units.length)];
        displayName = `${amt} ${item.baseName}`;
        selectedVal = amt;
      } else if (nivel === 'dificil') {
        const measure = item.measures[Math.floor(Math.random() * item.measures.length)];
        displayName = `${measure} ${item.baseName}`;
        selectedVal = measure;
      }
      this.currentList.push({ 
        name: displayName, 
        emoji: item.emoji, 
        baseItem: item, 
        selectedValue: selectedVal 
      });
    });

    this.showIntro();
  },

  showIntro() {
    const introText = "Hoy vamos a preparar una cena especial para la familia. Necesito que vayas al supermercado y compres lo siguiente:";
    const listHTML = `<ul style="margin: var(--space-sm) 0; padding-left: var(--space-lg); text-align: left; list-style-type: disc;">` + 
      this.currentList.map(item => `<li style="margin-bottom: var(--space-xs);"><strong>${item.emoji} ${item.name}</strong></li>`).join('') + 
      "</ul>";
    const outroText = "Tómate el tiempo que necesites para escuchar y leer la lista, y cuando estés seguro, pulsa 'Estoy listo'.";

    const storyHTML = `
      <p style="margin-bottom: var(--space-sm);">${introText}</p>
      ${listHTML}
      <p style="margin-top: var(--space-md);">${outroText}</p>
    `;

    document.getElementById('historia-intro-text').innerHTML = storyHTML;
    ScreenManager.show('screen-historia-intro');
    
    SoundEngine.init(); // Iniciar contexto de audio al interactuar
    
    // Generar el texto para la lectura por voz (sin HTML)
    let storyTTS = "Hoy vamos a preparar una cena especial para la familia. Necesito que vayas al supermercado y compres lo siguiente: ";
    const itemNames = this.currentList.map(i => i.name);
    storyTTS += itemNames.slice(0, -1).join(', ') + ' y ' + itemNames[itemNames.length - 1] + '.';
    storyTTS += " Tómate el tiempo que necesites para escuchar y leer la lista, y cuando estés seguro, pulsa 'Estoy listo'.";
    
    TTSManager.prepare(storyTTS);
  },

  startMemorization() {
    TTSManager.stop();
    this.selectedItems = [];
    this.renderList();
    ScreenManager.show('screen-historia-presentacion');

    this.timer = new GameTimer(
      document.getElementById('timer-historia-presentacion'),
      document.getElementById('timer-bar-historia'),
      null,
      () => this.goToWait()
    );
    this.timer.start(SHOPPING_DATA.presentationTime);
  },

  renderList() {
    const listEl = document.getElementById('shopping-list-display');
    listEl.innerHTML = '';
    this.currentList.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="list-emoji" aria-hidden="true">${item.emoji}</span><span>${item.name}</span>`;
      listEl.appendChild(li);
    });
  },

  goToWait() {
    if (this.timer) this.timer.stop();
    ScreenManager.show('screen-historia-espera');
    const countdownEl = document.getElementById('countdown-number');
    let count = SHOPPING_DATA.waitTime;
    countdownEl.textContent = count;

    const interval = setInterval(() => {
      count--;
      countdownEl.textContent = count;
      if (count <= 0) {
        clearInterval(interval);
        this.goToSelection();
      }
    }, 1000);
    this._waitInterval = interval;
  },

  goToSelection() {
    this.selectedItems = [];
    
    const wrongQuantityItems = [];
    if (this.level === 'medio' || this.level === 'dificil') {
      this.currentList.forEach(item => {
        let wrongName = "";
        if (this.level === 'medio') {
          const correctAmt = item.selectedValue;
          const otherAmts = item.baseItem.units.filter(u => u !== correctAmt);
          const wrongAmt = otherAmts.length > 0 ? otherAmts[Math.floor(Math.random() * otherAmts.length)] : (parseInt(correctAmt) + 2).toString();
          wrongName = `${wrongAmt} ${item.baseItem.baseName}`;
        } else if (this.level === 'dificil') {
          const correctMeasure = item.selectedValue;
          const otherMeasures = item.baseItem.measures.filter(m => m !== correctMeasure);
          const wrongMeasure = otherMeasures.length > 0 ? otherMeasures[Math.floor(Math.random() * otherMeasures.length)] : `2 libras de ${item.baseItem.baseName}`;
          wrongName = `${wrongMeasure} ${item.baseItem.baseName}`;
        }
        wrongQuantityItems.push({ name: wrongName, emoji: item.emoji });
      });
    }

    // Determine how many other product distractors we need to reach 12 items in the grid
    const currentTotal = this.currentList.length + wrongQuantityItems.length;
    const neededDistractors = 12 - currentTotal;

    // Pick distractors from other products (products not in this.currentList)
    const usedBaseNames = this.currentList.map(i => i.baseItem.baseName);
    const availableDistractors = SHOPPING_DATA.distractors.concat(
      SHOPPING_DATA.items.filter(i => !usedBaseNames.includes(i.baseName))
    );

    const distBase = pickRandom(availableDistractors, neededDistractors);
    const distractors = distBase.map(item => {
      let dName = item.baseName;
      if (this.level === 'medio') {
        const units = item.units || ['1', '2', '3'];
        const amt = units[Math.floor(Math.random() * units.length)];
        dName = `${amt} ${item.baseName}`;
      } else if (this.level === 'dificil') {
        const measures = item.measures || ['1 paquete de', '2 libras de'];
        const measure = measures[Math.floor(Math.random() * measures.length)];
        dName = `${measure} ${item.baseName}`;
      }
      return { name: dName, emoji: item.emoji };
    });

    this.allGridItems = shuffle([...this.currentList, ...wrongQuantityItems, ...distractors]);
    this.renderGrid();
    ScreenManager.show('screen-historia-seleccion');
    document.getElementById('count-total').textContent = this.currentList.length;
    document.getElementById('count-selected').textContent = '0';
  },

  renderGrid() {
    const gridEl = document.getElementById('historia-grid');
    gridEl.innerHTML = '';
    this.allGridItems.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.className = 'grid-item';
      btn.setAttribute('role', 'gridcell');
      btn.innerHTML = `<span class="item-emoji" aria-hidden="true">${item.emoji}</span><span class="item-label">${item.name}</span>`;
      btn.addEventListener('click', () => this.toggleItem(index, btn));
      gridEl.appendChild(btn);
    });
  },

  toggleItem(index, btn) {
    const itemName = this.allGridItems[index].name;
    const isSelected = this.selectedItems.includes(itemName);
    if (isSelected) {
      this.selectedItems = this.selectedItems.filter(n => n !== itemName);
      btn.classList.remove('selected');
    } else {
      if (this.selectedItems.length >= this.currentList.length) {
        const firstItemName = this.selectedItems.shift();
        const gridButtons = document.querySelectorAll('#historia-grid .grid-item');
        gridButtons.forEach(buttonEl => {
          const labelEl = buttonEl.querySelector('.item-label');
          if (labelEl && labelEl.textContent === firstItemName) {
            buttonEl.classList.remove('selected');
          }
        });
      }
      this.selectedItems.push(itemName);
      btn.classList.add('selected');
    }
    document.getElementById('count-selected').textContent = this.selectedItems.length;
  },

  checkAnswers() {
    const correctNames = this.currentList.map(i => i.name);
    const hits = this.selectedItems.filter(n => correctNames.includes(n));
    const misses = correctNames.filter(n => !this.selectedItems.includes(n));
    const extras = this.selectedItems.filter(n => !correctNames.includes(n));
    
    const isAllCorrect = hits.length === correctNames.length && extras.length === 0;
    const isPartial = hits.length > 0 && hits.length < correctNames.length;
    
    // Play sound
    if (isAllCorrect) {
      SoundEngine.playSuccess();
    } else if (isPartial && extras.length === 0) {
      SoundEngine.playPartial();
    } else {
      SoundEngine.playError();
    }

    const gridItems = document.querySelectorAll('#historia-grid .grid-item');
    gridItems.forEach((el, idx) => {
      const itemName = this.allGridItems[idx].name;
      el.classList.add('disabled');
      if (correctNames.includes(itemName) && this.selectedItems.includes(itemName)) el.classList.add('correct');
      else if (correctNames.includes(itemName) && !this.selectedItems.includes(itemName)) el.classList.add('missed');
      else if (!correctNames.includes(itemName) && this.selectedItems.includes(itemName)) el.classList.add('incorrect');
    });

    setTimeout(() => this.showResult(isAllCorrect, hits, misses, extras), 800);
  },

  showResult(isAllCorrect, hits, misses, extras) {
    const feedbackEl = document.getElementById('historia-feedback');
    const detalleEl = document.getElementById('historia-detalle');

    if (isAllCorrect) {
      feedbackEl.className = 'feedback-card feedback-success';
      feedbackEl.innerHTML = `<span class="feedback-icon">🎉</span><h3 class="feedback-title">¡Excelente memoria!</h3><p class="feedback-message">Recordaste todos los productos de la lista.</p>`;
      launchConfetti();
    } else {
      feedbackEl.className = 'feedback-card feedback-encourage';
      feedbackEl.innerHTML = `<span class="feedback-icon">💪</span><h3 class="feedback-title">¡Buen intento!</h3><p class="feedback-message">Recordaste ${hits.length} de ${this.currentList.length} productos.</p>`;
    }

    let detalleHTML = '<p class="correct-answers-title">📋 La lista correcta era:</p><div class="correct-answers-list">';
    this.currentList.forEach(item => {
      const wasFound = hits.includes(item.name);
      detalleHTML += `<span class="correct-answer-chip" style="${wasFound ? '' : 'border-color: var(--color-gentle-error); background: var(--color-gentle-error-bg);'}">${item.emoji} ${item.name} ${wasFound ? '✅' : '❌'}</span>`;
    });
    detalleHTML += '</div>';
    detalleEl.innerHTML = detalleHTML;

    const btnSiguiente = document.getElementById('btn-historia-siguiente');
    if (this.level === 'facil') {
      btnSiguiente.classList.remove('hidden');
      btnSiguiente.textContent = '➡️ Siguiente Nivel (Medio)';
    } else if (this.level === 'medio') {
      btnSiguiente.classList.remove('hidden');
      btnSiguiente.textContent = '➡️ Siguiente Nivel (Difícil)';
    } else {
      btnSiguiente.classList.add('hidden');
    }

    ScreenManager.show('screen-historia-resultado');
  },

  cleanup() {
    if (this.timer) this.timer.stop();
    if (this._waitInterval) clearInterval(this._waitInterval);
    TTSManager.stop();
  }
};

// ══════════════════════════════════════════════════════════════
// MODO ENTRENADOR MENTAL — 4 Minijuegos
// ══════════════════════════════════════════════════════════════

const ModoEntrenador = {
  currentLevel: 0,
  levelData: {},
  timer: null,

  startLevel(level) {
    this.currentLevel = level;
    this.levelData = {};
    SoundEngine.init();

    let title = "";
    let instructions = "";

    switch (level) {
      case 1:
        title = "📦 Nivel 1: El Escondite";
        instructions = "A continuación, verás varias cajas con imágenes adentro. Tienes que memorizar en qué caja está cada imagen. ¡Tómate todo el tiempo que necesites para leer esto y presiona el botón cuando estés listo!";
        break;
      case 2:
        title = "🔎 Nivel 2: El Intruso";
        instructions = "Te mostraremos un grupo de imágenes. Trata de memorizarlas todas. Luego, la pantalla parpadeará y aparecerá una imagen nueva que no estaba antes. ¡Tu misión es encontrar al intruso!";
        break;
      case 3:
        title = "🎬 Nivel 3: El Cine";
        instructions = "Verás pasar imágenes en la pantalla, una por una, como en una película. Presta mucha atención. Al final, te preguntaremos si una imagen en específico apareció o no.";
        break;
      case 4:
        title = "🃏 Nivel 4: Las Parejas";
        instructions = "Verás varias cartas boca arriba. Memoriza bien dónde está cada una. Luego se voltearán y te pediremos que encuentres las dos cartas de una imagen en particular.";
        break;
    }

    document.getElementById('instrucciones-titulo').textContent = title;
    document.getElementById('instrucciones-texto-largo').textContent = instructions;
    ScreenManager.show('screen-entrenador-instrucciones');

    // Preparar el reproductor con las instrucciones correspondientes
    TTSManager.prepare(instructions);
  },

  startTimerPhase() {
    switch (this.currentLevel) {
      case 1: this.startNivel1(); break;
      case 2: this.startNivel2(); break;
      case 3: this.startNivel3(); break;
      case 4: this.startNivel4(); break;
    }
  },

  // ────────────────────────────────────────────
  // NIVEL 1
  startNivel1() {
    const config = LEVEL_CONFIG[1];
    const items = pickRandom(GAME_ITEMS, config.boxCount);
    const boxes = items.map((item, i) => ({ number: i + 1, item }));
    this.levelData = { boxes, targetBox: null };

    document.getElementById('juego-titulo').textContent = '📦 El Escondite';
    document.getElementById('juego-instrucciones-text').innerHTML = 'Observa qué hay dentro de cada caja. <span class="highlight">¡Memoriza sus posiciones!</span>';
    document.getElementById('juego-pregunta').classList.add('hidden');
    document.getElementById('juego-timer-container').classList.remove('hidden');

    this.renderNivel1Boxes(true);
    ScreenManager.show('screen-juego');

    this.timer = new GameTimer(
      document.getElementById('juego-timer-text'), document.getElementById('juego-timer-bar'), null,
      () => this.nivel1AskQuestion()
    );
    this.timer.start(config.memorizeTime);
  },

  renderNivel1Boxes(showContent) {
    const area = document.getElementById('juego-area');
    area.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'game-grid cols-3';
    this.levelData.boxes.forEach((box, idx) => {
      const el = document.createElement('div');
      el.className = 'grid-item' + (showContent ? '' : ' hidden-content');
      el.innerHTML = `<span class="item-number">${box.number}</span><span class="item-emoji">${box.item.emoji}</span><span class="item-label">${showContent ? box.item.name : '???'}</span>`;
      if (!showContent) el.addEventListener('click', () => this.nivel1SelectBox(idx));
      grid.appendChild(el);
    });
    area.appendChild(grid);
  },

  nivel1AskQuestion() {
    if (this.timer) this.timer.stop();
    document.getElementById('juego-timer-container').classList.add('hidden');
    const randomIdx = Math.floor(Math.random() * this.levelData.boxes.length);
    this.levelData.targetBox = this.levelData.boxes[randomIdx];
    this.levelData.targetIndex = randomIdx;

    this.renderNivel1Boxes(false);
    document.getElementById('juego-pregunta').classList.remove('hidden');
    document.getElementById('juego-pregunta-emoji').textContent = this.levelData.targetBox.item.emoji;
    document.getElementById('juego-pregunta-text').textContent = `¿En qué número estaba ${this.levelData.targetBox.item.name}?`;
    document.getElementById('juego-instrucciones-text').innerHTML = 'Toca la caja donde crees que estaba.';
  },

  nivel1SelectBox(idx) {
    const isCorrect = idx === this.levelData.targetIndex;
    if (isCorrect) SoundEngine.playSuccess(); else SoundEngine.playError();

    const gridItems = document.querySelectorAll('#juego-area .grid-item');
    gridItems.forEach((el, i) => {
      el.classList.remove('hidden-content');
      el.classList.add('revealed', 'disabled');
      el.querySelector('.item-label').textContent = this.levelData.boxes[i].item.name;
      if (i === this.levelData.targetIndex) el.classList.add('correct');
      if (i === idx && !isCorrect) el.classList.add('incorrect');
    });

    setTimeout(() => this.showLevelResult(isCorrect, { correctAnswer: `${this.levelData.targetBox.item.emoji} ${this.levelData.targetBox.item.name} estaba en la caja ${this.levelData.targetBox.number}` }), 1000);
  },

  // ────────────────────────────────────────────
  // NIVEL 2
  startNivel2() {
    const config = LEVEL_CONFIG[2];
    const allItems = shuffle(GAME_ITEMS);
    this.levelData = { original: allItems.slice(0, config.originalCount), intruder: allItems[config.originalCount] };

    document.getElementById('juego-titulo').textContent = '🔎 El Intruso';
    document.getElementById('juego-instrucciones-text').innerHTML = 'Observa estos personajes con atención.';
    document.getElementById('juego-pregunta').classList.add('hidden');
    document.getElementById('juego-opciones').innerHTML = '';
    document.getElementById('juego-timer-container').classList.remove('hidden');

    this.renderNivel2Grid(this.levelData.original);
    ScreenManager.show('screen-juego');

    this.timer = new GameTimer(
      document.getElementById('juego-timer-text'), document.getElementById('juego-timer-bar'), null,
      () => this.nivel2ShowIntruder()
    );
    this.timer.start(config.memorizeTime);
  },

  renderNivel2Grid(items, clickable = false) {
    const area = document.getElementById('juego-area');
    area.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'game-grid cols-3';
    items.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'grid-item';
      el.dataset.itemName = item.name;
      el.innerHTML = `<span class="item-emoji">${item.emoji}</span><span class="item-label">${item.name}</span>`;
      if (clickable) el.addEventListener('click', () => this.nivel2Select(item, el));
      grid.appendChild(el);
    });
    area.appendChild(grid);
  },

  nivel2ShowIntruder() {
    if (this.timer) this.timer.stop();
    document.getElementById('juego-timer-container').classList.add('hidden');
    
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);

    const mixed = shuffle([...this.levelData.original, this.levelData.intruder]);
    setTimeout(() => {
      this.renderNivel2Grid(mixed, true);
      document.getElementById('juego-pregunta').classList.remove('hidden');
      document.getElementById('juego-pregunta-emoji').textContent = '🤔';
      document.getElementById('juego-pregunta-text').textContent = '¿Cuál de estos NO estaba antes?';
    }, 400);
  },

  nivel2Select(item, el) {
    const isCorrect = item.name === this.levelData.intruder.name;
    if (isCorrect) SoundEngine.playSuccess(); else SoundEngine.playError();

    const gridItems = document.querySelectorAll('#juego-area .grid-item');
    gridItems.forEach(gi => {
      gi.classList.add('disabled');
      if (gi.dataset.itemName === this.levelData.intruder.name) gi.classList.add('correct');
    });
    if (!isCorrect) el.classList.add('incorrect');

    setTimeout(() => this.showLevelResult(isCorrect, { correctAnswer: `${this.levelData.intruder.emoji} ${this.levelData.intruder.name} era el intruso` }), 1000);
  },

  // ────────────────────────────────────────────
  // NIVEL 3
  async startNivel3() {
    const config = LEVEL_CONFIG[3];
    const allItems = shuffle(GAME_ITEMS);
    const sequence = allItems.slice(0, config.sequenceLength);
    const askSeen = Math.random() < 0.5;
    const questionItem = askSeen ? sequence[Math.floor(Math.random() * sequence.length)] : allItems[config.sequenceLength];

    this.levelData = { sequence, questionItem, askSeen };
    document.getElementById('juego-titulo').textContent = '🎬 El Cine';
    document.getElementById('juego-instrucciones-text').innerHTML = 'Observa la secuencia con atención.';
    document.getElementById('juego-pregunta').classList.add('hidden');
    document.getElementById('juego-timer-container').classList.add('hidden');
    document.getElementById('juego-opciones').innerHTML = '';

    const area = document.getElementById('juego-area');
    area.innerHTML = '<div class="cinema-display" id="cinema-screen"></div>';
    ScreenManager.show('screen-juego');

    await wait(800);
    const cinemaScreen = document.getElementById('cinema-screen');
    for (const item of sequence) {
      cinemaScreen.innerHTML = `<div class="cinema-item"><span class="item-emoji">${item.emoji}</span><span class="item-label">${item.name}</span></div>`;
      await wait(config.displayTime);
      cinemaScreen.innerHTML = '';
      await wait(300);
    }
    this.nivel3AskQuestion();
  },

  nivel3AskQuestion() {
    document.getElementById('juego-pregunta').classList.remove('hidden');
    document.getElementById('juego-pregunta-emoji').textContent = this.levelData.questionItem.emoji;
    document.getElementById('juego-pregunta-text').textContent = `¿Viste esto en la película?`;
    
    document.getElementById('juego-area').innerHTML = `<div class="cinema-display"><div style="text-align: center;"><span style="font-size: 72px; display: block;">${this.levelData.questionItem.emoji}</span><span style="font-size: var(--font-size-lg); font-weight: 700;">${this.levelData.questionItem.name}</span></div></div>`;

    document.getElementById('juego-opciones').innerHTML = `
      <div class="btn-group-yesno">
        <button class="btn btn-yes" id="btn-cine-si">SÍ ✅</button>
        <button class="btn btn-no" id="btn-cine-no">NO ❌</button>
      </div>`;

    document.getElementById('btn-cine-si').addEventListener('click', () => this.nivel3Answer(true));
    document.getElementById('btn-cine-no').addEventListener('click', () => this.nivel3Answer(false));
  },

  nivel3Answer(userSaidYes) {
    const isCorrect = userSaidYes === this.levelData.askSeen;
    if (isCorrect) SoundEngine.playSuccess(); else SoundEngine.playError();

    document.getElementById('btn-cine-si').disabled = true;
    document.getElementById('btn-cine-no').disabled = true;
    if (this.levelData.askSeen) document.getElementById('btn-cine-si').classList.add('correct');
    else document.getElementById('btn-cine-no').classList.add('correct');

    let seqHTML = '<p class="correct-answers-title">🎬 La secuencia fue:</p><div class="correct-answers-list">';
    this.levelData.sequence.forEach(item => seqHTML += `<span class="correct-answer-chip">${item.emoji} ${item.name}</span>`);
    seqHTML += '</div>';

    setTimeout(() => this.showLevelResult(isCorrect, { 
      correctAnswer: this.levelData.askSeen ? `SÍ apareció en la secuencia` : `NO apareció en la secuencia`,
      extraHTML: seqHTML 
    }), 800);
  },

  // ────────────────────────────────────────────
  // NIVEL 4
  startNivel4() {
    const config = LEVEL_CONFIG[4];
    const items = pickRandom(GAME_ITEMS, config.pairsCount);
    const cards = shuffle([...items, ...items].map((item, i) => ({ id: i, item, faceUp: true, matched: false })));
    const targetItem = items[Math.floor(Math.random() * items.length)];

    this.levelData = { cards, targetItem, selectedCards: [] };
    document.getElementById('juego-titulo').textContent = '🃏 Las Parejas';
    document.getElementById('juego-instrucciones-text').innerHTML = 'Observa dónde está cada imagen.';
    document.getElementById('juego-pregunta').classList.add('hidden');
    document.getElementById('juego-timer-container').classList.remove('hidden');

    this.renderNivel4Board(true);
    ScreenManager.show('screen-juego');

    this.timer = new GameTimer(
      document.getElementById('juego-timer-text'), document.getElementById('juego-timer-bar'), null,
      () => this.nivel4FlipDown()
    );
    this.timer.start(config.memorizeTime);
  },

  renderNivel4Board(faceUp) {
    const area = document.getElementById('juego-area');
    area.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'game-grid cols-3';

    this.levelData.cards.forEach((card, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'card-flip' + (faceUp ? ' flipped' : '');
      wrapper.dataset.cardIndex = idx;
      wrapper.innerHTML = `<div class="card-flip-inner"><div class="card-face card-front"><span style="font-size: 32px;">?</span></div><div class="card-face card-back"><span class="item-emoji" style="font-size: 36px;">${card.item.emoji}</span></div></div>`;
      if (!faceUp) wrapper.addEventListener('click', () => this.nivel4SelectCard(idx));
      grid.appendChild(wrapper);
    });
    area.appendChild(grid);
  },

  nivel4FlipDown() {
    if (this.timer) this.timer.stop();
    document.getElementById('juego-timer-container').classList.add('hidden');
    this.renderNivel4Board(false);
    document.getElementById('juego-pregunta').classList.remove('hidden');
    document.getElementById('juego-pregunta-emoji').textContent = this.levelData.targetItem.emoji;
    document.getElementById('juego-pregunta-text').textContent = `Busca las dos cartas de: ${this.levelData.targetItem.name}`;
  },

  nivel4SelectCard(idx) {
    if (this.levelData.selectedCards.includes(idx) || this.levelData.selectedCards.length >= 2) return;
    
    document.querySelector(`[data-card-index="${idx}"]`).classList.add('flipped');
    this.levelData.selectedCards.push(idx);

    if (this.levelData.selectedCards.length === 2) {
      setTimeout(() => {
        const card1 = this.levelData.cards[this.levelData.selectedCards[0]];
        const card2 = this.levelData.cards[this.levelData.selectedCards[1]];
        const bothCorrect = card1.item.name === this.levelData.targetItem.name && card2.item.name === this.levelData.targetItem.name;

        if (bothCorrect) SoundEngine.playSuccess(); else SoundEngine.playError();

        const allCards = document.querySelectorAll('.card-flip');
        allCards.forEach(c => { c.classList.add('flipped'); c.style.pointerEvents = 'none'; });

        allCards.forEach((c, i) => {
          if (this.levelData.cards[i].item.name === this.levelData.targetItem.name) {
            c.querySelector('.card-back').style.border = '3px solid var(--color-success)';
          }
        });

        if (!bothCorrect) {
          this.levelData.selectedCards.forEach(si => {
            if (this.levelData.cards[si].item.name !== this.levelData.targetItem.name) {
              document.querySelector(`[data-card-index="${si}"] .card-back`).style.border = '3px solid var(--color-gentle-error)';
            }
          });
        }

        setTimeout(() => this.showLevelResult(bothCorrect, { correctAnswer: `${this.levelData.targetItem.emoji} ${this.levelData.targetItem.name}` }), 1200);
      }, 600);
    }
  },

  // ────────────────────────────────────────────
  showLevelResult(isCorrect, details) {
    const feedbackEl = document.getElementById('juego-feedback');
    const detalleEl = document.getElementById('juego-detalle');

    if (isCorrect) {
      feedbackEl.className = 'feedback-card feedback-success';
      feedbackEl.innerHTML = `<span class="feedback-icon">🎉</span><h3 class="feedback-title">¡Correcto!</h3><p class="feedback-message">¡Tu memoria es genial!</p>`;
      launchConfetti();
    } else {
      feedbackEl.className = 'feedback-card feedback-encourage';
      feedbackEl.innerHTML = `<span class="feedback-icon">💪</span><h3 class="feedback-title">¡Casi lo logras!</h3><p class="feedback-message">¡La práctica lleva a la perfección!</p>`;
    }

    let detalleHTML = `<p class="correct-answers-title">✨ Respuesta correcta:</p><div class="correct-answers-list"><span class="correct-answer-chip">${details.correctAnswer}</span></div>`;
    if (details.extraHTML) detalleHTML += `<div class="spacer-md"></div>${details.extraHTML}`;
    detalleEl.innerHTML = detalleHTML;

    const btnSiguiente = document.getElementById('btn-juego-siguiente');
    if (this.currentLevel < 4) {
      btnSiguiente.classList.remove('hidden');
      btnSiguiente.textContent = `➡️ Nivel ${this.currentLevel + 1}`;
    } else {
      btnSiguiente.classList.add('hidden');
    }
    ScreenManager.show('screen-juego-resultado');
  },

  cleanup() {
    if (this.timer) this.timer.stop();
    TTSManager.stop();
  }
};

// ══════════════════════════════════════════════════════════════
// INICIALIZACIÓN Y EVENT LISTENERS
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Menú Principal ──
  document.getElementById('btn-modo-historia').addEventListener('click', () => {
    ScreenManager.show('screen-historia-niveles');
  });

  document.getElementById('btn-modo-entrenador').addEventListener('click', () => {
    ScreenManager.show('screen-entrenador-menu');
  });

  // ── Modo Historia: Niveles e Intro ──
  document.getElementById('btn-back-historia-niveles').addEventListener('click', () => ScreenManager.show('screen-menu'));
  document.getElementById('btn-back-historia-intro').addEventListener('click', () => {
    TTSManager.stop();
    ScreenManager.show('screen-historia-niveles');
  });

  document.getElementById('btn-historia-facil').addEventListener('click', () => ModoHistoria.startLevel('facil'));
  document.getElementById('btn-historia-medio').addEventListener('click', () => ModoHistoria.startLevel('medio'));
  document.getElementById('btn-historia-dificil').addEventListener('click', () => ModoHistoria.startLevel('dificil'));

  // Controles TTS
  document.getElementById('btn-tts-play-pause').addEventListener('click', () => TTSManager.togglePlayPause());
  document.getElementById('btn-tts-replay').addEventListener('click', () => TTSManager.replay());

  document.getElementById('btn-historia-intro-listo').addEventListener('click', () => {
    ModoHistoria.startMemorization();
  });

  // ── Modo Historia: Navegación ──
  document.getElementById('btn-historia-listo').addEventListener('click', () => ModoHistoria.goToWait());
  document.getElementById('btn-historia-comprobar').addEventListener('click', () => ModoHistoria.checkAnswers());
  
  document.getElementById('btn-historia-reintentar').addEventListener('click', () => {
    ModoHistoria.cleanup();
    ModoHistoria.startLevel(ModoHistoria.level);
  });
  
  document.getElementById('btn-historia-siguiente').addEventListener('click', () => {
    ModoHistoria.cleanup();
    if (ModoHistoria.level === 'facil') {
      ModoHistoria.startLevel('medio');
    } else if (ModoHistoria.level === 'medio') {
      ModoHistoria.startLevel('dificil');
    }
  });

  document.getElementById('btn-historia-niveles-back').addEventListener('click', () => {
    ModoHistoria.cleanup();
    ScreenManager.show('screen-historia-niveles');
  });

  // Controles TTS Entrenador
  document.getElementById('btn-tts-play-pause-entrenador').addEventListener('click', () => TTSManager.togglePlayPause());
  document.getElementById('btn-tts-replay-entrenador').addEventListener('click', () => TTSManager.replay());

  document.getElementById('btn-back-historia-1').addEventListener('click', () => { ModoHistoria.cleanup(); ScreenManager.show('screen-historia-niveles'); });
  document.getElementById('btn-back-historia-3').addEventListener('click', () => { ModoHistoria.cleanup(); ScreenManager.show('screen-menu'); });


  // ── Modo Entrenador: Navegación ──
  document.getElementById('btn-back-entrenador').addEventListener('click', () => ScreenManager.show('screen-menu'));
  document.getElementById('btn-back-entrenador-instrucciones').addEventListener('click', () => {
    TTSManager.stop();
    ScreenManager.show('screen-entrenador-menu');
  });

  // Botones de niveles
  document.getElementById('btn-nivel-1').addEventListener('click', () => ModoEntrenador.startLevel(1));
  document.getElementById('btn-nivel-2').addEventListener('click', () => ModoEntrenador.startLevel(2));
  document.getElementById('btn-nivel-3').addEventListener('click', () => ModoEntrenador.startLevel(3));
  document.getElementById('btn-nivel-4').addEventListener('click', () => ModoEntrenador.startLevel(4));

  // Botón "¡Estoy listo!"
  document.getElementById('btn-entrenador-listo').addEventListener('click', () => {
    TTSManager.stop();
    ModoEntrenador.startTimerPhase();
  });

  document.getElementById('btn-back-juego').addEventListener('click', () => {
    ModoEntrenador.cleanup();
    ScreenManager.show('screen-entrenador-menu');
  });

  document.getElementById('btn-juego-reintentar').addEventListener('click', () => {
    ModoEntrenador.cleanup();
    ModoEntrenador.startLevel(ModoEntrenador.currentLevel);
  });

  document.getElementById('btn-juego-siguiente').addEventListener('click', () => {
    ModoEntrenador.cleanup();
    if (ModoEntrenador.currentLevel < 4) ModoEntrenador.startLevel(ModoEntrenador.currentLevel + 1);
  });

  document.getElementById('btn-juego-niveles').addEventListener('click', () => {
    ModoEntrenador.cleanup();
    ScreenManager.show('screen-entrenador-menu');
  });
});
