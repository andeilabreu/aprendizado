/** @typedef {'dark' | 'light'} Side */
/** @typedef {{ side: Side, king: boolean } | null} Cell */
/** @typedef {{ r: number, c: number }} Pos */
/** @typedef {{ from: Pos, to: Pos, captured: Pos[], promotes: boolean }} Move */

export const SIZE = 8;
export const DARK = /** @type {Side} */ ("dark");
export const LIGHT = /** @type {Side} */ ("light");

const DIRS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

/**
 * Tabuleiro inicial: pretas em cima (linhas 0–2), brancas embaixo (5–7).
 * Casas escuras jogáveis: (r + c) % 2 === 1.
 * @returns {Cell[][]}
 */
export function createBoard() {
  /** @type {Cell[][]} */
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 0) continue;
      if (r < 3) board[r][c] = { side: DARK, king: false };
      if (r > 4) board[r][c] = { side: LIGHT, king: false };
    }
  }

  return board;
}

/** @param {Pos} a @param {Pos} b */
export function samePos(a, b) {
  return a.r === b.r && a.c === b.c;
}

/** @param {number} r @param {number} c */
export function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

/** @param {Cell[][]} board @param {Side} side */
export function countPieces(board, side) {
  let n = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell?.side === side) n++;
    }
  }
  return n;
}

/** @param {Cell[][]} board */
export function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

/**
 * Direções de movimento simples (sem captura) para peões.
 * Pretas descem (+r), brancas sobem (−r).
 * @param {Side} side
 */
function manMoveDirs(side) {
  return side === DARK
    ? [
        [1, -1],
        [1, 1],
      ]
    : [
        [-1, -1],
        [-1, 1],
      ];
}

/**
 * @param {Cell[][]} board
 * @param {Pos} from
 * @param {Pos[]} alreadyCaptured
 * @returns {Move[]}
 */
function captureSequencesFrom(board, from, alreadyCaptured = []) {
  const piece = board[from.r][from.c];
  if (!piece) return [];

  /** @type {Move[]} */
  const results = [];

  if (piece.king) {
    for (const [dr, dc] of DIRS) {
      let r = from.r + dr;
      let c = from.c + dc;
      let enemy = /** @type {Pos | null} */ (null);

      while (inBounds(r, c)) {
        const cell = board[r][c];
        if (!enemy) {
          if (!cell) {
            r += dr;
            c += dc;
            continue;
          }
          if (cell.side === piece.side) break;
          if (alreadyCaptured.some((p) => samePos(p, { r, c }))) break;
          enemy = { r, c };
          r += dr;
          c += dc;
          continue;
        }

        if (cell) break;

        const landing = { r, c };
        const nextBoard = cloneBoard(board);
        nextBoard[from.r][from.c] = null;
        nextBoard[enemy.r][enemy.c] = null;
        nextBoard[landing.r][landing.c] = { ...piece };

        const captured = [...alreadyCaptured, enemy];
        const continuations = captureSequencesFrom(nextBoard, landing, captured);

        if (continuations.length === 0) {
          results.push({
            from,
            to: landing,
            captured,
            promotes: false,
          });
        } else {
          for (const cont of continuations) {
            results.push({
              from,
              to: cont.to,
              captured: cont.captured,
              promotes: cont.promotes,
            });
          }
        }

        r += dr;
        c += dc;
      }
    }
  } else {
    for (const [dr, dc] of DIRS) {
      const mid = { r: from.r + dr, c: from.c + dc };
      const land = { r: from.r + 2 * dr, c: from.c + 2 * dc };
      if (!inBounds(land.r, land.c)) continue;

      const midPiece = board[mid.r][mid.c];
      if (!midPiece || midPiece.side === piece.side) continue;
      if (alreadyCaptured.some((p) => samePos(p, mid))) continue;
      if (board[land.r][land.c]) continue;

      const nextBoard = cloneBoard(board);
      nextBoard[from.r][from.c] = null;
      nextBoard[mid.r][mid.c] = null;

      const willPromote =
        (piece.side === DARK && land.r === SIZE - 1) ||
        (piece.side === LIGHT && land.r === 0);
      const moved = { side: piece.side, king: willPromote ? true : piece.king };
      nextBoard[land.r][land.c] = moved;

      const captured = [...alreadyCaptured, mid];

      // Em damas brasileiras, a promoção ocorre ao fim da jogada;
      // se ainda houver captura como peão, continua como peão até terminar.
      // Aqui: se promoveu no meio e ainda pode capturar como dama, usa dama.
      // Regra BR: peça vira dama só no fim do turno. Então continuamos como peão
      // se ainda não terminou — usamos o estado pré-promoção para cadeias.
      nextBoard[land.r][land.c] = { side: piece.side, king: false };
      const continuations = captureSequencesFrom(nextBoard, land, captured);

      if (continuations.length === 0) {
        results.push({
          from,
          to: land,
          captured,
          promotes: willPromote,
        });
      } else {
        for (const cont of continuations) {
          const promotes =
            cont.promotes ||
            (piece.side === DARK && cont.to.r === SIZE - 1) ||
            (piece.side === LIGHT && cont.to.r === 0);
          results.push({
            from,
            to: cont.to,
            captured: cont.captured,
            promotes,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Movimentos simples (sem captura) a partir de uma casa.
 * @param {Cell[][]} board
 * @param {Pos} from
 * @returns {Move[]}
 */
function quietMovesFrom(board, from) {
  const piece = board[from.r][from.c];
  if (!piece) return [];

  /** @type {Move[]} */
  const moves = [];

  if (piece.king) {
    for (const [dr, dc] of DIRS) {
      let r = from.r + dr;
      let c = from.c + dc;
      while (inBounds(r, c) && !board[r][c]) {
        moves.push({
          from,
          to: { r, c },
          captured: [],
          promotes: false,
        });
        r += dr;
        c += dc;
      }
    }
  } else {
    for (const [dr, dc] of manMoveDirs(piece.side)) {
      const r = from.r + dr;
      const c = from.c + dc;
      if (!inBounds(r, c) || board[r][c]) continue;
      const promotes =
        (piece.side === DARK && r === SIZE - 1) ||
        (piece.side === LIGHT && r === 0);
      moves.push({
        from,
        to: { r, c },
        captured: [],
        promotes,
      });
    }
  }

  return moves;
}

/**
 * Todas as jogadas legais do lado — captura máxima obrigatória.
 * @param {Cell[][]} board
 * @param {Side} side
 * @returns {Move[]}
 */
export function legalMoves(board, side) {
  /** @type {Move[]} */
  const captures = [];
  /** @type {Move[]} */
  const quiet = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = board[r][c];
      if (!cell || cell.side !== side) continue;
      const from = { r, c };
      captures.push(...captureSequencesFrom(board, from));
      quiet.push(...quietMovesFrom(board, from));
    }
  }

  if (captures.length === 0) return quiet;

  let max = 0;
  for (const m of captures) max = Math.max(max, m.captured.length);
  return captures.filter((m) => m.captured.length === max);
}

/**
 * @param {Cell[][]} board
 * @param {Move} move
 * @returns {Cell[][]}
 */
export function applyMove(board, move) {
  const next = cloneBoard(board);
  const piece = next[move.from.r][move.from.c];
  if (!piece) return next;

  next[move.from.r][move.from.c] = null;
  for (const cap of move.captured) {
    next[cap.r][cap.c] = null;
  }

  const king =
    piece.king ||
    move.promotes ||
    (piece.side === DARK && move.to.r === SIZE - 1) ||
    (piece.side === LIGHT && move.to.r === 0);

  next[move.to.r][move.to.c] = { side: piece.side, king };
  return next;
}

/**
 * @param {Move[]} moves
 * @param {Pos} from
 * @param {Pos} to
 */
export function findMove(moves, from, to) {
  return moves.find((m) => samePos(m.from, from) && samePos(m.to, to)) ?? null;
}

/**
 * @param {Cell[][]} board
 * @param {Side} side
 */
export function hasAnyMove(board, side) {
  return legalMoves(board, side).length > 0;
}

export function opposite(/** @type {Side} */ side) {
  return side === DARK ? LIGHT : DARK;
}
