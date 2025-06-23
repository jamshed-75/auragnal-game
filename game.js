// FINAL game.js with full animation logic
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let isGameRunning = false;
let isMuted = false;
let backgroundMusic = new Audio("assets/sound/game.wav");
backgroundMusic.loop = true;
// Resize canvas
function resizeCanvas() {
const frame = document.getElementById("game-frame");
canvas.width = frame.clientWidth;
canvas.height = frame.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);
// LOAD IMAGES
function loadImages(names, path) {
return names.map((name) => {
const img = new Image();
img.src = ${path}/${name};
return img;
});
}
const runFrames = loadImages(["run1.png", "run2.png", "run3.png", "run4.png"], "assets/player/run");
const idleFrames = loadImages(["idle1.png", "idle2.png", "idle3.png"], "assets/player/idle");
const jumpFrames = loadImages(["jump1.png", "jump2.png", "jump3.png", "jump4.png"], "assets/player/jump");
const deathFrames = loadImages(["death1.png", "death2.png"], "assets/player/death");
// PLAYER
const player = {
x: 100,
y: 0,
width: 60,
height: 100,
dy: 0,
gravity: 1,
jumpPower: -18,
isJumping: false,
currentFrame: 0,
frameCount: 0,
state: "idle" // idle, run, jump, death
};
function drawPlayer() {
let frames;
if (player.state === "run") frames = runFrames;
else if (player.state === "jump") frames = jumpFrames;
else if (player.state === "death") frames = deathFrames;
else frames = idleFrames;
const frame = frames[player.currentFrame % frames.length];
ctx.drawImage(frame, player.x, player.y, player.width, player.height);
player.frameCount++;
if (player.frameCount % 6 === 0) {
player.currentFrame = (player.currentFrame + 1) % frames.length;
}
}
function updatePlayer() {
player.dy += player.gravity;
player.y += player.dy;
if (player.y > canvas.height - player.height) {
player.y = canvas.height - player.height;
player.dy = 0;
player.isJumping = false;
if (player.state !== "run") player.state = "run";
}
}
function jump() {
if (!player.isJumping) {
player.dy = player.jumpPower;
player.isJumping = true;
player.state = "jump";
}
}
// GAME LOOP
function drawGame() {
ctx.fillStyle = "#111";
ctx.fillRect(0, 0, canvas.width, canvas.height);
drawPlayer();
}
function gameLoop() {
if (!isGameRunning) return;
drawGame();
updatePlayer();
requestAnimationFrame(gameLoop);
}
// EVENT LISTENERS
document.getElementById("startBtn").addEventListener("click", () => {
isGameRunning = true;
backgroundMusic.play().catch(() => {});
player.state = "run";
requestAnimationFrame(gameLoop);
});
document.getElementById("muteBtn").addEventListener("click", () => {
isMuted = !isMuted;
backgroundMusic.muted = isMuted;
document.getElementById("muteBtn").textContent = isMuted ? "🔇" : "🔊";
});
document.getElementById("lets-shop").addEventListener("click", () => {
window.location.href = "https://auragnal.com";
});
document.addEventListener("keydown", (e) => {
if (e.code === "Space") {
jump();
}
});
