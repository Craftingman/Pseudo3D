// Game Settings
const gameSettings = {
  mapWidth: 300,
  mapHeight: 300,
  screenWidth: 300,
  screenHeight: 200, // Fixed typo
  playerMoveSpeed: 2,
  playerRotateSpeed: 0.02 * Math.PI,
  playerSightDistance: 250,
  playerSightAngle: 0.27 * Math.PI,
  raysCount: 100,
  zoom: 25,
  walls: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 300 },
    ],
    [
      { x: 0, y: 0 },
      { x: 300, y: 0 },
    ],
    [
      { x: 300, y: 0 },
      { x: 300, y: 300 },
    ],
    [
      { x: 0, y: 300 },
      { x: 300, y: 300 },
    ],
    [
      { x: 100, y: 150 },
      { x: 200, y: 150 },
    ],
    [
      { x: 100, y: 120 },
      { x: 100, y: 150 },
    ],
    [
      { x: 0, y: 180 },
      { x: 50, y: 180 },
    ],
    [
      { x: 0, y: 100 },
      { x: 50, y: 180 },
    ],
  ],
};

// Game State
const gameState = {
  player: {
    position: { x: 75, y: 100 },
    angle: 1.5 * Math.PI,
  },
  rays: [],
  intersections: [],
};

// Context Variables
let mapCtx;
let screenCtx;

// Utility Functions
const clearCanvas = (ctx, width, height) => ctx.clearRect(0, 0, width, height);
const calculateDistance = (A, B) =>
  Math.sqrt((A.x - B.x) ** 2 + (A.y - B.y) ** 2);
const createCanvas = (id, width, height, containerId) => {
  const canvas = document.createElement("canvas");
  canvas.id = id;
  canvas.className = "screen";
  canvas.width = width;
  canvas.height = height;
  document.querySelector(containerId).appendChild(canvas);
  return canvas.getContext("2d");
};

// Drawing Functions
function drawCircle(ctx, { x, y }, radius, color = "black", lineWidth = 1) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawLine(ctx, start, end, color = "black", lineWidth = 2) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

// Game Logic Functions
function generateRays() {
  gameState.rays = [];
  const { x, y } = gameState.player.position;
  const angleDelta = gameSettings.playerSightAngle / gameSettings.raysCount;
  const startAngle = gameState.player.angle - gameSettings.playerSightAngle / 2;

  for (let i = 0; i < gameSettings.raysCount; i++) {
    const angle = startAngle + i * angleDelta;
    const endX = x + gameSettings.playerSightDistance * Math.cos(angle);
    const endY = y - gameSettings.playerSightDistance * Math.sin(angle);

    gameState.rays.push([
      { x, y },
      { x: endX, y: endY },
    ]);
  }
}

function findIntersections() {
  gameState.intersections = [];

  gameState.rays.forEach((ray) => {
    const intersections = gameSettings.walls
      .map((wall) => getIntersectionPoint(wall, ray))
      .filter(Boolean);

    if (intersections.length > 0) {
      const closest = intersections.reduce((prev, curr) =>
        curr.r < prev.r ? curr : prev
      );
      gameState.intersections.push(closest);
    } else {
      gameState.intersections.push(null);
    }
  });
}

function getIntersectionPoint([A, B], [C, D]) {
  const denominator = (D.x - C.x) * (B.y - A.y) - (B.x - A.x) * (D.y - C.y);
  const r =
    ((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / denominator;
  const s =
    ((A.x - C.x) * (D.y - C.y) - (D.x - C.x) * (A.y - C.y)) / denominator;

  if (r >= 0 && r <= 1 && s >= 0 && s <= 1) {
    return { x: s * (B.x - A.x) + A.x, y: s * (B.y - A.y) + A.y, r };
  }

  return null;
}

// Drawing Functions for Game Elements
function drawGameMap() {
  drawWalls();
  drawPlayer();
  drawRays();
  drawIntersections();
}

function drawPlayer() {
  drawCircle(mapCtx, gameState.player.position, 5);
}

function drawWalls() {
  gameSettings.walls.forEach((wall) => drawLine(mapCtx, wall[0], wall[1]));
}

function drawRays() {
  gameState.rays.forEach((ray) => drawLine(mapCtx, ray[0], ray[1], "grey"));
}

function drawIntersections() {
  gameState.intersections.forEach((intersection) => {
    if (intersection) {
      drawCircle(mapCtx, intersection, 2, "red");
    }
  });
}

// 3D View Rendering
function draw3DFrame() {
  const rectWidth = gameSettings.screenWidth / gameSettings.raysCount;

  gameState.intersections.forEach((intersection, i) => {
    if (intersection) {
      const dist = calculateDistance(gameState.player.position, intersection);
      const distCoef = 1 / (dist / gameSettings.zoom);
      const rectHeight = gameSettings.screenHeight * distCoef;
      const y = (gameSettings.screenHeight - rectHeight) / 2;

      screenCtx.fillStyle = `rgb(${255 * distCoef}, ${255 * distCoef}, ${
        255 * distCoef
      })`;
      screenCtx.fillRect(i * rectWidth, y, rectWidth, rectHeight);
    }
  });
}

function draw3DBackground() {
  const grad = screenCtx.createLinearGradient(
    0,
    0,
    0,
    gameSettings.screenHeight
  );
  grad.addColorStop(0, "rgb(200,200,200)");
  grad.addColorStop(0.5, "black");
  grad.addColorStop(1, "rgb(200,200,200)");
  screenCtx.fillStyle = grad;
  screenCtx.fillRect(0, 0, gameSettings.screenWidth, gameSettings.screenHeight);
}

// Initialization Functions
function initMapScreen() {
  mapCtx = createCanvas(
    "mapScreen",
    gameSettings.mapWidth,
    gameSettings.mapHeight,
    "#mapScreenContainer"
  );
}

function initMainScreen() {
  screenCtx = createCanvas(
    "mainScreen",
    gameSettings.screenWidth,
    gameSettings.screenHeight,
    "#mainScreenContainer"
  );
}

function updateFrame() {
  clearCanvas(mapCtx, gameSettings.mapWidth, gameSettings.mapHeight);
  generateRays();
  findIntersections();
  drawGameMap();

  clearCanvas(screenCtx, gameSettings.screenWidth, gameSettings.screenHeight);
  draw3DBackground();
  draw3DFrame();
}

function initControls() {
  window.addEventListener("keydown", handlePlayerMovement);
}

function handlePlayerMovement(e) {
  switch (e.code) {
    case "ArrowUp":
      gameState.player.position.x +=
        gameSettings.playerMoveSpeed * Math.cos(gameState.player.angle);
      gameState.player.position.y -=
        gameSettings.playerMoveSpeed * Math.sin(gameState.player.angle);
      break;
    case "ArrowDown":
      gameState.player.position.x -=
        gameSettings.playerMoveSpeed * Math.cos(gameState.player.angle);
      gameState.player.position.y +=
        gameSettings.playerMoveSpeed * Math.sin(gameState.player.angle);
      break;
    case "ArrowLeft":
      gameState.player.angle -= gameSettings.playerRotateSpeed;
      break;
    case "ArrowRight":
      gameState.player.angle += gameSettings.playerRotateSpeed;
      break;
  }
}

// Main Loop
function startGameLoop() {
  setInterval(updateFrame, 30);
}

// Game Initialization
function init() {
  initMapScreen();
  initMainScreen();
  initControls();
  startGameLoop();
}

init();
