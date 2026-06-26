const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("[data-score]");
const bestEl = document.querySelector("[data-best]");
const statusEl = document.querySelector("[data-status]");
const startBtn = document.querySelector("[data-start]");
const pauseBtn = document.querySelector("[data-pause]");
const resetBtn = document.querySelector("[data-reset]");
const directionButtons = document.querySelectorAll("[data-dir]");

const gridSize = 21;
const cellSize = canvas.width / gridSize;
const tickMs = 135;
const scoreStep = 10;
const storageKey = "snake-best-score";

const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const keyMap = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore;
let timerId;
let state;

function readBestScore() {
  const stored = Number(localStorage.getItem(storageKey));
  return Number.isFinite(stored) ? stored : 0;
}

function writeBestScore(value) {
  localStorage.setItem(storageKey, String(value));
}

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = directions.right;
  nextDirection = directions.right;
  score = 0;
  state = "ready";
  food = createFood();
  stopTimer();
  updateHud("点击开始进入游戏");
  draw();
}

function startGame() {
  if (state === "running") return;
  if (state === "over") resetGame();
  state = "running";
  updateHud("游戏进行中");
  stopTimer();
  timerId = window.setInterval(step, tickMs);
}

function togglePause() {
  if (state === "ready") return;

  if (state === "running") {
    state = "paused";
    stopTimer();
    updateHud("已暂停");
    return;
  }

  if (state === "paused") {
    startGame();
  }
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function updateHud(message) {
  scoreEl.textContent = score;
  bestEl.textContent = bestScore;
  statusEl.textContent = message;
  startBtn.textContent = state === "over" ? "再来一局" : "开始";
  pauseBtn.textContent = state === "paused" ? "继续" : "暂停";
}

function createFood() {
  const openCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!snake.some((part) => part.x === x && part.y === y)) {
        openCells.push({ x, y });
      }
    }
  }

  return openCells[Math.floor(Math.random() * openCells.length)];
}

function changeDirection(name) {
  const requested = directions[name];
  if (!requested) return;

  const isReverse = requested.x + direction.x === 0 && requested.y + direction.y === 0;
  if (isReverse) return;

  nextDirection = requested;
}

function step() {
  direction = nextDirection;
  const head = snake[0];
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y };

  if (isWallHit(nextHead) || isSelfHit(nextHead)) {
    endGame();
    return;
  }

  snake.unshift(nextHead);

  if (nextHead.x === food.x && nextHead.y === food.y) {
    score += scoreStep;
    if (score > bestScore) {
      bestScore = score;
      writeBestScore(bestScore);
    }
    food = createFood();
  } else {
    snake.pop();
  }

  updateHud("游戏进行中");
  draw();
}

function isWallHit(point) {
  return point.x < 0 || point.x >= gridSize || point.y < 0 || point.y >= gridSize;
}

function isSelfHit(point) {
  return snake.some((part) => part.x === point.x && part.y === point.y);
}

function endGame() {
  state = "over";
  stopTimer();
  updateHud("游戏结束，点击再来一局");
  draw();
}

function draw() {
  drawBoard();
  drawFood();
  drawSnake();

  if (state === "ready" || state === "paused" || state === "over") {
    drawOverlay();
  }
}

function drawBoard() {
  ctx.fillStyle = "#081624";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.055)";
  ctx.lineWidth = 1;

  for (let index = 0; index <= gridSize; index += 1) {
    const position = Math.round(index * cellSize) + 0.5;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((part, index) => {
    const inset = index === 0 ? 3 : 4;
    const x = part.x * cellSize + inset;
    const y = part.y * cellSize + inset;
    const size = cellSize - inset * 2;

    ctx.fillStyle = index === 0 ? "#38d973" : "#149b51";
    roundRect(x, y, size, size, 8);
    ctx.fill();

    if (index === 0) {
      ctx.fillStyle = "#06130c";
      const eyeSize = 3.5;
      ctx.beginPath();
      ctx.arc(x + size * 0.34, y + size * 0.36, eyeSize, 0, Math.PI * 2);
      ctx.arc(x + size * 0.66, y + size * 0.36, eyeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawFood() {
  const centerX = food.x * cellSize + cellSize / 2;
  const centerY = food.y * cellSize + cellSize / 2;
  const radius = cellSize * 0.34;

  ctx.fillStyle = "#ff6b6b";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.28, centerY - radius * 0.3, radius * 0.26, 0, Math.PI * 2);
  ctx.fill();
}

function drawOverlay() {
  const message = {
    ready: "点击开始",
    paused: "已暂停",
    over: "游戏结束",
  }[state];

  ctx.fillStyle = "rgba(5, 10, 18, 0.58)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f7fbff";
  ctx.font = "700 42px Microsoft YaHei, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);
resetBtn.addEventListener("click", resetGame);

directionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    changeDirection(button.dataset.dir);
    if (state === "ready") startGame();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
    return;
  }

  const next = keyMap[event.code];
  if (next) {
    event.preventDefault();
    changeDirection(next);
    if (state === "ready") startGame();
  }
});

bestScore = readBestScore();
resetGame();
