
let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let gameStarted = false;

let bgImage = new Image();
bgImage.src = 'assets/images/bg.jpg';

let characterX = 100;
let characterY = 600;
let velocityY = 0;
let isJumping = false;

let gravity = 1.5;

function drawBackground() {
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
}

function drawCharacter() {
  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.arc(characterX, characterY, 30, 0, Math.PI * 2);
  ctx.fill();
}

function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  velocityY += gravity;
  characterY += velocityY;

  if (characterY >= 600) {
    characterY = 600;
    isJumping = false;
  }

  drawCharacter();
  requestAnimationFrame(updateGame);
}

document.getElementById('start-button').addEventListener('click', () => {
  if (!gameStarted) {
    document.getElementById('ui').style.display = 'none';
    gameStarted = true;
    updateGame();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !isJumping) {
    velocityY = -25;
    isJumping = true;
  }
});
