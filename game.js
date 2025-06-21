const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const gameTitle = document.getElementById("game-title");
const letsShopBtn = document.getElementById("lets-shop");
let gameStarted = false;
let score = 0;
let gameSpeed = 4;
let gravity = 1.4;
let frameCount = 0;
let gameOver = false;
function resizeCanvas() {
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
// Load Sounds
const sounds = {
start: new Audio("assets/sounds/start.mp3"),
collect: new Audio("assets/sounds/collect.ogg"),
jump: new Audio("assets/sounds/jump.wav"),
death: new Audio("assets/sounds/death.wav"),
message: new Audio("assets/sounds/message.wav"),
game: new Audio("assets/sounds/game.wav"),
};
sounds.game.loop = true;
// Helper: Load array of frame images
function loadFrames(path, count) {
const frames = [];
for (let i = 1; i <= count; i++) {
const img = new Image();
img.src = ${path}/${i}.png;
frames.push(img);
}
return frames;
}
// Player
class Player {
constructor() {
this.width = 64;
this.height = 64;
this.scale = 2;
this.x = 100;
this.y = canvas.height - this.height * this.scale - 40;
this.dy = 0;
this.jumpPower = -22;
this.grounded = true;
this.state = "idle";
this.animations = {
idle: loadFrames("assets/player/idle", 32),
run: loadFrames("assets/player/run", 32),
jump: loadFrames("assets/player/jump", 32),
death: loadFrames("assets/player/death", 32),
};
this.frame = 0;
this.frameSpeed = 4;
this.frameTimer = 0;
}
update() {
this.dy += gravity;
this.y += this.dy;
if (this.y + this.height * this.scale >= canvas.height - 40) {
  this.y = canvas.height - this.height * this.scale - 40;
  this.dy = 0;
  this.grounded = true;
  if (this.state === "jump") this.state = "run";
} else {
  this.grounded = false;
}

// Update animation frame
this.frameTimer++;
if (this.frameTimer >= this.frameSpeed) {
  this.frame = (this.frame + 1) % 32;
  this.frameTimer = 0;
}

}
draw() {
const img = this.animations[this.state][this.frame];
ctx.drawImage(img, this.x, this.y, this.width * this.scale, this.height * this.scale);
}
jump() {
if (this.grounded) {
this.dy = this.jumpPower;
this.state = "jump";
sounds.jump.play();
}
}
}
class GameObject {
constructor(imgSrc, width, height, speed) {
this.image = new Image();
this.image.src = imgSrc;
this.width = width;
this.height = height;
this.x = canvas.width + Math.random() * 300 + 100;
this.y = canvas.height - height - 40;
this.speed = speed;
this.markedForDeletion = false;
}
update() {
this.x -= this.speed;
if (this.x + this.width < 0) this.markedForDeletion = true;
}
draw() {
ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
}
collidesWith(player) {
return !(
player.x > this.x + this.width ||
player.x + player.width * player.scale < this.x ||
player.y > this.y + this.height ||
player.y + player.height * player.scale < this.y
);
}
}
const player = new Player();
const collectibleImages = [
"assets/images/dress.png",
"assets/images/heels.png",
"assets/images/handbag.png",
"assets/images/earings.png",
];
const obstacleImages = [
"assets/images/obstacle_cart.png",
"assets/images/obstacle_bag.png",
"assets/images/obstacle_hanger.png",
];
let collectibles = [];
let obstacles = [];
function spawnCollectible() {
const src = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
collectibles.push(new GameObject(src, 50, 50, gameSpeed));
}
function spawnObstacle() {
const src = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
obstacles.push(new GameObject(src, 60, 60, gameSpeed));
}
function drawScore() {
ctx.font = "bold 28px Cinzel Decorative, cursive";
ctx.fillStyle = "gold";
ctx.shadowColor = "black";
ctx.shadowBlur = 6;
ctx.fillText(Score: ${score}, 30, 50);
}
function drawGameOver() {
ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "gold";
ctx.font = "bold 48px Cinzel Decorative, cursive";
ctx.textAlign = "center";
ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 40);
ctx.font = "28px Cinzel Decorative, cursive";
ctx.fillText(Score: ${score}, canvas.width / 2, canvas.height / 2);
ctx.fillText("Refresh to try again", canvas.width / 2, canvas.height / 2 + 40);
}
function resetGame() {
gameStarted = true;
gameOver = false;
frameCount = 0;
score = 0;
gameSpeed = 4;
collectibles = [];
obstacles = [];
player.y = canvas.height - player.height * player.scale - 40;
player.dy = 0;
player.state = "run";
sounds.game.play();
gameTitle.style.display = "none";
startBtn.style.display = "none";
letsShopBtn.style.display = "none";
requestAnimationFrame(gameLoop);
}
function gameLoop() {
if (gameOver) {
drawGameOver();
sounds.game.pause();
sounds.death.play();
startBtn.style.display = "block";
startBtn.textContent = "Restart";
letsShopBtn.style.display = "block";
gameTitle.style.display = "block";
return;
}
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
player.update();
player.draw();
if (frameCount % 150 === 0) spawnCollectible();
if (frameCount % 250 === 0) spawnObstacle();
collectibles.forEach((item, i) => {
item.update();
item.draw();
if (item.collidesWith(player)) {
score += 10;
sounds.collect.play();
collectibles.splice(i, 1);
}
});
obstacles.forEach((obs, i) => {
obs.update();
obs.draw();
if (obs.collidesWith(player)) {
gameOver = true;
}
});
collectibles = collectibles.filter(obj => !obj.markedForDeletion);
obstacles = obstacles.filter(obj => !obj.markedForDeletion);
if (frameCount % 500 === 0) gameSpeed += 0.5;
drawScore();
frameCount++;
requestAnimationFrame(gameLoop);
}
startBtn.addEventListener("click", () => {
sounds.start.play();
resetGame();
});
function handleKey(e) {
if (e.code === "Space" || e.code === "ArrowUp") player.jump();
}
function handleTouch() {
player.jump();
}
window.addEventListener("keydown", handleKey);
window.addEventListener("touchstart", handleTouch);
const bgImg = new Image();
bgImg.src = "assets/images/bg.jpg";
