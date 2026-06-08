// ===== CHECKERS ENGINE =====

let checkersBoard = [];
let checkersSelected = null;
let checkersPossible = [];
let checkersTurn = 'r'; // r=red(player), b=black(AI)
let checkersPlayerScore = 0;
let checkersAiScore = 0;
let checkersMustJump = null;

function initCheckers() {
  checkersBoard = Array(8).fill(null).map(()=>Array(8).fill(null));
  for(let r=0;r<3;r++) for(let c=0;c<8;c++) if((r+c)%2===1) checkersBoard[r][c]={color:'b',king:false};
  for(let r=5;r<8;r++) for(let c=0;c<8;c++) if((r+c)%2===1) checkersBoard[r][c]={color:'r',king:false};
  checkersSelected=null; checkersPossible=[]; checkersTurn='r'; checkersMustJump=null;
}

function renderCheckers() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    const cell = document.createElement('div');
    cell.className = 'cell '+((r+c)%2===0?'light':'dark');
    if(checkersSelected && checkersSelected[0]===r && checkersSelected[1]===c) cell.classList.add('selected');
    if(checkersPossible.some(m=>m[0]===r&&m[1]===c)) cell.classList.add('possible');

    const piece = checkersBoard[r][c];
    if(piece) {
      const div = document.createElement('div');
      div.className = 'checker '+(piece.color==='r'?'red':'black-c')+(piece.king?' king':'');
      div.textContent = piece.king ? '♛' : '';
      cell.appendChild(div);
    }
    cell.addEventListener('click',()=>checkersClick(r,c));
    board.appendChild(cell);
  }
}

function checkersClick(r,c) {
  if(checkersTurn!=='r') return;
  const piece = checkersBoard[r][c];

  if(checkersSelected) {
    const move = checkersPossible.find(m=>m[0]===r&&m[1]===c);
    if(move) {
      doCheckersMove(checkersSelected[0],checkersSelected[1],r,c);
      // Multi-jump
      const jumps = getCheckersMoves(r,c,'r',true);
      if(move[2] && jumps.length) { // was a jump and more jumps available
        checkersMustJump=[r,c];
        checkersSelected=[r,c];
        checkersPossible=jumps;
        renderCheckers();
        return;
      }
      checkersSelected=null; checkersPossible=[]; checkersMustJump=null;
      renderCheckers();
      if(checkersTurn==='b') {
        setStatus('<span class="thinking">⚙️</span> AI o\'ylayapti...');
        setTimeout(checkersAiMove, 600);
      }
      return;
    }
    checkersSelected=null; checkersPossible=[];
  }

  if(piece && piece.color==='r') {
    if(checkersMustJump && !(checkersMustJump[0]===r&&checkersMustJump[1]===c)) return;
    checkersSelected=[r,c];
    const hasJumps = checkersHasJumps('r');
    checkersPossible = getCheckersMoves(r,c,'r', hasJumps);
  }
  renderCheckers();
}

function checkersHasJumps(color) {
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    if(checkersBoard[r][c]?.color===color) {
      if(getCheckersMoves(r,c,color,true).length) return true;
    }
  }
  return false;
}

function getCheckersMoves(r,c,color,jumpsOnly=false) {
  const piece = checkersBoard[r][c];
  if(!piece) return [];
  const opp = color==='r'?'b':'r';
  const dirs = color==='r' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  if(piece.king) dirs.push(...(color==='r'?[[1,-1],[1,1]]:[[-1,-1],[-1,1]]));
  const moves=[];

  for(const[dr,dc] of dirs) {
    const nr=r+dr, nc=c+dc;
    if(nr<0||nr>7||nc<0||nc>7) continue;
    if(!checkersBoard[nr][nc]) {
      if(!jumpsOnly) moves.push([nr,nc,false]);
    } else if(checkersBoard[nr][nc].color===opp) {
      const jr=nr+dr, jc=nc+dc;
      if(jr>=0&&jr<8&&jc>=0&&jc<8&&!checkersBoard[jr][jc]) {
        moves.push([jr,jc,true,nr,nc]);
      }
    }
  }
  return moves;
}

function doCheckersMove(fr,fc,tr,tc) {
  const piece = checkersBoard[fr][fc];
  const move = getCheckersMoves(fr,fc,piece.color).find(m=>m[0]===tr&&m[1]===tc);
  checkersBoard[tr][tc] = piece;
  checkersBoard[fr][fc] = null;

  if(move?.[2]) { // jump
    checkersBoard[move[3]][move[4]] = null;
    const captured = 1;
    if(piece.color==='r') { checkersPlayerScore++; updateScores(); }
    else { checkersAiScore++; updateScores(); }
  }

  // King promotion
  if(piece.color==='r' && tr===0) piece.king=true;
  if(piece.color==='b' && tr===7) piece.king=true;

  checkersTurn = piece.color==='r'?'b':'r';
  checkCheckersEnd();
}

function checkCheckersEnd() {
  const rCount = countPieces('r');
  const bCount = countPieces('b');
  if(rCount===0) {
    checkersAiScore+=3; updateScores();
    setTimeout(()=>showModal('😔','AI g\'alaba qildi!','Barcha toshlaringiz olindi.'),300);
  } else if(bCount===0) {
    checkersPlayerScore+=3; updateScores();
    setTimeout(()=>showModal('🏆','Siz g\'alaba qildingiz!','Barcha AI toshlari olindi.'),300);
  } else {
    const canMove = canColorMove(checkersTurn);
    if(!canMove) {
      const winner = checkersTurn==='r'?'AI':'Siz';
      if(checkersTurn==='r'){checkersAiScore++;updateScores();}else{checkersPlayerScore++;updateScores();}
      setTimeout(()=>showModal('🏆',winner+' g\'alaba qildi!','Harakat yo\'q.'),300);
    } else {
      document.getElementById('turn-info').textContent = checkersTurn==='r'?'Sizning navbatingiz':'AI navbati';
      setStatus(checkersTurn==='r'?'Sizning navbatingiz':'AI o\'ylayapti...');
    }
  }
}

function canColorMove(color) {
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    if(checkersBoard[r][c]?.color===color) {
      if(getCheckersMoves(r,c,color).length) return true;
    }
  }
  return false;
}

function countPieces(color) {
  let n=0;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(checkersBoard[r][c]?.color===color) n++;
  return n;
}

function checkersAiMove() {
  const hasJumps = checkersHasJumps('b');
  const moves=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    if(checkersBoard[r][c]?.color==='b') {
      getCheckersMoves(r,c,'b',hasJumps).forEach(m=>moves.push([r,c,...m]));
    }
  }
  if(!moves.length) { checkersAiMove2(); return; }

  // Prefer jumps, then kings, then center
  moves.sort((a,b)=>{
    const aJump=a[4]?1:0, bJump=b[4]?1:0;
    if(aJump!==bJump) return bJump-aJump;
    const aKing=checkersBoard[a[0]][a[1]]?.king?1:0, bKing=checkersBoard[b[0]][b[1]]?.king?1:0;
    if(aKing!==bKing) return bKing-aKing;
    const aCenter=Math.abs(a[2]-3.5)+Math.abs(a[3]-3.5);
    const bCenter=Math.abs(b[2]-3.5)+Math.abs(b[3]-3.5);
    return aCenter-bCenter;
  });

  // Add some randomness
  const top = moves.slice(0, Math.min(3, moves.length));
  const pick = top[Math.floor(Math.random()*top.length)];
  doCheckersMove(pick[0],pick[1],pick[2],pick[3]);

  // Multi-jump
  if(pick[4]) {
    const moreJumps = getCheckersMoves(pick[2],pick[3],'b',true);
    if(moreJumps.length) {
      renderCheckers();
      setTimeout(()=>{
        const next=moreJumps[0];
        doCheckersMove(pick[2],pick[3],next[0],next[1]);
        renderCheckers();
      }, 500);
      return;
    }
  }
  renderCheckers();
}

function checkersAiMove2() {
  // All moves including non-jumps
  const moves=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    if(checkersBoard[r][c]?.color==='b') {
      getCheckersMoves(r,c,'b',false).forEach(m=>moves.push([r,c,...m]));
    }
  }
  if(!moves.length) return;
  const pick=moves[Math.floor(Math.random()*moves.length)];
  doCheckersMove(pick[0],pick[1],pick[2],pick[3]);
  renderCheckers();
}
