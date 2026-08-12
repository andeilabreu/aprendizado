import {
  DARK,
  LIGHT,
  applyMove,
  countPieces,
  createBoard,
  findMove,
  hasAnyMove,
  legalMoves,
  opposite,
  samePos,
} from "./rules.js";
import { chooseMove } from "./ai.js";

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const hintEl = document.getElementById("hint");
const countDarkEl = document.getElementById("count-dark");
const countLightEl = document.getElementById("count-light");
const labelDarkEl = document.getElementById("label-dark");
const labelLightEl = document.getElementById("label-light");
const taglineEl = document.getElementById("tagline");
const btnNew = document.getElementById("btn-new");
const btnUndo = document.getElementById("btn-undo");
const modal = document.getElementById("modal");
const modalText = document.getElementById("modal-text");
const btnModalNew = document.getElementById("btn-modal-new");
const modeButtons = [...document.querySelectorAll(".mode-btn")];

/** Lado controlado pela máquina no modo CPU (joga primeiro) */
const CPU_SIDE = DARK;

/** @type {{ board: import('./rules.js').Cell[][], turn: import('./rules.js').Side, selected: import('./rules.js').Pos | null, history: { board: import('./rules.js').Cell[][], turn: import('./rules.js').Side }[], winner: import('./rules.js').Side | 'draw' | null, mode: 'pvp' | 'cpu', thinking: boolean }} */
const state = {
  board: createBoard(),
  turn: DARK,
  selected: null,
  history: [],
  winner: null,
  mode: "pvp",
  thinking: false,
};

/** @type {ReturnType<typeof setTimeout> | null} */
let cpuTimer = null;

function sideLabel(side) {
  if (state.mode === "cpu") {
    return side === CPU_SIDE ? "máquina" : "você";
  }
  return side === DARK ? "pretas" : "brancas";
}

function isHumanTurn() {
  if (state.winner || state.thinking) return false;
  if (state.mode === "pvp") return true;
  return state.turn !== CPU_SIDE;
}

function currentMoves() {
  if (state.winner) return [];
  return legalMoves(state.board, state.turn);
}

function movesFromSelected() {
  if (!state.selected) return [];
  return currentMoves().filter((m) => samePos(m.from, state.selected));
}

function mustCapturePieces() {
  const moves = currentMoves();
  if (!moves.length || moves[0].captured.length === 0) return [];
  const keys = new Set();
  /** @type {import('./rules.js').Pos[]} */
  const positions = [];
  for (const m of moves) {
    const key = `${m.from.r},${m.from.c}`;
    if (keys.has(key)) continue;
    keys.add(key);
    positions.push(m.from);
  }
  return positions;
}

function updateModeLabels() {
  modeButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.mode === state.mode);
  });

  if (state.mode === "cpu") {
    labelDarkEl.textContent = "Máquina";
    labelLightEl.textContent = "Você";
    taglineEl.textContent = "Você joga de brancas. A máquina começa de pretas.";
  } else {
    labelDarkEl.textContent = "Pretas";
    labelLightEl.textContent = "Brancas";
    taglineEl.textContent = "Duas pessoas, um tabuleiro, regras brasileiras.";
  }
}

function updateHud() {
  const dark = countPieces(state.board, DARK);
  const light = countPieces(state.board, LIGHT);
  countDarkEl.textContent = `${dark} ${dark === 1 ? "peça" : "peças"}`;
  countLightEl.textContent = `${light} ${light === 1 ? "peça" : "peças"}`;

  document.querySelectorAll(".player").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.side === state.turn && !state.winner);
  });

  btnUndo.disabled =
    state.history.length === 0 || Boolean(state.winner) || state.thinking;

  if (state.winner === "draw") {
    statusEl.textContent = "Empate";
    hintEl.textContent = "Nenhuma jogada restante para ambos.";
    return;
  }

  if (state.winner) {
    if (state.mode === "cpu") {
      statusEl.textContent =
        state.winner === CPU_SIDE ? "A máquina venceu" : "Você venceu";
    } else {
      statusEl.textContent = `${sideLabel(state.winner)} venceram`;
    }
    hintEl.textContent = "Inicie uma nova partida para jogar de novo.";
    return;
  }

  if (state.thinking) {
    statusEl.textContent = "Vez da máquina";
    hintEl.textContent = "A máquina está pensando…";
    return;
  }

  if (state.mode === "cpu") {
    statusEl.textContent = isHumanTurn() ? "Sua vez" : "Vez da máquina";
  } else {
    statusEl.textContent = `Vez das ${sideLabel(state.turn)}`;
  }

  const moves = currentMoves();
  if (moves.length && moves[0].captured.length > 0) {
    hintEl.textContent = `Captura obrigatória (${moves[0].captured.length} peça${moves[0].captured.length > 1 ? "s" : ""}).`;
  } else if (state.selected) {
    hintEl.textContent = "Toque ou solte na casa destacada.";
  } else if (state.mode === "cpu") {
    hintEl.textContent = "Toque ou arraste sua peça (brancas).";
  } else {
    hintEl.textContent = "Toque ou arraste uma peça para mover.";
  }
}

function showWinner(winner) {
  state.winner = winner;
  state.thinking = false;
  if (winner === "draw") {
    modalText.textContent = "Não há mais jogadas possíveis.";
  } else if (state.mode === "cpu") {
    modalText.textContent =
      winner === CPU_SIDE
        ? "A máquina venceu a partida."
        : "Parabéns! Você venceu a máquina.";
  } else {
    modalText.textContent = `As ${sideLabel(winner)} venceram a partida.`;
  }
  modal.hidden = false;
  updateHud();
  render();
}

function checkEnd() {
  const dark = countPieces(state.board, DARK);
  const light = countPieces(state.board, LIGHT);
  if (dark === 0) {
    showWinner(LIGHT);
    return true;
  }
  if (light === 0) {
    showWinner(DARK);
    return true;
  }
  if (!hasAnyMove(state.board, state.turn)) {
    showWinner(opposite(state.turn));
    return true;
  }
  return false;
}

function pushHistory() {
  state.history.push({
    board: state.board.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
    turn: state.turn,
  });
}

function cancelCpuTimer() {
  if (cpuTimer != null) {
    clearTimeout(cpuTimer);
    cpuTimer = null;
  }
  state.thinking = false;
}

function scheduleCpuMove() {
  cancelCpuTimer();
  if (state.mode !== "cpu" || state.winner) return;
  if (state.turn !== CPU_SIDE) return;

  state.thinking = true;
  state.selected = null;
  updateHud();
  render();

  cpuTimer = setTimeout(() => {
    cpuTimer = null;
    if (state.mode !== "cpu" || state.winner || state.turn !== CPU_SIDE) {
      state.thinking = false;
      updateHud();
      render();
      return;
    }

    const move = chooseMove(state.board, CPU_SIDE);
    state.thinking = false;
    if (!move) {
      checkEnd();
      return;
    }

    pushHistory();
    state.board = applyMove(state.board, move);
    state.selected = null;
    state.turn = opposite(state.turn);
    updateHud();
    render();
    checkEnd();
  }, 450);
}

function newGame() {
  cancelCpuTimer();
  state.board = createBoard();
  state.turn = DARK;
  state.selected = null;
  state.history = [];
  state.winner = null;
  modal.hidden = true;
  updateModeLabels();
  updateHud();
  render();
  scheduleCpuMove();
}

/**
 * @param {'pvp' | 'cpu'} mode
 */
function setMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  newGame();
}

function undo() {
  if (state.thinking) return;
  cancelCpuTimer();

  if (state.mode === "cpu") {
    // Desfaz a resposta da máquina (se houver) e a jogada do humano
    if (state.turn !== CPU_SIDE && state.history.length >= 2) {
      state.history.pop();
      const prev = state.history.pop();
      if (!prev) return;
      state.board = prev.board;
      state.turn = prev.turn;
    } else if (state.history.length >= 1) {
      const prev = state.history.pop();
      if (!prev) return;
      state.board = prev.board;
      state.turn = prev.turn;
    } else {
      return;
    }
  } else {
    const prev = state.history.pop();
    if (!prev) return;
    state.board = prev.board;
    state.turn = prev.turn;
  }

  state.selected = null;
  state.winner = null;
  modal.hidden = true;
  updateHud();
  render();
  scheduleCpuMove();
}

/**
 * @param {import('./rules.js').Pos} pos
 */
function onSquareClick(pos) {
  if (!isHumanTurn()) return;

  const moves = currentMoves();
  const piece = state.board[pos.r][pos.c];

  if (state.selected) {
    const move = findMove(moves, state.selected, pos);
    if (move) {
      pushHistory();
      state.board = applyMove(state.board, move);
      state.selected = null;
      state.turn = opposite(state.turn);
      updateHud();
      render();
      if (!checkEnd()) scheduleCpuMove();
      return;
    }
  }

  if (piece?.side === state.turn) {
    const canMove = moves.some((m) => samePos(m.from, pos));
    if (!canMove) {
      hintEl.textContent =
        moves.length && moves[0].captured.length > 0
          ? "Há captura obrigatória com outra peça."
          : "Essa peça não tem jogada agora.";
      return;
    }
    state.selected = samePos(state.selected ?? { r: -1, c: -1 }, pos) ? null : pos;
    updateHud();
    render();
  }
}

/** @type {{ pointerId: number, from: import('./rules.js').Pos, pieceEl: HTMLElement, startX: number, startY: number, moved: boolean } | null} */
let drag = null;

function clearDragVisual() {
  if (!drag?.pieceEl) return;
  drag.pieceEl.classList.remove("is-dragging");
  drag.pieceEl.style.transform = "";
  drag.pieceEl.style.zIndex = "";
  drag.pieceEl.style.pointerEvents = "";
}

/**
 * @param {number} clientX
 * @param {number} clientY
 * @returns {import('./rules.js').Pos | null}
 */
function posFromPoint(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  const square = el?.closest?.(".square");
  if (!square || !(square instanceof HTMLElement)) return null;
  const r = Number(square.dataset.r);
  const c = Number(square.dataset.c);
  if (!Number.isInteger(r) || !Number.isInteger(c)) return null;
  return { r, c };
}

/**
 * @param {import('./rules.js').Pos} from
 * @param {import('./rules.js').Pos} to
 */
function tryMove(from, to) {
  if (!isHumanTurn()) return false;
  const move = findMove(currentMoves(), from, to);
  if (!move) return false;
  pushHistory();
  state.board = applyMove(state.board, move);
  state.selected = null;
  state.turn = opposite(state.turn);
  updateHud();
  render();
  if (!checkEnd()) scheduleCpuMove();
  return true;
}

/**
 * @param {PointerEvent} event
 * @param {import('./rules.js').Pos} pos
 * @param {HTMLElement} pieceEl
 */
function onPiecePointerDown(event, pos, pieceEl) {
  if (!isHumanTurn()) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (drag) return;

  const piece = state.board[pos.r][pos.c];
  if (!piece || piece.side !== state.turn) return;

  const moves = currentMoves();
  const canMove = moves.some((m) => samePos(m.from, pos));
  if (!canMove) {
    hintEl.textContent =
      moves.length && moves[0].captured.length > 0
        ? "Há captura obrigatória com outra peça."
        : "Essa peça não tem jogada agora.";
    return;
  }

  event.preventDefault();
  drag = {
    pointerId: event.pointerId,
    from: pos,
    pieceEl,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
  };
  pieceEl.classList.add("is-dragging");
  try {
    pieceEl.setPointerCapture(event.pointerId);
  } catch {
    /* ignore */
  }
}

/**
 * @param {PointerEvent} event
 */
function onPiecePointerMove(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  event.preventDefault();

  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if (Math.hypot(dx, dy) > 10) drag.moved = true;

  drag.pieceEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.12)`;
  drag.pieceEl.style.zIndex = "5";
}

/**
 * @param {PointerEvent} event
 */
function onPiecePointerUp(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  event.preventDefault();

  const { moved, from, pieceEl } = drag;
  pieceEl.style.pointerEvents = "none";
  const dropPos = posFromPoint(event.clientX, event.clientY);
  pieceEl.style.pointerEvents = "";
  clearDragVisual();
  drag = null;

  if (moved) {
    if (dropPos && !samePos(dropPos, from) && tryMove(from, dropPos)) {
      return;
    }
    state.selected = from;
    updateHud();
    render();
    return;
  }

  onSquareClick(from);
}

function render() {
  const moves = isHumanTurn() ? movesFromSelected() : [];
  const targets = new Map(
    moves.map((m) => [`${m.to.r},${m.to.c}`, m.captured.length > 0]),
  );
  const must = isHumanTurn() ? mustCapturePieces() : [];
  const mustKeys = new Set(must.map((p) => `${p.r},${p.c}`));

  boardEl.replaceChildren();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement("div");
      const darkSquare = (r + c) % 2 === 1;
      square.className = `square square--${darkSquare ? "dark" : "light"}`;
      square.setAttribute("role", "gridcell");
      square.dataset.r = String(r);
      square.dataset.c = String(c);

      const key = `${r},${c}`;
      if (state.selected && samePos(state.selected, { r, c })) {
        square.classList.add("is-origin");
      }
      if (targets.has(key)) {
        square.classList.add("is-target");
        if (targets.get(key)) square.classList.add("is-capture");
      }

      const cell = state.board[r][c];
      if (cell) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `piece piece--${cell.side}`;
        if (cell.king) btn.classList.add("is-king");
        if (state.selected && samePos(state.selected, { r, c })) {
          btn.classList.add("is-selected");
        }
        if (!state.selected && mustKeys.has(key) && cell.side === state.turn) {
          btn.classList.add("is-must");
        }
        btn.setAttribute(
          "aria-label",
          `${cell.side === DARK ? "Preta" : "Branca"}${cell.king ? " dama" : ""} em linha ${r + 1}, coluna ${c + 1}`,
        );
        const playable = isHumanTurn() && cell.side === state.turn;
        btn.disabled = !playable;
        if (playable) {
          btn.addEventListener("pointerdown", (e) =>
            onPiecePointerDown(e, { r, c }, btn),
          );
          btn.addEventListener("pointermove", onPiecePointerMove);
          btn.addEventListener("pointerup", onPiecePointerUp);
          btn.addEventListener("pointercancel", onPiecePointerUp);
        }
        square.appendChild(btn);
      }

      square.addEventListener("pointerup", (e) => {
        if (drag) return;
        if (!isHumanTurn()) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (e.target !== square) return;
        onSquareClick({ r, c });
      });
      boardEl.appendChild(square);
    }
  }
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode === "cpu" ? "cpu" : "pvp";
    setMode(mode);
  });
});

btnNew.addEventListener("click", newGame);
btnModalNew.addEventListener("click", newGame);
btnUndo.addEventListener("click", undo);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    state.selected = null;
    updateHud();
    render();
  }
});

updateModeLabels();
updateHud();
render();
