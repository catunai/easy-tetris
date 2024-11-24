const backgroundColor = "#34495e";  // Updated background color
const wallsColor = "#2c3e50"    // Updated walls color
const brickColor = "#333";

const h = 22;
const w = 12;

const grid = document.querySelector("#gameGrid");
let score = 0;
let level = 1;
const scoreElement = document.querySelector("#score");
const levelElement = document.querySelector("#level");
const startButton = document.querySelector("#startButton");

let gameOver = false;
let dropInterval;
let brick;

// Initialize Grid Cells
for (let i = 0; i < h * w; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  grid.appendChild(cell);
}



// Calculate drop speed based on level (500ms at level 1, decreasing to ~100ms at level 9)
function getDropSpeed() {
  return Math.max(100, 500 - ((level - 1) * 50));
}

function updateLevel() {
  // Increase level every 1000 points, max level is 9
  const newLevel = Math.min(9, Math.floor(score / 1000) + 1);
  if (newLevel !== level) {
    level = newLevel;
    levelElement.textContent = level;
    // Update drop speed when level changes
    clearInterval(dropInterval);
    dropInterval = setInterval(() => {
      brick = autoDrop(brick);
    }, getDropSpeed());
  }
}

class Brick {
  constructor(s, c, color, type) {
    this.s = s; // shape: list if arrays of coordinates of cells
    this.c = c; // center coordinates
    this.color = color; // color
    this.type = type;  // piece type (i, j, l, o, s, t, z)
  }
}

const shapes = [
  {
    shape: [
      {x: 0, y: -2},
      {x: 0, y: -1},
      {x: 0, y: 0},
      {x: 0, y: 1}
    ],
    type: 'i'
  },
  {
    shape: [
      {x: 0, y: 0},
      {x: 0, y: -1},
      {x: 1, y: -1},
      {x: -1, y: 0}
    ],
    type: 'j'
  },
  {
    shape: [
      {x: 0, y: 0},
      {x: 0, y: -1},
      {x: -1, y: -1},
      {x: 1, y: 0}
    ],
    type: 'l'
  },
  {
    shape: [
      {x: 0, y: 0},
      {x: 0, y: -1},
      {x: 1, y: -1},
      {x: 0, y: 1}
    ],
    type: 't'
  },
  {
    shape: [
      {x: 0, y: 0},
      {x: 0, y: -1},
      {x: -1, y: -1},
      {x: 0, y: 1}
    ],
    type: 's'
  },
  {
    shape: [
      {x: 0, y: 0},
      {x: 0, y: -1},
      {x: 1, y: -1},
      {x: 1, y: 0}
    ],
    type: 'o'
  },
  {
    shape: [
      {x: 0, y: 0},
      {x: -1, y: 0},
      {x: 1, y: 0},
      {x: 0, y: -1}
    ],
    type: 'z'
  }
]

function updateScore(lines) {
  const points = [0, 100, 300, 500, 800]; // Points for 0, 1, 2, 3, 4 lines
  score += points[lines];
  scoreElement.textContent = score;
  updateLevel(); // Check if level should increase
}

function coordinatesToPosition(c) {
  return c.y * w + c.x;
}

function positionToCoordinates(p) {
  return {x: p % w, y: (p - p % w) / w};
}

function drawPosition(p, color, pieceType = null) {
  if (p >= 0) {
    const cell = grid.children[p];
    cell.style.backgroundColor = color;

    // Remove all piece-type classes
    cell.classList.remove('piece-i', 'piece-j', 'piece-l', 'piece-o', 'piece-s', 'piece-t', 'piece-z');

    // Add the new piece-type class if provided
    if (pieceType) {
      cell.classList.add(`piece-${pieceType}`);
    }
  }
}

function brickCells(brick) {
  return brick.s.map(c => ({x: c.x + brick.c.x, y: c.y + brick.c.y}));
}

function brickPositions(brick) {
  return brickCells(brick).map(c => coordinatesToPosition(c));
}

function drawBrick(brick) {
  brickPositions(brick).map(p => drawPosition(p, brick.color, brick.type));
}

function eraseBrick(brick) {
  brickPositions(brick).map(p => drawPosition(p, backgroundColor));
}

function brickOverlap(brick, walls) {
  return brickPositions(brick).some(p => walls.has(p));
}

function moveBrick(brick, v, walls) {
  if (gameOver) return 0;

  var t = 0
  eraseBrick(brick)
  brick.c.x += v.x;
  brick.c.y += v.y;
  if (brickOverlap(brick, walls)) {
    brick.c.x -= v.x;
    brick.c.y -= v.y;
    t = 1
  }
  drawBrick(brick)
  return t
}

function rotateCell(c, n) {
  var t = c.x;
  if (n == 1) {
    c.x = -c.y;
    c.y = t;
  } else if (n == -1) {
    c.x = c.y;
    c.y = -t;
  }
}

function rotateBrick(brick, n, walls) {
  if (gameOver) return;

  eraseBrick(brick);
  brick.s.map(c => rotateCell(c, n));
  if (brickOverlap(brick, walls)) {
    brick.s.map(c => rotateCell(c, -n));
  }
  drawBrick(brick);
}

function generateWalls() {
  const walls = new Set();

  // Add bottom wall
  for (let x = 0; x < w; x++) {
    walls.add(coordinatesToPosition({x: x, y: h - 1}));
  }

  // Add left and right walls
  for (let y = 0; y < h; y++) {
    walls.add(coordinatesToPosition({x: 0, y: y}));
    walls.add(coordinatesToPosition({x: w - 1, y: y}));
  }

  return walls;
}

const walls = generateWalls();

// Draw the walls
walls.forEach(position => drawPosition(position, wallsColor));

function endGame() {
  gameOver = true;
  clearInterval(dropInterval);
  startButton.style.display = 'block';
  document.getElementById('gameOverSound').play();
  setTimeout(() => {
    console.log(`Game Over! Final Score: ${score} - Level: ${level}`);
  }, 100);
}

function createNewBrick() {
  const randomPiece = shapes[Math.floor(Math.random() * shapes.length)];
  var c = {x: 5, y: 0};
  const newBrick = new Brick(randomPiece.shape, c, backgroundColor, randomPiece.type);

  if (brickOverlap(newBrick, walls)) {
    endGame();
    return newBrick;
  }

  return newBrick;
}

function findComplete() {
  let rowsToRemove = [];
  for (let y = 0; y < h - 1; y++) {
    let isComplete = true;
    for (let x = 1; x < w - 1; x++) {
      if (!walls.has(coordinatesToPosition({x, y}))) {
        isComplete = false;
        break;
      }
    }
    if (isComplete) {
      rowsToRemove.push(y);
    }
  }
  return rowsToRemove;
}

function removeComplete(y) {
  for (let x = 1; x < w - 1; x++) {
    walls.delete(coordinatesToPosition({x, y}));
  }

  // Move all rows above down by one
  for (let yAbove = y - 1; yAbove >= 0; yAbove--) {
    for (let x = 1; x < w - 1; x++) {
      const posAbove = coordinatesToPosition({x, y: yAbove});
      const posBelow = coordinatesToPosition({x, y: yAbove + 1});
      if (walls.has(posAbove)) {
        walls.add(posBelow);
        walls.delete(posAbove);
      }
      // Transfer the cell's style to the cell below
      const cellAbove = grid.children[posAbove];
      const cellBelow = grid.children[posBelow];
      cellBelow.className = cellAbove.className;
      cellBelow.style.backgroundColor = cellAbove.style.backgroundColor;

      // Reset the cell above
      cellAbove.className = 'cell';
      cellAbove.style.backgroundColor = backgroundColor;
    }
  }
}

function findRemoveComplete() {
  const completedLines = findComplete();
  if (completedLines.length > 0) {
    document.getElementById('lineRemoveSound').play();
    console
  }
  completedLines.forEach(y => removeComplete(y));
  updateScore(completedLines.length);
}

function autoDrop(brick) {
  if (gameOver) return brick;

  t = moveBrick(brick, {x: 0, y: 1}, walls)
  if (t === 1) {
    brickPositions(brick).forEach(position => {
      if (position > 0) {
        walls.add(position);
        const cell = grid.children[position];
        cell.classList.add(`piece-${brick.type}`);
      }
    });
    findRemoveComplete();
    return createNewBrick();
  } else {
    return brick;
  }
}

function quickDrop(brick) {
  if (gameOver) return brick;

  while (true) {
    const t = moveBrick(brick, {x: 0, y: 1}, walls);
    if (t === 1) {
      brickPositions(brick).forEach(position => {
        walls.add(position);
        const cell = grid.children[position];
        cell.classList.add(`piece-${brick.type}`);
      });
      findRemoveComplete();
      return createNewBrick();
    }
  }
}

function startGame() {
  // Reset game state
  gameOver = false;
  score = 0;
  level = 1;
  scoreElement.textContent = '0';
  levelElement.textContent = '1';

  // Clear the grid
  for (let i = 0; i < h * w; i++) {
    const cell = grid.children[i];
    cell.className = 'cell';
    cell.style.backgroundColor = backgroundColor;
  }
  
  // Redraw walls
  walls.clear();
  const newWalls = generateWalls();
  newWalls.forEach(position => {
    walls.add(position);
    drawPosition(position, wallsColor);
  });

  // Create first brick
  brick = createNewBrick();

  // Hide start button
  startButton.style.display = 'none';

  // Start the game loop
  dropInterval = setInterval(() => {
    brick = autoDrop(brick);
  }, getDropSpeed());
}

// Initialize keyboard controls
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("keydown", (event) => {
    if (gameOver) return;
    
    if (event.key === "ArrowLeft") {
      moveBrick(brick, {x: -1, y: 0}, walls)
    } else if (event.key === "ArrowRight") {
      moveBrick(brick, {x: 1, y: 0}, walls)
    } else if (event.key === "ArrowUp") {
      rotateBrick(brick, -1, walls)
    } else if (event.key === "ArrowDown") {
      moveBrick(brick, {x: 0, y: 1}, walls)
    } else if (event.key === " ") {
      brick = quickDrop(brick);
    }
  });
  
  // Add start button click handler
  startButton.addEventListener("click", startGame);
});
