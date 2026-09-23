export type CheckerPlayer = 'light' | 'dark';

export interface CheckerPiece {
  player: CheckerPlayer;
  king: boolean;
}

export type CheckerBoard = (CheckerPiece | null)[][];

export interface CheckerMove {
  from: { row: number; col: number };
  to: { row: number; col: number };
  capture?: { row: number; col: number };
}

export const BOARD_SIZE = 8;

export function createCheckerBoard(): CheckerBoard {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => {
      if ((row + col) % 2 === 0) return null;
      if (row < 3) return { player: 'light', king: false };
      if (row > 4) return { player: 'dark', king: false };
      return null;
    })
  );
}

function inside(row: number, col: number) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function directions(piece: CheckerPiece): number[] {
  if (piece.king) return [-1, 1];
  return [piece.player === 'light' ? 1 : -1];
}

export function movesForPiece(board: CheckerBoard, row: number, col: number): CheckerMove[] {
  const piece = board[row]?.[col];
  if (!piece) return [];

  const moves: CheckerMove[] = [];
  for (const rowStep of directions(piece)) {
    for (const colStep of [-1, 1]) {
      const nextRow = row + rowStep;
      const nextCol = col + colStep;
      if (!inside(nextRow, nextCol)) continue;
      if (!board[nextRow][nextCol]) {
        moves.push({ from: { row, col }, to: { row: nextRow, col: nextCol } });
        continue;
      }
      const jumped = board[nextRow][nextCol];
      const landingRow = row + rowStep * 2;
      const landingCol = col + colStep * 2;
      if (jumped?.player !== piece.player && inside(landingRow, landingCol) && !board[landingRow][landingCol]) {
        moves.push({ from: { row, col }, to: { row: landingRow, col: landingCol }, capture: { row: nextRow, col: nextCol } });
      }
    }
  }
  return moves;
}

/** Captures are compulsory, so a player cannot skip an available take. */
export function legalMoves(board: CheckerBoard, player: CheckerPlayer, onlyFrom?: { row: number; col: number } | null): CheckerMove[] {
  const all: CheckerMove[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (!piece || piece.player !== player) continue;
      if (onlyFrom && (onlyFrom.row !== row || onlyFrom.col !== col)) continue;
      all.push(...movesForPiece(board, row, col));
    }
  }
  const captures = all.filter((move) => move.capture);
  return captures.length ? captures : all;
}

export function applyCheckerMove(board: CheckerBoard, move: CheckerMove): CheckerBoard {
  const next = board.map((row) => [...row]);
  const piece = next[move.from.row][move.from.col];
  if (!piece) return board;
  next[move.from.row][move.from.col] = null;
  if (move.capture) next[move.capture.row][move.capture.col] = null;
  next[move.to.row][move.to.col] = {
    ...piece,
    king: piece.king || (piece.player === 'light' ? move.to.row === BOARD_SIZE - 1 : move.to.row === 0),
  };
  return next;
}

export function otherPlayer(player: CheckerPlayer): CheckerPlayer {
  return player === 'light' ? 'dark' : 'light';
}

/** How an animal plays: not strength levels, just three different temperaments. */
export type PetPlayStyle = 'eager' | 'calm' | 'chaotic';

/**
 * How each temperament reads to the player, shown before a game starts. Labels use the same
 * `{м|ж}` convention as the chatter lines — render them with the pet's own gender.
 */
export const PLAY_STYLE: Record<PetPlayStyle, { label: string; blurb: string; tricky: number }> = {
  eager: {
    label: 'Рвётся вперёд',
    blurb: 'Бьёт при первой возможности и почти не смотрит, куда встанет после. Легко подставляется.',
    tricky: 2,
  },
  calm: {
    label: 'Играет осторожно',
    blurb: 'Держится позади, старается не оставлять шашки под боем и ждёт, когда ошибёшься ты.',
    tricky: 3,
  },
  chaotic: {
    label: 'Непредсказуем{ый|ая}',
    blurb: 'Может выдать отличный ход, а следующим подарить шашку. Никогда не знаешь заранее.',
    tricky: 1,
  },
};

const STYLE: Record<PetPlayStyle, { safety: number; advance: number; jitter: number }> = {
  // Rushes forward and barely looks where it lands.
  eager: { safety: 0.4, advance: 1.4, jitter: 0.8 },
  // Hangs back, keeps out of reach, takes a piece only when it is handed one.
  calm: { safety: 2.4, advance: 0.4, jitter: 0.5 },
  // Wanders. Sometimes brilliant, mostly not.
  chaotic: { safety: 0.3, advance: 0.5, jitter: 2.4 },
};

function wouldBeTaken(board: CheckerBoard, move: CheckerMove, player: CheckerPlayer): boolean {
  const after = applyCheckerMove(board, move);
  return legalMoves(after, otherPlayer(player)).some(
    (reply) => reply.capture?.row === move.to.row && reply.capture?.col === move.to.col
  );
}

/**
 * The animal's move. Deliberately not a solver — it should feel like playing against that
 * particular pet, which means it has to be beatable and occasionally silly.
 */
export function pickPetMove(
  board: CheckerBoard,
  player: CheckerPlayer,
  style: PetPlayStyle,
  onlyFrom?: { row: number; col: number } | null
): CheckerMove | null {
  const moves = legalMoves(board, player, onlyFrom);
  if (!moves.length) return null;

  const weights = STYLE[style];
  let best: CheckerMove | null = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const piece = board[move.from.row][move.from.col];
    const forward = player === 'light' ? move.to.row - move.from.row : move.from.row - move.to.row;
    const crowns = !piece?.king && (player === 'light' ? move.to.row === BOARD_SIZE - 1 : move.to.row === 0);

    let score = forward * weights.advance + Math.random() * weights.jitter;
    if (move.capture) score += 6;
    if (crowns) score += 4;
    if (wouldBeTaken(board, move, player)) score -= 5 * weights.safety;

    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }

  return best;
}
