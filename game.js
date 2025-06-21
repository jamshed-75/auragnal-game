const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const bg = new Image();
bg.src = 'assets/bg.png';

const player = new Image();
player.src = 'assets/player.png';

let playerX = 50, playerY = 600;

bg.onload = () => {
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(player, playerX, playerY, 100, 150);
};