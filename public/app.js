/* ------------------------------------------------------------------ *
 * Template S-12 — Cartão de Mapa de Território
 * Porta fiel do componente React (template.md) para JS puro,
 * sem login, sem build e sem dependências.
 * ------------------------------------------------------------------ */

/* § 4 — Constantes do módulo */
const MAP_MIN_CQW = 8; // tamanho mínimo da imagem (% / cqw)
const MAP_MAX_CQW = 80; // tamanho máximo da imagem
const SIZE_STEP_CQW = 2; // passo do +/-
const DEFAULT_SIZE_CQW = 36; // tamanho padrão

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/* ---------------------------------------------------------------- *
 * Toast (substitui o `sonner` do projeto original)
 * ---------------------------------------------------------------- */

const toastContainer = document.querySelector('[data-toast-container]');

function showToast(message, type = 'error') {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  toastContainer.appendChild(el);

  setTimeout(() => {
    el.classList.add('toast--out');
    setTimeout(() => el.remove(), 200);
  }, 3200);
}

const toast = { error: (msg) => showToast(msg, 'error') };

/* ---------------------------------------------------------------- *
 * Refs / estado (§ 5)
 * ---------------------------------------------------------------- */

const mapRef = document.querySelector('[data-map]');
const fileInput = document.querySelector('[data-file-input]');

let uploaded = null; // URL blob: da imagem carregada
let pos = { x: 50, y: 50 }; // posição da imagem em % (centro)
let size = DEFAULT_SIZE_CQW; // largura da imagem em cqw
let dragRef = null; // snapshot do início do arrasto

/* Imagem do mapa (renderizada dinamicamente, como no <img> condicional) */
const mapImg = document.createElement('img');
mapImg.className = 's12-map-img';
mapImg.alt = 'Mapa do território';
mapImg.draggable = false;
mapImg.hidden = true;
mapImg.addEventListener('pointerdown', onPointerDown);
mapImg.addEventListener('pointermove', onPointerMove);
mapImg.addEventListener('pointerup', () => {
  dragRef = null;
});
mapImg.addEventListener('pointercancel', () => {
  dragRef = null;
});
mapRef.appendChild(mapImg);

/* ---------------------------------------------------------------- *
 * Campos sincronizados (toolbar + cartão)
 * ---------------------------------------------------------------- */

const localidadeInputs = [...document.querySelectorAll('[data-localidade]')];
const numeroInputs = [...document.querySelectorAll('[data-numero]')];

localidadeInputs.forEach((input) => {
  input.addEventListener('input', () => {
    localidadeInputs.forEach((other) => {
      if (other !== input) other.value = input.value;
    });
  });
});

numeroInputs.forEach((input) => {
  input.addEventListener('input', () => {
    numeroInputs.forEach((other) => {
      if (other !== input) other.value = input.value;
    });
  });
});

/* ---------------------------------------------------------------- *
 * Handlers (§ 6)
 * ---------------------------------------------------------------- */

/* 6.1 Carregar arquivo */
function loadFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast.error('Envie um arquivo de imagem.');
    return;
  }
  const url = URL.createObjectURL(file);
  if (uploaded) URL.revokeObjectURL(uploaded);
  uploaded = url;
  mapImg.src = url;
  mapImg.hidden = false;
  render();
}

/* 6.2 Centralizar */
function reset() {
  pos = { x: 50, y: 50 };
  size = DEFAULT_SIZE_CQW;
  render();
}

/* 6.3 Arrastar a imagem (pointer events) */
function onPointerDown(e) {
  dragRef = { startX: e.clientX, startY: e.clientY, px: pos.x, py: pos.y };
  e.currentTarget.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  const drag = dragRef;
  const frame = mapRef;
  if (!drag || !frame) return;
  const dx = ((e.clientX - drag.startX) / frame.clientWidth) * 100;
  const dy = ((e.clientY - drag.startY) / frame.clientHeight) * 100;
  pos = {
    x: clamp(drag.px + dx, 5, 95),
    y: clamp(drag.py + dy, 5, 95),
  };
  render();
}

/* ---------------------------------------------------------------- *
 * Render — aplica estado na imagem e nos botões
 * ---------------------------------------------------------------- */

const btnSelect = document.querySelector('[data-action="select"]');
const btnSelectLabel = btnSelect.querySelector('[data-label]');
const btnZoomOut = document.querySelector('[data-action="zoom-out"]');
const btnZoomIn = document.querySelector('[data-action="zoom-in"]');
const btnReset = document.querySelector('[data-action="reset"]');
const sizeValue = document.querySelector('[data-size-value]');

function render() {
  mapImg.style.left = `${pos.x}%`;
  mapImg.style.top = `${pos.y}%`;
  mapImg.style.width = `${size}cqw`;

  btnSelectLabel.textContent = uploaded ? 'Trocar imagem' : 'Selecionar imagem';
  sizeValue.textContent = `${size}%`;

  btnZoomOut.disabled = !uploaded || size <= MAP_MIN_CQW;
  btnZoomIn.disabled = !uploaded || size >= MAP_MAX_CQW;
  btnReset.disabled = !uploaded;
}

/* ---------------------------------------------------------------- *
 * Ligações da toolbar
 * ---------------------------------------------------------------- */

btnSelect.addEventListener('click', () => fileInput.click());

btnZoomOut.addEventListener('click', () => {
  size = Math.max(MAP_MIN_CQW, size - SIZE_STEP_CQW);
  render();
});

btnZoomIn.addEventListener('click', () => {
  size = Math.min(MAP_MAX_CQW, size + SIZE_STEP_CQW);
  render();
});

btnReset.addEventListener('click', reset);

document.querySelector('[data-action="print"]').addEventListener('click', () => {
  window.print();
});

/* § 8.5 — Input de arquivo oculto */
fileInput.addEventListener('change', (e) => {
  loadFile(e.target.files?.[0]);
  e.target.value = '';
});

/* § 8.3 — Drop na folha do cartão */
const sheet = document.querySelector('.s12-sheet');
sheet.addEventListener('dragover', (e) => e.preventDefault());
sheet.addEventListener('drop', (e) => {
  e.preventDefault();
  loadFile(e.dataTransfer.files?.[0]);
});

/* Estado inicial */
render();
