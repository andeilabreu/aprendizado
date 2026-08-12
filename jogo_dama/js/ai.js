import {
  DARK,
  LIGHT,
  SIZE,
  applyMove,
  countPieces,
  legalMoves,
  opposite,
} from "./rules.js";

/**
 * Avaliação simples do tabuleiro do ponto de vista de `side`.
 * @param {import('./rules.js').Cell[][]} board
 * @param {import('./rules.js').Side} side
 */
function evaluate(board, side) {
  const enemy = opposite(side);
  let score = 0;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = board[r][c];
      if (!cell) continue;

      const man = 100;
      const king = 175;
      let value = cell.king ? king : man;

      // Avanço rumo à promoção
      if (!cell.king) {
        value += cell.side === DARK ? r * 4 : (SIZE - 1 - r) * 4;
      }

      // Centro do tabuleiro
      if (r >= 2 && r <= 5 && c >= 2 && c <= 5) value += 6;

      score += cell.side === side ? value : -value;
    }
  }

  score += legalMoves(board, side).length * 3;
  score -= legalMoves(board, enemy).length * 3;

  const myPieces = countPieces(board, side);
  const theirPieces = countPieces(board, enemy);
  if (theirPieces === 0) score += 10000;
  if (myPieces === 0) score -= 10000;

  return score;
}

/**
 * @param {import('./rules.js').Cell[][]} board
 * @param {import('./rules.js').Side} side
 * @param {number} depth
 * @param {number} alpha
 * @param {number} beta
 * @param {import('./rules.js').Side} rootSide
 * @returns {number}
 */
function minimax(board, side, depth, alpha, beta, rootSide) {
  const moves = legalMoves(board, side);
  const myCount = countPieces(board, rootSide);
  const theirCount = countPieces(board, opposite(rootSide));

  if (depth === 0 || moves.length === 0 || myCount === 0 || theirCount === 0) {
    return evaluate(board, rootSide);
  }

  const maximizing = side === rootSide;

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const next = applyMove(board, move);
      const value = minimax(
        next,
        opposite(side),
        depth - 1,
        alpha,
        beta,
        rootSide,
      );
      best = Math.max(best, value);
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const next = applyMove(board, move);
    const value = minimax(
      next,
      opposite(side),
      depth - 1,
      alpha,
      beta,
      rootSide,
    );
    best = Math.min(best, value);
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return best;
}

/**
 * Escolhe a melhor jogada para `side`.
 * @param {import('./rules.js').Cell[][]} board
 * @param {import('./rules.js').Side} side
 * @param {number} [depth]
 * @returns {import('./rules.js').Move | null}
 */
export function chooseMove(board, side, depth = 3) {
  const moves = legalMoves(board, side);
  if (!moves.length) return null;

  /** @type {import('./rules.js').Move[]} */
  let bestMoves = [];
  let bestScore = -Infinity;

  for (const move of moves) {
    const next = applyMove(board, move);
    const score = minimax(
      next,
      opposite(side),
      depth - 1,
      -Infinity,
      Infinity,
      side,
    );
    // Preferir promoções e capturas em empate
    const bonus =
      move.captured.length * 0.01 + (move.promotes ? 0.02 : 0) + Math.random() * 0.001;
    const total = score + bonus;

    if (total > bestScore) {
      bestScore = total;
      bestMoves = [move];
    } else if (Math.abs(total - bestScore) < 1e-9) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? null;
}
