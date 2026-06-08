// ===== MAIN APP =====

let currentGame = null;

function startGame(type) {
  currentGame = type;
  document.getElementById('menu-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');

  if(type==='chess') {
    document.getElementById('game-title').textContent = '♟️ Shaxmat';
    document.getElementById('header-sub').textContent = 'Siz — Oq, AI — Qora';
    document.getElementById('player-icon').textContent = '♙';
    document.getElementById('ai-icon').textContent = '♟';
    initChess();
    chessPlayerScore = 0; chessAiScore = 0;
    updateScores();
    renderChess();
    setStatus('Sizning navbatingiz — Oq donaalar bilan boshlang');
    document.getElementById('turn-info').textContent = 'Sizning navbatingiz';
  } else {
    document.getElementById('game-title').textContent = '🔴 Shashka';
    document.getElementById('header-sub').textContent = 'Siz — Qizil, AI — Qora';
    document.getElementById('player-icon').textContent = '🔴';
    document.getElementById('ai-icon').textContent = '⚫';
    initCheckers();
    checkersPlayerScore = 0; checkersAiScore = 0;
    updateScores();
    renderCheckers();
    setStatus('Sizning navbatingiz — Qizil toshlar bilan boshlang');
    document.getElementById('turn-info').textContent = 'Sizning navbatingiz';
  }

  document.getElementById('player-captured').textContent = '';
  document.getElementById('ai-captured').textContent = '';
}

function restartGame() {
  hideModal();
  if(currentGame) startGame(currentGame);
}

function goMenu() {
  hideModal();
  currentGame = null;
  document.getElementById('game-screen').classList.remove('active');
  document.getElementById('menu-screen').classList.add('active');
  document.getElementById('game-title').textContent = '♟️ O\'yinlar';
  document.getElementById('header-sub').textContent = 'O\'yin tanlang';
}

function updateScores() {
  if(currentGame==='chess') {
    document.getElementById('player-score').textContent = chessPlayerScore;
    document.getElementById('ai-score').textContent = chessAiScore;
  } else if(currentGame==='checkers') {
    document.getElementById('player-score').textContent = checkersPlayerScore;
    document.getElementById('ai-score').textContent = checkersAiScore;
  }
}

function setStatus(msg) {
  document.getElementById('status-bar').innerHTML = msg;
}

function showModal(icon, title, msg) {
  document.getElementById('modal-icon').textContent = icon;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-msg').textContent = msg;
  document.getElementById('modal').classList.remove('hidden');
}

function hideModal() {
  document.getElementById('modal').classList.add('hidden');
}
