/* ============================================================
   MemorIA — Juego de Memoria Accesible
   JavaScript Principal (Lógica Modular)
   
   ARQUITECTURA:
   - Patrón de estados: cambio de pantallas ocultando/mostrando divs
   - Cada modo de juego es un módulo independiente
   - Temporizador solo en fases de memorización
   
   PERSONALIZACIÓN:
   - Busca los comentarios "📌 PERSONALIZAR" para cambiar
     imágenes, audios, datos o tiempos.
   ============================================================ */

'use strict';

// ── Utilidades Globales ──────────────────────────────────────

/**
 * Mezcla un array de forma aleatoria (Fisher-Yates shuffle)
 * @param {Array} arr - Array a mezclar
 * @returns {Array} - Nuevo array mezclado
 */
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Selecciona N elementos aleatorios de un array sin repetir
 * @param {Array} arr - Array fuente
 * @param {number} n - Cantidad a seleccionar
 * @returns {Array} - Subconjunto aleatorio
 */
function pickRandom(arr, n) {
  const shuffled = shuffle(arr);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * Espera N milisegundos (promesa)
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Lanza confeti visual (feedback positivo)
 */
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


// ── Sistema de Pantallas ─────────────────────────────────────

const ScreenManager = {
  /**
   * Cambia a la pantalla indicada ocultando las demás
   * @param {string} screenId - ID del div de la pantalla
   */
  show(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    if (target) {
      // Pequeño delay para que la animación CSS se ejecute
      requestAnimationFrame(() => {
        target.classList.add('active');
        // Scroll al top de la pantalla
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Focus para accesibilidad (lectores de pantalla)
        target.focus({ preventScroll: true });
      });
    }
  }
};


// ── Controlador de Temporizador ──────────────────────────────

class GameTimer {
  /**
   * @param {HTMLElement} displayEl - Elemento para mostrar el número
   * @param {HTMLElement} barEl - Elemento de la barra de progreso (opcional)
   * @param {Function} onTick - Callback cada segundo (recibe segundos restantes)
   * @param {Function} onComplete - Callback al terminar
   */
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
    this.stop(); // Limpia timer anterior
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
      // Warning visual cuando queda poco tiempo
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
// Aquí puedes cambiar emojis por URLs de imágenes reales
// o agregar más elementos.
// ══════════════════════════════════════════════════════════════

/**
 * 📌 PERSONALIZAR: Elementos de la lista del supermercado (Modo Historia)
 * - emoji: Puedes cambiar por una <img> o URL de imagen
 * - name: Nombre del producto
 * - Agrega o quita items según necesites
 */
const SHOPPING_DATA = {
  // Items que se usarán como lista de compras (se eligen aleatoriamente)
  items: [
    { name: 'Manzanas',   emoji: '🍎' },
    { name: 'Leche',      emoji: '🥛' },
    { name: 'Pan',        emoji: '🍞' },
    { name: 'Huevos',     emoji: '🥚' },
    { name: 'Queso',      emoji: '🧀' },
    { name: 'Plátanos',   emoji: '🍌' },
    { name: 'Tomates',    emoji: '🍅' },
    { name: 'Arroz',      emoji: '🍚' },
    { name: 'Pollo',      emoji: '🍗' },
    { name: 'Yogur',      emoji: '🥣' },
  ],
  // Distractores (nunca aparecen en la lista, solo en la cuadrícula)
  distractors: [
    { name: 'Pescado',    emoji: '🐟' },
    { name: 'Cerezas',    emoji: '🍒' },
    { name: 'Helado',     emoji: '🍦' },
    { name: 'Pizza',      emoji: '🍕' },
    { name: 'Galletas',   emoji: '🍪' },
    { name: 'Zanahoria',  emoji: '🥕' },
    { name: 'Sandía',     emoji: '🍉' },
    { name: 'Café',       emoji: '☕' },
    { name: 'Chocolate',  emoji: '🍫' },
    { name: 'Uvas',       emoji: '🍇' },
    { name: 'Naranjas',   emoji: '🍊' },
    { name: 'Aguacate',   emoji: '🥑' },
  ],
  listSize: 5,         // Cuántos productos tendrá la lista
  gridDistractors: 7,  // Cuántos distractores se muestran en la cuadrícula

  // 📌 PERSONALIZAR: Tiempos (en segundos)
  presentationTime: 20, // Tiempo para memorizar la lista
  waitTime: 15,         // Cuenta regresiva de espera
};


/**
 * 📌 PERSONALIZAR: Elementos para el Entrenador Mental (Modo 2)
 * Incluye mascotas con nombres amigables y objetos variados.
 * - emoji: Puedes cambiar por URLs de imágenes
 * - name: Nombre descriptivo (aparece en preguntas)
 * 
 * 📌 CONECTAR IMÁGENES PROPIAS:
 * Para usar imágenes en vez de emojis, cambia el campo "emoji"
 * por una URL y modifica la función renderEmoji() más abajo.
 */
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

/**
 * 📌 PERSONALIZAR: Configuración de cada nivel del Entrenador
 */
const LEVEL_CONFIG = {
  1: { // El Escondite
    boxCount: 5,        // Número de cajas
    memorizeTime: 5,    // Segundos para memorizar
  },
  2: { // El Intruso
    originalCount: 4,   // Imágenes originales
    memorizeTime: 5,    // Segundos para memorizar
  },
  3: { // El Cine
    sequenceLength: 4,  // Imágenes en la secuencia
    displayTime: 1500,  // Milisegundos por imagen
  },
  4: { // Las Parejas Dirigidas
    pairsCount: 3,      // Número de pares (total = pairsCount * 2)
    memorizeTime: 5,    // Segundos para memorizar
  },
};


// ══════════════════════════════════════════════════════════════
// MODO HISTORIA — La Lista del Supermercado
// ══════════════════════════════════════════════════════════════

const ModoHistoria = {
  currentList: [],      // Productos que el usuario debe recordar
  selectedItems: [],    // Lo que el usuario ha seleccionado
  allGridItems: [],     // Todos los items en la cuadrícula
  timer: null,

  /**
   * Inicia el Modo Historia: genera la lista y muestra Fase 1
   */
  start() {
    // Seleccionar items aleatorios para la lista
    this.currentList = pickRandom(SHOPPING_DATA.items, SHOPPING_DATA.listSize);
    this.selectedItems = [];

    // Fase 1: Mostrar la lista
    this.renderList();
    ScreenManager.show('screen-historia-presentacion');

    // Iniciar temporizador de presentación
    this.timer = new GameTimer(
      document.getElementById('timer-historia-presentacion'),
      document.getElementById('timer-bar-historia'),
      null,
      () => this.goToWait() // Al terminar, ir a fase de espera
    );
    this.timer.start(SHOPPING_DATA.presentationTime);
  },

  /**
   * Renderiza la lista de compras en la Fase 1
   */
  renderList() {
    const listEl = document.getElementById('shopping-list-display');
    listEl.innerHTML = '';

    this.currentList.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="list-emoji" aria-hidden="true">${item.emoji}</span>
        <span>${item.name}</span>
      `;
      listEl.appendChild(li);
    });
  },

  /**
   * Fase 2: Cuenta regresiva de espera (15 segundos)
   */
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

    // Guardar referencia para limpieza
    this._waitInterval = interval;
  },

  /**
   * Fase 3: Mostrar cuadrícula de selección
   */
  goToSelection() {
    this.selectedItems = [];

    // Crear cuadrícula: items correctos + distractores
    const distractors = pickRandom(SHOPPING_DATA.distractors, SHOPPING_DATA.gridDistractors);
    this.allGridItems = shuffle([...this.currentList, ...distractors]);

    this.renderGrid();
    ScreenManager.show('screen-historia-seleccion');

    // Actualizar contador
    document.getElementById('count-total').textContent = this.currentList.length;
    document.getElementById('count-selected').textContent = '0';
  },

  /**
   * Renderiza la cuadrícula de productos
   */
  renderGrid() {
    const gridEl = document.getElementById('historia-grid');
    gridEl.innerHTML = '';

    this.allGridItems.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.className = 'grid-item';
      btn.setAttribute('role', 'gridcell');
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', item.name);
      btn.dataset.index = index;
      btn.innerHTML = `
        <span class="item-emoji" aria-hidden="true">${item.emoji}</span>
        <span class="item-label">${item.name}</span>
      `;
      btn.addEventListener('click', () => this.toggleItem(index, btn));
      gridEl.appendChild(btn);
    });
  },

  /**
   * Alterna la selección de un item
   */
  toggleItem(index, btn) {
    const itemName = this.allGridItems[index].name;
    const isSelected = this.selectedItems.includes(itemName);

    if (isSelected) {
      this.selectedItems = this.selectedItems.filter(n => n !== itemName);
      btn.classList.remove('selected');
      btn.setAttribute('aria-pressed', 'false');
    } else {
      this.selectedItems.push(itemName);
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
    }

    document.getElementById('count-selected').textContent = this.selectedItems.length;
  },

  /**
   * Fase 4: Comprobar respuestas
   */
  checkAnswers() {
    const correctNames = this.currentList.map(i => i.name);
    const hits = this.selectedItems.filter(n => correctNames.includes(n));
    const misses = correctNames.filter(n => !this.selectedItems.includes(n));
    const extras = this.selectedItems.filter(n => !correctNames.includes(n));
    const isAllCorrect = hits.length === correctNames.length && extras.length === 0;

    // Colorear la cuadrícula
    const gridItems = document.querySelectorAll('#historia-grid .grid-item');
    gridItems.forEach(el => {
      const idx = parseInt(el.dataset.index);
      const itemName = this.allGridItems[idx].name;
      el.classList.add('disabled');

      if (correctNames.includes(itemName) && this.selectedItems.includes(itemName)) {
        el.classList.add('correct');
      } else if (correctNames.includes(itemName) && !this.selectedItems.includes(itemName)) {
        el.classList.add('missed'); // Faltó seleccionarlo
      } else if (!correctNames.includes(itemName) && this.selectedItems.includes(itemName)) {
        el.classList.add('incorrect'); // Seleccionó un distractor
      }
    });

    // Mostrar resultado después de un breve delay
    setTimeout(() => {
      this.showResult(isAllCorrect, hits, misses, extras);
    }, 800);
  },

  /**
   * Muestra la pantalla de resultado
   */
  showResult(isAllCorrect, hits, misses, extras) {
    const feedbackEl = document.getElementById('historia-feedback');
    const detalleEl = document.getElementById('historia-detalle');

    if (isAllCorrect) {
      feedbackEl.className = 'feedback-card feedback-success';
      feedbackEl.innerHTML = `
        <span class="feedback-icon">🎉</span>
        <h3 class="feedback-title">¡Excelente memoria!</h3>
        <p class="feedback-message">Recordaste todos los productos de la lista. ¡Tu mente está en forma!</p>
      `;
      launchConfetti();
    } else {
      feedbackEl.className = 'feedback-card feedback-encourage';
      feedbackEl.innerHTML = `
        <span class="feedback-icon">💪</span>
        <h3 class="feedback-title">¡Buen intento!</h3>
        <p class="feedback-message">
          Recordaste ${hits.length} de ${this.currentList.length} productos.
          ${misses.length > 0 ? 'Algunos se escaparon, pero no te preocupes.' : ''}
          ${extras.length > 0 ? 'Seleccionaste algunos que no estaban en la lista.' : ''}
          ¡La práctica hace al maestro!
        </p>
      `;
    }

    // Detalle: mostrar la lista correcta
    let detalleHTML = '<p class="correct-answers-title">📋 La lista correcta era:</p>';
    detalleHTML += '<div class="correct-answers-list">';
    this.currentList.forEach(item => {
      const wasFound = hits.includes(item.name);
      detalleHTML += `
        <span class="correct-answer-chip" style="${wasFound ? '' : 'border-color: var(--color-gentle-error); background: var(--color-gentle-error-bg);'}">
          ${item.emoji} ${item.name} ${wasFound ? '✅' : '❌'}
        </span>
      `;
    });
    detalleHTML += '</div>';
    detalleEl.innerHTML = detalleHTML;

    ScreenManager.show('screen-historia-resultado');
  },

  /**
   * Limpia temporizadores al salir
   */
  cleanup() {
    if (this.timer) this.timer.stop();
    if (this._waitInterval) clearInterval(this._waitInterval);
  }
};


// ══════════════════════════════════════════════════════════════
// MODO ENTRENADOR MENTAL — 4 Minijuegos
// ══════════════════════════════════════════════════════════════

const ModoEntrenador = {
  currentLevel: 0,
  levelData: {},
  timer: null,

  /**
   * Inicia un nivel específico
   * @param {number} level - Número del nivel (1-4)
   */
  startLevel(level) {
    this.currentLevel = level;
    this.levelData = {};

    switch (level) {
      case 1: this.startNivel1(); break;
      case 2: this.startNivel2(); break;
      case 3: this.startNivel3(); break;
      case 4: this.startNivel4(); break;
    }
  },


  // ────────────────────────────────────────────
  // NIVEL 1: El Escondite
  // Muestra cajas con emoji, luego oculta y pregunta
  // ────────────────────────────────────────────
  startNivel1() {
    const config = LEVEL_CONFIG[1];
    const items = pickRandom(GAME_ITEMS, config.boxCount);

    // Asignar cada item a una caja numerada
    const boxes = items.map((item, i) => ({
      number: i + 1,
      item: item,
    }));

    this.levelData = { boxes, targetBox: null };

    // UI Setup
    document.getElementById('juego-titulo').textContent = '📦 Nivel 1: El Escondite';
    document.getElementById('juego-instrucciones-text').innerHTML =
      'Observa qué hay dentro de cada caja. <span class="highlight">¡Memoriza sus posiciones!</span>';
    document.getElementById('juego-pregunta').classList.add('hidden');
    document.getElementById('juego-btn-accion').classList.add('hidden');

    // Mostrar temporizador
    const timerContainer = document.getElementById('juego-timer-container');
    timerContainer.classList.remove('hidden');

    // Renderizar cajas CON emojis visibles
    this.renderNivel1Boxes(true);

    ScreenManager.show('screen-juego');

    // Temporizador de memorización
    this.timer = new GameTimer(
      document.getElementById('juego-timer-text'),
      document.getElementById('juego-timer-bar'),
      null,
      () => this.nivel1AskQuestion()
    );
    this.timer.start(config.memorizeTime);
  },

  renderNivel1Boxes(showContent) {
    const area = document.getElementById('juego-area');
    const boxes = this.levelData.boxes;

    area.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'game-grid cols-3';

    boxes.forEach((box, idx) => {
      const el = document.createElement('div');
      el.className = 'grid-item' + (showContent ? '' : ' hidden-content');
      el.dataset.boxIndex = idx;
      el.innerHTML = `
        <span class="item-number">${box.number}</span>
        <span class="item-emoji" aria-hidden="true">${box.item.emoji}</span>
        <span class="item-label">${showContent ? box.item.name : '???'}</span>
      `;

      if (!showContent) {
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `Caja número ${box.number}`);
        el.addEventListener('click', () => this.nivel1SelectBox(idx));
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.nivel1SelectBox(idx);
          }
        });
      }

      grid.appendChild(el);
    });

    area.appendChild(grid);
  },

  nivel1AskQuestion() {
    if (this.timer) this.timer.stop();
    document.getElementById('juego-timer-container').classList.add('hidden');

    // Elegir una caja aleatoria para preguntar
    const randomIdx = Math.floor(Math.random() * this.levelData.boxes.length);
    const targetBox = this.levelData.boxes[randomIdx];
    this.levelData.targetBox = targetBox;
    this.levelData.targetIndex = randomIdx;

    // Ocultar contenido de las cajas
    this.renderNivel1Boxes(false);

    // Mostrar pregunta
    const preguntaEl = document.getElementById('juego-pregunta');
    preguntaEl.classList.remove('hidden');
    document.getElementById('juego-pregunta-emoji').textContent = targetBox.item.emoji;
    document.getElementById('juego-pregunta-text').textContent =
      `¿En qué número estaba ${targetBox.item.name}?`;

    document.getElementById('juego-instrucciones-text').innerHTML =
      'Toca la caja donde crees que estaba. <span class="highlight">Sin prisa.</span>';
  },

  nivel1SelectBox(idx) {
    const boxes = this.levelData.boxes;
    const isCorrect = idx === this.levelData.targetIndex;

    // Revelar todas las cajas
    const gridItems = document.querySelectorAll('#juego-area .grid-item');
    gridItems.forEach((el, i) => {
      el.classList.remove('hidden-content');
      el.classList.add('revealed', 'disabled');
      el.querySelector('.item-label').textContent = boxes[i].item.name;

      if (i === this.levelData.targetIndex) {
        el.classList.add('correct');
      }
      if (i === idx && !isCorrect) {
        el.classList.add('incorrect');
      }
    });

    setTimeout(() => {
      this.showLevelResult(isCorrect, {
        correctAnswer: `${this.levelData.targetBox.item.emoji} ${this.levelData.targetBox.item.name} estaba en la caja ${this.levelData.targetBox.number}`,
      });
    }, 1000);
  },


  // ────────────────────────────────────────────
  // NIVEL 2: El Intruso
  // Muestra grupo original, luego agrega intruso
  // ────────────────────────────────────────────
  startNivel2() {
    const config = LEVEL_CONFIG[2];
    const allItems = shuffle(GAME_ITEMS);
    const original = allItems.slice(0, config.originalCount);
    const intruder = allItems[config.originalCount]; // El intruso

    this.levelData = {
      original,
      intruder,
      phase: 'memorize',
    };

    // UI Setup
    document.getElementById('juego-titulo').textContent = '🔎 Nivel 2: El Intruso';
    document.getElementById('juego-instrucciones-text').innerHTML =
      'Observa estos personajes con atención. <span class="highlight">¡Uno se colará después!</span>';
    document.getElementById('juego-pregunta').classList.add('hidden');
    document.getElementById('juego-btn-accion').classList.add('hidden');
    document.getElementById('juego-opciones').innerHTML = '';

    // Mostrar temporizador
    document.getElementById('juego-timer-container').classList.remove('hidden');

    // Renderizar grupo original
    this.renderNivel2Grid(original);

    ScreenManager.show('screen-juego');

    // Temporizador
    this.timer = new GameTimer(
      document.getElementById('juego-timer-text'),
      document.getElementById('juego-timer-bar'),
      null,
      () => this.nivel2ShowIntruder()
    );
    this.timer.start(config.memorizeTime);
  },

  renderNivel2Grid(items, clickable = false) {
    const area = document.getElementById('juego-area');
    area.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'game-grid cols-3';

    items.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'grid-item';
      el.dataset.itemName = item.name;
      el.innerHTML = `
        <span class="item-emoji" aria-hidden="true">${item.emoji}</span>
        <span class="item-label">${item.name}</span>
      `;

      if (clickable) {
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `Seleccionar ${item.name}`);
        el.addEventListener('click', () => this.nivel2Select(item, el));
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.nivel2Select(item, el);
          }
        });
      }

      grid.appendChild(el);
    });

    area.appendChild(grid);
  },

  nivel2ShowIntruder() {
    if (this.timer) this.timer.stop();
    document.getElementById('juego-timer-container').classList.add('hidden');

    // Efecto de parpadeo/flash
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);

    // Crear grupo con el intruso mezclado
    const mixed = shuffle([...this.levelData.original, this.levelData.intruder]);

    // Pequeño delay para el efecto del flash
    setTimeout(() => {
      this.renderNivel2Grid(mixed, true);

      document.getElementById('juego-pregunta').classList.remove('hidden');
      document.getElementById('juego-pregunta-emoji').textContent = '🤔';
      document.getElementById('juego-pregunta-text').textContent =
        '¿Cuál de estos NO estaba antes?';

      document.getElementById('juego-instrucciones-text').innerHTML =
        'Toca al intruso. <span class="highlight">Tómate tu tiempo.</span>';
    }, 400);
  },

  nivel2Select(item, el) {
    const isCorrect = item.name === this.levelData.intruder.name;

    // Deshabilitar todos los items
    const gridItems = document.querySelectorAll('#juego-area .grid-item');
    gridItems.forEach(gi => {
      gi.classList.add('disabled');
      if (gi.dataset.itemName === this.levelData.intruder.name) {
        gi.classList.add('correct');
      }
    });

    if (!isCorrect) {
      el.classList.add('incorrect');
    }

    setTimeout(() => {
      this.showLevelResult(isCorrect, {
        correctAnswer: `${this.levelData.intruder.emoji} ${this.levelData.intruder.name} era el intruso`,
      });
    }, 1000);
  },


  // ────────────────────────────────────────────
  // NIVEL 3: El Cine
  // Muestra secuencia rápida y pregunta si un item apareció
  // ────────────────────────────────────────────
  async startNivel3() {
    const config = LEVEL_CONFIG[3];
    const allItems = shuffle(GAME_ITEMS);
    const sequence = allItems.slice(0, config.sequenceLength);
    // 50% de chance de preguntar por uno que SÍ apareció
    const askSeen = Math.random() < 0.5;
    let questionItem;

    if (askSeen) {
      questionItem = sequence[Math.floor(Math.random() * sequence.length)];
    } else {
      // Elegir uno que NO esté en la secuencia
      questionItem = allItems[config.sequenceLength];
    }

    this.levelData = { sequence, questionItem, askSeen };

    // UI Setup
    document.getElementById('juego-titulo').textContent = '🎬 Nivel 3: El Cine';
    document.getElementById('juego-instrucciones-text').innerHTML =
      'Observa la secuencia con atención. <span class="highlight">¡Es como una película!</span>';
    document.getElementById('juego-pregunta').classList.add('hidden');
    document.getElementById('juego-btn-accion').classList.add('hidden');
    document.getElementById('juego-timer-container').classList.add('hidden');
    document.getElementById('juego-opciones').innerHTML = '';

    // Área de cine
    const area = document.getElementById('juego-area');
    area.innerHTML = '<div class="cinema-display" id="cinema-screen"></div>';

    ScreenManager.show('screen-juego');

    // Pausa inicial
    await wait(800);

    // Mostrar secuencia
    const cinemaScreen = document.getElementById('cinema-screen');
    for (const item of sequence) {
      cinemaScreen.innerHTML = `
        <div class="cinema-item">
          <span class="item-emoji">${item.emoji}</span>
          <span class="item-label">${item.name}</span>
        </div>
      `;
      await wait(config.displayTime);
      cinemaScreen.innerHTML = ''; // Limpiar entre imágenes
      await wait(300);
    }

    // Mostrar pregunta
    this.nivel3AskQuestion();
  },

  nivel3AskQuestion() {
    const { questionItem } = this.levelData;

    document.getElementById('juego-instrucciones-text').innerHTML =
      'Piensa tranquilamente. <span class="highlight">¿Apareció en la película?</span>';

    const preguntaEl = document.getElementById('juego-pregunta');
    preguntaEl.classList.remove('hidden');
    document.getElementById('juego-pregunta-emoji').textContent = questionItem.emoji;
    document.getElementById('juego-pregunta-text').textContent =
      `¿Viste esto en la película?`;

    // Mostrar nombre del item debajo de la pregunta
    const area = document.getElementById('juego-area');
    area.innerHTML = `
      <div class="cinema-display">
        <div style="text-align: center; padding: var(--space-lg);">
          <span style="font-size: 72px; display: block;">${questionItem.emoji}</span>
          <span style="font-size: var(--font-size-lg); font-weight: 700; margin-top: var(--space-sm); display: block;">${questionItem.name}</span>
        </div>
      </div>
    `;

    // Botones SÍ / NO
    const opciones = document.getElementById('juego-opciones');
    opciones.innerHTML = `
      <div class="btn-group-yesno">
        <button class="btn btn-yes" id="btn-cine-si" aria-label="Sí, lo vi">SÍ ✅</button>
        <button class="btn btn-no" id="btn-cine-no" aria-label="No, no lo vi">NO ❌</button>
      </div>
    `;

    document.getElementById('btn-cine-si').addEventListener('click', () => this.nivel3Answer(true));
    document.getElementById('btn-cine-no').addEventListener('click', () => this.nivel3Answer(false));
  },

  nivel3Answer(userSaidYes) {
    const { askSeen, sequence, questionItem } = this.levelData;
    const isCorrect = userSaidYes === askSeen;

    // Deshabilitar botones
    document.getElementById('btn-cine-si').disabled = true;
    document.getElementById('btn-cine-no').disabled = true;

    // Resaltar la respuesta correcta
    if (askSeen) {
      document.getElementById('btn-cine-si').classList.add('correct');
    } else {
      document.getElementById('btn-cine-no').classList.add('correct');
    }

    let detail = askSeen
      ? `${questionItem.emoji} ${questionItem.name} SÍ apareció en la secuencia`
      : `${questionItem.emoji} ${questionItem.name} NO apareció en la secuencia`;

    // Mostrar la secuencia completa como referencia
    let seqHTML = '<p class="correct-answers-title">🎬 La secuencia fue:</p>';
    seqHTML += '<div class="correct-answers-list">';
    sequence.forEach(item => {
      seqHTML += `<span class="correct-answer-chip">${item.emoji} ${item.name}</span>`;
    });
    seqHTML += '</div>';

    setTimeout(() => {
      this.showLevelResult(isCorrect, {
        correctAnswer: detail,
        extraHTML: seqHTML,
      });
    }, 800);
  },


  // ────────────────────────────────────────────
  // NIVEL 4: Las Parejas Dirigidas
  // Tablero con pares, se voltean, el juego pide buscar un par
  // ────────────────────────────────────────────
  startNivel4() {
    const config = LEVEL_CONFIG[4];
    const items = pickRandom(GAME_ITEMS, config.pairsCount);
    // Crear pares: cada item aparece 2 veces
    const cards = shuffle([...items, ...items].map((item, i) => ({
      id: i,
      item: item,
      faceUp: true,     // Empieza boca arriba
      matched: false,
    })));

    // Elegir el par que se pedirá
    const targetItem = items[Math.floor(Math.random() * items.length)];

    this.levelData = {
      cards,
      targetItem,
      selectedCards: [],
      phase: 'memorize',
    };

    // UI Setup
    document.getElementById('juego-titulo').textContent = '🃏 Nivel 4: Las Parejas';
    document.getElementById('juego-instrucciones-text').innerHTML =
      'Observa dónde está cada imagen. <span class="highlight">¡Memoriza las posiciones!</span>';
    document.getElementById('juego-pregunta').classList.add('hidden');
    document.getElementById('juego-btn-accion').classList.add('hidden');
    document.getElementById('juego-opciones').innerHTML = '';

    // Mostrar temporizador
    document.getElementById('juego-timer-container').classList.remove('hidden');

    // Renderizar tablero boca arriba
    this.renderNivel4Board(true);

    ScreenManager.show('screen-juego');

    // Temporizador de memorización
    this.timer = new GameTimer(
      document.getElementById('juego-timer-text'),
      document.getElementById('juego-timer-bar'),
      null,
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
      wrapper.innerHTML = `
        <div class="card-flip-inner">
          <div class="card-face card-front">
            <span style="font-size: 32px;">?</span>
          </div>
          <div class="card-face card-back">
            <span class="item-emoji" style="font-size: 36px;">${card.item.emoji}</span>
            <span class="item-label" style="font-size: 14px; margin-top: 4px;">${card.item.name}</span>
          </div>
        </div>
      `;

      if (!faceUp) {
        wrapper.setAttribute('role', 'button');
        wrapper.setAttribute('tabindex', '0');
        wrapper.setAttribute('aria-label', `Carta ${idx + 1}`);
        wrapper.style.cursor = 'pointer';
        wrapper.addEventListener('click', () => this.nivel4SelectCard(idx));
        wrapper.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.nivel4SelectCard(idx);
          }
        });
      }

      grid.appendChild(wrapper);
    });

    area.appendChild(grid);
  },

  nivel4FlipDown() {
    if (this.timer) this.timer.stop();
    document.getElementById('juego-timer-container').classList.add('hidden');

    // Voltear todas las cartas (boca abajo)
    this.renderNivel4Board(false);

    // Mostrar pregunta: buscar el par específico
    const { targetItem } = this.levelData;
    document.getElementById('juego-pregunta').classList.remove('hidden');
    document.getElementById('juego-pregunta-emoji').textContent = targetItem.emoji;
    document.getElementById('juego-pregunta-text').textContent =
      `Busca las dos cartas de: ${targetItem.name}`;

    document.getElementById('juego-instrucciones-text').innerHTML =
      'Toca las dos cartas donde estaba <span class="highlight">' + targetItem.name + '</span>';
  },

  nivel4SelectCard(idx) {
    const { cards, targetItem, selectedCards } = this.levelData;
    const card = cards[idx];

    // No permitir seleccionar más de 2 cartas, o la misma carta
    if (selectedCards.includes(idx) || selectedCards.length >= 2) return;

    // Voltear carta
    const cardEl = document.querySelector(`[data-card-index="${idx}"]`);
    cardEl.classList.add('flipped');
    selectedCards.push(idx);

    if (selectedCards.length === 2) {
      // Evaluar las dos cartas
      setTimeout(() => {
        const card1 = cards[selectedCards[0]];
        const card2 = cards[selectedCards[1]];
        const bothCorrect = card1.item.name === targetItem.name && card2.item.name === targetItem.name;

        // Revelar todo
        const allCards = document.querySelectorAll('.card-flip');
        allCards.forEach(c => {
          c.classList.add('flipped');
          c.style.pointerEvents = 'none';
        });

        // Marcar las correctas
        allCards.forEach((c, i) => {
          if (cards[i].item.name === targetItem.name) {
            c.querySelector('.card-back').style.border = '3px solid var(--color-success)';
            c.querySelector('.card-back').style.background = 'var(--color-correct-highlight)';
          }
        });

        // Marcar las seleccionadas incorrectas
        if (!bothCorrect) {
          selectedCards.forEach(si => {
            if (cards[si].item.name !== targetItem.name) {
              const sc = document.querySelector(`[data-card-index="${si}"]`);
              sc.querySelector('.card-back').style.border = '3px solid var(--color-gentle-error)';
              sc.querySelector('.card-back').style.background = 'var(--color-gentle-error-bg)';
            }
          });
        }

        setTimeout(() => {
          this.showLevelResult(bothCorrect, {
            correctAnswer: `${targetItem.emoji} ${targetItem.name} estaba en esas posiciones`,
          });
        }, 1200);
      }, 600);
    }
  },


  // ────────────────────────────────────────────
  // Resultado de Nivel (compartido)
  // ────────────────────────────────────────────
  showLevelResult(isCorrect, details) {
    const feedbackEl = document.getElementById('juego-feedback');
    const detalleEl = document.getElementById('juego-detalle');

    const encourageMessages = [
      '¡Cada intento te hace más fuerte!',
      '¡La práctica lleva a la perfección!',
      '¡Tu cerebro está trabajando muy bien!',
      '¡No te rindas, vas por buen camino!',
      '¡Inténtalo otra vez, tú puedes!',
    ];

    const successMessages = [
      '¡Impresionante! Tu memoria es genial.',
      '¡Lo lograste! Tu mente es muy ágil.',
      '¡Fantástico! Eres todo un campeón.',
      '¡Brillante! Tu cerebro está en forma.',
      '¡Maravilloso! Qué buena memoria tienes.',
    ];

    if (isCorrect) {
      feedbackEl.className = 'feedback-card feedback-success';
      feedbackEl.innerHTML = `
        <span class="feedback-icon">🎉</span>
        <h3 class="feedback-title">¡Correcto!</h3>
        <p class="feedback-message">${successMessages[Math.floor(Math.random() * successMessages.length)]}</p>
      `;
      launchConfetti();
    } else {
      feedbackEl.className = 'feedback-card feedback-encourage';
      feedbackEl.innerHTML = `
        <span class="feedback-icon">💪</span>
        <h3 class="feedback-title">¡Casi lo logras!</h3>
        <p class="feedback-message">${encourageMessages[Math.floor(Math.random() * encourageMessages.length)]}</p>
      `;
    }

    // Mostrar la respuesta correcta siempre
    let detalleHTML = `<p class="correct-answers-title">✨ Respuesta correcta:</p>`;
    detalleHTML += `<div class="correct-answers-list">
      <span class="correct-answer-chip">${details.correctAnswer}</span>
    </div>`;

    if (details.extraHTML) {
      detalleHTML += `<div class="spacer-md"></div>${details.extraHTML}`;
    }

    detalleEl.innerHTML = detalleHTML;

    // Mostrar botón de siguiente nivel si hay
    const btnSiguiente = document.getElementById('btn-juego-siguiente');
    if (this.currentLevel < 4) {
      btnSiguiente.classList.remove('hidden');
      btnSiguiente.textContent = `➡️ Nivel ${this.currentLevel + 1}`;
    } else {
      btnSiguiente.classList.add('hidden');
    }

    ScreenManager.show('screen-juego-resultado');
  },

  /**
   * Limpia temporizadores al salir
   */
  cleanup() {
    if (this.timer) this.timer.stop();
  }
};


// ══════════════════════════════════════════════════════════════
// INICIALIZACIÓN Y EVENT LISTENERS
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Menú Principal ──
  document.getElementById('btn-modo-historia').addEventListener('click', () => {
    ModoHistoria.start();
  });

  document.getElementById('btn-modo-entrenador').addEventListener('click', () => {
    ScreenManager.show('screen-entrenador-menu');
  });


  // ── Modo Historia: Navegación ──
  document.getElementById('btn-historia-listo').addEventListener('click', () => {
    ModoHistoria.goToWait();
  });

  document.getElementById('btn-historia-comprobar').addEventListener('click', () => {
    ModoHistoria.checkAnswers();
  });

  document.getElementById('btn-historia-reintentar').addEventListener('click', () => {
    ModoHistoria.cleanup();
    ModoHistoria.start();
  });

  document.getElementById('btn-historia-menu').addEventListener('click', () => {
    ModoHistoria.cleanup();
    ScreenManager.show('screen-menu');
  });

  // Botones de volver (Historia)
  document.getElementById('btn-back-historia-1').addEventListener('click', () => {
    ModoHistoria.cleanup();
    ScreenManager.show('screen-menu');
  });

  document.getElementById('btn-back-historia-3').addEventListener('click', () => {
    ModoHistoria.cleanup();
    ScreenManager.show('screen-menu');
  });


  // ── Modo Entrenador: Navegación ──
  document.getElementById('btn-back-entrenador').addEventListener('click', () => {
    ScreenManager.show('screen-menu');
  });

  // Botones de niveles
  document.getElementById('btn-nivel-1').addEventListener('click', () => {
    ModoEntrenador.startLevel(1);
  });
  document.getElementById('btn-nivel-2').addEventListener('click', () => {
    ModoEntrenador.startLevel(2);
  });
  document.getElementById('btn-nivel-3').addEventListener('click', () => {
    ModoEntrenador.startLevel(3);
  });
  document.getElementById('btn-nivel-4').addEventListener('click', () => {
    ModoEntrenador.startLevel(4);
  });

  // Volver desde juego a niveles
  document.getElementById('btn-back-juego').addEventListener('click', () => {
    ModoEntrenador.cleanup();
    ScreenManager.show('screen-entrenador-menu');
  });

  // Resultado: reintentar
  document.getElementById('btn-juego-reintentar').addEventListener('click', () => {
    ModoEntrenador.cleanup();
    ModoEntrenador.startLevel(ModoEntrenador.currentLevel);
  });

  // Resultado: siguiente nivel
  document.getElementById('btn-juego-siguiente').addEventListener('click', () => {
    ModoEntrenador.cleanup();
    if (ModoEntrenador.currentLevel < 4) {
      ModoEntrenador.startLevel(ModoEntrenador.currentLevel + 1);
    }
  });

  // Resultado: volver a niveles
  document.getElementById('btn-juego-niveles').addEventListener('click', () => {
    ModoEntrenador.cleanup();
    ScreenManager.show('screen-entrenador-menu');
  });


  // ── Accesibilidad: Focus visible solo con teclado ──
  let isUsingKeyboard = false;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      isUsingKeyboard = true;
      document.body.classList.add('keyboard-nav');
    }
  });

  document.addEventListener('mousedown', () => {
    isUsingKeyboard = false;
    document.body.classList.remove('keyboard-nav');
  });

  // ── Prevenir zoom accidental en iOS ──
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });

  /*
   * 📌 CONECTAR AUDIOS:
   * Para agregar retroalimentación auditiva, puedes usar la Web Audio API
   * o elementos <audio>. Ejemplo:
   *
   * const sonidoCorrecto = new Audio('audios/correcto.mp3');
   * const sonidoIncorrecto = new Audio('audios/incorrecto.mp3');
   *
   * Luego, en las funciones de resultado:
   * if (isCorrect) sonidoCorrecto.play();
   * else sonidoIncorrecto.play();
   *
   * 📌 CONECTAR IMÁGENES:
   * Para usar imágenes reales en vez de emojis, modifica los objetos
   * en SHOPPING_DATA y GAME_ITEMS:
   *
   * { name: 'Gato Vinitzzie', emoji: '<img src="img/vinitzzie.jpg" alt="Gato Vinitzzie">' }
   *
   * O mejor aún, cambia la propiedad "emoji" por "image" y modifica
   * el HTML generado en las funciones render para usar <img>.
   */
});
