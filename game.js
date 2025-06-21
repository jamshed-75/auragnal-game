// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.style.display = 'none';
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', restartGame);
const bgImage = new Image();
bgImage.src = 'assets/images/bg.jpg';
let player = {
x: 100,
y: 800,
width: 80,
height: 120,
frame: 0,
speedY: 0,
gravity: 1.5,
grounded: true,
spriteFrames: [],
state: 'idle',
currentSet: [],
};
const states = ['idle', 'run', 'jump', 'death'];
let collectibles = [];
let obstacles = [];
let gameRunning = false;
let score = 0;
function preloadSprites() {
states.forEach(state => {
player.spriteFrames[state] = [];
for (let i = 1; i <= 32; i++) {
const img = new Image();
img.src = assets/player/${state}/${i}.png;
player.spriteFrames[state].push(img);
}
});
player.currentSet = player.spriteFrames['idle'];
}
function startGame() {
document.getElementById('welcome-screen').style.display = 'none';
canvas.style.display = 'block';
score = 0;
gameRunning = true;
player.y = 800;
player.speedY = 0;
player.state = 'run';
player.currentSet = player.spriteFrames['run'];
spawnCollectibles();
spawnObstacles();
gameLoop();
}
function restartGame() {
document.getElementById('game-over-screen').style.display = 'none';
startGame();
}
function spawnCollectibles() {
collectibles = ['dress', 'heels', 'handbag', 'earings'].map((type, i) => {
const img = new Image();
img.src = assets/images/${type}/1.png;
return {
x: 1500 + i * 400,
y: 800,
width: 60,
height: 60,
image: img,
collected: false,
};
});
}
function spawnObstacles() {
const types = ['obstacle_cart', 'obstacle_bag', 'obstacle_hanger'];
obstacles = types.map((type, i) => {
const img = new Image();
img.src = assets/images/${type}/1.png;
return {
x: 1800 + i * 500,
y: 830,
width: 80,
height: 80,
image: img,
};
});
}
function gameLoop() {
if (!gameRunning) return;
requestAnimationFrame(gameLoop);
ctx.clearRect(0, 0, canvas.width, canvas.height);
// Background
ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
// Player
animatePlayer();
// Collectibles
collectibles.forEach(c => {
if (!c.collected) {
c.x -= 6;
ctx.drawImage(c.image, c.x, c.y, c.width, c.height);
if (isColliding(player, c)) {
c.collected = true;
score++;
playSound('collect');
}
}
});
// Obstacles
obstacles.forEach(o => {
o.x -= 6;
ctx.drawImage(o.image, o.x, o.y, o.width, o.height);
if (isColliding(player, o)) {
endGame();
}
});
// Score
document.getElementById('scoreboard').textContent = 'Score: ' + score;
// Gravity
if (!player.grounded) {
player.speedY += player.gravity;
player.y += player.speedY;
if (player.y >= 800) {
player.y = 800;
player.speedY = 0;
player.grounded = true;
player.state = 'run';
player.currentSet = player.spriteFrames['run'];
}
}
}
function animatePlayer() {
const frame = Math.floor(player.frame / 5) % 32;
ctx.drawImage(player.currentSet[frame], player.x, player.y, player.width, player.height);
player.frame++;
}
function isColliding(a, b) {
return a.x < b.x + b.width &&
a.x + a.width > b.x &&
a.y < b.y + b.height &&
a.y + a.height > b.y;
}
function endGame() {
gameRunning = false;
document.getElementById('game-over-screen').style.display = 'block';
document.getElementById('final-score').textContent = 'Your Score: ' + score;
playSound('death');
}
function playSound(name) {
const audio = new Audio(assets/sounds/${name}.wav);
audio.play();
}
// Jump
window.addEventListener('keydown', (e) => {
if (e.code === 'Space' && player.grounded && gameRunning) {
player.speedY = -25;
player.grounded = false;
player.state = 'jump';
player.currentSet = player.spriteFrames['jump'];
playSound('jump');
}
});
// Touch support
canvas.addEventListener('touchstart', () => {
if (player.grounded && gameRunning) {
player.speedY = -25;
player.grounded = false;
player.state = 'jump';
player.currentSet = player.spriteFrames['jump'];
playSound('jump');
}
});
preloadSprites();
