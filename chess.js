// ===== CHESS ENGINE =====

const CHESS_PIECES = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟'
};

let chessBoard = [];
let chessSelected = null;
let chessPossible = [];
let chessTurn = 'w';
let chessLastMove = null;
let chessPlayerScore = 0;
let chessAiScore = 0;
let chessEnPassant = null;
let chessCastling = { wK:true, wQR:true, wKR:true, bK:true, bQR:true, bKR:true };
let chessPlayerCaptured = [];
let chessAiCaptured = [];

const PIECE_VALUE = { P:1, N:3, B:3, R:5, Q:9, K:0 };

function initChess() {
  chessBoard = [
    ['bR','bN','bB','bQ','bK','bB','bN','bR'],
    ['bP','bP','bP','bP','bP','bP','bP','bP'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['wP','wP','wP','wP','wP','wP','wP','wP'],
    ['wR','wN','wB','wQ','wK','wB','wN','wR']
  ];
  chessSelected = null;
  chessPossible = [];
  chessTurn = 'w';
  chessLastMove = null;
  chessEnPassant = null;
  chessCastling = { wK:true, wQR:true, wKR:true, bK:true, bQR:true, bKR:true };
  chessPlayerCaptured = [];
  chessAiCaptured = [];
}

function renderChess() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell ' + ((r+c)%2===0 ? 'light' : 'dark');
      cell.dataset.r = r; cell.dataset.c = c;

      if (chessLastMove) {
        const [fr,fc,tr,tc] = chessLastMove;
        if ((r===fr&&c===fc)||(r===tr&&c===tc)) cell.classList.add('last-move');
      }
      if (chessSelected && chessSelected[0]===r && chessSelected[1]===c) cell.classList.add('selected');
      if (chessPossible.some(m=>m[0]===r&&m[1]===c)) cell.classList.add('possible');

      const piece = chessBoard[r][c];
      if (piece) {
        const span = document.createElement('span');
        span.className = 'piece';
        span.textContent = CHESS_PIECES[piece];
        span.style.color = piece[0]==='w' ? '#fffde7' : '#1a1a1a';
        cell.appendChild(span);
      }
      cell.addEventListener('click', () => chessClick(r, c));
      board.appendChild(cell);
    }
  }
  document.getElementById('player-captured').textContent = chessAiCaptured.map(p=>CHESS_PIECES['w'+p]).join('');
  document.getElementById('ai-captured').textContent = chessPlayerCaptured.map(p=>CHESS_PIECES['b'+p]).join('');
}

function chessClick(r, c) {
  if (chessTurn !== 'w') return;
  const piece = chessBoard[r][c];

  if (chessSelected) {
    const move = chessPossible.find(m=>m[0]===r&&m[1]===c);
    if (move) {
      doChessMove(chessSelected[0], chessSelected[1], r, c);
      chessSelected = null;
      chessPossible = [];
      renderChess();
      if (chessTurn === 'b') {
        setStatus('<span class="thinking">⚙️</span> AI o\'ylayapti...');
        setTimeout(chessAiMove, 500);
      }
      return;
    }
    chessSelected = null;
    chessPossible = [];
  }

  if (piece && piece[0] === 'w') {
    chessSelected = [r, c];
    chessPossible = getLegalMoves(r, c, 'w');
  }
  renderChess();
}

function doChessMove(fr, fc, tr, tc, board=chessBoard) {
  const piece = board[fr][fc];
  const captured = board[tr][tc];
  const color = piece[0];
  const type = piece[1];

  if (board === chessBoard) {
    if (captured) {
      if (color==='w') chessAiCaptured.push(captured[1]);
      else chessPlayerCaptured.push(captured[1]);
    }
    chessLastMove = [fr,fc,tr,tc];
  }

  board[tr][tc] = piece;
  board[fr][fc] = null;

  // Castling
  if (type==='K') {
    if (board===chessBoard) {
      chessCastling[color+'K'] = false;
      chessCastling[color+'QR'] = false;
      chessCastling[color+'KR'] = false;
    }
    if (tc===fc+2) { board[tr][tc-1]=board[tr][7]; board[tr][7]=null; }
    if (tc===fc-2) { board[tr][tc+1]=board[tr][0]; board[tr][0]=null; }
  }
  if (type==='R') {
    if (board===chessBoard) {
      if (fr===7&&fc===0) chessCastling['wQR']=false;
      if (fr===7&&fc===7) chessCastling['wKR']=false;
      if (fr===0&&fc===0) chessCastling['bQR']=false;
      if (fr===0&&fc===7) chessCastling['bKR']=false;
    }
  }

  // En passant
  if (type==='P' && fc!==tc && !captured) {
    board[fr][tc] = null;
  }
  if (type==='P' && Math.abs(tr-fr)===2) {
    if (board===chessBoard) chessEnPassant = [fr+(tr-fr)/2, fc];
  } else {
    if (board===chessBoard) chessEnPassant = null;
  }

  // Promotion
  if (type==='P' && (tr===0||tr===7)) {
    board[tr][tc] = color+'Q';
  }

  if (board===chessBoard) {
    chessTurn = color==='w' ? 'b' : 'w';
    checkChessStatus();
  }
  return captured;
}

function getLegalMoves(r, c, color, board=chessBoard) {
  const raw = getRawMoves(r, c, color, board);
  return raw.filter(([tr,tc]) => {
    const copy = board.map(row=>[...row]);
    doMoveCopy(r,c,tr,tc,copy);
    return !isInCheck(color, copy);
  });
}

function doMoveCopy(fr,fc,tr,tc,board) {
  const piece = board[fr][fc];
  const type = piece[1];
  board[tr][tc] = piece;
  board[fr][fc] = null;
  if (type==='K') {
    if (tc===fc+2) { board[tr][tc-1]=board[tr][7]; board[tr][7]=null; }
    if (tc===fc-2) { board[tr][tc+1]=board[tr][0]; board[tr][0]=null; }
  }
  if (type==='P' && fc!==tc && !board[tr][tc]) board[fr][tc]=null;
  if (type==='P' && (tr===0||tr===7)) board[tr][tc]=piece[0]+'Q';
}

function getRawMoves(r, c, color, board=chessBoard) {
  const piece = board[r][c];
  if (!piece || piece[0]!==color) return [];
  const type = piece[1];
  const moves = [];
  const opp = color==='w'?'b':'w';
  const add = (tr,tc) => {
    if (tr<0||tr>7||tc<0||tc>7) return false;
    const t = board[tr][tc];
    if (t && t[0]===color) return false;
    moves.push([tr,tc]);
    return !t;
  };
  const slide = (dr,dc) => { let nr=r+dr,nc=c+dc; while(add(nr,nc)){nr+=dr;nc+=dc;} };

  if (type==='P') {
    const dir = color==='w'?-1:1;
    const start = color==='w'?6:1;
    if (!board[r+dir]?.[c]) {
      moves.push([r+dir,c]);
      if (r===start && !board[r+2*dir]?.[c]) moves.push([r+2*dir,c]);
    }
    for (const dc of [-1,1]) {
      const tc=c+dc, tr=r+dir;
      if (tc>=0&&tc<8&&tr>=0&&tr<8) {
        if (board[tr][tc]?.[0]===opp) moves.push([tr,tc]);
        if (chessEnPassant && board===chessBoard && chessEnPassant[0]===tr && chessEnPassant[1]===tc) moves.push([tr,tc]);
      }
    }
  }
  if (type==='N') { for(const[dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r+dr,c+dc); }
  if (type==='B'||type==='Q') { for(const[dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr,dc); }
  if (type==='R'||type==='Q') { for(const[dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); }
  if (type==='K') {
    for(const[dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(r+dr,c+dc);
    // Castling
    if (board===chessBoard) {
      const row = color==='w'?7:0;
      if (r===row && c===4) {
        if (chessCastling[color+'K'] && chessCastling[color+'KR'] && !board[row][5] && !board[row][6]) moves.push([row,6]);
        if (chessCastling[color+'K'] && chessCastling[color+'QR'] && !board[row][3] && !board[row][2] && !board[row][1]) moves.push([row,2]);
      }
    }
  }
  return moves;
}

function isInCheck(color, board=chessBoard) {
  let kr=-1, kc=-1;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c]===color+'K'){kr=r;kc=c;}
  if(kr<0) return true;
  const opp=color==='w'?'b':'w';
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    if(board[r][c]?.[0]===opp) {
      const raw=getRawMoves(r,c,opp,board);
      if(raw.some(([tr,tc])=>tr===kr&&tc===kc)) return true;
    }
  }
  return false;
}

function checkChessStatus() {
  const color = chessTurn;
  const allMoves = [];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    if(chessBoard[r][c]?.[0]===color) allMoves.push(...getLegalMoves(r,c,color));
  }
  if (allMoves.length===0) {
    if (isInCheck(color)) {
      const winner = color==='w'?'AI':'Siz';
      if (color==='w') chessAiScore++; else chessPlayerScore++;
      updateScores();
      setTimeout(()=>showModal('🏆', winner+' g\'alaba qildi!', 'Shoh mat!'), 300);
    } else {
      setTimeout(()=>showModal('🤝', 'Pat!', 'Hech kim yutmadi.'), 300);
    }
  } else {
    const inCheck = isInCheck(color);
    document.getElementById('turn-info').textContent = color==='w' ? 'Sizning navbatingiz' : 'AI navbati';
    setStatus(inCheck ? '⚠️ Shoh ostida!' : (color==='w'?'Sizning navbatingiz':'AI o\'ylayapti...'));
  }
}

// Simple Minimax AI
function chessAiMove() {
  const moves = [];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    if(chessBoard[r][c]?.[0]==='b') {
      getLegalMoves(r,c,'b').forEach(([tr,tc])=>moves.push([r,c,tr,tc]));
    }
  }
  if(!moves.length) return;
  let best=null, bestVal=-Infinity;
  for(const [fr,fc,tr,tc] of moves) {
    const copy=chessBoard.map(row=>[...row]);
    doMoveCopy(fr,fc,tr,tc,copy);
    const val = evaluateChess(copy);
    if(val>bestVal){bestVal=val;best=[fr,fc,tr,tc];}
  }
  if(best) {
    doChessMove(best[0],best[1],best[2],best[3]);
    renderChess();
    if(chessTurn==='w') setStatus('Sizning navbatingiz');
  }
}

function evaluateChess(board) {
  let score=0;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    const p=board[r][c];
    if(!p) continue;
    const v=PIECE_VALUE[p[1]]||0;
    score += p[0]==='b'?v:-v;
  }
  return score + Math.random()*0.1;
}
